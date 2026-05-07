from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.deps import get_current_user_claims, get_db_session
from app.core.database import Base
from app.main import app
from app.models import Profile, User


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
    return {"sub": "profile-user", "email": "profile@example.com"}


def setup_function() -> None:
    app.dependency_overrides[get_db_session] = override_get_db_session
    app.dependency_overrides[get_current_user_claims] = override_get_current_user_claims
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def teardown_function() -> None:
    app.dependency_overrides.clear()


def test_get_me_creates_user_and_returns_empty_profile() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/me")

    assert response.status_code == 200
    assert response.json() == {
        "id": "profile-user",
        "email": "profile@example.com",
        "display_name": None,
        "native_language": None,
    }

    with TestingSessionLocal() as db:
        user = db.get(User, "profile-user")
        assert user is not None
        assert user.email == "profile@example.com"
        assert db.query(Profile).count() == 0


def test_patch_me_profile_persists_profile() -> None:
    client = TestClient(app)

    response = client.patch(
        "/api/v1/me/profile",
        json={
            "display_name": "Saad",
            "native_language": "fr",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "id": "profile-user",
        "email": "profile@example.com",
        "display_name": "Saad",
        "native_language": "fr",
    }

    with TestingSessionLocal() as db:
        profile = db.scalar(db.query(Profile).filter(Profile.user_id == "profile-user").statement)
        assert profile is not None
        assert profile.display_name == "Saad"
        assert profile.native_language == "fr"


def test_get_me_returns_persisted_profile() -> None:
    with TestingSessionLocal() as db:
        user = User(id="profile-user", email="profile@example.com")
        db.add(user)
        db.flush()
        db.add(
            Profile(
                user_id=user.id,
                display_name="Saad",
                native_language="fr",
            )
        )
        db.commit()

    client = TestClient(app)
    response = client.get("/api/v1/me")

    assert response.status_code == 200
    assert response.json() == {
        "id": "profile-user",
        "email": "profile@example.com",
        "display_name": "Saad",
        "native_language": "fr",
    }
