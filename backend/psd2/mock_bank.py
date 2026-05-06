from __future__ import annotations

import json
import re
from datetime import date, datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

from services.financial_constants import DEMO_TODAY, DEMO_USER_ID, PAYMENT_SAFETY_NOTICE

from .normalizers import (
    normalize_ob_account,
    normalize_ob_balance,
    normalize_ob_domestic_payment_consent,
    normalize_ob_transaction,
)


STANDARD = "OB_UK_READ_WRITE_API_V4"
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
_CONSENTS: dict[str, dict[str, Any]] = {}
_ACCOUNT_ACCESS_CONSENTS: dict[str, dict[str, Any]] = {}


@lru_cache(maxsize=None)
def _load_json(filename: str) -> list[dict[str, Any]]:
    with (DATA_DIR / filename).open("r", encoding="utf-8") as f:
        return json.load(f)


def _slug(value: str) -> str:
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
    accounts = [
        _to_ob_account(account)
        for account in _load_json("mockAccounts.json")
        if account.get("userId") == user_id
    ]
    return {
        "Data": {"Account": accounts},
        "Links": {"Self": "/open-banking/v4.0/aisp/accounts"},
        "Meta": {"TotalPages": 1},
    }


def get_ob_balances_response(user_id: str = DEMO_USER_ID, account_id: str | None = None) -> dict[str, Any]:
    balances = [
        _to_ob_balance(account)
        for account in _load_json("mockAccounts.json")
        if account.get("userId") == user_id and (account_id is None or account["accountId"] == account_id)
    ]
    path_account = account_id or "all"
    return {
        "Data": {"Balance": balances},
        "Links": {"Self": f"/open-banking/v4.0/aisp/accounts/{path_account}/balances"},
        "Meta": {"TotalPages": 1},
    }


def get_ob_transactions_response(
    user_id: str = DEMO_USER_ID,
    account_id: str | None = None,
    from_date: str | date | None = None,
    to_date: str | date | None = None,
) -> dict[str, Any]:
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

    path_account = account_id or "all"
    return {
        "Data": {"Transaction": transactions},
        "Links": {"Self": f"/open-banking/v4.0/aisp/accounts/{path_account}/transactions"},
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
    debtor = _account_scheme(_load_json("mockAccounts.json")[0])
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
    debtor = _account_scheme(_load_json("mockAccounts.json")[0])
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
    debtor = _account_scheme(_load_json("mockAccounts.json")[0])
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


def clear_domestic_payment_consents() -> None:
    _CONSENTS.clear()


def clear_account_access_consents() -> None:
    _ACCOUNT_ACCESS_CONSENTS.clear()
