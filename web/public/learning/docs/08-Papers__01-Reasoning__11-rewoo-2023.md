# ReWOO — Razonar sin observar, ejecutar en batch (Xu et al., 2023)

> **Autores:** Xu, Liu, Yu, Li, Cao / University of Illinois + Salesforce Research
> **Año:** 2023 · **Prioridad:** MEDIA P1 · **Lectura:** ~13 min
> **Link verificado:** [https://arxiv.org/abs/2305.18323](https://arxiv.org/abs/2305.18323)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** arXiv 2023-05-27

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** ReWOO: Decoupling Reasoning from Observations (Xu, Liu, Yu, Li, Cao, 2023).
> **Link:** https://arxiv.org/abs/2305.18323
> **Relevancia para opencode-remote-android:** ataca tu dolor principal como thin client con latencia alta: ReAct hace `Thought → Action → Observation` secuencial (1 round-trip por tool), ReWOO genera **todo el plan con placeholders** sin esperar observations y luego ejecuta todas las tools en batch. Para `polling 3.5s` y `ptyx :4849` con RTT alto, es ahorro directo de tokens y tiempo.
> **Prioridad:** MEDIA P1 · **Nuevo vs ReAct:** ReAct intercala; ReWOO desacopla — planifica todo primero, ejecuta después.

## 1 Introducción — Qué problema resuelve

ReAct es potente pero caro en un thin client con latencia:

```
ReAct (secuencial, 3 tools):
  Turn 1: Thought → Action(fs.read A) → Observation(A)     [RTT 1]
  Turn 2: Thought → Action(fs.read B) → Observation(B)     [RTT 2]
  Turn 3: Thought → Action(fs.read C) → Observation(C)     [RTT 3]
  Total: 3 RTT × 3.5s polling = ~10.5s + 3× tokens de Thought
```

Cada `Observation` vuelve al LLM antes del próximo `Thought` — pagás tokens y latencia por cada tool. Si las 3 lecturas son independientes (no dependen entre sí), ¿por qué no pedirlas todas de una vez?

ReWOO hace exactamente eso: el LLM genera un **plan completo** con razonamiento y tool calls con **placeholders** (`#E1`, `#E2`) sin ver ninguna observation. Luego un **Worker** ejecuta todas las tools en batch (paralelo), y finalmente un **Solver** combina el plan + observations para dar la respuesta. Resultado: **5× menos tokens** y **43% menos latencia** en HotpotQA vs ReAct, con igual o mejor accuracy.

## 2 Ideas clave

### 2.1 Tres módulos — Planner, Worker, Solver

```
┌──────────┐    plan con        ┌────────┐   tool calls    ┌────────┐
│ Planner  │ ────────────────► │ Worker │ ──────────────► │ Solver │
│  (LLM)   │  #E1, #E2, #E3    │(tools) │  obs #E1,#E2,#E3│  (LLM) │
└──────────┘                    └────────┘                  └────────┘
     │                              │                          │
  Solo LLM,                    Ejecuta en                Combina plan
  sin tools                    batch/paralelo            + observations
                                                          → respuesta
```

**Planner (LLM):** genera `Plan: Step 1... Step 2...` + `Evidence: #E1 = fs.read(A), #E2 = fs.read(B)` — sin ejecutar nada, solo declara qué necesita.

**Worker (harness):** ejecuta todas las evidences `#E1..#En` en batch. En tu caso: `Promise.all([fs.read(A), fs.read(B), fs.read(C)])` o batch `ptyx` calls.

**Solver (LLM):** recibe `Plan + Evidence results` y genera la respuesta final. Es una sola llamada LLM más, no un loop.

### 2.2 Placeholders — La clave del desacoplo

En lugar de `Action: fs.read("A") → Observation: "..."` intercalado, ReWOO usa variables:

```
Plan:
  1. Necesito el contenido de manifest.json para ver qué docs existen
  2. Necesito el contenido de 01-attention.md para resumirlo
  3. Con ambos, genero el índice

Evidence:
  #E1 = shell.fs.read({"path": "web/public/learning/manifest.json"})
  #E2 = shell.fs.read({"path": "web/public/learning/01-attention.md"})
```

El Planner no ve `#E1` ni `#E2` al planificar — asume qué necesitará. Si asume mal (ej: necesita un archivo que no existe), el Worker devuelve error y el Solver lo maneja.

### 2.3 Cuándo ReWOO gana y cuándo no

| Escenario | ReWOO | ReAct |
|---|:---:|:---:|
| **Tools independientes** (3 reads paralelizables) | **Gana** — 1 Planner + batch Worker + 1 Solver = 2 LLM calls | 3+ LLM calls secuenciales |
| **Tools dependientes** (read → depende de ls previo) | **Pierde** — el Planner no puede saber qué leer sin ver `ls` | **Gana** — ve `ls` antes de decidir `read` |
| **Tareas con bifurcación** (si A existe, hacer X sino Y) | **Falla** — planifica sin saber si A existe | **Gana** — decide tras observar |

ReWOO brilla cuando el plan es predecible y las tools son independientes. ReAct gana cuando cada observation cambia el próximo paso.

### 2.4 Ahorro de tokens — 5× en el paper

En HotpotQA, ReAct usa ~2000 tokens por tarea (Thought+Action+Observation × turnos). ReWOO usa ~400 (1 Planner + 1 Solver) — **5× menos**. El ahorro viene de no reinyectar `Observation` en cada turno intermedio.

## 3 Evidencia / Experimentos

| Benchmark | ReAct (GPT-3.5) | ReWOO (GPT-3.5) | Tokens ReWOO vs ReAct |
|---|:---:|:---:|:---:|
| **HotpotQA** (EM) | 30.1% | **32.4%** | **43% menos** |
| **TriviaQA** | 58.2% | **60.1%** | ~40% menos |
| **StrategyQA** | 64.3% | **65.8%** | ~35% menos |
| **HotpotQA** (GPT-4) | 35.0% | **36.2%** | 5× menos tokens |

- **Accuracy igual o mejor:** ReWOO no sacrifica calidad — incluso gana levemente porque el Planner ve el panorama completo sin distraerse con observations intermedias.
- **Tokens 5× menos (GPT-4):** con modelo caro, el ahorro es directo en guita.
- **Latencia 43% menos:** al batch tools en paralelo vs secuencial.
- **Ablation sin Solver:** si el Planner genera la respuesta directo sin Solver, cae ~8pp — el Solver que combina plan + evidences es esencial.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto ReWOO | Dónde lo aplicás en el repo |
|---|---|
| **Batch de `fs.read` / `fs.ls`** | Tarea: "resumí 3 docs de `web/public/learning/`". En lugar de ReAct secuencial (3 turnos), ReWOO: `Planner → #E1=read(A), #E2=read(B), #E3=read(C) → Worker batch Promise.all → Solver resume`. Un solo round de planning, un batch de I/O, un Solver. |
| **`ptyx :4849` batch** | Para `cargo check` + `tsc -b` + `cargo clippy`, no los corras secuencial ReAct. ReWOO: `#E1=cargo check, #E2=tsc -b, #E3=clippy` → Worker ejecuta los 3 en `ptyx` en paralelo (si son independientes) → Solver diagnostica. |
| **`external_router` con `probe` 250ms** | Tus 5 plugins externos (`opendesign 3000`, `screenshots 3002`, etc.) tienen `probe()` TCP 250ms + `ureq 1800/700ms`. ReWOO puede batch `probe` de los 5 en paralelo en el Worker, en lugar de ReAct secuencial que haría 5 RTT. |
| **Polling 3.5s y SSE** | Cada turno ReAct paga un `polling 3.5s` si el SSE se corta. ReWOO reduce de N turnos a 2 (Planner + Solver) — menos exposición a polling y reconexión. Para thin client con red inestable, es ganancia de robustez además de latencia. |
| **IndexedDB v2 — cache de evidences** | Guardá las evidences `#E1..#En` y sus observations en IndexedDB junto a la sesión. Si el Solver falla, podés re-ejecutar solo el Solver con las mismas evidences sin re-llamar al Planner ni al Worker. |
| **Híbrido ReWOO + ReAct** | No es todo o nada. Para tareas mixtas: usá ReWOO para el batch inicial de reads independientes, luego ReAct para los pasos dependientes. Ej: `ReWOO batch: ls + read manifest → ReAct: decide qué docs leer según manifest → ReWOO batch: read 3 docs → Solver`. |

```ts
// web/src/shared/api/rewoo.ts — bosquejo Planner→Worker→Solver
type Evidence = { id: string; tool: string; input: Record<string, unknown> };

async function rewoo(task: string): Promise<string> {
  // 1. Planner — LLM genera plan + evidences con placeholders
  const plan = await callLLM(`Task: ${task}\nGenerá un plan paso a paso y listá las evidences necesarias como #E1, #E2... con tool calls. No ejecutes, solo declara.`);
  const evidences: Evidence[] = parseEvidences(plan); // extrae #E1 = shell.fs.read(...)

  // 2. Worker — ejecuta todas en batch (paralelo)
  const results = await Promise.all(
    evidences.map(e => callTool(e.tool, e.input).catch(err => ({ error: String(err) })))
  );
  const evidenceBlock = evidences.map((e, i) => `${e.id} = ${JSON.stringify(results[i])}`).join("\n");

  // 3. Solver — LLM combina plan + evidences → respuesta
  const answer = await callLLM(`Plan:\n${plan}\n\nEvidences:\n${evidenceBlock}\n\nCon esta info, resolvé la tarea.`);
  return answer;
}
```

## 5 Anti-patterns / Limitaciones

- **No uses ReWOO si cada tool depende de la anterior.** Si necesitás `ls` para saber qué `read` hacer, el Planner no puede adivinar los paths sin ver `ls`. En ese caso ReAct es correcto — ReWOO generaría `#E1 = read(archivo_que_no_existe)`. Detectá dependencia: si el plan tiene "si X existe, hacer Y", es ReAct, no ReWOO.
- **Planner alucina evidences.** El LLM puede declarar `#E3 = read(archivo_inexistente)` porque asume que existe. El Worker debe manejar `ENOENT` y el Solver debe decir "no se encontró X, no puedo completar". No asumas que todas las evidences existen.
- **Solver sin plan es solo QA.** Si el Planner es malo, el Solver recibe un plan incoherente y falla aunque las evidences sean correctas. La calidad del Planner es crítica — necesita buenos few-shot examples.
- **No reemplaza ReAct, lo complementa.** El paper no dice "ReWOO > ReAct siempre". Dice "ReWOO > ReAct cuando las tools son independientes". Para tu harness, la decisión es: ¿puedo batch? → ReWOO. ¿Necesito ver observation para decidir próximo paso? → ReAct.
- **Evidences con side effects no son batchables.** `fs.write`, `fs.move`, `ptyx` con `cargo build` tienen side effects y orden. No los batchees en paralelo — ejecutalos secuencial incluso en ReWOO. Solo batchea reads/probes/checks idempotentes.

