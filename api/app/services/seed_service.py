from sqlalchemy.orm import Session

from app.repositories.country_repository import CountryRepository
from app.repositories.scenario_repository import ScenarioRepository


DEFAULT_COUNTRIES = [
    {"code": "CL", "name": "Chile", "language": "es", "is_active": True},
    {"code": "US", "name": "USA", "language": "en", "is_active": True},
]


DEFAULT_SCENARIOS = [
    {
        "country_code": "CL",
        "slug": "aeroport-santiago",
        "title": "Aeroport de Santiago",
        "description": "Arrive au Chili et passe la douane",
        "language_code": "es",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "¡Hola! Bienvenido a Santiago. Te voy a ayudar a pasar por el aeropuerto, cachai.",
        "cultural_tip": "Au Chili, le ton peut être direct mais reste chaleureux. Écoute les petits mots locaux comme 'po' ou 'cachai'.",
        "vocabulary_hints": '["pasaporte = passeport", "aduana = douane", "equipaje = bagage"]',
        "partner_name": "Matías",
        "partner_role": "Local chilien à l'aéroport",
        "system_prompt": "You are a friendly Chilean local helping a learner at Santiago airport.",
        "is_active": True,
    },
    {
        "country_code": "CL",
        "slug": "taxi-uber-santiago",
        "title": "Taxi / Uber",
        "description": "Indique ta destination et discute avec le chauffeur",
        "language_code": "es",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "Buena, súbete nomás. ¿Para dónde vas?",
        "cultural_tip": "Dans un taxi ou Uber, les échanges peuvent vite devenir informels. Un ton simple et naturel fonctionne bien.",
        "vocabulary_hints": '["¿Para dónde vas? = où tu vas ?", "al tiro = tout de suite", "la cuenta = l\'addition / le montant"]',
        "partner_name": "Carlos",
        "partner_role": "Chauffeur chilien",
        "system_prompt": "You are a Chilean driver having a natural conversation with a learner.",
        "is_active": True,
    },
    {
        "country_code": "CL",
        "slug": "conversation-libre-chili",
        "title": "Conversation libre",
        "description": "Discute librement avec un local chilien",
        "language_code": "es",
        "difficulty": "beginner",
        "mode": "free",
        "intro_message": "¡Hola! Soy Matías. ¿Qué te gustaría conversar sobre Chile hoy?",
        "cultural_tip": "Une conversation libre est l'occasion d'entendre du vocabulaire local et de poser des questions sur la vie quotidienne au Chili.",
        "vocabulary_hints": '["bacán = génial", "cachai = tu vois", "pololear = sortir avec quelqu\'un"]',
        "partner_name": "Matías",
        "partner_role": "Ami local chilien",
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
        "partner_name": "Officer Miller",
        "partner_role": "Agent d'immigration américain",
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
        "partner_name": "Emily",
        "partner_role": "Barista américaine",
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
        "intro_message": "Hey! I'm Emily. Want to chat about life in the US?",
        "cultural_tip": "Une conversation libre américaine semblera souvent positive, énergique et orientée vers l'échange rapide.",
        "vocabulary_hints": '["awesome = génial", "for sure = bien sûr", "no worries = pas de souci"]',
        "partner_name": "Emily",
        "partner_role": "Locale américaine",
        "system_prompt": "You are a friendly American local having an open-ended conversation with a learner.",
        "is_active": True,
    },
]


class SeedService:
    """Seeds the reference catalog used by the MVP."""

    def __init__(self) -> None:
        self.country_repository = CountryRepository()
        self.scenario_repository = ScenarioRepository()

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
            scenarios_to_create.append(
                {
                    "country_id": country.id,
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
                    "system_prompt": scenario["system_prompt"],
                    "is_active": scenario["is_active"],
                }
            )

        self.scenario_repository.create_many_if_missing(db, scenarios_to_create)
        db.commit()
