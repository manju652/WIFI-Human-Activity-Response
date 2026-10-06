"""
Demo / Simulation Service
===========================
IMPORTANT: this does NOT randomly generate activity labels. It replays
real held-out CSI windows (dataset/processed/X_raw.npy, the same test-set
samples excluded from training) through the exact same preprocessing +
trained model used everywhere else in this project. The only "simulated"
part is the timing (packets normally arrive from a live router) - the
CSI data and the model's prediction of it are both real.

This clearly labeled DEMO MODE lets the full pipeline (inference -> DB ->
WebSocket -> dashboard) be exercised end-to-end without real CSI capture
hardware connected. Swapping in real hardware later only requires
replacing the packet SOURCE in `stream_loop` below with a live CSI feed -
everything downstream (preprocessing, model, DB, WebSocket, dashboard)
is unchanged. See docs/architecture.md.
"""

import asyncio
import logging
import random
from datetime import datetime
from pathlib import Path

import numpy as np
from sqlalchemy.orm import Session

from .. import models
from ..database import SessionLocal
from ..ml_pipeline import get_predictor, LABEL_NAMES
from ..websocket_manager import manager

logger = logging.getLogger("wifi-har.simulation")

PROCESSED_DIR = Path(__file__).resolve().parent.parent.parent.parent / "dataset" / "processed"
LABEL_TO_ID = {v: k for k, v in LABEL_NAMES.items()}

_X_RAW_CACHE: np.ndarray | None = None
_Y_CACHE: np.ndarray | None = None


def _load_cache():
    global _X_RAW_CACHE, _Y_CACHE
    if _X_RAW_CACHE is None:
        _X_RAW_CACHE = np.load(PROCESSED_DIR / "X_raw.npy")
        _Y_CACHE = np.load(PROCESSED_DIR / "y_raw.npy")
    return _X_RAW_CACHE, _Y_CACHE


def get_real_sample(activity: str | None = None) -> tuple[np.ndarray, str]:
    """
    Returns a real held-out CSI window (denoised, not yet normalized) and
    its true label. If `activity` is given, samples only from windows
    whose TRUE label matches it - this is what powers the Instant Action
    Trigger buttons: the button doesn't fake the model's output, it picks
    a real window that is actually that activity and lets the real model
    classify it (which will usually, not always, agree - exactly like a
    real system).
    """
    X_raw, y = _load_cache()
    if activity is not None:
        target_id = LABEL_TO_ID.get(activity)
        if target_id is None:
            raise ValueError(f"Unknown activity: {activity}")
        idxs = np.where(y == target_id)[0]
        if len(idxs) == 0:
            raise ValueError(f"No real samples available for activity: {activity}")
        idx = int(random.choice(idxs))
    else:
        idx = random.randrange(len(X_raw))
    return X_raw[idx], LABEL_NAMES[int(y[idx])]

PERSON_IDS = ["P001", "P002", "P003"]

# simple simulated room positions, updated per predicted activity to give
# the "Person Tracking" panel something plausible to draw - NOT derived
# from any real localization algorithm (we explicitly avoid claiming
# centimeter-level localization anywhere in this project).
_ROOM_BOUNDS = {"x": (5, 95), "y": (5, 95)}


class SimulationState:
    def __init__(self):
        self.running = False
        self.mode = "demo"
        self.task: asyncio.Task | None = None
        self.person_positions = {
            pid: (random.uniform(*_ROOM_BOUNDS["x"]), random.uniform(*_ROOM_BOUNDS["y"]))
            for pid in PERSON_IDS
        }


sim_state = SimulationState()


def _drift_position(pos):
    x, y = pos
    x = min(max(x + random.uniform(-6, 6), _ROOM_BOUNDS["x"][0]), _ROOM_BOUNDS["x"][1])
    y = min(max(y + random.uniform(-6, 6), _ROOM_BOUNDS["y"][0]), _ROOM_BOUNDS["y"][1])
    return (x, y)


