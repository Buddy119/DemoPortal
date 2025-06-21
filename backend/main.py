import logging
from fastapi import FastAPI
from routers import api

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Dev Portal API")

# Include routers from routers/api.py
app.include_router(api.router)

logger.info("Application startup complete")
