from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user_claims, get_db_session
from app.api.v1.endpoints import audio as audio_endpoint
from app.core.database import Base
from app.main import app
from app.models import Country, ConversationSession, Scenario, User


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    future=True,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def override_get_db_session() -> Generator[Session, None, None]:
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def override_get_current_user_claims() -> dict[str, str]:
    return {"sub": "audio-user", "email": "audio@example.com"}


app.dependency_overrides[get_db_session] = override_get_db_session
app.dependency_overrides[get_current_user_claims] = override_get_current_user_claims


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_session() -> str:
    with TestingSessionLocal() as db:
        country = Country(code="CL", name="Chile", language="es", is_active=True)
        db.add(country)
        db.flush()

        scenario = Scenario(
            country_id=country.id,
            slug="aeroport-santiago",
            title="Arrivée à l'aéroport de Santiago",
            description="Airport arrival",
            language_code="es",
            difficulty="beginner",
            mode="guided",
            partner_name="Matías",
            partner_role="Employé de l'aéroport de Santiago",
            system_prompt="Prompt",
            is_active=True,
        )
        db.add(scenario)

        user = User(id="audio-user", email="audio@example.com")
        db.add(user)
        db.flush()

        session = ConversationSession(user_id=user.id, scenario_id=scenario.id, status="active")
        db.add(session)
        db.commit()

        return session.id


def test_session_speech_returns_audio_bytes(monkeypatch) -> None:
    session_id = seed_session()

    def fake_speech(*, text: str, voice: str | None = None, speed: float = 1.0) -> bytes:
        assert text == "Hola"
        assert voice == "onyx"
        assert speed == 1.0
        return b"fake-mp3"

    monkeypatch.setattr(audio_endpoint.ai_service, "synthesize_speech", fake_speech)

    client = TestClient(app)
    response = client.post(
        f"/api/v1/conversation-sessions/{session_id}/speech",
        json={"text": "Hola"},
    )

    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/mpeg"
    assert response.content == b"fake-mp3"


def test_session_transcription_returns_text(monkeypatch) -> None:
    session_id = seed_session()

    def fake_transcription(*, audio_path, language: str | None = None) -> str:
        assert language == "es"
        assert audio_path.exists()
        return "hola, acabo de llegar"

    monkeypatch.setattr(audio_endpoint.ai_service, "transcribe_audio", fake_transcription)

    client = TestClient(app)
    response = client.post(
        f"/api/v1/conversation-sessions/{session_id}/transcription",
        files={"audio": ("recording.webm", b"fake-audio", "audio/webm")},
    )

    assert response.status_code == 200
    assert response.json() == {"text": "hola, acabo de llegar"}
