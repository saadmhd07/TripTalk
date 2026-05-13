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

        chile_immigration = db.query(Scenario).filter(Scenario.slug == "immigration-santiago").one()
        chile_barista = db.query(Scenario).filter(Scenario.slug == "cafeteria-santiago").one()
        usa_coffee = db.query(Scenario).filter(Scenario.slug == "order-coffee").one()
        usa_hotel = db.query(Scenario).filter(Scenario.slug == "hotel-checkin-usa").one()
        france_restaurant = db.query(Scenario).filter(Scenario.slug == "restaurant-paris").one()

        assert "Oficial Ramírez" in chile_immigration.system_prompt
        assert "PDI" in chile_immigration.system_prompt
        assert chile_immigration.partner_name == "Oficial Ramírez"
        assert "CHILEAN SPANISH STYLE:" in chile_barista.system_prompt
        assert "Carlos" in chile_barista.system_prompt
        assert chile_barista.partner_name == "Carlos"
        assert chile_barista.avatar_id == "carlos"
        assert "BROOKLYN/NYC CULTURE" in usa_coffee.system_prompt
        assert usa_coffee.partner_name == "Maya"
        assert "hotel front desk" in usa_hotel.system_prompt
        assert "Ashley" in usa_hotel.system_prompt
        assert usa_hotel.avatar_id == "ashley"
        assert "Paris restaurant" in france_restaurant.system_prompt
        assert france_restaurant.avatar_id == "etienne"


def test_seed_service_only_creates_guided_scenarios() -> None:
    seed_service = SeedService()

    with TestingSessionLocal() as db:
        seed_service.seed_reference_data(db)

        scenarios = db.query(Scenario).all()

        assert scenarios
        assert {scenario.mode for scenario in scenarios} == {"guided"}
        assert {scenario.slug for scenario in scenarios} == {
            "immigration-santiago",
            "cafeteria-santiago",
            "hotel-checkin-usa",
            "order-coffee",
            "restaurant-paris",
            "boulangerie-paris",
        }


def test_seed_service_updates_existing_scenarios_on_reseed() -> None:
    seed_service = SeedService()

    with TestingSessionLocal() as db:
        country = Country(code="CL", name="Chile", language="es", is_active=True)
        db.add(country)
        db.flush()
        db.add(
            Scenario(
                country_id=country.id,
                slug="cafeteria-santiago",
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

        updated = db.query(Scenario).filter(Scenario.slug == "cafeteria-santiago").one()

        assert updated.title == "Commander dans un café à Santiago"
        assert updated.partner_name == "Carlos"
        assert updated.partner_role == "Barista chilien à Santiago"
        assert "CHILEAN SPANISH STYLE:" in updated.system_prompt
