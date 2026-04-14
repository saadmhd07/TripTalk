from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Scenario(Base):
    __tablename__ = "scenarios"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"), index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    language_code: Mapped[str] = mapped_column(String(10))
    difficulty: Mapped[str] = mapped_column(String(50))
    mode: Mapped[str] = mapped_column(String(20), default="guided")
    intro_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    cultural_tip: Mapped[str | None] = mapped_column(Text, nullable=True)
    vocabulary_hints: Mapped[str | None] = mapped_column(Text, nullable=True)
    partner_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    partner_role: Mapped[str | None] = mapped_column(String(255), nullable=True)
    system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    country = relationship("Country", back_populates="scenarios")
    sessions = relationship("ConversationSession", back_populates="scenario")
