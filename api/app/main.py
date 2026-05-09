from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import text

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.database import SessionLocal
from app.core.logging import get_logger, setup_logging
from app.core.rate_limit import limiter

setup_logging()
logger = get_logger(__name__)


def create_application() -> FastAPI:
    logger.info(f"Starting {settings.app_name} in {settings.app_env} mode")
    app = FastAPI(
        title=settings.app_name,
        debug=settings.app_debug,
        version="0.1.0",
    )

    # Add rate limiting
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["health"])
    def healthcheck() -> dict[str, str]:
        with SessionLocal() as db:
            db.execute(text("SELECT 1"))
        return {"status": "ok"}

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_application()
