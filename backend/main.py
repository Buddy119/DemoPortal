import logging
from fastapi import FastAPI
from routers import api
from sockets.websocket import socket_app
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file if present
load_dotenv()

app = FastAPI(title="Dev Portal API")

# Include routers
app.include_router(api.router)

# Mount the socket.io ASGI app
app.mount("/", socket_app)

logger.info("Application startup complete")

