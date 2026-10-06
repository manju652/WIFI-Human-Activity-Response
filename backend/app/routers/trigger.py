from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..services.simulation import trigger_action
from ..ml_pipeline import LABEL_NAMES

router = APIRouter(tags=["trigger"])


class TriggerRequest(BaseModel):
    person_id: str = "P001"
    activity: str  # one of the real supported classes - see /api/trigger/activities


@router.get("/api/trigger/activities")
def available_trigger_activities():
    """Which activities can be triggered - only classes the real model was
    actually trained on (see docs/dataset.md for why 'running' and
    'gesturing' aren't offered)."""
    return {"activities": list(LABEL_NAMES.values())}


@router.post("/api/trigger")
async def instant_action_trigger(req: TriggerRequest):
    """
    Instant Action Trigger: picks a REAL held-out CSI window that is
    genuinely labeled as `req.activity`, runs it through the real trained
    model, and persists/broadcasts the result. This does not fabricate a
    prediction - the model classifies real data and returns whatever it
    actually outputs (which is usually, but not always, the requested
    class, exactly as it would be for real hardware).
    """
    if req.activity not in LABEL_NAMES.values():
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported activity '{req.activity}'. Supported: {list(LABEL_NAMES.values())}",
        )
    message = await trigger_action(req.person_id, req.activity)
    return message
