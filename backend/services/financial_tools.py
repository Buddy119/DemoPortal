from __future__ import annotations

from typing import Any

from .financial_bill_service import detect_upcoming_bills as _detect_upcoming_bills
from .financial_constants import DEMO_USER_ID
from .financial_consent_journey_service import DEFAULT_AIS_PERMISSIONS, start_ais_consent_journey
from .financial_data_service import (
    list_accounts as _list_accounts,
    list_balances as _list_balances,
    list_transactions as _list_transactions,
    raw_ais_accounts,
    raw_ais_balances,
    raw_ais_transactions,
)
from .financial_payment_draft_service import (
    get_domestic_payment_consent_status,
    prepare_domestic_payment_consents,
    prepare_domestic_scheduled_payment_consents,
    prepare_domestic_vrp_consents,
    prepare_payment_drafts,
)
from .financial_payment_journey_service import SUPPORTED_PAYMENT_TYPES
from .financial_pis_review_service import prepare_pis_payment_review
from .financial_policy_guard import assert_tool_allowed, validate_tool_call
from .financial_recurring_service import detect_subscriptions as _detect_subscriptions
from .financial_spending_service import get_spending_comparison

STANDARD = "OB_UK_READ_WRITE_API_V4"


def _tool_response(
    capability: str,
    raw: Any = None,
    normalized: Any = None,
    result: Any = None,
) -> dict[str, Any]:
    return {
        "capability": capability,
        "standard": STANDARD,
        "raw": raw,
        "normalized": normalized,
        "result": result if result is not None else normalized,
    }


def ais_list_accounts(user_id: str = DEMO_USER_ID) -> dict[str, Any]:
    validate_tool_call("ais_list_accounts")
    normalized = _list_accounts(user_id)
    return _tool_response(
        "AIS",
        raw=raw_ais_accounts(user_id),
        normalized=normalized,
        result={
            "accounts": normalized,
            "count": len(normalized),
            "currency": normalized[0]["currency"] if normalized else "SGD",
        },
    )


def ais_get_balances(user_id: str = DEMO_USER_ID, account_id: str | None = None) -> dict[str, Any]:
    validate_tool_call("ais_get_balances")
    normalized = _list_balances(user_id, account_id)
    return _tool_response(
        "AIS",
        raw=raw_ais_balances(user_id, account_id),
        normalized=normalized,
        result={
            "balances": normalized,
            "totalAvailableBalance": round(sum(float(balance["amount"]) for balance in normalized), 2),
            "currency": normalized[0]["currency"] if normalized else "SGD",
        },
    )


def ais_get_transactions(
    user_id: str = DEMO_USER_ID,
    from_date: str | None = None,
    to_date: str | None = None,
    account_id: str | None = None,
) -> dict[str, Any]:
    validate_tool_call("ais_get_transactions")
    normalized = _list_transactions(user_id, from_date, to_date)
    if account_id:
        normalized = [transaction for transaction in normalized if transaction.get("accountId") == account_id]
    if from_date is None and to_date is None:
        normalized = sorted(normalized, key=lambda item: item["date"], reverse=True)[:10]
    return _tool_response(
        "AIS",
        raw=raw_ais_transactions(user_id, from_date, to_date, account_id),
        normalized=normalized,
        result={"transactions": normalized, "count": len(normalized), "currency": normalized[0]["currency"] if normalized else "SGD"},
    )


def ais_analyze_spending_change(
    user_id: str = DEMO_USER_ID,
    current_month: str | None = None,
    previous_month: str | None = None,
) -> dict[str, Any]:
    validate_tool_call("ais_analyze_spending_change")
    result = get_spending_comparison(user_id, current_month, previous_month)
    return _tool_response("AIS", raw=raw_ais_transactions(user_id), normalized=result["relatedTransactions"], result=result)


def ais_detect_subscriptions(user_id: str = DEMO_USER_ID) -> dict[str, Any]:
    validate_tool_call("ais_detect_subscriptions")
    result = _detect_subscriptions(user_id)
    return _tool_response("AIS", raw=raw_ais_transactions(user_id), normalized=result["subscriptions"], result=result)


