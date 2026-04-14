from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class ConversationSessionStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class ConversationSessionCreate(BaseModel):
    scenario_id: int


class ConversationSessionRead(BaseModel):
    id: str
    scenario_id: int
    status: ConversationSessionStatus
    started_at: datetime
    ended_at: datetime | None = None
