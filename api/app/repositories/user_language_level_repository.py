from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.user_language_level import UserLanguageLevel


class UserLanguageLevelRepository:
    """Persistence helpers for per-language user levels."""

    def get_by_user_and_language(
        self,
        db: Session,
        *,
        user_id: str,
        language_code: str,
    ) -> UserLanguageLevel | None:
        stmt: Select[tuple[UserLanguageLevel]] = select(UserLanguageLevel).where(
            UserLanguageLevel.user_id == user_id,
            UserLanguageLevel.language_code == language_code,
        )
        return db.scalar(stmt)

    def list_by_user(self, db: Session, *, user_id: str) -> list[UserLanguageLevel]:
        stmt: Select[tuple[UserLanguageLevel]] = (
            select(UserLanguageLevel)
            .where(UserLanguageLevel.user_id == user_id)
            .order_by(UserLanguageLevel.language_code.asc())
        )
        return list(db.scalars(stmt))

    def upsert(
        self,
        db: Session,
        *,
        user_id: str,
        language_code: str,
        level: str,
    ) -> UserLanguageLevel:
        record = self.get_by_user_and_language(db, user_id=user_id, language_code=language_code)
        if record is None:
            record = UserLanguageLevel(
                user_id=user_id,
                language_code=language_code,
                level=level,
            )
            db.add(record)
            db.flush()
            return record

        record.level = level
        db.flush()
        return record
