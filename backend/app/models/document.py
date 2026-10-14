from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), nullable=False)
    director_id: Mapped[int | None] = mapped_column(ForeignKey("directors.id"), nullable=True)
    filename: Mapped[str] = mapped_column(String, nullable=False)       # stored name on disk
    original_name: Mapped[str] = mapped_column(String, nullable=False)  # user's original filename
    file_path: Mapped[str] = mapped_column(String, nullable=False)      # full path on disk
    doc_type: Mapped[str | None] = mapped_column(String, nullable=True) # pan_card / aadhaar / etc.
    linked_to: Mapped[str | None] = mapped_column(String, nullable=True) # 'company' or 'director'
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), nullable=False)
