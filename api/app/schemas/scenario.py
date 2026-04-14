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
    is_active: bool
