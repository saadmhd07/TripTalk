from pydantic import BaseModel


class ScenarioRead(BaseModel):
    id: int
    country_id: int
    slug: str
    title: str
    description: str
    language_code: str
    difficulty: str
    mode: str
    intro_message: str | None = None
    cultural_tip: str | None = None
    vocabulary_hints: str | None = None
    partner_name: str | None = None
    partner_role: str | None = None
    avatar_id: str | None = None
    is_active: bool
