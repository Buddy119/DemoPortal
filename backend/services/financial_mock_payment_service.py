from __future__ import annotations

from typing import Any

from psd2.mock_bank import (
    create_mock_scheduled_payment,
    create_mock_variable_recurring_payment,
    execute_mock_immediate_payment,
)

from .financial_constants import DEMO_CURRENCY, DEMO_USER_ID


def execute_immediate_payment(
    *,
    user_id: str = DEMO_USER_ID,
    debtor_account_id: str,
    payee: str,
    amount: Any,
    currency: str = DEMO_CURRENCY,
    remittance_information: str | None = None,
) -> dict[str, Any]:
    return execute_mock_immediate_payment(
        user_id=user_id,
        debtor_account_id=debtor_account_id,
        payee=payee,
        amount=amount,
        currency=currency,
        remittance_information=remittance_information,
    )


def schedule_domestic_payment(
    *,
    user_id: str = DEMO_USER_ID,
    debtor_account_id: str,
    payee: str,
    amount: Any,
    currency: str = DEMO_CURRENCY,
    scheduled_date: str | None = None,
    remittance_information: str | None = None,
) -> dict[str, Any]:
    return create_mock_scheduled_payment(
        user_id=user_id,
        debtor_account_id=debtor_account_id,
        payee=payee,
        amount=amount,
        currency=currency,
        scheduled_date=scheduled_date,
        remittance_information=remittance_information,
    )


def activate_variable_recurring_payment(
    *,
    user_id: str = DEMO_USER_ID,
    debtor_account_id: str,
    payee: str,
    amount: Any,
    currency: str = DEMO_CURRENCY,
    control_parameters: dict[str, Any] | None = None,
    remittance_information: str | None = None,
) -> dict[str, Any]:
    return create_mock_variable_recurring_payment(
        user_id=user_id,
        debtor_account_id=debtor_account_id,
        payee=payee,
        amount=amount,
        currency=currency,
        control_parameters=control_parameters,
        remittance_information=remittance_information,
    )
