import json
import logging
from fastapi import WebSocket

logger = logging.getLogger("wifi-har.websocket")


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"Client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead = []
        for conn in self.active_connections:
            try:
                await conn.send_text(json.dumps(message, default=str))
            except Exception:
                dead.append(conn)
        for d in dead:
            self.disconnect(d)

    @property
    def count(self) -> int:
        return len(self.active_connections)


manager = ConnectionManager()
