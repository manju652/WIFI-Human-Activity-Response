"""
Bridges the backend to the trained ML pipeline in ../ml.
Uses the exact same ActivityPredictor (preprocessing + best model) that
was trained and evaluated in ml/train.py - one code path for training,
demo mode, and (future) real hardware inference.
"""

import sys
from pathlib import Path

ML_DIR = Path(__file__).resolve().parent.parent.parent / "ml"
if str(ML_DIR) not in sys.path:
    sys.path.insert(0, str(ML_DIR))

from inference import get_predictor, ActivityPredictor  # noqa: E402
from preprocessing import LABEL_NAMES  # noqa: E402

__all__ = ["get_predictor", "ActivityPredictor", "LABEL_NAMES"]
