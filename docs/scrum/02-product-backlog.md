# Product Backlog — OpenHer

Ordenado por valor. El PO (sombrero) reordena en el refinement de los miércoles.
Puntos según `05-metricas.md`. Estado: `todo` / `doing` / `done` / `blocked`.

## Épicas

| ID | Épica | Descripción |
|---|---|---|
| A | Arquitectura FSD+Hexagonal | Completar migración: desmontar `App.tsx` (3.7k), split `shellPanels.tsx` (2.2k), routers reales en `api.rs` (1.2k) |
| B | Quick Chat standalone | Chat tipo ChatGPT con Cerebras/Groq/opencode-go: streaming, cache 24h, búsqueda DDG, QA en APK |
| C | Estabilidad chat/streaming | Composer fluido, SSE sin delays, watchdog, modos de datos (full/saver/ultra/miser) |
| D | Desktop shell | Terminal multi-tab estable (PTY persistente), kanban como pestaña, stats embebido |
| E | Pipeline & distribución | deploy-apk.ps1 confiable, changelog, preparación Play Store |
| F | Calidad & tests | Suite vitest (1065+), tests de integración chat, cobertura entities/shared |

## Historias (top del backlog)

| ID | Historia | Épica | Pts | Prioridad | Estado |
|---|---|---|---|---|---|
| PB-001 | Como usuario: quiero escribir y borrar en el composer del APK sin lag ni texto que se revierte (QA real del fix del eco stale) | C | 2 | Alta | todo |
| PB-002 | Migrar grid desktop + ShellPanelCell desde App.tsx → pages/desktop-workspace | A | 8 | Media | todo |
| PB-003 | Split shellPanels.tsx en TerminalPanel / ExplorerPanel / FileEditorPanel (<400 líneas c/u) | A | 5 | Media | todo |
| PB-004 | Extraer fs_router.rs REAL desde api.rs (15 rutas /shell/fs/*) montado en main.rs | A | 5 | Media | todo |
| PB-005 | QuickChat: verificar streaming Groq end-to-end en APK (delta a delta visible) | B | 2 | Alta | todo |
| PB-006 | QuickChat: indicador visual de caché (24h) + botón limpiar conversación cacheada | B | 2 | Media | todo |
| PB-007 | Telemetría de reconexiones SSE visible en modo debug (contador + último evento) | C | 3 | Baja | todo |
| PB-008 | Tests de integración del flujo chat: send → SSE → rendered messages (mock server) | F | 5 | Media | todo |
| PB-009 | deploy-apk.ps1: validar link tmpfiles.org + generar changelog desde commits del sprint | E | 2 | Baja | todo |
| PB-010 | Terminal desktop: QA multi-tab + split tras fix TUI freeze (PTY persiste al ocultar) | D | 2 | Alta | todo |
| PB-011 | i18n: auditar claves quickchat nuevas completas en/en (it/zh caen por fallback) | F | 1 | Media | todo |
| PB-012 | Actualizar architecture.md con features nuevas (quickchat, FSD) — CATALOGO.md eliminado, consolidado en architecture.md | E | 2 | Baja | todo |

## Backlog frío (sin priorizar todavía)

- Editor de archivos desktop: tabs persistentes entre sesiones (D)
- Stats: vista de límites de uso por modelo en la app (D)
- Offline queue: replay de prompts con confirmación visual (C)
- Tema claro auditado con check:contrast en todas las pantallas nuevas (F)
- iOS: explorar Capacitor build (E)

## Reglas del backlog

- Historia > 5 pts → partir antes del planning.
- Toda historia nueva entra por abajo; el PO la sube si corresponde.
- Lo "done" se mueve al final de este archivo con sprint que lo cerró:
  `PB-xxx ✅ w34`.
