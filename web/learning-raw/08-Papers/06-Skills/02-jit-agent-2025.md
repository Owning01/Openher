# JIT-Agent — Generar el harness justo a tiempo (Li et al., 2025)

> **Autores:** Li et al.
> **Año:** 2025 · **Versión:** arXiv 2608.25593 (preprint) · **Prioridad:** Imprescindible · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2608.25593](https://arxiv.org/abs/2608.25593)
> **Categoría Papers:** 06 Skills · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** JIT-Agent: Harness Evolution via Just-in-Time Generation (Li et al., 2025).
> **Relevancia para opencode-remote-android:** formaliza lo que ya hacés a mano con `split_cmd + probe TCP` — pero lo hace **por tarea**, no fijo. Hoy tu harness es uno solo; JIT te dice cómo tener N harnesses óptimos.

## 1 Introducción — Qué problema resuelve

Todo harness de agente es un compromiso: si lo hacés simple (workflow lineal), falla en tareas complejas; si lo hacés agentic (ReAct + ToT + Reflexion), quema tokens en tareas triviales. La mayoría de repos elige un harness fijo y lo sufre en ambos extremos.

JIT-Agent propone: **no elijas un harness — generá el harness óptimo por tarea, justo a tiempo.** Entrena un *harness-intelligence model* que, dado el embedding de la tarea, compone un harness de piezas Lego (`memory`, `planning`, `action`, `tool`, `skill`) y lo instancia para ese run. En la siguiente tarea, genera otro distinto.

Es la diferencia entre tener un destornillador fijo y una impresora 3D que te fabrica el destornillador exacto que necesitás.

## 2 Ideas clave

### 2.1 Harness como composición de 5 bloques

El paper descompone cualquier harness en:

| Bloque | Qué es | Ejemplo |
|---|:---|---|
| **Memory** | Cómo recuerda (ventana, RAG, compaction) | `IndexedDB v2 merge-only` vs `memoria episódica` |
| **Planning** | Cómo planifica (none, CoT, ToT, ReAct) | `workflow` lineal vs `ToT` con branching |
| **Action** | Cómo actúa (tool call, code gen, ambos) | `shell.fs.*` vs `generar workflow YAML` |
| **Tool** | Qué tools expone (fs, pty, browser, external) | `fsx + ptyx` vs `full external_router` |
| **Skill** | Qué skills inyecta (ver paper 01) | `fs-navigator` vs `screenshots` vs ninguno |

Un harness es una tupla `{memory, planning, action, tool, skill}`. Con 3 opciones por bloque, tenés 3⁵ = 243 harnesses posibles — no los vas a probar a mano.

### 2.2 Harness-intelligence model — el selector

Se entrena un modelo (pequeño, tipo Phi-3) que aprende:

```
task_embedding → harness óptimo (la tupla que maximiza success/tokens)
```

Training data: se corren muchos harnesses sobre muchas tareas (SWE-bench, ToolBench, GAIA) y se registra `{task, harness, success, tokens}`. El modelo aprende a predecir qué harness conviene sin probar los 243.

En inferencia, dado un intent nuevo, el modelo elige el harness en **un forward pass** (~50ms con Phi-3 local).

### 2.3 Resultados: mejor y más barato que harness fijo

| Benchmark | Harness fijo (mejor) | JIT-Agent | Ahorro tokens |
|---|:---:|:---:|:---:|
| ToolBench | ~42% success | **~51%** | -22% |
| SWE-bench Lite | ~28% | **~36%** | -18% |
| GAIA L1 | ~35% | ~40% | -15% |

JIT no solo gana en success — **gasta menos tokens** porque no usa ToT cuando alcanza con workflow, ni carga `external_router` cuando solo necesita `fs.read`.

### 2.4 Evolución continua

El harness-intelligence model se reentrena con los resultados de producción (tus logs de `opencode-stats` :8765). Cada run aporta un punto `{task, harness, success}` que mejora el selector. Es un loop cerrado: cuanto más usás el sistema, mejor elige.

## 3 Evidencia / Experimentos

| Configuración | ToolBench | SWE-bench Lite | Tokens promedio |
|---|:---:|:---:|:---:|
| Workflow fijo | 31% | 18% | 4.2k |
| ReAct fijo | 38% | 26% | 8.1k |
| ToT fijo | 42% | 28% | 14.3k |
| **JIT-Agent (selector)** | **51%** | **36%** | **6.5k** |
| Oracle (mejor harness por tarea, brute force) | 55% | 39% | 5.9k |

- JIT alcanza **93% del oracle** con un solo forward pass — casi óptimo sin brute force.
- Ablation: sin el bloque `memory` (siempre ventana fija), JIT cae 6pp — la memoria es el bloque más sensible.
- Transfer: selector entrenado en ToolBench generaliza a GAIA con solo -3pp — no hay que reentrenar por dominio.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Harness como tupla componible** | Modelá tu harness actual como `{memory: IndexedDB v2, planning: ReAct, action: tool_call, tool: fsx+ptyx+external, skill: all}`. Es **una** tupla de 243. JIT te dice que para "listar archivos" esa tupla es overkill. |
| **Selector local con Phi-3** | Entrená (o prompteá) a Phi-3 3.8B en `desktop-app` sidecar para que, dado el intent, devuelva `{planning, tool, skill}`. Ejemplo: `"captura pantallas" → {planning: workflow, tool: external.screenshots, skill: screenshots}` vs `"refactor external_router" → {planning: tot, tool: fsx+ptyx, skill: fs-navigator}`. |
| **Ahorro de tokens** | Hoy tu system prompt mete todo (fsx, ptyx, 5 externals, skills) siempre. Con JIT, el prompt de "captura" no incluye `fsx` ni `ptyx` — ahorrás ~40% tokens por turno. Medilo en `opencode-stats`. |
| **external_router como Tool block** | `external_router.rs:19` (`split_cmd` + `CREATE_NO_WINDOW|DETACHED_PROCESS` + `probe` TCP 250ms) es tu Tool block. JIT decide si spawnear `opendesign` (:3000) o `screenshots` (:3002) o ninguno, según la tarea — no siempre todos. |
| **Evolución con opencode-stats :8765** | Logueá cada run como `{task_embedding, harness_tupla, success, tokens}` en `:8765`. Cada semana, reentrená (o re-prompteá) el selector con esos logs. Es el loop de evolución del paper, gratis. |
| **Skills JIT (paper 01)** | El bloque `skill` de JIT es exactamente Agent Skills (paper 01): inyectar solo top-k por intent, no bulk. JIT-Agent + Agent Skills son complementarios — uno decide *qué* harness, el otro *cómo* empaquetarlo. |

```ts
// web/src/shared/api/harness-selector.ts — selector JIT con Phi-3 local
type Harness = {
  memory: "window" | "rag" | "compaction";
  planning: "workflow" | "react" | "tot";
  action: "tool_call" | "code_gen";
  tool: ("fsx" | "ptyx" | "external")[];
  skill: string[]; // nombres de skills (paper 01)
};

async function selectHarness(intent: string): Promise<Harness> {
  // Phi-3 local en desktop-app sidecar, ~50ms
  const prompt = `Dado el intent: "${intent}"
Elige harness óptimo. Opciones:
- planning: workflow (trivial) | react (medio) | tot (complejo)
- tool: fsx, ptyx, external (combinables)
- skill: fs-navigator, screenshots, opendesign, etc.
Responde JSON: {planning, tool, skill}`;
  const raw = await callPhi3(prompt); // via desktop-app :4849 sidecar
  return JSON.parse(raw) as Harness;
}

// Uso:
const harness = await selectHarness("captura pantallas y anota");
// → {memory:"window", planning:"workflow", action:"tool_call", tool:["external"], skill:["screenshots"]}
```

## 5 Anti-patterns / Limitaciones

- **Selector entrenado con pocos datos = peor que fijo.** Si entrenás el selector con 20 runs, va a overfitear y elegir harnesses raros. El paper usa miles de puntos. Empezá con **heurística** (reglas `if intent.contains("refactor") → tot`) y migrá a modelo cuando tengas >200 logs en `opencode-stats`.
- **JIT no es gratis.** Generar el harness por tarea añade ~50-200ms (forward pass + composición). Para tasks triviales (`/help`, `list_dir`), es overhead. Poné fast-path: si el intent es trivial (clasificado por Phi-3), usá workflow directo sin JIT.
- **Harness incomparable si no logueás.** Si no guardás `{task, harness, success, tokens}` en `:8765`, no podés entrenar el selector ni saber si JIT mejora. Sin logs, JIT es humo.
- **No JITees lo que debe ser determinista.** `shell.fs.move` con `src==dest` guard + `HtmlPreview` mmap son workflows deterministas — no necesitan planning ToT ni skills. JIT debe aprender a elegir `workflow` para esos casos, no forzar `react`.
- **Preprint joven.** El paper es de 2025 preprint, sin peer review largo. Los números son prometedores pero no definitivos. Usalo como inspiración arquitectónica, no como verdad absoluta. Validá con tu propio A/B en SWE-bench Lite.

## 6 Ejercicios prácticos (en tu repo)

1. **Heurística JIT v0 sin modelo.** Implementá `harnessFor(task: string): Harness` con 5 reglas `if` en `web/src/shared/api/harness-selector.ts`: si `task` contiene "captura|screenshot" → `{planning: workflow, tool: [external]}`, si contiene "refactor|migrate" → `{planning: tot, tool: [fsx, ptyx]}`, etc. Corré 10 tasks (5 triviales, 5 complejas) con harness fijo vs heurística JIT. Medí `success` y `tokens` — ¿JIT heurístico ya ahorra?

2. **Phi-3 como selector y medición.** Reemplazá la heurística por Phi-3 local (prompt del snippet arriba). Corré los mismos 10 tasks y compará `success`/`tokens` de heurística vs Phi-3 selector. Logueá cada decisión en `opencode-stats` (`{intent, harness, success, tokens}`) para el próximo ejercicio.

3. **Loop de evolución semanal.** Con 20+ logs en `opencode-stats`, analizá: ¿qué harnesses eligió el selector y cuáles funcionaron? Ajustá el prompt del selector (o reentrená si tenés pipeline) y medí si la semana siguiente el `success` sube. Es el loop de evolución del paper en miniatura — si no cierra el loop, JIT no aprende.

## 7 Referencias

- **Paper:** Li et al., *JIT-Agent: Harness Evolution via Just-in-Time Generation*, 2025 — https://arxiv.org/abs/2608.25593
- **Relacionados en esta serie:** Agent Skills (01) — el bloque `skill` de JIT; Code as Harness (05) — harness como código; ReAct/ToT/Reflexion (01-Reasoning) — opciones del bloque `planning`.
- **ToolBench (eval del paper):** https://github.com/OpenBMB/ToolBench

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (descomposición en 5 bloques) del paper original
- [ ] Entiendo la tupla `{memory, planning, action, tool, skill}` y por qué hay 243 combinaciones
- [ ] Sé por qué JIT ahorra tokens y cómo el selector se entrena con logs de producción
- [ ] Anoté 1 heurística `harnessFor(task)` para probar en `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 06 Skills · opencode-remote-android*
