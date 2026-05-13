"""trim launch scenario catalog

Revision ID: 20260513_000007
Revises: 20260507_000006
Create Date: 2026-05-13
"""

from alembic import op
import sqlalchemy as sa


revision = "20260513_000007"
down_revision = "20260507_000006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET is_active = false
            WHERE slug NOT IN (
                'immigration-santiago',
                'cafeteria-santiago',
                'hotel-checkin-usa',
                'order-coffee',
                'restaurant-paris',
                'boulangerie-paris'
            )
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET is_active = true
            WHERE mode = 'free'
            """
        )
    )