def ais_detect_upcoming_bills(user_id: str = DEMO_USER_ID) -> dict[str, Any]:
    validate_tool_call("ais_detect_upcoming_bills")
    result = _detect_upcoming_bills(user_id)
    return _tool_response("AIS", raw=raw_ais_transactions(user_id), normalized=result["upcomingBills"], result=result)


def ais_start_consent_journey(
    user_id: str = DEMO_USER_ID,
    conversation_id: str | None = None,
    original_message: str = "",
    permissions: list[str] | None = None,
) -> dict[str, Any]:
    validate_tool_call("ais_start_consent_journey")
    journey = start_ais_consent_journey(
        conversation_id=conversation_id,
        user_id=user_id,
        original_message=original_message,
        permissions=permissions or DEFAULT_AIS_PERMISSIONS,
    )
    return _tool_response("AIS", raw=None, normalized=journey, result=journey)


def pis_prepare_domestic_payment_consent(
    user_id: str = DEMO_USER_ID,
    bills: list[dict[str, Any]] | None = None,
    explicit_user_request: bool = True,
) -> dict[str, Any]:
    selected_bills = bills if bills is not None else _detect_upcoming_bills(user_id)["upcomingBills"]
    validate_tool_call(
        "pis_prepare_domestic_payment_consent",
        {"bills": selected_bills, "explicit_user_request": explicit_user_request},
        {"explicitPisRequest": explicit_user_request},
    )
    result = prepare_domestic_payment_consents(user_id, selected_bills, explicit_user_request)
    return _tool_response("PIS", raw=[consent.get("raw") for consent in result["domesticPaymentConsents"]], normalized=result["domesticPaymentConsents"], result=result)


def pis_start_payment_journey(
    user_id: str = DEMO_USER_ID,
    message: str = "",
    payment_type: str | None = None,
    bills: list[dict[str, Any]] | None = None,
    explicit_user_request: bool = True,
) -> dict[str, Any]:
    validate_tool_call(
        "pis_start_payment_journey",
        {"explicit_user_request": explicit_user_request},
        {"explicitPisRequest": explicit_user_request},
    )
    missing_fields = [] if payment_type else ["paymentType"]
    result = {
        "status": "details_required" if payment_type else "payment_type_required",
        "supportedPaymentTypes": SUPPORTED_PAYMENT_TYPES,
        "selectedPaymentType": payment_type,
        "missingFields": missing_fields,
        "knownBillCount": len(bills or []),
        "message": message,
    }
    return _tool_response("PIS", raw=None, normalized=result, result=result)


def pis_prepare_payment_review(
    user_id: str = DEMO_USER_ID,
    message: str = "",
    bills: list[dict[str, Any]] | None = None,
    explicit_user_request: bool = True,
) -> dict[str, Any]:
    validate_tool_call(
        "pis_prepare_payment_review",
        {"bills": bills or [{"merchant": "", "amount": None}], "explicit_user_request": explicit_user_request},
        {"explicitPisRequest": explicit_user_request},
    )
    result = prepare_pis_payment_review(user_id, message, bills)
    return _tool_response("PIS", raw=None, normalized=result["rows"], result=result)


def pis_get_domestic_payment_consent_status(
    consent_id: str,
    user_id: str = DEMO_USER_ID,
) -> dict[str, Any]:
    validate_tool_call("pis_get_domestic_payment_consent_status")
    result = get_domestic_payment_consent_status(consent_id, user_id)
    return _tool_response("PIS", raw=result.get("raw") if result else None, normalized=result, result=result)


def pis_prepare_domestic_scheduled_payment_consent(
    user_id: str = DEMO_USER_ID,
    bills: list[dict[str, Any]] | None = None,
    explicit_user_request: bool = True,
) -> dict[str, Any]:
    selected_bills = bills if bills is not None else _detect_upcoming_bills(user_id)["upcomingBills"]
    validate_tool_call(
        "pis_prepare_domestic_scheduled_payment_consent",
        {"bills": selected_bills, "explicit_user_request": explicit_user_request},
        {"explicitPisRequest": explicit_user_request},
    )
    result = prepare_domestic_scheduled_payment_consents(user_id, selected_bills, explicit_user_request)
    return _tool_response("PIS", raw=[consent.get("raw") for consent in result["domesticPaymentConsents"]], normalized=result["domesticPaymentConsents"], result=result)


