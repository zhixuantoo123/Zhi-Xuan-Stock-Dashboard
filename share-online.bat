@echo off
title AlphaTerminal Pro - Online Share Tunnel
color 0b
echo ===============================================================================
echo     ALPHATERMINAL PRO - SECURE PUBLIC INTERNET ACCESS
echo ===============================================================================
echo.
echo Checking local dashboard server...
powershell -Command "try { $r = (Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 2).StatusCode; Write-Host '[OK] Dashboard server is running on port 3000.' -ForegroundColor Green } catch { Write-Host '[!] Starting local server...' -ForegroundColor Yellow; Start-Process powershell.exe -ArgumentList '-ExecutionPolicy Bypass -NoProfile -File \"%~dp0server.ps1\" -Port 3000' -WindowStyle Hidden; Start-Sleep -Seconds 2 }"

echo.
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0share-online.ps1"

pause
