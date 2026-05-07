from __future__ import annotations

import re
from typing import Any
from uuid import uuid4

from .financial_bill_service import detect_upcoming_bills
from .financial_constants import DEMO_CURRENCY, DEMO_USER_ID, PAYMENT_SAFETY_NOTICE
from .financial_data_service import list_accounts


def _extract_amount(message: str) -> float | None:
    match = re.search(r"(?:SGD|S\$|\$)?\s*(\d+(?:\.\d{1,2})?)", message, flags=re.IGNORECASE)
    if not match:
        return None
    return round(float(match.group(1)), 2)


def _extract_payee(message: str) -> str | None:
    normalized = " ".join(message.strip().split())
    patterns = [
        r"(?:pay|transfer|tranfer|send)\s+(?:SGD|S\$|\$)?\s*\d+(?:\.\d{1,2})?\s*(?:SGD)?\s+to\s+(?:my\s+friend\s+|my\s+)?(.+?)(?:\s*$)",
        r"(?:pay|transfer|tranfer|send)\s+(?:my\s+friend\s+|my\s+)?(.+?)\s+(?:SGD|S\$|\$)?\s*\d+(?:\.\d{1,2})?\s*(?:SGD)?(?:\s*$)",
        r"(?:pay|payment|transfer|tranfer|send)\s+(?:to\s+)?(?:my\s+friend\s+|my\s+)?(.+?)(?:\s+(?:for|of|amount|sgd|s\$|\$)\b|$)",
        r"(?:prepare|create)\s+(?:a\s+)?(?:payment|consent)\s+(?:to|for)\s+(.+?)(?:\s+(?:for|of|amount|sgd|s\$|\$)\b|$)",
    ]
    for pattern in patterns:
        match = re.search(pattern, normalized, flags=re.IGNORECASE)
        if not match:
            continue
        payee = match.group(1).strip(" .,:;-")
        if payee and payee.lower() not in {"these payments", "the payment", "payment", "review"}:
            return payee
    return None


def _payer_accounts(user_id: str) -> list[dict[str, Any]]:
    return [
        {
            "accountId": account.get("accountId"),
            "name": account.get("name"),
            "type": account.get("type"),
            "currency": account.get("currency", DEMO_CURRENCY),
            "balance": account.get("balance"),
            "availableBalance": account.get("availableBalance"),
        }
        for account in list_accounts(user_id)
    ]


def _review_row_from_bill(index: int, bill: dict[str, Any]) -> dict[str, Any]:
    payee = bill.get("merchant") or ""
    amount = bill.get("amount")
    missing_fields = []
    debtor_account_id = bill.get("debtorAccountId") or ""
    if not debtor_account_id:
        missing_fields.append("debtorAccountId")
    if not payee:
        missing_fields.append("payee")
    if amount in (None, ""):
        missing_fields.append("amount")
    return {
        "rowId": bill.get("merchantId") or f"known-bill-{index + 1}",
        "source": "AIS_UPCOMING_BILL",
        "payee": payee,
        "amount": amount,
        "currency": bill.get("currency", DEMO_CURRENCY),
        "debtorAccountId": debtor_account_id,
        "dueDate": bill.get("estimatedDueDate") or bill.get("dueDate") or "",
        "category": bill.get("category") or "",
        "remittanceInformation": f"{payee} bill" if payee else "",
        "editableFields": ["debtorAccountId", "payee", "amount", "dueDate", "remittanceInformation"],
        "missingFields": missing_fields,
        "canSubmit": not missing_fields,
    }


def _manual_row_from_message(message: str) -> dict[str, Any]:
    payee = _extract_payee(message) or ""
    amount = _extract_amount(message)
    missing_fields = []
    missing_fields.append("debtorAccountId")
    if not payee:
        missing_fields.append("payee")
    if amount is None:
        missing_fields.append("amount")
    return {
        "rowId": "manual-payment-1",
        "source": "USER_STATEMENT",
        "payee": payee,
        "amount": amount,
        "currency": DEMO_CURRENCY,
        "debtorAccountId": "",
        "dueDate": "",
        "category": "",
        "remittanceInformation": "",
        "editableFields": ["debtorAccountId", "payee", "amount", "dueDate", "remittanceInformation"],
        "missingFields": missing_fields,
        "canSubmit": not missing_fields,
    }


def prepare_pis_payment_review(
    user_id: str = DEMO_USER_ID,
    message: str = "",
    bills: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    known_bills = bills if bills is not None else []
    if not known_bills and any(phrase in message.lower() for phrase in ["these", "bills", "this week"]):
        known_bills = detect_upcoming_bills(user_id)["upcomingBills"]

    rows = (
        [_review_row_from_bill(index, bill) for index, bill in enumerate(known_bills)]
        if known_bills
        else [_manual_row_from_message(message)]
    )
    payer_accounts = _payer_accounts(user_id)
    missing_fields = sorted({field for row in rows for field in row["missingFields"]})
    can_submit = bool(rows) and not missing_fields
    status = "READY_FOR_CONFIRMATION" if can_submit else "INPUT_REQUIRED"

    return {
        "reviewId": f"pis-review-{uuid4().hex[:12]}",
        "userId": user_id,
        "status": status,
        "rows": rows,
        "payerAccounts": payer_accounts,
        "count": len(rows),
        "missingFields": missing_fields,
        "requiresManualInput": bool(missing_fields),
        "canSubmit": can_submit,
        "editableNotice": "From account, payee, amount, due date, and remittance information are editable by the user before final confirmation.",
        "submitAction": {
            "label": "Submit final confirmation",
            "method": "POST",
            "endpoint": "/obie/open-banking/v4.0/pisp",
            "effect": "Calls the selected OBIE mock PISP API for this payment type.",
        },
        "safetyNotice": PAYMENT_SAFETY_NOTICE,
    }
