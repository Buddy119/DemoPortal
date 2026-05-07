import json
import os
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import httpx
import pytest
from httpx import AsyncClient


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.financial_assistant_service import handle_financial_assistant_message, route_intent
from services.financial_agent_runtime import handle_financial_agent_message, resume_after_consent
from services.financial_bill_service import detect_upcoming_bills
from services.financial_consent_journey_service import (
    authorize_consent_journey,
    clear_consent_journeys,
    get_consent_journey,
    handle_open_banking_callback,
    start_pis_consent_journey,
)
from services.financial_conversation_store import clear_conversations
from services.financial_data_service import list_accounts
from services.financial_llm_client import FinancialLLMReply, FinancialLLMToolCall
from services.financial_payment_draft_service import (
    clear_payment_drafts,
    prepare_domestic_scheduled_payment_consents,
    prepare_domestic_vrp_consents,
    prepare_payment_drafts,
)
from services.financial_pis_review_service import prepare_pis_payment_review
from services.financial_policy_guard import FinancialPolicyError, assert_tool_allowed
from services.financial_tools import ais_list_accounts, pis_prepare_domestic_payment_consent, pis_prepare_payment_review
from psd2 import mock_bank
from psd2.mock_bank import get_ob_accounts_response, get_ob_transactions_response
from psd2.normalizers import normalize_ob_transaction
from services.financial_recurring_service import detect_subscriptions
from services.financial_spending_service import get_spending_comparison


@pytest.fixture(autouse=True)
def disable_default_financial_llm(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "")
    monkeypatch.setenv("FINANCIAL_MOCK_BASE_URL", "")
    mock_bank._load_json_from_source.cache_clear()
    yield
    mock_bank._load_json_from_source.cache_clear()


async def approve_and_resume(response, llm_client=None):
    journey = response["agentWorkbench"]["consentJourney"]
    redirect = authorize_consent_journey(
        journey_id=journey["journeyId"],
        consent_id=journey["consentId"],
        state_value=journey["state"],
        decision="approve",
    )
    params = parse_qs(urlparse(redirect["redirectUrl"]).query)
    callback = handle_open_banking_callback(code=params["code"][0], state_value=params["state"][0])
    return await resume_after_consent(callback["conversationId"], callback["journeyId"], llm_client=llm_client)


def test_mock_transactions_include_required_history():
    data_path = Path(__file__).resolve().parent.parent / "data" / "mockTransactions.json"
    transactions = json.loads(data_path.read_text())
    assert len(transactions) >= 100
    assert transactions[0]["date"].startswith("2025-11")
    assert any(transaction["date"].startswith("2026-05") for transaction in transactions)


def test_spending_comparison_identifies_top_drivers():
    result = get_spending_comparison()
    assert result["totalCurrent"] > result["totalPrevious"]
    assert result["increaseAmount"] > 0
    assert result["topDrivers"][0]["category"] == "Travel"
    assert any(driver["category"] == "Dining" for driver in result["topDrivers"])
    assert result["relatedTransactions"]


def test_subscription_detection_finds_recurring_bills():
    result = detect_subscriptions()
    merchants = {item["merchant"] for item in result["subscriptions"]}
    assert result["count"] >= 6
    assert {"Netflix", "Spotify", "Apple iCloud", "Singtel Mobile"} <= merchants
    assert result["monthlyTotal"] > 0


def test_upcoming_bills_are_due_in_demo_week():
    result = detect_upcoming_bills()
    assert result["windowStart"] == "2026-05-03"
    assert result["windowEnd"] == "2026-05-10"
    assert result["count"] >= 5
    assert all("estimatedDueDate" in bill for bill in result["upcomingBills"])


def test_payment_drafts_are_review_only():
    clear_payment_drafts()
    result = prepare_payment_drafts()
    assert result["count"] == len(result["paymentDrafts"])
    assert result["safetyNotice"] == "No payment has been executed."
    assert all(draft["status"] == "REVIEW_REQUIRED" for draft in result["paymentDrafts"])
    assert all(consent["status"] == "AWAU" for consent in result["domesticPaymentConsents"])


