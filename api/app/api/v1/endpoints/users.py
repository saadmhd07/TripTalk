from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_claims, get_db_session
from app.repositories.profile_repository import ProfileRepository
from app.repositories.user_language_level_repository import UserLanguageLevelRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import (
    ProfileUpdate,
    UserLanguageLevelRead,
    UserLanguageLevelUpsert,
    UserProfileRead,
)

router = APIRouter()
profile_repository = ProfileRepository()
user_repository = UserRepository()
user_language_level_repository = UserLanguageLevelRepository()


def build_user_profile_response(*, user_id: str, email: str | None, profile) -> UserProfileRead:
    return UserProfileRead(
        id=user_id,
        email=email,
        display_name=profile.display_name if profile else None,
        native_language=profile.native_language if profile else None,
        target_language=profile.target_language if profile else None,
        level=profile.level if profile else None,
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
        target_language=payload.target_language,
        level=payload.level,
    )
    db.commit()

    return build_user_profile_response(
        user_id=user.id,
        email=user.email,
        profile=profile,
    )


@router.get("/me/language-levels", response_model=list[UserLanguageLevelRead])
def list_my_language_levels(
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db_session),
) -> list[UserLanguageLevelRead]:
    user = user_repository.get_or_create(
        db,
        user_id=str(claims.get("sub", "")),
        email=str(claims.get("email")),
    )
    db.commit()

    records = user_language_level_repository.list_by_user(db, user_id=user.id)
    return [
        UserLanguageLevelRead(
            id=record.id,
            user_id=record.user_id,
            language_code=record.language_code,
            level=record.level,
        )
        for record in records
    ]


@router.get("/me/language-levels/{language_code}", response_model=UserLanguageLevelRead | None)
def get_my_language_level(
    language_code: str,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db_session),
) -> UserLanguageLevelRead | None:
    user = user_repository.get_or_create(
        db,
        user_id=str(claims.get("sub", "")),
        email=str(claims.get("email")),
    )
    db.commit()

    record = user_language_level_repository.get_by_user_and_language(
        db,
        user_id=user.id,
        language_code=language_code.lower(),
    )
    if record is None:
        return None

    return UserLanguageLevelRead(
        id=record.id,
        user_id=record.user_id,
        language_code=record.language_code,
        level=record.level,
    )


@router.put("/me/language-levels/{language_code}", response_model=UserLanguageLevelRead)
def upsert_my_language_level(
    language_code: str,
    payload: UserLanguageLevelUpsert,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db_session),
) -> UserLanguageLevelRead:
    user = user_repository.get_or_create(
        db,
        user_id=str(claims.get("sub", "")),
        email=str(claims.get("email")),
    )
    record = user_language_level_repository.upsert(
        db,
        user_id=user.id,
        language_code=language_code.lower(),
        level=payload.level,
    )
    db.commit()

    return UserLanguageLevelRead(
        id=record.id,
        user_id=record.user_id,
        language_code=record.language_code,
        level=record.level,
    )
