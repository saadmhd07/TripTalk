import logging
import sys
from typing import Any

from app.core.config import settings


def setup_logging() -> None:
    """Configure structured logging for the application"""
    log_level = logging.DEBUG if settings.app_debug else logging.INFO

    logging.basicConfig(
        level=log_level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )

    # Reduce noise from third-party libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.INFO)


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance for the given module"""
    return logging.getLogger(name)


def log_api_call(logger: logging.Logger, method: str, path: str, user_id: str | None = None) -> None:
    """Log an API call with structured information"""
    extra_info = f" | user={user_id}" if user_id else ""
    logger.info(f"API {method} {path}{extra_info}")


def log_openai_call(
    logger: logging.Logger,
    operation: str,
    model: str,
    tokens: int | None = None,
    error: str | None = None,
) -> None:
    """Log an OpenAI API call with usage information"""
    if error:
        logger.error(f"OpenAI {operation} failed | model={model} | error={error}")
    else:
        token_info = f" | tokens={tokens}" if tokens else ""
        logger.info(f"OpenAI {operation} | model={model}{token_info}")


def log_error(
    logger: logging.Logger,
    context: str,
    error: Exception,
    extra: dict[str, Any] | None = None,
) -> None:
    """Log an error with context and optional extra information"""
    extra_str = f" | {extra}" if extra else ""
    logger.error(f"{context} | error={type(error).__name__}: {error}{extra_str}", exc_info=True)
