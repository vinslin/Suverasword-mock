from pydantic import BaseModel, ConfigDict, Field


class DirectorCreate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    din: str | None = None
    pan: str | None = None
    role: str | None = None
    shareholding_pct: float | None = Field(default=None, alias="shareholdingPct")
    appointment_date: str | None = Field(default=None, alias="appointmentDate")
    email: str | None = None
    phone: str | None = None


class DirectorOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    id: int
    company_id: int = Field(alias="companyId")
    name: str
    din: str | None = None
    pan: str | None = None
    role: str | None = None
    shareholding_pct: float | None = Field(default=None, alias="shareholdingPct")
    appointment_date: str | None = Field(default=None, alias="appointmentDate")
    email: str | None = None
    phone: str | None = None