def test_pis_payment_review_leaves_unknown_fields_blank():
    review = prepare_pis_payment_review(message="Please prepare a payment")
    assert review["status"] == "INPUT_REQUIRED"
    assert review["rows"][0]["payee"] == ""
    assert review["rows"][0]["amount"] is None
    assert {"payee", "amount"} <= set(review["missingFields"])
    assert review["safetyNotice"] == "No payment has been executed."


def test_pis_payment_review_extracts_user_payee_and_amount():
    review = prepare_pis_payment_review(message="Please prepare a payment to SP Group Electricity for SGD 109.10")
    assert review["status"] == "READY_FOR_CONFIRMATION"
    assert review["rows"][0]["payee"] == "SP Group Electricity"
    assert review["rows"][0]["amount"] == 109.10
    assert review["canSubmit"] is True


def test_pis_payment_review_extracts_transfer_amount_before_payee():
    review = prepare_pis_payment_review(message="i want transfer 300SGD to my mom")
    assert review["status"] == "READY_FOR_CONFIRMATION"
    assert review["rows"][0]["payee"] == "mom"
    assert review["rows"][0]["amount"] == 300


def test_payment_execution_is_blocked():
    with pytest.raises(FinancialPolicyError):
        assert_tool_allowed("execute_payment")


def test_ob_uk_v4_mock_shapes_and_normalizer():
    accounts = get_ob_accounts_response()
    transactions = get_ob_transactions_response()
    assert {"Data", "Links", "Meta"} <= accounts.keys()
    assert "Account" in accounts["Data"]
    assert {"Data", "Links", "Meta"} <= transactions.keys()
    ob_transaction = transactions["Data"]["Transaction"][0]
    assert "DemoEnrichment" in ob_transaction
    assert "Category" not in ob_transaction
    normalized = normalize_ob_transaction(ob_transaction, "demo-user-001")
    assert normalized["category"] == ob_transaction["DemoEnrichment"]["Category"]


def test_financial_mock_base_url_blank_uses_local_data(monkeypatch):
    def fail_if_called(*args, **kwargs):
        raise AssertionError("External mock service should not be called")

    monkeypatch.setenv("FINANCIAL_MOCK_BASE_URL", "")
    monkeypatch.setattr(mock_bank.httpx, "get", fail_if_called)
    mock_bank._load_json_from_source.cache_clear()

    accounts = get_ob_accounts_response()

    assert accounts["Data"]["Account"]
    assert accounts["Data"]["Account"][0]["AccountId"].startswith("acc-")


def test_financial_mock_base_url_calls_external_open_banking_paths(monkeypatch):
    calls = []

    class MockResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "Data": {
                    "Account": [
                        {
                            "AccountId": "external-acc-001",
                            "Status": "Enabled",
                            "Currency": "SGD",
                            "AccountCategory": "Personal",
                            "AccountTypeCode": "CurrentAccount",
                            "Nickname": "External Mock Account",
                        }
                    ]
                },
                "Links": {"Self": "/open-banking/v4.0/aisp/accounts"},
                "Meta": {"TotalPages": 1},
            }

    def fake_get(url, params, timeout):
        calls.append((url, params, timeout))
        return MockResponse()

    monkeypatch.setenv("FINANCIAL_MOCK_BASE_URL", "https://mock.example.com/mock")
    monkeypatch.setattr(mock_bank.httpx, "get", fake_get)
    mock_bank._load_json_from_source.cache_clear()

    accounts = get_ob_accounts_response()

    assert calls == [
        (
            "https://mock.example.com/mock/open-banking/v4.0/aisp/accounts",
            {"userId": "demo-user-001"},
            10,
        )
    ]
    assert accounts["Data"]["Account"][0]["AccountId"] == "external-acc-001"


def test_ais_pis_tools_return_capability_wrappers():
    clear_payment_drafts()
    accounts = ais_list_accounts()
    consents = pis_prepare_domestic_payment_consent()
    review = pis_prepare_payment_review(message="Please prepare a payment")
    assert accounts["capability"] == "AIS"
    assert accounts["standard"] == "OB_UK_READ_WRITE_API_V4"
    assert consents["capability"] == "PIS"
    assert consents["result"]["status"] == "AWAU"
    assert consents["result"]["safetyNotice"] == "No payment has been executed."
    assert review["capability"] == "PIS"
    assert review["result"]["status"] == "INPUT_REQUIRED"


