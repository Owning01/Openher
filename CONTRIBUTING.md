# CONTRIBUTING.md — el camino de este proyecto

**Ley de trabajo de OpenHer.** `AGENTS.md` = resumen + comandos; acá está el **por qué** de cada regla y **cómo se verifica**. Si una regla choca con una orden explícita del usuario, gana el usuario — pero el choque se reporta antes.

**Regla madre: una regla que no se puede verificar con un comando no es una regla, es una intención.**

## 1. Las 10 no negociables

| # | Regla | Verificación |
|---|---|---|
| 1 | **Un path, un escritor**: nunca dos agentes en el mismo archivo a la vez. | `git status --porcelain` acotado a los paths asignados |
| 2 | **Unificación, no rediseño**: la conducta observable no cambia salvo pedido explícito. | Tests existentes verdes **sin tocarlos** + comparación visual |
| 3 | **Prohibido editar un test existente para que pase**: si cae, se arregla el código. | El diff de los `*.test.*` existentes debe ser vacío (la ampliación aditiva se declara) |
| 4 | **No se afirma nada sin medirlo**: números y afirmaciones con el comando que los prueba. | El reporte cita comando y salida; en docs, cada dato se comprueba antes de escribirlo |
| 5 | **Se borra antes de agregar**: stdlib antes que dependencia; una implementación por concepto. | `pnpm run check:rules` + `git grep` para probar que una dep se usa de verdad |
| 6 | **Lista NO TOCAR intacta** (§2). Tocarla requiere preguntar. | `git diff` contra esos paths |
| 7 | **Cero secretos** en archivos, docs, artefactos o mensajes; nunca `git add -A`. | `git grep` de credenciales + `git status` revisado antes de commitear |
| 8 | **Nadie commitea por su cuenta**: un commit por fase, con aprobación del usuario. | `git log` vs acuerdos; el único que commitea es el orquestador |
| 9 | **Verificación adversarial antes de aceptar**: el que hace no es el que aprueba. | Challenger + Critic sobre el diff + veredicto explícito (APTO / CON OBSERVACIONES / NO APTO) |
| 10 | **Si no se sostiene, se reporta bloqueado**: no se fuerza, no se inventa, no se borra "por las dudas". | El reporte incluye "bloqueado: X, motivo Y" |

## 2. Lista NO TOCAR (guardrails)

Funcionan por detalles que no se ven: un refactor "lindo" los rompe en silencio.

1. Scroll/velo de `MessageList` (threshold, `chatAnchor`, follow-tail).
2. Outbox del chat: `claim`/`hold`/cooldown de 4 s (anti-duplicados y carreras).
3. `MessageBubble`: early-return del absorbido + wiring del `IntersectionObserver`.
4. Rama `question` de `ToolPart` (sin ella, el chat real va un paso detrás del local).
5. `useOfflineCache` (contadores monotónicos) y `sessionDirs.keepUncoveredSessions`.
6. Ring del PTY (`basex`/`consumed_abs`) y handshake WS.
7. `atomic_write_json` / `recover_orphan_tmp` (salvo una tarea que los extienda explícitamente).
8. Seguridad Rust: `is_loopback`, `check_shell_auth`, binds/loopback, WS PTY.
9. Clamps WCAG de `resolveTheme`; `WEBVIEW_BROWSER_ARGS`; WNDPROC frameless.
10. `desktop-narrow.css`: **generado**, nunca se edita a mano (se regenera desde `layout.css`).
11. `debateStore`: idempotencia `(debateID, seq)`/`seenSeq` — contrato con `docs/DEBATE-SCHEMA.json`.
12. Modelo de la grilla del desktop (`collapseEmpty`, `panelIds`).
13. **`web/src/ui-regression.test.mjs`**: pinea ~150 literales del **texto fuente** de 20+ archivos (p. ej. `useMessages.ts` debe seguir conteniendo `awaitingAssistantReply`, `optimisticUserMessages`, `createOptimisticUserMessage`/`optimisticMessage`, `removeOptimistic(optimisticMessage.info.id)`, `loadSelectedRequestRef`, `let ok = false`, `ok = true`, `return ok`…; `api.ts` debe seguir conteniendo las firmas `loadDiff`/`listFiles`/`createSession`/`withTimeout`… `loadTodo`/`abort`/`listGlobalSessions`, `withDirectory("/session", directory)`, `resolveApiVersion`, `rememberApiVersion`, `unwrapData`, `toMessageEnvelopeV1`, `toSessionV1`; `useAppController.ts` los 5 literales del outbox/`baseChatProps`; `ChatView`/`Composer`/`SettingsPanel` los suyos). **El test no se debilita**: si un refactor mueve esos símbolos, se **repunta la lectura** al archivo nuevo (los asserts quedan byte-idénticos — se verifica con `git diff` que no se agregó ni cambió un solo `assert`) o se deja un re-export que los conserve; nunca se borra ni se afloja un assert. Cada repunte se declara en el informe. Antes de tocar uno de esos archivos, correr `node src/ui-regression.test.mjs` (dentro de `web/`).

## 3. Convenciones de código

