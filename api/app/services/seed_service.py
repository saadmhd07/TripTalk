from pathlib import Path

from sqlalchemy.orm import Session

from app.repositories.country_repository import CountryRepository
from app.repositories.scenario_repository import ScenarioRepository


PROMPTS_DIR = Path(__file__).parent.parent.parent / "prompts"

DEFAULT_COUNTRIES = [
    {"code": "CL", "name": "Chile", "language": "es", "is_active": True},
    {"code": "US", "name": "USA", "language": "en", "is_active": True},
    {"code": "FR", "name": "France", "language": "fr", "is_active": True},
]


DEFAULT_SCENARIOS = [
    {
        "country_code": "CL",
        "slug": "immigration-santiago",
        "title": "Contrôle d'immigration à Santiago",
        "description": "Passe le contrôle de police à l'arrivée, réponds aux questions officielles, et donne des réponses claires sous pression.",
        "language_code": "es",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "Buenos días. Su pasaporte, por favor. ¿Cuál es el motivo de su viaje a Chile?",
        "cultural_tip": "Au contrôle d'immigration chilien, le ton reste formel, direct et efficace. Il faut répondre de façon claire, sans trop broder, tout en restant poli.",
        "vocabulary_hints": '["pasaporte = passeport", "motivo del viaje = motif du voyage", "turismo = tourisme", "estadía = séjour", "vuelo de regreso = vol retour"]',
        "partner_name": "Oficial Ramírez",
        "partner_role": "Control de Pasaportes · PDI",
        "avatar_id": "oficial-ramirez",
        "prompt_file": "chile_immigration.txt",
        "system_prompt": "You are a Chilean immigration officer checking a traveler's documents on arrival in Santiago.",
        "is_active": True,
    },
    {
        "country_code": "CL",
        "slug": "cafeteria-santiago",
        "title": "Commander dans un café à Santiago",
        "description": "Commande un café, comprends les questions du barista, et pratique un échange court mais naturel.",
        "language_code": "es",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "Hola, ¿qué te gustaría pedir? Tenemos espresso, latte, cortado y algunas cosas dulces también.",
        "cultural_tip": "Dans un café chilien, le ton est souvent simple et chaleureux. On peut entendre des formes locales comme 'al tiro', 'po' ou '¿te tinca?'.",
        "vocabulary_hints": '["un cortado = café avec un peu de lait", "para llevar = à emporter", "algo dulce = quelque chose de sucré", "al tiro = tout de suite", "¿te tinca? = ça te tente ?"]',
        "partner_name": "Carlos",
        "partner_role": "Barista chilien à Santiago",
        "avatar_id": "carlos",
        "prompt_file": "chile_barista.txt",
        "system_prompt": "You are a Chilean barista in Santiago helping a learner order coffee naturally.",
        "is_active": True,
    },
    {
        "country_code": "US",
        "slug": "hotel-checkin-usa",
        "title": "Check-in à l'hôtel",
        "description": "Présente ta réservation, réponds aux questions de réception, et comprends les infos pratiques.",
        "language_code": "en",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "Hi, welcome in. Do you have a reservation with us tonight?",
        "cultural_tip": "Aux États-Unis, le check-in d'hôtel est souvent cordial et très procédural: nom, pièce d'identité, carte bancaire, horaires et services.",
        "vocabulary_hints": '["reservation = réservation", "ID = pièce d’identité", "credit card on file = carte enregistrée", "check-out time = heure de départ", "amenities = services de l’hôtel"]',
        "partner_name": "Ashley",
        "partner_role": "Réceptionniste d'hôtel aux États-Unis",
        "avatar_id": "ashley",
        "prompt_file": "usa_hotel_checkin.txt",
        "system_prompt": "You are a friendly hotel front desk agent in the United States.",
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
        "avatar_id": "maya",
        "prompt_file": "usa_coffee.txt",
        "system_prompt": "You are a barista in the US having a friendly exchange with a learner.",
        "is_active": True,
    },
    {
        "country_code": "FR",
        "slug": "restaurant-paris",
        "title": "Dîner au restaurant",
        "description": "Commande au serveur, pose une question sur le menu, et termine l'échange naturellement.",
        "language_code": "fr",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "Bonsoir, vous avez réservé ? Je peux vous installer par ici.",
        "cultural_tip": "Au restaurant en France, un ton poli et posé est attendu. On prend souvent le temps de demander conseil ou précision sur un plat.",
        "vocabulary_hints": '["j’ai réservé = I booked", "la carte = menu", "qu’est-ce que vous conseillez ? = what do you recommend?", "une carafe d’eau = tap water", "l’addition = the bill"]',
        "partner_name": "Étienne",
        "partner_role": "Serveur dans un restaurant parisien",
        "avatar_id": "etienne",
        "prompt_file": "france_restaurant.txt",
        "system_prompt": "You are a French waiter serving a learner at a Paris restaurant.",
        "is_active": True,
    },
    {
        "country_code": "FR",
        "slug": "boulangerie-paris",
        "title": "Commander en boulangerie",
        "description": "Commande du pain ou une pâtisserie avec le bon niveau de politesse et de naturel.",
        "language_code": "fr",
        "difficulty": "beginner",
        "mode": "guided",
        "intro_message": "Bonjour monsieur, vous désirez ?",
        "cultural_tip": "Dans une boulangerie française, le rituel est simple mais important: bonjour, demande claire, merci, au revoir.",
        "vocabulary_hints": '["une baguette tradition = traditional baguette", "une viennoiserie = pastry", "je vais prendre... = I will take...", "s’il vous plaît = please", "bonne journée = have a good day"]',
        "partner_name": "Nathalie",
        "partner_role": "Boulangère parisienne",
        "avatar_id": "nathalie",
        "prompt_file": "france_bakery.txt",
        "system_prompt": "You are a French baker serving a learner in a Paris bakery.",
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
            "avatar_id": scenario["avatar_id"],
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
