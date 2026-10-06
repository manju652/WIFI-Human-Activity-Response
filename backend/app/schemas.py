from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PersonOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    person_id: str
    current_activity: str
    confidence: float
    position_x: float
    position_y: float
    last_seen: datetime


class ActivityEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    person_id: str
    activity: str
    confidence: float
    model_used: str
    is_demo: bool
    timestamp: datetime


class AlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    person_id: str
    alert_type: str
    confidence: float
    timestamp: datetime
    resolved: bool


class PredictRequest(BaseModel):
    """
    CSI window submitted for prediction.
    amplitude: list of [window_size][n_subcarriers] raw amplitude floats
    (e.g. from real CSI hardware once integrated - see docs/api.md)
    """
    person_id: str = "P001"
    amplitude: list[list[float]]


class PredictResponse(BaseModel):
    person_id: str
    activity: str
    confidence: float
    model_used: str
    timestamp: datetime


class MonitoringControl(BaseModel):
    mode: str = "demo"  # "demo" or "live"
    interval_seconds: float = 1.5


class StatusOut(BaseModel):
    monitoring_active: bool
    mode: str
    connected_clients: int
    model_in_use: str
    people_tracked: int
    total_events: int
    total_alerts: int


class StatisticsOut(BaseModel):
    activity_distribution: dict
    total_events: int
    total_falls: int
    avg_confidence: float
    people_count: int
