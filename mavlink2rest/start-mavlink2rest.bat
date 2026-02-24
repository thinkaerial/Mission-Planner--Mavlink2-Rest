@echo off
title MAVLink2REST Launcher

echo ============================================
echo        MAVLink2REST START SCRIPT
echo ============================================

set /p COMPORT=Enter COM Port (example COM5): 
set /p BAUDRATE=Enter Baud Rate (example 57600): 

echo.
echo Starting MAVLink2REST on %COMPORT% at %BAUDRATE%...
echo.

mavlink2rest-x86_64-pc-windows-msvc.exe -c serial:%COMPORT%:%BAUDRATE%

pause