from __future__ import annotations

import json
import os
import re
import threading
from datetime import date, datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx

from services.financial_constants import DEMO_TODAY, DEMO_USER_ID, PAYMENT_SAFETY_NOTICE

from .normalizers import (
    normalize_ob_account,
    normalize_ob_balance,
    normalize_ob_domestic_payment_consent,
    normalize_ob_transaction,
)


STANDARD = "OB_UK_READ_WRITE_API_V4"
OBIE_AISP_BASE = "/obie/open-banking/v4.0/aisp"
OBIE_PISP_BASE = "/obie/open-banking/v4.0/pisp"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_CONSENTS: dict[str, dict[str, Any]] = {}
_ACCOUNT_ACCESS_CONSENTS: dict[str, dict[str, Any]] = {}
_DATA_WRITE_LOCK = threading.Lock()


@lru_cache(maxsize=None)
def _load_json_from_source(filename: str) -> list[dict[str, Any]]:
    with (DATA_DIR / filename).open("r", encoding="utf-8") as f:
        return json.load(f)


def _load_json(filename: str) -> list[dict[str, Any]]:
    return _load_json_from_source(filename)


def clear_mock_data_cache() -> None:
    _load_json_from_source.cache_clear()


def _load_json_uncached(filename: str) -> list[dict[str, Any]]:
    with (DATA_DIR / filename).open("r", encoding="utf-8") as f:
        return json.load(f)


def _write_json_atomic(filename: str, data: list[dict[str, Any]]) -> None:
    path = DATA_DIR / filename
    temp_path = path.with_suffix(f"{path.suffix}.tmp")
    with temp_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        f.write("\n")
    temp_path.replace(path)


def _financial_mock_base_url() -> str:
    return os.getenv("FINANCIAL_MOCK_BASE_URL", "").strip().rstrip("/")


def _external_mock_enabled() -> bool:
    return bool(_financial_mock_base_url())


def _external_url(path: str) -> str:
    return f"{_financial_mock_base_url()}/{path.lstrip('/')}"


def _external_get(path: str, params: dict[str, Any] | None = None) -> dict[str, Any]:
    response = httpx.get(_external_url(path), params=params, timeout=10)
    response.raise_for_status()
    return response.json()


def _external_post(path: str, payload: dict[str, Any]) -> dict[str, Any]:
    response = httpx.post(_external_url(path), json=payload, timeout=10)
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = None
        try:
            body = response.json()
            detail = body.get("detail") if isinstance(body, dict) else None
        except ValueError:
            detail = response.text
        raise ValueError(detail or "External mock bank request failed.") from exc
    return response.json()


def _date_param(value: str | date | None) -> str | None:
    if value is None:
        return None
    return value.isoformat() if isinstance(value, date) else value


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")


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
    accounts = _load_json_uncached("mockAccounts.json")
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


def _debtor_account_for_bill(user_id: str, bill: dict[str, Any]) -> dict[str, Any]:
    if _external_mock_enabled():
        debtor_account_id = bill.get("debtorAccountId")
        ob_accounts = get_ob_accounts_response(user_id)["Data"]["Account"]
        selected = None
        for account in ob_accounts:
            if debtor_account_id and account.get("AccountId") == debtor_account_id:
                selected = account
                break
            if selected is None:
                selected = account
        if selected:
            return {
                "accountId": selected.get("AccountId"),
                "userId": user_id,
                "name": selected.get("Nickname") or selected.get("AccountId"),
                "type": selected.get("AccountTypeCode"),
                "currency": selected.get("Currency", "SGD"),
            }

    accounts = _load_json("mockAccounts.json")
    debtor_account_id = bill.get("debtorAccountId")
    if debtor_account_id:
        for account in accounts:
            if account.get("userId") == user_id and account.get("accountId") == debtor_account_id:
                return account
    for account in accounts:
        if account.get("userId") == user_id:
            return account
    return accounts[0]


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


