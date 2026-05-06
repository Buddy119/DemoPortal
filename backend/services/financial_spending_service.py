from __future__ import annotations

from calendar import monthrange
from datetime import date
from typing import Any

from .financial_constants import DEMO_USER_ID
from .financial_data_service import debit_transactions


def _month_bounds(month: str) -> tuple[date, date]:
    year, month_num = (int(part) for part in month.split("-"))
    return date(year, month_num, 1), date(year, month_num, monthrange(year, month_num)[1])


def default_month_pair() -> tuple[str, str]:
    return "2026-04", "2026-03"


def _group_by_category(transactions: list[dict[str, Any]]) -> dict[str, float]:
    grouped: dict[str, float] = {}
    for transaction in transactions:
        category = transaction.get("category", "Other")
        grouped[category] = grouped.get(category, 0) + float(transaction.get("amount", 0))
    return {category: round(amount, 2) for category, amount in grouped.items()}


def _change_percent(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


def get_spending_comparison(
    user_id: str = DEMO_USER_ID,
    current_month: str | None = None,
    previous_month: str | None = None,
) -> dict[str, Any]:
    if not current_month or not previous_month:
        current_month, previous_month = default_month_pair()

    current_start, current_end = _month_bounds(current_month)
    previous_start, previous_end = _month_bounds(previous_month)
    current_transactions = debit_transactions(user_id, current_start, current_end)
    previous_transactions = debit_transactions(user_id, previous_start, previous_end)

    current_by_category = _group_by_category(current_transactions)
    previous_by_category = _group_by_category(previous_transactions)
    total_current = round(sum(current_by_category.values()), 2)
    total_previous = round(sum(previous_by_category.values()), 2)
    increase_amount = round(total_current - total_previous, 2)

    category_changes: list[dict[str, Any]] = []
    for category in sorted(set(current_by_category) | set(previous_by_category)):
        current = current_by_category.get(category, 0.0)
        previous = previous_by_category.get(category, 0.0)
        category_changes.append(
            {
                "category": category,
                "current": round(current, 2),
                "previous": round(previous, 2),
                "changeAmount": round(current - previous, 2),
                "changePercent": _change_percent(current, previous),
            }
        )

    top_drivers = sorted(
        [change for change in category_changes if change["changeAmount"] > 0],
        key=lambda item: item["changeAmount"],
        reverse=True,
    )[:5]
    driver_categories = {driver["category"] for driver in top_drivers[:3]}
    related_transactions = sorted(
        [
            transaction
            for transaction in current_transactions
            if transaction.get("category") in driver_categories
        ],
        key=lambda item: float(item.get("amount", 0)),
        reverse=True,
    )[:8]

    return {
        "currentMonth": current_month,
        "previousMonth": previous_month,
        "totalCurrent": total_current,
        "totalPrevious": total_previous,
        "increaseAmount": increase_amount,
        "increasePercent": _change_percent(total_current, total_previous),
        "categoryChanges": category_changes,
        "topDrivers": top_drivers,
        "relatedTransactions": related_transactions,
        "currency": "SGD",
    }
