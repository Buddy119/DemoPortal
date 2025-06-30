import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import api, chat
from services.mcp_client import mcp_server
from sockets.websocket import socket_app
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file if present
load_dotenv()

app = FastAPI(title="Dev Portal API")

# Allow frontend dev server to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api.router)
app.include_router(chat.router)

# Mount the socket.io ASGI app
app.mount("/", socket_app)
app.mount("/mcp", mcp_server.sse_app())

logger.info("Application startup complete")