def _to_ob_account(account: dict[str, Any]) -> dict[str, Any]:
    type_map = {
        "current": "CurrentAccount",
        "savings": "Savings",
        "wallet": "Other",
        "investment_cash": "Other",
    }
    balance = _to_ob_balance(account)
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
            "Balance": balance,
        },
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
            "Code": "PMNT" if direction == "Debit" else "PMNT",
            "SubCode": "ICDT" if direction == "Debit" else "RCDT",
        },
        "ProprietaryBankTransactionCode": {
            "Code": "CARD" if direction == "Debit" else "TRANSFER",
            "Issuer": "Demo ASPSP",
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


def get_ob_accounts_response(user_id: str = DEMO_USER_ID) -> dict[str, Any]:
    if _external_mock_enabled():
        return _external_get(
            f"{OBIE_AISP_BASE}/accounts",
            params={"userId": user_id},
        )

    accounts = [
        _to_ob_account(account)
        for account in _load_json("mockAccounts.json")
        if account.get("userId") == user_id
    ]
    return {
        "Data": {"Account": accounts},
        "Links": {"Self": f"{OBIE_AISP_BASE}/accounts"},
        "Meta": {"TotalPages": 1},
    }


def get_ob_balances_response(user_id: str = DEMO_USER_ID, account_id: str | None = None) -> dict[str, Any]:
    if _external_mock_enabled():
        path = (
            f"{OBIE_AISP_BASE}/accounts/{account_id}/balances"
            if account_id
            else f"{OBIE_AISP_BASE}/balances"
        )
        return _external_get(path, params={"userId": user_id})

    balances = [
        _to_ob_balance(account)
        for account in _load_json("mockAccounts.json")
        if account.get("userId") == user_id and (account_id is None or account["accountId"] == account_id)
    ]
    return {
        "Data": {"Balance": balances},
        "Links": {
            "Self": (
                f"{OBIE_AISP_BASE}/accounts/{account_id}/balances"
                if account_id
                else f"{OBIE_AISP_BASE}/balances"
            )
        },
        "Meta": {"TotalPages": 1},
    }


def get_ob_transactions_response(
    user_id: str = DEMO_USER_ID,
    account_id: str | None = None,
    from_date: str | date | None = None,
    to_date: str | date | None = None,
) -> dict[str, Any]:
    if _external_mock_enabled():
        path = (
            f"{OBIE_AISP_BASE}/accounts/{account_id}/transactions"
            if account_id
            else f"{OBIE_AISP_BASE}/transactions"
        )
        params = {
            "userId": user_id,
            "fromBookingDateTime": _date_param(from_date),
            "toBookingDateTime": _date_param(to_date),
        }
        return _external_get(path, params={key: value for key, value in params.items() if value is not None})

    start = date.fromisoformat(from_date) if isinstance(from_date, str) else from_date
    end = date.fromisoformat(to_date) if isinstance(to_date, str) else to_date
    transactions: list[dict[str, Any]] = []
    balances = {
        account["accountId"]: float(account.get("availableBalance", 0))
        for account in _load_json("mockAccounts.json")
        if account.get("userId") == user_id
    }
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
        "Links": {
            "Self": (
                f"{OBIE_AISP_BASE}/accounts/{account_id}/transactions"
                if account_id
                else f"{OBIE_AISP_BASE}/transactions"
            )
        },
        "Meta": {"TotalPages": 1},
    }


def list_normalized_accounts(user_id: str = DEMO_USER_ID) -> list[dict[str, Any]]:
    return [
        normalize_ob_account(account, user_id)
        for account in get_ob_accounts_response(user_id)["Data"]["Account"]
    ]


def list_normalized_balances(user_id: str = DEMO_USER_ID, account_id: str | None = None) -> list[dict[str, Any]]:
    return [
        normalize_ob_balance(balance)
        for balance in get_ob_balances_response(user_id, account_id)["Data"]["Balance"]
    ]


def list_normalized_transactions(
    user_id: str = DEMO_USER_ID,
    from_date: str | date | None = None,
    to_date: str | date | None = None,
    account_id: str | None = None,
) -> list[dict[str, Any]]:
    return [
        normalize_ob_transaction(transaction, user_id)
        for transaction in get_ob_transactions_response(user_id, account_id, from_date, to_date)["Data"]["Transaction"]
    ]


