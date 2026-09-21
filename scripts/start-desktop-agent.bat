@echo off
REM OpenHer Desktop Agent — escritorio remoto para OpenHer.
REM Config: desktop-agent\desktop-agent.json (port / username / password)
cd /d "%~dp0..\desktop-agent"
start "" desktop-agent.exe
