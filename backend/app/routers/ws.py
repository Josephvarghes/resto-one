import json
import logging
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from app.ws.connection_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/{channel}")
async def websocket_endpoint(
    websocket: WebSocket,
    channel: str,
    token: Optional[str] = Query(None),
):
    await ws_manager.connect(websocket, channel)
    try:
        # Send initial connected acknowledgement
        await websocket.send_text(
            json.dumps({"event": "connected", "channel": channel, "status": "ok"})
        )
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                # Handle client ping
                if msg.get("action") == "ping":
                    await websocket.send_text(json.dumps({"event": "pong"}))
            except Exception:
                # Raw text or keepalive
                pass
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, channel)
    except Exception as e:
        logger.error(f"WebSocket error on channel {channel}: {e}")
        ws_manager.disconnect(websocket, channel)
