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
        "difficulty": "beginner",
        "system_prompt": "You are a friendly Chilean local helping a learner at Santiago airport.",
        "is_active": True,
    },
    {
        "country_code": "CL",
        "slug": "taxi-uber-santiago",
        "title": "Taxi / Uber",
        "description": "Indique ta destination et discute avec le chauffeur",
        "difficulty": "beginner",
        "system_prompt": "You are a Chilean driver having a natural conversation with a learner.",
        "is_active": True,
    },
    {
        "country_code": "US",
        "slug": "immigration-usa",
        "title": "Immigration",
        "description": "Reponds aux questions de l'agent d'immigration",
        "difficulty": "beginner",
        "system_prompt": "You are a US immigration officer talking to a language learner entering the country.",
        "is_active": True,
    },
    {
        "country_code": "US",
        "slug": "order-coffee",
        "title": "Commander dans un cafe",
        "description": "Commande ton cafe comme un local",
        "difficulty": "beginner",
        "system_prompt": "You are a barista in the US having a friendly exchange with a learner.",
        "is_active": True,
    },
]


class SeedService:
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
                    "difficulty": scenario["difficulty"],
                    "system_prompt": scenario["system_prompt"],
                    "is_active": scenario["is_active"],
                }
            )

        self.scenario_repository.create_many_if_missing(db, scenarios_to_create)
        db.commit()
