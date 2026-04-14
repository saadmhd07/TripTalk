from pydantic import BaseModel


class SessionRead(BaseModel):
    user: dict
