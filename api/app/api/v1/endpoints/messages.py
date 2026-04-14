from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db_session
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.scenario_repository import ScenarioRepository
from app.schemas.message import MessageCreate, MessageRead, MessageRole
from app.services.ai_service import AIService

router = APIRouter()
conversation_repository = ConversationRepository()
scenario_repository = ScenarioRepository()
ai_service = AIService()


@router.get("/conversation-sessions/{session_id}/messages", response_model=list[MessageRead])
def list_messages(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db_session),
) -> list[MessageRead]:
    session = conversation_repository.get_session_for_user(db, session_id=session_id, user_id=user_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    messages = conversation_repository.list_messages(db, session_id)
    return [
        MessageRead(
            id=message.id,
            session_id=message.session_id,
            role=MessageRole(message.role),
            content=message.content,
            created_at=message.created_at,
        )
        for message in messages
    ]


@router.post("/conversation-sessions/{session_id}/messages", response_model=list[MessageRead])
def create_message(
    session_id: str,
    payload: MessageCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db_session),
) -> list[MessageRead]:
    session = conversation_repository.get_session_for_user(db, session_id=session_id, user_id=user_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    user_message = conversation_repository.create_message(
        db,
        session_id=session_id,
        role=MessageRole.USER.value,
        content=payload.content,
    )

    scenario = scenario_repository.get_by_id(db, session.scenario_id)
    if scenario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    history = [
        {"role": message.role, "content": message.content}
        for message in conversation_repository.list_messages(db, session_id)
        if message.role in {MessageRole.USER.value, MessageRole.ASSISTANT.value}
    ]

    try:
        assistant_content = ai_service.generate_conversation_reply(
            system_prompt=scenario.system_prompt,
            country_name=scenario.country.name if scenario.country else "Unknown",
            scenario_title=scenario.title,
            difficulty=scenario.difficulty,
            history=history,
        )
    except Exception:
        assistant_content = "I am having trouble responding right now. Please try again."

    assistant_message = conversation_repository.create_message(
        db,
        session_id=session_id,
        role=MessageRole.ASSISTANT.value,
        content=assistant_content,
    )
    db.commit()

    return [
        MessageRead(
            id=user_message.id,
            session_id=user_message.session_id,
            role=MessageRole.USER,
            content=user_message.content,
            created_at=user_message.created_at,
        ),
        MessageRead(
            id=assistant_message.id,
            session_id=assistant_message.session_id,
            role=MessageRole.ASSISTANT,
            content=assistant_message.content,
            created_at=assistant_message.created_at,
        ),
    ]
