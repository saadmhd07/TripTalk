from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_claims, get_db_session
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import ProfileUpdate, UserProfileRead

router = APIRouter()
profile_repository = ProfileRepository()
user_repository = UserRepository()


def build_user_profile_response(*, user_id: str, email: str | None, profile) -> UserProfileRead:
    return UserProfileRead(
        id=user_id,
        email=email,
        display_name=profile.display_name if profile else None,
        native_language=profile.native_language if profile else None,
    )


@router.get("/me", response_model=UserProfileRead)
def get_me(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db_session),
) -> UserProfileRead:
    user_id = str(claims.get("sub", ""))
    email = claims.get("email")
    user = user_repository.get_or_create(db, user_id=user_id, email=str(email))
    profile = profile_repository.get_by_user_id(db, user.id)
    db.commit()

    return build_user_profile_response(
        user_id=user.id,
        email=user.email,
        profile=profile,
    )


@router.patch("/me/profile", response_model=UserProfileRead)
def update_my_profile(
    payload: ProfileUpdate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db_session),
) -> UserProfileRead:
    user_id = str(claims.get("sub", ""))
    email = claims.get("email")
    user = user_repository.get_or_create(db, user_id=user_id, email=str(email))
    profile = profile_repository.upsert_for_user(
        db,
        user_id=user.id,
        display_name=payload.display_name,
        native_language=payload.native_language,
    )
    db.commit()

    return build_user_profile_response(
        user_id=user.id,
        email=user.email,
        profile=profile,
    )
