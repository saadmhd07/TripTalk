from fastapi import APIRouter, Depends

from app.api.deps import get_current_user_claims
from app.schemas.user import ProfileUpdate, UserProfileRead

router = APIRouter()


@router.get("/me", response_model=UserProfileRead)
def get_me(claims: dict = Depends(get_current_user_claims)) -> UserProfileRead:
    return UserProfileRead(
        id=str(claims.get("sub", "")),
        email=claims.get("email"),
        display_name=None,
        native_language=None,
        target_language=None,
        level=None,
    )


@router.patch("/me/profile", response_model=UserProfileRead)
def update_my_profile(
    payload: ProfileUpdate,
    claims: dict = Depends(get_current_user_claims),
) -> UserProfileRead:
    return UserProfileRead(
        id=str(claims.get("sub", "")),
        email=claims.get("email"),
        display_name=payload.display_name,
        native_language=payload.native_language,
        target_language=payload.target_language,
        level=payload.level,
    )
