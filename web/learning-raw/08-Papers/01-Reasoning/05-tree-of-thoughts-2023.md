# Tree of Thoughts — Buscar sobre pensamientos (Yao et al., 2023)

> **Autores:** Yao, Yu, Zhao, Shafran, Griffiths, Cao, Narasimhan / Princeton + Google DeepMind
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~20 min
> **Link verificado:** [https://arxiv.org/abs/2305.10601](https://arxiv.org/abs/2305.10601)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** NeurIPS 2023

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Tree of Thoughts: Deliberate Problem Solving with Large Language Models (Yao et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2305.10601 — Código: https://github.com/princeton-nlp/tree-of-thought-llm
> **Relevancia para opencode-remote-android:** es el patrón para tareas de planificación compleja (refactors multi-archivo, migraciones, diseño de features) donde un solo chain CoT se queda corto. No lo uses para chat — usalo como *planner* opcional antes de ejecutar.
> **Prioridad:** Muy recomendado · **Tiempo:** 20 min

## 1 Introducción — Qué problema resuelve

CoT y ReAct generan un **solo camino lineal** de razonamiento: `Thought₁ → Thought₂ → ... → Respuesta`. Si en `Thought₂` el modelo elige mal, todo lo que sigue está contaminado y no hay vuelta atrás. Es como caminar por un laberinto sin poder retroceder.

Tree of Thoughts (ToT) generaliza CoT a **búsqueda en árbol**: cada nodo es un pensamiento parcial, cada arista es una continuación posible. El sistema explora múltiples ramas en paralelo, evalúa cuáles son prometedoras con una heurística (voto o LLM judge) y **poda** las malas. Si una rama falla, hace backtracking y prueba otra. Es deliberación, no generación lineal.

Resultado estrella: en **Game of 24** (dados 4 números, usar +−×÷ para llegar a 24), CoT con GPT-4 logra **4%** y ToT logra **74%** con el mismo modelo. La diferencia es pura búsqueda.

## 2 Ideas clave

### 2.1 Árbol de pensamientos — Nodos, ramas y evaluación

```
                    [Problema: 4 9 10 13 → 24]
                           /      |       \
              Thought A  "13-9=4"  Thought B "10-4=6"  Thought C "9+4=13"
                 /    \              |
         "4×4=16"  "4+10=14"    "6×4=24" ✓ (pero usó 4 dos veces, inválido)
           |           |
        "16+..."    "14+13=27" ✗ (evaluador: impossible)
           ✗            ✗
```

- **Nodo:** un thought parcial (ej: un paso de razonamiento, un fragmento de plan).
- **Generación:** en cada nivel, el LLM genera `k` candidatos (ej: `k=5` continuaciones).
- **Evaluación:** otro prompt (el *evaluator*) puntúa cada nodo como `sure / maybe / impossible` o con score numérico.
- **Búsqueda:** BFS o DFS, manteniendo solo los `b` mejores nodos por nivel (beam `b=5`).

### 2.2 BFS vs DFS — Dos estrategias de exploración

| Estrategia | Cómo funciona | Cuándo conviene |
|---|---|---|
| **BFS (breadth-first)** | Expande todos los nodos de un nivel, evalúa, queda con top-b, avanza al siguiente nivel | Problemas donde necesitás comparar alternativas al mismo nivel (Game of 24, puzzles) |
| **DFS (depth-first)** | Profundiza una rama hasta el final o hasta que el evaluador dice `impossible`, luego backtrackea | Problemas donde una rama puede resolver todo si es correcta (escritura creativa, planificación) |

El paper usa BFS para Game of 24 y DFS con backtracking para Creative Writing. Para tu harness, BFS depth=2 con `b=3` es el sweet spot costo/calidad.

### 2.3 El evaluador — LLM como heurística

El truco de ToT es que no necesitás una heurística externa programada. Usás **otro prompt al mismo LLM** para evaluar:

```
Prompt evaluador: "Evaluá si este pensamiento parcial puede llevar a una solución.
Thought: '13-9=4, 4+10=14'
Evaluación: maybe (podría combinar 14 con 13 para llegar a 24, pero 14 ya usa 4 y 10...)"
→ Score: maybe
```

El evaluador puede ser:

- **Voto:** samplea 3 evaluaciones y vota (como Self-Consistency).
- **Score:** pide `sure/likely/impossible` y filtra.

Sin evaluador bueno, ToT explota combinatoriamente — es el punto más delicado.

### 2.4 Costo — 10-50× CoT

Cada nivel genera `k` candidatos y evalúa cada uno. Con `k=5, b=5, depth=3`, son ~25 generaciones + 25 evaluaciones = 50 llamadas vs 1 de CoT. **No lo uses por defecto.** Es un *planner* para tareas que justifican el costo.

## 3 Evidencia / Experimentos

Todos con GPT-4 (o GPT-3.5 donde se indica):

| Tarea | CoT (GPT-4) | ToT (GPT-4) | Detalle |
|---|:---:|:---:|:---|
| **Game of 24** (100 puzzles) | 4% | **74%** | BFS, b=5, k=5, depth 3 |
| **Game of 24** (CoT + Self-Consistency k=100) | 9% | **74%** | Ni votar 100 veces alcanza a ToT |
| **Creative Writing** ( coherencia) | 6.0/10 | **7.5/10** | DFS, evaluador LLM, juez humano |
| **Mini Crosswords** (5×5, % palabras) | 16% | **60%** | BFS, 20 puzzles |
| **Game of 24** con GPT-3.5 + ToT | — | 12% | ToT no rescata modelo débil |

- **Game of 24:** el salto 4% → 74% es el headline. Ni CoT con 100 samples (Self-Consistency masivo) llega a 10%.
- **Creative Writing:** ToT genera planes de escritura (outline → párrafos) y el evaluador elige el más coherente. Humanos prefieren ToT 7.5 vs 6.0.
- **Ablation:** sin evaluador (búsqueda ciega), ToT cae a ~20% en Game of 24 — el evaluador es crítico.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto ToT | Dónde lo aplicás en el repo |
|---|---|
| **Búsqueda en árbol para planning** | Para tareas `kanban` complejas: "migrar `api.rs` a `*_router.rs`", "refactorizar `App.tsx` (God Component 3600 líneas)", "agregar feature multi-archivo". Generá 3 planes ToT (BFS depth 2, b=3) y elegí el que pasa `cargo check` en simulación local. |
| **Evaluador LLM como judge** | Usá el mismo `opencode serve` remoto como evaluador: prompt `"¿Este plan puede compilar? ¿Qué riesgo ves?"` con `sure/maybe/impossible`. O más barato: simulá ejecutando `cargo check` / `tsc -b` en `ptyx :4849` y usá el resultado como observación ReAct que alimenta la evaluación. |
| **ToT local con Phi-3 barato** | No pagues GPT-4 para explorar 25 ramas. Usá Phi-3 3.8B local (Rust sidecar `desktop-app`) para generar y evaluar candidatos ToT, y solo ejecutá el plan ganador con el modelo caro remoto. Costo: 25× Phi-3 local (barato) + 1× GPT-4 remoto. |
| **BFS depth=2 como default** | Para tu thin client, `depth=2, k=3, b=3` = 9 planes evaluados. Suficiente para distinguir un buen refactor de uno malo sin fundir tokens. No hagas depth=5 — el costo se va a las nubes y el evaluador se degrada. |
| **Backtracking en ptyx** | Si el plan ganador falla en `ptyx :4849` (ej: `cargo check` falla), no reintentes el mismo plan. Volvé al árbol ToT y probá el segundo mejor (backtracking). Guardá el árbol en IndexedDB v2 para no regenerar. |
| **Compaction como ToT** | Al compactar historial largo (`miser/ultra`), generá 3 resúmenes candidatos (ToT depth 1) y elegí con judge. Es Self-Consistency con esteroides — ToT depth 1 + evaluador. |

```ts
// web/src/shared/api/treeOfThoughts.ts — bosquejo BFS depth=2
type ThoughtNode = { text: string; score: "sure" | "maybe" | "impossible" };

async function totPlan(task: string): Promise<string> {
  // Nivel 1: genera 3 planes candidatos
  const candidates = await Promise.all(
    Array.from({ length: 3 }, () => callLLM(`Task: ${task}\nProponé un plan paso a paso:`))
  );
  // Evalúa cada candidato
  const scored: ThoughtNode[] = await Promise.all(
    candidates.map(async c => ({
      text: c,
      score: await evaluate(c) as ThoughtNode["score"],
    }))
  );
  const top = scored.filter(s => s.score !== "impossible").sort(scoreRank);
  // Nivel 2: expande el mejor
  if (top.length === 0) throw new Error("No viable plan");
  return top[0].text;
}

async function evaluate(plan: string): Promise<string> {
  const r = await callLLM(`Evaluá si este plan compila y es seguro:\n${plan}\nResponde: sure/maybe/impossible`);
  return r.trim().toLowerCase();
}
```

## 5 Anti-patterns / Limitaciones

- **Sin evaluador bueno, ToT es búsqueda ciega.** Si tu prompt evaluador es genérico ("¿está bien?"), todos los nodos dan `maybe` y no podás nada. El evaluador debe ser task-specific: "¿este plan respeta `cargo check`? ¿ toca >350 líneas por archivo?"
- **Explosión combinatoria.** Con `k=10, depth=5` son 100k nodos. Limitá a `k=3, depth=2` en producción. ToT no escala a profundidad sin poda agresiva.
- **No para chat simple.** Para `list_dir`, `fs.read` o responder `/help`, ToT es 50× overhead sin beneficio. Usá ReAct lineal o workflow determinista.
- **Dependencia del modelo base.** ToT con GPT-3.5 en Game of 24 solo llega a 12% — si el modelo no puede generar buenos candidatos, buscar no ayuda. Necesitás GPT-4 o equivalente para que ToT brille.
- **Latencia en thin client.** 9 llamadas secuenciales (BFS depth 2) con `polling 3.5s` entre cada una son 30+ segundos. Paralelizá la generación del mismo nivel con `Promise.all` y usá `ptyx :4849` para evaluación local donde puedas (ej: `cargo check` en lugar de judge LLM).

## 6 Ejercicios prácticos (en tu repo)

1. **Implementá ToT depth=2, k=3 para un refactor real.** Elegí una tarea tipo "migrar `external_router.rs` a MCP" o "extraer un widget de `App.tsx`". Generá 3 planes con Phi-3 local o GPT-4, evaluá cada uno con prompt judge (`sure/maybe/impossible` respecto a `cargo check` y límite 350 líneas), quedate con el mejor y ejecútalo vía `ptyx :4849`. ¿El plan ToT es mejor que un prompt CoT lineal?

2. **ToT para compaction.** Modificá tu lógica de `compact` para generar 3 resúmenes del historial (ToT depth 1, k=3) y elegir con judge: `"¿Cuál resumen preserva mejor la info necesaria para continuar la tarea?"`. Compará contra Self-Consistency (voto simple) y contra greedy. ¿El judge aporta sobre voto?

3. **Mide costo vs ganancia.** Logueá tokens y latencia de ToT (k=3, depth=2) vs CoT simple en 5 tareas de distinta complejidad (trivial/media/compleja). Graficá `tokens ToT / tokens CoT` vs `calidad del plan (1-5)`. ¿A partir de qué complejidad ToT justifica su costo? Documentá el umbral para decidir cuándo activar ToT automáticamente.

## 7 Referencias

- **Paper:** Yao et al., *Tree of Thoughts: Deliberate Problem Solving with Large Language Models*, NeurIPS 2023 — https://arxiv.org/abs/2305.10601
- **Código:** https://github.com/princeton-nlp/tree-of-thought-llm — implementaciones BFS/DFS para Game of 24, Creative Writing, Crosswords.
- **Base:** Wei et al., *Chain-of-Thought* (2201.11903) — ToT generaliza CoT a búsqueda.
- **Relacionados:** Self-Consistency (2203.11171) — ToT depth 1 con voto; ReAct (2210.03629) — ToT puede envolver ReAct (árbol de `Thought→Action→Observation`).
- **Alternativa más barata:** ReWOO (2305.18323) — genera todo el plan sin interleaving, menos costo que ToT para thin client con latencia alta.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (árbol vs chain lineal) del paper original
- [ ] Entiendo BFS vs DFS y cuándo usar cada uno en mi harness
- [ ] Sé por qué el evaluador es crítico y cómo escribir uno task-specific
- [ ] Tengo claro en qué tareas justifica pagar 10-50× costo de ToT y en cuáles no
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
