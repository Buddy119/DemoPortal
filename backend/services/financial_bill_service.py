from __future__ import annotations

from datetime import timedelta
from typing import Any

from .financial_constants import DEMO_TODAY, DEMO_USER_ID
from .financial_data_service import total_available_balance
from .financial_recurring_service import detect_recurring_payments


BILL_CATEGORIES = {"Subscription", "Telecom", "Utilities", "Insurance"}


def detect_upcoming_bills(user_id: str = DEMO_USER_ID, days: int = 7) -> dict[str, Any]:
    end_date = DEMO_TODAY + timedelta(days=days)
    available_balance = total_available_balance(user_id)
    bills: list[dict[str, Any]] = []

    for recurring in detect_recurring_payments(user_id):
        due_date = recurring["nextExpectedDate"]
        if recurring.get("category") not in BILL_CATEGORIES:
            continue
        if DEMO_TODAY.isoformat() <= due_date <= end_date.isoformat():
            bills.append(
                {
                    "merchant": recurring["merchant"],
                    "merchantId": recurring.get("merchantId"),
                    "category": recurring.get("category"),
                    "amount": recurring["amount"],
                    "estimatedDueDate": due_date,
                    "confidence": recurring["confidence"],
                    "currency": recurring.get("currency", "SGD"),
                    "balanceCheck": (
                        "sufficient_funds"
                        if available_balance >= recurring["amount"]
                        else "needs_review"
                    ),
                }
            )

    total_due = round(sum(bill["amount"] for bill in bills), 2)
    return {
        "upcomingBills": sorted(bills, key=lambda item: item["estimatedDueDate"]),
        "count": len(bills),
        "totalDue": total_due,
        "currency": "SGD",
        "availableBalance": available_balance,
        "windowStart": DEMO_TODAY.isoformat(),
        "windowEnd": end_date.isoformat(),
    }
