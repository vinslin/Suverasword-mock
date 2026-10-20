from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.company import Company
from app.models.director import Director
from app.schemas.director import DirectorCreate, DirectorOut


def _sync_journey_step(company_id: int, db: Session) -> None:
    """Advance journey_step to 2 when ≥2 directors exist; drop back to 1 when <2."""
    company = db.get(Company, company_id)
    if company is None:
        return
    count = db.query(Director).filter(Director.company_id == company_id).count()
    if count >= 2:
        company.journey_step = max(company.journey_step, 2)
    else:
        # Only drop back to 1 if still in the early steps (don't regress past step 2)
        if company.journey_step <= 2:
            company.journey_step = 1
    db.commit()

router = APIRouter(prefix="/companies/{company_id}/directors", tags=["directors"])


@router.get("", response_model=list[DirectorOut])
def list_directors(company_id: int, db: Session = Depends(get_db)):
    return (
        db.query(Director)
        .filter(Director.company_id == company_id)
        .order_by(Director.id)
        .all()
    )


@router.post("", response_model=DirectorOut)
def add_director(company_id: int, payload: DirectorCreate, db: Session = Depends(get_db)):
    director = Director(
        company_id=company_id,
        name=payload.name,
        din=payload.din,
        pan=payload.pan,
        role=payload.role,
        shareholding_pct=payload.shareholding_pct,
        appointment_date=payload.appointment_date,
        email=payload.email,
        phone=payload.phone,
    )
    db.add(director)
    db.commit()
    db.refresh(director)
    _sync_journey_step(company_id, db)
    return director


@router.put("/{director_id}", response_model=DirectorOut)
def update_director(company_id: int, director_id: int, payload: DirectorCreate, db: Session = Depends(get_db)):
    director = db.get(Director, director_id)
    if director is None or director.company_id != company_id:
        raise HTTPException(status_code=404, detail="Director not found")
    director.name = payload.name
    director.din = payload.din
    director.pan = payload.pan
    director.role = payload.role
    director.shareholding_pct = payload.shareholding_pct
    director.appointment_date = payload.appointment_date
    director.email = payload.email
    director.phone = payload.phone
    db.commit()
    db.refresh(director)
    return director


@router.delete("/{director_id}")
def delete_director(company_id: int, director_id: int, db: Session = Depends(get_db)):
    director = db.get(Director, director_id)
    if director is None or director.company_id != company_id:
        raise HTTPException(status_code=404, detail="Director not found")
    db.delete(director)
    db.commit()
    _sync_journey_step(company_id, db)
    return {"deleted": director_id}
