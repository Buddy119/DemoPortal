from __future__ import annotations

from typing import Any

from .financial_bill_service import detect_upcoming_bills
from .financial_constants import DEMO_USER_ID, PAYMENT_SAFETY_NOTICE
from .financial_conversation_store import get_or_create_conversation
from .financial_data_service import list_accounts, list_balances, list_transactions
from .financial_payment_journey_service import build_agent_workbench_from_response, handle_payment_journey_message
from .financial_pis_review_service import prepare_pis_payment_review
from .financial_recurring_service import detect_subscriptions
from .financial_spending_service import get_spending_comparison


def _money(amount: float, currency: str = "SGD") -> str:
    return f"{currency} {amount:,.2f}"


def route_intent(message: str) -> str:
    normalized = message.lower()
    pis_phrases = [
        "pis",
        "payment initiation",
        "payment consent",
        "make a payment",
        "make payment",
        "want to make a payment",
        "want to pay",
        "create a payment",
        "start a payment",
        "send money",
        "transfer money",
        "transfer ",
        "send ",
    ]
    if any(phrase in normalized for phrase in pis_phrases):
        return "prepare_payment_drafts"
    if "prepare" in normalized and ("payment" in normalized or "pay" in normalized):
        return "prepare_payment_drafts"
    if any(phrase in normalized for phrase in ["recent transaction", "transactions", "show my recent"]):
        return "get_transactions"
    if any(phrase in normalized for phrase in ["subscription", "recurring"]):
        return "detect_subscriptions"
    if any(phrase in normalized for phrase in ["bill", "pay this week", "due", "afford"]):
        return "detect_upcoming_bills"
    if any(
        phrase in normalized
        for phrase in [
            "spend more",
            "why did i spend",
            "how much i spend",
            "how much did i spend",
            "how much have i spent",
            "spend this month",
            "spent this month",
            "monthly spend",
            "monthly spending",
            "spending",
            "spent more",
        ]
    ):
        return "analyze_spending_change"
    if any(phrase in normalized for phrase in ["account", "balance"]):
        return "list_accounts"
    return "help"


def _spending_response(user_id: str) -> dict[str, Any]:
    result = get_spending_comparison(user_id)
    top = result["topDrivers"][:3]
    driver_sentence = " ".join(
        f"{driver['category']} changed by {_money(driver['changeAmount'], result['currency'])} ({driver['changePercent']}%)."
        for driver in top
    )
    if result["increaseAmount"] >= 0:
        answer = (
            f"Your latest completed-month spending increased by "
            f"{_money(result['increaseAmount'], result['currency'])} compared with {result['previousMonth']}. "
            f"Total spending was {_money(result['totalCurrent'], result['currency'])} in {result['currentMonth']} "
            f"versus {_money(result['totalPrevious'], result['currency'])} previously. {driver_sentence}"
        )
    else:
        answer = (
            f"Your latest completed-month spending decreased by "
            f"{_money(abs(result['increaseAmount']), result['currency'])} compared with {result['previousMonth']}."
        )

    return {
        "answer": answer,
        "insights": [
            {
                "type": "spending_increase",
                "category": driver["category"],
                "changePercent": driver["changePercent"],
                "changeAmount": driver["changeAmount"],
                "currency": result["currency"],
            }
            for driver in top
        ],
        "suggestedActions": [{"label": "Show related transactions", "action": "SHOW_TRANSACTIONS"}],
        "spendingComparison": result,
        "transactions": result["relatedTransactions"],
    }


def _subscription_response(user_id: str) -> dict[str, Any]:
    result = detect_subscriptions(user_id)
    names = ", ".join(item["merchant"] for item in result["subscriptions"][:6])
    answer = (
        f"I found {result['count']} likely recurring payments: {names}. "
        f"Together they represent about {_money(result['monthlyTotal'], result['currency'])} per month."
    )
    return {
        "answer": answer,
        "insights": [
            {
                "type": "subscription_summary",
                "count": result["count"],
                "monthlyTotal": result["monthlyTotal"],
                "currency": result["currency"],
            }
        ],
        "suggestedActions": [{"label": "Review upcoming bills", "action": "SHOW_UPCOMING_BILLS"}],
        "subscriptions": result["subscriptions"],
    }