def test_ais_get_transactions_defaults_to_latest_ten():
    from services.financial_tools import ais_get_transactions

    result = ais_get_transactions()
    transactions = result["result"]["transactions"]
    assert result["result"]["count"] == 10
    assert transactions[0]["date"] >= transactions[-1]["date"]
    assert transactions[0]["date"].startswith("2026-05")


def test_assistant_routes_demo_prompts():
    assert route_intent("Why did I spend more this month?") == "analyze_spending_change"
    assert route_intent("how much i spend this month") == "analyze_spending_change"
    assert route_intent("Which subscriptions am I paying for?") == "detect_subscriptions"
    assert route_intent("What bills do I need to pay this week?") == "detect_upcoming_bills"
    assert route_intent("Prepare these payments for review.") == "prepare_payment_drafts"
    assert route_intent("i want to make a payment") == "prepare_payment_drafts"

    response = handle_financial_assistant_message("i want to make a payment")
    assert response["intent"] == "prepare_payment_drafts"
    assert response["pis"]["paymentIntentState"]["status"] == "payment_type_required"
    assert response["agentWorkbench"]["paymentJourney"]["missingFields"] == ["paymentType"]
    assert "Immediate domestic payment" in response["answer"]
    assert response["safetyNotice"] == "No payment has been executed."


def test_general_question_uses_general_capability():
    response = handle_financial_assistant_message("who are you?")

    assert response["intent"] == "help"
    assert response["capabilityUsed"] == ["General"]
    assert response["agentWorkbench"]["capability"]["name"] == "General"
    assert response["agentWorkbench"]["paymentJourney"]["status"] == "not_required"
    assert response["toolCalls"][0]["capability"] == "General"


@pytest.mark.asyncio
async def test_pis_journey_requires_type_then_prepares_review():
    clear_conversations()
    first = await handle_financial_agent_message("i want transfer 300SGD to my mom")
    assert first["pis"]["paymentIntentState"]["status"] == "payment_type_required"
    assert first["pis"]["paymentIntentState"]["collectedDetails"]["creditorName"] == "mom"
    assert first["pis"]["paymentIntentState"]["collectedDetails"]["amount"] == 300
    assert "paymentType" in first["pis"]["paymentIntentState"]["missingDetails"]

    second = await handle_financial_agent_message(
        "Immediate domestic payment",
        conversation_id=first["conversationId"],
    )
    assert second["pis"]["paymentIntentState"]["status"] == "ready_for_consent_preparation"
    assert second["pis"]["paymentIntentState"]["paymentType"] == "immediate_domestic"
    assert second["pis"]["paymentReview"]["status"] == "READY_FOR_CONFIRMATION"
    assert second["pis"]["paymentReview"]["rows"][0]["payee"] == "mom"
    assert second["agentWorkbench"]["paymentJourney"]["paymentType"] == "immediate_domestic"


def test_scheduled_and_vrp_consents_are_awau():
    clear_payment_drafts()
    bill = {
        "merchant": "SP Group Electricity",
        "amount": 109.10,
        "currency": "SGD",
        "estimatedDueDate": "2026-05-08",
    }
    scheduled = prepare_domestic_scheduled_payment_consents(bills=[bill])
    vrp = prepare_domestic_vrp_consents(bills=[bill])
    assert scheduled["domesticPaymentConsents"][0]["status"] == "AWAU"
    assert scheduled["domesticPaymentConsents"][0]["resourceType"] == "domestic-scheduled-payment-consent"
    assert vrp["domesticPaymentConsents"][0]["status"] == "AWAU"
    assert vrp["domesticPaymentConsents"][0]["resourceType"] == "domestic-vrp-consent"


