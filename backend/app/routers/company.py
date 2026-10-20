from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.company import Company
from app.schemas.company import CompanyOut, CompanyUpdateRequest
from app.services.agent_tools import tool_get_completeness_score

router = APIRouter(prefix="/companies/{company_id}", tags=["company"])


@router.get("/completeness")
def get_completeness(company_id: int, db: Session = Depends(get_db)):
    try:
        return tool_get_completeness_score(db, company_id)
    except ValueError:
        return {"score": 0, "completed": 0, "total": 9, "checks": {}, "missing": ["company not created yet"]}


@router.get("", response_model=CompanyOut, response_model_by_alias=True)
def get_company(company_id: int, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.put("", response_model=CompanyOut, response_model_by_alias=True)
def update_company(company_id: int, payload: CompanyUpdateRequest, db: Session = Depends(get_db)):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")

    company.name = payload.name
    company.type = payload.type
    company.registered_office = payload.registered_office
    company.business_activity = payload.business_activity
    company.incorporation_state = payload.incorporation_state
    company.authorized_capital = payload.authorized_capital
    company.paid_up_capital = payload.paid_up_capital
    if payload.street is not None:
        company.street = payload.street
    if payload.city is not None:
        company.city = payload.city
    if payload.state is not None:
        company.state = payload.state
    if payload.pincode is not None:
        company.pincode = payload.pincode

    # Auto-advance: address complete means step 3 DONE → move to step 4 (Documents Upload)
    if all([company.street, company.city, company.state, company.pincode]):
        company.journey_step = max(company.journey_step, 4)

    db.commit()
    db.refresh(company)
    return company
