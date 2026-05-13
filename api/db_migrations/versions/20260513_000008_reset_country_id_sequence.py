"""reset country id sequence

Revision ID: 20260513_000008
Revises: 20260513_000007
Create Date: 2026-05-13
"""

from alembic import op
import sqlalchemy as sa


revision = "20260513_000008"
down_revision = "20260513_000007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            SELECT setval(
                pg_get_serial_sequence('countries', 'id'),
                COALESCE((SELECT MAX(id) FROM countries), 1),
                true
            )
            """
        )
    )


def downgrade() -> None:
    pass
