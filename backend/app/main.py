import logging

import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.config import settings
from .api.v1.router import api_router
from .api.v1.endpoints.health import router as health_router

logger = logging.getLogger("kindredbridge.api")
is_production = settings.ENVIRONMENT.strip().lower() == "production"

app = FastAPI(
    title=settings.PROJECT_NAME,
    # Keep interactive docs for local development; do not expose them publicly by default.
    openapi_url=None if is_production else f"{settings.API_V1_STR}/openapi.json",
    docs_url=None if is_production else f"{settings.API_V1_STR}/docs",
    redoc_url=None if is_production else f"{settings.API_V1_STR}/redoc",
)

if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept", "Origin"],
    )

app.include_router(health_router, tags=["System"])
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.exception_handler(httpx.TransportError)
async def handle_upstream_transport_error(request: Request, exc: httpx.TransportError):
    """Return a controlled response for transient upstream network failures."""
    logger.exception(
        "Upstream transport failure on %s %s",
        request.method,
        request.url.path,
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=503,
        content={"detail": "A temporary database connection problem occurred. Please try again shortly."},
        headers={"Retry-After": "2"},
    )


@app.get("/")
def root():
    response = {
        "message": "Welcome to KindredBridge API",
        "health": "/health",
    }
    if not is_production:
        response["docs"] = f"{settings.API_V1_STR}/docs"
    return response
