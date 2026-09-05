from pydantic import BaseModel, ConfigDict, Field


class CompanyOut(BaseModel):
    model_config = ConfigDict(populate_by_name=True, from_attributes=True)

    name: str
    status_tag: str | None = Field(default=None, alias="statusTag")
    type: str
    registered_office: str = Field(alias="registeredOffice")
    business_activity: str = Field(alias="businessActivity")
    nic_code: str = Field(alias="nicCode")
    authorized_capital: int = Field(alias="authorizedCapital")
    paid_up_capital: int = Field(alias="paidUpCapital")
    incorporation_state: str = Field(alias="incorporationState")
    journey_step: int = Field(alias="journeyStep")


class CompanyUpdateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    name: str
    type: str
    registered_office: str = Field(alias="registeredOffice")
    business_activity: str = Field(alias="businessActivity")
    incorporation_state: str = Field(alias="incorporationState")
    authorized_capital: int = Field(alias="authorizedCapital")
    paid_up_capital: int = Field(alias="paidUpCapital")
