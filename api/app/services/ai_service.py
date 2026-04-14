import json

from openai import OpenAI

from app.core.config import settings


class AIService:
    """Thin wrapper around OpenAI calls used by the MVP."""

    def __init__(self) -> None:
        self.client = OpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None
        self.model = settings.openai_model

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

        response = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
        )

        content = response.choices[0].message.content
        if not content:
            return "I could not generate a response right now."
        return content.strip()

    def generate_feedback(
        self,
        *,
        country_name: str,
        scenario_title: str,
        difficulty: str,
        conversation_transcript: str,
    ) -> dict:
        if self.client is None:
            raise ValueError("OpenAI is not configured yet.")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert language coach. "
                        "Return only valid JSON with keys: "
                        "global_score, vocabulary_score, fluency_score, strengths, improvements, cultural_tip. "
                        "Scores must be integers between 0 and 100. strengths and improvements must be arrays of short strings."
                    ),
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
        )
        content = response.choices[0].message.content
        if not content:
            raise ValueError("Empty feedback response")
        return json.loads(content)
