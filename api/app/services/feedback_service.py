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
                or "Tu t'en sortirais probablement dans cette situation, mais avec un peu plus de friction que nécessaire.",
                "perceived_impression": str(data.get("perceived_impression", "")).strip()
                or "Tu aurais probablement semblé coopératif, mais pas encore totalement à l'aise ou local dans l'échange.",
                "key_moment": str(data.get("key_moment", "")).strip()
                or "Le moment clé a été celui où l'échange avait besoin d'une réponse claire et directe pour continuer naturellement.",
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
            return "Aux États-Unis, des réponses claires et directes passent généralement mieux que de longues explications dans un échange procédural."
        if scenario.country and scenario.country.code == "CL":
            return "Au Chili, les situations formelles valorisent souvent des réponses calmes et directes plutôt que de longues justifications."
        return "Dans une interaction réelle, trouver le bon ton local compte presque autant que choisir les bons mots."

    def _default_next_step(self, scenario: Scenario) -> str:
        if scenario.mode == "guided":
            return "Refais cette scène en te concentrant sur une réponse plus nette et plus locale à l'endroit où tout se joue."
        return "Refais cette scène en gardant l'échange vivant avec des réponses plus courtes, plus posées et plus naturelles."

    def _default_natural_response_tips(self, scenario: Scenario) -> list[str]:
        if scenario.country and scenario.country.code == "CL":
            return [
                "Ici, garde une réponse courte et directe pour paraître crédible sur le moment, pas sur-préparé.",
                "Commence par l'information clé, puis ajoute un détail seulement si l'autre personne en a besoin.",
            ]
        return [
            "Donne d'abord l'information clé, puis ajoute du détail ensuite, comme le ferait quelqu'un de local dans un échange pratique.",
            "Privilégie des réponses courtes et naturelles plutôt que de longues phrases traduites qui sonnent sur-expliquées.",
        ]

    @staticmethod
    def _fallback_verdict(user_message_count: int, avg_length: int) -> str:
        if user_message_count >= 4 and avg_length >= 4:
            return "Tu passerais probablement cette situation sans gros problème, même si cela ne sonnerait pas encore totalement local."
        if user_message_count >= 2:
            return "Tu pourrais probablement faire avancer l'échange, mais tu provoquerais sans doute plus de friction ou de questions de relance."
        return "Sous cette forme, tu aurais probablement du mal à faire avancer la situation dans la vraie vie."

    @staticmethod
    def _fallback_perception(user_message_count: int, avg_length: int) -> str:
        if user_message_count >= 4 and avg_length >= 4:
            return "Tu aurais probablement semblé coopératif et compréhensible, même si certaines réponses paraissaient encore un peu prudentes."
        if avg_length < 4:
            return "Tu aurais probablement semblé hésitant ou pas assez précis, ce qui inviterait naturellement davantage de questions."
        return "Tu aurais probablement semblé prêt à répondre, mais pas toujours totalement posé, précis ou à l'aise dans le contexte local."

    @staticmethod
    def _fallback_key_moment(messages: list[Message]) -> str:
        assistant_messages = [message.content for message in messages if message.role == "assistant"]
        user_messages = [message.content for message in messages if message.role == "user"]
        if assistant_messages and user_messages:
            return (
                "Le moment clé a été celui où l'autre personne attendait une réponse claire à la dernière question, "
                "car c'est souvent là que l'assurance ou l'hésitation devient visible dans la vraie vie."
            )
        return "Le moment clé, c'était simplement de garder l'échange vivant au lieu de le laisser retomber après la première relance."

    @staticmethod
    def _fallback_natural_response_tips(avg_length: int) -> list[str]:
        tips = []
        if avg_length < 4:
            tips.append("Allonge légèrement chaque réponse pour paraître préparé et crédible, pas évasif.")
        tips.append("Dans une situation formelle et procédurale, privilégie des réponses courtes mais complètes plutôt que des fragments.")
        return tips[:2]
