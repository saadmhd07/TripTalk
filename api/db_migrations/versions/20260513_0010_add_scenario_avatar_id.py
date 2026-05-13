"""add scenario avatar id

Revision ID: 20260513_0010
Revises: 20260513_000009
Create Date: 2026-05-13
"""

from alembic import op
import sqlalchemy as sa


revision = "20260513_0010"
down_revision = "20260513_000009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("scenarios", sa.Column("avatar_id", sa.String(length=100), nullable=True))
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET avatar_id = CASE slug
                WHEN 'immigration-santiago' THEN 'oficial-ramirez'
                WHEN 'cafeteria-santiago' THEN 'carlos'
                WHEN 'hotel-checkin-usa' THEN 'ashley'
                WHEN 'order-coffee' THEN 'maya'
                WHEN 'restaurant-paris' THEN 'etienne'
                WHEN 'boulangerie-paris' THEN 'nathalie'
                ELSE avatar_id
            END
            """
        )
    )


def downgrade() -> None:
    op.drop_column("scenarios", "avatar_id")
