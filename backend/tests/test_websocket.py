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
async def test_websocket_user_message(start_server):
    sio = socketio.AsyncClient()
    received = []

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

    await sio.disconnect()
    assert not sio.connected
