from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


class Person(Base):
    __tablename__ = "people"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(String, unique=True, index=True, nullable=False)  # e.g. "P001"
    current_activity = Column(String, default="unknown")
    confidence = Column(Float, default=0.0)
    position_x = Column(Float, default=0.0)
    position_y = Column(Float, default=0.0)
    last_seen = Column(DateTime, default=datetime.utcnow)

    events = relationship("ActivityEvent", back_populates="person")
    alerts = relationship("Alert", back_populates="person")


class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(String, ForeignKey("people.person_id"), index=True, nullable=False)
    activity = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    model_used = Column(String, default="")
    is_demo = Column(Boolean, default=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    person = relationship("Person", back_populates="events")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    person_id = Column(String, ForeignKey("people.person_id"), index=True, nullable=False)
    alert_type = Column(String, nullable=False)  # e.g. "fall_detected"
    confidence = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    resolved = Column(Boolean, default=False)

    person = relationship("Person", back_populates="alerts")
