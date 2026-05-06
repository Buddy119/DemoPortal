from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services.financial_agent_runtime import handle_financial_agent_message, resume_after_consent
from services.financial_bill_service import detect_upcoming_bills
from services.financial_consent_journey_service import (
    authorize_consent_journey,
    get_consent_journey,
    handle_open_banking_callback,
    start_ais_consent_journey,
    start_pis_consent_journey,
)
from services.financial_constants import DEMO_USER_ID
from services.financial_data_service import list_accounts, list_transactions
from services.financial_payment_draft_service import prepare_payment_drafts
from services.financial_recurring_service import detect_subscriptions
from services.financial_spending_service import get_spending_comparison


router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


def _message_preview(message: str, max_len: int = 120) -> str:
    compact = " ".join(message.split())
    return compact if len(compact) <= max_len else f"{compact[:max_len]}..."


class AssistantChatRequest(BaseModel):
    message: str
    userId: str = DEMO_USER_ID
    conversationId: Optional[str] = None


class PaymentDraftRequest(BaseModel):
    userId: str = DEMO_USER_ID
    bills: Optional[List[Dict[str, Any]]] = None
    paymentType: str = "immediate_domestic"


class StartAisConsentRequest(BaseModel):
    conversationId: Optional[str] = None
    userId: str = DEMO_USER_ID
    originalMessage: str
    permissions: Optional[List[str]] = None


class StartPisConsentRequest(BaseModel):
    conversationId: Optional[str] = None
    userId: str = DEMO_USER_ID
    paymentType: str = "immediate_domestic"
    payment: Optional[Dict[str, Any]] = None
    payments: Optional[List[Dict[str, Any]]] = None


class MockAspspAuthorizeRequest(BaseModel):
    journeyId: str
    consentId: str
    state: str
    decision: str


class OpenBankingCallbackRequest(BaseModel):
    code: str
    state: str


class ResumeAfterConsentRequest(BaseModel):
    conversationId: str
    journeyId: str
    userId: str = DEMO_USER_ID


@router.post("/assistant/chat")
async def assistant_chat(req: AssistantChatRequest) -> dict[str, Any]:
    logger.info(
        "financial.assistant.chat request userId=%s conversationId=%s message=%r",
        req.userId,
        req.conversationId or "new",
        _message_preview(req.message),
    )
    response = await handle_financial_agent_message(req.message, req.userId, req.conversationId)
    logger.info(
        "financial.assistant.chat response conversationId=%s intent=%s capabilities=%s tools=%s warnings=%s",
        response.get("conversationId"),
        response.get("intent"),
        response.get("capabilityUsed", []),
        [call.get("name") for call in response.get("toolCalls", [])],
        response.get("warnings", []),
    )
    return response