def create_ob_account_access_consent(
    user_id: str = DEMO_USER_ID,
    permissions: list[str] | None = None,
) -> dict[str, Any]:
    requested_permissions = permissions or [
        "ReadAccountsBasic",
        "ReadBalances",
        "ReadTransactionsDetail",
    ]
    permission_slug = _slug("-".join(requested_permissions))
    consent_id = f"aac-{_slug(user_id)}-{_stable_digits(permission_slug, 8)}"
    created_at = _demo_datetime()
    consent = {
        "Data": {
            "ConsentId": consent_id,
            "Status": "AWAU",
            "CreationDateTime": created_at,
            "StatusUpdateDateTime": created_at,
            "Permissions": requested_permissions,
            "ExpirationDateTime": "2026-08-03T23:59:59+00:00",
            "TransactionFromDateTime": "2025-11-01T00:00:00+00:00",
            "TransactionToDateTime": "2026-05-31T23:59:59+00:00",
        },
        "Risk": {},
        "Links": {
            "Self": f"/open-banking/v4.0/aisp/account-access-consents/{consent_id}",
        },
        "Meta": {},
        "DemoEnrichment": {
            "UserId": user_id,
            "ResourceType": "account-access-consent",
            "RequestedPermissions": requested_permissions,
        },
    }
    _ACCOUNT_ACCESS_CONSENTS[consent_id] = consent
    return consent


def get_ob_account_access_consent(consent_id: str) -> dict[str, Any] | None:
    return _ACCOUNT_ACCESS_CONSENTS.get(consent_id)


def update_ob_account_access_consent_status(consent_id: str, status: str) -> dict[str, Any] | None:
    consent = _ACCOUNT_ACCESS_CONSENTS.get(consent_id)
    if not consent:
        return None
    consent["Data"]["Status"] = status
    consent["Data"]["StatusUpdateDateTime"] = _demo_datetime()
    return consent


def create_ob_domestic_payment_consent(user_id: str, bill: dict[str, Any]) -> dict[str, Any]:
    due_date = bill.get("estimatedDueDate") or bill.get("dueDate") or DEMO_TODAY.isoformat()
    merchant = bill["merchant"]
    amount = round(float(bill["amount"]), 2)
    consent_id = f"dpc-{_slug(user_id)}-{_slug(merchant)}-{_slug(due_date)}"
    created_at = _demo_datetime()
    debtor_account = _debtor_account_for_bill(user_id, bill)
    debtor = _account_scheme(debtor_account)
    consent = {
        "Data": {
            "ConsentId": consent_id,
            "Status": "AWAU",
            "CreationDateTime": created_at,
            "StatusUpdateDateTime": created_at,
            "Initiation": {
                "InstructionIdentification": f"BILL-{_slug(due_date)}-{_slug(merchant)}",
                "EndToEndIdentification": f"E2E-BILL-{_slug(due_date)}-{_slug(merchant)}",
                "LocalInstrument": "UK.OBIE.FPS",
                "InstructedAmount": {
                    "Amount": f"{amount:.2f}",
                    "Currency": bill.get("currency", "SGD"),
                },
                "DebtorAccount": debtor,
                "CreditorAccount": {
                    "SchemeName": "UK.OBIE.SortCodeAccountNumber",
                    "Identification": f"08080087{_stable_digits(merchant)}",
                    "Name": merchant,
                },
                "RemittanceInformation": {
                    "Unstructured": [f"{merchant} bill {due_date}"],
                },
            },
            "SCASupportData": {
                "AppliedAuthenticationApproach": "SCA",
            },
        },
        "Risk": {
            "PaymentContextCode": "BillPayment",
            "BeneficiaryAccountType": "Business",
            "MerchantCategoryCode": "4900",
        },
        "Links": {
            "Self": f"/open-banking/v4.0/pisp/domestic-payment-consents/{consent_id}",
        },
        "Meta": {},
        "DemoEnrichment": {
            "UserId": user_id,
            "DueDate": due_date,
            "DebtorAccountId": debtor_account.get("accountId"),
            "ResourceType": "domestic-payment-consent",
            "SafetyNotice": PAYMENT_SAFETY_NOTICE,
        },
    }
    _CONSENTS[consent_id] = consent
    return consent