def _upcoming_bills_response(user_id: str) -> dict[str, Any]:
    result = detect_upcoming_bills(user_id)
    bill_text = ", ".join(
        f"{bill['merchant']} on {bill['estimatedDueDate']}" for bill in result["upcomingBills"]
    )
    answer = (
        f"I found {result['count']} bills likely due between {result['windowStart']} and {result['windowEnd']}: "
        f"{bill_text}. Estimated total due is {_money(result['totalDue'], result['currency'])}."
    )
    return {
        "answer": answer,
        "insights": [
            {
                "type": "upcoming_bill_summary",
                "count": result["count"],
                "totalDue": result["totalDue"],
                "currency": result["currency"],
            }
        ],
        "suggestedActions": [{"label": "Prepare these payments for review", "action": "PREPARE_PAYMENT_DRAFTS"}],
        "upcomingBills": result["upcomingBills"],
        "accounts": list_accounts(user_id),
    }


def _payment_draft_response(user_id: str, message: str) -> dict[str, Any]:
    normalized = message.lower()
    bills = detect_upcoming_bills(user_id)["upcomingBills"] if any(
        phrase in normalized for phrase in ["these", "bills", "this week", "detected"]
    ) else None
    result = prepare_pis_payment_review(user_id, message, bills)
    answer = (
        f"Prepared an editable PIS payment review table with {result['count']} rows. "
        "Review and edit the payee, amount, due date, and remittance fields before final confirmation. "
        f"{PAYMENT_SAFETY_NOTICE}"
    )
    return {
        "answer": answer,
        "insights": [
            {
                "type": "payment_draft_summary",
                "count": result["count"],
                "status": result["status"],
            }
        ],
        "suggestedActions": [{"label": "Review PIS payment table", "action": "SHOW_PIS_PAYMENT_REVIEW"}],
        "paymentReview": result,
        "safetyNotice": result["safetyNotice"],
    }


def _transactions_response(user_id: str) -> dict[str, Any]:
    transactions = sorted(list_transactions(user_id), key=lambda item: item["date"], reverse=True)[:10]
    answer = "Here are your 10 most recent AIS transactions from the mock bank data. I’ve shown the transaction details below."
    return {
        "answer": answer,
        "insights": [{"type": "transaction_summary", "count": len(transactions), "currency": "SGD"}],
        "suggestedActions": [{"label": "Analyze spending change", "action": "ASK_SPENDING"}],
        "transactions": transactions,
    }


def _tool_trace_for_intent(intent: str) -> list[dict[str, str]]:
    mapping = {
        "analyze_spending_change": ("ais_analyze_spending_change", "AIS"),
        "detect_subscriptions": ("ais_detect_subscriptions", "AIS"),
        "detect_upcoming_bills": ("ais_detect_upcoming_bills", "AIS"),
        "prepare_payment_drafts": ("pis_prepare_payment_review", "PIS"),
        "list_accounts": ("ais_list_accounts", "AIS"),
        "get_transactions": ("ais_get_transactions", "AIS"),
        "help": ("general_assistant_response", "General"),
        "llm_agent": ("llm_agent", "General"),
    }
    name, capability = mapping.get(intent, ("general_assistant_response", "General"))
    return [{"name": name, "capability": capability, "status": "success"}]


