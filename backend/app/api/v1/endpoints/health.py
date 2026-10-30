from datetime import datetime, timezone
from fastapi import APIRouter
from ....schemas.auth import HealthResponse
from ....core.config import settings

router = APIRouter()

@router.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    """Health check endpoint to verify backend operational status."""
    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        timestamp=datetime.now(timezone.utc),
    )
