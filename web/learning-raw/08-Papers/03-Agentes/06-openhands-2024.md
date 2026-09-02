# OpenHands (OpenDevin) — Plataforma para agentes generalistas (Wang et al., 2024)

> **Autores:** Wang, Zhou, Xu et al. / All Hands AI (ex OpenDevin)
> **Año:** 2024 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2407.16741](https://arxiv.org/abs/2407.16741)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio · **Versión:** arXiv 2407.16741

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper original:** OpenHands: An Open Platform for AI Code Agents as Software Developers (Wang et al., 2024) — https://arxiv.org/abs/2407.16741 · Code: https://github.com/All-Hands-AI/OpenHands
> **Relevancia para opencode-remote-android:** es el espejo de tu `desktop-app` Rust + `ptyx :4849` + `fsx`/`gitx` + `external_router`: muestra cómo pasar de "terminal suelta" a plataforma con sandbox, event stream tipado y eval unificada — y por qué runtime + observability importan tanto como el modelo.
> **Prioridad:** Muy recomendado — *si tu agente toca bash, este paper es tu checklist.*

## 1 Introducción — Qué problema resuelve

Cada paper de agentes propone un harness distinto, con su propio runtime, sus propias tools y su propia forma de medir. Resultado: nadie compara contra nadie y nadie sabe qué parte del sistema importa. OpenHands (antes OpenDevin) ataca eso de raíz: **una plataforma abierta donde el LLM tiene bash + browser + editor en un sandbox Docker, todo evento es tipado y el mismo harness se evalúa en 15 benchmarks** (SWE-bench, GAIA, ML-Bench, etc.).

La tesis es simple y te interpela directo: **el runtime y la observabilidad son tan críticos como el modelo**. Un GPT-4 con bash mal sandboxeado y logs crudos rinde peor que un modelo menor con buen event stream y buen eval. Para vos, que hoy le das al agente `ptyx :4849` directo sobre el host, `fsx` sin sandbox y logs de terminal crudos, OpenHands te muestra el delta entre "funciona en demo" y "funciona en producción".

## 2 Ideas clave

### 2.1 Runtime Docker por sesión — Aislar o sufrir

Cada sesión de OpenHands corre en un **contenedor Docker efímero** con filesystem, procesos y red aislados. El agente puede `pip install`, `rm -rf`, `git reset --hard` sin tocar el host. Al terminar (o al fallar), el contenedor se descarta o se hace rollback a snapshot.

```
Host (tu máquina)
 └─ Docker sandbox por sesión
     ├─ bash (ptyx aislado)
     ├─ file editor (fsx aislado)
     ├─ browser (headless)
     └─ git (repo clonado)
```

Sin esto, un `rm -rf /tmp` del agente borra tu `opencode.db` o tu `web/dist`. Tu `ptyx :4849` hoy no tiene este aislamiento.

### 2.2 Event Stream tipado — No más log crudo

Cada acción y observación es un **evento tipado**, no texto libre:

```ts
type OHEvent =
  | { type: "action:run"; command: string; thought: string }
  | { type: "action:read"; path: string }
  | { type: "action:write"; path: string; content: string }
  | { type: "action:browse"; url: string }
  | { type: "observation:run"; exitCode: number; stdout: string; stderr: string }
  | { type: "observation:read"; content: string }
  | { type: "observation:error"; message: string };
```

Esto permite: replay determinista, filtrado por tipo, métricas por tool, y debugging sin reproducir el LLM. Tu SSE hoy filtra `subagentTaskPart` pero el resto es log crudo de terminal — OpenHands te muestra cómo tiparlo.

### 2.3 AgentSkills — Tools como librería versionada

OpenHands empaqueta capacidades como **AgentSkills** (no confundir con tus Skills): `execute_bash`, `str_replace_editor`, `browser`, cada una con schema y validación. Es el equivalente a tu `external_router` pero con contrato tipado y versionado.

### 2.4 Eval unificada — 15 benchmarks, un harness

El mismo agente, mismo runtime, mismos eventos, evaluado en SWE-bench, GAIA, ML-Bench, etc. Sin eval unificada, cada paper reporta su benchmark favorito y es imposible comparar. OpenHands publica tablas comparables y demuestra que **cambiar el runtime (ej: agregar browser) mueve más la métrica que cambiar el modelo**.

## 3 Evidencia / Experimentos

| Benchmark | OpenHands (GPT-4o) | SWE-Agent | AutoGPT | Observación |
|---|:---:|:---:|:---:|---|
| **SWE-bench Lite (300 tasks)** | **26.0%** resolved | 18.0% | ~5% | +44% sobre SWE-Agent con mismo modelo |
| **SWE-bench Verified** | ~32% (con Claude 3.5) | ~26% | — | SOTA open-source al momento del paper |
| **GAIA (general assistant)** | 32.1% | — | 16% | browser + bash superan solo-bash |
| **ML-Bench** | 42.8% | — | — | demuestra generalización más allá de code |
| **Ablation sin sandbox** | — | — | — | sin Docker, 15% de runs corrompen host/repo |
| **Ablation sin event stream** | debugging 3× más lento | — | — | log crudo vs eventos tipados |

Setup: Docker sandbox por task, GPT-4o / Claude 3.5 Sonnet, max 100 turns, event stream completo. El paper enfatiza que la ganancia de 26% → 32% en SWE-bench Verified vino de **mejorar el harness** (mejor editor, mejor manejo de errores) sin cambiar el modelo.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo usás / cómo implementarlo en el repo |
|---|---|
| **Docker sandbox por sesión** | Tu `ptyx :4849` + `fsx` + `gitx` hoy corren sobre el host. Riesgo: `rm -rf`, `git reset --hard`, `pip install` contaminan. Implementá al menos `dry-run` mode o `allowlist` de comandos; ideal: Docker por sesión con `web/dist` y `opencode.db` montados read-only. |
| **Event stream tipado** | En `web/src/shared/sse/handler.ts`, tipá cada `message.part.delta` como `OHEvent` con `type` discriminado. No más `console.log(stdout)` crudo: cada `tool_call` y `tool_result` debe ser un evento con `tool`, `args`, `exitCode`, `stdout`, `stderr`. |
| **AgentSkills como contrato** | Tu `external_router.rs` con `probe()` y `ureq` ya es una skill; formalizá cada tool (`ptyx.exec`, `fs.read`, `fs.write`, `external.*`) con schema Zod y validación previa. Ver `desktop-app/src/infrastructure/http/*_router.rs`. |
| **Eval harness unificado** | Replicá su eval: corre tu agente (vía `opencode serve :4097`) sobre 20 tasks de SWE-bench Lite y medí `resolved %`. Compará contra OpenHands publicado. Es la única forma honesta de saber si tu ACI/harness mejora o empeora. |
| **`opencode-stats :8765`** | Usa el event stream para alimentar `opencode-stats`: cada evento tipado es una fila en `opencode.db` queryable. Triple-GPU + eventos tipados = dashboard real de qué hace el agente, no solo logs. |
| **Observability** | Cada evento con `timestamp`, `sessionId`, `turn`, `tool`, `latency`. Con eso podés graficar p95 por tool, tasa de error por comando y costo por sesión — lo que hoy no tenés con log crudo. |

```rs
// desktop-app/src/infrastructure/http/sandbox.rs — esbozo sandbox por sesión
pub struct SessionSandbox {
  container_id: String, // Docker container efímero
  workspace: PathBuf,   // mount read-write aislado
}
impl SessionSandbox {
  pub fn spawn(session_id: &str) -> Result<Self> {
    // docker run --rm -v workspace:/workspace --network=bridge sandbox:latest
    // ptyx :4849 ahora habla con el container, no con el host
    todo!("spawn docker + wire ptyx")
  }
}

// web/src/shared/sse/handler.ts — event stream tipado
type AgentEvent =
  | { type: "action:run"; command: string; thought: string }
  | { type: "observation:run"; exitCode: number; stdout: string; stderr: string }
  | { type: "action:read"; path: string }
  | { type: "observation:read"; content: string };
function handleSSE(event: AgentEvent) {
  // switch exhaustivo por type — no más if (msg.includes("error"))
  switch (event.type) {
    case "action:run": logToolCall(event); break;
    case "observation:run": logToolResult(event); break;
  }
}
```

## 5 Anti-patterns / Limitaciones

- **Bash sin sandbox en host.** Es el riesgo #1 de tu `ptyx :4849` actual. Un agente que hace `rm -rf /tmp` o `git clean -fdx` en el repo equivocado borra artefactos reales. OpenHands lo resuelve con Docker; vos al menos necesitás `allowlist` + `dry-run` + confirmación para comandos destructivos.
- **Log crudo sin tipado.** Si tu observabilidad es `console.log(stdout)` y `grep "error"`, no podés filtrar por tool, medir latencia por comando ni replayar. Event stream tipado no es lujo: es debugging.
- **Evaluar solo en tu benchmark favorito.** Reportar solo HumanEval y ignorar SWE-bench/GAIA es cherry-picking. OpenHands evalúa en 15 benchmarks con el mismo harness; vos al menos medí SWE-bench Lite (20 tasks) para tener baseline honesto.
- **Confundir plataforma con modelo.** Cambiar de GPT-4o a Claude 3.5 mueve menos la métrica que mejorar el editor o el manejo de errores del harness. Invertí en runtime antes de pagar modelo más caro.
- **Overhead de Docker en mobile/desktop.** Docker por sesión es pesado para APK o `desktop-app` en Windows. Alternativa pragmática: `ptyx` con `cwd` aislado + `fsx` con `allowlist` de paths + snapshot de `git stash` antes de cada task.

## 6 Ejercicios prácticos (en tu repo)

1. **Dockeriza tu `ptyx`.** Creá un `Dockerfile` mínimo con `node`, `rust`, `git` y montá `web/` read-write aislado. Hacé que `ptyx :4849` hable con el container en lugar del host. Corré 5 tasks de SWE-bench Lite y medí cuántos `rm -rf` / `git reset` ya no rompen el host.

2. **Tipá tu SSE como event stream.** En `web/src/shared/sse/handler.ts`, definí `type AgentEvent` discriminado y mapeá cada `message.part.delta` a un evento tipado con `tool`, `args`, `exitCode`, `stdout`. Agregá un panel "Event Stream" en `DesktopPanelRenderer` que filtre por tipo y mida p95 por tool.

3. **Eval harness de 20 tasks.** Cloná 20 issues de SWE-bench Lite, corre tu agente (`opencode serve :4097` + `ptyx`) y medí `resolved %` (test del repo pasa tras el fix). Compará contra 26% de OpenHands/GPT-4o. ¿Tu ACI está por encima o debajo? ¿Qué tool falla más?

## 7 Referencias

- **Paper:** Wang et al., *OpenHands: An Open Platform for AI Code Agents as Software Developers*, 2024 — https://arxiv.org/abs/2407.16741 · PDF: https://arxiv.org/pdf/2407.16741
- **Código:** https://github.com/All-Hands-AI/OpenHands (ex OpenDevin) · Docs: https://docs.all-hands.dev
- **Benchmarks:** SWE-bench (Jimenez et al. 2023), GAIA (Mialon et al. 2023), ML-Bench — ver carpeta `05-Evaluacion`.
- **Relacionados en esta serie:** SWE-Agent (Yang et al. 2024) para ACI, AIDE (Jiang et al. 2025) para búsqueda en árbol, Building Effective Agents (Anthropic 2024) para workflows.
- **Para profundizar:** *SWE-bench Verified* — subset curado donde OpenHands marca SOTA open-source.

---

## Checklist de lectura

- [ ] Leí abstract, Fig. 1 y Tabla 1 (SWE-bench) del paper original
- [ ] Entiendo por qué Docker + event stream importan más que el modelo
- [ ] Puedo explicar log crudo vs event stream con ejemplo
- [ ] Anoté 1 mejora para `ptyx :4849` / `handler.ts` esta semana
- [ ] Link guardado en favoritos / Zotero
*Generado para sección Papers — 03 Agentes · opencode-remote-android*
