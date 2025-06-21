from fastapi import APIRouter
from schemas.responses import RootResponse, HealthCheckResponse

router = APIRouter()

@router.get("/", response_model=RootResponse)
async def read_root() -> RootResponse:
    """Root endpoint returning welcome message."""
    return RootResponse(message="Welcome to the Dev Portal API Server!")


@router.get("/health", response_model=HealthCheckResponse)
async def health_check() -> HealthCheckResponse:
    """Basic health check endpoint."""
    return HealthCheckResponse(status="ok", message="Server is running smoothly.")