def normalize_assistant_response(
    response: dict[str, Any],
    intent: str,
    user_id: str = DEMO_USER_ID,
    conversation_id: str | None = None,
) -> dict[str, Any]:
    ais: dict[str, Any] = {}
    pis: dict[str, Any] = {}
    if "accounts" in response:
        ais["accounts"] = response["accounts"]
    if "balances" in response:
        ais["balances"] = response["balances"]
    if "transactions" in response:
        ais["transactions"] = response["transactions"]
    if "spendingComparison" in response:
        ais["spendingAnalysis"] = response["spendingComparison"]
    if "subscriptions" in response:
        ais["subscriptions"] = {
            "subscriptions": response["subscriptions"],
            "count": len(response["subscriptions"]),
            "currency": response.get("currency", "SGD"),
        }
    if "upcomingBills" in response:
        ais["upcomingBills"] = {
            "upcomingBills": response["upcomingBills"],
            "count": len(response["upcomingBills"]),
            "totalDue": round(sum(float(bill.get("amount", 0)) for bill in response["upcomingBills"]), 2),
            "currency": response["upcomingBills"][0].get("currency", "SGD") if response["upcomingBills"] else "SGD",
        }
    if "paymentReview" in response:
        pis["paymentReview"] = response["paymentReview"]
    if "domesticPaymentConsents" in response:
        pis["domesticPaymentConsents"] = response["domesticPaymentConsents"]

    capability_used: list[str] = []
    if ais:
        capability_used.append("AIS")
    if pis or intent == "prepare_payment_drafts":
        capability_used.append("PIS")
    if not capability_used and intent in {"help", "llm_agent"}:
        capability_used.append("General")

    response.setdefault("answer", "")
    response.setdefault("insights", [])
    response.setdefault("suggestedActions", [])
    response.setdefault("warnings", [])
    response.setdefault("toolCalls", _tool_trace_for_intent(intent))
    response.setdefault("conversationId", conversation_id or f"conv-demo-{user_id}")
    response.setdefault("capabilityUsed", capability_used)
    response.setdefault("ais", ais)
    response.setdefault("pis", pis)
    response["intent"] = intent
    response.setdefault("agentWorkbench", build_agent_workbench_from_response(response))
    return response


def handle_financial_assistant_message(
    message: str,
    user_id: str = DEMO_USER_ID,
    conversation_id: str | None = None,
) -> dict[str, Any]:
    intent = route_intent(message)
    response: dict[str, Any]

    if intent == "prepare_payment_drafts":
        state = get_or_create_conversation(conversation_id, user_id)
        return handle_payment_journey_message(message, state)

    if intent == "analyze_spending_change":
        response = _spending_response(user_id)
    elif intent == "detect_subscriptions":
        response = _subscription_response(user_id)
    elif intent == "detect_upcoming_bills":
        response = _upcoming_bills_response(user_id)
    elif intent == "prepare_payment_drafts":
        response = _payment_draft_response(user_id, message)
    elif intent == "get_transactions":
        response = _transactions_response(user_id)
    elif intent == "list_accounts":
        accounts = list_accounts(user_id)
        total = sum(float(account["availableBalance"]) for account in accounts)
        response = {
            "answer": f"You have {len(accounts)} demo accounts with total available balance of {_money(total)}.",
            "insights": [{"type": "account_summary", "count": len(accounts), "totalBalance": round(total, 2), "currency": "SGD"}],
            "accounts": accounts,
            "balances": list_balances(user_id),
            "suggestedActions": [],
        }
    else:
        response = {
            "answer": (
                "I can analyze spending changes, detect subscriptions, identify bills due this week, "
                "or prepare safe payment drafts for review."
            ),
            "insights": [],
            "suggestedActions": [
                {"label": "Why did I spend more this month?", "action": "ASK_SPENDING"},
                {"label": "Which subscriptions am I paying for?", "action": "ASK_SUBSCRIPTIONS"},
                {"label": "What bills do I need to pay this week?", "action": "ASK_BILLS"},
            ],
        }

    return normalize_assistant_response(response, intent, user_id, conversation_id)