def create_ob_domestic_scheduled_payment_consent(user_id: str, bill: dict[str, Any]) -> dict[str, Any]:
    due_date = bill.get("estimatedDueDate") or bill.get("dueDate") or DEMO_TODAY.isoformat()
    merchant = bill["merchant"]
    amount = round(float(bill["amount"]), 2)
    consent_id = f"dspc-{_slug(user_id)}-{_slug(merchant)}-{_slug(due_date)}"
    created_at = _demo_datetime()
    debtor_account = _debtor_account_for_bill(user_id, bill)
    debtor = _account_scheme(debtor_account)
    consent = {
        "Data": {
            "ConsentId": consent_id,
            "Status": "AWAU",
            "CreationDateTime": created_at,
            "StatusUpdateDateTime": created_at,
            "Initiation": {
                "InstructionIdentification": f"SCH-{_slug(due_date)}-{_slug(merchant)}",
                "EndToEndIdentification": f"E2E-SCH-{_slug(due_date)}-{_slug(merchant)}",
                "LocalInstrument": "UK.OBIE.FPS",
                "RequestedExecutionDateTime": _demo_datetime(due_date),
                "InstructedAmount": {
                    "Amount": f"{amount:.2f}",
                    "Currency": bill.get("currency", "SGD"),
                },
                "DebtorAccount": debtor,
                "CreditorAccount": {
                    "SchemeName": "UK.OBIE.SortCodeAccountNumber",
                    "Identification": f"08080087{_stable_digits(merchant)}",
                    "Name": merchant,
                },
                "RemittanceInformation": {
                    "Unstructured": [bill.get("remittanceInformation") or f"{merchant} scheduled payment {due_date}"],
                },
            },
            "SCASupportData": {
                "AppliedAuthenticationApproach": "SCA",
            },
        },
        "Risk": {
            "PaymentContextCode": "BillPayment",
            "BeneficiaryAccountType": "Business",
            "MerchantCategoryCode": "4900",
        },
        "Links": {
            "Self": f"/open-banking/v4.0/pisp/domestic-scheduled-payment-consents/{consent_id}",
        },
        "Meta": {},
        "DemoEnrichment": {
            "UserId": user_id,
            "DueDate": due_date,
            "DebtorAccountId": debtor_account.get("accountId"),
            "ResourceType": "domestic-scheduled-payment-consent",
            "SafetyNotice": PAYMENT_SAFETY_NOTICE,
        },
    }
    _CONSENTS[consent_id] = consent
    return consent


def create_ob_domestic_vrp_consent(user_id: str, bill: dict[str, Any]) -> dict[str, Any]:
    merchant = bill["merchant"]
    amount = round(float(bill["amount"]), 2)
    controls = bill.get("vrpControlParameters") or {}
    max_individual = float(controls.get("maxIndividualAmount") or amount)
    max_cumulative = float(controls.get("maxCumulativeAmount") or amount * 3)
    consent_id = f"dvpc-{_slug(user_id)}-{_slug(merchant)}-{_slug(DEMO_TODAY.isoformat())}"
    created_at = _demo_datetime()
    debtor_account = _debtor_account_for_bill(user_id, bill)
    debtor = _account_scheme(debtor_account)
    consent = {
        "Data": {
            "ConsentId": consent_id,
            "Status": "AWAU",
            "CreationDateTime": created_at,
            "StatusUpdateDateTime": created_at,
            "ReadRefundAccount": "No",
            "ControlParameters": {
                "MaximumIndividualAmount": {
                    "Amount": f"{max_individual:.2f}",
                    "Currency": bill.get("currency", "SGD"),
                },
                "MaximumCumulativeAmount": {
                    "Amount": f"{max_cumulative:.2f}",
                    "Currency": bill.get("currency", "SGD"),
                },
                "PeriodType": controls.get("periodType", "month"),
                "ValidFromDateTime": _demo_datetime(controls.get("validFrom") or DEMO_TODAY),
                "ValidToDateTime": _demo_datetime(controls.get("validTo") or "2026-12-31"),
            },
            "Initiation": {
                "CreditorAccount": {
                    "SchemeName": "UK.OBIE.SortCodeAccountNumber",
                    "Identification": f"08080087{_stable_digits(merchant)}",
                    "Name": merchant,
                },
                "DebtorAccount": debtor,
                "RemittanceInformation": {
                    "Unstructured": [bill.get("remittanceInformation") or f"{merchant} variable recurring payment"],
                },
            },
            "SCASupportData": {
                "AppliedAuthenticationApproach": "SCA",
            },
        },
        "Risk": {
            "PaymentContextCode": "BillPayment",
            "BeneficiaryAccountType": "Business",
            "MerchantCategoryCode": "4900",
        },
        "Links": {
            "Self": f"/open-banking/v4.0/pisp/domestic-vrp-consents/{consent_id}",
        },
        "Meta": {},
        "DemoEnrichment": {
            "UserId": user_id,
            "DueDate": bill.get("estimatedDueDate") or bill.get("dueDate") or DEMO_TODAY.isoformat(),
            "DebtorAccountId": debtor_account.get("accountId"),
            "ResourceType": "domestic-vrp-consent",
            "SafetyNotice": PAYMENT_SAFETY_NOTICE,
        },
    }
    _CONSENTS[consent_id] = consent
    return consent