@router.post("/psd2/ais/consent/start")
async def start_ais_consent(req: StartAisConsentRequest) -> dict[str, Any]:
    try:
        journey = start_ais_consent_journey(
            conversation_id=req.conversationId,
            user_id=req.userId,
            original_message=req.originalMessage,
            permissions=req.permissions,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    logger.info(
        "financial.ais_consent.start conversationId=%s journeyId=%s consentId=%s",
        journey.get("conversationId"),
        journey.get("journeyId"),
        journey.get("consentId"),
    )
    return journey


@router.post("/psd2/pis/consent/start")
async def start_pis_consent(req: StartPisConsentRequest) -> dict[str, Any]:
    try:
        journey = start_pis_consent_journey(
            conversation_id=req.conversationId,
            user_id=req.userId,
            payment_type=req.paymentType,
            payment=req.payment,
            payments=req.payments,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    logger.info(
        "financial.pis_consent.start conversationId=%s journeyId=%s consentId=%s",
        journey.get("conversationId"),
        journey.get("journeyId"),
        journey.get("consentId"),
    )
    return journey


@router.get("/psd2/consent-journeys/{journey_id}")
async def consent_journey(journey_id: str) -> dict[str, Any]:
    journey = get_consent_journey(journey_id)
    if not journey:
        raise HTTPException(status_code=404, detail="Consent journey not found")
    return journey


@router.post("/mock-aspsp/authorize")
async def mock_aspsp_authorize(req: MockAspspAuthorizeRequest) -> dict[str, str]:
    try:
        result = authorize_consent_journey(
            journey_id=req.journeyId,
            consent_id=req.consentId,
            state_value=req.state,
            decision=req.decision,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    logger.info(
        "financial.mock_aspsp.authorize journeyId=%s consentId=%s decision=%s",
        req.journeyId,
        req.consentId,
        req.decision,
    )
    return result


@router.post("/open-banking/callback")
async def open_banking_callback(req: OpenBankingCallbackRequest) -> dict[str, Any]:
    try:
        result = handle_open_banking_callback(code=req.code, state_value=req.state)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    logger.info(
        "financial.open_banking.callback journeyId=%s consentStatus=%s",
        result.get("journeyId"),
        result.get("consentStatus"),
    )
    return result


@router.post("/assistant/resume-after-consent")
async def assistant_resume_after_consent(req: ResumeAfterConsentRequest) -> dict[str, Any]:
    try:
        response = await resume_after_consent(req.conversationId, req.journeyId, req.userId)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    logger.info(
        "financial.assistant.resume_after_consent conversationId=%s journeyId=%s status=%s",
        response.get("conversationId"),
        req.journeyId,
        response.get("consentJourney", {}).get("consentStatus"),
    )
    return response


@router.get("/accounts")
async def accounts(userId: str = DEMO_USER_ID) -> dict[str, Any]:
    account_list = list_accounts(userId)
    logger.info("financial.accounts userId=%s accounts=%s", userId, len(account_list))
    return {
        "accounts": account_list,
        "totalBalance": round(sum(float(account["balance"]) for account in account_list), 2),
        "totalAvailableBalance": round(
            sum(float(account["availableBalance"]) for account in account_list),
            2,
        ),
        "currency": "SGD",
    }


@router.get("/transactions")
async def transactions(
    userId: str = DEMO_USER_ID,
    from_date: str | None = Query(None, alias="from"),
    to_date: str | None = Query(None, alias="to"),
) -> dict[str, Any]:
    transaction_list = list_transactions(userId, from_date, to_date)
    logger.info(
        "financial.transactions userId=%s from=%s to=%s count=%s",
        userId,
        from_date,
        to_date,
        len(transaction_list),
    )
    return {
        "transactions": transaction_list,
        "count": len(transaction_list),
        "currency": "SGD",
    }


@router.get("/insights/spending-comparison")
async def spending_comparison(
    userId: str = DEMO_USER_ID,
    currentMonth: str | None = None,
    previousMonth: str | None = None,
) -> dict[str, Any]:
    result = get_spending_comparison(userId, currentMonth, previousMonth)
    logger.info(
        "financial.spending_comparison userId=%s currentMonth=%s previousMonth=%s increase=%s topDriver=%s",
        userId,
        result.get("currentMonth"),
        result.get("previousMonth"),
        result.get("increaseAmount"),
        result.get("topDrivers", [{}])[0].get("category") if result.get("topDrivers") else None,
    )
    return result


@router.get("/insights/subscriptions")
async def subscriptions(userId: str = DEMO_USER_ID) -> dict[str, Any]:
    result = detect_subscriptions(userId)
    logger.info("financial.subscriptions userId=%s count=%s", userId, result.get("count"))
    return result


@router.get("/insights/upcoming-bills")
async def upcoming_bills(userId: str = DEMO_USER_ID) -> dict[str, Any]:
    result = detect_upcoming_bills(userId)
    logger.info("financial.upcoming_bills userId=%s count=%s totalDue=%s", userId, result.get("count"), result.get("totalDue"))
    return result


@router.post("/payment-drafts")
async def payment_drafts(req: PaymentDraftRequest) -> dict[str, Any]:
    result = prepare_payment_drafts(req.userId, req.bills, req.paymentType)
    logger.info(
        "financial.payment_drafts userId=%s count=%s status=%s",
        req.userId,
        result.get("count"),
        result.get("status"),
    )
    return result
