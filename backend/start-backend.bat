@echo off
title Backend Server

echo ============================================
echo        STARTING BACKEND SERVER
echo ============================================

cd backend

echo Installing dependencies...
npm install

echo.
echo Starting server on port 3001...
node server.js

pause