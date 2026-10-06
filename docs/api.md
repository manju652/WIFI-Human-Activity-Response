# API Documentation

Base URL (local dev): `http://localhost:8000`

## REST Endpoints

### `GET /api/health`
Liveness check. Returns `{"status": "ok", "service": "..."}`.

### `GET /api/status`
System status snapshot.
```json
{
  "monitoring_active": true,
  "mode": "demo",
  "connected_clients": 2,
  "model_in_use": "cnn",
  "people_tracked": 3,
  "total_events": 142,
  "total_alerts": 2
}
```

### `GET /api/people`
Current snapshot of every tracked person (id, activity, confidence,
position, last seen).

### `GET /api/activities`
Same shape as `/api/people` — current-activity snapshot, used by the
Live Monitoring panel.

### `GET /api/activity-history?person_id=&activity=&limit=100`
Historical activity events, filterable, newest first.

### `GET /api/statistics`
Aggregate stats: activity distribution, total events/falls, average
confidence, people count.

### `GET /api/alerts?resolved=&limit=50`
Alert list, optionally filtered by resolved status.

### `POST /api/alerts/{id}/resolve`
Marks an alert resolved.

### `POST /api/predict`
Run the trained model on a raw CSI amplitude window.
```json
// request
{
  "person_id": "P001",
  "amplitude": [[/* 64 floats */], /* ... T rows, T >= 10 */]
}
// response
{
  "person_id": "P001",
  "activity": "walking",
  "confidence": 0.94,
  "model_used": "cnn",
  "timestamp": "2026-08-12T10:30:00"
}
```
This is the endpoint real CSI hardware should call once integrated (see
`docs/architecture.md` and the hardware note in the README).

### `POST /api/monitoring/start`
```json
{ "mode": "demo", "interval_seconds": 1.5 }
```
Starts the demo/live streaming loop. `mode: "demo"` replays real
held-out CSI windows through the real model (see `docs/dataset.md`).
`mode: "live"` is a labeling flag for events written while a real
hardware feed is calling `/api/predict` directly — the monitoring loop
itself only drives demo mode.

### `POST /api/monitoring/stop`
Stops the demo streaming loop.

### `GET /api/trigger/activities`
Returns the list of activities that can be instantly triggered — only
the classes the model was actually trained on:
`["empty", "sit", "stand", "walk", "fall"]`.

### `POST /api/trigger`
Powers the dashboard's **Instant Action Trigger** buttons. Picks a real
held-out CSI window that is genuinely labeled as the requested activity,
runs it through the real trained model, and persists/broadcasts the
result — same response shape as a WebSocket `activity_update`/`alert`
message, plus a `triggered_as` field showing the requested (true) label.
```json
// request
{ "person_id": "P001", "activity": "fall" }
// response
{
  "type": "alert",
  "person_id": "P001",
  "activity": "fall",
  "confidence": 0.9872,
  "model_used": "cnn",
  "triggered_as": "fall",
  "position": { "x": 35.8, "y": 82.2 },
  "timestamp": "2026-08-14T09:17:36",
  "is_demo": true,
  "alert": { "id": 1, "person_id": "P001", "alert_type": "fall_detected", "confidence": 0.9872, "timestamp": "..." }
}
```
Note: `activity` in the response is whatever the model actually
predicted for that real window — it is not forced to equal
`triggered_as`. They usually match (the model is accurate) but a
mismatch is possible and is left visible, not hidden, in the UI.

### `GET /api/csi-sample?activity=`
Returns a real CSI window (denoised amplitude, not fabricated) plus a
real FFT computed from it — powers the CSI Visualization panel's
waveform, spectrum, and waterfall charts honestly. If `activity` is
given, the returned sample is genuinely labeled as that class.
```json
{
  "true_label": "walk",
  "window_size": 100,
  "n_subcarriers": 64,
  "traces": { "sc_0": [/* 100 real amplitude values */], "...": [] },
  "fft_magnitude": [/* real FFT magnitude bins */],
  "fft_freq": [/* corresponding frequency bins, normalized units */],
  "waterfall": [/* [40][64] real amplitude, time-binned */]
}
```

## WebSocket

### `/ws/activity`
Broadcasts JSON messages to all connected clients as new predictions
happen:
```json
{
  "type": "activity_update",
  "person_id": "P001",
  "activity": "walking",
  "confidence": 0.94,
  "model_used": "cnn",
  "position": { "x": 41.2, "y": 63.5 },
  "timestamp": "2026-08-12T10:30:00",
  "is_demo": true
}
```
Fall events include an additional `"type": "alert"` and `"alert"` object
with the persisted alert id.
