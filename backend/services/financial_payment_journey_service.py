from __future__ import annotations

import re
from datetime import timedelta
from typing import Any
from uuid import uuid4

from .financial_constants import DEMO_CURRENCY, DEMO_TODAY, DEMO_USER_ID, PAYMENT_SAFETY_NOTICE
from .financial_conversation_store import FinancialConversationState
from .financial_data_service import list_accounts
from .financial_pis_review_service import prepare_pis_payment_review


PAYMENT_TYPE_LABELS = {
    "immediate_domestic": "Immediate domestic payment",
    "scheduled_domestic": "Scheduled domestic payment",
    "variable_recurring": "Variable recurring payment",
}

SUPPORTED_PAYMENT_TYPES = [
    {
        "value": "immediate_domestic",
        "label": PAYMENT_TYPE_LABELS["immediate_domestic"],
        "description": "One-time domestic payment consent prepared for immediate authorisation.",
    },
    {
        "value": "scheduled_domestic",
        "label": PAYMENT_TYPE_LABELS["scheduled_domestic"],
        "description": "One-time domestic payment consent prepared for a future execution date.",
    },
    {
        "value": "variable_recurring",
        "label": PAYMENT_TYPE_LABELS["variable_recurring"],
        "description": "VRP consent with control parameters and review before authorisation.",
    },
]


def _money(amount: Any, currency: str = DEMO_CURRENCY) -> str:
    return f"{currency} {float(amount or 0):,.2f}"


def _detect_payment_type(message: str) -> str | None:
    normalized = message.lower()
    if any(phrase in normalized for phrase in ["variable recurring", "vrp", "recurring payment", "flexible recurring"]):
        return "variable_recurring"
    if any(phrase in normalized for phrase in ["scheduled", "schedule", "future date", "next friday", "due date", "by their estimated due"]):
        return "scheduled_domestic"
    if any(phrase in normalized for phrase in ["immediate", "pay now", "today", "one-time", "one time", "domestic payment"]):
        return "immediate_domestic"
    return None


def _looks_like_payment_message(message: str) -> bool:
    normalized = message.lower()
    patterns = [
        r"\bpayment\b",
        r"\bpay\b",
        r"\btransfer\b",
        r"\btranfer\b",
        r"\bsend\b",
        r"\bpis\b",
        r"\bconsent\b",
        r"\bscheduled\b",
        r"\bschedule\b",
        r"\bvrp\b",
        r"\brecurring payment\b",
        r"\bimmediate\b",
        r"\bsgd\b",
        r"\bs\$\b",
    ]
    return any(re.search(pattern, normalized) for pattern in patterns)


def _looks_like_blocked_execution(message: str) -> bool:
    normalized = message.lower()
    return any(
        phrase in normalized
        for phrase in [
            "execute payment",
            "submit payment",
            "approve payment",
            "complete payment",
            "send the money",
            "move the money",
        ]
    )


def _extract_scheduled_date(message: str) -> str:
    normalized = message.lower()
    iso_match = re.search(r"\b(2026-\d{2}-\d{2})\b", normalized)
    if iso_match:
        return iso_match.group(1)
    if "next friday" in normalized:
        days_until_friday = (4 - DEMO_TODAY.weekday()) % 7
        days_until_friday = days_until_friday or 7
        return (DEMO_TODAY + timedelta(days=days_until_friday)).isoformat()
    if "due date" in normalized or "estimated due" in normalized:
        return ""
    return ""


def _default_debtor_account(user_id: str) -> dict[str, str]:
    accounts = list_accounts(user_id)
    account = accounts[0] if accounts else {}
    return {
        "debtorAccountId": account.get("accountId", "acc-everyday-001"),
        "debtorAccountLabel": account.get("name", "Everyday Global Account"),
    }


def _known_bills(state: FinancialConversationState) -> list[dict[str, Any]]:
    return state.lastAisResults.get("upcomingBills", {}).get("upcomingBills", []) or []


