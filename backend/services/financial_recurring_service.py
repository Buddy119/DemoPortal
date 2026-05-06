from __future__ import annotations

from calendar import monthrange
from datetime import date
from statistics import mean
from typing import Any

from .financial_constants import DEMO_TODAY, DEMO_USER_ID
from .financial_data_service import debit_transactions, parse_date


RECURRING_CATEGORIES = {
    "Subscription",
    "Entertainment",
    "Software",
    "Telecom",
    "Utilities",
    "Insurance",
}


def add_one_month(value: date) -> date:
    month = value.month + 1
    year = value.year
    if month == 13:
        month = 1
        year += 1
    return date(year, month, min(value.day, monthrange(year, month)[1]))


def _is_roughly_monthly(dates: list[date]) -> bool:
    if len(dates) < 3:
        return False
    intervals = [(dates[index] - dates[index - 1]).days for index in range(1, len(dates))]
    monthly_intervals = [interval for interval in intervals if 24 <= interval <= 38]
    return len(monthly_intervals) >= max(2, len(intervals) - 1)


def _amounts_are_similar(amounts: list[float]) -> bool:
    if len(amounts) < 3:
        return False
    avg = mean(amounts)
    tolerance = max(5.0, avg * 0.15)
    return all(abs(amount - avg) <= tolerance for amount in amounts)


def detect_recurring_payments(user_id: str = DEMO_USER_ID) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = {}
    for transaction in debit_transactions(user_id):
        category = transaction.get("category")
        if category not in RECURRING_CATEGORIES:
            continue
        grouped.setdefault(transaction["merchant"], []).append(transaction)

    recurring: list[dict[str, Any]] = []
    for merchant, transactions in grouped.items():
        if len(transactions) < 3:
            continue
        sorted_transactions = sorted(transactions, key=lambda item: item["date"])
        dates = [parse_date(transaction["date"]) for transaction in sorted_transactions]
        amounts = [float(transaction["amount"]) for transaction in sorted_transactions]
        if not _amounts_are_similar(amounts) or not _is_roughly_monthly(dates):
            continue

        latest = sorted_transactions[-1]
        next_expected = add_one_month(parse_date(latest["date"]))
        while next_expected < DEMO_TODAY:
            next_expected = add_one_month(next_expected)

        confidence = "high" if len(sorted_transactions) >= 5 else "medium"
        recurring.append(
            {
                "merchant": merchant,
                "merchantId": latest.get("merchantId"),
                "category": latest.get("category"),
                "amount": round(mean(amounts), 2),
                "frequency": "monthly",
                "nextExpectedDate": next_expected.isoformat(),
                "confidence": confidence,
                "transactionCount": len(sorted_transactions),
                "currency": latest.get("currency", "SGD"),
            }
        )

    return sorted(recurring, key=lambda item: item["nextExpectedDate"])


def detect_subscriptions(user_id: str = DEMO_USER_ID) -> dict[str, Any]:
    subscriptions = detect_recurring_payments(user_id)
    monthly_total = round(sum(item["amount"] for item in subscriptions), 2)
    return {
        "subscriptions": subscriptions,
        "count": len(subscriptions),
        "monthlyTotal": monthly_total,
        "currency": "SGD",
    }
