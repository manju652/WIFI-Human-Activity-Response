"""
Basic tests for the Wi-Fi HAR backend.
Run with: pytest test_api.py  (from backend/ directory)
Uses an isolated SQLite test database so it never touches wifi_har.db.
"""
import os
os.environ["DATABASE_URL"] = "sqlite:///./test_wifi_har.db"

import numpy as np
from fastapi.testclient import TestClient

from app.main import app
from app.database import init_db

init_db()  # ensure tables exist before tests run (mirrors startup event)

client = TestClient(app)


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_status():
    r = client.get("/api/status")
    assert r.status_code == 200
    body = r.json()
    assert "model_in_use" in body
    assert body["model_in_use"] in ("random_forest", "svm", "cnn", "lstm")


def test_people_empty_initially():
    r = client.get("/api/people")
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_statistics_shape():
    r = client.get("/api/statistics")
    assert r.status_code == 200
    body = r.json()
    for key in ["activity_distribution", "total_events", "total_falls", "avg_confidence", "people_count"]:
        assert key in body


def test_predict_rejects_wrong_shape():
    r = client.post("/api/predict", json={"person_id": "P001", "amplitude": [[1.0, 2.0]]})
    assert r.status_code == 422


def test_predict_real_model_inference():
    """Feed a real-shaped random window through the actual trained model
    (not asserting a specific label, since input is synthetic noise -
    only that the pipeline runs end-to-end and returns a valid activity)."""
    window = np.random.rand(100, 64).tolist()
    r = client.post("/api/predict", json={"person_id": "P001", "amplitude": window})
    assert r.status_code == 200
    body = r.json()
    assert body["activity"] in ("empty", "sit", "stand", "walk", "fall")
    assert 0.0 <= body["confidence"] <= 1.0


def test_monitoring_start_stop():
    r = client.post("/api/monitoring/start", json={"mode": "demo", "interval_seconds": 0.2})
    assert r.status_code == 200
    assert r.json()["started"] is True

    r2 = client.post("/api/monitoring/stop")
    assert r2.status_code == 200
    assert r2.json()["stopped"] is True


def test_trigger_activities_list():
    r = client.get("/api/trigger/activities")
    assert r.status_code == 200
    assert set(r.json()["activities"]) == {"empty", "sit", "stand", "walk", "fall"}


def test_trigger_fires_real_sample():
    r = client.post("/api/trigger", json={"person_id": "P099", "activity": "fall"})
    assert r.status_code == 200
    body = r.json()
    assert body["triggered_as"] == "fall"
    assert body["activity"] in ("empty", "sit", "stand", "walk", "fall")
    assert 0.0 <= body["confidence"] <= 1.0


def test_trigger_rejects_unsupported_activity():
    r = client.post("/api/trigger", json={"person_id": "P099", "activity": "running"})
    assert r.status_code == 422


def test_csi_sample_real_data():
    r = client.get("/api/csi-sample", params={"activity": "walk"})
    assert r.status_code == 200
    body = r.json()
    assert body["true_label"] == "walk"
    assert len(body["fft_magnitude"]) > 0
    assert len(body["waterfall"]) == 40


def teardown_module(module):
    if os.path.exists("test_wifi_har.db"):
        os.remove("test_wifi_har.db")