def get_ob_domestic_payment_consent(consent_id: str) -> dict[str, Any] | None:
    return _CONSENTS.get(consent_id)


def update_ob_domestic_payment_consent_status(consent_id: str, status: str) -> dict[str, Any] | None:
    consent = _CONSENTS.get(consent_id)
    if not consent:
        return None
    consent["Data"]["Status"] = status
    consent["Data"]["StatusUpdateDateTime"] = _demo_datetime()
    return consent


def list_ob_domestic_payment_consents(user_id: str = DEMO_USER_ID) -> list[dict[str, Any]]:
    return [
        consent
        for consent in _CONSENTS.values()
        if consent.get("DemoEnrichment", {}).get("UserId") == user_id
    ]


def list_normalized_domestic_payment_consents(user_id: str = DEMO_USER_ID) -> list[dict[str, Any]]:
    return [normalize_ob_domestic_payment_consent(consent) for consent in list_ob_domestic_payment_consents(user_id)]


def execute_mock_immediate_payment(
    *,
    user_id: str,
    debtor_account_id: str,
    payee: str,
    amount: Any,
    currency: str = "SGD",
    remittance_information: str | None = None,
) -> dict[str, Any]:
    if _external_mock_enabled():
        return _external_post(
            f"{OBIE_PISP_BASE}/domestic-payments",
            {
                "userId": user_id,
                "debtorAccountId": debtor_account_id,
                "payee": payee,
                "amount": amount,
                "currency": currency,
                "remittanceInformation": remittance_information,
            },
        )

    with _DATA_WRITE_LOCK:
        accounts = _load_json_uncached("mockAccounts.json")
        account = _find_user_account(accounts, user_id, debtor_account_id)
        parsed_amount = _validate_amount(amount)
        account_currency = account.get("currency", "SGD")
        if currency and currency != account_currency:
            raise ValueError(f"Payment currency must match payer account currency {account_currency}.")
        balance_before = round(float(account.get("balance", 0)), 2)
        available_before = round(float(account.get("availableBalance", balance_before)), 2)
        if parsed_amount > available_before:
            raise ValueError("Insufficient available balance for this mock payment.")

        balance_after = round(balance_before - parsed_amount, 2)
        available_after = round(available_before - parsed_amount, 2)
        account["balance"] = balance_after
        account["availableBalance"] = available_after

        transactions = _load_json_uncached("mockTransactions.json")
        transaction_id = f"txn-mockpay-{DEMO_TODAY.strftime('%Y%m%d')}-{uuid4().hex[:8]}"
        transaction = {
            "id": transaction_id,
            "accountId": debtor_account_id,
            "userId": user_id,
            "date": DEMO_TODAY.isoformat(),
            "merchant": str(payee).strip(),
            "merchantId": f"m-{_slug(payee) or 'payee'}",
            "category": "Payment",
            "amount": parsed_amount,
            "currency": account_currency,
            "direction": "debit",
            "description": remittance_information or f"Immediate payment to {str(payee).strip()}",
        }
        transactions.append(transaction)

        _write_json_atomic("mockAccounts.json", accounts)
        _write_json_atomic("mockTransactions.json", transactions)
        clear_mock_data_cache()

    return {
        "status": "EXECUTED",
        "paymentType": "immediate_domestic",
        "transactionId": transaction_id,
        "debtorAccountId": debtor_account_id,
        "payerAccount": _payment_account_summary(account),
        "payee": str(payee).strip(),
        "amount": parsed_amount,
        "currency": account_currency,
        "balanceBefore": balance_before,
        "availableBalanceBefore": available_before,
        "balanceAfter": balance_after,
        "availableBalanceAfter": available_after,
        "transaction": transaction,
        "executionDate": DEMO_TODAY.isoformat(),
    }


