# Teamwork Plan — OpenHer Studio

> Fase 2 (Project Orchestrator). Se activa tras la confirmación única del usuario.

## Tracks paralelos no colisionantes

| Track | Alcance | Archivos de propiedad (exclusiva) |
|---|---|---|
| A — Shell | Sección, rail, navegación, i18n | `web/src/features/studio/StudioView.tsx`, `.../useStudio.ts`, integraciones puntuales |
| B — Canvas | Preview, dev server, proxy | `web/src/features/studio/StudioCanvas.tsx` |
| C — Inspección | Overlay, anotaciones, chat scoped | `web/src/features/studio/StudioInspector.tsx`, `StudioChat.tsx` |
| D — OpenDesign | Generador embebido + handoff | `web/src/features/studio/StudioNew.tsx` |

Los archivos compartidos (`entities/*`, `ActivityBar`, `useSidebarPrefs`,
`useAppController`, `widgets/*`, `i18n/*`) se editan **secuencialmente** por el Orchestrator
o un único Worker designado, nunca por dos en paralelo.

## Hitos y puertas

### M1 — Shell de la sección
- Entregable: "Estudio" aparece en el rail (desktop), abre una vista vacía; móvil lo oculta.
- Verificación: `tsc` + tests de navegación existentes verdes; click en rail no rompe layout.
- Puertas: Critic (arquitectura/FSD, tipos), Challenger (rail oculto, prefs corruptas en
  localStorage), Auditor (salida real de `pnpm test`).

### M2 — Proyecto + Canvas
- Entregable: elegir carpeta → dev server o estático → preview en el canvas; persistencia.
- Verificación: tests de `useStudio` (selección de estrategia, fallback), prueba real de sirvido.
- Puertas: Challenger (carpeta inválida, sin package.json, dev server que no arranca, timeout).

### M3 — Inspección + Chat
- Entregable: picker/pod → anotaciones con `archivo:línea`; chat incluye `SELECTED ZONES`.
- Verificación: tests de `buildAnnotationsPrompt`/`formatSelectionForPrompt` (ya existen) +
  test de la integración en el Estudio; E2E manual desktop.
- Puertas: Challenger (HMR, badges huérfanos, 9 zonas, cross-origin), Auditor.

### M4 — Open Design handoff
- Entregable: pestaña "Nuevo" que embebe OpenDesign, detecta carpeta y abre en el Estudio.
- Verificación: test del detector de carpeta; prueba real con OpenDesign en `:3000`.
- Puertas: Challenger (OpenDesign apagado, timeout, carpeta sin artefacto), Auditor.

## Cierre
- Success Auditor: suite completa + flujo E2E de punta a punta.
- Relevo de Orchestrator entre M2 y M3 (context renewal) con `teamwork_progress.md`.
