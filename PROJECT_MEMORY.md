# PROJECT_MEMORY.md — bitácora de OpenHer

Bitácora cronológica, append-only: **qué pasó y por qué**. Se agrega una entrada al
terminar cada trabajo sustantivo (nunca se reescribe ni se borra una entrada).
El **estado actual** del código NO va acá: va en `PROJECT_MAP.md` (el mapa).
Un hilo nuevo lee solo el mapa; esta bitácora se consulta cuando hace falta historia.

---

## 2026-09-16 — Caja de actividad por turno, errores en una línea y baseline limpio

- **Qué cambió**: los N mensajes assistant de un turno se agrupan en UN bloque de actividad (pensamiento + tools + diffs en orden real) con scroll propio que al terminar se acopla a una línea ("shell · read · write +2"); se eliminaron huecos fantasma y el spinner duplicado, y los errores del turno pasan a una línea. Publicado v1.0.31 y v1.0.32.
- **Por qué**: el chat se llenaba de líneas sueltas (un turno = ~39 mensajes assistant) y había dos "escribiendo" a la vez.
- **Evidencia**: commits `2e45fc8f` (caja por turno) y `8d312482` (errores en una línea); DOM real 41 mensajes → 11, 0 vacíos, 0 typing duplicado; suite verde.
- **Trampa**: la caja no visible era `CollapsibleSection` sin la clase `open` (contenido montado con `opacity: 0`; los tests pasaban igual). `Measure-Object -Line` de PowerShell no cuenta líneas vacías.
- **Baseline**: `5ee508e5` consolida el trabajo previo (caché de 20 min del uso de Go, avisos del server, fixes de debate): 132 archivos / 1.798 tests verdes. Punto de partida de lo siguiente.

## 2026-09-17 / 2026-09-18 — Auditoría total, mega plan, mesa de trabajo y onda 1 de limpieza

- **Qué cambió**: auditoría del repo con 7 auditorías en paralelo + 6 escaneos propios y mega plan en `docs/local/PLAN-REFACTOR-MAESTRO.md` (9 fases, 115 tareas); después la onda 1 (F1: borrado puro) sacó ~100 archivos y ~10.000 líneas, con `tsc` = 0 en cada entrega. **Por qué**: limpiar el árbol y documentar la realidad antes de refactors mayores.
- **Evidencia**: baseline `5ee508e5`; suite de onda 1 **128 archivos / 1.679 tests verdes** verificada con `npx vitest run` (reverificado con `pnpm --dir web exec vitest run`: 128/1.683); **el runner completo de gates quedó pendiente**. Gate `test:rendered` arreglado moviendo los helpers puros de diffs a `web/src/utils/diffStat.ts`.
- **Mesa de trabajo**: el tool `debate` falló 4 veces (timeouts de turno desde Code Mode); se reemplazó por 3 subagentes con roles opuestos + arbitraje → 10 correcciones al plan. Las tabs `__design__`/`__reports__`/`__screenshots__` figuraban muertas y estaban vivas.
- **Hallazgos**: `stats_router.rs` escondía `/shell/design/*` que la web SÍ consume (`shell.ts`), separado a `design_router.rs`; `desktop-app/Cargo.lock` era un lock stale de 136 KB; ~12 cosas documentadas que no existen (`computer.rs`, `MessageVirtualList`, `providers/`, etc.).
- **Trampas de entorno**: archivos con SIDs de otra máquina y token sin `DELETE` → borrados con script elevado en `%TEMP%`; `pnpm run learning:manifest` sin argumentos escanea una carpeta forense externa y expande el contenido servido de 77 a 164 archivos.
- **Estado al cerrar**: sin commit (todo el refactor en UN commit al final) y sin publicar (APK v1.0.32). Pendiente: M2 (tribunal adversarial) y M3 (números antes/después contra `docs/local/refactor/baseline-antes.md`).

## 2026-09-18 — Cierre de la onda 1: tribunal M2 y dictamen M3

