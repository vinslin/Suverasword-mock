from pydantic import BaseModel

from app.schemas.company import CompanyOut
from app.schemas.registration import RegistrationOut


class ChatMessageIn(BaseModel):
    text: str


class NameAvailability(BaseModel):
    name: str
    available: bool


class SourceRef(BaseModel):
    name: str
    tag: str


class ChatMessageOut(BaseModel):
    id: str
    sender: str
    time: str
    type: str
    text: str | None = None
    label: str | None = None
    results: list[NameAvailability] | None = None
    sources: list[SourceRef] | None = None


class ChatResponse(BaseModel):
    messages: list[ChatMessageOut]
    company: CompanyOut | None = None
    registrations: list[RegistrationOut]


class ChatHistoryResponse(BaseModel):
    messages: list[ChatMessageOut]
