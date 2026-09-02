# CrewAI — Orquestación multi-agente por roles (Moura, 2024)

> **Autores:** João Moura / CrewAI Inc.
> **Año:** 2024 · **Prioridad:** Media P1 · **Lectura:** ~12 min
> **Link verificado:** [https://github.com/crewAIInc/crewAI](https://github.com/crewAIInc/crewAI)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio · **Versión:** Framework docs 2024 (sin arXiv)

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé los docs originales para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Guía original:** CrewAI: Framework for Orchestrating Role-Playing Autonomous AI Agents (Moura, 2024) — https://github.com/crewAIInc/crewAI · Docs: https://docs.crewai.com
> **Relevancia para opencode-remote-android:** es el tercer vértice del triángulo multi-agente (AutoGen = chat libre, MetaGPT = SOPs, CrewAI = role-play): te muestra cómo orquestar subagentes con `role/goal/backstory` + `tasks` con `expected_output` y cuándo ese estilo le gana a los otros dos en tu harness.
> **Prioridad:** Media P1 — *el orquestador ligero que podés probar hoy.*
> **Nota:** CrewAI no tiene paper arXiv; es framework open-source (20k+ stars). Esta ficha destila sus docs y patrones vs literatura.

## 1 Introducción — Qué problema resuelve

AutoGen te da chat libre entre agentes y MetaGPT te da SOPs rígidos con artefactos. Ambos son potentes pero verbosos para tareas donde simplemente querés **"un Product Manager, un Developer y un QA que colaboren, cada uno con su personalidad y su objetivo claro"**. CrewAI ocupa ese hueco: **orquestación multi-agente por roles con configuración declarativa mínima**.

Definís agentes con `role`, `goal`, `backstory` y `tools`; definís tasks con `description`, `expected_output` y `agent`; armás un `Crew` con `process: sequential | hierarchical` y lo ejecutás. Sin message pool, sin GroupChatManager, sin artefactos Zod — solo roles y tasks. Para vos, que querés probar multi-agente en `opencode-remote-android` sin reescribir todo tu harness, CrewAI es el experimento de menor fricción: podés modelar `session → task → subagent` como un Crew en una tarde y medir si supera a single-agent.

## 2 Ideas clave

### 2.1 Agente = Role + Goal + Backstory + Tools

```python
from crewai import Agent, Task, Crew

researcher = Agent(
  role="Senior Research Analyst",
  goal="Uncover cutting-edge developments in {topic}",
  backstory="You are an expert analyst known for deep insights.",
  tools=[search_tool, scrape_tool],
  llm="gpt-4o",
  verbose=True,
)
writer = Agent(
  role="Tech Content Strategist",
  goal="Craft compelling content on {topic}",
  backstory="You are a renowned content strategist.",
  tools=[write_tool],
)
```

| Campo | Qué hace | Por qué importa |
|---|---|---|
| **role** | Define identidad y expertise ("QA Engineer", "Rust Specialist") | El LLM adopta el rol y filtra qué sabe/hace |
| **goal** | Objetivo concreto del agente | Evita que el agente divague fuera de su misión |
| **backstory** | Contexto narrativo que da personalidad | Mejora coherencia y tono sin prompt engineering manual |
| **tools** | Lista de tools disponibles (search, exec, file) | Cada agente solo ve sus tools — no todos ven todo |
| **llm** | Modelo por agente (puede ser distinto) | Podés usar GPT-4 para Architect y GPT-3.5 para QA |

### 2.2 Task = Description + Expected Output + Agent

```python
research_task = Task(description="Research {topic}", expected_output="5 findings con fuentes.", agent=researcher)
write_task = Task(description="Write blog post", expected_output="3 párrafos markdown.", agent=writer, context=[research_task])
```

`expected_output` es el contrato liviano (vs schema Zod en MetaGPT): guía al LLM y hace el output evaluable.

### 2.3 Crew + Process — Sequential vs Hierarchical

```python
crew = Crew(agents=[researcher, writer], tasks=[research_task, write_task], process="sequential", verbose=True)
result = crew.kickoff(inputs={"topic": "AI Agents"})
```

| Process | Cómo funciona | Cuándo usarlo |
|---|---|---|
| **sequential** | Orden fijo, cada task ve outputs previos vía `context` | Pipeline determinista `PM → Dev → QA` (tu `kanban`) |
| **hierarchical** | `manager_llm` crea/asigna tasks dinámicamente | Tareas sin pasos predecibles (orchestrator-workers) |

## 3 Evidencia / Experimentos

CrewAI no publica benchmarks académicos (HumanEval, SWE-bench). Su evidencia es **adopción**:

| Señal | Valor | Interpretación |
|---|:---:|---|
| **GitHub stars** | 20k+ (2024) | Adopción masiva sin paper |
| **Casos reportados** | Research → Write, Support, Code Review | Gana donde role-play importa |
| **vs AutoGen** | ~30% menos código (sequential) | Menos boilerplate |
| **vs MetaGPT** | Más flexible, menos riguroso | Sin validación de artefactos |
| **Costo** | N agents × M tasks | Similar a AutoGen; hierarchical + manager LLM |

Sin benchmarks formales no podés afirmar "CrewAI > AutoGen en SWE-bench" — su valor es ergonomía, no SOTA.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo usás / cómo implementarlo en el repo |
|---|---|
| **Role-play por agente** | En lugar de un solo `opencode serve` genérico, definí subagentes con roles: `Researcher` (busca en `opencode.db` vía `opencode-stats :8765`), `Engineer` (edita vía `ptyx :4849` + `fsx`), `QA` (corre `tsc -b && cargo check`). Cada uno con `goal` y `tools` distintos. |
| **Task con expected_output** | Cada tarjeta de `kanban.json` es una Task CrewAI: `description` = qué hacer, `expected_output` = criterio de Done, `agent` = quién la hace, `context` = outputs de tasks previas. Validá `expected_output` con heurística o LLM judge. |
| **Sequential para kanban** | `kanban` columnas `Todo → Doing → Review → Done` mapean a `Crew sequential`: cada task ve el output de la anterior. Es tu SOP liviano sin el overhead de MetaGPT. |
| **Hierarchical para exploración** | Para "investigá este bug sin spec", usá `hierarchical` con un `manager_llm` que cree sub-tasks dinámicamente y asigne a `Engineer`/`QA`. Es orchestrator-workers (Anthropic) con sintaxis CrewAI. |
| **Tools por agente (no global)** | Hoy tus tools (`ptyx`, `fsx`, `external_router`) son globales. Con CrewAI, `Researcher` solo ve `opencode-stats`, `Engineer` solo ve `ptyx+fsx`, `QA` solo ve `cargo check`. Reduce superficie de error y tokens. |
| **Prototipado rápido** | Antes de implementar SOPs completos (MetaGPT) o GroupChat (AutoGen), probá CrewAI como orquestador-workers ligero en `web/src/features/crew/` y medí si supera a single-agent en tu task real. |

```ts
// web/src/features/crew/crew.ts — CrewAI style en tu harness (TS)
type AgentDef = { role: string; goal: string; backstory: string; tools: string[]; model: string };
type TaskDef = { description: string; expectedOutput: string; agent: string; context?: string[] };

const crew = {
  agents: [
    { role: "Rust Specialist", goal: "Fix desktop-app bugs", backstory: "Expert in Rust + wry + hyper", tools: ["ptyx", "fsx", "cargo"], model: "gpt-4o" },
    { role: "QA Engineer", goal: "Verify fixes pass checks", backstory: "Strict QA, no fix without green tests", tools: ["cargo_check", "tsc"], model: "gpt-4o-mini" },
  ],
  tasks: [
    { description: "Fix probe() timeout in external_router.rs:19", expectedOutput: "Diff that makes probe pass in <250ms", agent: "Rust Specialist" },
    { description: "Verify fix with cargo check && cargo test", expectedOutput: "All checks green, no regressions", agent: "QA Engineer", context: ["Fix probe() timeout"] },
  ],
  process: "sequential" as const,
};
// Cada task ve outputs previos vía context — sin GroupChatManager ni message pool
```

## 5 Anti-patterns / Limitaciones

- **Role-play sin tools ni expected_output.** `role="Expert"` sin tools ni contrato es overhead narrativo, no mejora.
- **CrewAI para workflow determinista.** `screenshots :3002` (capture → annotate → save) no necesita 3 agentes: necesita pipeline de 3 pasos (Anthropic).
- **Hierarchical sin límite.** Sin `max_tasks` (ej: 5), el manager crea infinitas sub-tasks y el costo se dispara.
- **Sin benchmarks formales.** No hay SWE-bench/HumanEval vs AutoGen/MetaGPT — su argumento es ergonomía, no SOTA.
- **Confundir frameworks.** AutoGen = chat libre, MetaGPT = SOPs rigurosos, CrewAI = role-play ligero. Elegí según necesites flexibilidad, rigor o simplicidad.

## 6 Ejercicios prácticos (en tu repo)

1. **Crew sequential para un bug real.** Definí 2 agentes (`Rust Specialist` + `QA Engineer`) y 2 tasks (`fix` + `verify`) para un bug de `desktop-app` (ej: `probe()` timeout). Ejecutá como Crew sequential donde QA ve el diff del Specialist y corre `cargo check`. Medí si supera a single-agent que hace fix+verify en un solo prompt.

2. **Tools por agente.** Restringí cada agente a sus tools: `Researcher` solo ve `opencode-stats :8765`, `Engineer` solo ve `ptyx+fsx`, `QA` solo ve `cargo check/tsc`. Medí si reducir tools por agente baja alucinación (ej: Engineer ya no intenta hacer queries SQL).

3. **Compará los 3 frameworks en tu task.** Tomá una feature pequeña y resolvela 3 veces: con AutoGen (chat libre), con MetaGPT (SOPs + artefactos Zod) y con CrewAI (roles + tasks). Medí `pass rate` (¿compila y pasa tests?), `tokens` y `tiempo`. ¿Cuál gana en tu codebase real? Documentá el tradeoff.

## 7 Referencias

- **Framework:** Moura, *CrewAI: Framework for Orchestrating Role-Playing Autonomous AI Agents*, 2024 — https://github.com/crewAIInc/crewAI · Docs: https://docs.crewai.com · Ejemplos: https://github.com/crewAIInc/crewAI-examples
- **Relacionados en esta serie:** AutoGen (Wu et al. 2023) para chat libre, MetaGPT (Hong et al. 2023) para SOPs, Building Effective Agents (Anthropic 2024) para workflows vs agentes.
- **Para profundizar:** *LangGraph* (LangChain) — alternativa con grafos explícitos; *OpenHands* (Wang et al. 2024) para runtime con sandbox.

---

## Checklist de lectura

- [ ] Leí docs CrewAI (Agents, Tasks, Crew) y entiendo sequential vs hierarchical
- [ ] Puedo explicar CrewAI vs AutoGen vs MetaGPT en 2 minutos
- [ ] Definí 2 agentes con role/goal/tools para task real
- [ ] Anoté 1 experimento CrewAI para `kanban` / `ptyx` esta semana
- [ ] Link guardado en favoritos / Zotero
*Generado para sección Papers — 03 Agentes · opencode-remote-android*
