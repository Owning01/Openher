# Scrum Solo — OpenCode Mobile

Metodología Scrum adaptada a un equipo de **1 persona**, aplicada a este monorepo
(`web/` React+Capacitor · `desktop-app/` Rust · `opencode-stats/` · `od-web/`).

## Índice

| Archivo | Qué contiene |
|---|---|
| [01-guia-solo-scrum.md](01-guia-solo-scrum.md) | El framework completo: roles como sombreros, eventos, artefactos |
| [02-product-backlog.md](02-product-backlog.md) | Backlog priorizado con épicas e historias reales del proyecto |
| [03-definicion-done.md](03-definicion-done.md) | DoD técnica (comandos exactos de validación del repo) |
| [04-definicion-ready.md](04-definicion-ready.md) | DoR: cuándo una historia entra a sprint |
| [05-metricas.md](05-metricas.md) | Definición de puntos, velocity, burndown |
| [06-roadmap.md](06-roadmap.md) | Releases y metas por trimestre |
| [sprints/](sprints/) | Un subdirectorio por sprint (plan + daily log + retro) |
| [plantillas/](plantillas/) | Plantillas de historia de usuario y bug |

## Flujo semanal (resumen)

| Día | Momento | Evento | Duración |
|---|---|---|---|
| Lunes | Mañana | Sprint Planning | 30 min |
| Mar–Jue | Inicio del día | Daily (log escrito) | 5 min |
| Miércoles | Cualquier hora | Refinement del backlog | 20 min |
| Viernes | Tarde | Review (checklist + prueba real) | 20 min |
| Viernes | Después del review | Retrospectiva | 15 min |

## Arranque rápido

1. Leér `01-guia-solo-scrum.md` una sola vez.
2. Copiar `sprints/_template-*` a `sprints/sprint-<año>-w<n>/`.
3. Lunes: elegir historias de `02-product-backlog.md`, llenar el plan, y a trabajar.
4. Viernes: correr checklist de `03-definicion-done.md`, taggear `sprint/w<n>-done`, retro, push.

## Convenciones

- Tag de cierre de sprint: `git tag sprint/w<N>-done && git push --tags`
- El incremento vivo siempre está en `origin/main` verde (`tsc` + `vitest` + `cargo check`).
- Tablero visual opcional: el panel **Kanban** de la propia app desktop sirve como sprint board.
