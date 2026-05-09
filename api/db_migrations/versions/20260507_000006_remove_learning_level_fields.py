"""remove learning level fields

Revision ID: 20260507_000006
Revises: 20260418_000005
Create Date: 2026-05-07
"""

from alembic import op
import sqlalchemy as sa


revision = "20260507_000006"
down_revision = "20260418_000005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_user_language_levels_language_code", table_name="user_language_levels")
    op.drop_index("ix_user_language_levels_user_id", table_name="user_language_levels")
    op.drop_table("user_language_levels")

    op.drop_column("conversation_sessions", "level_at_start")
    op.drop_column("profiles", "target_language")
    op.drop_column("profiles", "level")


def downgrade() -> None:
    op.add_column("profiles", sa.Column("level", sa.String(length=50), nullable=True))
    op.add_column("profiles", sa.Column("target_language", sa.String(length=50), nullable=True))
    op.add_column(
        "conversation_sessions",
        sa.Column("level_at_start", sa.String(length=50), nullable=True),
    )

    op.create_table(
        "user_language_levels",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("user_id", sa.String(length=36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("language_code", sa.String(length=10), nullable=False),
        sa.Column("level", sa.String(length=50), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "language_code", name="uq_user_language_levels"),
    )
    op.create_index("ix_user_language_levels_user_id", "user_language_levels", ["user_id"], unique=False)
    op.create_index(
        "ix_user_language_levels_language_code",
        "user_language_levels",
        ["language_code"],
        unique=False,
    )
