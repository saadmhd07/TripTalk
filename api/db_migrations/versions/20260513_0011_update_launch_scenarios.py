"""update launch scenarios

Revision ID: 20260513_0011
Revises: 20260513_0010
Create Date: 2026-05-13
"""

from alembic import op
import sqlalchemy as sa


revision = "20260513_0011"
down_revision = "20260513_0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET is_active = false
            WHERE slug IN ('immigration-usa', 'arrivee-cdg')
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET is_active = true
            WHERE slug IN ('immigration-usa', 'arrivee-cdg')
            """
        )
    )