## 6 Ejercicios prácticos (en tu repo)

1. **Implementá ReWOO para batch de `fs.read` y medí vs ReAct.** Tarea: "leé 3 archivos de `web/src/shared/` y resumí qué hacen". Implementá `rewoo()` con Planner (1 LLM call) → Worker (`Promise.all` de 3 `shell.fs.read`) → Solver (1 LLM call). Compará contra ReAct secuencial (3 turnos) en `tokens usados`, `latencia` y `calidad del resumen`. ¿Se replica el 5× ahorro y 43% latencia?

2. **Detectá cuándo ReWOO falla por dependencia.** Diseñá una tarea dependiente: `"listá web/src/features/ y leé el archivo más grande"`. Corré ReWOO (Planner debe adivinar el archivo sin ver `ls`) vs ReAct (ve `ls` antes de `read`). ¿ReWOO falla? Implementá un híbrido: ReWOO para `ls` → ReAct para `read` del más grande. Documentá la regla de decisión.

3. **Batch de `probe` para `external_router`.** Modificá `desktop-app/src/infrastructure/http/external_router.rs` o el caller en `web/src` para que el health-check de los 5 plugins (`opendesign 3000`, `screenshots 3002`, `vioeditor 1420`, `informes 5174`, `widgetnotas`) use patrón ReWOO: Planner declara qué probes necesita, Worker hace `probe()` TCP 250ms en paralelo con `Promise.all`, Solver decide qué plugins están UP. Medí latencia vs probes secuenciales.

## 7 Referencias

- **Paper:** Xu et al., *ReWOO: Decoupling Reasoning from Observations*, 2023-05-27 — https://arxiv.org/abs/2305.18323
- **Base ReAct:** Yao et al., *ReAct* (2210.03629) — ReWOO desacopla el loop ReAct.
- **Relacionado:** PAL (2211.10435) — también desacopla cómputo de razonamiento; LLM+P (2304.11477) — delega planning a solver óptimo, alternativa a ReWOO para tareas deterministas.
- **Batch en tu repo:** `external_router.rs:19` `probe()` + `cached_probe OnceLock 1500ms` — ya hace batch con `ureq` timeouts diferenciados.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (diagrama Planner→Worker→Solver) del paper original
- [ ] Entiendo la diferencia entre ReWOO (desacoplado, batch) y ReAct (intercalado, secuencial)
- [ ] Sé cuándo usar ReWOO (tools independientes) vs ReAct (tools dependientes) en mi harness
- [ ] Tengo claro qué evidences son batchables (reads/probes) y cuáles no (writes/moves)
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