def create_mock_scheduled_payment(
    *,
    user_id: str,
    debtor_account_id: str,
    payee: str,
    amount: Any,
    currency: str = "SGD",
    scheduled_date: str | None = None,
    remittance_information: str | None = None,
) -> dict[str, Any]:
    if _external_mock_enabled():
        return _external_post(
            f"{OBIE_PISP_BASE}/domestic-scheduled-payments",
            {
                "userId": user_id,
                "debtorAccountId": debtor_account_id,
                "payee": payee,
                "amount": amount,
                "currency": currency,
                "scheduledDate": scheduled_date,
                "remittanceInformation": remittance_information,
            },
        )

    account, parsed_amount = _validate_mock_payment_request(user_id, debtor_account_id, payee, amount, currency)
    if not scheduled_date:
        raise ValueError("Scheduled date is required for scheduled domestic payments.")
    return {
        "status": "SCHEDULED",
        "paymentType": "scheduled_domestic",
        "scheduleId": f"sch-{_slug(user_id)}-{_slug(payee)}-{_slug(scheduled_date)}-{uuid4().hex[:6]}",
        "debtorAccountId": debtor_account_id,
        "payerAccount": _payment_account_summary(account),
        "payee": str(payee).strip(),
        "amount": parsed_amount,
        "currency": account.get("currency", currency or "SGD"),
        "scheduledDate": scheduled_date,
        "remittanceInformation": remittance_information or "",
        "balanceMutation": False,
        "note": "Mock scheduled payment accepted. Balance will not change until the scheduled execution date.",
    }


def create_mock_variable_recurring_payment(
    *,
    user_id: str,
    debtor_account_id: str,
    payee: str,
    amount: Any,
    currency: str = "SGD",
    control_parameters: dict[str, Any] | None = None,
    remittance_information: str | None = None,
) -> dict[str, Any]:
    if _external_mock_enabled():
        return _external_post(
            f"{OBIE_PISP_BASE}/domestic-vrps",
            {
                "userId": user_id,
                "debtorAccountId": debtor_account_id,
                "payee": payee,
                "amount": amount,
                "currency": currency,
                "controlParameters": control_parameters,
                "remittanceInformation": remittance_information,
            },
        )

    controls = control_parameters or {}
    validation_amount = controls.get("maxIndividualAmount") or amount
    account, parsed_amount = _validate_mock_payment_request(user_id, debtor_account_id, payee, validation_amount, currency)
    max_cumulative = controls.get("maxCumulativeAmount")
    if max_cumulative is None:
        max_cumulative = round(parsed_amount * 3, 2)
    if float(max_cumulative) > float(account.get("availableBalance", 0)):
        raise ValueError("Insufficient available balance for the requested VRP cumulative control limit.")
    return {
        "status": "VRP_CONSENT_ACTIVE",
        "paymentType": "variable_recurring",
        "arrangementId": f"vrp-{_slug(user_id)}-{_slug(payee)}-{uuid4().hex[:8]}",
        "debtorAccountId": debtor_account_id,
        "payerAccount": _payment_account_summary(account),
        "payee": str(payee).strip(),
        "amount": round(float(amount), 2) if amount not in (None, "") else parsed_amount,
        "currency": account.get("currency", currency or "SGD"),
        "controlParameters": {
            "maxIndividualAmount": parsed_amount,
            "maxCumulativeAmount": round(float(max_cumulative), 2),
            "periodType": controls.get("periodType", "month"),
            "validFrom": controls.get("validFrom") or DEMO_TODAY.isoformat(),
            "validTo": controls.get("validTo") or "2026-12-31",
        },
        "remittanceInformation": remittance_information or "",
        "balanceMutation": False,
        "note": "Mock VRP arrangement is active. No balance was changed by creating the arrangement.",
    }


def clear_domestic_payment_consents() -> None:
    _CONSENTS.clear()


def clear_account_access_consents() -> None:
    _ACCOUNT_ACCESS_CONSENTS.clear()
