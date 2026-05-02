from pathlib import Path

from sqlalchemy.orm import Session

from app.repositories.country_repository import CountryRepository
from app.repositories.scenario_repository import ScenarioRepository


PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"

DEFAULT_COUNTRIES = [
    {"code": "CL", "name": "Chile", "language": "es", "is_active": True},
    {"code": "US", "name": "USA", "language": "en", "is_active": True},
]


DEFAULT_SCENARIOS = [
    {
        "country_code": "CL",
        "slug": "aeroport-santiago",
        "title": "Arrivée à l'aéroport de Santiago",
        "description": "Passe tes premiers contrôles, demande ton chemin, et comprends les premiers repères locaux.",
        "language_code": "es",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "¡Hola! Bienvenido a Santiago. ¿Primera vez en Chile? Si necesitas ubicarte en el aeropuerto, te ayudo al tiro.",
        "cultural_tip": "À l'aéroport au Chili, on reste généralement direct mais cordial. Des mots comme 'po', 'al tiro' ou 'cachai' peuvent apparaître très tôt, même dans un ton serviable.",
        "vocabulary_hints": '["pasaporte = passeport", "aduana = douane", "equipaje = bagage", "¿dónde tomo el metro? = où prendre le métro ?", "tarjeta Bip! = carte de transport de Santiago"]',
        "partner_name": "Matías",
        "partner_role": "Employé de l'aéroport de Santiago",
        "prompt_file": "chile_airport.txt",
        "system_prompt": "You are a friendly Chilean airport employee helping a learner at Santiago airport.",
        "is_active": True,
    },
    {
        "country_code": "CL",
        "slug": "taxi-uber-santiago",
        "title": "Taxi / Uber à Santiago",
        "description": "Explique où tu vas, réagis au style du chauffeur, et comprends le rythme plus informel de la ville.",
        "language_code": "es",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "Buena, súbete nomás. ¿Pa' dónde vas? Si quieres, te voy contando por dónde conviene pasar.",
        "cultural_tip": "Dans un taxi ou Uber chilien, le registre descend vite d'un cran: plus de spontanéité, plus de commentaire sur le trafic, et moins de distance qu'en contexte administratif.",
        "vocabulary_hints": '["¿Pa’ dónde vas? = où est-ce que tu vas ?", "al tiro = tout de suite", "taco = embouteillage", "la cuenta = le montant", "micro = bus urbain"]',
        "partner_name": "Ricardo",
        "partner_role": "Chauffeur chilien",
        "prompt_file": "chile_taxi.txt",
        "system_prompt": "You are a Chilean driver having a natural conversation with a learner.",
        "is_active": True,
    },
    {
        "country_code": "CL",
        "slug": "conversation-libre-chili",
        "title": "Conversation libre à Santiago",
        "description": "Parle avec une locale, pose des questions sur la ville, et découvre comment les gens parlent vraiment au quotidien.",
        "language_code": "es",
        "difficulty": "beginner",
        "mode": "free",
        "intro_message": "¡Hola! Soy Sofía. Feliz de conversar contigo. ¿Qué te da más curiosidad de Chile o de Santiago?",
        "cultural_tip": "Dans une conversation libre au Chili, le lien humain compte vite: curiosité, chaleur, et petites expressions locales donnent souvent plus de naturel que des phrases trop scolaires.",
        "vocabulary_hints": '["bacán = génial", "cachai = tu vois", "pololear = sortir avec quelqu’un", "la raja = excellent", "carrete = fête / soirée"]',
        "partner_name": "Sofía",
        "partner_role": "Locale chilienne passionnée par Santiago",
        "prompt_file": "chile_free.txt",
        "system_prompt": "You are a friendly Chilean local having an open-ended conversation with a learner. Use natural Chilean expressions when helpful.",
        "is_active": True,
    },
    {
        "country_code": "US",
        "slug": "immigration-usa",
        "title": "Immigration",
        "description": "Reponds aux questions de l'agent d'immigration",
        "language_code": "en",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "Good afternoon. What is the purpose of your visit today?",
        "cultural_tip": "Dans un contexte administratif américain, les réponses courtes, claires et directes sont souvent les plus efficaces.",
        "vocabulary_hints": '["purpose of your visit = motif de votre visite", "length of stay = durée du séjour", "customs = douane"]',
        "partner_name": "Officer James Patterson",
        "partner_role": "Agent d'immigration américain",
        "prompt_file": "usa_immigration.txt",
        "system_prompt": "You are a US immigration officer talking to a language learner entering the country.",
        "is_active": True,
    },
    {
        "country_code": "US",
        "slug": "order-coffee",
        "title": "Commander dans un cafe",
        "description": "Commande ton cafe comme un local",
        "language_code": "en",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "Hey! What can I get started for you today?",
        "cultural_tip": "Aux USA, le small talk rapide et un ton positif sont très fréquents dans les commerces du quotidien.",
        "vocabulary_hints": '["for here or to go = sur place ou à emporter", "size = taille", "anything else? = autre chose ?"]',
        "partner_name": "Maya",
        "partner_role": "Barista américaine",
        "prompt_file": "usa_coffee.txt",
        "system_prompt": "You are a barista in the US having a friendly exchange with a learner.",
        "is_active": True,
    },
    {
        "country_code": "US",
        "slug": "free-talk-usa",
        "title": "Free Talk",
        "description": "Have an open conversation with a local in the US",
        "language_code": "en",
        "difficulty": "beginner",
        "mode": "free",
        "intro_message": "Hey! I'm Alex. Want to chat about life in the US?",
        "cultural_tip": "Une conversation libre américaine semblera souvent positive, énergique et orientée vers l'échange rapide.",
        "vocabulary_hints": '["awesome = génial", "for sure = bien sûr", "no worries = pas de souci"]',
        "partner_name": "Alex",
        "partner_role": "Local américain basé à San Francisco",
        "prompt_file": "usa_free.txt",
        "system_prompt": "You are a friendly American local having an open-ended conversation with a learner.",
        "is_active": True,
    },
]


