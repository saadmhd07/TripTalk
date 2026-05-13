"""update usa hotel avatar

Revision ID: 20260513_0013
Revises: 20260513_0012
Create Date: 2026-05-13
"""

from alembic import op
import sqlalchemy as sa


revision = "20260513_0013"
down_revision = "20260513_0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET
                partner_name = 'Ashley',
                partner_role = 'Réceptionniste d''hôtel aux États-Unis',
                avatar_id = 'ashley'
            WHERE slug = 'hotel-checkin-usa'
            """
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            UPDATE scenarios
            SET
                partner_name = 'Jordan',
                partner_role = 'Réceptionniste d''hôtel aux États-Unis',
                avatar_id = 'jordan'
            WHERE slug = 'hotel-checkin-usa'
            """
        )
    )
