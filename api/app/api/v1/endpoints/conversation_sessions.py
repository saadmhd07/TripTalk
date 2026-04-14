from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_claims, get_current_user_id, get_db_session
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.scenario_repository import ScenarioRepository
from app.repositories.user_repository import UserRepository
from app.schemas.conversation_session import (
    ConversationSessionCreate,
    ConversationSessionRead,
    ConversationSessionStatus,
)

router = APIRouter()
conversation_repository = ConversationRepository()
scenario_repository = ScenarioRepository()
user_repository = UserRepository()


@router.post("/conversation-sessions", response_model=ConversationSessionRead)
def create_conversation_session(
    payload: ConversationSessionCreate,
    claims: dict = Depends(get_current_user_claims),
    db: Session = Depends(get_db_session),
) -> ConversationSessionRead:
    scenario = scenario_repository.get_by_id(db, payload.scenario_id)
    if scenario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    user = user_repository.get_or_create(
        db,
        user_id=str(claims.get("sub")),
        email=str(claims.get("email")),
    )
    session = conversation_repository.create_session(db, user_id=user.id, scenario_id=scenario.id)
    db.commit()

    return ConversationSessionRead(
        id=session.id,
        scenario_id=session.scenario_id,
        status=ConversationSessionStatus(session.status),
        started_at=session.started_at,
        ended_at=session.ended_at,
    )


@router.get("/conversation-sessions/{session_id}", response_model=ConversationSessionRead)
def get_conversation_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db_session),
) -> ConversationSessionRead:
    session = conversation_repository.get_session_for_user(db, session_id=session_id, user_id=user_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    return ConversationSessionRead(
        id=session.id,
        scenario_id=session.scenario_id,
        status=ConversationSessionStatus(session.status),
        started_at=session.started_at,
        ended_at=session.ended_at,
    )


@router.post("/conversation-sessions/{session_id}/complete", response_model=ConversationSessionRead)
def complete_conversation_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db_session),
) -> ConversationSessionRead:
    session = conversation_repository.get_session_for_user(db, session_id=session_id, user_id=user_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    session = conversation_repository.complete_session(db, session)
    db.commit()

    return ConversationSessionRead(
        id=session.id,
        scenario_id=session.scenario_id,
        status=ConversationSessionStatus(session.status),
        started_at=session.started_at,
        ended_at=session.ended_at,
    )
