from __future__ import annotations

import json
import logging
import re
from typing import Any

from .financial_assistant_service import handle_financial_assistant_message, normalize_assistant_response, route_intent
from .financial_constants import DEMO_TODAY, DEMO_USER_ID, PAYMENT_SAFETY_NOTICE
from .financial_consent_journey_service import (
    build_consent_workbench,
    get_consent_journey,
    get_stored_consent_journey,
    has_valid_ais_consent,
    mark_journey_resumed,
    start_ais_consent_journey,
)
from .financial_conversation_store import FinancialConversationState, get_or_create_conversation
from .financial_llm_client import FinancialLLMClient
from .financial_mock_payment_service import (
    activate_variable_recurring_payment,
    execute_immediate_payment,
    schedule_domestic_payment,
)
from .financial_payment_journey_service import (
    build_agent_workbench_from_response,
    handle_payment_journey_message,
    is_payment_journey_message,
)
from .financial_tool_executor import TOOL_SCHEMAS, execute_financial_tool, tool_schemas_for_names

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are a PSD2 Open Banking assistant for a demo platform.
The platform supports only two capabilities:
1. AIS - Account Information Service
2. PIS - Payment Initiation Service
Use AIS tools for accounts, balances, transactions, spending analysis, subscription detection, and upcoming bill detection.
If an AIS request needs account, balance, transaction, spending, subscription, or bill data and the conversation has no AUTH AIS consent, call ais_start_consent_journey first. Do not call protected AIS data tools until AIS consent is AUTH.
For PIS, guide the user through payment consent preparation.
Before preparing a PIS consent, identify the payment journey type:
1. Immediate domestic payment
2. Scheduled domestic payment
3. Variable recurring payment
If the payment type is missing, ask the user to choose one.
If payment details are missing, ask only for the missing details.
You must not invent account data, balances, transactions, merchants, bill amounts, or payment statuses.
You must not calculate financial metrics yourself when an AIS analysis tool is available.
For direct "how much did I spend this month" questions, use ais_get_transactions with the current demo month date range and answer from those returned transactions. You may sum debit transactions from the tool result for this direct total because there is no separate monthly-total AIS tool.
You must not execute, submit, approve, or complete payments.
If the user asks to pay, send, submit, approve, execute, or transfer money, explain that this MVP only supports preparing consent resources for review.
When calling PIS tools for a user-requested payment or consent action, pass explicit_user_request=true. Use your language understanding to handle common user typos in the request.
Whenever a PIS consent is prepared, clearly state: "No payment has been executed."
A consent with status AWAU means it is awaiting PSU authorisation.
Do not reveal hidden reasoning. You may provide a structured Agent Workbench containing intent, selected capability, missing information, control checks, tool trace, and prepared resource status.
For every new user turn, first call exactly one tool to commit to the route. Use general_response only when the request is not AIS or PIS."""


EXPECTED_TOOLS_BY_INTENT: dict[str, set[str]] = {
    "analyze_spending_change": {"ais_analyze_spending_change"},
    "detect_subscriptions": {"ais_detect_subscriptions"},
    "detect_upcoming_bills": {"ais_detect_upcoming_bills", "ais_get_balances"},
    "prepare_payment_drafts": {
        "pis_start_payment_journey",
        "pis_prepare_payment_review",
        "pis_prepare_domestic_payment_consent",
        "pis_prepare_domestic_scheduled_payment_consent",
        "pis_prepare_domestic_vrp_consent",
    },
    "list_accounts": {"ais_list_accounts", "ais_get_balances"},
    "get_transactions": {"ais_get_transactions"},
}

AIS_INTENTS = {
    "analyze_spending_change",
    "detect_subscriptions",
    "detect_upcoming_bills",
    "list_accounts",
    "get_transactions",
}

TOOL_INTENT_BY_NAME = {
    "ais_list_accounts": "list_accounts",
    "ais_get_balances": "list_accounts",
    "ais_get_transactions": "get_transactions",
    "ais_analyze_spending_change": "analyze_spending_change",
    "ais_detect_subscriptions": "detect_subscriptions",
    "ais_detect_upcoming_bills": "detect_upcoming_bills",
    "ais_start_consent_journey": "llm_agent",
    "pis_start_payment_journey": "prepare_payment_drafts",
    "pis_prepare_payment_review": "prepare_payment_drafts",
    "pis_prepare_domestic_payment_consent": "prepare_payment_drafts",
    "pis_prepare_domestic_scheduled_payment_consent": "prepare_payment_drafts",
    "pis_prepare_domestic_vrp_consent": "prepare_payment_drafts",
    "pis_get_domestic_payment_consent_status": "prepare_payment_drafts",
    "general_response": "help",
}


def _looks_like_pis_request(message: str) -> bool:
    normalized = message.lower()
    patterns = [
        r"\bprepare\b",
        r"\bpayment\b",
        r"\bpay\b",
        r"\btransfer\b",
        r"\btranfer\b",
        r"\bsend\b",
        r"\bpis\b",
        r"\binitiation\b",
        r"\bconsent\b",
        r"\bsgd\b",
        r"\bs\$\b",
    ]
    return any(re.search(pattern, normalized) for pattern in patterns)


def _preview(value: Any, max_len: int = 500) -> str | None:
    if value is None:
        return None
    compact = " ".join(str(value).split())
    return compact if len(compact) <= max_len else f"{compact[:max_len]}..."


def _tool_schemas_for_intent(intent: str) -> list[dict[str, Any]]:
    allowed_tools = EXPECTED_TOOLS_BY_INTENT.get(intent)
    if not allowed_tools:
        return TOOL_SCHEMAS
    return tool_schemas_for_names(allowed_tools)


def _allowed_tools_for_runtime(intent: str, state: FinancialConversationState) -> set[str] | None:
    if intent == "help":
        return set()
    if intent in AIS_INTENTS and not has_valid_ais_consent(state):
        return {"ais_start_consent_journey"}
    return EXPECTED_TOOLS_BY_INTENT.get(intent)


def _tool_schemas_for_runtime(intent: str, state: FinancialConversationState) -> list[dict[str, Any]]:
    allowed_tools = _allowed_tools_for_runtime(intent, state)
    if allowed_tools is None:
        return TOOL_SCHEMAS
    return tool_schemas_for_names(allowed_tools)


def _ais_consent_required_response(
    message: str,
    state: FinancialConversationState,
    intent: str,
) -> dict[str, Any]:
    journey = start_ais_consent_journey(
        conversation_id=state.conversationId,
        user_id=state.userId,
        original_message=message,
    )
    answer = (
        "I can answer that using AIS account information, balances, and transaction data, "
        "but I need your consent first. Continue to Demo Bank to authorise this simulated "
        "PSD2 AIS consent."
    )
    return {
        "conversationId": state.conversationId,
        "answer": answer,
        "intent": intent,
        "capabilityUsed": ["AIS"],
        "toolCalls": [
            {
                "name": "ais_start_consent_journey",
                "capability": "AIS",
                "status": "success",
                "summary": "AIS consent journey started before protected chat data access.",
            }
        ],
        "ais": {},
        "pis": {},
        "consentJourney": journey,
        "agentWorkbench": build_consent_workbench(
            journey=journey,
            intent_label="AIS consent required",
            capability="AIS",
            reason="AIS consent is required before retrieving account, balance, or transaction data.",
        ),
        "insights": [],
        "suggestedActions": [
            {"label": "Grant AIS Consent", "action": "GRANT_AIS_CONSENT", "payload": journey}
        ],
        "warnings": [],
    }


def _answer_asks_for_known_demo_inputs(answer: str, intent: str) -> bool:
    if intent == "help":
        return False
    normalized = answer.lower()
    blocked_phrases = [
        "your name or user id",
        "who you are",
        "which two months",
        "let me know your name",
        "let me know and i'll get",
    ]
    return any(phrase in normalized for phrase in blocked_phrases)


def _structured_transactions_answer(response: dict[str, Any]) -> str:
    transactions = response.get("ais", {}).get("transactions") or response.get("transactions") or []
    if not transactions:
        return "I could not find recent AIS transactions in the mock bank data."
    latest = transactions[0]
    currency = latest.get("currency", "SGD")
    total_debits = round(
        sum(float(transaction.get("amount", 0)) for transaction in transactions if transaction.get("direction") == "debit"),
        2,
    )
    return (
        f"I found {len(transactions)} recent AIS transactions. "
        f"The latest is {latest.get('merchant')} on {latest.get('date')} for "
        f"{currency} {float(latest.get('amount', 0)):,.2f}. "
        f"Total debits in this view are {currency} {total_debits:,.2f}. "
        "The transaction details are shown below."
    )


def _money(amount: Any, currency: str = "SGD") -> str:
    return f"{currency} {float(amount or 0):,.2f}"


def _structured_spending_answer(response: dict[str, Any]) -> str | None:
    analysis = response.get("ais", {}).get("spendingAnalysis") or response.get("spendingComparison")
    if not analysis:
        return None
    currency = analysis.get("currency", "SGD")
    direction = "increased" if float(analysis.get("increaseAmount", 0)) >= 0 else "decreased"
    top_drivers = analysis.get("topDrivers", [])[:3]
    driver_text = "; ".join(
        f"{driver.get('category')}: {_money(driver.get('changeAmount'), currency)} ({driver.get('changePercent')}%)"
        for driver in top_drivers
    )
    driver_sentence = f"The main drivers are {driver_text}. " if driver_text else ""
    return (
        f"Your spending {direction} by {_money(abs(float(analysis.get('increaseAmount', 0))), currency)} "
        f"in {analysis.get('currentMonth')} compared with {analysis.get('previousMonth')}. "
        f"Current spending was {_money(analysis.get('totalCurrent'), currency)} versus "
        f"{_money(analysis.get('totalPrevious'), currency)} previously. "
        f"{driver_sentence}Related transactions are shown below."
    )


def _structured_bills_answer(response: dict[str, Any]) -> str | None:
    bills_result = response.get("ais", {}).get("upcomingBills")
    if not bills_result:
        return None
    bills = bills_result.get("upcomingBills", [])
    if not bills:
        return "I did not find any recurring bills due in the next demo week."
    currency = bills_result.get("currency", bills[0].get("currency", "SGD"))
    highest = max(bills, key=lambda bill: float(bill.get("amount", 0)))
    covered_count = sum(1 for bill in bills if bill.get("balanceCheck") == "sufficient_funds")
    return (
        f"I found {len(bills)} bills due between {bills_result.get('windowStart')} and "
        f"{bills_result.get('windowEnd')}, totaling {_money(bills_result.get('totalDue'), currency)}. "
        f"The largest bill is {highest.get('merchant')} at {_money(highest.get('amount'), currency)}, "
        f"due on {highest.get('estimatedDueDate')}. "
        f"{covered_count} of {len(bills)} bills are marked as covered by available balance. "
        "The bill details are shown below."
    )


def _structured_subscriptions_answer(response: dict[str, Any]) -> str | None:
    subscription_result = response.get("ais", {}).get("subscriptions")
    if not subscription_result:
        return None
    subscriptions = subscription_result.get("subscriptions", [])
    if not subscriptions:
        return "I did not find likely recurring subscriptions in the mock AIS transaction data."
    currency = subscription_result.get("currency", subscriptions[0].get("currency", "SGD"))
    names = ", ".join(subscription.get("merchant", "Unknown") for subscription in subscriptions[:5])
    return (
        f"I found {len(subscriptions)} likely recurring payments, with an estimated monthly total of "
        f"{_money(subscription_result.get('monthlyTotal'), currency)}. "
        f"The main recurring merchants are {names}. Subscription details are shown below."
    )


def _structured_pis_answer(response: dict[str, Any]) -> str | None:
    payment_state = response.get("pis", {}).get("paymentIntentState") or {}
    if payment_state and not response.get("pis", {}).get("paymentReview") and not response.get("pis", {}).get("domesticPaymentConsents"):
        if payment_state.get("status") == "payment_type_required":
            return (
                "I can help prepare a PSD2 PIS payment consent journey. What kind of payment would you like to prepare?\n\n"
                "1. Immediate domestic payment\n"
                "2. Scheduled domestic payment\n"
                "3. Variable recurring payment\n\n"
                f"I will only prepare consent details for review. {PAYMENT_SAFETY_NOTICE}"
            )
        if payment_state.get("status") == "blocked":
            return (
                "I cannot execute, submit, approve, or complete payments in this MVP. "
                "I can only prepare PSD2 PIS consent details for review. "
                f"{PAYMENT_SAFETY_NOTICE}"
            )
    review = response.get("pis", {}).get("paymentReview")
    if review:
        editable = review.get("editableNotice", "Editable payment details must be reviewed by the user.")
        if review.get("canSubmit"):
            return (
                f"I prepared an editable PIS payment review table with {review.get('count', 0)} row(s). "
                "Payee and amount are available from known context, but you can still edit the payment details before submitting. "
                f"{editable} Use the submit button in the table to create AWAU consent records for review only. "
                f"{PAYMENT_SAFETY_NOTICE}"
            )
        missing = ", ".join(review.get("missingFields") or ["payee", "amount"])
        return (
            f"I prepared an editable PIS payment review table, but it still needs: {missing}. "
            "I left unknown fields blank for manual input. "
            f"{editable} Use the submit button after completing the required fields. "
            f"{PAYMENT_SAFETY_NOTICE}"
        )
    consents = response.get("pis", {}).get("domesticPaymentConsents") or []
    if not consents:
        return None
    currency = consents[0].get("currency", "SGD")
    total = sum(float(consent.get("amount", 0)) for consent in consents)
    return (
        f"I prepared {len(consents)} domestic payment consent records for review, totaling {_money(total, currency)}. "
        "Each consent is in AWAU status, meaning it is awaiting PSU authorisation. "
        f"{PAYMENT_SAFETY_NOTICE}"
    )


def _normalise_vrp_controls(control_parameters: dict[str, Any] | None, amount: Any) -> dict[str, Any]:
    controls = control_parameters or {}
    max_individual = controls.get("maxIndividualAmount")
    max_cumulative = controls.get("maxCumulativeAmount")
    if not max_individual:
        max_individual = controls.get("MaximumIndividualAmount", {}).get("Amount")
    if not max_cumulative:
        max_cumulative = controls.get("MaximumCumulativeAmount", {}).get("Amount")
    numeric_amount = float(amount or 0)
    return {
        "maxIndividualAmount": float(max_individual or numeric_amount),
        "maxCumulativeAmount": float(max_cumulative or numeric_amount * 3),
        "periodType": controls.get("periodType") or controls.get("PeriodType") or "month",
        "validFrom": controls.get("validFrom") or controls.get("ValidFromDateTime"),
        "validTo": controls.get("validTo") or controls.get("ValidToDateTime") or "2026-12-31",
    }


def _mock_payments_after_pis_authorisation(
    journey: dict[str, Any],
    state: FinancialConversationState,
) -> list[dict[str, Any]]:
    if journey.get("mockPaymentResults"):
        return journey["mockPaymentResults"]

    payment_type = journey.get("display", {}).get("paymentType") or state.paymentIntentState.get("paymentType") or "immediate_domestic"
    payments = journey.get("display", {}).get("paymentSummary", {}).get("payments", [])
    results: list[dict[str, Any]] = []
    for payment in payments:
        common = {
            "user_id": state.userId,
            "debtor_account_id": payment.get("debtorAccountId") or state.paymentIntentState.get("collectedDetails", {}).get("debtorAccountId") or "",
            "payee": payment.get("payee") or payment.get("merchant") or payment.get("creditorName") or "",
            "amount": payment.get("amount"),
            "currency": payment.get("currency", "SGD"),
            "remittance_information": payment.get("remittanceInformation") or payment.get("reference"),
        }
        if payment_type == "scheduled_domestic":
            results.append(
                schedule_domestic_payment(
                    **common,
                    scheduled_date=payment.get("dueDate") or payment.get("requestedExecutionDateTime", "")[:10],
                )
            )
        elif payment_type == "variable_recurring":
            results.append(
                activate_variable_recurring_payment(
                    **common,
                    control_parameters=_normalise_vrp_controls(payment.get("controlParameters"), payment.get("amount")),
                )
            )
        else:
            results.append(execute_immediate_payment(**common))

    journey["mockPaymentResults"] = results
    return results


def _pis_authorisation_answer(payment_type: str, mock_payments: list[dict[str, Any]]) -> str:
    total = round(sum(float(payment.get("amount", 0)) for payment in mock_payments), 2)
    currency = mock_payments[0].get("currency", "SGD") if mock_payments else "SGD"
    if payment_type == "scheduled_domestic":
        return (
            f"Payment consent authorised. I scheduled {len(mock_payments)} mock payment(s) totaling {currency} {total:,.2f}. "
            "No balance has changed yet because these are scheduled payments."
        )
    if payment_type == "variable_recurring":
        return (
            f"Payment consent authorised. I activated {len(mock_payments)} mock VRP arrangement(s). "
            "No balance has changed by creating the VRP arrangement."
        )
    return (
        f"Payment consent authorised. I executed {len(mock_payments)} immediate mock payment(s) totaling {currency} {total:,.2f}. "
        "AIS balances and transactions now reflect the updated mock source data."
    )


def _structured_consent_answer(response: dict[str, Any]) -> str | None:
    journey = response.get("agentWorkbench", {}).get("consentJourney") or response.get("consentJourney")
    if not journey:
        return None
    if journey.get("type") == "AIS_CONSENT" and journey.get("consentStatus") == "AWAU":
        return (
            "I can answer that using AIS account information, balances, and transaction data, "
            "but I need your consent first. Continue to Demo Bank to authorise this simulated "
            "PSD2 AIS consent."
        )
    if journey.get("type") == "PIS_CONSENT" and journey.get("consentStatus") == "AWAU":
        return (
            "The payment consent is ready for Demo Bank authorisation. "
            "Authorise it at Demo Bank to continue the simulated PSD2 PIS consent journey. "
            f"{PAYMENT_SAFETY_NOTICE}"
        )
    return None


def _structured_accounts_answer(response: dict[str, Any]) -> str | None:
    accounts = response.get("ais", {}).get("accounts") or response.get("accounts") or []
    balances = response.get("ais", {}).get("balances") or response.get("balances") or []
    if not accounts:
        return None
    currency = accounts[0].get("currency", "SGD")
    total = sum(float(account.get("availableBalance", 0)) for account in accounts)
    balance_text = f" I also retrieved {len(balances)} AIS balance records." if balances else ""
    return (
        f"I found {len(accounts)} AIS accounts for the demo user with total available balance of "
        f"{_money(total, currency)}.{balance_text} Account details are shown in the dashboard."
    )


def _contains_markdown_table(answer: str) -> bool:
    lines = [line.strip() for line in answer.splitlines()]
    return any(line.startswith("|") and line.endswith("|") and line.count("|") >= 2 for line in lines)


def _structured_answer_for_intent(intent: str, response: dict[str, Any]) -> str | None:
    consent_answer = _structured_consent_answer(response)
    if consent_answer:
        return consent_answer
    existing_answer = response.get("answer", "")
    if existing_answer and intent == "analyze_spending_change":
        return None
    if existing_answer and intent == "list_accounts":
        return None
    if intent == "get_transactions" and existing_answer and any(
        marker in existing_answer.lower()
        for marker in ["total spending", "spending summary", "total debits"]
    ):
        return None
    if intent == "get_transactions" and existing_answer and not _contains_markdown_table(existing_answer):
        return None
    if intent in {"detect_upcoming_bills", "detect_subscriptions"} and existing_answer and not _contains_markdown_table(existing_answer):
        return None
    builders = {
        "analyze_spending_change": _structured_spending_answer,
        "detect_upcoming_bills": _structured_bills_answer,
        "detect_subscriptions": _structured_subscriptions_answer,
        "prepare_payment_drafts": _structured_pis_answer,
        "list_accounts": _structured_accounts_answer,
        "get_transactions": _structured_transactions_answer,
    }
    builder = builders.get(intent)
    return builder(response) if builder else None


def _intent_from_tool_calls(response: dict[str, Any]) -> str:
    successful_intents = [
        TOOL_INTENT_BY_NAME.get(call.get("name"))
        for call in response.get("toolCalls", [])
        if call.get("status") == "success"
    ]
    for preferred in (
        "prepare_payment_drafts",
        "analyze_spending_change",
        "detect_upcoming_bills",
        "detect_subscriptions",
        "get_transactions",
        "list_accounts",
    ):
        if preferred in successful_intents:
            return preferred
    return response.get("intent") or "llm_agent"


def _tool_result_summary(tool_name: str, tool_result: dict[str, Any]) -> dict[str, Any]:
    result = tool_result.get("result") or {}
    summary: dict[str, Any] = {
        "tool": tool_name,
        "capability": tool_result.get("capability"),
        "standard": tool_result.get("standard"),
        "resultKeys": list(result.keys()) if isinstance(result, dict) else None,
    }
    if tool_name == "ais_analyze_spending_change":
        summary.update(
            {
                "currentMonth": result.get("currentMonth"),
                "previousMonth": result.get("previousMonth"),
                "increaseAmount": result.get("increaseAmount"),
                "topDrivers": [
                    {
                        "category": driver.get("category"),
                        "changeAmount": driver.get("changeAmount"),
                        "changePercent": driver.get("changePercent"),
                    }
                    for driver in result.get("topDrivers", [])[:3]
                ],
            }
        )
    elif tool_name == "ais_detect_upcoming_bills":
        summary.update({"count": result.get("count"), "totalDue": result.get("totalDue")})
    elif tool_name == "ais_detect_subscriptions":
        summary.update({"count": result.get("count"), "monthlyTotal": result.get("monthlyTotal")})
    elif tool_name == "ais_get_transactions":
        summary.update({"count": result.get("count")})
    elif tool_name == "ais_list_accounts":
        summary.update({"count": result.get("count")})
    elif tool_name == "ais_get_balances":
        summary.update({"totalAvailableBalance": result.get("totalAvailableBalance")})
    elif tool_name == "ais_start_consent_journey":
        summary.update(
            {
                "journeyId": result.get("journeyId"),
                "consentStatus": result.get("consentStatus"),
                "redirectReady": bool(result.get("redirectUrl")),
            }
        )
    elif tool_name == "pis_start_payment_journey":
        summary.update({"status": result.get("status"), "missingFields": result.get("missingFields")})
    elif tool_name in {
        "pis_prepare_domestic_payment_consent",
        "pis_prepare_domestic_scheduled_payment_consent",
        "pis_prepare_domestic_vrp_consent",
    }:
        summary.update({"count": result.get("count"), "status": result.get("status")})
    elif tool_name == "pis_prepare_payment_review":
        summary.update({"count": result.get("count"), "status": result.get("status"), "missingFields": result.get("missingFields")})
    return {key: value for key, value in summary.items() if value is not None}


def _merge_pis_journey_response(
    response: dict[str, Any],
    journey_response: dict[str, Any],
    selected_tool_name: str,
) -> None:
    existing_tool_calls = response.get("toolCalls", [])
    for key, value in journey_response.items():
        if key in {"toolCalls"}:
            continue
        response[key] = value
    response["toolCalls"] = existing_tool_calls
    workbench = response.get("agentWorkbench") or {}
    workbench["toolTrace"] = [
        {
            "label": f"LLM selected {call.get('name')}",
            "toolName": call.get("name"),
            "capability": call.get("capability", "PIS"),
            "status": call.get("status", "success"),
            "summary": "Backend policy/state machine prepared the visible PIS journey state.",
        }
        for call in existing_tool_calls
    ] or [
        {
            "label": f"LLM selected {selected_tool_name}",
            "toolName": selected_tool_name,
            "capability": "PIS",
            "status": "success",
            "summary": "Backend policy/state machine prepared the visible PIS journey state.",
        }
    ]
    response["agentWorkbench"] = workbench


def _pis_merge_message(user_message: str, tool_name: str, tool_args: dict[str, Any] | None) -> str:
    if tool_name != "pis_prepare_payment_review":
        return user_message
    args = tool_args or {}
    payee = args.get("payee")
    amount = args.get("amount")
    if not payee and amount is None:
        return user_message
    currency = args.get("currency") or "SGD"
    if payee and amount is not None:
        return f"transfer {currency} {amount} to {payee}"
    if payee:
        return f"transfer to {payee}"
    return f"transfer {currency} {amount}"


def _merge_tool_result(
    response: dict[str, Any],
    tool_name: str,
    tool_result: dict[str, Any],
    state: FinancialConversationState,
    user_message: str = "",
    tool_args: dict[str, Any] | None = None,
) -> None:
    capability = tool_result.get("capability")
    result = tool_result.get("result") or {}
    if tool_name == "ais_start_consent_journey":
        response.setdefault("capabilityUsed", [])
        if "AIS" not in response["capabilityUsed"]:
            response["capabilityUsed"].append("AIS")
        response["consentJourney"] = result
        response["agentWorkbench"] = build_consent_workbench(
            journey=result,
            intent_label="AIS consent required",
            capability="AIS",
            reason="The LLM selected an AIS consent journey before protected account, balance, or transaction access.",
        )
        response["agentWorkbench"]["toolTrace"] = [
            {
                "label": "LLM selected AIS consent journey",
                "toolName": "ais_start_consent_journey",
                "capability": "AIS",
                "status": "success",
                "summary": "Consent is required before protected AIS tool execution.",
            }
        ]
        response["suggestedActions"] = [
            {"label": "Grant AIS Consent", "action": "GRANT_AIS_CONSENT", "payload": result}
        ]
        return

    if capability == "AIS":
        response.setdefault("capabilityUsed", [])
        if "AIS" not in response["capabilityUsed"]:
            response["capabilityUsed"].append("AIS")
        ais = response.setdefault("ais", {})
        if tool_name == "ais_list_accounts":
            ais["accounts"] = result.get("accounts", tool_result.get("normalized"))
        elif tool_name == "ais_get_balances":
            ais["balances"] = result.get("balances", tool_result.get("normalized"))
        elif tool_name == "ais_get_transactions":
            ais["transactions"] = result.get("transactions", tool_result.get("normalized"))
        elif tool_name == "ais_analyze_spending_change":
            ais["spendingAnalysis"] = result
            response["spendingComparison"] = result
            response["transactions"] = result.get("relatedTransactions", [])
        elif tool_name == "ais_detect_subscriptions":
            ais["subscriptions"] = result
            response["subscriptions"] = result.get("subscriptions", [])
        elif tool_name == "ais_detect_upcoming_bills":
            ais["upcomingBills"] = result
            response["upcomingBills"] = result.get("upcomingBills", [])
        state.lastAisResults.update({key: value for key, value in ais.items() if value})

    if capability == "PIS":
        journey_response = handle_payment_journey_message(_pis_merge_message(user_message, tool_name, tool_args), state)
        _merge_pis_journey_response(response, journey_response, tool_name)
        state.lastPisResults.update(response.get("pis", {}))
        return
        response.setdefault("capabilityUsed", [])
        if "PIS" not in response["capabilityUsed"]:
            response["capabilityUsed"].append("PIS")
        pis = response.setdefault("pis", {})
        if tool_name == "pis_prepare_payment_review":
            pis["paymentReview"] = result
            response["paymentReview"] = result
            response["safetyNotice"] = result.get("safetyNotice", PAYMENT_SAFETY_NOTICE)
            state.lastPisResults.update(pis)
            return
        pis["domesticPaymentConsents"] = result.get("domesticPaymentConsents", tool_result.get("normalized") or [])
        response["domesticPaymentConsents"] = pis["domesticPaymentConsents"]
        response["paymentDrafts"] = [
            {
                "draftId": consent["consentId"],
                "consentId": consent["consentId"],
                "payee": consent["payee"],
                "amount": consent["amount"],
                "currency": consent["currency"],
                "dueDate": consent.get("dueDate"),
                "status": "REVIEW_REQUIRED",
                "consentStatus": consent["status"],
                "executionStatus": "Not Executed",
            }
            for consent in pis["domesticPaymentConsents"]
        ]
        response["safetyNotice"] = result.get("safetyNotice", PAYMENT_SAFETY_NOTICE)
        state.lastPisResults.update(pis)

    if capability == "General":
        response.setdefault("capabilityUsed", [])
        if "General" not in response["capabilityUsed"]:
            response["capabilityUsed"].append("General")


def _fallback(message: str, user_id: str, conversation_id: str | None, warning: str | None = None) -> dict[str, Any]:
    if warning:
        logger.warning("financial.agent fallback conversationId=%s reason=%s", conversation_id, warning)
    else:
        logger.info("financial.agent fallback conversationId=%s reason=llm_not_configured_or_disabled", conversation_id)
    state = get_or_create_conversation(conversation_id, user_id)
    intent = route_intent(message)
    if intent in AIS_INTENTS and not has_valid_ais_consent(state):
        response = _ais_consent_required_response(message, state, intent)
    elif intent == "prepare_payment_drafts" or (state.paymentIntentState and is_payment_journey_message(message, state)):
        response = handle_payment_journey_message(message, state)
    else:
        response = handle_financial_assistant_message(message, user_id, conversation_id)
    if response.get("ais"):
        state.lastAisResults.update({key: value for key, value in response["ais"].items() if value})
    if response.get("pis"):
        state.lastPisResults.update({key: value for key, value in response["pis"].items() if value})
    if warning:
        response.setdefault("warnings", []).append(warning)
    response.setdefault("agentWorkbench", build_agent_workbench_from_response(response))
    return response


async def resume_after_consent(
    conversation_id: str,
    journey_id: str,
    user_id: str = DEMO_USER_ID,
    llm_client: FinancialLLMClient | None = None,
) -> dict[str, Any]:
    state = get_or_create_conversation(conversation_id, user_id)
    journey = get_consent_journey(journey_id)
    if not journey:
        raise ValueError("Unknown consent journey.")

    if journey.get("consentStatus") != "AUTH":
        answer = (
            "The consent was not authorised, so I will not access protected AIS data or continue PIS authorisation. "
            f"Current consent status: {journey.get('consentStatus', 'unknown')}."
        )
        return {
            "conversationId": state.conversationId,
            "answer": answer,
            "intent": "consent_result",
            "capabilityUsed": [journey.get("capability", "General")],
            "toolCalls": [],
            "ais": {},
            "pis": {},
            "consentJourney": journey,
            "agentWorkbench": build_consent_workbench(
                journey=journey,
                intent_label="Consent result",
                capability=journey.get("capability", "General"),
                reason="The consent journey did not authorise protected access.",
            ),
            "insights": [],
            "suggestedActions": [],
            "warnings": ["Consent was not authorised."],
        }

    resumed_journey = mark_journey_resumed(journey_id)
    if resumed_journey["type"] == "AIS_CONSENT":
        state.aisConsentId = resumed_journey["consentId"]
        state.aisConsentStatus = "AUTH"
        original_message = resumed_journey.get("pendingUserIntent", {}).get("originalMessage") or "Show my recent transactions."
        response = await handle_financial_agent_message(
            original_message,
            state.userId,
            state.conversationId,
            llm_client=llm_client,
        )
        response["answer"] = f"AIS consent authorised. I’ll continue with your request. {response['answer']}"
        response["consentJourney"] = resumed_journey
        response.setdefault("agentWorkbench", build_agent_workbench_from_response(response, state))
        response["agentWorkbench"]["consentJourney"] = resumed_journey
        if response.get("ais"):
            state.lastAisResults.update({key: value for key, value in response["ais"].items() if value})
        return response

    stored_journey = get_stored_consent_journey(journey_id) or resumed_journey
    payments = resumed_journey.get("display", {}).get("paymentSummary", {}).get("payments", [])
    mock_payments = _mock_payments_after_pis_authorisation(stored_journey, state)
    resumed_journey["mockPaymentResults"] = mock_payments
    payment_type = resumed_journey.get("display", {}).get("paymentType") or state.paymentIntentState.get("paymentType") or "immediate_domestic"
    state.lastPisResults["domesticPaymentConsents"] = payments
    state.lastPisResults["mockPayments"] = mock_payments
    state.paymentIntentState = {
        **state.paymentIntentState,
        "status": "payment_executed" if payment_type == "immediate_domestic" else "payment_scheduled" if payment_type == "scheduled_domestic" else "vrp_active",
        "paymentType": payment_type,
        "paymentTypeLabel": resumed_journey.get("display", {}).get("paymentTypeLabel"),
    }
    response = {
        "conversationId": state.conversationId,
        "answer": _pis_authorisation_answer(payment_type, mock_payments),
        "intent": "consent_result",
        "capabilityUsed": ["PIS"],
        "toolCalls": [
            {
                "name": "pis_get_payment_consent_status",
                "capability": "PIS",
                "status": "success",
                "summary": "PIS consent status returned from Demo Bank callback.",
            },
            {
                "name": "mock_bank_execute_payment" if payment_type == "immediate_domestic" else "mock_bank_schedule_payment" if payment_type == "scheduled_domestic" else "mock_bank_activate_vrp",
                "capability": "PIS",
                "status": "success",
                "summary": "Mock bank payment API called after PIS consent authorisation.",
            }
        ],
        "ais": {},
        "pis": {
            "domesticPaymentConsents": payments,
            "mockPayments": mock_payments,
            "paymentIntentState": state.paymentIntentState,
        },
        "mockPayments": mock_payments,
        "consentJourney": resumed_journey,
        "agentWorkbench": build_consent_workbench(
            journey=resumed_journey,
            intent_label="PIS consent result",
            capability="PIS",
            reason="PIS consent was authorised at Demo Bank before the mock payment API was called.",
        ),
        "insights": [],
        "suggestedActions": [],
        "warnings": [],
        "safetyNotice": "" if payment_type == "immediate_domestic" else "No balance was changed by this mock scheduled or VRP arrangement.",
    }
    response["agentWorkbench"]["preparedResources"] = resumed_journey.get("preparedResources", [])
    response["agentWorkbench"]["toolTrace"] = response["toolCalls"]
    return response


async def handle_financial_agent_message(
    message: str,
    user_id: str = DEMO_USER_ID,
    conversation_id: str | None = None,
    llm_client: FinancialLLMClient | None = None,
) -> dict[str, Any]:
    state = get_or_create_conversation(conversation_id, user_id)
    state.explicitPisRequest = _looks_like_pis_request(message)
    fallback_intent = route_intent(message)
    ais_consent_status = "AUTH" if has_valid_ais_consent(state) else "missing"

    llm = llm_client or FinancialLLMClient()
    logger.info(
        "financial.agent start conversationId=%s userId=%s llmConfigured=%s",
        state.conversationId,
        user_id,
        llm.is_configured,
    )
    if not llm.is_configured:
        return _fallback(message, user_id, state.conversationId)

    messages: list[dict[str, Any]] = [
        {
            "role": "system",
            "content": (
                f"{SYSTEM_PROMPT}\n\n"
                f"Demo defaults: userId is {user_id}. For spending comparison, use the backend tool defaults "
                "unless the user explicitly names months. Do not ask for a name, user ID, or comparison months "
                "for demo prompt chips. You must decide the user intent yourself from the conversation and "
                "select the appropriate AIS/PIS tool. For a general non-AIS/PIS question, call general_response. "
                f"AIS consent status for this conversation is {ais_consent_status}. "
                f"The current demo date is {DEMO_TODAY.isoformat()}; for current-month transaction questions, "
                f"use from_date={DEMO_TODAY.replace(day=1).isoformat()} and to_date={DEMO_TODAY.isoformat()} unless the user asks for a full calendar month. "
                "If AIS consent is missing and the user asks for protected AIS account, balance, transaction, "
                "spending, subscription, or bill data, call ais_start_consent_journey. "
                f"Current payment journey state: {json.dumps(state.paymentIntentState, default=str)}."
            ),
        }
    ]
    messages.extend(state.messages[-8:])
    messages.append({"role": "user", "content": message})

    response: dict[str, Any] = normalize_assistant_response(
        {"answer": "", "insights": [], "suggestedActions": []},
        "llm_agent",
        user_id,
        state.conversationId,
    )
    response["toolCalls"] = []
    response["capabilityUsed"] = []
    response.pop("agentWorkbench", None)

    try:
        allowed_tools = None
        tool_schemas = TOOL_SCHEMAS
        logger.info(
            "financial.agent llm_orchestration conversationId=%s fallbackIntent=%s aisConsent=%s allowedTools=%s",
            state.conversationId,
            fallback_intent,
            ais_consent_status,
            "all",
        )
        for round_index in range(2):
            logger.info(
                "financial.agent llm_round_start conversationId=%s round=%s messageCount=%s toolSchemas=%s",
                state.conversationId,
                round_index + 1,
                len(messages),
                [schema.get("function", {}).get("name") for schema in tool_schemas],
            )
            reply = await llm.chat(
                messages,
                tool_schemas,
                trace_label=f"{state.conversationId}:round-{round_index + 1}",
                require_tool_call=round_index == 0,
            )
            logger.info(
                "financial.agent llm_round_reply conversationId=%s round=%s contentPreview=%r toolCalls=%s",
                state.conversationId,
                round_index + 1,
                _preview(reply.content),
                [{"name": call.name, "args": sorted(call.arguments.keys())} for call in reply.tool_calls],
            )
            if not reply.tool_calls:
                if round_index == 0:
                    raise RuntimeError("LLM did not call the required routing tool.")
                response["answer"] = reply.content or response["answer"]
                break
            messages.append(reply.raw_message)
            consent_tool_executed = False
            for call in reply.tool_calls:
                logger.info(
                    "financial.agent tool_call conversationId=%s round=%s tool=%s args=%s",
                    state.conversationId,
                    round_index + 1,
                    call.name,
                    sorted(call.arguments.keys()),
                )
                try:
                    if call.name == "ais_start_consent_journey":
                        call.arguments["conversation_id"] = state.conversationId
                        call.arguments["original_message"] = call.arguments.get("original_message") or message
                    if call.name in {"pis_start_payment_journey", "pis_prepare_payment_review"}:
                        call.arguments["message"] = call.arguments.get("message") or message
                    tool_result = execute_financial_tool(call.name, call.arguments, state)
                    status = "success"
                    logger.info(
                        "financial.agent tool_result conversationId=%s tool=%s summary=%s",
                        state.conversationId,
                        call.name,
                        _tool_result_summary(call.name, tool_result),
                    )
                except Exception as exc:
                    tool_result = {"error": str(exc)}
                    status = "failed"
                    logger.exception(
                        "financial.agent tool_failed conversationId=%s tool=%s",
                        state.conversationId,
                        call.name,
                    )
                capability = "PIS" if call.name.startswith("pis_") else ("General" if call.name == "general_response" else "AIS")
                response.setdefault("toolCalls", []).append(
                    {"name": call.name, "capability": capability, "status": status}
                )
                if status == "success":
                    _merge_tool_result(response, call.name, tool_result, state, message, call.arguments)
                    consent_tool_executed = consent_tool_executed or call.name == "ais_start_consent_journey"
                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": call.id,
                        "name": call.name,
                        "content": json.dumps(tool_result, default=str),
                    }
                )
            if consent_tool_executed:
                break

        if not response.get("answer"):
            final = await llm.chat(
                messages
                + [
                    {
                        "role": "user",
                        "content": "Generate the final concise user-facing answer from the tool results. Include the payment safety notice when PIS was used.",
                    }
                ],
                None,
                trace_label=f"{state.conversationId}:final",
            )
            response["answer"] = final.content or "I retrieved the requested PSD2 AIS/PIS information."
            logger.info(
                "financial.agent final_llm_answer conversationId=%s answerPreview=%r",
                state.conversationId,
                _preview(response["answer"], 800),
            )
        selected_intent = _intent_from_tool_calls(response)
        response["intent"] = selected_intent
        structured_answer = _structured_answer_for_intent(selected_intent, response)
        if structured_answer:
            logger.info(
                "financial.agent structured_answer_override conversationId=%s intent=%s previousPreview=%r overridePreview=%r",
                state.conversationId,
                selected_intent,
                _preview(response.get("answer"), 500),
                _preview(structured_answer, 500),
            )
            response["answer"] = structured_answer
        if _answer_asks_for_known_demo_inputs(response.get("answer", ""), selected_intent):
            return _fallback(
                message,
                user_id,
                state.conversationId,
                "LLM asked for known demo inputs after tool execution; deterministic fallback used.",
            )
        if response.get("pis", {}).get("domesticPaymentConsents") and PAYMENT_SAFETY_NOTICE not in response["answer"]:
            response["answer"] = f"{response['answer']} {PAYMENT_SAFETY_NOTICE}"
        response.setdefault("agentWorkbench", build_agent_workbench_from_response(response, state))
    except Exception as exc:
        return _fallback(message, user_id, state.conversationId, f"LLM agent fallback used: {exc}")

    logger.info(
        "financial.agent complete conversationId=%s tools=%s capabilities=%s answerChars=%s",
        state.conversationId,
        [call.get("name") for call in response.get("toolCalls", [])],
        response.get("capabilityUsed", []),
        len(response.get("answer", "")),
    )
    state.messages.extend(
        [
            {"role": "user", "content": message},
            {"role": "assistant", "content": response["answer"]},
        ]
    )
    return response
