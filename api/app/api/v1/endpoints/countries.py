from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.repositories.country_repository import CountryRepository
from app.schemas.country import CountryRead

router = APIRouter()
country_repository = CountryRepository()


@router.get("/countries", response_model=list[CountryRead])
def list_countries(db: Session = Depends(get_db_session)) -> list[CountryRead]:
    countries = country_repository.list_active(db)
    return [
        CountryRead(
            id=country.id,
            code=country.code,
            name=country.name,
            language=country.language,
            is_active=country.is_active,
        )
        for country in countries
    ]
