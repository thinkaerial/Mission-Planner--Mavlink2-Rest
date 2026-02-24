import asyncio
import json
from typing import Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.staticfiles import StaticFiles
import uvicorn
from mavsdk import System
from contextlib import asynccontextmanager
import time

APP_HOST = "0.0.0.0"
APP_PORT = 8000
MAVSDK_SERVER_ADDRESS = "127.0.0.1"
MAVSDK_SERVER_PORT = 50051  # must match mavsdk_server -p value

clients: Set[WebSocket] = set()


async def broadcast(msg: str):
    """Send telemetry to all connected WebSocket clients"""
    to_remove = []
    for ws in list(clients):
        try:
            await ws.send_text(msg)
        except Exception:
            to_remove.append(ws)
    for ws in to_remove:
        clients.discard(ws)


async def connect_and_stream():
    """Connect to MAVSDK server and start telemetry streaming"""
    while True:
        try:
            drone = System(mavsdk_server_address=MAVSDK_SERVER_ADDRESS,
                           port=MAVSDK_SERVER_PORT)
            print(f"[{time.strftime('%H:%M:%S')}] Connecting to mavsdk_server...")
            await drone.connect()

            async for conn in drone.core.connection_state():
                if conn.is_connected:
                    print("✅ System connected")
                    break

            async def pos_loop():
                async for p in drone.telemetry.position():
                    await broadcast(json.dumps({
                        "topic": "position",
                        "latitude": p.latitude_deg,
                        "longitude": p.longitude_deg,
                        "relative_alt_m": p.relative_altitude_m,
                        "absolute_alt_m": p.absolute_altitude_m
                    }))

            async def attitude_loop():
                async for a in drone.telemetry.attitude_euler():
                    await broadcast(json.dumps({
                        "topic": "attitude",
                        "roll_deg": a.roll_deg,
                        "pitch_deg": a.pitch_deg,
                        "yaw_deg": a.yaw_deg
                    }))

            async def velocity_loop():
                async for v in drone.telemetry.velocity_ned():
                    await broadcast(json.dumps({
                        "topic": "velocity_ned",
                        "north_m_s": v.north_m_s,
                        "east_m_s": v.east_m_s,
                        "down_m_s": v.down_m_s
                    }))

            async def battery_loop():
                async for b in drone.telemetry.battery():
                    await broadcast(json.dumps({
                        "topic": "battery",
                        "voltage_v": b.voltage_v,
                        "remaining_percent": b.remaining_percent
                    }))

            async def armed_loop():
                async for a in drone.telemetry.armed():
                    await broadcast(json.dumps({
                        "topic": "armed",
                        "armed": bool(a)
                    }))

            await asyncio.gather(
                pos_loop(), attitude_loop(),
                velocity_loop(), battery_loop(), armed_loop()
            )

        except Exception as e:
            print("⚠️ Error:", e)
            print("Retrying in 3s...")
            await asyncio.sleep(3)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI lifespan handler"""
    asyncio.create_task(connect_and_stream())
    yield
    print("🛑 Shutting down backend")


app = FastAPI(lifespan=lifespan)

# ------------------------------
# WebSocket endpoint first
# ------------------------------
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await ws.accept()
    clients.add(ws)
    print("🔗 Client connected:", len(clients))
    try:
        while True:
            await asyncio.sleep(3600)
    except WebSocketDisconnect:
        clients.discard(ws)
        print("❌ Client disconnected:", len(clients))


# ------------------------------
# Serve frontend on /static
# ------------------------------
# app.mount("/static", StaticFiles(directory="../frontend", html=True), name="frontend")


if __name__ == "__main__":
    uvicorn.run("telemetry_ws_server:app",
                host=APP_HOST, port=APP_PORT, log_level="info")