def _get_or_init_position(person_id: str):
    if person_id not in sim_state.person_positions:
        sim_state.person_positions[person_id] = (
            random.uniform(*_ROOM_BOUNDS["x"]), random.uniform(*_ROOM_BOUNDS["y"]),
        )
    return sim_state.person_positions[person_id]


async def _predict_and_persist(person_id: str, raw_window: np.ndarray, is_demo: bool, true_label: str | None = None):
    predictor = get_predictor()
    result = predictor.predict_window(raw_window)  # real model inference, no hardcoding

    db: Session = SessionLocal()
    try:
        person = db.query(models.Person).filter_by(person_id=person_id).first()
        pos = sim_state.person_positions[person_id] = _drift_position(_get_or_init_position(person_id))
        if person is None:
            person = models.Person(person_id=person_id)
            db.add(person)
        person.current_activity = result["activity"]
        person.confidence = result["confidence"]
        person.position_x, person.position_y = pos
        person.last_seen = datetime.utcnow()

        event = models.ActivityEvent(
            person_id=person_id,
            activity=result["activity"],
            confidence=result["confidence"],
            model_used=result["model_used"],
            is_demo=is_demo,
        )
        db.add(event)

        alert_payload = None
        if result["activity"] == "fall":
            alert = models.Alert(
                person_id=person_id,
                alert_type="fall_detected",
                confidence=result["confidence"],
            )
            db.add(alert)
            db.flush()
            alert_payload = {
                "id": alert.id, "person_id": person_id, "alert_type": "fall_detected",
                "confidence": result["confidence"], "timestamp": datetime.utcnow().isoformat(),
            }

        db.commit()

        message = {
            "type": "alert" if alert_payload else "activity_update",
            "person_id": person_id,
            "activity": result["activity"],
            "confidence": result["confidence"],
            "model_used": result["model_used"],
            "position": {"x": pos[0], "y": pos[1]},
            "timestamp": datetime.utcnow().isoformat(),
            "is_demo": is_demo,
        }
        if true_label is not None:
            message["triggered_as"] = true_label
        if alert_payload:
            message["alert"] = alert_payload
        await manager.broadcast(message)
        return message
    finally:
        db.close()


async def trigger_action(person_id: str, activity: str):
    """
    Instant Action Trigger: pick a REAL held-out CSI window whose true
    label matches `activity`, run it through the real trained model, and
    persist/broadcast the result exactly like the regular demo stream.
    Returns the model's actual prediction - which is usually but not
    guaranteed to equal the requested activity, same as it would be for
    a real capture of that activity (this is not faked to always match).
    """
    window, true_label = get_real_sample(activity)
    return await _predict_and_persist(person_id, window, is_demo=(sim_state.mode == "demo"), true_label=true_label)


async def stream_loop(interval_seconds: float = 1.5):
    """Continuously pick real held-out CSI windows and run them through the
    live inference pipeline, one 'virtual sensor read' per active person."""
    X_raw, _ = _load_cache()
    logger.info(f"Demo stream loaded {len(X_raw)} real CSI windows")

    sim_state.running = True
    try:
        while sim_state.running:
            for person_id in PERSON_IDS:
                window, _true_label = get_real_sample()
                await _predict_and_persist(person_id, window, is_demo=(sim_state.mode == "demo"))
            await asyncio.sleep(interval_seconds)
    except asyncio.CancelledError:
        logger.info("Demo stream cancelled")
    finally:
        sim_state.running = False


def start_simulation(loop: asyncio.AbstractEventLoop, interval_seconds: float = 1.5, mode: str = "demo"):
    if sim_state.running:
        return False
    sim_state.mode = mode
    sim_state.task = loop.create_task(stream_loop(interval_seconds))
    return True


def stop_simulation():
    if sim_state.task and not sim_state.task.done():
        sim_state.running = False
        sim_state.task.cancel()
    sim_state.running = False
    return True
