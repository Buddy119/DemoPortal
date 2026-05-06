from __future__ import annotations

from typing import Any

from .financial_constants import DEMO_USER_ID
from .financial_conversation_store import FinancialConversationState
from .financial_policy_guard import validate_tool_call
from .financial_tools import (
    ais_analyze_spending_change,
    ais_detect_subscriptions,
    ais_detect_upcoming_bills,
    ais_get_balances,
    ais_get_transactions,
    ais_list_accounts,
    ais_start_consent_journey,
    pis_get_domestic_payment_consent_status,
    pis_prepare_domestic_payment_consent,
    pis_prepare_domestic_scheduled_payment_consent,
    pis_prepare_domestic_vrp_consent,
    pis_prepare_payment_review,
    pis_start_payment_journey,
)


PROTECTED_AIS_TOOLS = {
    "ais_list_accounts",
    "ais_get_balances",
    "ais_get_transactions",
    "ais_analyze_spending_change",
    "ais_detect_subscriptions",
    "ais_detect_upcoming_bills",
}


TOOL_SCHEMAS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "ais_list_accounts",
            "description": "List AIS accounts for the demo user.",
            "parameters": {"type": "object", "properties": {"user_id": {"type": "string"}}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ais_get_balances",
            "description": "Get AIS balances for all accounts or a specific account.",
            "parameters": {
                "type": "object",
                "properties": {"user_id": {"type": "string"}, "account_id": {"type": "string"}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ais_get_transactions",
            "description": "Get AIS transactions for an optional date range.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "from_date": {"type": "string"},
                    "to_date": {"type": "string"},
                    "account_id": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ais_analyze_spending_change",
            "description": "Deterministically compare spending between months.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "current_month": {"type": "string"},
                    "previous_month": {"type": "string"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ais_detect_subscriptions",
            "description": "Detect recurring subscription payments from AIS transactions.",
            "parameters": {"type": "object", "properties": {"user_id": {"type": "string"}}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ais_detect_upcoming_bills",
            "description": "Detect recurring bills due in the next demo week.",
            "parameters": {"type": "object", "properties": {"user_id": {"type": "string"}}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ais_start_consent_journey",
            "description": "Start an AIS account-access-consent redirect journey when protected account, balance, transaction, spending, subscription, or bill data is requested and no AUTH AIS consent exists.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "conversation_id": {"type": "string"},
                    "original_message": {"type": "string"},
                    "permissions": {"type": "array", "items": {"type": "string"}},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "pis_start_payment_journey",
            "description": "Start a PSD2 PIS payment journey, identify supported payment types, and report missing journey information. This never executes payments.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "message": {"type": "string"},
                    "explicit_user_request": {
                        "type": "boolean",
                        "description": "Set true when the current user message explicitly asks to start or continue a PIS payment/consent journey.",
                    },
                    "payment_type": {
                        "type": "string",
                        "enum": ["immediate_domestic", "scheduled_domestic", "variable_recurring"],
                    },
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "pis_prepare_payment_review",
            "description": "Prepare an editable PIS payment review table from known bills or user-provided payee/amount details. This never executes payments.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "message": {"type": "string"},
                    "explicit_user_request": {
                        "type": "boolean",
                        "description": "Set true when the current user message explicitly asks to prepare or update payment consent review details.",
                    },
                    "payee": {"type": "string"},
                    "amount": {"type": "number"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "pis_prepare_domestic_scheduled_payment_consent",
            "description": "Create AWAU domestic scheduled payment consent records after user review confirmation. This never executes payments.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "explicit_user_request": {"type": "boolean"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "pis_prepare_domestic_vrp_consent",
            "description": "Create AWAU domestic VRP consent records with control parameters after user review confirmation. This never executes payments.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "explicit_user_request": {"type": "boolean"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "pis_prepare_domestic_payment_consent",
            "description": "Create AWAU domestic payment consent records after user review confirmation. This never executes payments.",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string"},
                    "explicit_user_request": {"type": "boolean"},
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "pis_get_domestic_payment_consent_status",
            "description": "Get the status of a prepared domestic payment consent.",
            "parameters": {
                "type": "object",
                "required": ["consent_id"],
                "properties": {"user_id": {"type": "string"}, "consent_id": {"type": "string"}},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "general_response",
            "description": "Use for non-AIS and non-PIS questions that do not require financial account data, transaction data, insights, consent, or payment preparation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string"},
                    "summary": {"type": "string"},
                },
            },
        },
    },
]


def execute_financial_tool(
    tool_name: str,
    arguments: dict[str, Any] | None,
    state: FinancialConversationState,
) -> dict[str, Any]:
    args = dict(arguments or {})
    args["user_id"] = args.get("user_id") or state.userId or DEMO_USER_ID
    if tool_name == "ais_start_consent_journey":
        args["conversation_id"] = args.get("conversation_id") or state.conversationId
        args["original_message"] = args.get("original_message") or (
            state.messages[-1].get("content", "") if state.messages else ""
        )
    if tool_name in PROTECTED_AIS_TOOLS and state.aisConsentStatus != "AUTH":
        raise ValueError(
            "AIS consent is required before using protected account, balance, transaction, or insight tools. "
            "Use ais_start_consent_journey first."
        )

    if tool_name in {
        "pis_start_payment_journey",
        "pis_prepare_payment_review",
        "pis_prepare_domestic_payment_consent",
        "pis_prepare_domestic_scheduled_payment_consent",
        "pis_prepare_domestic_vrp_consent",
    }:
        args["explicit_user_request"] = bool(args.get("explicit_user_request", state.explicitPisRequest))
        if not args.get("bills") and state.lastAisResults.get("upcomingBills"):
            args["bills"] = state.lastAisResults["upcomingBills"].get("upcomingBills", [])
        if tool_name == "pis_start_payment_journey":
            args["message"] = args.get("message") or (state.messages[-1].get("content", "") if state.messages else "")
        if tool_name == "pis_prepare_payment_review":
            args["message"] = args.get("message") or (state.messages[-1].get("content", "") if state.messages else "")
            args.pop("payment_type", None)
            direct_payee = args.pop("payee", None)
            direct_amount = args.pop("amount", None)
            direct_currency = args.pop("currency", "SGD")
            if direct_payee or direct_amount is not None:
                args["bills"] = [
                    {
                        "merchant": direct_payee or "",
                        "amount": direct_amount,
                        "currency": direct_currency or "SGD",
                        "estimatedDueDate": "",
                    }
                ]

    validate_tool_call(tool_name, args, state.as_policy_context())

    if tool_name == "general_response":
        result = {
            "topic": args.get("topic", "general"),
            "summary": args.get("summary", ""),
        }
        return {
            "capability": "General",
            "standard": "DEMO_ASSISTANT_GENERAL",
            "raw": None,
            "normalized": result,
            "result": result,
        }

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
    }
    if tool_name not in tools:
        raise ValueError(f"Unknown financial tool: {tool_name}")
    return tools[tool_name](**args)


def tool_schemas_for_names(tool_names: set[str]) -> list[dict[str, Any]]:
    return [
        schema
        for schema in TOOL_SCHEMAS
        if schema.get("function", {}).get("name") in tool_names
    ]
