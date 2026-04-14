from app.models.scenario import Scenario
from app.models.message import Message
from app.services.ai_service import AIService


class FeedbackService:
    def __init__(self) -> None:
        self.ai_service = AIService()

    def build_feedback(self, *, scenario: Scenario, messages: list[Message]) -> dict:
        transcript = "\n".join(f"{message.role}: {message.content}" for message in messages)
        try:
            data = self.ai_service.generate_feedback(
                country_name=scenario.country.name if scenario.country else "Unknown",
                scenario_title=scenario.title,
                difficulty=scenario.difficulty,
                conversation_transcript=transcript,
            )
            return {
                "global_score": int(data.get("global_score", 75)),
                "vocabulary_score": int(data.get("vocabulary_score", 72)),
                "fluency_score": int(data.get("fluency_score", 70)),
                "strengths": [str(item) for item in data.get("strengths", [])][:5],
                "improvements": [str(item) for item in data.get("improvements", [])][:5],
                "cultural_tip": str(data.get("cultural_tip", "")) or self._default_cultural_tip(scenario),
            }
        except Exception:
            return self._fallback_feedback(scenario=scenario, messages=messages)

    def _fallback_feedback(self, *, scenario: Scenario, messages: list[Message]) -> dict:
        user_messages = [message for message in messages if message.role == "user"]
        user_message_count = len(user_messages)
        avg_length = (
            sum(len(message.content.split()) for message in user_messages) // user_message_count
            if user_message_count
            else 0
        )

        global_score = min(92, 55 + user_message_count * 8 + min(avg_length, 12))
        vocabulary_score = min(90, 50 + avg_length * 4)
        fluency_score = min(88, 52 + user_message_count * 7)

        strengths = ["You kept the conversation going."]
        if avg_length >= 4:
            strengths.append("You used complete sentence fragments instead of one-word replies.")
        if user_message_count >= 3:
            strengths.append("You stayed engaged over several turns.")

        improvements = ["Ask one follow-up question to sound more natural."]
        if avg_length < 4:
            improvements.append("Try slightly longer answers with more detail.")
        improvements.append("Reuse vocabulary from the scenario to sound more local.")

        return {
            "global_score": global_score,
            "vocabulary_score": vocabulary_score,
            "fluency_score": fluency_score,
            "strengths": strengths[:5],
            "improvements": improvements[:5],
            "cultural_tip": self._default_cultural_tip(scenario),
        }

    def _default_cultural_tip(self, scenario: Scenario) -> str:
        if scenario.country and scenario.country.code == "US":
            return "In the US, short friendly small talk and clear answers usually feel natural."
        if scenario.country and scenario.country.code == "CL":
            return "In Chile, warm tone and informal phrasing often make the exchange feel more natural."
        return "Match the local tone and keep the conversation moving with simple follow-up questions."
