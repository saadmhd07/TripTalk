from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user_claims, get_db_session
from app.api.v1.endpoints import messages as messages_endpoint
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


def setup_function() -> None:
    app.dependency_overrides[get_db_session] = override_get_db_session
    app.dependency_overrides[get_current_user_claims] = override_get_current_user_claims
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_function() -> None:
    app.dependency_overrides.clear()


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


def test_complete_session_updates_history_status() -> None:
    owned_session_id = seed_history()

    client = TestClient(app)

    complete_response = client.post(f"/api/v1/conversation-sessions/{owned_session_id}/complete")
    assert complete_response.status_code == 200
    assert complete_response.json()["status"] == "completed"
    assert complete_response.json()["ended_at"] is not None

    history_response = client.get("/api/v1/me/conversation-sessions")
    assert history_response.status_code == 200
    data = history_response.json()
    assert len(data) == 1
    assert data[0]["status"] == "completed"
    assert data[0]["ended_at"] is not None


def test_create_session_persists_intro_message() -> None:
    scenario_id: int

    with TestingSessionLocal() as db:
        country = Country(code="CL", name="Chile", language="es", is_active=True)
        db.add(country)
        db.flush()

        scenario = Scenario(
            country_id=country.id,
            slug="immigration-santiago",
            title="Contrôle d'immigration à Santiago",
            description="Scenario test",
            language_code="es",
            difficulty="beginner",
            mode="guided",
            intro_message="Buenos días. Su pasaporte, por favor.",
            system_prompt="Test prompt",
            is_active=True,
        )
        db.add(scenario)
        db.commit()
        scenario_id = scenario.id

    client = TestClient(app)

    session_response = client.post(
        "/api/v1/conversation-sessions",
        json={"scenario_id": scenario_id, "level_at_start": "Débutant"},
    )
    assert session_response.status_code == 200
    session_id = session_response.json()["id"]

    messages_response = client.get(f"/api/v1/conversation-sessions/{session_id}/messages")
    assert messages_response.status_code == 200
    data = messages_response.json()
    assert len(data) == 1
    assert data[0]["role"] == "assistant"
    assert data[0]["content"] == "Buenos días. Su pasaporte, por favor."


def test_immigration_session_auto_completes_after_closing_line(monkeypatch) -> None:
    scenario_id: int

    with TestingSessionLocal() as db:
        country = Country(code="CL", name="Chile", language="es", is_active=True)
        db.add(country)
        db.flush()

        scenario = Scenario(
            country_id=country.id,
            slug="immigration-santiago",
            title="Contrôle d'immigration à Santiago",
            description="Scenario test",
            language_code="es",
            difficulty="beginner",
            mode="guided",
            intro_message="Buenos días. Su pasaporte, por favor.",
            system_prompt="Test prompt",
            is_active=True,
        )
        db.add(scenario)
        db.commit()
        scenario_id = scenario.id

    closing_answers = iter(
        [
            {"response": "¿Cuántos días se va a quedar en Chile?", "decision": "CONTINUE"},
            {"response": "¿Dónde se va a alojar en Santiago?", "decision": "CONTINUE"},
            {"response": "Perfecto. Todo en orden. Bienvenido a Chile.", "decision": "END"},
        ]
    )

    def fake_reply(**kwargs) -> dict[str, str]:
        return next(closing_answers)

    monkeypatch.setattr(messages_endpoint.ai_service, "generate_conversation_reply", fake_reply)

    client = TestClient(app)
    session_response = client.post(
        "/api/v1/conversation-sessions",
        json={"scenario_id": scenario_id, "level_at_start": "Débutant"},
    )
    assert session_response.status_code == 200
    session_id = session_response.json()["id"]

    for payload in ("turismo", "seis días", "en Providencia"):
        reply_response = client.post(
            f"/api/v1/conversation-sessions/{session_id}/messages",
            json={"content": payload},
        )
        assert reply_response.status_code == 200

    detail_response = client.get(f"/api/v1/conversation-sessions/{session_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["status"] == "completed"
    assert detail_response.json()["ended_at"] is not None

    blocked_response = client.post(
        f"/api/v1/conversation-sessions/{session_id}/messages",
        json={"content": "gracias"},
    )
    assert blocked_response.status_code == 409
    assert blocked_response.json() == {"detail": "Session already completed"}
