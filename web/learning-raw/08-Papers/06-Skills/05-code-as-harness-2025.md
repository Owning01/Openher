# Code as Harness — El código es el medio, no solo el output (Survey 2025)

> **Autores:** Survey — Code Is Not Just Output, It's the Medium
> **Año:** 2025 · **Versión:** arXiv 2605.18747 · **Prioridad:** Complementario · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2605.18747](https://arxiv.org/abs/2605.18747)
> **Categoría Papers:** 06 Skills · **Nivel:** intro

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Code as Agent Harness: Code Is Not Just Output, It's the Medium (2025).
> **Relevancia para opencode-remote-android:** cambia el mindset: tu `kanban.json`, `opencode.db`, `SKILL.md`, `external_router.rs` y hasta `DesktopPanelRenderer.tsx:313` (visibility:hidden para no matar el iframe) no son "config" — son **harness programable** que el agente puede leer, escribir y versionar como código.

## 1 Introducción — Qué problema resuelve

La visión clásica del agente es: LLM genera texto, a veces llama una tool, el harness es un wrapper fijo que orquesta. El código que genera el agente es *output* descartable — un patch que se aplica y se olvida.

El survey propone invertirlo: **el código es el medio**. Tests, workflows, DSLs, configs, skills — todo lo que el harness usa para operar puede ser **generado, leído y modificado por el agente como código**, y persistir como artefacto versionado. El harness deja de ser un binario cerrado y pasa a ser un **repo vivo** que el agente evoluciona.

En tu repo, esto ya pasa a medias: `kanban.json` es harness que el agente lee, `opencode.db` es estado que el agente escribe, `SKILL.md` es capacidad que el agente puede crear. El paper te da el marco para generalizarlo.

## 2 Ideas clave

### 2.1 Tres roles del código en el harness

| Rol | Qué es | Ejemplo en tu repo |
|---|:---|---|
| **Código como razonamiento** | El agente escribe código para pensar (no para ejecutar) | Generar un script `analyze-imports.py` que mapea dependencias antes de refactorizar |
| **Código como acción** | El agente genera código que *es* la acción (no un tool call) | Generar un workflow YAML que orquesta `fs.read → ptyx exec → fs.write` |
| **Código como estado** | Artefactos que persisten y que el próximo turno lee | `kanban.json`, `opencode.db`, `SKILL.md`, `DesktopGrid` layout |

La mayoría de harnesses solo usa el rol 2 (tool calls). El paper muestra que los harnesses que usan los 3 son más robustos y reusables.

### 2.2 Artefactos persistentes, no chats descartables

En lugar de que cada run sea un chat que se tira, cada run genera **artefactos versionados**:

```
run #42 (fix external_router probe timeout)
  ├── patch: external_router.rs:19 split_cmd timeout 250ms→500ms
  ├── test: regression-probe-timeout.ts (nuevo, queda en repo)
  ├── workflow: probe-retry.yaml (reusable para próximo external)
  └── skill: probe-guard/SKILL.md (si el fix es generalizable)
```

El próximo agente que enfrente un timeout similar no empieza de cero — lee `probe-retry.yaml` y `probe-guard/SKILL.md`.

### 2.3 DSLs pequeños para dominios específicos

En lugar de exponer 20 tools genéricas (`fs.read`, `fs.write`, `pty.exec`, ...), definí un **DSL** para tu dominio:

```yaml
# capture-annotate-export.yaml — DSL para screenshots
pipeline:
  - capture: { target: "web/src", mode: "full" }
  - annotate: { tool: "vioeditor", edits: ["blur secrets", "highlight diff"] }
  - export: { format: "png", dest: "docs/screenshots/" }
```

El agente genera y ejecuta DSL, no 10 tool calls sueltos. Es más corto, más legible y más testeable. Tu `EXTERNAL_PROJECTS` (5 plugins) son candidatos perfectos para DSLs.

### 2.4 Harness versionado en git

Si el harness es código, va a **git**. `kanban.json`, `skills/`, `workflows/`, `constitution.md` — todo versionado, con PR, con review. El agente propone cambios al harness vía patch, no vía mutación invisible de estado. Esto hace que el harness sea auditable y revertible.

## 3 Evidencia / Experimentos

El survey no trae un benchmark único, sino que sintetiza evidencia de múltiples sistemas:

| Sistema | Patrón "code as harness" | Resultado |
|---|:---|---|
| **SWE-agent** | Viewer + terminal como DSL (`view`, `edit`, `bash`) | 33% SWE-bench vs 3% sin harness (paper SWE-bench) |
| **OpenHands** | `micro-agent` genera workflows YAML persistentes | Reusabilidad: 40% de workflows se reutilizan en tasks similares |
| **Aider** | `repomap` (código como estado) + patch como artefacto | Menos tokens por fix al reutilizar repomap |
| **Voyager (Minecraft)** | Skills como código JS que persisten y se componen | 3× más tasks resueltos al componer skills previas |

- **Tesis central:** agentes que generan artefactos persistentes (tests, workflows, skills) superan a los que solo chatean, con **menos tokens a largo plazo** porque reutilizan.
- **Costo inicial vs amortizado:** generar un workflow YAML cuesta +500 tokens la primera vez, pero ahorra 2k tokens en las próximas 5 tasks similares.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **kanban.json + opencode.db como harness code** | Ya son estado que el agente lee/escribe. Versioná `kanban.json` en git (no en `.gitignore`), y hacé que el agente genere patches contra él como si fuera código. `opencode.db` es read-only vía `opencode-stats` :8765 — exponé su schema como DSL para que el agente lo queryee sin SQL crudo. |
| **Workflows YAML persistentes** | Cada vez que el agente resuelve un fix multi-paso (ej: "migrar `external_router` a MCP"), hacé que genere `workflows/migrate-external.yaml` con los pasos `probe → split_cmd → cached_probe → test`. Guardalo en `workflows/` y versionalo. El próximo fix similar lo reutiliza. |
| **DSLs para EXTERNAL_PROJECTS** | Definí `capture.yaml`, `design.yaml`, `screenshots.yaml` como DSLs de alto nivel para tus 5 plugins. El agente genera DSL, no 10 tool calls. Validá el DSL con schema en CI (como `validate-skills.ts` del paper 01). |
| **Skills como código (paper 01)** | Un skill no es config — es código (`SKILL.md` + `scripts/run.sh`) que el agente puede generar. Cuando el agente resuelve un task y detecta que el patrón se repetirá, que genere un skill nuevo en `./skills/` y lo commitee. |
| **DesktopPanelRenderer como harness** | `DesktopPanelRenderer.tsx:313` (`position:absolute;visibility:hidden` para mantener `plugin:external:*` montados) es harness code que el agente podría proponer mejorar (ej: agregar `keepAlive` prop). Tratá `web/src` como harness editable, no solo como UI. |
| **opencode-stats :8765** | Cada artefacto generado (`workflow`, `skill`, `test`) debe loguearse en `:8765` como `{type, path, reused_count, tokens_saved}`. Así medís el ROI de "code as harness" — si un workflow se reutiliza 5 veces, pagó su costo. |

```yaml
# workflows/probe-retry.yaml — ejemplo de artefacto persistente
name: probe-retry
description: Verifica puerto antes de spawnear external, con retry y cache
inputs:
  port: { type: number, required: true }
  timeout_ms: { type: number, default: 250 }
steps:
  - probe: { port: "{{inputs.port}}", timeout: "{{inputs.timeout_ms}}" }
  - if: probe.occupied
    then: { error: "409 port {{inputs.port}} occupied" }
  - spawn: { cmd: "{{inputs.cmd}}", detached: true, no_window: true }
  - pollReady: { url: "http://127.0.0.1:{{inputs.port}}/health", attempts: 30, interval: 1s }
```

## 5 Anti-patterns / Limitaciones

- **Generar artefactos por todo.** No cada chat debe generar un workflow YAML — solo los patrones que se repiten. Si generás un artefacto por cada `list_dir`, llenás `workflows/` de basura. Regla: genera artefacto solo si el patrón apareció 2+ veces o si el fix tomó >5 turnos.
- **DSLs sin schema = caos.** Un DSL sin validación es peor que tool calls sueltos — el agente genera YAML inválido y falla silencioso. Validá cada DSL con JSON schema en `web/scripts/validate-workflows.ts` (como `validate-skills.ts`).
- **Harness code sin review.** Si el agente commitea `kanban.json` o `SKILL.md` sin PR, puede corromper el harness. Todo artefacto generado debe pasar por `cargo check` / `tsc -b` y por review humano (o al menos por guard constitutional del paper 04) antes de merge.
- **Artefactos huérfanos.** Workflows que nadie usa son deuda. Cada mes, auditá `workflows/` y `skills/` con `opencode-stats` (`reused_count == 0` por 30 días → candidato a borrar). Sin GC, el harness crece infinito.
- **Survey, no paper con eval única.** Es un survey que sintetiza patrones, no un paper con benchmark controlado. Úsalo como marco de diseño, no como prueba de que "code as harness siempre gana". Validá en tu repo con A/B.

## 6 Ejercicios prácticos (en tu repo)

1. **Generá tu primer workflow YAML persistente.** Tomá un fix multi-paso que hayas hecho a mano (ej: "agregar un nuevo EXTERNAL_PROJECT"), y hacé que el agente lo reescriba como `workflows/add-external.yaml` con inputs (`name`, `port`, `cmd`) y steps (`probe`, `spawn`, `pollReady`, `test`). Versioná el YAML en git y usalo la próxima vez que agregues un external — ¿te ahorra pasos?

2. **DSL para screenshots.** Definí `workflows/capture-annotate-export.yaml` como DSL para el plugin `screenshots` (:3002): `capture → annotate (vioeditor :1420) → export`. Hacé que el agente genere el DSL en lugar de 5 tool calls sueltos. Validá con schema y medí tokens: ¿DSL (1 artefacto) vs tool calls (5 turns) cuánto ahorra?

3. **Skill auto-generado desde un fix.** Tomá un fix que tomó >5 turnos (ej: `external_router` probe timeout), y pedile al agente: "Si este patrón se repite, generá un skill en `./skills/probe-guard/SKILL.md` con frontmatter `name, description, tools, version` (paper 01) que encapsule el fix." Commiteá el skill y testeá si el próximo issue similar lo usa vía JIT (paper 02).

## 7 Referencias

- **Survey:** *Code as Agent Harness: Code Is Not Just Output, It's the Medium*, 2025 — https://arxiv.org/abs/2605.18747
- **Relacionados en esta serie:** Agent Skills (01) — skills como artefactos de código; JIT-Agent (02) — harness que compone artefactos; SWE-agent — viewer/terminal como DSL concreto.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (tres roles del código) del survey
- [ ] Entiendo la diferencia entre chat descartable y artefacto persistente versionado
- [ ] Sé cuándo generar un workflow/skill (patrón repetido, >5 turnos) y cuándo no
- [ ] Anoté 1 workflow YAML o DSL para generar en `workflows/` esta semana
- [ ] Link del survey guardado en favoritos / Zotero

*Generado para sección Papers — 06 Skills · opencode-remote-android*
