from __future__ import annotations

import json
import re
import threading
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


DEMO_TODAY = date(2026, 5, 3)
DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_WRITE_LOCK = threading.Lock()
OBIE_AISP_BASE = "/obie/open-banking/v4.0/aisp"
OBIE_PISP_BASE = "/obie/open-banking/v4.0/pisp"

app = FastAPI(title="External Mock Bank API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class MockPaymentRequest(BaseModel):
    userId: str = "demo-user-001"
    debtorAccountId: str
    payee: str | None = None
    creditorName: str | None = None
    amount: float
    currency: str = "SGD"
    dueDate: str | None = None
    scheduledDate: str | None = None
    remittanceInformation: str | None = None
    reference: str | None = None
    controlParameters: dict[str, Any] | None = None


def _load_json(filename: str) -> list[dict[str, Any]]:
    with (DATA_DIR / filename).open("r", encoding="utf-8") as f:
        return json.load(f)


def _write_json_atomic(filename: str, data: list[dict[str, Any]]) -> None:
    path = DATA_DIR / filename
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    with temp_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    temp_path.replace(path)


def _slug(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")


def _stable_digits(value: str, width: int = 6) -> str:
    total = sum((index + 1) * ord(char) for index, char in enumerate(value))
    return str(total % (10**width)).zfill(width)


def _demo_datetime(value: str | date | None = None) -> str:
    if value is None:
        value = DEMO_TODAY
    if isinstance(value, str):
        value = date.fromisoformat(value)
    return datetime(value.year, value.month, value.day, 9, 0, tzinfo=timezone.utc).isoformat()


def _account_scheme(account: dict[str, Any]) -> dict[str, str]:
    suffix = re.sub(r"\D", "", account["accountId"])[-4:] or "0001"
    return {
        "SchemeName": "UK.OBIE.SortCodeAccountNumber",
        "Identification": f"0808001234{suffix.zfill(4)}",
        "Name": "Demo User",
        "SecondaryIdentification": suffix.zfill(4),
    }


def _to_ob_balance(account: dict[str, Any]) -> dict[str, Any]:
    amount = float(account.get("availableBalance", account.get("balance", 0)))
    return {
        "AccountId": account["accountId"],
        "CreditDebitIndicator": "Credit" if amount >= 0 else "Debit",
        "Type": "InterimAvailable",
        "DateTime": _demo_datetime(),
        "Amount": {
            "Amount": f"{abs(amount):.2f}",
            "Currency": account.get("currency", "SGD"),
        },
    }


def _to_ob_account(account: dict[str, Any]) -> dict[str, Any]:
    type_map = {
        "current": "CurrentAccount",
        "savings": "Savings",
        "wallet": "Other",
        "investment_cash": "Other",
    }
    return {
        "AccountId": account["accountId"],
        "Status": "Enabled",
        "Currency": account.get("currency", "SGD"),
        "AccountCategory": "Personal",
        "AccountTypeCode": type_map.get(account.get("type"), "CurrentAccount"),
        "Nickname": account.get("name", account["accountId"]),
        "Account": [_account_scheme(account)],
        "Servicer": {
            "SchemeName": "UK.OBIE.BICFI",
            "Identification": "HSBCSGSG",
        },
        "DemoEnrichment": {
            "UserId": account.get("userId"),
            "Balance": _to_ob_balance(account),
        },
    }


def _to_ob_transaction(transaction: dict[str, Any], running_balance: float | None = None) -> dict[str, Any]:
    tx_date = date.fromisoformat(transaction["date"])
    amount = float(transaction.get("amount", 0))
    direction = "Debit" if transaction.get("direction") == "debit" else "Credit"
    balance_amount = running_balance if running_balance is not None else 0.0
    return {
        "AccountId": transaction["accountId"],
        "TransactionId": transaction["id"],
        "TransactionReference": transaction["id"].upper(),
        "CreditDebitIndicator": direction,
        "Status": "Booked",
        "BookingDateTime": _demo_datetime(tx_date),
        "ValueDateTime": _demo_datetime(tx_date),
        "TransactionInformation": transaction.get("description", transaction.get("merchant", "")),
        "Amount": {
            "Amount": f"{amount:.2f}",
            "Currency": transaction.get("currency", "SGD"),
        },
        "MerchantDetails": {
            "MerchantName": transaction.get("merchant", "Unknown Merchant"),
        },
        "BankTransactionCode": {
            "Code": "PMNT",
            "SubCode": "ICDT" if direction == "Debit" else "RCDT",
        },
        "ProprietaryBankTransactionCode": {
            "Code": "CARD" if direction == "Debit" else "TRANSFER",
            "Issuer": "External Demo ASPSP",
        },
        "Balance": {
            "CreditDebitIndicator": "Credit" if balance_amount >= 0 else "Debit",
            "Type": "InterimBooked",
            "Amount": {
                "Amount": f"{abs(balance_amount):.2f}",
                "Currency": transaction.get("currency", "SGD"),
            },
        },
        "DemoEnrichment": {
            "UserId": transaction.get("userId"),
            "MerchantId": transaction.get("merchantId"),
            "Category": transaction.get("category", "Uncategorized"),
            "RecurringCandidate": transaction.get("category") in {
                "Subscription",
                "Entertainment",
                "Software",
                "Telecom",
                "Utilities",
                "Insurance",
            },
        },
    }


def _find_user_account(accounts: list[dict[str, Any]], user_id: str, account_id: str) -> dict[str, Any]:
    for account in accounts:
        if account.get("userId") == user_id and account.get("accountId") == account_id:
            return account
    raise ValueError("Payer account was not found for this user.")


def _validate_amount(amount: Any) -> float:
    try:
        parsed = round(float(amount), 2)
    except (TypeError, ValueError) as exc:
        raise ValueError("Payment amount must be a valid number.") from exc
    if parsed <= 0:
        raise ValueError("Payment amount must be greater than zero.")
    return parsed


def _validate_mock_payment_request(
    user_id: str,
    debtor_account_id: str,
    payee: str,
    amount: Any,
    currency: str,
) -> tuple[dict[str, Any], float]:
    if not debtor_account_id:
        raise ValueError("Payer account is required.")
    if not str(payee or "").strip():
        raise ValueError("Payee is required.")
    parsed_amount = _validate_amount(amount)
    accounts = _load_json("mockAccounts.json")
    account = _find_user_account(accounts, user_id, debtor_account_id)
    account_currency = account.get("currency", "SGD")
    if currency and currency != account_currency:
        raise ValueError(f"Payment currency must match payer account currency {account_currency}.")
    available = float(account.get("availableBalance", account.get("balance", 0)))
    if parsed_amount > available:
        raise ValueError("Insufficient available balance for this mock payment.")
    return account, parsed_amount


def _payment_account_summary(account: dict[str, Any]) -> dict[str, Any]:
    return {
        "accountId": account.get("accountId"),
        "name": account.get("name"),
        "type": account.get("type"),
        "currency": account.get("currency", "SGD"),
        "balance": account.get("balance"),
        "availableBalance": account.get("availableBalance"),
    }


def _payee(req: MockPaymentRequest) -> str:
    return str(req.payee or req.creditorName or "").strip()


def _payment_error(exc: ValueError) -> HTTPException:
    return HTTPException(status_code=400, detail=str(exc))


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get(f"{OBIE_AISP_BASE}/accounts")
@app.get("/open-banking/v4.0/aisp/accounts", include_in_schema=False)
async def accounts(userId: str = Query("demo-user-001")) -> dict[str, Any]:
    items = [_to_ob_account(account) for account in _load_json("mockAccounts.json") if account.get("userId") == userId]
    return {
        "Data": {"Account": items},
        "Links": {"Self": f"{OBIE_AISP_BASE}/accounts"},
        "Meta": {"TotalPages": 1},
    }


@app.get(f"{OBIE_AISP_BASE}/balances")
@app.get("/open-banking/v4.0/aisp/balances", include_in_schema=False)
async def all_balances(userId: str = Query("demo-user-001")) -> dict[str, Any]:
    items = [_to_ob_balance(account) for account in _load_json("mockAccounts.json") if account.get("userId") == userId]
    return {
        "Data": {"Balance": items},
        "Links": {"Self": f"{OBIE_AISP_BASE}/balances"},
        "Meta": {"TotalPages": 1},
    }


@app.get(f"{OBIE_AISP_BASE}/accounts/{{account_id}}/balances")
@app.get("/open-banking/v4.0/aisp/accounts/{account_id}/balances", include_in_schema=False)
async def balances(account_id: str, userId: str = Query("demo-user-001")) -> dict[str, Any]:
    items = [
        _to_ob_balance(account)
        for account in _load_json("mockAccounts.json")
        if account.get("userId") == userId and account.get("accountId") == account_id
    ]
    return {
        "Data": {"Balance": items},
        "Links": {"Self": f"{OBIE_AISP_BASE}/accounts/{account_id}/balances"},
        "Meta": {"TotalPages": 1},
    }


def _transactions_response(
    *,
    user_id: str,
    account_id: str | None,
    from_date: str | None,
    to_date: str | None,
    self_path: str,
) -> dict[str, Any]:
    start = date.fromisoformat(from_date[:10]) if from_date else None
    end = date.fromisoformat(to_date[:10]) if to_date else None
    balances = {
        account["accountId"]: float(account.get("availableBalance", 0))
        for account in _load_json("mockAccounts.json")
        if account.get("userId") == user_id
    }
    transactions = []
    for transaction in sorted(_load_json("mockTransactions.json"), key=lambda item: item["date"]):
        if transaction.get("userId") != user_id:
            continue
        if account_id is not None and transaction.get("accountId") != account_id:
            continue
        tx_date = date.fromisoformat(transaction["date"])
        if start and tx_date < start:
            continue
        if end and tx_date > end:
            continue
        current_balance = balances.get(transaction["accountId"], 0)
        if transaction.get("direction") == "debit":
            current_balance -= float(transaction["amount"])
        else:
            current_balance += float(transaction["amount"])
        balances[transaction["accountId"]] = current_balance
        transactions.append(_to_ob_transaction(transaction, current_balance))

    return {
        "Data": {"Transaction": transactions},
        "Links": {"Self": self_path},
        "Meta": {"TotalPages": 1},
    }


@app.get(f"{OBIE_AISP_BASE}/transactions")
@app.get("/open-banking/v4.0/aisp/transactions", include_in_schema=False)
async def all_transactions(
    userId: str = Query("demo-user-001"),
    fromBookingDateTime: str | None = None,
    toBookingDateTime: str | None = None,
) -> dict[str, Any]:
    return _transactions_response(
        user_id=userId,
        account_id=None,
        from_date=fromBookingDateTime,
        to_date=toBookingDateTime,
        self_path=f"{OBIE_AISP_BASE}/transactions",
    )


@app.get(f"{OBIE_AISP_BASE}/accounts/{{account_id}}/transactions")
@app.get("/open-banking/v4.0/aisp/accounts/{account_id}/transactions", include_in_schema=False)
async def transactions(
    account_id: str,
    userId: str = Query("demo-user-001"),
    fromBookingDateTime: str | None = None,
    toBookingDateTime: str | None = None,
) -> dict[str, Any]:
    return _transactions_response(
        user_id=userId,
        account_id=account_id,
        from_date=fromBookingDateTime,
        to_date=toBookingDateTime,
        self_path=f"{OBIE_AISP_BASE}/accounts/{account_id}/transactions",
    )


@app.post(f"{OBIE_PISP_BASE}/domestic-payments")
@app.post("/api/mock-bank/payments/immediate", include_in_schema=False)
async def immediate_payment(req: MockPaymentRequest) -> dict[str, Any]:
    try:
        with DATA_WRITE_LOCK:
            accounts_data = _load_json("mockAccounts.json")
            account = _find_user_account(accounts_data, req.userId, req.debtorAccountId)
            parsed_amount = _validate_amount(req.amount)
            account_currency = account.get("currency", "SGD")
            if req.currency and req.currency != account_currency:
                raise ValueError(f"Payment currency must match payer account currency {account_currency}.")
            balance_before = round(float(account.get("balance", 0)), 2)
            available_before = round(float(account.get("availableBalance", balance_before)), 2)
            if parsed_amount > available_before:
                raise ValueError("Insufficient available balance for this mock payment.")

            balance_after = round(balance_before - parsed_amount, 2)
            available_after = round(available_before - parsed_amount, 2)
            account["balance"] = balance_after
            account["availableBalance"] = available_after

            payee = _payee(req)
            if not payee:
                raise ValueError("Payee is required.")
            transactions_data = _load_json("mockTransactions.json")
            transaction_id = f"txn-extpay-{DEMO_TODAY.strftime('%Y%m%d')}-{uuid4().hex[:8]}"
            transaction = {
                "id": transaction_id,
                "accountId": req.debtorAccountId,
                "userId": req.userId,
                "date": DEMO_TODAY.isoformat(),
                "merchant": payee,
                "merchantId": f"m-{_slug(payee) or 'payee'}",
                "category": "Payment",
                "amount": parsed_amount,
                "currency": account_currency,
                "direction": "debit",
                "description": req.remittanceInformation or req.reference or f"Immediate payment to {payee}",
            }
            transactions_data.append(transaction)
            _write_json_atomic("mockAccounts.json", accounts_data)
            _write_json_atomic("mockTransactions.json", transactions_data)
    except ValueError as exc:
        raise _payment_error(exc) from exc

    return {
        "status": "EXECUTED",
        "paymentType": "immediate_domestic",
        "transactionId": transaction_id,
        "debtorAccountId": req.debtorAccountId,
        "payerAccount": _payment_account_summary(account),
        "payee": payee,
        "amount": parsed_amount,
        "currency": account_currency,
        "balanceBefore": balance_before,
        "availableBalanceBefore": available_before,
        "balanceAfter": balance_after,
        "availableBalanceAfter": available_after,
        "transaction": transaction,
        "executionDate": DEMO_TODAY.isoformat(),
    }


@app.post(f"{OBIE_PISP_BASE}/domestic-scheduled-payments")
@app.post("/api/mock-bank/payments/scheduled", include_in_schema=False)
async def scheduled_payment(req: MockPaymentRequest) -> dict[str, Any]:
    payee = _payee(req)
    try:
        account, parsed_amount = _validate_mock_payment_request(
            req.userId,
            req.debtorAccountId,
            payee,
            req.amount,
            req.currency,
        )
        scheduled_date = req.scheduledDate or req.dueDate
        if not scheduled_date:
            raise ValueError("Scheduled date is required for scheduled domestic payments.")
    except ValueError as exc:
        raise _payment_error(exc) from exc

    return {
        "status": "SCHEDULED",
        "paymentType": "scheduled_domestic",
        "scheduleId": f"sch-{_slug(req.userId)}-{_slug(payee)}-{_slug(scheduled_date)}-{uuid4().hex[:6]}",
        "debtorAccountId": req.debtorAccountId,
        "payerAccount": _payment_account_summary(account),
        "payee": payee,
        "amount": parsed_amount,
        "currency": account.get("currency", req.currency or "SGD"),
        "scheduledDate": scheduled_date,
        "remittanceInformation": req.remittanceInformation or req.reference or "",
        "balanceMutation": False,
        "note": "Mock scheduled payment accepted. Balance will not change until the scheduled execution date.",
    }


@app.post(f"{OBIE_PISP_BASE}/domestic-vrps")
@app.post("/api/mock-bank/payments/variable-recurring", include_in_schema=False)
async def variable_recurring_payment(req: MockPaymentRequest) -> dict[str, Any]:
    payee = _payee(req)
    controls = req.controlParameters or {}
    validation_amount = controls.get("maxIndividualAmount") or req.amount
    try:
        account, parsed_amount = _validate_mock_payment_request(
            req.userId,
            req.debtorAccountId,
            payee,
            validation_amount,
            req.currency,
        )
        max_cumulative = controls.get("maxCumulativeAmount")
        if max_cumulative is None:
            max_cumulative = round(parsed_amount * 3, 2)
        if float(max_cumulative) > float(account.get("availableBalance", 0)):
            raise ValueError("Insufficient available balance for the requested VRP cumulative control limit.")
    except ValueError as exc:
        raise _payment_error(exc) from exc

    return {
        "status": "VRP_CONSENT_ACTIVE",
        "paymentType": "variable_recurring",
        "arrangementId": f"vrp-{_slug(req.userId)}-{_slug(payee)}-{uuid4().hex[:8]}",
        "debtorAccountId": req.debtorAccountId,
        "payerAccount": _payment_account_summary(account),
        "payee": payee,
        "amount": round(float(req.amount), 2),
        "currency": account.get("currency", req.currency or "SGD"),
        "controlParameters": {
            "maxIndividualAmount": parsed_amount,
            "maxCumulativeAmount": round(float(max_cumulative), 2),
            "periodType": controls.get("periodType", "month"),
            "validFrom": controls.get("validFrom") or DEMO_TODAY.isoformat(),
            "validTo": controls.get("validTo") or "2026-12-31",
        },
        "remittanceInformation": req.remittanceInformation or req.reference or "",
        "balanceMutation": False,
        "note": "Mock VRP arrangement is active. No balance was changed by creating the arrangement.",
    }
