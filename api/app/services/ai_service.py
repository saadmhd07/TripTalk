import json
import os
from pathlib import Path
from tempfile import NamedTemporaryFile

from openai import OpenAI, OpenAIError

from app.core.config import settings
from app.core.logging import get_logger, log_error, log_openai_call

logger = get_logger(__name__)


def _extract_json_object(raw_content: str) -> dict:
    stripped = raw_content.strip()

    try:
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    fenced = stripped.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    if fenced != stripped:
        return json.loads(fenced)

    start = stripped.find("{")
    end = stripped.rfind("}")
    if start != -1 and end != -1 and end > start:
        return json.loads(stripped[start : end + 1])

    raise json.JSONDecodeError("No JSON object found", stripped, 0)


class AIService:
    """Thin wrapper around OpenAI calls used by the MVP."""

    def __init__(self) -> None:
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.chat_model = settings.effective_openai_chat_model
        self.feedback_model = settings.effective_openai_feedback_model
        self.tts_model = settings.openai_tts_model
        self.stt_model = settings.openai_stt_model
        self.default_tts_voice = settings.openai_tts_voice_default

        if self.client is None:
            logger.warning("OpenAI client not initialized - API key missing")

    def generate_conversation_reply(
        self,
        *,
        system_prompt: str | None,
        country_name: str,
        scenario_title: str,
        difficulty: str,
        history: list[dict[str, str]],
    ) -> dict[str, str]:
        if self.client is None:
            logger.error("Cannot generate reply - OpenAI client not configured")
            return {"response": "OpenAI is not configured yet.", "decision": "CONTINUE"}

        base_system_prompt = system_prompt or (
            "You are a friendly local conversation partner helping a language learner practice."
        )
        messages = [
            {
                "role": "system",
                "content": (
                    f"{base_system_prompt}\n\n"
                    f"Context:\n"
                    f"- Country: {country_name}\n"
                    f"- Scenario: {scenario_title}\n"
                    f"- Difficulty: {difficulty}\n\n"
                    "Rules:\n"
                    "- Keep answers natural and short.\n"
                    "- Stay in character.\n"
                    "- Ask follow-up questions when useful.\n"
                    "- Help the learner keep the conversation going.\n"
                    "- Return only valid JSON with keys response and decision.\n"
                    "- decision must be CONTINUE or END.\n"
                    "- Use END only when the scenario is genuinely complete.\n"
                    "- If decision is END, response must be a natural in-character closing line.\n"
                ),
            },
            *history,
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=messages,
                response_format={"type": "json_object"},
                timeout=30.0,
            )

            tokens_used = response.usage.total_tokens if response.usage else None
            log_openai_call(logger, "conversation_reply", self.chat_model, tokens=tokens_used)

            content = response.choices[0].message.content
            if not content:
                logger.warning("Empty response from OpenAI")
                return {
                    "response": "I could not generate a response right now.",
                    "decision": "CONTINUE",
                }

            data = _extract_json_object(content)
            reply_text = str(data.get("response", "")).strip()
            decision = str(data.get("decision", "CONTINUE")).strip().upper()

            if not reply_text:
                logger.warning("Missing conversation reply text in structured response")
                return {
                    "response": "I could not generate a response right now.",
                    "decision": "CONTINUE",
                }

            if decision not in {"CONTINUE", "END"}:
                decision = "CONTINUE"

            return {"response": reply_text, "decision": decision}

        except json.JSONDecodeError as e:
            log_error(logger, "Failed to parse conversation reply JSON", e, {"scenario": scenario_title})
            return {
                "response": "I am having trouble responding right now. Please try again.",
                "decision": "CONTINUE",
            }

        except OpenAIError as e:
            log_error(logger, "OpenAI conversation reply failed", e, {"scenario": scenario_title})
            return {
                "response": "I am having trouble responding right now. Please try again.",
                "decision": "CONTINUE",
            }

    def generate_feedback(
        self,
        *,
        country_name: str,
        scenario_title: str,
        difficulty: str,
        conversation_transcript: str,
    ) -> dict:
        if self.client is None:
            logger.error("Cannot generate feedback - OpenAI client not configured")
            raise ValueError("OpenAI is not configured yet.")

        # Load enhanced feedback prompt
        prompts_dir = Path(__file__).parent.parent.parent / "prompts"
        feedback_prompt_path = prompts_dir / "feedback_generation.txt"

        if feedback_prompt_path.exists():
            feedback_system_prompt = feedback_prompt_path.read_text(encoding='utf-8')
        else:
            # Fallback to basic prompt if file not found
            feedback_system_prompt = (
                "You are an expert language coach. "
                "Return only valid JSON with keys: "
                "global_score, vocabulary_score, fluency_score, strengths, improvements, cultural_tip. "
                "Scores must be integers between 0 and 100. strengths and improvements must be arrays of short strings."
            )

        try:
            response = self.client.chat.completions.create(
                model=self.feedback_model,
                messages=[
                    {
                        "role": "system",
                        "content": feedback_system_prompt,
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Country: {country_name}\n"
                            f"Scenario: {scenario_title}\n"
                            f"Difficulty: {difficulty}\n\n"
                            f"Transcript:\n{conversation_transcript}"
                        ),
                    },
                ],
                timeout=30.0,
            )

            tokens_used = response.usage.total_tokens if response.usage else None
            log_openai_call(logger, "feedback_generation", self.feedback_model, tokens=tokens_used)

            content = response.choices[0].message.content
            if not content:
                logger.error("Empty feedback response from OpenAI")
                raise ValueError("Empty feedback response")

            return json.loads(content)

        except json.JSONDecodeError as e:
            log_error(logger, "Failed to parse feedback JSON", e)
            raise ValueError("Invalid feedback format") from e

        except OpenAIError as e:
            log_error(logger, "OpenAI feedback generation failed", e, {"scenario": scenario_title})
            raise

    def synthesize_speech(
        self,
        *,
        text: str,
        voice: str | None = None,
        speed: float = 1.0,
    ) -> bytes:
        if self.client is None:
            logger.error("Cannot synthesize speech - OpenAI client not configured")
            raise ValueError("OpenAI is not configured yet.")

        output_path: Path | None = None

        try:
            with NamedTemporaryFile(suffix=".mp3", delete=False) as tmp_file:
                output_path = Path(tmp_file.name)

            with self.client.audio.speech.with_streaming_response.create(
                model=self.tts_model,
                voice=voice or self.default_tts_voice,
                input=text,
                speed=speed,
            ) as response:
                response.stream_to_file(output_path)

            audio_bytes = output_path.read_bytes()
            log_openai_call(logger, "speech_synthesis", self.tts_model)
            return audio_bytes

        except OpenAIError as e:
            log_error(logger, "OpenAI speech synthesis failed", e, {"voice": voice})
            raise ValueError("Speech synthesis failed") from e
        finally:
            if output_path and output_path.exists():
                os.unlink(output_path)

    def transcribe_audio(
        self,
        *,
        audio_path: Path,
        language: str | None = None,
    ) -> str:
        if self.client is None:
            logger.error("Cannot transcribe audio - OpenAI client not configured")
            raise ValueError("OpenAI is not configured yet.")

        try:
            with audio_path.open("rb") as audio_file:
                transcription = self.client.audio.transcriptions.create(
                    model=self.stt_model,
                    file=audio_file,
                    language=language,
                    response_format="text",
                )

            log_openai_call(logger, "speech_transcription", self.stt_model)

            if hasattr(transcription, "text"):
                text = transcription.text
            else:
                text = str(transcription)

            text = text.strip()
            if not text:
                raise ValueError("Empty transcription")
            return text

        except OpenAIError as e:
            log_error(logger, "OpenAI speech transcription failed", e, {"language": language})
            raise ValueError("Speech transcription failed") from e
