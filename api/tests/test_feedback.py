from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user_claims, get_db_session
from app.core.database import Base
from app.main import app
from app.models import ConversationSession, Country, Message, Scenario, User
from app.services.feedback_service import FeedbackService


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
    return {"sub": "feedback-user", "email": "feedback@example.com"}


def setup_function() -> None:
    app.dependency_overrides[get_db_session] = override_get_db_session
    app.dependency_overrides[get_current_user_claims] = override_get_current_user_claims
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_feedback_response_uses_new_situational_shape(monkeypatch) -> None:
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
        db.flush()

        user = User(id="feedback-user", email="feedback@example.com")
        db.add(user)
        db.flush()

        session = ConversationSession(user_id=user.id, scenario_id=scenario.id, status="completed")
        db.add(session)
        db.flush()

        db.add_all(
            [
                Message(session_id=session.id, role="assistant", content="Su pasaporte, por favor."),
                Message(session_id=session.id, role="user", content="Aquí está, señor."),
            ]
        )
        db.commit()
        session_id = session.id

    def fake_build_feedback(self, *, scenario, messages):
        return {
            "readiness_score": 78,
            "situation_verdict": "You would probably get through this checkpoint, but with a few extra questions.",
            "perceived_impression": "You came across as polite but slightly tentative in a formal context.",
            "key_moment": "The key moment was when you answered briefly instead of grounding your answer with one clear fact.",
            "natural_response_tips": [
                "Keep your answer shorter and more direct in this kind of official exchange.",
                "Lead with the main fact first before adding details.",
            ],
            "cultural_code": "In Chilean border-control contexts, calm direct answers usually land better than long explanations.",
            "next_step": "Redo this scenario and answer the purpose-of-visit question in one confident sentence.",
        }

    monkeypatch.setattr(FeedbackService, "build_feedback", fake_build_feedback)

    client = TestClient(app)
    response = client.get(f"/api/v1/conversation-sessions/{session_id}/feedback")

    assert response.status_code == 200
    data = response.json()
    assert data["readiness_score"] == 78
    assert data["situation_verdict"].startswith("You would probably get through this checkpoint")
    assert data["perceived_impression"].startswith("You came across as polite")
    assert data["key_moment"].startswith("The key moment was")
    assert len(data["natural_response_tips"]) == 2
    assert data["cultural_code"].startswith("In Chilean border-control contexts")
    assert data["next_step"].startswith("Redo this scenario")
