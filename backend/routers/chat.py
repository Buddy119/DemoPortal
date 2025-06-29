from fastapi import APIRouter
from pydantic import BaseModel, validator

from services.mode_handlers import handle_agent_mode, handle_normal_mode

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    mode: str | None = "normal"

    @validator("mode", pre=True, always=True)
    def validate_mode(cls, v):
        if not v:
            return "normal"
        v = str(v).lower()
        return v if v in {"normal", "agent"} else "normal"


class ChatResponse(BaseModel):
    message: str


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    if req.mode == "agent":
        completion = await handle_agent_mode(req.message)
    else:
        completion = await handle_normal_mode(req.message)
    return ChatResponse(message=completion.text)
