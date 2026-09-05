from pydantic import BaseModel, ConfigDict


class RegistrationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    detail: str | None = None
    status: str
    date: str | None = None
