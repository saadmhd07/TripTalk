"""add user language levels

Revision ID: 20260414_000003
Revises: 20260414_000002
Create Date: 2026-04-14 00:00:03
"""

from alembic import op
import sqlalchemy as sa


revision = "20260414_000003"
down_revision = "20260414_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
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


def downgrade() -> None:
    op.drop_index("ix_user_language_levels_language_code", table_name="user_language_levels")
    op.drop_index("ix_user_language_levels_user_id", table_name="user_language_levels")
    op.drop_table("user_language_levels")
