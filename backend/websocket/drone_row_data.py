import asyncio
import json
import time
from typing import Set, Dict, Any
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from mavsdk import System
from contextlib import asynccontextmanager

APP_HOST = "0.0.0.0"
APP_PORT = 8000
MAVSDK_SERVER_ADDRESS = "localhost"
MAVSDK_SERVER_PORT = 50051

clients: Set[WebSocket] = set()

# Shared telemetry state
telemetry_data: Dict[str, Any] = {
    "raw_sensors": {},
    "processed": {},
    "control_outputs": {},
    "health": {},
    "developer": {}
}

# Safe serializer to convert enums and custom objects to strings
def safe_serialize(obj):
    if isinstance(obj, (str, int, float, bool)) or obj is None:
        return obj
    try:
        return str(obj)
    except Exception:
        return None

# Broadcast helper
async def broadcast(msg: str):
    to_remove = []
    for ws in list(clients):
        try:
            await ws.send_text(msg)
        except:
            to_remove.append(ws)
    for ws in to_remove:
        clients.discard(ws)

# Connect to MAVSDK and stream telemetry
async def connect_and_stream():
    while True:
        try:
            drone = System(mavsdk_server_address=MAVSDK_SERVER_ADDRESS,
                           port=MAVSDK_SERVER_PORT)
            print(f"[{time.strftime('%H:%M:%S')}] Connecting to MAVSDK server...")
            await drone.connect()

            async for conn in drone.core.connection_state():
                if conn.is_connected:
                    print("✅ System connected")
                    break

            # ------------------------------
            # Telemetry loops
            # ------------------------------
            async def position_loop():
                async for p in drone.telemetry.position():
                    telemetry_data["processed"]["position"] = {
                        "latitude": p.latitude_deg,
                        "longitude": p.longitude_deg,
                        "relative_alt_m": p.relative_altitude_m,
                        "absolute_alt_m": p.absolute_altitude_m
                    }
                    await broadcast(json.dumps({
                        "topic": "position",
                        **{k: safe_serialize(v) for k, v in telemetry_data["processed"]["position"].items()}
                    }))

            async def attitude_loop():
                async for a in drone.telemetry.attitude_euler():
                    telemetry_data["processed"]["attitude_euler"] = {
                        "roll_deg": a.roll_deg,
                        "pitch_deg": a.pitch_deg,
                        "yaw_deg": a.yaw_deg
                    }
                    await broadcast(json.dumps({
                        "topic": "attitude_euler",
                        **{k: safe_serialize(v) for k, v in telemetry_data["processed"]["attitude_euler"].items()}
                    }))

            async def attitude_quaternion_loop():
                async for q in drone.telemetry.attitude_quaternion():
                    telemetry_data["processed"]["attitude_quaternion"] = {
                        "w": q.w, "x": q.x, "y": q.y, "z": q.z
                    }
                    await broadcast(json.dumps({
                        "topic": "attitude_quaternion",
                        **{k: safe_serialize(v) for k, v in telemetry_data["processed"]["attitude_quaternion"].items()}
                    }))

            async def velocity_loop():
                async for v in drone.telemetry.velocity_ned():
                    telemetry_data["raw_sensors"]["velocity_ned"] = {
                        "north_m_s": v.north_m_s,
                        "east_m_s": v.east_m_s,
                        "down_m_s": v.down_m_s
                    }
                    await broadcast(json.dumps({
                        "topic": "velocity_ned",
                        **{k: safe_serialize(vv) for k, vv in telemetry_data["raw_sensors"]["velocity_ned"].items()}
                    }))

            async def battery_loop():
                async for b in drone.telemetry.battery():
                    telemetry_data["health"]["battery"] = {
                        "voltage_v": b.voltage_v,
                        "remaining_percent": b.remaining_percent
                    }
                    await broadcast(json.dumps({
                        "topic": "battery",
                        **{k: safe_serialize(vv) for k, vv in telemetry_data["health"]["battery"].items()}
                    }))

            async def armed_loop():
                async for a in drone.telemetry.armed():
                    telemetry_data["control_outputs"]["armed"] = {"armed": bool(a)}
                    await broadcast(json.dumps({
                        "topic": "armed",
                        "armed": bool(a)
                    }))

            async def flight_mode_loop():
                async for m in drone.telemetry.flight_mode():
                    telemetry_data["control_outputs"]["flight_mode"] = {"mode": safe_serialize(m)}
                    await broadcast(json.dumps({
                        "topic": "flight_mode",
                        "mode": safe_serialize(m)
                    }))

            async def gps_loop():
                async for g in drone.telemetry.gps_info():
                    telemetry_data["health"]["gps"] = {
                        "num_satellites": g.num_satellites,
                        "fix_type": safe_serialize(g.fix_type)
                    }
                    await broadcast(json.dumps({
                        "topic": "gps_info",
                        **{k: safe_serialize(vv) for k, vv in telemetry_data["health"]["gps"].items()}
                    }))

            async def health_loop():
                async for h in drone.telemetry.health():
                    telemetry_data["health"]["system"] = {
                        "gyrometer_calibration_ok": h.is_gyrometer_calibration_ok,
                        "accelerometer_calibration_ok": h.is_accelerometer_calibration_ok,
                        "magnetometer_calibration_ok": h.is_magnetometer_calibration_ok,
                        "global_position_ok": h.is_global_position_ok,
                        "home_position_ok": h.is_home_position_ok
                    }
                    await broadcast(json.dumps({
                        "topic": "health",
                        **{k: safe_serialize(vv) for k, vv in telemetry_data["health"]["system"].items()}
                    }))

            async def rc_loop():
                async for rc in drone.telemetry.rc_status():
                    telemetry_data["developer"]["rc"] = {
                        "is_available": getattr(rc, "is_available", None),
                        "is_valid": getattr(rc, "is_valid", None)
                    }
                    await broadcast(json.dumps({
                        "topic": "rc_status",
                        **{k: safe_serialize(vv) for k, vv in telemetry_data["developer"]["rc"].items()}
                    }))

            async def mission_loop():
                async for m in drone.mission.mission_progress():
                    telemetry_data["developer"]["mission_progress"] = {
                        "current": m.current,
                        "total": m.total
                    }
                    await broadcast(json.dumps({
                        "topic": "mission_progress",
                        **{k: safe_serialize(vv) for k, vv in telemetry_data["developer"]["mission_progress"].items()}
                    }))

            # Run all loops concurrently
            await asyncio.gather(
                position_loop(), attitude_loop(), attitude_quaternion_loop(),
                velocity_loop(), battery_loop(),
                armed_loop(), flight_mode_loop(),
                gps_loop(), health_loop(),
                rc_loop(), mission_loop()
            )

        except Exception as e:
            print("⚠️ Error:", e)
            await asyncio.sleep(3)

