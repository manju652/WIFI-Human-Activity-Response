from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models
from ..database import get_db
from ..ml_pipeline import get_predictor
from ..websocket_manager import manager
from ..services.simulation import sim_state
from ..schemas import StatusOut

router = APIRouter(tags=["health"])


@router.get("/api/health")
def health():
    return {"status": "ok", "service": "wifi-human-activity-recognition"}


@router.get("/api/status", response_model=StatusOut)
def status(db: Session = Depends(get_db)):
    predictor = get_predictor()
    people_count = db.query(func.count(models.Person.id)).scalar() or 0
    events_count = db.query(func.count(models.ActivityEvent.id)).scalar() or 0
    alerts_count = db.query(func.count(models.Alert.id)).scalar() or 0
    return StatusOut(
        monitoring_active=sim_state.running,
        mode=sim_state.mode,
        connected_clients=manager.count,
        model_in_use=predictor.best_model_name,
        people_tracked=people_count,
        total_events=events_count,
        total_alerts=alerts_count,
    )
