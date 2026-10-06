"""
Inference Pipeline
====================
Loads the best trained model (selected during training, see model_meta.json)
and runs the SAME preprocessing used in training on new CSI windows to
produce an activity prediction + confidence score.

This module is imported by the FastAPI backend (both for live /api/predict
calls and for the demo-mode simulation service), so there is exactly one
preprocessing + inference code path shared by training, demo, and any
future real-hardware integration.
"""

import json
from pathlib import Path

import numpy as np
import joblib
import torch

from preprocessing import LABEL_NAMES, remove_noise, normalize_window
from features import extract_features
from train import CSI_CNN, CSI_LSTM

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


class ActivityPredictor:
    """Wraps the trained best model + preprocessing for single-window inference."""

    def __init__(self, models_dir: Path = MODELS_DIR):
        with open(models_dir / "model_meta.json") as f:
            self.meta = json.load(f)
        self.best_model_name = self.meta["best_model"]
        self.window_size = self.meta["window_size"]
        self.n_subcarriers = self.meta["n_subcarriers"]
        self.label_names = {int(k): v for k, v in self.meta["label_map"].items()}

        self.scaler = None
        self.sk_model = None
        self.torch_model = None

        if self.best_model_name in ("random_forest", "svm"):
            self.scaler = joblib.load(models_dir / "feature_scaler.joblib")
            fname = "random_forest.joblib" if self.best_model_name == "random_forest" else "svm.joblib"
            self.sk_model = joblib.load(models_dir / fname)
        elif self.best_model_name == "cnn":
            self.torch_model = CSI_CNN(self.n_subcarriers, len(self.label_names))
            self.torch_model.load_state_dict(torch.load(models_dir / "cnn.pt", map_location="cpu"))
            self.torch_model.eval()
        elif self.best_model_name == "lstm":
            self.torch_model = CSI_LSTM(self.n_subcarriers, len(self.label_names))
            self.torch_model.load_state_dict(torch.load(models_dir / "lstm.pt", map_location="cpu"))
            self.torch_model.eval()
        else:
            raise ValueError(f"Unknown best model: {self.best_model_name}")

    def predict_window(self, raw_amplitude_window: np.ndarray):
        """
        raw_amplitude_window: [window_size, n_subcarriers] raw (unnormalized)
        amplitude values, already denoised or not (denoise is applied here).
        Returns dict: activity, confidence, label_id, model_used
        """
        cleaned = remove_noise(raw_amplitude_window)
        normed = normalize_window(cleaned)

        if self.sk_model is not None:
            feat = extract_features(normed).reshape(1, -1)
            feat_s = self.scaler.transform(feat)
            probs = self.sk_model.predict_proba(feat_s)[0]
            label_id = int(np.argmax(probs))
            confidence = float(probs[label_id])
        else:
            x = torch.tensor(normed, dtype=torch.float32).unsqueeze(0)
            with torch.no_grad():
                logits = self.torch_model(x)
                probs = torch.softmax(logits, dim=1)[0].numpy()
            label_id = int(np.argmax(probs))
            confidence = float(probs[label_id])

        return {
            "activity": self.label_names[label_id],
            "label_id": label_id,
            "confidence": round(confidence, 4),
            "model_used": self.best_model_name,
        }


_predictor_singleton = None


def get_predictor() -> ActivityPredictor:
    global _predictor_singleton
    if _predictor_singleton is None:
        _predictor_singleton = ActivityPredictor()
    return _predictor_singleton


if __name__ == "__main__":
    # quick smoke test using a real held-out sample from processed data
    base = Path(__file__).resolve().parent.parent / "dataset" / "processed"
    X = np.load(base / "X.npy")
    y = np.load(base / "y.npy")
    predictor = get_predictor()
    idx = np.random.randint(0, len(X))
    result = predictor.predict_window(X[idx])
    print(f"True label: {LABEL_NAMES[int(y[idx])]} | Prediction: {result}")
