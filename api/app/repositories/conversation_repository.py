from datetime import UTC, datetime

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.conversation_session import ConversationSession, ConversationSessionStatus
from app.models.message import Message


class ConversationRepository:
    """Persistence helpers for sessions and messages."""

    def create_session(
        self,
        db: Session,
        *,
        user_id: str,
        scenario_id: int,
        level_at_start: str | None = None,
    ) -> ConversationSession:
        session = ConversationSession(
            user_id=user_id,
            scenario_id=scenario_id,
            status=ConversationSessionStatus.ACTIVE.value,
            level_at_start=level_at_start,
        )
        db.add(session)
        db.flush()
        return session

    def get_session(self, db: Session, session_id: str) -> ConversationSession | None:
        stmt: Select[tuple[ConversationSession]] = select(ConversationSession).where(
            ConversationSession.id == session_id
        )
        return db.scalar(stmt)

    def get_session_for_user(
        self,
        db: Session,
        *,
        session_id: str,
        user_id: str,
    ) -> ConversationSession | None:
        stmt: Select[tuple[ConversationSession]] = select(ConversationSession).where(
            ConversationSession.id == session_id,
            ConversationSession.user_id == user_id,
        )
        return db.scalar(stmt)

    def complete_session(self, db: Session, session: ConversationSession) -> ConversationSession:
        session.status = ConversationSessionStatus.COMPLETED.value
        session.ended_at = datetime.now(UTC)
        db.flush()
        return session

    def create_message(self, db: Session, *, session_id: str, role: str, content: str) -> Message:
        message = Message(session_id=session_id, role=role, content=content)
        db.add(message)
        db.flush()
        return message

    def list_messages(self, db: Session, session_id: str) -> list[Message]:
        stmt: Select[tuple[Message]] = (
            select(Message)
            .where(Message.session_id == session_id)
            .order_by(Message.created_at.asc(), Message.id.asc())
        )
        return list(db.scalars(stmt))
