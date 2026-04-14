import json

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.feedback import Feedback


class FeedbackRepository:
    """Persistence helpers for generated session feedback."""

    def get_by_session_id(self, db: Session, session_id: str) -> Feedback | None:
        stmt: Select[tuple[Feedback]] = select(Feedback).where(Feedback.session_id == session_id)
        return db.scalar(stmt)

    def upsert_for_session(
        self,
        db: Session,
        *,
        session_id: str,
        global_score: int,
        vocabulary_score: int | None,
        fluency_score: int | None,
        strengths: list[str],
        improvements: list[str],
        cultural_tip: str | None,
    ) -> Feedback:
        feedback = self.get_by_session_id(db, session_id)
        if feedback is None:
            feedback = Feedback(session_id=session_id, global_score=global_score)
            db.add(feedback)

        feedback.global_score = global_score
        feedback.vocabulary_score = vocabulary_score
        feedback.fluency_score = fluency_score
        feedback.strengths = json.dumps(strengths)
        feedback.improvements = json.dumps(improvements)
        feedback.cultural_tip = cultural_tip
        db.flush()
        return feedback

    @staticmethod
    def deserialize_list(value: str | None) -> list[str]:
        if not value:
            return []
        try:
            data = json.loads(value)
        except json.JSONDecodeError:
            return []
        return [str(item) for item in data if isinstance(item, str)]
