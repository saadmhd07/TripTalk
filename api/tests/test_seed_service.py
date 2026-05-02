from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base
from app.models import Country, Scenario
from app.services.seed_service import SeedService


engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
    future=True,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def setup_function() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def test_seed_service_uses_rich_prompt_files() -> None:
    seed_service = SeedService()

    with TestingSessionLocal() as db:
        seed_service.seed_reference_data(db)

        chile_airport = db.query(Scenario).filter(Scenario.slug == "aeroport-santiago").one()
        usa_coffee = db.query(Scenario).filter(Scenario.slug == "order-coffee").one()

        assert "ROLE:" in chile_airport.system_prompt
        assert "CHILEAN SPANISH STYLE:" in chile_airport.system_prompt
        assert "Tarjeta Bip!" in chile_airport.system_prompt
        assert "BROOKLYN/NYC CULTURE" in usa_coffee.system_prompt
        assert usa_coffee.partner_name == "Maya"


def test_seed_service_updates_existing_scenarios_on_reseed() -> None:
    seed_service = SeedService()

    with TestingSessionLocal() as db:
        country = Country(code="CL", name="Chile", language="es", is_active=True)
        db.add(country)
        db.flush()
        db.add(
            Scenario(
                country_id=country.id,
                slug="aeroport-santiago",
                title="Old title",
                description="Old description",
                language_code="es",
                difficulty="beginner",
                mode="guided",
                intro_message="Old intro",
                cultural_tip="Old tip",
                vocabulary_hints='["old"]',
                partner_name="Old partner",
                partner_role="Old role",
                system_prompt="Old prompt",
                is_active=True,
            )
        )
        db.commit()

        seed_service.seed_reference_data(db)

        updated = db.query(Scenario).filter(Scenario.slug == "aeroport-santiago").one()

        assert updated.title == "Arrivée à l'aéroport de Santiago"
        assert updated.partner_name == "Matías"
        assert updated.partner_role == "Employé de l'aéroport de Santiago"
        assert "CHILEAN SPANISH STYLE:" in updated.system_prompt
