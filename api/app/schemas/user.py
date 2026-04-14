from pydantic import BaseModel, EmailStr


class ProfileUpdate(BaseModel):
    display_name: str | None = None
    native_language: str | None = None
    target_language: str | None = None
    level: str | None = None


class UserProfileRead(BaseModel):
    id: str
    email: EmailStr | None = None
    display_name: str | None = None
    native_language: str | None = None
    target_language: str | None = None
    level: str | None = None


class UserLanguageLevelUpsert(BaseModel):
    level: str


class UserLanguageLevelRead(BaseModel):
    id: str
    user_id: str
    language_code: str
    level: str