- **TS estricto**: named exports (sin `export default` nuevo), `import type`, sin `any` nuevo.
- **React 19 + Vite + Tailwind**; estado compartido en singleton (`createStore`, un creador por concepto); sin prop drilling nuevo (agrupar por dominio).
- **Cero emojis en la UI**: solo SVG formal (Lucide).
- **i18n**: todo string visible por `t()`; es/en en paridad; los idiomas incompletos se marcan beta en vez de mentir.
- **CSS**: sin `!important` nuevo; no se edita CSS generado; antes de borrar una regla, probar que **ninguna** clase se usa (límites de palabra + template literals).
- **Imports** con extensión `.ts` donde lo exige `test:rendered` (ese harness corre fuera de Vite).
- **Archivos y hooks chicos**: >~400 líneas o tres responsabilidades = partir; pero **primero el test de caracterización**, no a ciegas.
- **Comentarios que dicen la verdad**: explican el *por qué*; si mienten, se corrigen o se borran (ya nos costaron horas).
- **Sin dependencias nuevas** sin justificarlo: primero stdlib, después lo que ya está en `package.json` (varias "basuras" resultaron ser el React Compiler).

## 4. Ciclo de trabajo

1. **Leer el mapa**, no la bitácora: `PROJECT_MAP.md` (estado actual); `PROJECT_MEMORY.md` solo para historia.
2. **Medir antes de afirmar** (tamaño, conteos, conducta actual).
3. **Un cambio chico** con su evidencia.
4. **Gate del área** (tsc + los tests que tocan esos archivos); el gate global lo corre el verificador, no el que edita.
5. **Verificación adversarial**: alguien distinto intenta romperlo (CSS por selector, huérfanos, persistencia, chaos, regresión, seguridad).
6. **Actualizar mapa (reemplazar) y bitácora (agregar entrada)**.
7. **Reportar**: qué cambió · por qué · evidencia (comando/número) · trampas · pendientes.

## 5. Verificación: qué prueba cada comando

| Comando | Qué prueba |
|---|---|
| `npx tsc -b --noEmit` (en `web/`) | Tipos y contratos entre módulos, incluidas extensiones de import |
| `npx vitest run` (en `web/`) | Conducta de componentes/hooks/stores |
| `pnpm run test:rendered` (en `web/`) | Que el render real del chat no se rompe (el gate que más rompe) |
| `pnpm run test:i18n / test:ui / test:model / test:settings` | i18n, sistema de diseño, selector de modelo, settings |
| `pnpm run check:contrast` | Contraste WCAG en los 34 temas |
| `pnpm build` | Bundle real + CSS generados sincronizados |
| `pnpm run check:rules` | Los presupuestos (§6, solo bajan) |
| `cargo check` / `cargo build --release` (en `desktop-app/`) | Rust (release, por los warnings de `cfg`) |
| Capturas 390/780/1280 vs `docs/local/refactor/shots/` | Que un cambio visual no cambió lo visible |

Herramientas locales: `docs/local/refactor/tools/{gate.ps1,css-deletable.cjs,deadcode.cjs,inspect-size.cjs,metrics.cjs,verify-content.cjs}`. Artefactos de gate a `$env:TEMP`, **nunca** al repo.

## 6. Presupuestos que solo bajan

Viven en `tasks/rules-budget.json` y los mide `pnpm run check:rules`: si un número sube, el comando falla y el cambio no entra; si baja, se recalibra (`check:rules:update`) al cerrar la onda con el gate corrido. Los valores se fijan con el gate, no a mano. Métricas: `asAny`/`colonAny` **excluyen archivos de test** (los mocks no son deuda de producción); `orphanFiles` cuenta archivos nunca importados; `deletableCssRules` cuenta reglas cuyos selectores son 100% clases muertas.

## 7. Trampas conocidas de este entorno

- **`Measure-Object -Line` de PowerShell no cuenta líneas vacías** → subestima archivos: medir con el script de métricas.
- **Los archivos del repo son de SIDs de otra máquina** y el token no tiene `DELETE` → borrar requiere script elevado en `%TEMP%` (`Start-Process -Verb RunAs`).
- **`pnpm run learning:manifest` sin argumentos** escanea una carpeta forense externa y expande lo servido de 77 a 164 archivos: siempre con argumento explícito.
- **`robocopy /MIR` en vivo** rompe clientes con chunks lazy (`Failed to fetch dynamically imported module`): no se limpia el `web-dist` de un cliente vivo.
- **`test:rendered` corre fuera de Vite**: los imports de ese harness necesitan extensión `.ts`.
- **Grep por basename da falsos positivos** (`App`, `index`, `types`, `handler`, `error`…): los huérfanos se prueban por **import**, no por nombre.

## 8. Coordinación entre agentes

`team-who --actividad --anuncios` · `team-anuncio "<nombre>" "<tarea>" [trabajando|esperando|listo]` · `team-send <id> "<nombre>" "<texto>"`. Textos de 1-3 líneas, sin secretos, máximo 2 reintentos; lo urgente va por el chat propio. Un solo escritor por archivo; la bitácora es append-only (jamás se reescribe la entrada de otro agente).
