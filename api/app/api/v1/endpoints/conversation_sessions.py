from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_claims, get_current_user_id, get_db_session
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.scenario_repository import ScenarioRepository
from app.repositories.user_repository import UserRepository
from app.schemas.conversation_session import (
    ConversationSessionCreate,
    ConversationSessionHistoryRead,
    ConversationSessionRead,
    ConversationSessionStatus,
)
from app.schemas.message import MessageRole

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
    session = conversation_repository.create_session(
        db,
        user_id=user.id,
        scenario_id=scenario.id,
        level_at_start=payload.level_at_start,
    )
    if scenario.intro_message:
        conversation_repository.create_message(
            db,
            session_id=session.id,
            role=MessageRole.ASSISTANT.value,
            content=scenario.intro_message,
        )
    db.commit()

    return ConversationSessionRead(
        id=session.id,
        scenario_id=session.scenario_id,
        status=ConversationSessionStatus(session.status),
        level_at_start=session.level_at_start,
        started_at=session.started_at,
        ended_at=session.ended_at,
    )


@router.get("/me/conversation-sessions", response_model=list[ConversationSessionHistoryRead])
def list_my_conversation_sessions(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db_session),
) -> list[ConversationSessionHistoryRead]:
    sessions = conversation_repository.list_sessions_for_user(db, user_id=user_id)

    items: list[ConversationSessionHistoryRead] = []
    for session in sessions:
        scenario = session.scenario
        country = scenario.country if scenario else None
        sorted_messages = sorted(
            session.messages,
            key=lambda message: (message.created_at, message.id),
        )
        last_message_preview = sorted_messages[-1].content[:160] if sorted_messages else None

        items.append(
            ConversationSessionHistoryRead(
                id=session.id,
                scenario_id=session.scenario_id,
                scenario_title=scenario.title if scenario else "Unknown scenario",
                country_name=country.name if country else "Unknown country",
                country_code=country.code if country else "",
                language_code=scenario.language_code if scenario else "",
                mode=scenario.mode if scenario else "guided",
                status=ConversationSessionStatus(session.status),
                level_at_start=session.level_at_start,
                intro_message=scenario.intro_message if scenario else None,
                cultural_tip=scenario.cultural_tip if scenario else None,
                vocabulary_hints=scenario.vocabulary_hints if scenario else None,
                partner_name=scenario.partner_name if scenario else None,
                partner_role=scenario.partner_role if scenario else None,
                last_message_preview=last_message_preview,
                has_feedback=session.feedback is not None,
                started_at=session.started_at,
                ended_at=session.ended_at,
            )
        )

    return items


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
        level_at_start=session.level_at_start,
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
        level_at_start=session.level_at_start,
        started_at=session.started_at,
        ended_at=session.ended_at,
    )