@pytest.mark.asyncio
async def test_pis_consent_redirect_journey_authorises_without_execution():
    clear_conversations()
    clear_consent_journeys()
    clear_payment_drafts()

    journey = start_pis_consent_journey(
        conversation_id=None,
        payment_type="immediate_domestic",
        payment={
            "creditorName": "SP Group Electricity",
            "amount": "109.10",
            "currency": "SGD",
            "reference": "Electricity bill May 2026",
        },
    )
    assert journey["consentStatus"] == "AWAU"
    assert journey["redirectUrl"].startswith("/mock-aspsp/authorize")

    redirect = authorize_consent_journey(
        journey_id=journey["journeyId"],
        consent_id=journey["consentId"],
        state_value=journey["state"],
        decision="approve",
    )
    params = parse_qs(urlparse(redirect["redirectUrl"]).query)
    callback = handle_open_banking_callback(code=params["code"][0], state_value=params["state"][0])
    resumed = await resume_after_consent(callback["conversationId"], callback["journeyId"])

    assert callback["consentStatus"] == "AUTH"
    assert resumed["consentJourney"]["consentStatus"] == "AUTH"
    assert resumed["agentWorkbench"]["consentJourney"]["status"] == "resumed"
    assert "No payment has been executed." in resumed["answer"]


def test_consent_journey_reject_sets_rjct_and_blocks_resume():
    clear_conversations()
    clear_consent_journeys()
    journey = start_pis_consent_journey(
        conversation_id=None,
        payment_type="immediate_domestic",
        payment={"creditorName": "Mom", "amount": "12", "currency": "SGD"},
    )

    authorize_consent_journey(
        journey_id=journey["journeyId"],
        consent_id=journey["consentId"],
        state_value=journey["state"],
        decision="reject",
    )

    rejected = get_consent_journey(journey["journeyId"])
    assert rejected["consentStatus"] == "RJCT"
    assert any(step["status"] == "failed" for step in rejected["steps"])


