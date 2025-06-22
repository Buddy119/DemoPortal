import socketio

from services.mcp_client import mcp_client

# Setup Async WebSocket server
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')

# ASGI application to mount in FastAPI
socket_app = socketio.ASGIApp(sio)

@sio.event
async def connect(sid, environ):
    print(f'Client connected: {sid}')

@sio.event
async def disconnect(sid):
    print(f'Client disconnected: {sid}')

@sio.event
async def user_message(sid, data):
    print(f'Received message from {sid}: {data}')
    completion = await mcp_client.complete(data.get("context", {}), data.get("userQuery", ""))
    await sio.emit(
        "bot_response",
        {
            "responseText": completion.text,
            "highlightSelector": completion.highlight_selector,
        },
        room=sid,
    )
