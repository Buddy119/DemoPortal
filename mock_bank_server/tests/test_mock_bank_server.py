import json
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import main


@pytest.fixture
def restore_data():
    paths = [
        Path(main.DATA_DIR) / "mockAccounts.json",
        Path(main.DATA_DIR) / "mockTransactions.json",
    ]
    originals = {path: path.read_text(encoding="utf-8") for path in paths}
    try:
        yield
    finally:
        for path, content in originals.items():
            path.write_text(content, encoding="utf-8")


@pytest.fixture
def client():
    return TestClient(main.app)


def _account_balance(account_id: str) -> float:
    accounts = json.loads((Path(main.DATA_DIR) / "mockAccounts.json").read_text(encoding="utf-8"))
    return next(account["availableBalance"] for account in accounts if account["accountId"] == account_id)


def _transaction_count() -> int:
    transactions = json.loads((Path(main.DATA_DIR) / "mockTransactions.json").read_text(encoding="utf-8"))
    return len(transactions)


def test_ais_accounts_balances_and_transactions_are_ob_enveloped(client):
    accounts = client.get("/obie/open-banking/v4.0/aisp/accounts", params={"userId": "demo-user-001"})
    balances = client.get("/obie/open-banking/v4.0/aisp/balances", params={"userId": "demo-user-001"})
    transactions = client.get(
        "/obie/open-banking/v4.0/aisp/transactions",
        params={
            "userId": "demo-user-001",
            "fromBookingDateTime": "2026-05-01",
            "toBookingDateTime": "2026-05-03",
        },
    )

    assert accounts.status_code == 200
    assert {"Data", "Links", "Meta"} <= accounts.json().keys()
    assert accounts.json()["Data"]["Account"]
    assert balances.json()["Data"]["Balance"]
    assert transactions.json()["Data"]["Transaction"]
    assert all(
        transaction["BookingDateTime"][:10] <= "2026-05-03"
        for transaction in transactions.json()["Data"]["Transaction"]
    )


def test_account_specific_endpoints_filter_by_account(client):
    account_id = "acc-everyday-001"
    balances = client.get(
        f"/obie/open-banking/v4.0/aisp/accounts/{account_id}/balances",
        params={"userId": "demo-user-001"},
    )
    transactions = client.get(
        f"/obie/open-banking/v4.0/aisp/accounts/{account_id}/transactions",
        params={"userId": "demo-user-001"},
    )

    assert balances.status_code == 200
    assert {item["AccountId"] for item in balances.json()["Data"]["Balance"]} == {account_id}
    assert transactions.status_code == 200
    assert {item["AccountId"] for item in transactions.json()["Data"]["Transaction"]} == {account_id}


def test_immediate_payment_mutates_external_data(client, restore_data):
    before_balance = _account_balance("acc-everyday-001")
    before_count = _transaction_count()

    response = client.post(
        "/obie/open-banking/v4.0/pisp/domestic-payments",
        json={
            "userId": "demo-user-001",
            "debtorAccountId": "acc-everyday-001",
            "payee": "Amy",
            "amount": 20,
            "currency": "SGD",
        },
    )

    assert response.status_code == 200
    assert response.json()["status"] == "EXECUTED"
    assert response.json()["balanceBefore"] == before_balance
    assert response.json()["balanceAfter"] == round(before_balance - 20, 2)
    assert _account_balance("acc-everyday-001") == response.json()["balanceAfter"]
    assert _transaction_count() == before_count + 1


def test_scheduled_and_vrp_do_not_mutate_external_data(client, restore_data):
    before_balance = _account_balance("acc-everyday-001")
    before_count = _transaction_count()

    scheduled = client.post(
        "/obie/open-banking/v4.0/pisp/domestic-scheduled-payments",
        json={
            "userId": "demo-user-001",
            "debtorAccountId": "acc-everyday-001",
            "payee": "Amy",
            "amount": 20,
            "currency": "SGD",
            "scheduledDate": "2026-05-10",
        },
    )
    vrp = client.post(
        "/obie/open-banking/v4.0/pisp/domestic-vrps",
        json={
            "userId": "demo-user-001",
            "debtorAccountId": "acc-everyday-001",
            "payee": "Amy",
            "amount": 20,
            "currency": "SGD",
            "controlParameters": {"maxIndividualAmount": 20, "maxCumulativeAmount": 60},
        },
    )

    assert scheduled.status_code == 200
    assert scheduled.json()["status"] == "SCHEDULED"
    assert vrp.status_code == 200
    assert vrp.json()["status"] == "VRP_CONSENT_ACTIVE"
    assert _account_balance("acc-everyday-001") == before_balance
    assert _transaction_count() == before_count


def test_payment_validation_errors_do_not_mutate(client, restore_data):
    before_balance = _account_balance("acc-everyday-001")
    before_count = _transaction_count()

    invalid_account = client.post(
        "/obie/open-banking/v4.0/pisp/domestic-payments",
        json={
            "userId": "demo-user-001",
            "debtorAccountId": "missing-account",
            "payee": "Amy",
            "amount": 20,
            "currency": "SGD",
        },
    )
    insufficient = client.post(
        "/obie/open-banking/v4.0/pisp/domestic-payments",
        json={
            "userId": "demo-user-001",
            "debtorAccountId": "acc-everyday-001",
            "payee": "Amy",
            "amount": 999999,
            "currency": "SGD",
        },
    )
    currency = client.post(
        "/obie/open-banking/v4.0/pisp/domestic-payments",
        json={
            "userId": "demo-user-001",
            "debtorAccountId": "acc-everyday-001",
            "payee": "Amy",
            "amount": 20,
            "currency": "USD",
        },
    )

    assert invalid_account.status_code == 400
    assert insufficient.status_code == 400
    assert currency.status_code == 400
    assert _account_balance("acc-everyday-001") == before_balance
    assert _transaction_count() == before_count
