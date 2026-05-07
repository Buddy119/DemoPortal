import logging
import time
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from routers import api, chat, financial
from services.mcp_client import mcp_server
from sockets.websocket import sio
import socketio
from dotenv import load_dotenv

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables from .env file if present
load_dotenv()

app = FastAPI(title="Dev Portal API")


@app.middleware("http")
async def log_http_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    if request.url.path.startswith(("/api", "/obie", "/chat", "/mcp")):
        logger.info(
            "HTTP %s %s%s -> %s %.1fms client=%s",
            request.method,
            request.url.path,
            f"?{request.url.query}" if request.url.query else "",
            response.status_code,
            duration_ms,
            request.client.host if request.client else "unknown",
        )
    return response

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
app.include_router(financial.router)
app.include_router(financial.obie_router)

# Mount the MCP SSE app
app.mount("/mcp", mcp_server.http_app(transport="sse"))

# Wrap the FastAPI app with Socket.IO ASGI app
app = socketio.ASGIApp(sio, other_asgi_app=app)

logger.info("Application startup complete")
