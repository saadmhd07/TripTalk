from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.scenario import Scenario


class ScenarioRepository:
    """Read/write helpers for scenario catalog data."""

    def list_by_country(self, db: Session, country_id: int) -> list[Scenario]:
        stmt: Select[tuple[Scenario]] = (
            select(Scenario)
            .where(Scenario.country_id == country_id)
            .where(Scenario.is_active.is_(True))
            .order_by(Scenario.id.asc())
        )
        return list(db.scalars(stmt))

    def get_by_id(self, db: Session, scenario_id: int) -> Scenario | None:
        stmt: Select[tuple[Scenario]] = select(Scenario).where(Scenario.id == scenario_id)
        return db.scalar(stmt)

    def create_many_if_missing(self, db: Session, scenarios: list[dict]) -> None:
        existing_slugs = {
            slug
            for slug in db.scalars(select(Scenario.slug).where(Scenario.slug.in_([s["slug"] for s in scenarios])))
        }
        for scenario in scenarios:
            if scenario["slug"] in existing_slugs:
                continue
            db.add(Scenario(**scenario))
