import asyncio
from datetime import datetime

import numpy as np
from fastapi import APIRouter, HTTPException

from ..ml_pipeline import get_predictor
from ..schemas import PredictRequest, PredictResponse, MonitoringControl
from ..services.simulation import start_simulation, stop_simulation, sim_state

router = APIRouter(tags=["prediction"])


@router.post("/api/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    """
    Real-time (or offline) prediction endpoint. Feed this a raw CSI
    amplitude window [window_size][n_subcarriers] - e.g. from live
    hardware once integrated (see docs/api.md) - and it returns the
    model's activity prediction. Runs through the exact same trained
    model used for demo mode and evaluation; no hardcoded outputs.
    """
    predictor = get_predictor()
    window = np.array(req.amplitude, dtype=np.float64)

    expected_sc = predictor.n_subcarriers
    if window.ndim != 2 or window.shape[1] != expected_sc:
        raise HTTPException(
            status_code=422,
            detail=f"Expected amplitude shape [T, {expected_sc}], got {list(window.shape)}",
        )
    if window.shape[0] < 10:
        raise HTTPException(status_code=422, detail="Window too short for reliable prediction (need >= 10 samples)")

    result = predictor.predict_window(window)
    return PredictResponse(
        person_id=req.person_id,
        activity=result["activity"],
        confidence=result["confidence"],
        model_used=result["model_used"],
        timestamp=datetime.utcnow(),
    )


@router.post("/api/monitoring/start")
async def monitoring_start(control: MonitoringControl):
    loop = asyncio.get_event_loop()
    started = start_simulation(loop, interval_seconds=control.interval_seconds, mode=control.mode)
    return {"started": started, "mode": control.mode, "already_running": not started}


@router.post("/api/monitoring/stop")
def monitoring_stop():
    stopped = stop_simulation()
    return {"stopped": stopped}
