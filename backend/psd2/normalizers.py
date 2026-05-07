from __future__ import annotations

from datetime import datetime
from typing import Any


def _date_from_datetime(value: str | None) -> str:
    if not value:
        return ""
    return value.split("T", 1)[0]


def normalize_ob_account(ob_account: dict[str, Any], user_id: str) -> dict[str, Any]:
    account_type = str(ob_account.get("AccountTypeCode", "Account")).replace("Account", "").lower()
    balance = ob_account.get("DemoEnrichment", {}).get("Balance", {})
    amount = float(balance.get("Amount", {}).get("Amount", 0))
    currency = balance.get("Amount", {}).get("Currency") or ob_account.get("Currency", "SGD")
    return {
        "accountId": ob_account["AccountId"],
        "userId": user_id,
        "name": ob_account.get("Nickname", ob_account["AccountId"]),
        "type": account_type,
        "currency": currency,
        "balance": round(amount, 2),
        "availableBalance": round(amount, 2),
        "raw": ob_account,
    }


def normalize_ob_balance(ob_balance: dict[str, Any]) -> dict[str, Any]:
    amount = ob_balance.get("Amount", {})
    return {
        "accountId": ob_balance.get("AccountId"),
        "type": ob_balance.get("Type"),
        "creditDebitIndicator": ob_balance.get("CreditDebitIndicator"),
        "dateTime": ob_balance.get("DateTime"),
        "amount": float(amount.get("Amount", 0)),
        "currency": amount.get("Currency", "SGD"),
        "raw": ob_balance,
    }


def normalize_ob_transaction(ob_transaction: dict[str, Any], user_id: str) -> dict[str, Any]:
    amount = float(ob_transaction.get("Amount", {}).get("Amount", 0))
    direction = "debit" if ob_transaction.get("CreditDebitIndicator") == "Debit" else "credit"
    enrichment = ob_transaction.get("DemoEnrichment", {})
    merchant = (
        ob_transaction.get("MerchantDetails", {}).get("MerchantName")
        or ob_transaction.get("TransactionInformation")
        or "Unknown Merchant"
    )
    return {
        "id": ob_transaction.get("TransactionId"),
        "accountId": ob_transaction.get("AccountId"),
        "userId": user_id,
        "date": _date_from_datetime(ob_transaction.get("BookingDateTime")),
        "merchant": merchant,
        "merchantId": enrichment.get("MerchantId"),
        "category": enrichment.get("Category", "Uncategorized"),
        "amount": round(amount, 2),
        "currency": ob_transaction.get("Amount", {}).get("Currency", "SGD"),
        "direction": direction,
        "description": ob_transaction.get("TransactionInformation", merchant),
        "raw": ob_transaction,
    }


def normalize_ob_domestic_payment_consent(ob_consent: dict[str, Any]) -> dict[str, Any]:
    data = ob_consent.get("Data", {})
    initiation = data.get("Initiation", {})
    amount = initiation.get("InstructedAmount") or data.get("ControlParameters", {}).get("MaximumIndividualAmount", {})
    creditor = initiation.get("CreditorAccount", {})
    enrichment = ob_consent.get("DemoEnrichment", {})
    return {
        "consentId": data.get("ConsentId"),
        "resourceType": enrichment.get("ResourceType", "domestic-payment-consent"),
        "status": data.get("Status"),
        "creationDateTime": data.get("CreationDateTime"),
        "statusUpdateDateTime": data.get("StatusUpdateDateTime"),
        "payee": creditor.get("Name"),
        "amount": float(amount.get("Amount", 0)),
        "currency": amount.get("Currency", "SGD"),
        "debtorAccountId": enrichment.get("DebtorAccountId"),
        "dueDate": enrichment.get("DueDate"),
        "requestedExecutionDateTime": initiation.get("RequestedExecutionDateTime"),
        "controlParameters": data.get("ControlParameters"),
        "reviewRequired": data.get("Status") == "AWAU",
        "scaRequired": bool(data.get("SCASupportData")),
        "executionStatus": "Not Executed",
        "safetyNotice": "No payment has been executed.",
        "raw": ob_consent,
    }
