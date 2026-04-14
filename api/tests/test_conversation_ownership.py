from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user_claims, get_db_session
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
    return {"sub": "owner-user", "email": "owner@example.com"}


app.dependency_overrides[get_db_session] = override_get_db_session
app.dependency_overrides[get_current_user_claims] = override_get_current_user_claims


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_owned_and_foreign_sessions() -> tuple[str, str]:
    with TestingSessionLocal() as db:
        country = Country(code="CL", name="Chile", language="es", is_active=True)
        db.add(country)
        db.flush()

        scenario = Scenario(
            country_id=country.id,
            slug="airport-checkin",
            title="Airport Check-in",
            description="Practice checking in at the airport.",
            language_code="es",
            difficulty="beginner",
            mode="guided",
            system_prompt="Help the learner practice airport check-in.",
            is_active=True,
        )
        db.add(scenario)

        owner = User(id="owner-user", email="owner@example.com")
        other = User(id="other-user", email="other@example.com")
        db.add_all([owner, other])
        db.flush()

        owned_session = ConversationSession(user_id=owner.id, scenario_id=scenario.id, status="active")
        foreign_session = ConversationSession(user_id=other.id, scenario_id=scenario.id, status="active")
        db.add_all([owned_session, foreign_session])
        db.commit()

        return owned_session.id, foreign_session.id


def test_get_conversation_session_requires_ownership() -> None:
    _, foreign_session_id = seed_owned_and_foreign_sessions()

    client = TestClient(app)
    response = client.get(f"/api/v1/conversation-sessions/{foreign_session_id}")

    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}


def test_list_messages_requires_ownership() -> None:
    _, foreign_session_id = seed_owned_and_foreign_sessions()

    client = TestClient(app)
    response = client.get(f"/api/v1/conversation-sessions/{foreign_session_id}/messages")

    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}


def test_feedback_requires_ownership() -> None:
    _, foreign_session_id = seed_owned_and_foreign_sessions()

    client = TestClient(app)
    response = client.get(f"/api/v1/conversation-sessions/{foreign_session_id}/feedback")

    assert response.status_code == 404
    assert response.json() == {"detail": "Session not found"}


def test_owned_session_remains_accessible() -> None:
    owned_session_id, _ = seed_owned_and_foreign_sessions()

    client = TestClient(app)
    response = client.get(f"/api/v1/conversation-sessions/{owned_session_id}")

    assert response.status_code == 200
    assert response.json()["id"] == owned_session_id
