from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db_session
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.feedback_repository import FeedbackRepository
from app.repositories.scenario_repository import ScenarioRepository
from app.schemas.feedback import FeedbackRead
from app.services.feedback_service import FeedbackService

router = APIRouter()
conversation_repository = ConversationRepository()
feedback_repository = FeedbackRepository()
scenario_repository = ScenarioRepository()
feedback_service = FeedbackService()


@router.get("/conversation-sessions/{session_id}/feedback", response_model=FeedbackRead)
def get_feedback(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db_session),
) -> FeedbackRead:
    session = conversation_repository.get_session_for_user(db, session_id=session_id, user_id=user_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    feedback = feedback_repository.get_by_session_id(db, session_id)
    if feedback is None:
        scenario = scenario_repository.get_by_id(db, session.scenario_id)
        if scenario is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

        messages = conversation_repository.list_messages(db, session_id)
        feedback_data = feedback_service.build_feedback(scenario=scenario, messages=messages)
        feedback = feedback_repository.upsert_for_session(
            db,
            session_id=session_id,
            global_score=feedback_data["global_score"],
            vocabulary_score=feedback_data["vocabulary_score"],
            fluency_score=feedback_data["fluency_score"],
            strengths=feedback_data["strengths"],
            improvements=feedback_data["improvements"],
            cultural_tip=feedback_data["cultural_tip"],
        )
        db.commit()

    return FeedbackRead(
        id=feedback.id,
        session_id=feedback.session_id,
        global_score=feedback.global_score,
        vocabulary_score=feedback.vocabulary_score,
        fluency_score=feedback.fluency_score,
        strengths=feedback_repository.deserialize_list(feedback.strengths),
        improvements=feedback_repository.deserialize_list(feedback.improvements),
        cultural_tip=feedback.cultural_tip,
        created_at=feedback.created_at,
    )
