import socketio
from langchain.callbacks.base import BaseCallbackHandler

from services.mcp_client import Completion
from services.mode_handlers import (
    ExternalSearchError,
    handle_agent_mode,
    handle_normal_mode,
)

# Setup Async WebSocket server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# ASGI application to mount in FastAPI
socket_app = socketio.ASGIApp(sio)


class WebSocketStreamHandler(BaseCallbackHandler):
    """Stream LLM tokens to the websocket client."""

    def __init__(self, sid: str) -> None:
        self.sid = sid

    async def on_llm_new_token(self, token: str, **kwargs) -> None:  # type: ignore[override]
        await sio.emit("bot_stream", {"token": token}, room=self.sid)

@sio.event
async def connect(sid, environ):
    print(f'Client connected: {sid}')

@sio.event
async def disconnect(sid):
    print(f'Client disconnected: {sid}')

@sio.event
async def user_message(sid, data):
    print(f'Received message from {sid}: {data}')
    mode = str(data.get("mode", "normal")).lower()
    if mode not in {"normal", "agent"}:
        mode = "normal"
    message = data.get("userQuery", "")
    current_mode = mode
    try:
        if mode == "agent":
            stream_handler = WebSocketStreamHandler(sid)
            completion = await handle_agent_mode(message, stream_handler=stream_handler)
        else:
            completion = await handle_normal_mode(message)
    except ExternalSearchError:
        completion = Completion(
            text=(
                "\u26A0\uFE0F External retrieval failed in Agent Mode. Automatically reverting to Normal Mode."
            ),
            highlight_selector=None,
        )
        current_mode = "normal"
    await sio.emit(
        "bot_response",
        {
            "responseText": completion.text,
            "highlightSelector": completion.highlight_selector,
            "mode": current_mode,
        },
        room=sid,
    )

