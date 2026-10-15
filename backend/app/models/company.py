from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    status_tag: Mapped[str | None] = mapped_column(String, nullable=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    registered_office: Mapped[str] = mapped_column(String, nullable=False)
    business_activity: Mapped[str] = mapped_column(String, nullable=False)
    nic_code: Mapped[str] = mapped_column(String, nullable=False)
    authorized_capital: Mapped[int] = mapped_column(Integer, nullable=False)
    paid_up_capital: Mapped[int] = mapped_column(Integer, nullable=False)
    incorporation_state: Mapped[str] = mapped_column(String, nullable=False)
    journey_step: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    street: Mapped[str] = mapped_column(String, nullable=False, default="")
    city: Mapped[str] = mapped_column(String, nullable=False, default="")
    state: Mapped[str] = mapped_column(String, nullable=False, default="")
    pincode: Mapped[str] = mapped_column(String, nullable=False, default="")
