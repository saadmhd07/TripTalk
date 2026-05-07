from datetime import datetime

from pydantic import BaseModel


class FeedbackRead(BaseModel):
    id: int
    session_id: str
    readiness_score: int
    situation_verdict: str
    perceived_impression: str
    key_moment: str
    natural_response_tips: list[str] = []
    cultural_code: str | None = None
    next_step: str
    created_at: datetime