def pis_prepare_domestic_vrp_consent(
    user_id: str = DEMO_USER_ID,
    bills: list[dict[str, Any]] | None = None,
    explicit_user_request: bool = True,
) -> dict[str, Any]:
    selected_bills = bills if bills is not None else _detect_upcoming_bills(user_id)["upcomingBills"]
    validate_tool_call(
        "pis_prepare_domestic_vrp_consent",
        {"bills": selected_bills, "explicit_user_request": explicit_user_request},
        {"explicitPisRequest": explicit_user_request},
    )
    result = prepare_domestic_vrp_consents(user_id, selected_bills, explicit_user_request)
    return _tool_response("PIS", raw=[consent.get("raw") for consent in result["domesticPaymentConsents"]], normalized=result["domesticPaymentConsents"], result=result)


def list_accounts(user_id: str = DEMO_USER_ID) -> list[dict[str, Any]]:
    assert_tool_allowed("list_accounts")
    return _list_accounts(user_id)


def get_transactions(
    user_id: str = DEMO_USER_ID,
    from_date: str | None = None,
    to_date: str | None = None,
) -> list[dict[str, Any]]:
    assert_tool_allowed("get_transactions")
    return _list_transactions(user_id, from_date, to_date)


def analyze_spending_change(
    user_id: str = DEMO_USER_ID,
    current_month: str | None = None,
    previous_month: str | None = None,
) -> dict[str, Any]:
    assert_tool_allowed("analyze_spending_change")
    return get_spending_comparison(user_id, current_month, previous_month)


def detect_subscriptions(user_id: str = DEMO_USER_ID) -> dict[str, Any]:
    assert_tool_allowed("detect_subscriptions")
    return _detect_subscriptions(user_id)


def detect_upcoming_bills(user_id: str = DEMO_USER_ID) -> dict[str, Any]:
    assert_tool_allowed("detect_upcoming_bills")
    return _detect_upcoming_bills(user_id)


def prepare_payment_draft(user_id: str = DEMO_USER_ID) -> dict[str, Any]:
    assert_tool_allowed("prepare_payment_draft")
    return prepare_payment_drafts(user_id)


def call_financial_tool(tool_name: str, arguments: dict[str, Any] | None = None) -> Any:
    assert_tool_allowed(tool_name)
    args = arguments or {}
    tools = {
        "ais_list_accounts": ais_list_accounts,
        "ais_get_balances": ais_get_balances,
        "ais_get_transactions": ais_get_transactions,
        "ais_analyze_spending_change": ais_analyze_spending_change,
        "ais_detect_subscriptions": ais_detect_subscriptions,
        "ais_detect_upcoming_bills": ais_detect_upcoming_bills,
        "ais_start_consent_journey": ais_start_consent_journey,
        "pis_start_payment_journey": pis_start_payment_journey,
        "pis_prepare_domestic_payment_consent": pis_prepare_domestic_payment_consent,
        "pis_prepare_domestic_scheduled_payment_consent": pis_prepare_domestic_scheduled_payment_consent,
        "pis_prepare_domestic_vrp_consent": pis_prepare_domestic_vrp_consent,
        "pis_prepare_payment_review": pis_prepare_payment_review,
        "pis_get_domestic_payment_consent_status": pis_get_domestic_payment_consent_status,
        "list_accounts": list_accounts,
        "get_transactions": get_transactions,
        "analyze_spending_change": analyze_spending_change,
        "detect_subscriptions": detect_subscriptions,
        "detect_upcoming_bills": detect_upcoming_bills,
        "prepare_payment_draft": prepare_payment_draft,
    }
    if tool_name not in tools:
        raise ValueError(f"Unknown financial tool: {tool_name}")
    return tools[tool_name](**args)
