from __future__ import annotations

from .financial_constants import PAYMENT_SAFETY_NOTICE


class FinancialPolicyError(Exception):
    """Raised when a financial action violates the MVP safety policy."""


BLOCKED_TOOLS = {
    "execute_payment",
    "execute_payment_draft",
    "submit_payment",
    "approve_payment",
    "transfer_money",
    "pis_submit_domestic_payment",
    "pis_execute_domestic_payment",
    "pis_submit_domestic_scheduled_payment",
    "pis_execute_domestic_scheduled_payment",
    "pis_submit_domestic_vrp",
    "pis_execute_domestic_vrp",
}
PIS_PREPARE_TOOLS = {
    "pis_start_payment_journey",
    "pis_prepare_domestic_payment_consent",
    "pis_prepare_domestic_scheduled_payment_consent",
    "pis_prepare_domestic_vrp_consent",
    "pis_prepare_payment_review",
    "prepare_payment_draft",
}


def assert_tool_allowed(tool_name: str) -> None:
    if tool_name in BLOCKED_TOOLS:
        raise FinancialPolicyError(
            "Payment execution is not allowed in this MVP. Only draft preparation is permitted."
        )


def validate_tool_call(
    tool_name: str,
    args: dict | None = None,
    conversation_state: dict | None = None,
) -> None:
    assert_tool_allowed(tool_name)
    if tool_name not in PIS_PREPARE_TOOLS:
        return

    args = args or {}
    state = conversation_state or {}
    explicit = bool(args.get("explicit_user_request") or state.get("explicitPisRequest"))
    if tool_name in {"pis_start_payment_journey", "pis_prepare_payment_review"}:
        if not explicit:
            raise FinancialPolicyError("PIS review preparation requires an explicit user request.")
        return
    has_bills = bool(args.get("bills") or state.get("lastAisResults", {}).get("upcomingBills"))
    has_direct_payment = bool(args.get("payee") and args.get("amount"))
    if not explicit:
        raise FinancialPolicyError("PIS consent preparation requires an explicit user request.")
    if not has_bills and not has_direct_payment:
        raise FinancialPolicyError("PIS consent preparation requires known bills or complete payee and amount details.")


def payment_safety_notice() -> str:
    return PAYMENT_SAFETY_NOTICE