class SeedService:
    """Seeds the reference catalog used by the MVP."""

    def __init__(self) -> None:
        self.country_repository = CountryRepository()
        self.scenario_repository = ScenarioRepository()

    def _load_prompt(self, filename: str | None, fallback: str) -> str:
        if not filename:
            return fallback

        prompt_path = PROMPTS_DIR / filename
        if not prompt_path.exists():
            return fallback

        content = prompt_path.read_text(encoding="utf-8").strip()
        return content or fallback

    def _build_scenario_payload(self, scenario: dict[str, str | bool], country_id: int) -> dict:
        return {
            "country_id": country_id,
            "slug": scenario["slug"],
            "title": scenario["title"],
            "description": scenario["description"],
            "language_code": scenario["language_code"],
            "difficulty": scenario["difficulty"],
            "mode": scenario["mode"],
            "intro_message": scenario["intro_message"],
            "cultural_tip": scenario["cultural_tip"],
            "vocabulary_hints": scenario["vocabulary_hints"],
            "partner_name": scenario["partner_name"],
            "partner_role": scenario["partner_role"],
            "system_prompt": self._load_prompt(
                scenario.get("prompt_file"),
                str(scenario["system_prompt"]),
            ),
            "is_active": scenario["is_active"],
        }

    def seed_reference_data(self, db: Session) -> None:
        self.country_repository.create_many_if_missing(db, DEFAULT_COUNTRIES)
        db.flush()

        countries_by_code = {
            country.code: country
            for country in self.country_repository.list_active(db)
        }

        scenarios_to_create = []
        for scenario in DEFAULT_SCENARIOS:
            country = countries_by_code.get(scenario["country_code"])
            if country is None:
                continue
            scenarios_to_create.append(self._build_scenario_payload(scenario, country.id))

        self.scenario_repository.upsert_many_by_slug(db, scenarios_to_create)
        db.commit()
