from __future__ import annotations

from typing import Any

from .financial_bill_service import detect_upcoming_bills
from .financial_constants import DEMO_USER_ID, PAYMENT_SAFETY_NOTICE
from .financial_policy_guard import validate_tool_call
from psd2.mock_bank import (
    clear_domestic_payment_consents,
    create_ob_domestic_payment_consent,
    create_ob_domestic_scheduled_payment_consent,
    create_ob_domestic_vrp_consent,
    get_ob_domestic_payment_consent,
)
from psd2.normalizers import normalize_ob_domestic_payment_consent


_PAYMENT_DRAFTS: dict[str, dict[str, Any]] = {}


def prepare_payment_drafts(
    user_id: str = DEMO_USER_ID,
    bills: list[dict[str, Any]] | None = None,
    payment_type: str = "immediate_domestic",
) -> dict[str, Any]:
    validate_tool_call(
        "prepare_payment_draft",
        {"bills": bills or detect_upcoming_bills(user_id)["upcomingBills"], "explicit_user_request": True},
        {"explicitPisRequest": True},
    )
    selected_bills = bills if bills is not None else detect_upcoming_bills(user_id)["upcomingBills"]
    drafts: list[dict[str, Any]] = []
    consents: list[dict[str, Any]] = []

    creator = {
        "immediate_domestic": create_ob_domestic_payment_consent,
        "scheduled_domestic": create_ob_domestic_scheduled_payment_consent,
        "variable_recurring": create_ob_domestic_vrp_consent,
    }.get(payment_type, create_ob_domestic_payment_consent)

    for bill in selected_bills:
        due_date = bill.get("estimatedDueDate") or bill.get("dueDate")
        merchant = bill["merchant"]
        ob_consent = creator(user_id, bill)
        normalized_consent = normalize_ob_domestic_payment_consent(ob_consent)
        consents.append(normalized_consent)
        draft_id = normalized_consent["consentId"]
        draft = {
            "draftId": draft_id,
            "consentId": draft_id,
            "userId": user_id,
            "payee": merchant,
            "merchantId": bill.get("merchantId"),
            "amount": round(float(bill["amount"]), 2),
            "currency": bill.get("currency", "SGD"),
            "dueDate": due_date,
            "status": "REVIEW_REQUIRED",
            "consentStatus": "AWAU",
            "resourceType": normalized_consent.get("resourceType", "domestic-payment-consent"),
            "executionStatus": "Not Executed",
            "note": PAYMENT_SAFETY_NOTICE,
        }
        _PAYMENT_DRAFTS[draft_id] = draft
        drafts.append(draft)

    return {
        "paymentDrafts": sorted(drafts, key=lambda item: item["dueDate"]),
        "domesticPaymentConsents": sorted(consents, key=lambda item: item.get("dueDate") or ""),
        "count": len(drafts),
        "status": "REVIEW_REQUIRED",
        "paymentType": payment_type,
        "safetyNotice": PAYMENT_SAFETY_NOTICE,
    }


def prepare_domestic_payment_consents(
    user_id: str = DEMO_USER_ID,
    bills: list[dict[str, Any]] | None = None,
    explicit_user_request: bool = True,
) -> dict[str, Any]:
    validate_tool_call(
        "pis_prepare_domestic_payment_consent",
        {"bills": bills or detect_upcoming_bills(user_id)["upcomingBills"], "explicit_user_request": explicit_user_request},
        {"explicitPisRequest": explicit_user_request},
    )
    result = prepare_payment_drafts(user_id, bills, "immediate_domestic")
    return {
        "domesticPaymentConsents": result["domesticPaymentConsents"],
        "count": result["count"],
        "status": "AWAU",
        "safetyNotice": PAYMENT_SAFETY_NOTICE,
    }


def prepare_domestic_scheduled_payment_consents(
    user_id: str = DEMO_USER_ID,
    bills: list[dict[str, Any]] | None = None,
    explicit_user_request: bool = True,
) -> dict[str, Any]:
    validate_tool_call(
        "pis_prepare_domestic_scheduled_payment_consent",
        {"bills": bills or detect_upcoming_bills(user_id)["upcomingBills"], "explicit_user_request": explicit_user_request},
        {"explicitPisRequest": explicit_user_request},
    )
    result = prepare_payment_drafts(user_id, bills, "scheduled_domestic")
    return {
        "domesticPaymentConsents": result["domesticPaymentConsents"],
        "count": result["count"],
        "status": "AWAU",
        "paymentType": "scheduled_domestic",
        "safetyNotice": PAYMENT_SAFETY_NOTICE,
    }


def prepare_domestic_vrp_consents(
    user_id: str = DEMO_USER_ID,
    bills: list[dict[str, Any]] | None = None,
    explicit_user_request: bool = True,
) -> dict[str, Any]:
    validate_tool_call(
        "pis_prepare_domestic_vrp_consent",
        {"bills": bills or detect_upcoming_bills(user_id)["upcomingBills"], "explicit_user_request": explicit_user_request},
        {"explicitPisRequest": explicit_user_request},
    )
    result = prepare_payment_drafts(user_id, bills, "variable_recurring")
    return {
        "domesticPaymentConsents": result["domesticPaymentConsents"],
        "count": result["count"],
        "status": "AWAU",
        "paymentType": "variable_recurring",
        "safetyNotice": PAYMENT_SAFETY_NOTICE,
    }


def get_domestic_payment_consent_status(consent_id: str, user_id: str = DEMO_USER_ID) -> dict[str, Any] | None:
    consent = get_ob_domestic_payment_consent(consent_id)
    if consent is None:
        return None
    normalized = normalize_ob_domestic_payment_consent(consent)
    if consent.get("DemoEnrichment", {}).get("UserId") != user_id:
        return None
    return normalized


def list_payment_drafts(user_id: str = DEMO_USER_ID) -> list[dict[str, Any]]:
    return [
        dict(draft)
        for draft in sorted(_PAYMENT_DRAFTS.values(), key=lambda item: item["dueDate"])
        if draft["userId"] == user_id
    ]


def clear_payment_drafts() -> None:
    _PAYMENT_DRAFTS.clear()
    clear_domestic_payment_consents()
