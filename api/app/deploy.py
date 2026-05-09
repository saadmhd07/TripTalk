from pathlib import Path

from alembic import command
from alembic.config import Config

from app.seed import main as seed_main


def main() -> None:
    alembic_ini_path = Path(__file__).resolve().parent.parent / "alembic.ini"
    config = Config(str(alembic_ini_path))
    command.upgrade(config, "head")
    seed_main()


if __name__ == "__main__":
    main()
