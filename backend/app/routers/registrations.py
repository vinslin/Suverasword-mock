from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.company import Company
from app.models.registration import Registration
from app.schemas.registration import RegistrationOut
from app.services.agent_tools import tool_advance_registration_status

router = APIRouter(prefix="/companies/{company_id}/registrations", tags=["registrations"])

MCA_REG_ID = "mca"
POST_INC_IDS = {"pan", "tan", "gst", "ptax", "epfo", "esic", "shop_est", "bank"}


def _sync_reg_journey_step(company_id: int, db: Session) -> None:
    company = db.get(Company, company_id)
    if company is None:
        return
    regs = db.query(Registration).filter(Registration.company_id == company_id).all()
    reg_map = {r.id: r.status for r in regs}

    # MCA completed → step 7 (Post Incorporation Registrations)
    if reg_map.get(MCA_REG_ID) == "Completed":
        company.journey_step = max(company.journey_step, 7)

    # All post-incorporation registrations completed → step 8 (Compliance & Next Steps)
    post_inc_regs = [r for r in regs if r.id != MCA_REG_ID]
    if post_inc_regs and all(r.status == "Completed" for r in post_inc_regs):
        company.journey_step = max(company.journey_step, 8)

    db.commit()


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
    _sync_reg_journey_step(company_id, db)
    return result
