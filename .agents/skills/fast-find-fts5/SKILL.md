---
name: fast-find-fts5
description: Uso de fast-find con SQLite FTS5 para búsquedas instantáneas (<3ms) de archivos en Windows
---

# Fast-Find FTS5 File Locator

## 1. Buscar Archivo por Nombre o Patrón
```powershell
fast-find "<término>"
```
Retorna las rutas completas instantáneamente (<3ms).

## 2. Reindexar Rutas
```powershell
fast-find index "C:\" "G:\Proyectos"
```
