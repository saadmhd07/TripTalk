from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, get_db_session
from app.core.rate_limit import limiter
from app.repositories.conversation_repository import ConversationRepository
from app.repositories.scenario_repository import ScenarioRepository
from app.schemas.audio import SpeechSynthesisRequest
from app.services.ai_service import AIService

router = APIRouter()
conversation_repository = ConversationRepository()
scenario_repository = ScenarioRepository()
ai_service = AIService()


def _select_voice_for_scenario(
    *,
    country_name: str | None,
    partner_name: str | None,
    partner_role: str | None,
) -> str:
    del partner_name, partner_role

    if country_name == "Chile":
        return "onyx"

    if country_name == "USA":
        return "alloy"

    return "alloy"


@router.post("/conversation-sessions/{session_id}/speech")
@limiter.limit("20/minute")
def synthesize_session_speech(
    request: Request,
    session_id: str,
    payload: SpeechSynthesisRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db_session),
) -> Response:
    request.state.user_id = user_id

    session = conversation_repository.get_session_for_user(db, session_id=session_id, user_id=user_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    scenario = scenario_repository.get_by_id(db, session.scenario_id)
    if scenario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    try:
        audio_bytes = ai_service.synthesize_speech(
            text=payload.text,
            voice=_select_voice_for_scenario(
                country_name=scenario.country.name if scenario.country else None,
                partner_name=scenario.partner_name,
                partner_role=scenario.partner_role,
            ),
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Cache-Control": "no-store"},
    )


@router.post("/conversation-sessions/{session_id}/transcription")
@limiter.limit("20/minute")
def transcribe_session_audio(
    request: Request,
    session_id: str,
    audio: UploadFile = File(...),
    language: str | None = Form(default=None),
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db_session),
) -> dict[str, str]:
    request.state.user_id = user_id

    session = conversation_repository.get_session_for_user(db, session_id=session_id, user_id=user_id)
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    scenario = scenario_repository.get_by_id(db, session.scenario_id)
    if scenario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scenario not found")

    temp_path: Path | None = None

    try:
        suffix = Path(audio.filename or "recording.webm").suffix or ".webm"
        with NamedTemporaryFile(suffix=suffix, delete=False) as tmp_file:
            temp_path = Path(tmp_file.name)
            tmp_file.write(audio.file.read())

        transcript = ai_service.transcribe_audio(
            audio_path=temp_path,
            language=language or scenario.language_code or None,
        )
        return {"text": transcript}
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc),
        ) from exc
    finally:
        try:
            audio.file.close()
        except Exception:
            pass
        if temp_path and temp_path.exists():
            temp_path.unlink()
