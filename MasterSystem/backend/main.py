from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import asyncio
from backend.core.event_bus import bus, Event, EventType

# Import Modules to self-register
import backend.modules.voice
import backend.modules.vision
import backend.modules.brain

app = FastAPI(title="MASTER SYSTEM Logic Core")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global WebSocket Manager
connected_websockets = set()

@app.on_event("startup")
async def startup_event():
    logger.info("MASTER SYSTEM Core Starting...")
    # Subscribe global WS broadcaster to everything? Or specific events?
    # Let's subscribe to RESPONSE_GENERATED and STATUS updates
    bus.subscribe(EventType.RESPONSE_GENERATED, broadcast_event)
    bus.subscribe(EventType.VOICE_COMMAND_DETECTED, broadcast_event)
    bus.subscribe(EventType.TTS_SPEAKING_START, broadcast_event)
    bus.subscribe(EventType.TTS_SPEAKING_END, broadcast_event)
    bus.subscribe(EventType.USER_IDENTIFIED, broadcast_event)
    
    await bus.publish(Event(EventType.SYSTEM_STARTUP))

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("MASTER SYSTEM Core Shutting Down...")
    await bus.publish(Event(EventType.SYSTEM_SHUTDOWN))

async def broadcast_event(event: Event):
    # Send event data to all connected clients
    message = f"{event.type.value}|{event.data}"
    to_remove = set()
    for ws in connected_websockets:
        try:
            await ws.send_text(message)
        except Exception:
            to_remove.add(ws)
    for ws in to_remove:
        connected_websockets.remove(ws)

@app.get("/")
async def health_check():
    return {"status": "online", "system": "MASTER SYSTEM"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_websockets.add(websocket)
    logger.info("Frontend connected via WebSocket")
    try:
        while True:
            data = await websocket.receive_text()
            # If frontend sends "ping", we can pong
            pass
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected")
        connected_websockets.remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        if websocket in connected_websockets:
            connected_websockets.remove(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=False) # Reload false better for threads

