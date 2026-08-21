# Sprint Plan — sprint-2026-w34 (17–23 ago 2026)

> Sprint de **adopción del método**: el trabajo ya venía en curso; este sprint
> formaliza el cierre de semana con backlog, DoD y retro por primera vez.

## Datos

| Campo | Valor |
|---|---|
| Sprint | w34 · 17–23 ago 2026 |
| Objetivo | "El input del chat es fluido y confiable: sin texto que se revierte ni lag al tipear" |
| Capacidad estimada | 9 pts |
| Comprometido | 9 pts |

## Historias comprometidas

| ID | Historia | Pts | Estado |
|---|---|---|---|
| PB-001 | QA composer en dispositivo (borrar/escribir sin revertirse) | 2 | done (código) / QA pendiente |
| PB-010 | Terminal desktop multi-tab tras fix TUI freeze | 2 | done |
| PB-005 | QuickChat streaming Groq end-to-end | 2 | todo |
| PB-006 | QuickChat indicador de caché + limpiar | 2 | todo |
| PB-011 | i18n claves quickchat completas | 1 | done |

## Trabajo realizado esta semana (evidencia git)

| Commit | Qué |
|---|---|
| `124e8ab8` | fix(composer): eco stale que revertía borrados + lag por re-render de App por keystroke; override determinístico del texto en send |
| `19bea276` | fix: IMessageCache Promise-based, SSE URL v2 por versión (no por path), leak de timer SSE |
| `cbd36518` | chore(dist): rebuild exe + purga 1.265 assets viejos (893/398→28) |
| `a790418b`, `f48633d0`, `fe0cfcd1`, `6db70328` | quickchat groq key reload, TUI freeze PTY persistente, kanban pestaña |

## Burndown

| Día | Restante ideal | Restante real |
|---|---|---|
| L (17) | 9 | 9 *(pre-adopción)* |
| M (18) | 7 | 7 *(pre-adopción)* |
| X (19) | 5 | 5 *(pre-adopción)* |
| J (20) | 3 | 2 |
| V (21) | 0 | 2 (PB-005/006 pasan a w35) |

## Riesgos

| Riesgo | Plan B |
|---|---|
| QA en dispositivo requiere APK nuevo → ciclo build largo | usar deploy-apk.ps1 -SkipBuild si el APK del día sirve |
| QuickChat depende de keys de terceros (Groq rate limits) | probar también Cerebras como fallback documentado |

## Cierre

- [ ] Review con DoD sobre PB-001/010/011
- [ ] Tag `sprint/w34-done`
- [ ] Retro w34 → retro.md
- [ ] PB-005/PB-006 quedan top del backlog para w35
