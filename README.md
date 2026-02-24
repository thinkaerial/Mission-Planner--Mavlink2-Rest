ThinkAerial Mission Planner

A full-stack Web-Based Ground Control Station (GCS) for: Mission Planning,Live Telemetry Monitoring, Mission Saving (MongoDB), MAVLink Drone Control

Built Using MongoDB, Express.js, React (Vite), Node.js, mavlink2rest (MAVLink Bridge)

Project Structure:
ThinkAerial-Mission-Architecture/
│
├── backend/ → Node.js API (Auth, Mission Storage)
├── frontend/ → React Web Application (UI)
├── mavlink2rest/ → MAVLink to REST bridge
└── README.md

System Architecture:
Pixhawk / SITL
│
│ MAVLink (UDP or Serial)
▼
mavlink2rest (Port 8088)
│
│ REST API
▼
Backend (Port 5000)
│
│ HTTP
▼
Frontend (Port 5173)
🔧 Prerequisites

Before starting, install:

1️⃣ Node.js

Version 16 or higher
https://nodejs.org

2️⃣ MongoDB

Choose one:

Local MongoDB

MongoDB Atlas (Cloud)

https://www.mongodb.com/atlas

3️⃣ Drone Source

Either:

✅ Real Pixhawk via Telemetry / USB

✅ ArduPilot SITL

✅ PX4 SITL

🚀 FULL STEP-BY-STEP SETUP GUIDE

You must open 3 separate terminal windows.

🟦 STEP 1 — Start Backend

Navigate to backend folder:

cd backend

Install dependencies:

npm install

Create .env file inside backend folder:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key

Replace:

MONGO_URI with your MongoDB URL

Start backend:

npm run dev

Expected output:

[Node Backend] Server running on port 5000
MongoDB Connected
🟦 STEP 2 — Start Frontend

Open a new terminal:

cd frontend
npm install

Create .env file inside frontend (if using MapTiler):

VITE_MAPTILER_API_KEY=your_api_key_here

Start frontend:

npm run dev

Open browser:

http://localhost:5173
🟦 STEP 3 — Start MAVLink Bridge (mavlink2rest)

Open another terminal:

cd mavlink2rest
🟢 OPTION A — Simulator (SITL / UDP)

If using ArduPilot or PX4 simulator:

.\mavlink2rest-x86_64-pc-windows-msvc.exe -c "udpin:0.0.0.0:14550"
🔵 OPTION B — Real Drone (USB / Telemetry Radio)

Replace COM5 and 57600 with your actual values:

.\mavlink2rest-x86_64-pc-windows-msvc.exe -c "serial:COM5:57600"

If successful:

Server running: http://0.0.0.0:8088

Test in browser:

http://localhost:8088/v1/mavlink

If JSON appears → connection successful ✅

🎮 HOW TO USE THE APPLICATION
🟢 1️⃣ Login / Register

Open frontend

Create account

Login

🟢 2️⃣ Telemetry Dashboard

If mavlink2rest is running:

Drone status → Connected

Live altitude

Speed

Yaw

Battery

🟢 3️⃣ Mission Planning

Go to Mission Planner

Draw polygon on map

Click Generate Mission

Adjust:

Altitude

Lead-in

Overshoot

Save mission

🟢 4️⃣ Export Mission

Click Export

Downloads:

MissionName.waypoints

Compatible with:

Mission Planner

QGroundControl

📡 MAVLink Commands Used
Command ID Purpose
MAV_CMD_COMPONENT_ARM_DISARM 400 Arm / Disarm
MAV_CMD_NAV_TAKEOFF 22 Takeoff
MAV_CMD_DO_SET_CAM_TRIGG_DIST 206 Camera Trigger
MAV_CMD_NAV_RETURN_TO_LAUNCH 20 RTL
MAV_CMD_NAV_WAYPOINT 16 Waypoint
🔌 Ports Used
Service Port
Frontend 5173
Backend 5000
MAVLink2REST 8088
MAVLink UDP 14550
🛠 Troubleshooting Guide
❌ Telemetry Not Showing

Check:

Is mavlink2rest running?

Is drone sending data?

Is frontend using:

http://localhost:8088/v1/mavlink
❌ Database Not Connecting

Check MONGO_URI

Ensure MongoDB is running

❌ Port Already In Use

Close:

Mission Planner

QGroundControl

Other MAVLink software

Only one app can use the COM port at a time.

🧪 Development Mode vs Production
Development

Frontend → 5173

Backend → 5000

Production

Build React:

npm run build

Serve static files from backend.

✅ IMPORTANT START ORDER

Always start in this order:

1️⃣ MAVLink2REST
2️⃣ Backend
3️⃣ Frontend
