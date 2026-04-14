from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user_claims, get_db_session
from app.core.database import Base
from app.main import app


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
    return {"sub": "language-user", "email": "language@example.com"}


app.dependency_overrides[get_db_session] = override_get_db_session
app.dependency_overrides[get_current_user_claims] = override_get_current_user_claims


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_get_language_level_returns_none_when_missing() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/me/language-levels/es")

    assert response.status_code == 200
    assert response.json() is None


def test_put_language_level_upserts_and_get_returns_value() -> None:
    client = TestClient(app)

    put_response = client.put("/api/v1/me/language-levels/es", json={"level": "Intermédiaire"})
    assert put_response.status_code == 200
    assert put_response.json()["language_code"] == "es"
    assert put_response.json()["level"] == "Intermédiaire"

    get_response = client.get("/api/v1/me/language-levels/es")
    assert get_response.status_code == 200
    assert get_response.json()["language_code"] == "es"
    assert get_response.json()["level"] == "Intermédiaire"


def test_list_language_levels_returns_sorted_records() -> None:
    client = TestClient(app)

    client.put("/api/v1/me/language-levels/en", json={"level": "Advanced"})
    client.put("/api/v1/me/language-levels/es", json={"level": "Beginner"})

    response = client.get("/api/v1/me/language-levels")

    assert response.status_code == 200
    assert [item["language_code"] for item in response.json()] == ["en", "es"]