def _review_rows_from_known_context(
    state: FinancialConversationState,
    message: str,
    payment_type: str,
    source: str,
) -> list[dict[str, Any]]:
    bills = _known_bills(state) if source == "ais_upcoming_bills" else []
    if bills:
        rows = prepare_pis_payment_review(state.userId, message, bills)["rows"]
    else:
        previous = state.paymentIntentState.get("reviewRows") or []
        current = prepare_pis_payment_review(state.userId, message)["rows"]
        row = dict(current[0] if current else {})
        if previous:
            prior = previous[0]
            for key in ["payee", "amount", "currency", "dueDate", "remittanceInformation", "category"]:
                if row.get(key) in ("", None):
                    row[key] = prior.get(key)
        rows = [row]

    scheduled_date = _extract_scheduled_date(message)
    normalized_rows = []
    for index, row in enumerate(rows):
        row = dict(row)
        row["rowId"] = row.get("rowId") or f"payment-row-{index + 1}"
        row["paymentType"] = payment_type
        row["paymentTypeLabel"] = PAYMENT_TYPE_LABELS[payment_type]
        row["currency"] = row.get("currency") or DEMO_CURRENCY
        if payment_type == "scheduled_domestic" and scheduled_date and not row.get("dueDate"):
            row["dueDate"] = scheduled_date
        if payment_type == "variable_recurring":
            amount = float(row.get("amount") or 0)
            row["vrpControlParameters"] = {
                "maxIndividualAmount": amount or None,
                "maxCumulativeAmount": round(amount * 3, 2) if amount else None,
                "periodType": "month",
                "validFrom": DEMO_TODAY.isoformat(),
                "validTo": "2026-12-31",
            }
        normalized_rows.append(row)
    return normalized_rows


def _missing_fields(rows: list[dict[str, Any]], payment_type: str | None) -> list[str]:
    missing: set[str] = set()
    if not payment_type:
        missing.add("paymentType")
        return sorted(missing)
    for row in rows:
        if not str(row.get("payee") or "").strip():
            missing.add("payee")
        if row.get("amount") in ("", None) or str(row.get("amount")).strip() == "":
            missing.add("amount")
        if payment_type == "scheduled_domestic" and not str(row.get("dueDate") or "").strip():
            missing.add("scheduledDate")
        if payment_type == "variable_recurring":
            controls = row.get("vrpControlParameters") or {}
            if not controls.get("maxIndividualAmount"):
                missing.add("maxIndividualAmount")
            if not controls.get("maxCumulativeAmount"):
                missing.add("maxCumulativeAmount")
    return sorted(missing)


def _collected_fields(state: FinancialConversationState, rows: list[dict[str, Any]], payment_type: str | None, source: str) -> list[dict[str, str]]:
    fields: list[dict[str, str]] = []
    if payment_type:
        fields.append({"label": "Payment type", "value": PAYMENT_TYPE_LABELS[payment_type]})
    if source == "ais_upcoming_bills":
        bills = _known_bills(state)
        total = sum(float(bill.get("amount", 0)) for bill in bills)
        fields.append({"label": "Source", "value": f"AIS upcoming bills ({len(bills)} bills, {_money(total)})"})
    debtor = _default_debtor_account(state.userId)
    fields.append({"label": "Debtor account", "value": debtor["debtorAccountLabel"]})
    if len(rows) > 1:
        total = sum(float(row.get("amount") or 0) for row in rows)
        fields.append({"label": "Payment rows", "value": f"{len(rows)} rows, {_money(total)}"})
    elif rows:
        row = rows[0]
        if row.get("payee"):
            fields.append({"label": "Payee", "value": str(row["payee"])})
        if row.get("amount") not in ("", None):
            fields.append({"label": "Amount", "value": _money(row["amount"], row.get("currency", DEMO_CURRENCY))})
        if row.get("dueDate"):
            fields.append({"label": "Due date", "value": str(row["dueDate"])})
    return fields