@pytest.mark.asyncio
async def test_financial_routes(monkeypatch):
    monkeypatch.setenv("LLM_API_KEY", "")
    clear_conversations()
    clear_consent_journeys()
    import main

    transport = httpx.ASGITransport(app=main.app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        accounts = await ac.get("/api/accounts")
        spending = await ac.get("/api/insights/spending-comparison")
        assistant = await ac.post(
            "/api/assistant/chat",
            json={"message": "Which subscriptions am I paying for?", "userId": "demo-user-001"},
        )
        journey = assistant.json()["agentWorkbench"]["consentJourney"]
        auth = await ac.post(
            "/api/mock-aspsp/authorize",
            json={
                "journeyId": journey["journeyId"],
                "consentId": journey["consentId"],
                "state": journey["state"],
                "decision": "approve",
            },
        )
        params = parse_qs(urlparse(auth.json()["redirectUrl"]).query)
        callback = await ac.post(
            "/api/open-banking/callback",
            json={"code": params["code"][0], "state": params["state"][0]},
        )
        resumed = await ac.post(
            "/api/assistant/resume-after-consent",
            json={
                "conversationId": callback.json()["conversationId"],
                "journeyId": callback.json()["journeyId"],
                "userId": "demo-user-001",
            },
        )

    assert accounts.status_code == 200
    assert len(accounts.json()["accounts"]) == len(list_accounts())
    assert spending.status_code == 200
    assert spending.json()["increaseAmount"] > 0
    assert assistant.status_code == 200
    assert assistant.json()["intent"] == "detect_subscriptions"
    assert assistant.json()["conversationId"]
    assert assistant.json()["agentWorkbench"]["consentJourney"]["type"] == "AIS_CONSENT"
    assert assistant.json()["toolCalls"][0]["name"] == "ais_start_consent_journey"
    assert "subscriptions" not in assistant.json()["ais"]
    assert auth.status_code == 200
    assert callback.json()["consentStatus"] == "AUTH"
    assert resumed.status_code == 200
    assert resumed.json()["agentWorkbench"]["consentJourney"]["status"] == "resumed"
    assert "subscriptions" in resumed.json()["ais"]


@pytest.mark.asyncio
async def test_ais_consent_gate_is_llm_tool_orchestrated():
    clear_conversations()
    clear_consent_journeys()

    class ConsentLLM:
        is_configured = True

        def __init__(self):
            self.calls = 0
            self.tool_names_by_call = []

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            self.tool_names_by_call.append([tool["function"]["name"] for tool in tools or []])
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[FinancialLLMToolCall("call-consent", "ais_start_consent_journey", {})],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = "Please grant AIS consent at Demo Bank before I access account information."
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    llm = ConsentLLM()
    response = await handle_financial_agent_message(
        "What bills do I need to pay this week?",
        llm_client=llm,
    )

    assert llm.calls >= 2
    assert "ais_start_consent_journey" in llm.tool_names_by_call[0]
    assert "ais_detect_upcoming_bills" in llm.tool_names_by_call[0]
    assert response["toolCalls"][0]["name"] == "ais_start_consent_journey"
    assert response["toolCalls"][0]["status"] == "success"
    assert response["agentWorkbench"]["consentJourney"]["type"] == "AIS_CONSENT"
    assert response["agentWorkbench"]["consentJourney"]["consentStatus"] == "AWAU"
    assert "upcomingBills" not in response["ais"]


@pytest.mark.asyncio
async def test_agent_runtime_uses_llm_tools_and_follow_up_context():
    clear_conversations()
    clear_consent_journeys()

    class FakeLLM:
        is_configured = True

        def __init__(self):
            self.calls = 0

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[FinancialLLMToolCall("call-1", "pis_start_payment_journey", {})],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = "Here is the requested PSD2 AIS/PIS result. No payment has been executed."
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    consent = await handle_financial_agent_message("What bills do I need to pay this week?")
    assert consent["toolCalls"][0]["name"] == "ais_start_consent_journey"
    bills = await approve_and_resume(consent)
    llm = FakeLLM()
    consents = await handle_financial_agent_message(
        "Prepare these payments for review.",
        conversation_id=bills["conversationId"],
        llm_client=llm,
    )
    assert bills["toolCalls"][0]["name"] == "ais_detect_upcoming_bills"
    assert bills["ais"]["upcomingBills"]["upcomingBills"]
    assert bills["agentWorkbench"]["consentJourney"]["status"] == "resumed"
    assert "| Bill |" not in bills["answer"]
    assert "Estimated total due is SGD 304.04" in bills["answer"]
    assert consents["toolCalls"][0]["name"] == "pis_start_payment_journey"
    assert consents["pis"]["paymentIntentState"]["status"] == "payment_type_required"
    assert consents["agentWorkbench"]["paymentJourney"]["supportedPaymentTypes"]
    assert "What kind of payment" in consents["answer"]
    assert "No payment has been executed." in consents["answer"]


@pytest.mark.asyncio
async def test_deterministic_fallback_preserves_ais_bill_context_for_pis():
    clear_conversations()
    clear_consent_journeys()

    class DisabledLLM:
        is_configured = False

    consent = await handle_financial_agent_message(
        "What bills do I need to pay this week?",
        llm_client=DisabledLLM(),
    )
    assert consent["agentWorkbench"]["consentJourney"]["status"] == "redirect_ready"
    bills = await approve_and_resume(consent)
    journey = await handle_financial_agent_message(
        "Prepare these payments for review.",
        conversation_id=bills["conversationId"],
        llm_client=DisabledLLM(),
    )
    scheduled = await handle_financial_agent_message(
        "Scheduled payments by due date",
        conversation_id=bills["conversationId"],
        llm_client=DisabledLLM(),
    )

    assert bills["ais"]["upcomingBills"]["upcomingBills"]
    assert journey["pis"]["paymentIntentState"]["source"] == "ais_upcoming_bills"
    assert journey["pis"]["paymentIntentState"]["status"] == "payment_type_required"
    assert scheduled["pis"]["paymentIntentState"]["paymentType"] == "scheduled_domestic"
    assert scheduled["pis"]["paymentReview"]["status"] == "READY_FOR_CONFIRMATION"
    assert scheduled["pis"]["paymentReview"]["rows"]


@pytest.mark.asyncio
async def test_subscription_question_does_not_resume_previous_pis_flow():
    clear_conversations()
    clear_consent_journeys()

    class DisabledLLM:
        is_configured = False

    payment = await handle_financial_agent_message(
        "i want transfer 300SGD to my mom",
        llm_client=DisabledLLM(),
    )
    response = await handle_financial_agent_message(
        "Which subscriptions am I paying for?",
        conversation_id=payment["conversationId"],
        llm_client=DisabledLLM(),
    )

    assert response["intent"] == "detect_subscriptions"
    assert response["toolCalls"][0]["name"] == "ais_start_consent_journey"
    assert response["agentWorkbench"]["capability"]["name"] == "AIS"
    assert "payment review table" not in response["answer"]


@pytest.mark.asyncio
async def test_ais_resume_handles_how_much_spend_question():
    clear_conversations()
    clear_consent_journeys()

    class DisabledLLM:
        is_configured = False

    consent = await handle_financial_agent_message(
        "how much i spend this month",
        llm_client=DisabledLLM(),
    )
    response = await approve_and_resume(consent)

    assert response["intent"] == "analyze_spending_change"
    assert response["ais"]["spendingAnalysis"]["totalCurrent"] > 0
    assert "I can analyze spending changes" not in response["answer"]
    assert "spending increased" in response["answer"]


@pytest.mark.asyncio
async def test_ais_resume_reenters_llm_agent_for_original_spend_question():
    clear_conversations()
    clear_consent_journeys()

    class ConsentLLM:
        is_configured = True
        calls = 0

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[FinancialLLMToolCall("call-consent", "ais_start_consent_journey", {})],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = "Please grant AIS consent first."
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    class SpendResumeLLM:
        is_configured = True

        def __init__(self):
            self.calls = 0
            self.messages_by_call = []

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            self.messages_by_call.append(messages)
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[
                        FinancialLLMToolCall(
                            "call-current-month-transactions",
                            "ais_get_transactions",
                            {"from_date": "2026-05-01", "to_date": "2026-05-03"},
                        )
                    ],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = "You spent SGD 205.28 this month based on current-month AIS transactions."
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    consent = await handle_financial_agent_message(
        "how much i spend this month",
        llm_client=ConsentLLM(),
    )
    resume_llm = SpendResumeLLM()
    response = await approve_and_resume(consent, llm_client=resume_llm)

    assert response["toolCalls"][0]["name"] == "ais_get_transactions"
    assert response["intent"] == "get_transactions"
    assert response["ais"]["transactions"]
    assert "AIS consent authorised" in response["answer"]
    assert "You spent SGD 205.28 this month" in response["answer"]
    assert "I can analyze spending changes" not in response["answer"]
    assert resume_llm.calls >= 2


@pytest.mark.asyncio
async def test_agent_runtime_stores_direct_pis_details_before_type_selection():
    clear_conversations()

    class DirectPaymentLLM:
        is_configured = True
        calls = 0

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[
                        FinancialLLMToolCall(
                            "call-direct-payment",
                            "pis_prepare_payment_review",
                            {"payee": "mom", "amount": 300, "currency": "SGD"},
                        )
                    ],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = "Payment review prepared. No payment has been executed."
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    response = await handle_financial_agent_message(
        "i want transfer 300SGD to my mom",
        llm_client=DirectPaymentLLM(),
    )

    state = response["pis"]["paymentIntentState"]
    assert response["toolCalls"][0]["name"] == "pis_prepare_payment_review"
    assert response["toolCalls"][0]["status"] == "success"
    assert state["status"] == "payment_type_required"
    assert state["collectedDetails"]["creditorName"] == "mom"
    assert state["collectedDetails"]["amount"] == 300
    assert "paymentType" in state["missingDetails"]


@pytest.mark.asyncio
async def test_agent_runtime_accepts_llm_explicit_pis_request_for_typo_payment_text():
    clear_conversations()

    initial = await handle_financial_agent_message("i want to make a payment")
    typed = await handle_financial_agent_message(
        "Immediate domestic payment",
        conversation_id=initial["conversationId"],
    )

    class TypoPaymentLLM:
        is_configured = True
        calls = 0

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[
                        FinancialLLMToolCall(
                            "call-typo-payment",
                            "pis_prepare_payment_review",
                            {
                                "explicit_user_request": True,
                                "payee": "Amy",
                                "amount": 300,
                                "currency": "SGD",
                            },
                        )
                    ],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = "Payment review prepared. No payment has been executed."
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    response = await handle_financial_agent_message(
        "i want to tranfer my friend amy 300 SGD",
        conversation_id=typed["conversationId"],
        llm_client=TypoPaymentLLM(),
    )

    state = response["pis"]["paymentIntentState"]
    review = response["pis"]["paymentReview"]
    assert response["toolCalls"][0]["name"] == "pis_prepare_payment_review"
    assert response["toolCalls"][0]["status"] == "success"
    assert response["capabilityUsed"] == ["PIS"]
    assert state["paymentType"] == "immediate_domestic"
    assert state["status"] == "ready_for_consent_preparation"
    assert state["collectedDetails"]["creditorName"] == "Amy"
    assert state["collectedDetails"]["amount"] == 300
    assert review["rows"][0]["payee"] == "Amy"
    assert review["rows"][0]["amount"] == 300
    assert response["agentWorkbench"]["capability"]["name"] == "PIS"


@pytest.mark.asyncio
async def test_agent_runtime_requires_llm_tool_route_for_payment_type_answer():
    clear_conversations()

    class RequiredPaymentRouteLLM:
        is_configured = True
        calls = 0
        required_flags = []

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            self.required_flags.append(require_tool_call)
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[
                        FinancialLLMToolCall(
                            "call-start-payment",
                            "pis_start_payment_journey",
                            {"explicit_user_request": True},
                        )
                    ],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = "Please choose one payment type: immediate, scheduled, or variable recurring. No payment has been executed."
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    llm = RequiredPaymentRouteLLM()
    response = await handle_financial_agent_message(
        "i want to tranfer my friend amy 300 SGD",
        llm_client=llm,
    )

    assert llm.required_flags[0] is True
    assert response["toolCalls"][0]["name"] == "pis_start_payment_journey"
    assert response["intent"] == "prepare_payment_drafts"
    assert response["capabilityUsed"] == ["PIS"]
    assert response["agentWorkbench"]["intent"]["label"] == "Prepare payment"
    assert response["agentWorkbench"]["capability"]["name"] == "PIS"


@pytest.mark.asyncio
async def test_agent_runtime_respects_llm_selected_tool_after_consent():
    clear_conversations()
    clear_consent_journeys()

    class AccountToolLLM:
        is_configured = True

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            return FinancialLLMReply(
                content=None,
                tool_calls=[FinancialLLMToolCall("call-wrong", "ais_list_accounts", {})],
                raw_message={"role": "assistant", "content": None, "tool_calls": []},
            )

    consent = await handle_financial_agent_message("Show my recent transactions.")
    resumed = await approve_and_resume(consent)
    response = await handle_financial_agent_message(
        "Why did I spend more this month?",
        conversation_id=resumed["conversationId"],
        llm_client=AccountToolLLM(),
    )
    assert response["toolCalls"][0]["name"] == "ais_list_accounts"
    assert response["ais"]["accounts"]
    assert response["intent"] == "list_accounts"


@pytest.mark.asyncio
async def test_agent_runtime_summarizes_transactions_without_markdown_table():
    clear_conversations()
    clear_consent_journeys()

    class TransactionLLM:
        is_configured = True
        calls = 0

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[FinancialLLMToolCall("call-transactions", "ais_get_transactions", {})],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = "| Date | Merchant | Amount |\n|---|---|---|\n| bad | duplicate | table |"
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    consent = await handle_financial_agent_message("Show my recent transactions.")
    resumed = await approve_and_resume(consent)
    response = await handle_financial_agent_message(
        "Show my recent transactions.",
        conversation_id=resumed["conversationId"],
        llm_client=TransactionLLM(),
    )
    assert response["toolCalls"][0]["name"] == "ais_get_transactions"
    assert len(response["ais"]["transactions"]) == 10
    assert "| Date |" not in response["answer"]
    assert "transaction details are shown below" in response["answer"]


@pytest.mark.asyncio
async def test_agent_runtime_overrides_markdown_tables_for_bills_and_subscriptions():
    clear_conversations()
    clear_consent_journeys()

    class MarkdownTableLLM:
        is_configured = True

        def __init__(self, tool_name):
            self.tool_name = tool_name
            self.calls = 0

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[FinancialLLMToolCall("call-structured", self.tool_name, {})],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = "| Name | Amount |\n|---|---|\n| duplicate | bad |"
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    consent = await handle_financial_agent_message("What bills do I need to pay this week?")
    resumed = await approve_and_resume(consent)
    bills = await handle_financial_agent_message(
        "What bills do I need to pay this week?",
        conversation_id=resumed["conversationId"],
        llm_client=MarkdownTableLLM("ais_detect_upcoming_bills"),
    )
    subscriptions = await handle_financial_agent_message(
        "Which subscriptions am I paying for?",
        conversation_id=resumed["conversationId"],
        llm_client=MarkdownTableLLM("ais_detect_subscriptions"),
    )

    assert "| Name |" not in bills["answer"]
    assert "bill details are shown below" in bills["answer"]
    assert bills["ais"]["upcomingBills"]["upcomingBills"]
    assert "| Name |" not in subscriptions["answer"]
    assert "Subscription details are shown below" in subscriptions["answer"]
    assert subscriptions["ais"]["subscriptions"]["subscriptions"]


@pytest.mark.asyncio
async def test_agent_runtime_preserves_llm_spending_answer():
    clear_conversations()
    clear_consent_journeys()

    class SpendingLLM:
        is_configured = True
        calls = 0

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[FinancialLLMToolCall("call-spending", "ais_analyze_spending_change", {})],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = (
                "Actually, looking at the numbers, you're **not** spending more this month.\n\n"
                "| Period | Total Debits |\n"
                "|---|---|\n"
                "| **Last month** | **SGD 2,084.14** |\n"
                "| **This month** | **SGD 211.30** |\n\n"
                "The main reasons spending is lower are travel and shopping."
            )
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    consent = await handle_financial_agent_message("Why did I spend more this month?")
    resumed = await approve_and_resume(consent)
    response = await handle_financial_agent_message(
        "Why did I spend more this month?",
        conversation_id=resumed["conversationId"],
        llm_client=SpendingLLM(),
    )

    assert response["toolCalls"][0]["name"] == "ais_analyze_spending_change"
    assert "Actually, looking at the numbers" in response["answer"]
    assert "| Period | Total Debits |" in response["answer"]
    assert "The main drivers are ." not in response["answer"]


@pytest.mark.asyncio
async def test_agent_runtime_preserves_llm_spending_total_after_helper_account_tool():
    clear_conversations()
    clear_consent_journeys()

    class MonthlySpendLLM:
        is_configured = True
        calls = 0

        async def chat(self, messages, tools=None, trace_label="test", require_tool_call=False):
            self.calls += 1
            if self.calls == 1:
                return FinancialLLMReply(
                    content=None,
                    tool_calls=[
                        FinancialLLMToolCall("call-accounts", "ais_list_accounts", {}),
                        FinancialLLMToolCall(
                            "call-transactions",
                            "ais_get_transactions",
                            {"from_date": "2026-04-01", "to_date": "2026-04-30"},
                        ),
                    ],
                    raw_message={"role": "assistant", "content": None, "tool_calls": []},
                )
            content = (
                "Based on your transactions for **April 2026**, here's your spending summary:\n\n"
                "**Total Spending (All Debits):** **SGD 2,084.14**\n\n"
                "| Category | Amount |\n"
                "|---|---|\n"
                "| Travel | SGD 771.00 |"
            )
            return FinancialLLMReply(content=content, tool_calls=[], raw_message={"role": "assistant", "content": content})

    consent = await handle_financial_agent_message("how much i spend last month")
    resumed = await approve_and_resume(consent)
    response = await handle_financial_agent_message(
        "how much i spend last month",
        conversation_id=resumed["conversationId"],
        llm_client=MonthlySpendLLM(),
    )

    assert [call["name"] for call in response["toolCalls"]] == ["ais_list_accounts", "ais_get_transactions"]
    assert response["intent"] == "get_transactions"
    assert "Total Spending (All Debits)" in response["answer"]
    assert "SGD 2,084.14" in response["answer"]
    assert "I found 6 AIS accounts" not in response["answer"]
