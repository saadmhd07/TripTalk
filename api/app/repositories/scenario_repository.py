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
            .where(Scenario.mode == "guided")
            .order_by(Scenario.id.asc())
        )
        return list(db.scalars(stmt))

    def get_by_id(self, db: Session, scenario_id: int) -> Scenario | None:
        stmt: Select[tuple[Scenario]] = select(Scenario).where(Scenario.id == scenario_id)
        return db.scalar(stmt)

    def create_many_if_missing(self, db: Session, scenarios: list[dict]) -> None:
        if not scenarios:
            return

        slugs = [scenario["slug"] for scenario in scenarios]
        existing_slugs = {
            slug
            for slug in db.scalars(select(Scenario.slug).where(Scenario.slug.in_(slugs)))
        }
        for scenario in scenarios:
            if scenario["slug"] in existing_slugs:
                continue
            db.add(Scenario(**scenario))

    def upsert_many_by_slug(self, db: Session, scenarios: list[dict]) -> None:
        if not scenarios:
            return

        slugs = [item["slug"] for item in scenarios]
        existing_by_slug = {
            scenario.slug: scenario
            for scenario in db.scalars(
                select(Scenario).where(Scenario.slug.in_(slugs))
            )
        }

        for payload in scenarios:
            existing = existing_by_slug.get(payload["slug"])
            if existing is None:
                db.add(Scenario(**payload))
                continue

            for field, value in payload.items():
                setattr(existing, field, value)
