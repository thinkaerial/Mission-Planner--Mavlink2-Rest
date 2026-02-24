@echo off
title React Frontend

echo ============================================
echo        STARTING FRONTEND
echo ============================================

cd frontend

echo Installing dependencies...
npm install

echo.
echo Starting React Dev Server...
npm run dev

pause