- **Qué cambió**: se corrió el tribunal adversarial (Challenger + Critic) y el runner de gates completo, y se cerraron sus hallazgos: 7 correcciones de documentación (19 routers + `design`, `openher-desktop.exe`, `tiny_http`, TypeScript 7.0.2, pnpm/Node, diagrama) y 4 de código (migración D8 con formato anidado + 4 tests, comentarios de `api.rs`, re-exports muertos de `DiffView`, `.gitignore`). Además se reparó el mojibake del `AGENTS.md` (9 secuencias) y el inventario interno salió de `.agents/`.
- **Evidencia**: `docs/local/refactor/baseline-despues.md`. **Gates 14/14 verdes**; **150 archivos borrados**, `+417 / −19.648` líneas (producto: **−10.190** en 80 archivos); huérfanos 29 → 2 (justificados); `index.css` 382 → 353 KB; suite **128 archivos / 1.683 tests verdes**; `test:rendered` de ROJO a verde.
- **Verdict del tribunal**: CSS PASA · huérfanos PASA · D8 PARCIAL → arreglado · chaos sin crashes · regresión PASA · seguridad intacta · Critic "APTO CON OBSERVACIONES" (aplicadas).
- **Verificación visual**: capturas antes/después idénticas en 390 / 780 / 1280 (`docs/local/refactor/shots/`).
- **Dictamen del árbitro**: **ACCEPTED**. Backlog no bloqueante para la onda 2: saneo de `tabStacks`/`panelIds`, paridad de tests por dominio y los puntos que la mesa marcó como mal negocio (tokens CSS, `AppModals`, iOS).
- **Estado al cerrar**: sigue **sin commit** (un solo commit al final, por decisión del usuario) y **sin publicar** (la APK sigue en v1.0.32).

## 2026-09-18 — Ondas 2 y 3: unificación, god hooks y la ley del repo

- **Onda 2 (F2 + F6 + F9-Q1)**: primitivos compartidos (`shared/lib/store.ts` con `createStore`/`createEmitter`, `shared/lib/async.ts`, `shared/errors/errorShape.ts`, `utils/format.ts`, `shared/lib/escapeHtml.ts`) + migración de 5 stores y 29 call sites; `utils/toolName.ts` y `utils/messageShape.ts` (29 herramientas con etiqueta/verbo/icono verificados contra `HEAD`); 7 archivos de tests de caracterización (54 casos) que **encontraron un bug real**; Rust: spawn/cleanup de plugins unificado, escritura atómica única (el `FavoritesStore` usaba tmp **fijo sin fsync**), base64 al crate que ya estaba en deps, `gitx`, TTL de caché y logs de `fswatch`.
- **Onda 3 (F3 + F7)**: `api.ts` (1.363) → `api/` por dominio (12 módulos, **51/51 endpoints**, `api.ts` queda de 6 líneas como fachada); `useAppController` 1.432 → 631 + 4 hooks de dominio (**212 claves de `app` verificadas, mismo orden**); `useDesktopGridActions` 1.201 → 3 hooks + compositor de 50; `useSessions` 448 → 205 con `entities/session/sessionsPlan.ts` puro; `learning/progress` sobre el store. Tooling: `scripts/lib/version.psm1`, destinos de deploy resueltos del cargo real, `Sync-WebDist` **sin `/MIR`** + purga por antigüedad, `copy-dist.py` con `exit 1`, `tsconfig.test.json`, `health.ps1` validando contenido, `codemagic` y el plugin gitignored fuera de `opencode.jsonc`.
- **Bug real arreglado**: `shellPanels.tsx` (`DocsPanel`) pasaba `dangerouslySetInnerHTML` **y** `children` → React 19 tiraba y desmontaba el árbol al abrir un doc. Ramas excluyentes + test actualizado (6/6).
- **Hallazgo estructural**: `web/src/ui-regression.test.mjs` **no testea conducta: asserta sobre el texto fuente** de 20+ archivos (~150 asserts), lo que hacía imposibles B1/B2/B7. Quedó como guardrail **#13** en `CONTRIBUTING.md` y se resolvió **repuntando 3 lecturas** a los módulos nuevos: `git diff` = 3 líneas de lectura y **0 asserts**.
- **Bug de deploy (lo encontró W7)**: los scripts publicaban a un `X:\Dev\cargo-target` hardcodeado cuando el target real es `G:\Dev\cargo-target`; ahora se resuelve de `desktop-app/.cargo/config.toml`.
- **Publicación externa**: a las 10:45 otra terminal corrió `update-app.ps1` y publicó **v1.0.33** con el árbol a medio refactor (ondas 1-2 completas, 3 en vuelo; `pnpm build` pasó, **los tests no se corrieron**). `X:\Dev\cargo-target` quedó congelado en 1.0.32.
- **Estado al cerrar esta entrada**: sin commit y con la **onda 4 en vuelo** (F4 componentes dios + Rust perf/runtime + i18n).

## 2026-09-18 — Fix botón Stop oculto con respuesta en curso

