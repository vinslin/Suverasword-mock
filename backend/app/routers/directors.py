from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.director import Director
from app.schemas.director import DirectorCreate, DirectorOut
from app.services.seed import DEMO_COMPANY_ID

router = APIRouter(prefix="/directors", tags=["directors"])


@router.get("", response_model=list[DirectorOut])
def list_directors(db: Session = Depends(get_db)):
    return (
        db.query(Director)
        .filter(Director.company_id == DEMO_COMPANY_ID)
        .order_by(Director.id)
        .all()
    )


@router.post("", response_model=DirectorOut)
def add_director(payload: DirectorCreate, db: Session = Depends(get_db)):
    director = Director(
        company_id=DEMO_COMPANY_ID,
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
    return director


@router.put("/{director_id}", response_model=DirectorOut)
def update_director(director_id: int, payload: DirectorCreate, db: Session = Depends(get_db)):
    director = db.get(Director, director_id)
    if director is None or director.company_id != DEMO_COMPANY_ID:
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
def delete_director(director_id: int, db: Session = Depends(get_db)):
    director = db.get(Director, director_id)
    if director is None or director.company_id != DEMO_COMPANY_ID:
        raise HTTPException(status_code=404, detail="Director not found")
    db.delete(director)
    db.commit()
    return {"deleted": director_id}