def _state_from_rows(
    state: FinancialConversationState,
    payment_type: str | None,
    source: str,
    rows: list[dict[str, Any]],
    status: str,
    missing_fields: list[str],
) -> dict[str, Any]:
    details = _default_debtor_account(state.userId)
    if rows:
        row = rows[0]
        details.update(
            {
                "creditorName": row.get("payee"),
                "amount": row.get("amount"),
                "currency": row.get("currency", DEMO_CURRENCY),
                "reference": row.get("remittanceInformation") or (f"{row.get('payee')} payment" if row.get("payee") else ""),
                "scheduledDate": row.get("dueDate"),
            }
        )
        if payment_type == "variable_recurring":
            details["vrpControlParameters"] = row.get("vrpControlParameters")

    return {
        "status": status,
        "capability": "PIS",
        "paymentType": payment_type,
        "paymentTypeLabel": PAYMENT_TYPE_LABELS.get(payment_type or "", ""),
        "source": source,
        "collectedDetails": {key: value for key, value in details.items() if value not in ("", None)},
        "missingDetails": missing_fields,
        "reviewRows": rows,
        "preparedResources": state.paymentIntentState.get("preparedResources", []),
        "safetyBoundary": {
            "executionAllowed": False,
            "reviewRequired": True,
            "scaRequired": True,
        },
    }


