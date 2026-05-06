from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel


class ConversationSessionStatus(StrEnum):
    ACTIVE = "active"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class ConversationSessionCreate(BaseModel):
    scenario_id: int
    level_at_start: str | None = None


class ConversationSessionRead(BaseModel):
    id: str
    scenario_id: int
    status: ConversationSessionStatus
    level_at_start: str | None = None
    started_at: datetime
    ended_at: datetime | None = None


class ConversationSessionHistoryRead(BaseModel):
    id: str
    scenario_id: int
    scenario_title: str
    country_name: str
    country_code: str
    language_code: str
    mode: str
    status: ConversationSessionStatus
    level_at_start: str | None = None
    intro_message: str | None = None
    cultural_tip: str | None = None
    vocabulary_hints: str | None = None
    partner_name: str | None = None
    partner_role: str | None = None
    last_message_preview: str | None = None
    has_feedback: bool
    started_at: datetime
    ended_at: datetime | None = None


class ConversationSessionDetailRead(BaseModel):
    id: str
    scenario_id: int
    scenario_title: str
    country_name: str
    country_code: str
    language_code: str
    mode: str
    status: ConversationSessionStatus
    level_at_start: str | None = None
    intro_message: str | None = None
    cultural_tip: str | None = None
    vocabulary_hints: str | None = None
    partner_name: str | None = None
    partner_role: str | None = None
    started_at: datetime
    ended_at: datetime | None = None
