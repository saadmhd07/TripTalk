from pydantic import BaseModel


class CountryRead(BaseModel):
    id: int
    code: str
    name: str
    language: str
    is_active: bool
