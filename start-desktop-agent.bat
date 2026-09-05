@echo off
REM OpenCode Desktop Agent — escritorio remoto para OpenHer.
REM Config: desktop-agent\desktop-agent.json (port / username / password)
cd /d "%~dp0desktop-agent"
start "" desktop-agent.exe
