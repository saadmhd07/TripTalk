"""add scenario language mode and session level

Revision ID: 20260414_000002
Revises: 20260409_000001
Create Date: 2026-04-14 00:00:02
"""

from alembic import op
import sqlalchemy as sa


revision = "20260414_000002"
down_revision = "20260409_000001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("scenarios", sa.Column("language_code", sa.String(length=10), nullable=True))
    op.add_column(
        "scenarios",
        sa.Column("mode", sa.String(length=20), nullable=False, server_default="guided"),
    )
    op.add_column(
        "conversation_sessions",
        sa.Column("level_at_start", sa.String(length=50), nullable=True),
    )

    op.execute(
        """
        UPDATE scenarios
        SET language_code = countries.language
        FROM countries
        WHERE scenarios.country_id = countries.id
        """
    )
    op.alter_column("scenarios", "language_code", nullable=False)
    op.alter_column("scenarios", "mode", server_default=None)


def downgrade() -> None:
    op.drop_column("conversation_sessions", "level_at_start")
    op.drop_column("scenarios", "mode")
    op.drop_column("scenarios", "language_code")
