from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.company import Company
from app.schemas.company import CompanyOut, CompanyUpdateRequest
from app.services.seed import DEMO_COMPANY_ID

router = APIRouter(prefix="/company", tags=["company"])


@router.get("", response_model=CompanyOut, response_model_by_alias=True)
def get_company(db: Session = Depends(get_db)):
    company = db.get(Company, DEMO_COMPANY_ID)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.put("", response_model=CompanyOut, response_model_by_alias=True)
def update_company(payload: CompanyUpdateRequest, db: Session = Depends(get_db)):
    company = db.get(Company, DEMO_COMPANY_ID)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")

    company.name = payload.name
    company.type = payload.type
    company.registered_office = payload.registered_office
    company.business_activity = payload.business_activity
    company.incorporation_state = payload.incorporation_state
    company.authorized_capital = payload.authorized_capital
    company.paid_up_capital = payload.paid_up_capital

    db.commit()
    db.refresh(company)
    return company
