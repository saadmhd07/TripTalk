from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_claims

router = APIRouter()


@router.get("/session")
def get_session(claims: dict = Depends(get_current_user_claims)) -> dict:
    return {"user": claims}
