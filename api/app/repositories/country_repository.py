from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.country import Country


class CountryRepository:
    """Read/write helpers for country catalog data."""

    def list_active(self, db: Session) -> list[Country]:
        stmt: Select[tuple[Country]] = (
            select(Country)
            .where(Country.is_active.is_(True))
            .order_by(Country.id.asc())
        )
        return list(db.scalars(stmt))

    def get_by_code(self, db: Session, code: str) -> Country | None:
        stmt: Select[tuple[Country]] = select(Country).where(Country.code == code)
        return db.scalar(stmt)

    def create_many_if_missing(self, db: Session, countries: list[dict]) -> None:
        existing_codes = {
            code
            for code in db.scalars(select(Country.code).where(Country.code.in_([c["code"] for c in countries])))
        }
        for country in countries:
            if country["code"] in existing_codes:
                continue
            db.add(Country(**country))
