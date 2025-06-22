from fastapi import APIRouter
from pydantic import BaseModel

from services.mcp_client import mcp_client

router = APIRouter()


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    message: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    completion = await mcp_client.complete({}, req.message)
    return ChatResponse(message=completion.text)
