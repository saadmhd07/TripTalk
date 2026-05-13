"""update chile barista avatar

Revision ID: 20260513_0012
Revises: 20260513_0011
Create Date: 2026-05-13
"""

from alembic import op
import sqlalchemy as sa


revision = "20260513_0012"
down_revision = "20260513_0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET
                partner_name = 'Carlos',
                partner_role = 'Barista chilien à Santiago',
                avatar_id = 'carlos'
            WHERE slug = 'cafeteria-santiago'
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET
                partner_name = 'Valentina',
                partner_role = 'Barista chilienne à Santiago',
                avatar_id = 'valentina'
            WHERE slug = 'cafeteria-santiago'
            """
        )
    )
