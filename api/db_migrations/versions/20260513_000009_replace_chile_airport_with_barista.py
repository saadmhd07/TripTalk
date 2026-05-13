"""replace chile airport scenario with barista

Revision ID: 20260513_000009
Revises: 20260513_000008
Create Date: 2026-05-13
"""

from alembic import op
import sqlalchemy as sa


revision = "20260513_000009"
down_revision = "20260513_000008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET is_active = false
            WHERE slug = 'aeroport-santiago'
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET is_active = true
            WHERE slug = 'aeroport-santiago'
            """
        )
    )
