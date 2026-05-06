from __future__ import annotations

from copy import deepcopy
from typing import Any
from uuid import uuid4

from psd2.mock_bank import (
    create_ob_account_access_consent,
    get_ob_account_access_consent,
    get_ob_domestic_payment_consent,
    update_ob_account_access_consent_status,
    update_ob_domestic_payment_consent_status,
)

from .financial_constants import DEMO_USER_ID, PAYMENT_SAFETY_NOTICE
from .financial_conversation_store import FinancialConversationState, get_or_create_conversation
from .financial_payment_draft_service import prepare_payment_drafts
from .financial_payment_journey_service import PAYMENT_TYPE_LABELS


DEFAULT_AIS_PERMISSIONS = [
    "ReadAccountsBasic",
    "ReadBalances",
    "ReadTransactionsDetail",
]

_JOURNEYS: dict[str, dict[str, Any]] = {}
_JOURNEYS_BY_STATE: dict[str, str] = {}


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid4().hex[:12]}"


def _authorization_url(journey: dict[str, Any]) -> str:
    return (
        f"/mock-aspsp/authorize?journeyId={journey['journeyId']}"
        f"&consentId={journey['consentId']}&state={journey['state']}"
    )


def _callback_url() -> str:
    return "/open-banking/callback"


def _journey_steps(journey: dict[str, Any]) -> list[dict[str, str]]:
    status = journey.get("status")
    consent_status = journey.get("consentStatus")
    rejected = consent_status == "RJCT" or status == "rejected"
    authorised = consent_status == "AUTH" or status in {"authorised", "resumed"}
    resumed = status == "resumed"
    redirected = status in {"redirected_to_aspsp", "authorised", "rejected", "resumed"}

    def step(label: str, state: str, detail: str = "") -> dict[str, str]:
        value = {"label": label, "status": state}
        if detail:
            value["detail"] = detail
        return value

    return [
        step("Consent resource created", "completed", f"ConsentId: {journey.get('consentId')}"),
        step("Status set to AWAU", "completed", "Awaiting PSU authorisation"),
        step("Redirect URL generated", "completed", "Ready for Demo Bank authorisation"),
        step(
            "User authorisation",
            "failed" if rejected else "completed" if authorised else "active" if status == "redirect_ready" or redirected else "pending",
            "Rejected by PSU" if rejected else "Authorised by PSU" if authorised else "Continue at Demo Bank",
        ),
        step(
            "Resume assistant workflow",
            "completed" if resumed else "failed" if rejected else "pending",
            "Workflow resumed" if resumed else "Waiting for callback result",
        ),
    ]


def public_journey(journey: dict[str, Any]) -> dict[str, Any]:
    view = deepcopy(journey)
    view["steps"] = _journey_steps(view)
    return view


def _store_journey(state: FinancialConversationState, journey: dict[str, Any]) -> dict[str, Any]:
    journey["redirectUrl"] = _authorization_url(journey)
    journey["callbackUrl"] = _callback_url()
    _JOURNEYS[journey["journeyId"]] = journey
    _JOURNEYS_BY_STATE[journey["state"]] = journey["journeyId"]
    state.consentJourneys[journey["journeyId"]] = journey
    state.activeConsentJourneyId = journey["journeyId"]
    return public_journey(journey)


def has_valid_ais_consent(state: FinancialConversationState) -> bool:
    if state.aisConsentStatus == "AUTH" and state.aisConsentId:
        consent = get_ob_account_access_consent(state.aisConsentId)
        return bool(consent and consent.get("Data", {}).get("Status") == "AUTH")
    return False


def build_consent_workbench(
    *,
    journey: dict[str, Any],
    intent_label: str,
    capability: str,
    reason: str,
) -> dict[str, Any]:
    return {
        "intent": {"label": intent_label, "confidence": "high"},
        "capability": {"name": capability, "reason": reason},
        "consentJourney": public_journey(journey),
        "paymentJourney": {"status": "not_required", "missingFields": [], "collectedFields": [], "supportedPaymentTypes": []},
        "controlChecks": [
            {
                "label": "Consent required",
                "status": "warning",
                "detail": "The assistant needs PSU authorisation before using protected data or consent resources.",
            },
            {
                "label": "ASPSP handoff",
                "status": "passed",
                "detail": "The demo redirects to Demo Bank for authorisation.",
            },
        ],
        "toolTrace": [],
        "preparedResources": [],
    }


