# Future Scope

## Real CSI Hardware Integration

The system is architected so real hardware only needs to call
`POST /api/predict` with a raw amplitude window — everything downstream
(model, DB, WebSocket, dashboard) is already live. Typical integration
path:

1. Flash a CSI-capable router/NIC (e.g. an ESP32 running the
   [ESP32-CSI-Tool](https://stevenmhernandez.github.io/ESP32-CSI-Tool/)
   firmware, or a Linux box with an Intel 5300/Atheros CSI patch) to
   extract per-packet CSI.
2. Buffer packets into windows matching training config (100 packets,
   64 subcarriers — see `models/model_meta.json`).
3. POST each window's amplitude matrix to `/api/predict`.
4. Optionally write directly to the `activity_events` table via the same
   backend, or let `/api/predict` remain the single source of truth and
   have your capture script poll/stream through it.

## Additional Activity Classes

Add real labeled data for "running" and "gesturing" (not included in
the current public dataset — see `docs/dataset.md`), drop the CSVs into
`dataset/raw/`, extend `LABEL_MAP` in `ml/preprocessing.py`, and re-run
training. No other code changes needed.

## Multi-Room / Multi-Person Localization

Current person tracking shows *relative* room position for illustrative
purposes only — it is not derived from a real localization algorithm.
Real localization would require either multiple CSI receivers (for
triangulation/AoA) or a trained regression model against a labeled
position dataset.

## Model Improvements

- Larger, multi-environment dataset (different rooms, routers, person
  builds) to test generalization beyond the single domain used here.
- Attention-based temporal models (Transformer encoder) as a fifth
  comparison candidate.
- On-device quantization for embedded deployment (e.g. Raspberry Pi at
  the edge, avoiding a network round-trip per window).

## Alerting

- SMS/push notification integration for fall alerts (currently DB +
  WebSocket only).
- Configurable per-person alert thresholds and quiet hours.

## Authentication & Multi-Tenancy

Current API has no auth layer — appropriate for a local/academic demo,
not for production. Add API keys or OAuth2 before any real deployment
with multiple households/tenants.
