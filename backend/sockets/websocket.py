import socketio

from services.gpt_service import generate_curl_example

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
    context = data.get("context", {})
    user_query = data.get("userQuery", "")

    curl_example = await generate_curl_example(context, user_query)

    response = {
        "responseText": curl_example,
        "highlightSelector": "#user-auth-api-section",
    }

    await sio.emit("bot_response", response, room=sid)
