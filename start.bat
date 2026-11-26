@echo off
title AI Trading Dashboard Terminal
echo ===================================================
echo     AI Trading Dashboard - Bloomberg Terminal Edition
echo ===================================================
echo Starting high-performance local server...
start /b powershell.exe -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 3000
timeout /t 2 /nobreak >nul
echo Opening dashboard in default web browser...
start http://localhost:3000
echo.
echo Server is running at:
echo   - Local PC:       http://localhost:3000
echo   - Home Wi-Fi:     http://10.122.1.5:3000
echo.
echo To access this dashboard online from any mobile phone or external PC:
echo   Run "share-online.bat" to generate an instant, encrypted HTTPS public URL!
echo.
echo You can keep this window open or close it when done.
pause