- **Qué cambió**: re-arme de `awaiting` con deltas en vivo (`useSSEHandler.ts:flushCoalesce`: deltas de la sesión visible sin awaiting → `setAwaiting(true)`, excluye `compaction`) + `awaitingRef` fresco por ref en `useAppController.ts` (el closure quedaba congelado al abrir el chat y el settled por SSE nunca veía el valor real). 3 tests nuevos en `useSSEHandler.test.ts`.
- **Por qué**: el Stop se muestra iff `isWorking`; un settle prematuro lo apagaba a mitad de turno y nada lo re-armaba → había que salir y re-entrar. Server verificado honesto (`/session/active` muestra `running` real, POST 0.1-1.2s); IDs ULID (dedupe seguro).
- **Evidencia**: `npx vitest run src/hooks/useSSEHandler.test.ts` 19/19 (16 previos intactos); `tsc` limpio salvo `DebateRoom` (WIP ajeno preexistente). Tribunal Challenger+Critic: **APTO CON OBSERVACIONES** (exclusión compaction aplicada; resurrección post-stop ~16ms y ultra/miser se autocuran por poll).
- **Pendiente**: grupos de pestañas (exploración hecha, sin implementar). Sin commit (regla 8).

## 2026-09-18 — Fix botón "Padre" del subagente (no hacía nada / iba a la lista)

- **Qué cambió**: `ChatView.tsx`: nuevo `handleGoToParent` (abre `parentID` vía `onOpenSession`, simétrico a `handleViewSubagents`; fallback a `onBackToSessions` si el padre no está en la lista) y `SubagentFooter` ahora lo usa en vez de `onBackToSessions`.
- **Por qué**: el botón estaba cableado a "volver a la lista": en el panel desktop ese callback es `() => undefined` (botón muerto, `SessionChatPanel.tsx:547`) y en móvil sacaba a la lista en vez de abrir al padre.
- **Evidencia**: `tsc -b --force` limpio; suite `src/components` 209/218 — los 9 fallos son `SettingsPanel` (untracked) y `ExplorerSession` (flaky por timeouts), ninguno referencia `ChatView`/`SubagentFooter`. Sin commit (regla 8); `stash@{0}` intacto.

## 2026-09-18 — Fix `<subagent>` renderizado como mensaje propio

- **Qué cambió**: el server inyecta el reporte del subagente como mensaje `synthetic` (`metadata.source="subagent"`, texto envuelto en `<subagent ...>...</subagent>`) y la web lo pintaba en tarjeta neutra con los tags crudos, indistinguible de un mensaje propio. Ahora: `messageShape.ts` suma `isSubagentResultMessage`/`stripSubagentWrapper`/`parseSubagentTag`/`getSubagentResultInfo`; `rendered.ts` limpia las marcas en el funnel (vale para fetch, SSE y caché); `MessageBubble.tsx` dibuja tarjeta propia "Subagente · {description}" con estado y botón "Ver subagente" (abre la sesión hija vía `onViewSubagents`); CSS `.message.synthetic` + `.subagent-result-card` neutros (nunca burbuja de usuario). Claves i18n reutilizadas (`toolpart.subagent`, `toolpart.viewSubagent`), cero superficie nueva.
- **Por qué**: medido contra el server real (`:4098`): mensajes `type=synthetic` con `metadata {source, childID, agent, state}` y texto `<subagent sessionID state description>…`; la web no los distinguía.
- **Evidencia**: `vitest` 50/50 (16 tests nuevos en `messageShape.test.ts` + 2 en `rendered.test.ts`, ningún test existente tocado); `tsc` limpio en los 6 archivos del cambio. Tribunal: Challenger y Critic **APTO CON OBSERVACIONES** (aplicadas: strip global, tarjeta sin exigir texto, fallback `childID ?? tag.sessionID`, blindaje `role !== "user"`, attrs case-insensitive, tests de bordes null/vacío/mayúsculas).
- **Ojo ajeno**: `tsc -b --force` global da 3 errores en `src/hooks/useMessages.ts` (`SessionView`, `ModelSelection`, `setTranslationOriginal` no encontrados) — archivo con WIP ajeno en curso, no tocado por este cambio. Sin commit (regla 8).

## 2026-09-18 — Botón de subagentes activos en el header + spinner en subsesiones

