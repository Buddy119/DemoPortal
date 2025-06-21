import logging
from fastapi import FastAPI
from routers import api
from sockets.websocket import socket_app

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Dev Portal API")

# Include routers
app.include_router(api.router)

# Mount the socket.io ASGI app
app.mount("/", socket_app)

logger.info("Application startup complete")

