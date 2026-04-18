import json

from openai import OpenAI, OpenAIError

from app.core.config import settings
from app.core.logging import get_logger, log_error, log_openai_call

logger = get_logger(__name__)


class AIService:
    """Thin wrapper around OpenAI calls used by the MVP."""

    def __init__(self) -> None:
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.model = settings.openai_model

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
    ) -> str:
        if self.client is None:
            logger.error("Cannot generate reply - OpenAI client not configured")
            return "OpenAI is not configured yet."

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
                ),
            },
            *history,
        ]

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                timeout=30.0,
            )

            tokens_used = response.usage.total_tokens if response.usage else None
            log_openai_call(logger, "conversation_reply", self.model, tokens=tokens_used)

            content = response.choices[0].message.content
            if not content:
                logger.warning("Empty response from OpenAI")
                return "I could not generate a response right now."
            return content.strip()

        except OpenAIError as e:
            log_error(logger, "OpenAI conversation reply failed", e, {"scenario": scenario_title})
            return "I am having trouble responding right now. Please try again."

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
        from pathlib import Path
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
                model=self.model,
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
            log_openai_call(logger, "feedback_generation", self.model, tokens=tokens_used)

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
