# Teamwork Brief — OpenHer Studio

> Fase 1 (Sentinel) · "Especificá Qué, no Cómo". Un solo artefacto revisable.
> Confirmación única del usuario antes de desplegar el swarm (Fase 2).

## 0. Identificación

| Campo | Valor |
|---|---|
| Proyecto | OpenHer Studio (sección de diseño visual dentro de OpenHer) |
| Repo | `G:\Proyectos\opencode-remote-android` (feature in-repo, FSD) |
| Modo de integridad | **`development`** (default) |
| Plataforma objetivo | Desktop primero (WebView nativo + dev server local) |
| Estado | Awaiting single approval |

## 1. Objetivo & Audiencia

Construir una **sección propia de primer nivel ("Estudio")** dentro de OpenHer donde el
usuario puede: (a) empezar un proyecto web (generándolo con Open Design embebido o abriendo
una carpeta existente), (b) verlo renderizado en un canvas con un overlay de selección visual,
y (c) pedir cambios al agente de OpenCode sobre las zonas seleccionadas, atadas a
`archivo:línea` cuando el build es dev. Uso: el propio desarrollador (Octavio) en su desktop.

**Diferencial respecto a Stitch/OpenDesign**: OpenHer ata la selección al **código fuente real**
del proyecto y edita el repo con el agente + hot-reload; OpenDesign solo genera.

## 2. Bloques de Requerimientos

- **R1 — Sección de primer nivel.** Entrada "Estudio" en el rail de actividades (desktop),
  respetando `useSidebarPrefs` (id personalizable, ocultable). No visible en móvil.
- **R2 — Estado del proyecto activo persistido.** `{ directory, name, kind, entryPoint, devServerUrl }`
  sobrevive a recargas. El proyecto del Estudio se apoya en una sesión/carpeta, sin duplicar estado.
- **R3 — Abrir proyecto existente.** Elegir carpeta → servir (dev server preferente vía
  `useDevServer`; fallback estático vía `shell.project.serve` → `/shell/preview/<token>`) → canvas.
- **R4 — Canvas con inspección.** Preview + toolbar (picker / pod / reload). Reutiliza
  `browserOverlayScript` (WebView nativo) o `BrowserVisualOverlay` (iframe same-origin).
- **R5 — Selección → anotaciones.** Cada zona guarda `file:line` (dev), selector, HTML, rect.
  Reutiliza `useVisualSelection` + `formatAnnotationZone`.
- **R6 — Chat scoped.** Panel de agente dentro del Estudio; el prompt incluye el bloque
  `SELECTED ZONES` (`formatSelectionForPrompt`) y queda scopeado al `directory` del proyecto.
- **R7 — Nuevo con Open Design.** Embebe OpenDesign como generador; detecta su working
  directory y ofrece "Abrir en el Estudio".
- **R8 — Reconciliación tras HMR.** Al recargar la página, las anotaciones no se duplican ni
  crashean; los badges se re-anclan por selector y se limpian los huérfanos.

## 3. Mecanismo de Verificación Independiente

- **Tests (vitest, reales, sin mocks de la lógica bajo prueba):** hooks y componentes nuevos
  (`useStudio`, `StudioView`, parseo/handoff de OpenDesign) + regresión de la inspección
  existente en `BrowserPanel`.
- **Typecheck:** `pnpm --dir web exec tsc --noEmit -p tsconfig.app.json`.
- **Prueba real E2E (desktop):** levantar `pnpm dev` en `web/`, abrir un proyecto de ejemplo,
  activar picker, clicar un elemento, verificar que la anotación muestra `archivo:línea`, enviar
  un prompt y confirmar que el mensaje contiene `SELECTED ZONES`.
- **Integridad:** el Auditor inspecciona salida real de terminal (exit code 0 y logs genuinos);
  prohíbe tests mockeados/fabricados y placeholders.

## 4. Criterios de Aceptación (DoD)

1. La sección "Estudio" es alcanzable desde el rail y **no rompe** navegación, layout ni atajos existentes.
2. Abrir una carpeta de proyecto muestra su preview en el canvas.
3. Clic en un elemento crea una anotación; en build dev incluye `archivo:línea`.
4. Enviar un prompt al agente incluye el bloque `SELECTED ZONES` con las zonas marcadas.
5. "Nuevo con Open Design" permite generar y detectar la carpeta, con "Abrir en el Estudio".
6. `tsc` sin errores y suite de tests en verde (sin tests preexistentes borrados/modificados para pasar).
7. Flujo feliz sin errores de consola.

## 5. No-Objetivos (fuera de alcance de esta iteración)

- Paridad en Android/móvil (solo se oculta la sección).
- Instrumentación `data-oc-src` en el build del proyecto objetivo (mapeo 100% fiable). Fase futura.
- Write-back automático de estilos al código fuente (el agente edita; no hay autopatch).
- Reemplazar o modificar la UI interna de OpenDesign.

## 6. Riesgos Conocidos

| Riesgo | Mitigación |
|---|---|
| `ViewType` está duplicado (`entities/config/model.ts` y `entities/ui/model.ts`) | Explorers confirman ambos antes de editar; actualizar los dos |
| Routing de desktop es denso (`DesktopLayoutView`, `DesktopPanelRenderer`, `shellPanels`) | M1 primero: shell mínima y verificación de no-regresión |
| Overlay nativo (`/shell/browser/eval`) solo existe en desktop | Diseñar con fallback a iframe same-origin (ya existe `BrowserVisualOverlay`) |
| API del working directory de OpenDesign desconocida | R7 con handoff manual asistido si no hay API; se investiga en M4 |
| Dev server es desktop-only (`shell.pty`) | M2 con fallback estático para preview |

## 7. Hitos Propuestos (DAG)

- **M1** — Shell de la sección + entrada en el rail (R1, R2).
- **M2** — Abrir proyecto + servir + canvas (R3).
- **M3** — Inspección + anotaciones + chat scoped (R4, R5, R6, R8).
- **M4** — Handoff Open Design (R7).

Dependencias: M1 → M2 → M3; M4 depende de M2 (canvas) y puede correr en paralelo con M3.

## 8. Propiedad de Archivos (a detallar por el Orchestrator en Fase 2)

Carpeta nueva: `web/src/features/studio/` (exclusiva de los Workers del Estudio).
Puntos de integración compartidos (edición secuencial, nunca concurrente):
`web/src/entities/config/model.ts`, `web/src/entities/ui/model.ts`,
`web/src/widgets/activity-bar/ActivityBar.tsx`, `web/src/hooks/useSidebarPrefs.ts`,
`web/src/app/useAppController.ts`, `web/src/widgets/*`, `web/src/i18n/*`.

## 9. Directiva de Integridad

Modo `development`: se permite reutilizar componentes, hooks y librerías existentes.
**Prohibido**: salidas fabricadas, implementaciones fachada, placeholders que digan "TODO",
o marcar tareas como completas sin salida real de comando que lo respalde.
