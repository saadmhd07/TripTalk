from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    """Persistence helpers for application users."""

    def get_by_email(self, db: Session, email: str) -> User | None:
        stmt: Select[tuple[User]] = select(User).where(User.email == email)
        return db.scalar(stmt)

    def get_by_id(self, db: Session, user_id: str) -> User | None:
        stmt: Select[tuple[User]] = select(User).where(User.id == user_id)
        return db.scalar(stmt)

    def create(self, db: Session, *, user_id: str, email: str) -> User:
        user = User(id=user_id, email=email)
        db.add(user)
        db.flush()
        return user

    def get_or_create(self, db: Session, *, user_id: str, email: str) -> User:
        user = self.get_by_id(db, user_id)
        if user is not None:
            return user

        user_by_email = self.get_by_email(db, email)
        if user_by_email is not None:
            return user_by_email

        return self.create(db, user_id=user_id, email=email)
