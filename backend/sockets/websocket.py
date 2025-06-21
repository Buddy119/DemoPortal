import socketio

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
    response = {
        "responseText": "Here is the curl example command for the User Authentication API:\n\ncurl -X POST https://example.com/api/v1/auth -H 'Content-Type: application/json' -d '{\"username\": \"your_username\", \"password\": \"your_password\"}'",
        "highlightSelector": "#user-auth-api-section"
    }
    await sio.emit('bot_response', response, room=sid)
