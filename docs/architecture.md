# Architecture

## Data Flow

```
Wi-Fi CSI Data (raw amplitude/phase, 64 subcarriers)
        │
        ▼
Preprocessing  (ml/preprocessing.py)
  - parse complex CSI → amplitude
  - median-filter denoise per subcarrier
  - segment into fixed windows (100 packets, 50% stride overlap)
  - per-window z-score normalization
        │
        ▼
Feature Extraction  (ml/features.py)
  - time-domain stats (mean/std/max/min/range/skew/kurtosis/energy)
  - per-subcarrier aggregated + reduced to a fixed-length vector
  - frequency-domain (FFT magnitude of mean subcarrier signal)
  - (only used by the classical models — CNN/LSTM consume raw windows)
        │
        ▼
ML/DL Model  (ml/train.py → best model selected by test F1)
  - Random Forest / SVM  → operate on extracted features
  - CNN / LSTM           → operate on raw normalized windows
        │
        ▼
Inference Pipeline  (ml/inference.py — ActivityPredictor)
  - loads the SAME preprocessing + best saved model
  - single entry point used by: training evaluation, demo mode,
    and the live /api/predict endpoint
        │
        ▼
FastAPI Backend  (backend/app)
  - REST endpoints for status, people, history, statistics, alerts
  - /api/predict for direct/live inference
  - /api/monitoring/start|stop to drive the demo/live stream
        │
        ▼
WebSocket  (/ws/activity)
  - broadcasts activity_update / alert messages to all connected clients
        │
        ▼
React Dashboard  (frontend/)
  - Overview, Live Monitoring, Distribution, Timeline, CSI Visualization,
    Person Tracking, Alerts, History, Analytics, Settings
```

## Why One Shared Inference Path

`ml/inference.py`'s `ActivityPredictor` is imported by:
- `ml/train.py` (during evaluation, indirectly, via the same preprocessing)
- `backend/app/services/simulation.py` (demo mode)
- `backend/app/routers/predict.py` (`/api/predict`, for live/hardware use)

This means the accuracy numbers measured during training
(`models/evaluation_report.json`) are representative of what the API
actually returns at serving time — preprocessing cannot silently drift
between training and inference (this project initially had exactly that
bug — per-window vs. whole-stream normalization mismatch — and fixing it
is why both now share one code path).

## Component Responsibilities

| Component | Responsibility |
|---|---|
| `ml/` | Data loading, preprocessing, feature extraction, training, evaluation, inference |
| `backend/app/database.py` | SQLAlchemy engine/session, SQLite or PostgreSQL via `DATABASE_URL` |
| `backend/app/models.py` | ORM models: Person, ActivityEvent, Alert |
| `backend/app/routers/` | REST endpoints, grouped by concern |
| `backend/app/websocket_manager.py` | WebSocket connection registry + broadcast |
| `backend/app/services/simulation.py` | Demo-mode streaming loop (real held-out data through real model) |
| `frontend/src/` | Dashboard UI, WebSocket client, REST client |

## Deployment

`docker-compose.yml` wires three services: `postgres`, `backend`
(FastAPI + trained model, built from the project root so it can bundle
`ml/`, `dataset/`, `models/`), and `frontend` (static build served via
nginx, which reverse-proxies `/api` and `/ws` to the backend container).