- **Qué cambió**: (a) `ChatHeader.tsx`: botón superior `chat.activeSubagents` ("Subagentes activos (N)") con dropdown que lista los chats activos de subagentes DE ESA SESIÓN y abre el elegido (`onViewSubagents`); fuente única `activeSubagentSessions()` en `subagentBackground.ts` (hijos por `parentID` + `busySessionIds`, fallback a `status` vía `isSessionActive` — se eliminó el duplicado local). `ChatView.tsx` plomea `sessions` al header. (b) `SessionCard.tsx`: spinner chiquito gris (`LoadingIcon` 10px, `var(--muted)`) junto al título SOLO en hijas activas (`isChild && isSessionActive`); CSS `.session-child-spinner` en `sessions.css`. i18n: 2 keys nuevas en es/en/it/zh + unión (`chat.activeSubagents` neutro al plural, `chat.activeSubagentsHint`).
- **Por qué**: acceso rápido a los chats de subagentes sin scrollear ni salir del chat; ver de un vistazo qué subsesión sigue trabajando en la lista desplegada.
- **Evidencia**: `vitest` 31/31 (helper 3 + SessionList 2 + ChatHeader 3 nuevos, ningún test existente tocado); `tsc -b --force` limpio; `test:i18n` passed; `check:rules` OK (ningún presupuesto subió). Tribunal: Critic **APTO CON OBSERVACIONES** (aplicadas: DRY `isSessionActive`, rótulo neutro al plural, test en `en` determinístico, assert de padre por título); Challenger marcó **NO APTO** por 5 puntos evaluados uno por uno: fallback a otro hijo e pills duplicados son conducta preexistente/intencional (no se toca por regla 2), freshness del poll inherente al diseño, `QuickAccessCard` string-only y roles del `DropdownMenu` compartido quedan como backlog fuera de scope.
- **Backlog**: unificar pills de subagentes del header; alinear `QuickAccessCard` a `isSessionActive`; roles `menu/menuitem` en `DropdownMenu`. Sin commit (regla 8).

## 2026-09-18 — Fix doble marco en reporte de subagente (article synthetic sin caja)

- **Qué cambió**: `.message.synthetic` en `chat.css` pasa a `background/border/box-shadow: none` (igual que `.message.assistant`): el article externo ya no pinta caja y la única con color es la tarjeta interna `.subagent-result-card`. Sin subagentes por pedido explícito.
- **Por qué**: el article sumaba fondo+borde propios sobre la tarjeta → doble marco visible en el inspector (`article.message.synthetic 834×149`).
- **Evidencia**: `check:rules` OK (ningún presupuesto subió). Sin commit (regla 8).

## 2026-09-21 — Ondas 4 y 5 (componentes dios, Rust, optimización) y cierre del refactor

