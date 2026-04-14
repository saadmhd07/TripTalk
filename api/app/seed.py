from app.core.database import SessionLocal
from app.services.seed_service import SeedService


def main() -> None:
    seed_service = SeedService()
    with SessionLocal() as db:
        seed_service.seed_reference_data(db)
    print("Seed completed.")


if __name__ == "__main__":
    main()
