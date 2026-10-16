from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.schemas.registration import RegistrationOut
from app.services.agent_tools import tool_advance_registration_status

router = APIRouter(prefix="/companies/{company_id}/registrations", tags=["registrations"])


@router.get("", response_model=list[RegistrationOut])
def list_registrations(company_id: int, db: Session = Depends(get_db)):
    from app.models.registration import Registration
    return (
        db.query(Registration)
        .filter(Registration.company_id == company_id)
        .order_by(Registration.sort_order)
        .all()
    )


@router.post("/{registration_id}/advance", response_model=RegistrationOut)
def advance_registration(company_id: int, registration_id: str, db: Session = Depends(get_db)):
    try:
        result = tool_advance_registration_status(db, company_id, registration_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return result
