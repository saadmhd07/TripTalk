from datetime import datetime

from pydantic import BaseModel


class FeedbackRead(BaseModel):
    id: int
    session_id: str
    global_score: int
    vocabulary_score: int | None = None
    fluency_score: int | None = None
    strengths: list[str] = []
    improvements: list[str] = []
    cultural_tip: str | None = None
    created_at: datetime
