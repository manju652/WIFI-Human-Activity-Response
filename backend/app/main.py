import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .websocket_manager import manager
from .routers import health, people, analytics, predict, trigger, csi

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wifi-har")

app = FastAPI(
    title="Wi-Fi Based Human Activity Recognition and Real-Time Tracking System",
    description=(
        "AI-powered activity recognition from Wi-Fi CSI. Real ML pipeline "
        "(Random Forest / SVM / CNN / LSTM compared, best model selected). "
        "DEMO MODE replays real held-out CSI samples through the live model; "
        "no random or hardcoded predictions."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(people.router)
app.include_router(analytics.router)
app.include_router(predict.router)
app.include_router(trigger.router)
app.include_router(csi.router)


@app.on_event("startup")
def on_startup():
    init_db()
    logger.info("Database initialized. Wi-Fi HAR backend ready.")


@app.websocket("/ws/activity")
async def websocket_activity(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection open; clients don't need to send anything,
            # but we read to detect disconnects promptly.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
