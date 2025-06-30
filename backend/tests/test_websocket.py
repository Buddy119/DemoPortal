import asyncio
import os
import sys
import threading
import time

import pytest
import socketio
import uvicorn

# Add the backend directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from main import app
from services.mcp_client import mcp_client
from sockets import websocket


@pytest.fixture(scope="module")
def start_server():
    """Start the FastAPI + Socket.IO server in a background thread."""
    config = uvicorn.Config(app, host="127.0.0.1", port=8000, log_level="warning", lifespan="off")
    server = uvicorn.Server(config)
    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()
    # Give the server a moment to start
    time.sleep(0.5)
    yield
    server.should_exit = True
    thread.join()


@pytest.mark.asyncio
async def test_websocket_connection(start_server):
    sio = socketio.AsyncClient()
    await sio.connect("http://127.0.0.1:8000", transports=["websocket"])
    assert sio.connected
    await sio.disconnect()
    assert not sio.connected


@pytest.mark.asyncio
async def test_websocket_user_message(start_server, monkeypatch):
    sio = socketio.AsyncClient()
    received = []

    class FakeCompletion:
        def __init__(self, text, selector):
            self.text = text
            self.highlight_selector = selector

    async def fake_complete(context, user_query):
        return FakeCompletion(
            "curl -X POST https://example.com/api/v1/auth -d '{\"user\":\"test\"}'",
            "#user-auth-api-section",
        )

    monkeypatch.setattr(mcp_client, "complete", fake_complete)

    @sio.event
    async def bot_response(data):
        received.append(data)

    await sio.connect("http://127.0.0.1:8000", transports=["websocket"])
    assert sio.connected

    test_message = {
        "context": {
            "currentPage": "User Authentication API",
            "selectedLanguage": "curl",
            "previousQueries": ["What APIs do we have?"]
        },
        "userQuery": "Give me a request example for the User Authentication API"
    }
    await sio.emit("user_message", test_message)

    await asyncio.sleep(1)

    assert len(received) == 1
    response = received[0]
    assert response.get("highlightSelector") == "#user-auth-api-section"
    assert "curl -X POST" in response.get("responseText", "")
    assert response.get("mode") == "normal"

    await sio.disconnect()
    assert not sio.connected


@pytest.mark.asyncio
async def test_websocket_agent_error_reverts_mode(start_server, monkeypatch):
    sio = socketio.AsyncClient()
    received = []

    from services import mode_handlers

    async def fake_agent(msg: str):
        raise mode_handlers.ExternalSearchError("failed")

    monkeypatch.setattr(mode_handlers, "handle_agent_mode", fake_agent)

    @sio.event
    async def bot_response(data):
        received.append(data)

    await sio.connect("http://127.0.0.1:8000", transports=["websocket"])
    assert sio.connected

    await sio.emit("user_message", {"userQuery": "hi", "mode": "agent"})
    await asyncio.sleep(1)

    assert len(received) == 1
    data = received[0]
    assert data.get("mode") == "normal"
    assert "External retrieval failed" in data.get("responseText", "")

    await sio.disconnect()
    assert not sio.connected


@pytest.mark.asyncio
async def test_websocket_agent_streaming(start_server, monkeypatch):
    sio = socketio.AsyncClient()
    tokens = []
    final = []

    class FakeAgent:
        def __init__(self, callbacks=None):
            self.callbacks = callbacks or []

        async def invoke(self, inputs):
            for cb in self.callbacks:
                await cb.on_llm_new_token("hi")
            return {"output": "done"}

    import services.mode_handlers as mode_handlers
    monkeypatch.setattr(mode_handlers, "create_agent", lambda llm=None, callbacks=None: FakeAgent(callbacks))
    monkeypatch.setattr(mode_handlers, "ChatOpenAI", lambda streaming=True, **_: object())

    @sio.event
    async def bot_stream(data):
        tokens.append(data.get("token"))

    @sio.event
    async def bot_response(data):
        final.append(data)

    await sio.connect("http://127.0.0.1:8000", transports=["websocket"])
    await sio.emit("user_message", {"userQuery": "hi", "mode": "agent"})
    await asyncio.sleep(1)

    assert tokens == ["hi"]
    assert final and final[0].get("mode") == "agent"

    await sio.disconnect()
    assert not sio.connected