def _agent_workbench(
    state: FinancialConversationState,
    intent_label: str,
    payment_state: dict[str, Any] | None = None,
    tool_calls: list[dict[str, str]] | None = None,
    prepared_resources: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    payment_state = payment_state or state.paymentIntentState or {}
    rows = payment_state.get("reviewRows") or []
    source = payment_state.get("source") or "direct_user_request"
    return {
        "intent": {
            "label": intent_label,
            "confidence": "high",
            "userGoal": intent_label,
        },
        "capability": {
            "name": "PIS" if payment_state else "AIS",
            "reason": "PSD2 PIS is required for payment consent preparation." if payment_state else "AIS tools provide read-only account intelligence.",
        },
        "paymentJourney": {
            "status": payment_state.get("status", "not_required"),
            "paymentType": payment_state.get("paymentType"),
            "paymentTypeLabel": payment_state.get("paymentTypeLabel"),
            "source": source,
            "missingFields": payment_state.get("missingDetails", []),
            "collectedFields": _collected_fields(state, rows, payment_state.get("paymentType"), source) if payment_state else [],
            "supportedPaymentTypes": SUPPORTED_PAYMENT_TYPES if payment_state.get("status") == "payment_type_required" else [],
        },
        "controlChecks": [
            {
                "label": "Payment execution blocked",
                "status": "passed",
                "detail": "This MVP can prepare consent resources only.",
            },
            {
                "label": "User review required",
                "status": "passed",
                "detail": "Editable details must be reviewed before final confirmation.",
            },
            {
                "label": "SCA required",
                "status": "passed",
                "detail": "Prepared consents use AWAU, awaiting PSU authorisation.",
            },
        ],
        "toolTrace": [
            {
                "label": call.get("label") or call.get("name", ""),
                "toolName": call.get("name", ""),
                "capability": call.get("capability", "PIS"),
                "status": call.get("status", "success"),
                "summary": call.get("summary"),
            }
            for call in (tool_calls or [])
        ],
        "preparedResources": prepared_resources or payment_state.get("preparedResources", []),
    }


def build_agent_workbench_from_response(
    response: dict[str, Any],
    state: FinancialConversationState | None = None,
) -> dict[str, Any]:
    if response.get("agentWorkbench"):
        return response["agentWorkbench"]
    capability_used = response.get("capabilityUsed", [])
    if "PIS" in capability_used:
        capability = "PIS"
    elif "AIS" in capability_used:
        capability = "AIS"
    else:
        capability = "General"
    tool_calls = response.get("toolCalls") or []
    if capability == "General":
        reason = "No AIS or PIS capability was required for this general response."
    else:
        reason = "Structured financial tools were used for this response."
    return {
        "intent": {
            "label": response.get("intent", "Financial assistant request").replace("_", " ").title(),
            "confidence": "high",
        },
        "capability": {
            "name": capability,
            "reason": reason,
        },
        "paymentJourney": {
            "status": "not_required" if capability in {"AIS", "General"} else response.get("pis", {}).get("paymentIntentState", {}).get("status", "details_required"),
            "paymentType": response.get("pis", {}).get("paymentIntentState", {}).get("paymentType"),
            "paymentTypeLabel": response.get("pis", {}).get("paymentIntentState", {}).get("paymentTypeLabel"),
            "missingFields": response.get("pis", {}).get("paymentIntentState", {}).get("missingDetails", []),
            "collectedFields": [],
            "supportedPaymentTypes": [],
        },
        "controlChecks": [],
        "toolTrace": [
            {
                "label": call.get("name", "").replace("_", " "),
                "toolName": call.get("name", ""),
                "capability": call.get("capability", capability),
                "status": call.get("status", "success"),
            }
            for call in tool_calls
        ],
        "preparedResources": [],
    }


def is_payment_journey_message(message: str, state: FinancialConversationState) -> bool:
    if not state.paymentIntentState:
        return _looks_like_payment_message(message)
    return bool(_detect_payment_type(message) or _looks_like_payment_message(message))


def handle_payment_journey_message(message: str, state: FinancialConversationState) -> dict[str, Any]:
    state.explicitPisRequest = True
    existing = state.paymentIntentState or {}

    if _looks_like_blocked_execution(message):
        payment_state = {
            **existing,
            "status": "blocked",
            "capability": "PIS",
            "missingDetails": [],
            "safetyBoundary": {
                "executionAllowed": False,
                "reviewRequired": True,
                "scaRequired": True,
            },
        }
        state.paymentIntentState = payment_state
        tool_calls = [{"name": "pis_start_payment_journey", "capability": "PIS", "status": "skipped", "summary": "Execution request blocked."}]
        answer = (
            "I cannot execute, submit, approve, or complete payments in this MVP. "
            "I can only prepare PSD2 PIS consent details for review. "
            f"{PAYMENT_SAFETY_NOTICE}"
        )
        return {
            "conversationId": state.conversationId,
            "answer": answer,
            "intent": "prepare_payment_drafts",
            "capabilityUsed": ["PIS"],
            "toolCalls": tool_calls,
            "pis": {"paymentIntentState": payment_state},
            "agentWorkbench": _agent_workbench(state, "Prepare payment", payment_state, tool_calls),
            "insights": [],
            "suggestedActions": [],
            "warnings": [],
            "safetyNotice": PAYMENT_SAFETY_NOTICE,
        }

    source = existing.get("source") or (
        "ais_upcoming_bills"
        if _known_bills(state) and any(phrase in message.lower() for phrase in ["these", "bills", "this week", "detected"])
        else "direct_user_request"
    )
    payment_type = _detect_payment_type(message) or existing.get("paymentType")

    if not payment_type:
        rows = _review_rows_from_known_context(state, message, "immediate_domestic", source)
        missing = ["paymentType"]
        payment_state = _state_from_rows(state, None, source, rows, "payment_type_required", missing)
        state.paymentIntentState = payment_state
        answer = (
            "I can help prepare a PSD2 PIS payment consent journey. What kind of payment would you like to prepare?\n\n"
            "1. Immediate domestic payment\n"
            "2. Scheduled domestic payment\n"
            "3. Variable recurring payment\n\n"
            f"I will only prepare consent details for review. {PAYMENT_SAFETY_NOTICE}"
        )
        tool_calls = [{"name": "pis_start_payment_journey", "capability": "PIS", "status": "success", "summary": "Payment type is required before consent preparation."}]
        return {
            "conversationId": state.conversationId,
            "answer": answer,
            "intent": "prepare_payment_drafts",
            "capabilityUsed": ["PIS"],
            "toolCalls": tool_calls,
            "pis": {"paymentIntentState": payment_state},
            "agentWorkbench": _agent_workbench(state, "Prepare payment", payment_state, tool_calls),
            "insights": [],
            "suggestedActions": [{"label": option["label"], "action": "SELECT_PAYMENT_TYPE", "payload": option} for option in SUPPORTED_PAYMENT_TYPES],
            "warnings": [],
            "safetyNotice": PAYMENT_SAFETY_NOTICE,
        }

    rows = _review_rows_from_known_context(state, message, payment_type, source)
    missing = _missing_fields(rows, payment_type)
    status = "details_required" if missing else "ready_for_consent_preparation"
    payment_state = _state_from_rows(state, payment_type, source, rows, status, missing)
    state.paymentIntentState = payment_state

    review = prepare_pis_payment_review(state.userId, message, _known_bills(state) if source == "ais_upcoming_bills" else None)
    review["rows"] = rows
    review["count"] = len(rows)
    review["missingFields"] = missing
    review["requiresManualInput"] = bool(missing)
    review["canSubmit"] = not missing
    review["status"] = "INPUT_REQUIRED" if missing else "READY_FOR_CONFIRMATION"
    review["paymentType"] = payment_type
    review["paymentTypeLabel"] = PAYMENT_TYPE_LABELS[payment_type]
    review["submitAction"]["effect"] = f"Creates AWAU {PAYMENT_TYPE_LABELS[payment_type].lower()} consent records for review only."

    if missing:
        answer = (
            f"I selected {PAYMENT_TYPE_LABELS[payment_type]} for this PSD2 PIS journey. "
            f"I still need: {', '.join(missing)}. "
            "I prepared an editable review table so you can complete the missing information before final confirmation. "
            f"{PAYMENT_SAFETY_NOTICE}"
        )
        trace_summary = "Payment journey selected; missing details remain."
    else:
        answer = (
            f"I selected {PAYMENT_TYPE_LABELS[payment_type]} and prepared an editable PIS payment review table. "
            "Review the details and use the submit button to create AWAU consent records for review only. "
            f"{PAYMENT_SAFETY_NOTICE}"
        )
        trace_summary = "Payment journey selected; review table is ready for final confirmation."

    tool_calls = [
        {"name": "pis_start_payment_journey", "capability": "PIS", "status": "success", "summary": "Payment journey selected."},
        {"name": "pis_prepare_payment_review", "capability": "PIS", "status": "success", "summary": trace_summary},
    ]
    return {
        "conversationId": state.conversationId,
        "answer": answer,
        "intent": "prepare_payment_drafts",
        "capabilityUsed": ["PIS"],
        "toolCalls": tool_calls,
        "pis": {"paymentIntentState": payment_state, "paymentReview": review},
        "paymentReview": review,
        "agentWorkbench": _agent_workbench(state, "Prepare payment", payment_state, tool_calls),
        "insights": [{"type": "payment_journey", "status": status, "paymentType": payment_type}],
        "suggestedActions": [{"label": "Submit final confirmation", "action": "SUBMIT_PIS_REVIEW"}] if not missing else [],
        "warnings": [],
        "safetyNotice": PAYMENT_SAFETY_NOTICE,
    }


def prepared_resources_from_consents(consents: list[dict[str, Any]]) -> list[dict[str, str]]:
    return [
        {
            "resourceType": consent.get("resourceType", "domestic-payment-consent"),
            "resourceId": consent.get("consentId") or f"consent-{uuid4().hex[:8]}",
            "status": consent.get("status", "AWAU"),
            "statusLabel": "AWAU - awaiting PSU authorisation",
        }
        for consent in consents
    ]
