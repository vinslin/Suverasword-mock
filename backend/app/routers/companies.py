from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.company import Company
from app.models.registration import Registration
from app.services.agent_tools import DEFAULT_REGISTRATIONS

router = APIRouter(prefix="/companies", tags=["companies"])


class CompanyListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: int
    name: str
    type: str
    status_tag: str | None = Field(default=None, alias="statusTag")
    journey_step: int = Field(alias="journeyStep")


@router.get("", response_model=list[CompanyListItem], response_model_by_alias=True)
def list_companies(db: Session = Depends(get_db)):
    return db.query(Company).order_by(Company.id).all()


@router.post("", response_model=CompanyListItem, response_model_by_alias=True)
def create_company_shell(db: Session = Depends(get_db)):
    """Create a blank company shell. The AI agent fills in details during onboarding."""
    company = Company(
        name="",
        status_tag=None,
        type="",
        registered_office="",
        business_activity="",
        nic_code="",
        authorized_capital=0,
        paid_up_capital=0,
        incorporation_state="",
        journey_step=1,
        street="",
        city="",
        state="",
        pincode="",
    )
    db.add(company)
    db.flush()  # Assigns the auto-increment ID before we seed registrations

    for order, (reg_id, reg_name, detail) in enumerate(DEFAULT_REGISTRATIONS):
        db.add(
            Registration(
                id=reg_id,
                company_id=company.id,
                name=reg_name,
                detail=detail,
                status="Not Started",
                date=None,
                sort_order=order,
            )
        )

    db.commit()
    db.refresh(company)
    return company
