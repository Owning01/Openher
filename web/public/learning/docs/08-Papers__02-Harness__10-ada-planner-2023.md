# AdaPlanner — Planificación adaptativa con feedback del entorno (Sun et al., 2023)

> **Paper:** AdaPlanner: Adaptive Planning from Feedback with Language Models — Sun et al., NeurIPS 2023
> **Versión:** v2 · **Año:** 2023 · **Autores:** Haotian Sun, Yuchen Zhuang, Lingkai Kong, Bo Dai, Chao Zhang / Georgia Tech & Microsoft
> **Link:** [https://arxiv.org/abs/2305.16653](https://arxiv.org/abs/2305.16653)
> **Prioridad:** MEDIA P1 · **Nivel:** Intermedio · **Lectura:** ~13 min

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

## 1. Introducción

AdaPlanner ataca el problema más frustrante de los agentes LLM: **generan un plan, lo ejecutan, algo falla y se quedan sin saber qué hacer**. ReAct reacciona paso a paso pero sin plan global; plan-and-execute genera un plan pero no lo adapta. AdaPlanner combina ambos: genera un plan explícito, lo ejecuta, y cuando el entorno devuelve error usa dos mecanismos de refinamiento — **in-context refining** (re-planifica dentro del mismo episodio con el feedback) y **out-of-context refining** (guarda la experiencia en una skill library y la recupera en episodios futuros).

El resultado es +7% sobre ReAct en AlfWorld y tareas de razonamiento con entorno, sin entrenar el LLM — solo con prompting y memoria. La clave es que el plan no es descartable: es un artefacto que se revisa, se corrige y se acumula como skill reutilizable.

Para opencode-remote-android esto modela exactamente tu flujo `ptyx WS :4849`: el agente genera un plan `view→edit→lint→run`, `cargo check` falla, y en vez de reintentar a ciegas, AdaPlanner re-planifica con el error como contexto y guarda el patrón "si edit rompe lint en api.rs, revisar imports" como skill en IndexedDB.

## 2. Ideas clave

| Idea | Qué significa | Diferencia con ReAct |
|---|---|---|
| **Plan explícito inicial** | LLM genera `plan = [step1, step2, ...]` antes de actuar | ReAct actúa sin plan global; AdaPlanner planifica primero |
| **In-context refining** | Si `step_k` falla, LLM re-planifica `plan[k:]` con el feedback del entorno | ReAct solo reacciona al último error sin revisar el plan |
| **Out-of-context refining** | Experiencias (plan + error + fix) se guardan como skills y se recuperan por similitud | ReAct no tiene memoria entre episodios |
| **Skill library** | Colección de skills `distilled` de episodios pasados, rankeadas por relevancia | Análogo a Reflexion pero con plan estructurado, no solo texto |
| **Closed-loop** | Cada acción del plan se ejecuta y su observación alimenta el refinamiento | Open-loop (plan-and-execute) ejecuta todo sin chequear |

```
ReAct:        intent → act → obs → act → obs → ...  (sin plan, reactivo puro)
Plan-Execute: intent → plan [A,B,C] → exec A → exec B → exec C → (si B falla, igual intenta C)
AdaPlanner:   intent → plan [A,B,C] → exec A → exec B → FAIL → in-context refine [B',C'] → exec B' → ok → exec C'
                                    → guarda (plan, fail, fix) como skill para próximo episodio
```

```python
# Pseudocódigo AdaPlanner (simplificado)
plan = llm.generate_plan(intent, skills=retrieved_skills)

for i, step in enumerate(plan):
    result = env.execute(step)  # ej: pty_exec("cargo check")
    if result.is_error():
        # In-context: re-planifica desde i con el error
        plan[i:] = llm.refine_plan(plan[i:], error=result.stderr, skills=skills)
        # Out-of-context: guarda experiencia
        skills.add(distill_skill(plan, result, fix=plan[i]))
        continue
    # Out-of-context: si anduvo, también guarda como skill positiva
    skills.add(distill_skill(plan[:i+1], result))

return plan.output
```

## 3. Evidencia y experimentos

| Benchmark | AdaPlanner | ReAct | Plan-and-Execute | Delta |
|---|---|---|---|---|
| **AlfWorld (tareas domésticas)** | **+7% sobre ReAct** | baseline | inferior a AdaPlanner | In-context + skill library ganan |
| **MiniWoB++ / WebShop** | superior | — | — | Plan adaptativo > plan fijo |
| **Ablation sin in-context refining** | cae ~4% | — | — | Re-planificar con feedback es clave |
| **Ablation sin skill library** | cae ~3% | — | — | Memoria entre episodios aporta |

- **In-context es el mayor aporte:** sin re-planificación con feedback, el agente repite el mismo error. Con ella, corrige el plan en 1-2 turnos.
- **Skill library acumula:** a más episodios, más skills y mejor retrieval. Es aprendizaje sin fine-tuning — solo prompting + memoria.
- **Costo:** cada refinamiento es una llamada extra al LLM. Para planes de 5 pasos con 1 fallo, son 2-3 llamadas LLM extra vs ReAct.

## 4. Cómo aplica a opencode-remote-android

| Concepto AdaPlanner | Mapeo concreto en tu repo |
|---|---|
| **Plan explícito** | Antes de ejecutar, el agente genera `plan: ["view api.rs", "edit api.rs:42", "cargo check", "preview"]` y lo muestra en UI. No es `tool_call` suelto — es plan visible. |
| **In-context refining** | Si `cargo check` falla tras `edit`, no reintentes `edit` igual: re-planificá `plan[2:]` con `stderr` como contexto. `ptyx WS :4849` retorna `{ exitCode, stderr }` — ese es tu feedback. |
| **Out-of-context / skill library** | Guardá `(plan, error, fix)` en **IndexedDB** (`DB_VERSION=2`, merge-only). Ej: "si edit en `external_router.rs:19` rompe `split_cmd`, revisar `CREATE_NO_WINDOW` flags". Recuperá por similitud en próximo episodio. |
| **`hyper :4850 mmap` + `tiny_http :4848`** | Cada `preview` o `fs.read` que falla (404 por falta de `<base href>`) es feedback para in-context refine: el plan se corrige a "inyectar base href antes de preview". |
| **`external_router.rs:19` + `probe 250ms`** | Si `probe` falla para `screenshots :3002`, el plan se refina a "usar fallback o skip screenshots". Guardá como skill: "si screenshots no responde en 250ms, no incluir en plan". |
| **Reflexion complementario** | AdaPlanner es Reflexion con plan estructurado. Combiná: Reflexion para verbalizar qué salió mal + AdaPlanner para re-planificar y guardar skill. |

```typescript
// web/src/features/planner/model/adaPlanner.ts — idea en tu harness
interface PlanStep { tool: string; args: Record<string, unknown>; }
interface Skill { pattern: string; plan: PlanStep[]; fix: string; }

async function adaPlanner(intent: string, skills: Skill[]) {
  let plan: PlanStep[] = await llm.generatePlan(intent, { skills: retrieve(intent, skills) });

  for (let i = 0; i < plan.length; i++) {
    const result = await execute(plan[i]); // via tiny_http :4848 / WS :4849
    if (!result.ok) {
      // In-context refining: re-planifica desde i con el error
      const refined = await llm.refinePlan(plan.slice(i), { error: result.stderr, skills });
      plan.splice(i, plan.length - i, ...refined);
      // Out-of-context: guarda skill
      await saveSkill({ pattern: intent, plan: plan.slice(0, i+1), fix: refined[0].tool });
      i--; // re-ejecuta el paso refinado
    }
  }
  return plan;
}
```

```typescript
// IndexedDB skill library — out-of-context refining persistente
// web/src/shared/db/skills.ts
interface SkillEntry {
  id: string;
  intent: string;          // "editar external_router.rs"
  plan: PlanStep[];
  error: string;           // "cargo check: expected `;`"
  fix: string;             // "agregar ; en línea 42"
  embedding?: number[];    // para retrieval por similitud
  createdAt: number;
}
// Retrieval: cosine similarity sobre intent embedding → top-3 skills al prompt
```

> **Regla de oro:** un agente que repite el mismo error en cada episodio no aprende. AdaPlanner convierte cada fallo en skill reutilizable — tu IndexedDB es la memoria que ReAct no tiene.

## 5. Anti-patterns y limitaciones

| Anti-pattern | Por qué duele | Qué hacer en cambio |
|---|---|---|
| **Plan open-loop sin feedback** | Si `cargo check` falla, igual intenta `preview` — desperdicia turnos | Closed-loop: cada step valida antes del siguiente; si falla, refine |
| **Reintentar el mismo step sin re-planificar** | Loop infinito con el mismo error | In-context refining: re-planifica `plan[i:]` con `stderr` |
| **Sin skill library** | Cada episodio arranca de cero; repite errores ya vistos | Guardá `(plan, error, fix)` en IndexedDB y recuperá por similitud |
| **Plan sin DAG / dependencias** | Pasos en orden fijo aunque sean independientes | Plan como DAG: `view` y `search` en paralelo, `edit` después |
| **Feedback genérico** (`"error"`) | El LLM no sabe qué corregir | `stderr` con `file:line` + `hint` estructurado (ver SWE-agent `04-swe-agent-aci-2024.md`) |

**Limitaciones del paper:**

- **Evaluado en AlfWorld/WebShop, no en SWE-bench:** generalización a tu repo Rust/TS requiere validar que `cargo check` como feedback es tan útil como el entorno de AlfWorld.
- **Costo de refinamiento:** cada in-context refine es una llamada LLM extra. Para planes de 5 pasos con 2 fallos, son 3-4 llamadas LLM vs 1 en plan-and-execute.
- **Skill retrieval no trivial:** si tu skill library crece a 100+ entradas, necesitás embedding + ranking; sin eso, el LLM se distrae con skills irrelevantes.
- **No cubre tool poisoning:** un plan que incluye una tool envenenada la ejecutará (ver `07-Seguridad/01-mcptox-2025.md`).

## 6. Ejercicios prácticos

### Ejercicio 1 — Plan explícito vs ReAct (30 min)
1. Tomá una tarea: "agregá un log en `fsx.rs:43` y verificá con `cargo check`".
2. Implementá dos modos: (A) ReAct puro (act→obs sin plan), (B) AdaPlanner (plan explícito + in-context refine si `cargo check` falla).
3. Medí turnos, tasa de éxito y cuántos errores se corrigen en 1 refine vs loop.

### Ejercicio 2 — Skill library en IndexedDB (45 min)
1. Implementá `saveSkill({ intent, plan, error, fix })` en IndexedDB con `DB_VERSION=2`.
2. Corré 5 episodios donde `cargo check` falla por distintos motivos; guardá cada `(plan, error, fix)` como skill.
3. En un 6to episodio similar, recuperá top-3 skills por similitud de intent y medí si el plan inicial ya evita el error.

### Ejercicio 3 — Closed-loop con ptyx (20 min)
1. Envolvé `ptyx WS :4849` para que cada `exec` retorne `{ stdout, stderr, exitCode }` estructurado.
2. Armá un plan `[view, edit, cargo check, preview]` donde `cargo check` falla intencionalmente.
3. Verificá que el harness haga in-context refine (re-planifique `edit` con `stderr`) en vez de avanzar a `preview`.

## 7. Referencias y checklist

- **Paper:** [AdaPlanner — arXiv:2305.16653](https://arxiv.org/abs/2305.16653)
- **Relacionados:** `04-swe-agent-aci-2024.md` (ACI con feedback estructurado), `08-taskweaver-2023.md` (code-first multi-step), `06-dspy-2023.md` (compilar planner), `07-Seguridad/01-mcptox-2025.md` (seguridad del plan)

### Checklist de lectura

- [ ] Leí abstract + §3 (in-context vs out-of-context refining) del paper original
- [ ] Entiendo por qué closed-loop + skill library supera ReAct y plan-and-execute
- [ ] Implementé plan explícito con in-context refine ante `cargo check` fallido
- [ ] Guardé al menos 3 skills en IndexedDB y probé retrieval en un episodio nuevo
- [ ] Anoté 1 idea para `ptyx :4849` o `features/planner` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android · 02 Harness*
