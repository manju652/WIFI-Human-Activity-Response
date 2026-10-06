from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models
from ..database import get_db
from ..schemas import PersonOut

router = APIRouter(tags=["people"])


@router.get("/api/people", response_model=list[PersonOut])
def list_people(db: Session = Depends(get_db)):
    return db.query(models.Person).order_by(models.Person.person_id).all()


@router.get("/api/activities", response_model=list[PersonOut])
def current_activities(db: Session = Depends(get_db)):
    """Current activity snapshot for every tracked person (Live Monitoring panel)."""
    return db.query(models.Person).order_by(models.Person.person_id).all()
