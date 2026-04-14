from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session
from app.repositories.scenario_repository import ScenarioRepository
from app.schemas.scenario import ScenarioRead

router = APIRouter()
scenario_repository = ScenarioRepository()


@router.get("/countries/{country_id}/scenarios", response_model=list[ScenarioRead])
def list_country_scenarios(
    country_id: int,
    db: Session = Depends(get_db_session),
) -> list[ScenarioRead]:
    scenarios = scenario_repository.list_by_country(db, country_id)
    return [
        ScenarioRead(
            id=scenario.id,
            country_id=scenario.country_id,
            slug=scenario.slug,
            title=scenario.title,
            description=scenario.description,
            language_code=scenario.language_code,
            difficulty=scenario.difficulty,
            mode=scenario.mode,
            is_active=scenario.is_active,
        )
        for scenario in scenarios
    ]


@router.get("/scenarios/{scenario_id}", response_model=ScenarioRead)
def get_scenario(
    scenario_id: int,
    db: Session = Depends(get_db_session),
) -> ScenarioRead:
    scenario = scenario_repository.get_by_id(db, scenario_id)
    if scenario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Scenario not found",
        )

    return ScenarioRead(
        id=scenario.id,
        country_id=scenario.country_id,
        slug=scenario.slug,
        title=scenario.title,
        description=scenario.description,
        language_code=scenario.language_code,
        difficulty=scenario.difficulty,
        mode=scenario.mode,
        is_active=scenario.is_active,
    )
