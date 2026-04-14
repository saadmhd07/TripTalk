from typing import Any

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_supabase_token


DbSession = Session


def get_current_user_claims(
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    if not authorization and settings.dev_mode:
        return {"sub": "dev-user", "email": settings.dev_user_email}

    if not authorization:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth header")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth header")

    try:
        return decode_supabase_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def get_db_session(db: Session = Depends(get_db)) -> Session:
    return db
