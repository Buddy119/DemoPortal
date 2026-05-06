from __future__ import annotations

from datetime import date
from typing import Any

from .financial_constants import DEMO_USER_ID

from psd2.mock_bank import (
    get_ob_accounts_response,
    get_ob_balances_response,
    get_ob_transactions_response,
    list_normalized_accounts,
    list_normalized_balances,
    list_normalized_transactions,
)


def parse_date(value: str | date) -> date:
    if isinstance(value, date):
        return value
    return date.fromisoformat(value)


def list_accounts(user_id: str = DEMO_USER_ID) -> list[dict[str, Any]]:
    return [dict(account) for account in list_normalized_accounts(user_id)]


def list_balances(user_id: str = DEMO_USER_ID, account_id: str | None = None) -> list[dict[str, Any]]:
    return [dict(balance) for balance in list_normalized_balances(user_id, account_id)]


def list_merchants() -> list[dict[str, Any]]:
    merchants: dict[str, dict[str, Any]] = {}
    for transaction in list_transactions(user_id=DEMO_USER_ID):
        merchant_id = transaction.get("merchantId") or transaction["merchant"]
        merchants[merchant_id] = {
            "merchantId": merchant_id,
            "name": transaction["merchant"],
            "category": transaction.get("category", "Uncategorized"),
        }
    return list(merchants.values())


def get_merchant_map() -> dict[str, dict[str, Any]]:
    return {merchant["merchantId"]: merchant for merchant in list_merchants()}


def list_transactions(
    user_id: str = DEMO_USER_ID,
    from_date: str | date | None = None,
    to_date: str | date | None = None,
) -> list[dict[str, Any]]:
    start = parse_date(from_date) if from_date else None
    end = parse_date(to_date) if to_date else None
    transactions: list[dict[str, Any]] = []
    for transaction in list_normalized_transactions(user_id, start, end):
        transaction_date = parse_date(transaction["date"])
        transactions.append(dict(transaction))

    return sorted(transactions, key=lambda item: item["date"])


def debit_transactions(
    user_id: str = DEMO_USER_ID,
    from_date: str | date | None = None,
    to_date: str | date | None = None,
) -> list[dict[str, Any]]:
    return [
        transaction
        for transaction in list_transactions(user_id, from_date, to_date)
        if transaction.get("direction") == "debit"
    ]


def total_available_balance(user_id: str = DEMO_USER_ID) -> float:
    return round(
        sum(float(account.get("availableBalance", 0)) for account in list_accounts(user_id)),
        2,
    )


def raw_ais_accounts(user_id: str = DEMO_USER_ID) -> dict[str, Any]:
    return get_ob_accounts_response(user_id)


def raw_ais_balances(user_id: str = DEMO_USER_ID, account_id: str | None = None) -> dict[str, Any]:
    return get_ob_balances_response(user_id, account_id)


def raw_ais_transactions(
    user_id: str = DEMO_USER_ID,
    from_date: str | date | None = None,
    to_date: str | date | None = None,
    account_id: str | None = None,
) -> dict[str, Any]:
    return get_ob_transactions_response(user_id, account_id, from_date, to_date)
