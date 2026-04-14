"""add scenario content fields

Revision ID: 20260414_000004
Revises: 20260414_000003
Create Date: 2026-04-14 00:00:04
"""

from alembic import op
import sqlalchemy as sa


revision = "20260414_000004"
down_revision = "20260414_000003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("scenarios", sa.Column("intro_message", sa.Text(), nullable=True))
    op.add_column("scenarios", sa.Column("cultural_tip", sa.Text(), nullable=True))
    op.add_column("scenarios", sa.Column("vocabulary_hints", sa.Text(), nullable=True))
    op.add_column("scenarios", sa.Column("partner_name", sa.String(length=100), nullable=True))
    op.add_column("scenarios", sa.Column("partner_role", sa.String(length=255), nullable=True))


def downgrade() -> None:
    op.drop_column("scenarios", "partner_role")
    op.drop_column("scenarios", "partner_name")
    op.drop_column("scenarios", "vocabulary_hints")
    op.drop_column("scenarios", "cultural_tip")
    op.drop_column("scenarios", "intro_message")
