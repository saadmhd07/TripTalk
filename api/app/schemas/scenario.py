from pydantic import BaseModel


class ScenarioRead(BaseModel):
    id: int
    country_id: int
    slug: str
    title: str
    description: str
    difficulty: str
    is_active: bool
