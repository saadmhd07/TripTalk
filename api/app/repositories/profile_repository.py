from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.profile import Profile


class ProfileRepository:
    """Persistence helpers for user profiles."""

    def get_by_user_id(self, db: Session, user_id: str) -> Profile | None:
        stmt: Select[tuple[Profile]] = select(Profile).where(Profile.user_id == user_id)
        return db.scalar(stmt)

    def create(
        self,
        db: Session,
        *,
        user_id: str,
        display_name: str | None = None,
        native_language: str | None = None,
        target_language: str | None = None,
        level: str | None = None,
    ) -> Profile:
        profile = Profile(
            user_id=user_id,
            display_name=display_name,
            native_language=native_language,
            target_language=target_language,
            level=level,
        )
        db.add(profile)
        db.flush()
        return profile

    def update(
        self,
        db: Session,
        *,
        profile: Profile,
        display_name: str | None,
        native_language: str | None,
        target_language: str | None,
        level: str | None,
    ) -> Profile:
        profile.display_name = display_name
        profile.native_language = native_language
        profile.target_language = target_language
        profile.level = level
        db.flush()
        return profile

    def upsert_for_user(
        self,
        db: Session,
        *,
        user_id: str,
        display_name: str | None,
        native_language: str | None,
        target_language: str | None,
        level: str | None,
    ) -> Profile:
        profile = self.get_by_user_id(db, user_id)
        if profile is None:
            return self.create(
                db,
                user_id=user_id,
                display_name=display_name,
                native_language=native_language,
                target_language=target_language,
                level=level,
            )

        return self.update(
            db,
            profile=profile,
            display_name=display_name,
            native_language=native_language,
            target_language=target_language,
            level=level,
        )
