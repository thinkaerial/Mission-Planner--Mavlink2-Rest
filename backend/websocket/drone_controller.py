import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mavsdk import System
from pydantic import BaseModel
from typing import List, Set, Dict, Any
from contextlib import asynccontextmanager

# --- Models ---
class Waypoint(BaseModel):
    latitude: float
    longitude: float
    relative_altitude: float

class MissionRequest(BaseModel):
    waypoints: List[Waypoint]

# --- Global State ---
drone = System()
clients: Set[WebSocket] = set()
telemetry_data: Dict[str, Any] = {"position": {}, "battery": {}, "armed": False, "flight_mode": ""}

async def broadcast(data: dict):
    msg = json.dumps(data)
    to_remove = []
    for ws in list(clients):
        try:
            await ws.send_text(msg)
        except:
            to_remove.append(ws)
    for ws in to_remove: clients.discard(ws)

async def stream_telemetry():
    """Background task to fetch data from Drone and broadcast to WebSockets"""
    async def pos_loop():
        async for p in drone.telemetry.position():
            telemetry_data["position"] = {"lat": p.latitude_deg, "lon": p.longitude_deg, "alt": p.relative_altitude_m}
            await broadcast({"topic": "position", **telemetry_data["position"]})

    async def battery_loop():
        async for b in drone.telemetry.battery():
            await broadcast({"topic": "battery", "voltage": b.voltage_v, "percent": b.remaining_percent})

    async def armed_loop():
        async for a in drone.telemetry.armed():
            await broadcast({"topic": "armed", "armed": bool(a)})

    try:
        await asyncio.gather(pos_loop(), battery_loop(), armed_loop())
    except Exception as e:
        print(f"Telemetry Error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Connecting to Drone...")
    await drone.connect(system_address="udp://:14540") # Update connection string if needed
    asyncio.create_task(stream_telemetry())
    yield
    print("Shutting down...")

app = FastAPI(lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    try:
        while True: await asyncio.sleep(3600)
    except WebSocketDisconnect:
        clients.discard(ws)

@app.post("/mission/takeoff")
async def takeoff():
    await drone.action.arm()
    await drone.action.takeoff()
    return {"status": "success"}

@app.post("/mission/land")
async def land():
    await drone.action.land()
    return {"status": "success"}

@app.post("/mission/upload")
async def upload(req: MissionRequest):
    # Logic for MAVSDK mission upload here
    return {"status": "uploaded", "count": len(req.waypoints)}