def start_ais_consent_journey(
    *,
    conversation_id: str | None,
    user_id: str = DEMO_USER_ID,
    original_message: str,
    permissions: list[str] | None = None,
) -> dict[str, Any]:
    state = get_or_create_conversation(conversation_id, user_id)
    requested_permissions = permissions or DEFAULT_AIS_PERMISSIONS
    ob_consent = create_ob_account_access_consent(user_id, requested_permissions)
    consent_id = ob_consent["Data"]["ConsentId"]
    journey = {
        "journeyId": _new_id("journey-ais"),
        "type": "AIS_CONSENT",
        "status": "redirect_ready",
        "consentId": consent_id,
        "consentStatus": "AWAU",
        "state": _new_id("state"),
        "capability": "AIS",
        "conversationId": state.conversationId,
        "userId": user_id,
        "pendingUserIntent": {
            "originalMessage": original_message,
            "resumeAction": "RUN_AIS_QUERY",
        },
        "display": {
            "title": "AIS Consent Required",
            "description": "To answer this, the assistant needs account information consent from Demo Bank.",
            "requestedPermissions": requested_permissions,
        },
    }
    return _store_journey(state, journey)


def start_pis_consent_journey(
    *,
    conversation_id: str | None,
    user_id: str = DEMO_USER_ID,
    payment_type: str = "immediate_domestic",
    payment: dict[str, Any] | None = None,
    payments: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    state = get_or_create_conversation(conversation_id, user_id)
    payment_rows = payments or ([payment] if payment else [])
    if not payment_rows:
        review = state.paymentIntentState.get("reviewRows") or []
        payment_rows = [
            {
                "creditorName": row.get("payee"),
                "amount": row.get("amount"),
                "currency": row.get("currency", "SGD"),
                "reference": row.get("remittanceInformation"),
                "dueDate": row.get("dueDate"),
            }
            for row in review
        ]
    bills = [
        {
            "merchant": row.get("merchant") or row.get("creditorName") or row.get("payee") or "",
            "amount": row.get("amount"),
            "currency": row.get("currency", "SGD"),
            "estimatedDueDate": row.get("estimatedDueDate") or row.get("dueDate") or "",
            "category": row.get("category", "Payment"),
            "remittanceInformation": row.get("reference") or row.get("remittanceInformation") or "",
            "vrpControlParameters": row.get("vrpControlParameters"),
        }
        for row in payment_rows
    ]
    bills = [bill for bill in bills if bill["merchant"] and bill["amount"] not in ("", None)]
    if not bills:
        raise ValueError("PIS consent journey requires at least one payee and amount.")

    result = prepare_payment_drafts(user_id, bills, payment_type)
    consents = result["domesticPaymentConsents"]
    consent_id = consents[0]["consentId"]
    total = round(sum(float(consent.get("amount", 0)) for consent in consents), 2)
    currency = consents[0].get("currency", "SGD")
    journey = {
        "journeyId": _new_id("journey-pis"),
        "type": "PIS_CONSENT",
        "status": "redirect_ready",
        "consentId": consent_id,
        "consentIds": [consent["consentId"] for consent in consents],
        "consentStatus": "AWAU",
        "state": _new_id("state"),
        "capability": "PIS",
        "conversationId": state.conversationId,
        "userId": user_id,
        "pendingUserIntent": {
            "originalMessage": "PIS consent authorisation",
            "resumeAction": "SHOW_CONSENT_RESULT",
        },
        "display": {
            "title": "Payment Consent Ready for Authorisation",
            "description": "Authorise the prepared payment consent at Demo Bank.",
            "paymentType": payment_type,
            "paymentTypeLabel": PAYMENT_TYPE_LABELS.get(payment_type, payment_type),
            "paymentSummary": {
                "payments": consents,
                "count": len(consents),
                "total": total,
                "currency": currency,
                "safetyNotice": PAYMENT_SAFETY_NOTICE,
            },
        },
        "preparedResources": [
            {
                "resourceType": consent.get("resourceType", "domestic-payment-consent"),
                "resourceId": consent["consentId"],
                "status": consent.get("status", "AWAU"),
                "statusLabel": "AWAU - awaiting PSU authorisation",
            }
            for consent in consents
        ],
    }
    state.lastPisResults["domesticPaymentConsents"] = consents
    state.paymentIntentState = {
        **state.paymentIntentState,
        "status": "consent_staged",
        "paymentType": payment_type,
        "paymentTypeLabel": PAYMENT_TYPE_LABELS.get(payment_type, payment_type),
        "preparedResources": journey["preparedResources"],
    }
    return _store_journey(state, journey)


def get_consent_journey(journey_id: str) -> dict[str, Any] | None:
    journey = _JOURNEYS.get(journey_id)
    return public_journey(journey) if journey else None


def _set_journey_status(journey: dict[str, Any], consent_status: str, status: str) -> None:
    journey["consentStatus"] = consent_status
    journey["status"] = status
    if journey["type"] == "AIS_CONSENT":
        update_ob_account_access_consent_status(journey["consentId"], consent_status)
    else:
        for consent_id in journey.get("consentIds") or [journey["consentId"]]:
            update_ob_domestic_payment_consent_status(consent_id, consent_status)
        for resource in journey.get("preparedResources", []):
            resource["status"] = consent_status
            resource["statusLabel"] = f"{consent_status} - {'authorised' if consent_status == 'AUTH' else 'rejected'}"
        for payment in journey.get("display", {}).get("paymentSummary", {}).get("payments", []):
            payment["status"] = consent_status
            payment["reviewRequired"] = consent_status == "AWAU"


def authorize_consent_journey(
    *,
    journey_id: str,
    consent_id: str,
    state_value: str,
    decision: str,
) -> dict[str, str]:
    journey = _JOURNEYS.get(journey_id)
    if not journey:
        raise ValueError("Unknown consent journey.")
    if journey.get("state") != state_value or journey.get("consentId") != consent_id:
        raise ValueError("Consent journey state validation failed.")

    if decision == "approve":
        _set_journey_status(journey, "AUTH", "authorised")
    elif decision == "reject":
        _set_journey_status(journey, "RJCT", "rejected")
    else:
        raise ValueError("Decision must be approve or reject.")

    code = _new_id("mock-code")
    journey["authCode"] = code
    return {"redirectUrl": f"/open-banking/callback?code={code}&state={state_value}"}


def handle_open_banking_callback(*, code: str, state_value: str) -> dict[str, Any]:
    journey_id = _JOURNEYS_BY_STATE.get(state_value)
    if not journey_id:
        raise ValueError("Unknown Open Banking callback state.")
    journey = _JOURNEYS[journey_id]
    if journey.get("authCode") != code:
        raise ValueError("Open Banking callback code validation failed.")
    state = get_or_create_conversation(journey["conversationId"], journey["userId"])
    if journey["type"] == "AIS_CONSENT" and journey["consentStatus"] == "AUTH":
        state.aisConsentId = journey["consentId"]
        state.aisConsentStatus = "AUTH"
    return {
        "conversationId": journey["conversationId"],
        "journeyId": journey["journeyId"],
        "capability": journey["capability"],
        "consentId": journey["consentId"],
        "consentStatus": journey["consentStatus"],
        "resumeAction": journey.get("pendingUserIntent", {}).get("resumeAction"),
    }


def mark_journey_resumed(journey_id: str) -> dict[str, Any]:
    journey = _JOURNEYS.get(journey_id)
    if not journey:
        raise ValueError("Unknown consent journey.")
    if journey.get("consentStatus") == "AUTH":
        journey["status"] = "resumed"
    return public_journey(journey)


def clear_consent_journeys() -> None:
    _JOURNEYS.clear()
    _JOURNEYS_BY_STATE.clear()
