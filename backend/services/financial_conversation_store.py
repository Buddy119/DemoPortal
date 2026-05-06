from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any
from uuid import uuid4

from .financial_constants import DEMO_USER_ID


@dataclass
class FinancialConversationState:
    conversationId: str
    userId: str = DEMO_USER_ID
    messages: list[dict[str, Any]] = field(default_factory=list)
    lastAisResults: dict[str, Any] = field(default_factory=dict)
    lastPisResults: dict[str, Any] = field(default_factory=dict)
    pendingSuggestedActions: list[dict[str, Any]] = field(default_factory=list)
    explicitPisRequest: bool = False
    paymentIntentState: dict[str, Any] = field(default_factory=dict)
    consentJourneys: dict[str, dict[str, Any]] = field(default_factory=dict)
    aisConsentId: str | None = None
    aisConsentStatus: str | None = None
    activeConsentJourneyId: str | None = None

    def as_policy_context(self) -> dict[str, Any]:
        return {
            "conversationId": self.conversationId,
            "userId": self.userId,
            "lastAisResults": self.lastAisResults,
            "lastPisResults": self.lastPisResults,
            "pendingSuggestedActions": self.pendingSuggestedActions,
            "explicitPisRequest": self.explicitPisRequest,
            "paymentIntentState": self.paymentIntentState,
            "consentJourneys": self.consentJourneys,
            "aisConsentId": self.aisConsentId,
            "aisConsentStatus": self.aisConsentStatus,
            "activeConsentJourneyId": self.activeConsentJourneyId,
        }


_CONVERSATIONS: dict[str, FinancialConversationState] = {}


def get_or_create_conversation(
    conversation_id: str | None = None,
    user_id: str = DEMO_USER_ID,
) -> FinancialConversationState:
    if conversation_id and conversation_id in _CONVERSATIONS:
        state = _CONVERSATIONS[conversation_id]
        state.userId = user_id
        return state
    new_id = conversation_id or f"conv-demo-{uuid4().hex[:12]}"
    state = FinancialConversationState(conversationId=new_id, userId=user_id)
    _CONVERSATIONS[new_id] = state
    return state


def clear_conversations() -> None:
    _CONVERSATIONS.clear()
