import asyncio
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from mavsdk import System
from contextlib import asynccontextmanager

# ------------------------------
# Drone system
# ------------------------------
drone = System()

# ------------------------------
# Models
# ------------------------------
class TakeoffRequest(BaseModel):
    altitude: float = 5.0

class LandRequest(BaseModel):
    pass

class Waypoint(BaseModel):
    latitude: float
    longitude: float
    relative_altitude: float

class MissionRequest(BaseModel):
    waypoints: List[Waypoint]

# ------------------------------
# FastAPI lifespan handler
# ------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🔌 Connecting to MAVSDK drone...")
    await drone.connect()
    print("✅ Drone connected for missions")
    yield
    print("🛑 Backend shutting down")

app = FastAPI(lifespan=lifespan)

# ------------------------------
# Mission POST endpoints
# ------------------------------

@app.post("/mission/takeoff")
async def takeoff(req: TakeoffRequest):
    try:
        await drone.action.arm()
        await drone.action.takeoff()
        # Optional: wait for altitude to be reached
        await asyncio.sleep(req.altitude)
        return {"status": "success", "message": f"Takeoff initiated to {req.altitude} meters"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mission/land")
async def land(req: LandRequest):
    try:
        await drone.action.land()
        return {"status": "success", "message": "Landing initiated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mission/upload")
async def upload_mission(req: MissionRequest):
    try:
        mission_items = []
        for wp in req.waypoints:
            mission_items.append({
                "latitude_deg": wp.latitude,
                "longitude_deg": wp.longitude,
                "relative_altitude_m": wp.relative_altitude,
                "speed_m_s": 5.0,
                "fly_through": False
            })
        await drone.mission.upload_mission(mission_items)
        return {"status": "success", "message": f"Mission with {len(mission_items)} waypoints uploaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mission/start")
async def start_mission():
    try:
        await drone.mission.start_mission()
        return {"status": "success", "message": "Mission started"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mission/pause")
async def pause_mission():
    try:
        await drone.mission.pause_mission()
        return {"status": "success", "message": "Mission paused"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/mission/clear")
async def clear_mission():
    try:
        await drone.mission.clear_mission()
        return {"status": "success", "message": "Mission cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
