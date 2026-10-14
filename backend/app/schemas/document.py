from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    company_id: int = Field(alias="companyId")
    director_id: int | None = Field(default=None, alias="directorId")
    filename: str
    original_name: str = Field(alias="originalName")
    doc_type: str | None = Field(default=None, alias="docType")
    linked_to: str | None = Field(default=None, alias="linkedTo")
    uploaded_at: datetime = Field(alias="uploadedAt")