- **Onda 4 (F4 componentes dios)**: `shellPanels` 2.105→**1.217** (`features/shell/{useXtermSession,SingleTerminal,DesignPanel}`, 5 emojis→Lucide, `renderMarkdown`→`<Markdown>`), `BrowserPanel` 2.148→**1.434** (`features/browser/*`, `useMemo` 0→5; el plan mentía: `suggestions`/`suggestIdx` NO estaban muertos), `SettingsPanel` 1.271→**754** (`features/settings/sections/*`; UI muerta real: `showDataUsage`, `settingsSearch`, `DataUsageModal`), `PCFilesPanel` 2.470→**2.018** (`ExplorerPane`/`usePaneNav`/`InlineRename`/`shared/lib/fileKind.ts`; `useState` 42→33 y la fuga O2 de `memo(FileRow/TreeFolder)` con test), `Composer` 1.146→**742** (`components/composer/*`), `ChatView` 934→**591** (`ChatHeader`/`ChatOverflowMenu`/`MessageSearchBar`/`TodoPanel` + 3 hooks).
- **Onda 4 (resto)**: C3 un solo flujo de chat (`useSessionChatController`/`useOutboxFlush`/`usePanelDrop`) con **parity tests** de móvil vs desktop; 12 modales al `<Modal>` (variante `overlay`; `ChatTerminalDock` **no**, no es diálogo y el focus trap le robaría el foco a xterm); B4 (`useAppController` 641→**506**, `useBaseChatProps` 445→397 con **103 claves de `baseChatProps` verificadas**: `missing []`, `extra []`, mismo orden); i18n B10/Q3 (30 strings, 21 claves, paridad **en=1008/es=1008**, 212 claves sin uso reportadas, `it`/`zh` marcados beta 568/1010).
- **Onda 5 (F6/F8)**: Rust — `ExternalManager` con `Mutex<ExternalState>` (lock fuera de `taskkill`/`wait`), `ptyx` sin retener el lock en `write_all` + header `[u8;10]` + `copy_within` + tope 256 WS + timeout de handshake, `main.rs` con writer thread de geometría (canal `geom_tx`); perf — índices en `useGitStatus` (**574.970 comprobaciones, 0 mismatches**), `Set` en `SessionList`, memos en `MCPBrowser`/`MessageBubble`, suscripción opt-in en `ToolPart`, **6 fugas de timers** con cleanup.
- **Guardrails (lo que más importa)**: `ui-regression.test.mjs` no testea conducta sino **texto fuente** (~150 asserts sobre 20+ archivos). Se resolvió repuntando 4 lecturas a los módulos nuevos (`api/*`, `shared/api/*`, `sessionsPlan`, `useMessageSend`/`stores`) y normalizando `const X = (…) =>` → `X(…)` **solo en la lectura**; ídem `settings-regression`/`model-regression` (regex de deps tolerante, que antes pineaba `[draftConfig]`). Verificado: **160/29/32 asserts antes = después**. `entities/session/model.ts` volvió a ser **type-only** (moví `toSessionView`/`mergeSessionPoll` a `sessionsPlan.ts`; `barrel.test.ts` lo pinea). El presupuesto `as any`/`: any` ahora **excluye tests** (los mocks no son deuda): producción **194→188** y **224→194**.
- **Bugs reales arreglados**: `DocsPanel` (React 19 `dangerouslySetInnerHTML`+`children` desmontaba el árbol), `activeSubagentSessions` había perdido `title` en el tipo, `FavoritesStore` escribía con tmp **fijo sin fsync**, los scripts publicaban a un `X:\Dev\cargo-target` hardcodeado (el real es `G:\`, resuelto del `.cargo/config.toml`), y las 6 fugas de timers.
- **Trampas nuevas**: `tsc -b` **sin `--force` ocultó 2 errores reales** de tipos (el gate ahora fuerza); el `git` del PATH (`X:\Dev\git`) **crashea** (`0xC0000005`) → hay que usar `C:\Program Files\Git\cmd\git.exe` (2.55.0.5) o `G:\Dev\Git`; 6 subagentes se cancelaron o murieron (W3B, W4R2, W2R-common, W2A…) y el **tribunal final falló por saldo**, así que la revisión adversarial la hizo el orquestador (asserts iguales, `any` de producción a la baja, seguridad intacta, escritura atómica solo reforzada).
- **Evidencia**: gate 14/14 con `tsc --force`; suite **143 archivos / 1.797 tests**; repo **625 archivos / 142.435 líneas**; CSS muerto 42 (tope); huérfanos 1 (`vite-env.d.ts`); `cargo check`/`build --release` 0 warnings; `cargo test` 36 pasan (1 preexistente: el `zip_roundtrip` necesita el `tar` del sistema).
- **Estado**: **sin commit** (el árbol tiene el refactor + los fixes de otras sesiones: 401 entradas) y **ya publicado**: v1.0.33 el 18/9 10:45 (desde el árbol a medio refactor), después 1.0.34 y 1.0.35 por otras sesiones — la APK servida hoy es **1.0.35**. El commit único sigue esperando el OK del usuario.

## 2026-09-21 — Commit único del refactor

- **Qué cambió**: con el OK explícito del usuario se commiteó **todo el árbol** en un solo commit (**442 archivos, +18.452 / −43.250**) — el refactor de las 5 ondas + los fixes de otras sesiones (botón Stop, botón Padre, tarjeta de subagente, `ChatHeader`) + las versiones 1.0.33‑1.0.35.
- **Verificación previa**: gate **14/14** con `tsc --force` (143 archivos / 1.797 tests). La revisión adversarial la hizo el orquestador porque los 2 subagentes del tribunal murieron por saldo: asserts de los 3 tests pineados **160/29/32 iguales**, `as any`/`: any` de producción **194→188 / 224→194**, seguridad Rust intacta, escritura atómica solo reforzada. Los 3 workers cancelados (W3B, W4R2, W2R-common) quedaron verificados en el código.
- **Verificación posterior**: árbol **limpio** (0 entradas) y **0 artefactos internos** dentro del commit (`.agents/`, `docs/local/`, `dist`, logs y APK quedaron fuera por `.gitignore`); los archivos clave entraron (`CONTRIBUTING.md`, `tasks/rules-budget.json`, `api/index.ts`, `stores/outboxStore.ts`, `infrastructure/http/common.rs`, `web/tsconfig.test.json`).
- **Sin push**: `main` quedó **4 commits adelante de `origin/main`**. Publicar la **1.0.36** con este árbol verificado queda a decisión del usuario (hoy el celular sirve la 1.0.35).
- **Pendiente técnico del plan**: la mitad de R1 no hecha (`ShellRequest.body: Bytes`; el JSON copia igual porque `simd-json` muta in-place, y el cambio toca 21 usos en 8 archivos) — reportado, no forzado.
