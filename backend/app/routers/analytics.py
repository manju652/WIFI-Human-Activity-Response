from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from .. import models
from ..database import get_db
from ..schemas import ActivityEventOut, AlertOut, StatisticsOut

router = APIRouter(tags=["analytics"])


@router.get("/api/activity-history", response_model=list[ActivityEventOut])
def activity_history(
    db: Session = Depends(get_db),
    person_id: Optional[str] = None,
    activity: Optional[str] = None,
    limit: int = Query(100, le=1000),
):
    q = db.query(models.ActivityEvent)
    if person_id:
        q = q.filter(models.ActivityEvent.person_id == person_id)
    if activity:
        q = q.filter(models.ActivityEvent.activity == activity)
    return q.order_by(models.ActivityEvent.timestamp.desc()).limit(limit).all()


@router.get("/api/statistics", response_model=StatisticsOut)
def statistics(db: Session = Depends(get_db)):
    rows = db.query(models.ActivityEvent.activity, func.count(models.ActivityEvent.id)) \
        .group_by(models.ActivityEvent.activity).all()
    distribution = {activity: count for activity, count in rows}

    total_events = db.query(func.count(models.ActivityEvent.id)).scalar() or 0
    total_falls = distribution.get("fall", 0)
    avg_conf = db.query(func.avg(models.ActivityEvent.confidence)).scalar() or 0.0
    people_count = db.query(func.count(models.Person.id)).scalar() or 0

    return StatisticsOut(
        activity_distribution=distribution,
        total_events=total_events,
        total_falls=total_falls,
        avg_confidence=round(float(avg_conf), 4),
        people_count=people_count,
    )


@router.get("/api/alerts", response_model=list[AlertOut])
def list_alerts(db: Session = Depends(get_db), resolved: Optional[bool] = None, limit: int = Query(50, le=500)):
    q = db.query(models.Alert)
    if resolved is not None:
        q = q.filter(models.Alert.resolved == resolved)
    return q.order_by(models.Alert.timestamp.desc()).limit(limit).all()


@router.post("/api/alerts/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(models.Alert).get(alert_id)
    if alert:
        alert.resolved = True
        db.commit()
        db.refresh(alert)
    return alert
