from datetime import datetime, timezone

from sqlalchemy import JSON, DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    # Deliberately not a real ForeignKey: chat history must be insertable before
    # a company exists yet (the onboarding conversation itself creates it), and
    # this app only ever has one company anyway — no real referential need.
    company_id: Mapped[int] = mapped_column(Integer, nullable=False)
    sender: Mapped[str] = mapped_column(String, nullable=False)  # "user" | "bot"
    type: Mapped[str] = mapped_column(String, nullable=False, default="text")
    text: Mapped[str | None] = mapped_column(String, nullable=True)
    payload: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
