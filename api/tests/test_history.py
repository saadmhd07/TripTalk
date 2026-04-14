from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user_claims, get_db_session
from app.core.database import Base
from app.main import app
from app.models import ConversationSession, Country, Message, Scenario, User


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
    return {"sub": "history-user", "email": "history@example.com"}


app.dependency_overrides[get_db_session] = override_get_db_session
app.dependency_overrides[get_current_user_claims] = override_get_current_user_claims


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_history() -> str:
    with TestingSessionLocal() as db:
        country = Country(code="CL", name="Chile", language="es", is_active=True)
        db.add(country)
        db.flush()

        scenario = Scenario(
            country_id=country.id,
            slug="conversation-libre-chili",
            title="Conversation libre",
            description="Discute librement avec un local chilien",
            language_code="es",
            difficulty="beginner",
            mode="free",
            intro_message="Hola",
            cultural_tip="Conseil test",
            vocabulary_hints='["cachai"]',
            partner_name="Matías",
            partner_role="Ami local chilien",
            system_prompt="Test prompt",
            is_active=True,
        )
        db.add(scenario)
        db.flush()

        owner = User(id="history-user", email="history@example.com")
        other = User(id="other-user", email="other@example.com")
        db.add_all([owner, other])
        db.flush()

        owned_session = ConversationSession(
            user_id=owner.id,
            scenario_id=scenario.id,
            status="active",
            level_at_start="Intermédiaire",
        )
        foreign_session = ConversationSession(
            user_id=other.id,
            scenario_id=scenario.id,
            status="completed",
        )
        db.add_all([owned_session, foreign_session])
        db.flush()

        db.add(
            Message(
                session_id=owned_session.id,
                role="assistant",
                content="Bienvenue au Chili, on peut parler de Santiago.",
            )
        )
        db.commit()
        return owned_session.id


def test_history_lists_only_current_user_sessions() -> None:
    owned_session_id = seed_history()

    client = TestClient(app)
    response = client.get("/api/v1/me/conversation-sessions")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == owned_session_id
    assert data[0]["country_name"] == "Chile"
    assert data[0]["scenario_title"] == "Conversation libre"
    assert data[0]["mode"] == "free"
    assert data[0]["language_code"] == "es"
    assert data[0]["level_at_start"] == "Intermédiaire"
    assert data[0]["last_message_preview"] == "Bienvenue au Chili, on peut parler de Santiago."
    assert data[0]["has_feedback"] is False
