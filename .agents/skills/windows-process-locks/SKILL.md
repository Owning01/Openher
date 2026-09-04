---
name: windows-process-locks
description: Procedimientos para diagnosticar y liberar bloqueos de puertos y archivos EPERM en Windows
---

# Windows Process Locks & Port Clearance

## 1. Liberar Puerto 4096 (Servidor OpenCode)
```powershell
Get-NetTCPConnection -LocalPort 4096 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```

## 2. Detener Procesos Bloqueantes (opencode / opencode3-jit)
```powershell
Get-Process opencode3, opencode3-jit -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
```

## 3. Eliminar Bloqueos de Git (.git/index.lock)
```powershell
Get-Process git -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Remove-Item -Force ".git/index.lock" -ErrorAction SilentlyContinue
```
