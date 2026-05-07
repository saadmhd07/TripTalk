from app.core.logging import get_logger, log_error
from app.models.scenario import Scenario
from app.models.message import Message
from app.services.ai_service import AIService

logger = get_logger(__name__)


class FeedbackService:
    """Builds a feedback payload from a finished conversation."""

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
                "readiness_score": int(data.get("readiness_score", 72)),
                "situation_verdict": str(data.get("situation_verdict", "")).strip()
                or "You would probably get through this situation, but with a bit more friction than necessary.",
                "perceived_impression": str(data.get("perceived_impression", "")).strip()
                or "You likely came across as cooperative, but not fully settled or local in the exchange.",
                "key_moment": str(data.get("key_moment", "")).strip()
                or "The key moment was when the exchange needed one clear, direct answer to keep moving naturally.",
                "natural_response_tips": [
                    str(item).strip() for item in data.get("natural_response_tips", []) if str(item).strip()
                ][:2]
                or self._default_natural_response_tips(scenario),
                "cultural_code": str(data.get("cultural_code", "")).strip() or self._default_cultural_tip(scenario),
                "next_step": str(data.get("next_step", "")).strip() or self._default_next_step(scenario),
            }
        except ValueError as e:
            log_error(logger, "Feedback generation failed", e, {"scenario_id": scenario.id})
            logger.info("Using fallback feedback")
            return self._fallback_feedback(scenario=scenario, messages=messages)
        except Exception as e:
            log_error(logger, "Unexpected error in feedback generation", e, {"scenario_id": scenario.id})
            logger.info("Using fallback feedback")
            return self._fallback_feedback(scenario=scenario, messages=messages)

    def _fallback_feedback(self, *, scenario: Scenario, messages: list[Message]) -> dict:
        user_messages = [message for message in messages if message.role == "user"]
        user_message_count = len(user_messages)
        avg_length = (
            sum(len(message.content.split()) for message in user_messages) // user_message_count
            if user_message_count
            else 0
        )

        return {
            "readiness_score": min(90, 52 + user_message_count * 9 + min(avg_length, 10)),
            "situation_verdict": self._fallback_verdict(user_message_count, avg_length),
            "perceived_impression": self._fallback_perception(user_message_count, avg_length),
            "key_moment": self._fallback_key_moment(messages),
            "natural_response_tips": self._fallback_natural_response_tips(avg_length),
            "cultural_code": self._default_cultural_tip(scenario),
            "next_step": self._default_next_step(scenario),
        }

    def _default_cultural_tip(self, scenario: Scenario) -> str:
        if scenario.country and scenario.country.code == "US":
            return "In the US, clear direct answers usually land better than long explanations in a procedural exchange."
        if scenario.country and scenario.country.code == "CL":
            return "In Chile, formal situations usually reward calm, direct answers more than long justifications."
        return "In a real interaction, matching the local tone matters as much as choosing the correct words."

    def _default_next_step(self, scenario: Scenario) -> str:
        if scenario.mode == "guided":
            return "Retry this scenario and focus on one cleaner, more locally natural answer where the scene matters most."
        return "Retry this scenario and keep the exchange moving with shorter, more grounded replies that feel lived-in."

    def _default_natural_response_tips(self, scenario: Scenario) -> list[str]:
        if scenario.country and scenario.country.code == "CL":
            return [
                "Keep your answer short and direct here so you sound credible on the spot, not over-rehearsed.",
                "Lead with the key fact first, then add detail only if the other person needs it.",
            ]
        return [
            "Give the key information first before adding extra detail, the way a local would in a practical exchange.",
            "Prefer short natural replies over long translated sentences that sound over-explained.",
        ]

    @staticmethod
    def _fallback_verdict(user_message_count: int, avg_length: int) -> str:
        if user_message_count >= 4 and avg_length >= 4:
            return "You would probably get through this situation without major trouble, even if it would not feel fully local yet."
        if user_message_count >= 2:
            return "You could probably keep this interaction moving, but you would likely create extra friction or follow-up questions."
        return "In this form, you would probably struggle to move the real-life situation forward."

    @staticmethod
    def _fallback_perception(user_message_count: int, avg_length: int) -> str:
        if user_message_count >= 4 and avg_length >= 4:
            return "You likely came across as cooperative and understandable, even if some answers still felt a little cautious."
        if avg_length < 4:
            return "You likely came across as hesitant or under-explained, which would naturally invite more questions."
        return "You likely came across as willing to respond, but not always fully settled, precise, or locally at ease."

    @staticmethod
    def _fallback_key_moment(messages: list[Message]) -> str:
        assistant_messages = [message.content for message in messages if message.role == "assistant"]
        user_messages = [message.content for message in messages if message.role == "user"]
        if assistant_messages and user_messages:
            return (
                "The key moment was when the other person needed one clear answer to the last question, "
                "because that is usually where confidence or hesitation becomes visible in real life."
            )
        return "The key moment was simply keeping the exchange alive instead of letting it stall after the first prompt."

    @staticmethod
    def _fallback_natural_response_tips(avg_length: int) -> list[str]:
        tips = []
        if avg_length < 4:
            tips.append("Make each answer one beat longer so you sound prepared and credible, not evasive.")
        tips.append("Use short complete answers instead of fragmented replies when the situation is formal and procedural.")
        return tips[:2]
