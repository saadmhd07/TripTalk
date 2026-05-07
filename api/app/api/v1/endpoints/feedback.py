from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db_session
from app.core.rate_limit import limiter
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


def _feedback_read_from_record(feedback) -> FeedbackRead:
    strengths = feedback_repository.deserialize_list(feedback.strengths)
    improvements = feedback_repository.deserialize_list(feedback.improvements)

    situation_verdict = strengths[0] if len(strengths) >= 1 else "You would probably get through this situation, but not yet smoothly."
    perceived_impression = strengths[1] if len(strengths) >= 2 else "You came across as cooperative, but not fully settled in the situation."
    key_moment = strengths[2] if len(strengths) >= 3 else "The key moment was where the exchange needed a clearer, more grounded answer."

    if len(improvements) >= 2:
        natural_response_tips = improvements[:-1]
        next_step = improvements[-1]
    elif len(improvements) == 1:
        natural_response_tips = improvements
        next_step = "Retry this scenario and focus on one cleaner answer in the most sensitive moment."
    else:
        natural_response_tips = []
        next_step = "Retry this scenario and focus on one cleaner answer in the most sensitive moment."

    return FeedbackRead(
        id=feedback.id,
        session_id=feedback.session_id,
        readiness_score=feedback.global_score,
        situation_verdict=situation_verdict,
        perceived_impression=perceived_impression,
        key_moment=key_moment,
        natural_response_tips=natural_response_tips,
        cultural_code=feedback.cultural_tip,
        next_step=next_step,
        created_at=feedback.created_at,
    )


def _generate_and_store_feedback(*, db: Session, session_id: str, scenario, messages) -> FeedbackRead:
    feedback_data = feedback_service.build_feedback(scenario=scenario, messages=messages)
    feedback = feedback_repository.upsert_for_session(
        db,
        session_id=session_id,
        global_score=feedback_data["readiness_score"],
        vocabulary_score=None,
        fluency_score=None,
        strengths=[
            feedback_data["situation_verdict"],
            feedback_data["perceived_impression"],
            feedback_data["key_moment"],
        ],
        improvements=[
            *feedback_data["natural_response_tips"],
            feedback_data["next_step"],
        ],
        cultural_tip=feedback_data["cultural_code"],
    )
    db.commit()
    db.refresh(feedback)
    return _feedback_read_from_record(feedback)


@router.get("/conversation-sessions/{session_id}/feedback", response_model=FeedbackRead)
@limiter.limit("10/minute")
def get_feedback(
    request: Request,
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db_session),
) -> FeedbackRead:
    # Store user_id in request state for rate limiting
    request.state.user_id = user_id
    session = conversation_repository.get_session_for_user(db, session_id=session_id, user_id=user_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    feedback = feedback_repository.get_by_session_id(db, session_id)
    if feedback is None:
        scenario = scenario_repository.get_by_id(db, session.scenario_id)
        if scenario is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

        messages = conversation_repository.list_messages(db, session_id)
        return _generate_and_store_feedback(
            db=db,
            session_id=session_id,
            scenario=scenario,
            messages=messages,
        )

    return _feedback_read_from_record(feedback)


@router.post("/conversation-sessions/{session_id}/feedback/regenerate", response_model=FeedbackRead)
@limiter.limit("10/minute")
def regenerate_feedback(
    request: Request,
    session_id: str,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db_session),
) -> FeedbackRead:
    request.state.user_id = user_id
    session = conversation_repository.get_session_for_user(db, session_id=session_id, user_id=user_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    scenario = scenario_repository.get_by_id(db, session.scenario_id)
    if scenario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    messages = conversation_repository.list_messages(db, session_id)
    return _generate_and_store_feedback(
        db=db,
        session_id=session_id,
        scenario=scenario,
        messages=messages,
    )
