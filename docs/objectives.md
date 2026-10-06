# Objectives

1. Build a real, trained ML pipeline that classifies human activity from
   Wi-Fi CSI amplitude data — no hardcoded or randomly generated
   predictions anywhere in the serving path.
2. Compare multiple model families (Random Forest, SVM, CNN, LSTM) on the
   same real dataset and objectively select the best performer by
   held-out test F1-score.
3. Expose the trained model through a FastAPI backend with a documented
   REST + WebSocket API suitable for both offline testing and future
   real-hardware integration.
4. Persist activity events, tracked people, and alerts in a relational
   database (PostgreSQL in production, SQLite for local development).
5. Detect falls specifically and raise high-priority alerts with fall
   confidence and timestamp.
6. Provide a real-time, professional dashboard (React + TypeScript) that
   visualizes live activity, historical trends, and system health.
7. Clearly separate what is **real model inference on real data**,
   **DEMO MODE** (real held-out data replayed through the real model),
   and **future real-CSI-hardware integration** — never blur the three.
8. Document the system thoroughly enough that another engineer could
   reproduce training, run the stack, and extend it with real hardware.
