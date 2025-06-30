from fastapi import APIRouter
from fastapi.responses import StreamingResponse
import asyncio
from pydantic import BaseModel, validator
from langchain.callbacks.base import BaseCallbackHandler

from services.mode_handlers import handle_agent_mode, handle_normal_mode

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    mode: str = "normal"
    stream: bool = False

    @validator("mode", pre=True, always=True)
    def validate_mode(cls, v):
        if not v:
            return "normal"
        v = str(v).lower()
        return v if v in {"normal", "agent"} else "normal"


class ChatResponse(BaseModel):
    message: str


@router.post("/chat")
async def chat(req: ChatRequest):
    if req.stream and req.mode == "agent":
        queue: asyncio.Queue[str | None] = asyncio.Queue()

        class StreamHandler(BaseCallbackHandler):
            async def on_llm_new_token(self, token: str, **kwargs) -> None:  # type: ignore[override]
                await queue.put(token)

        async def run_agent() -> None:
            await handle_agent_mode(req.message, stream_handler=StreamHandler())
            await queue.put(None)

        asyncio.create_task(run_agent())

        async def event_generator():
            while True:
                token = await queue.get()
                if token is None:
                    break
                # Escape newline characters so the SSE protocol remains valid
                encoded = token.replace("\n", "\\n")
                yield f"data: {encoded}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(event_generator(), media_type="text/event-stream")

    if req.mode == "agent":
        completion = await handle_agent_mode(req.message)
    else:
        completion = await handle_normal_mode(req.message)
    return ChatResponse(message=completion.text)
