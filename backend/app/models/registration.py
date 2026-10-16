from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base

STATUS_CYCLE = {
    "Not Started": "In Progress",
    "Pending": "In Progress",
    "In Progress": "Completed",
    "Completed": "Completed",
}


class Registration(Base):
    __tablename__ = "registrations"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("companies.id"), primary_key=True, nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    detail: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default="Not Started")
    date: Mapped[str | None] = mapped_column(String, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