# FastAPI lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(connect_and_stream())
    yield
    print("🛑 Shutting down backend")

app = FastAPI(lifespan=lifespan)

# WebSocket endpoint
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

# REST endpoints with safe serialization
def serialize_dict(d):
    if isinstance(d, dict):
        return {k: serialize_dict(v) for k, v in d.items()}
    elif isinstance(d, list):
        return [serialize_dict(x) for x in d]
    elif isinstance(d, (str, int, float, bool)) or d is None:
        return d
    else:
        return str(d)

@app.get("/api/raw")
async def get_raw():
    return JSONResponse(serialize_dict(telemetry_data["raw_sensors"]))

@app.get("/api/processed")
async def get_processed():
    return JSONResponse(serialize_dict(telemetry_data["processed"]))

@app.get("/api/control")
async def get_control():
    return JSONResponse(serialize_dict(telemetry_data["control_outputs"]))

@app.get("/api/health")
async def get_health():
    return JSONResponse(serialize_dict(telemetry_data["health"]))

@app.get("/api/developer")
async def get_developer():
    return JSONResponse(serialize_dict(telemetry_data["developer"]))

@app.get("/api/all")
async def get_all():
    return JSONResponse(serialize_dict(telemetry_data))

# Serve frontend (optional)
# app.mount("/static", StaticFiles(directory="../frontend", html=True), name="frontend")

# Run server
if __name__ == "__main__":
    uvicorn.run("drone_row_data:app", host=APP_HOST, port=APP_PORT, log_level="info")
