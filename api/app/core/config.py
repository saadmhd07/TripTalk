from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "TripTalk API"
    app_env: str = "development"
    app_debug: bool = True
    api_v1_prefix: str = "/api/v1"
    frontend_url: str = "http://localhost:3000"
    dev_user_email: str = "dev@triptalk.local"

    @property
    def dev_mode(self) -> bool:
        """Dev mode enabled only when app_env is 'development'"""
        return self.app_env == "development"

    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/triptalk"

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_jwt_secret: str = ""

    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    openai_chat_model: str | None = None
    openai_feedback_model: str | None = None
    openai_tts_model: str = "tts-1"
    openai_stt_model: str = "whisper-1"
    openai_tts_voice_default: str = "alloy"
    openai_tts_voice_chile: str = "onyx"
    openai_tts_voice_usa: str = "alloy"
    tts_provider: str = "openai"

    elevenlabs_api_key: str = ""
    elevenlabs_tts_model: str = "eleven_multilingual_v2"
    elevenlabs_tts_output_format: str = "mp3_44100_128"
    elevenlabs_tts_voice_default: str = ""
    elevenlabs_tts_voice_chile: str = ""
    elevenlabs_tts_voice_usa: str = ""

    @property
    def effective_openai_chat_model(self) -> str:
        return self.openai_chat_model or self.openai_model

    @property
    def effective_openai_feedback_model(self) -> str:
        return self.openai_feedback_model or self.effective_openai_chat_model

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
