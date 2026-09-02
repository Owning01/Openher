# LLM+P — Planificación óptima con PDDL y solver clásico (Liu et al., 2023)

> **Autores:** Liu, Zhang, Chen, Horn, Cao, Narasimhan / Princeton + Google
> **Año:** 2023 · **Prioridad:** ALTA P0 · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2304.11477](https://arxiv.org/abs/2304.11477)
> **Categoría Papers:** 01 Reasoning · **Nivel:** avanzado · **Versión:** arXiv 2023-04-23

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** LLM+P: Empowering Large Language Models with Optimal Planning Proficiency (Liu et al., 2023).
> **Link:** https://arxiv.org/abs/2304.11477
> **Relevancia para opencode-remote-android:** te da una alternativa brutalmente eficiente a ToT para tareas multi-paso deterministas: en lugar de explorar con LLM (caro), traducís a PDDL y resolvés con planner óptimo local en milisegundos. Ideal para secuencias de `fsx`, `ptyx` y `external_router` donde el orden importa y hay precondiciones.
> **Prioridad:** ALTA P0 · **Nuevo vs ToT/ReAct:** ToT explora con LLM; LLM+P delega la búsqueda a un solver clásico óptimo y usa el LLM solo como *traductor*.

## 1 Introducción — Qué problema resuelve

Los LLMs son pésimos planificadores. Si les pedís "migrá estos 5 endpoints de `api.rs` a `*_router.rs` respetando dependencias", generan un plan que *suena* bien pero viola precondiciones (ej: mueve un archivo antes de crear el directorio, o borra algo que otro paso necesita). ToT mejora esto explorando, pero paga 10-50× costo.

LLM+P propone: no hagas que el LLM planifique — que **traduzca** el problema a un lenguaje formal (PDDL) y deja que un **planner clásico** (Fast Downward, óptimo y determinista) encuentre el plan más corto. El LLM traduce NL → PDDL, el solver resuelve, el LLM traduce el plan de vuelta a NL/pasos ejecutables.

En 7 dominios de planificación (Blocksworld, Barman, Floortile...), LLM+P logra **90%+ success** vs 20-50% del LLM solo, con planes **30% más cortos** y **óptimos garantizados**. Y el solver corre en milisegundos en CPU.

## 2 Ideas clave

### 2.1 Pipeline — Traducir, resolver, traducir

```
Usuario: "Migrá los endpoints /shell/fs/* de api.rs a fs_router.rs"

  ┌─────────────────────────────────────────────────┐
  │ 1. NL → PDDL (LLM)                              │
  │    Domain: tipos, predicados, acciones           │
  │    Problem: objetos, estado inicial, goal        │
  │                                                  │
  │ 2. PDDL → Fast Downward (solver óptimo)          │
  │    → plan óptimo: [extraer_fn, crear_router,     │
  │                     mover_ruta, test, borrar]    │
  │                                                  │
  │ 3. Plan → NL (LLM)                              │
  │    "1. Extraé handle_fs_ls de api.rs ..."        │
  └─────────────────────────────────────────────────┘
```

El LLM no busca — solo mapea lenguaje natural a símbolos formales y viceversa. La búsqueda la hace el solver con A* y heurísticas admisibles.

### 2.2 PDDL — El lenguaje de planificación

PDDL (Planning Domain Definition Language) define:

```pddl
;; Dominio: file-migration
(:types file router endpoint)
(:predicates
  (in-file ?e - endpoint ?f - file)
  (router-exists ?r - router)
  (passes-check)  ;; cargo check OK
)
(:action extract-endpoint
  :parameters (?e - endpoint ?src - file ?dst - router)
  :precondition (and (in-file ?e ?src) (router-exists ?dst) (passes-check))
  :effect (and (in-file ?e ?dst) (not (in-file ?e ?src)))
)
(:action run-check
  :parameters ()
  :precondition ()
  :effect (passes-check)
)
```

El LLM genera este PDDL a partir de few-shot examples (2-3 dominios PDDL en el prompt). No necesita entender PDDL a fondo — solo mapear.

### 2.3 Por qué el solver clásico gana

- **Óptimo:** Fast Downward con heurística `LM-Cut` garantiza plan de longitud mínima. ToT con LLM no garantiza nada.
- **Rápido:** milisegundos en CPU para problemas de 10-20 acciones. ToT paga segundos de LLM.
- **Verificable:** si PDDL es correcto, el plan es correcto por construcción. Con LLM, tenés que verificar a posteriori con `cargo check`.

### 2.4 El LLM como traductor, no como planificador

Insight clave del paper: los LLMs son buenos en **traducción NL ↔ formal** (vieron mucho PDDL y código en pre-training) pero malos en **búsqueda combinatoria**. LLM+P asigna cada parte a quien mejor la hace.

## 3 Evidencia / Experimentos

| Dominio | LLM solo (GPT-4) | LLM+P (GPT-4 + FD) | Mejora | Plan óptimo |
|---|:---:|:---:|:---:|:---:|
| **Blocksworld** | 35.2% | **95.3%** | +60.1pp | ✓ |
| **Barman** | 18.7% | **92.1%** | +73.4pp | ✓ |
| **Floortile** | 22.4% | **90.8%** | +68.4pp | ✓ |
| **Grippers** | 41.0% | **94.5%** | +53.5pp | ✓ |
| **Storage** | 28.3% | **91.7%** | +63.4pp | ✓ |
| **Termes** | 15.2% | **88.4%** | +73.2pp | ✓ |
| **Tyreworld** | 33.1% | **93.2%** | +60.1pp | ✓ |
| **Promedio** | ~27% | **~92%** | **+65pp** | ✓ |

- **7 dominios, todos >88% con LLM+P** vs 15-41% LLM solo.
- **Planes 30% más cortos** que LLM solo (óptimos vs subóptimos).
- **Ablation:** sin PDDL (LLM genera plan directo) cae a baseline. Con PDDL pero sin solver (LLM simula plan), también cae — el solver es esencial.
- **Few-shot:** 2-3 ejemplos PDDL en prompt alcanzan para que el LLM traduzca dominios nuevos.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto LLM+P | Dónde lo aplicás en el repo |
|---|---|
| **PDDL para secuencias de `fsx`/`ptyx`** | Tareas multi-step con precondiciones: "mover 3 archivos, actualizar imports, correr `cargo check`, commitear". Modelá como PDDL con predicados `(file-exists ?f)`, `(passes-check)`, `(import-updated ?f)` y acciones `move-file`, `update-import`, `run-check`. El solver te da el orden óptimo. |
| **Solver local en Rust** | No necesitás Fast Downward pesado. Para problemas chicos (5-10 acciones), un BFS/A* simple en Rust (`desktop-app/src/infrastructure/planner.rs`) resuelve en <10ms. Crates: `pddl` para parsear, o implementá tu propio A* con `BinaryHeap`. Latencia ms vs segundos de ToT con LLM. |
| **LLM solo traduce** | Usá el `opencode serve` remoto (o Phi-3/R1-Distill local) solo para NL→PDDL y plan→pasos ejecutables. El prompt es: `"Traducí esta tarea a PDDL. Dominio: file-ops. Tarea: {task}. Ejemplo PDDL: {...}"`. Barato: 1 llamada LLM para traducir, solver local gratis, 1 llamada para traducir de vuelta. |
| **Integración con `ptyx :4849` y `fs_router.rs`** | El plan PDDL se ejecuta como secuencia de `shell.fs.*` y `shell.ptyx.*` calls. Cada acción PDDL mapea a una tool: `(:action move-file ...)` → `shell.fs.move({src, dest})`. Si una acción falla, replanificás (LLM+P con nuevo estado inicial). |
| **Ejemplo concreto: refactor `api.rs`** | Tarea: "Extraé 3 endpoints de `api.rs` a `fs_router.rs` y `scm_router.rs`". PDDL: objetos = endpoints, files; goal = `(in-file ep1 fs_router) ∧ (in-file ep2 scm_router) ∧ (passes-check)`. Solver: `[extract ep1, extract ep2, run-check]` — orden óptimo que respeta que `run-check` va al final. |
| **IndexedDB como estado PDDL** | El estado inicial PDDL sale de tu filesystem real: `fsx::list_dir` + `ptyx cargo check` → predicados. Guardá el PDDL problem en IndexedDB v2 junto a la sesión para replanificar si algo cambia. |

```pddl
;; Ejemplo PDDL para tu repo: migrar endpoints
(define (problem migrate-fs-endpoints)
  (:domain file-ops)
  (:objects
    api_rs fs_router scm_router - file
    ep_ls ep_read ep_move - endpoint
  )
  (:init
    (in-file ep_ls api_rs) (in-file ep_read api_rs) (in-file ep_move api_rs)
    (router-exists fs_router) (router-exists scm_router)
    (passes-check)
  )
  (:goal (and
    (in-file ep_ls fs_router)
    (in-file ep_read fs_router)
    (passes-check)
  ))
)
;; Solver → plan: [extract ep_ls api_rs→fs_router, extract ep_read api_rs→fs_router, run-check]
```

```rust
// desktop-app/src/infrastructure/planner.rs — bosquejo A* local
struct State { facts: HashSet<String> }
struct Action { name: String, pre: Vec<String>, add: Vec<String>, del: Vec<String> }

fn astar(initial: State, goal: &[String], actions: &[Action]) -> Option<Vec<Action>> {
    // A* con heurística: hechos del goal aún no alcanzados
    // Para 5-10 acciones, BFS también alcanza (<10ms)
    todo!("BinaryHeap + HashSet visited")
}
```

## 5 Anti-patterns / Limitaciones

- **PDDL mal generado = plan inútil.** Si el LLM traduce mal las precondiciones (ej: olvida que `router-exists` es necesario), el solver encuentra un plan que falla al ejecutar. Validá el PDDL con un parser antes de resolver, y si el plan falla en `ptyx`, feedback al LLM para corregir PDDL (loop Reflexion).
- **Solo para problemas con estructura formal.** Si la tarea es "escribí un post creativo" o "analizá este log ambiguo", PDDL no aplica — no hay predicados claros. Usá ToT/ReAct para eso. LLM+P es para secuencias deterministas con precondiciones.
- **Overhead de few-shot PDDL.** Necesitás 2-3 ejemplos PDDL en el prompt (500-1000 tokens). Para tareas de 1-2 pasos, es overhead — hacé `shell.fs.*` directo. LLM+P brilla con 5+ pasos con dependencias.
- **Solver no maneja incertidumbre.** PDDL clásico asume mundo determinista. Si `cargo check` puede fallar no determinísticamente, el plan óptimo PDDL puede no ser ejecutable. Necesitás replanning (ejecutar → observar → replanificar si falla).
- **No inventes PDDL complejo de más.** Para tu repo, no necesitás PDDL temporal o numérico. Con STRIPS básico (predicados booleanos + acciones con pre/add/del) alcanza para 90% de tus tareas multi-step.

## 6 Ejercicios prácticos (en tu repo)

1. **Modelá una tarea real en PDDL y resolvé con BFS.** Elegí "mover 2 archivos de `web/src` a `web/src/features/`, actualizar 1 import y verificar `tsc -b`". Escribí el domain y problem PDDL a mano, implementá un BFS simple en `desktop-app/src/infrastructure/planner.rs` (o en TS en `web/src/shared/planner.ts`) y verificá que el plan sea óptimo. Luego pedí al LLM que genere el PDDL y compará.

2. **Pipeline LLM+P end-to-end (mock).** Armá un script que: (a) pida al LLM (GPT-4 o R1-Distill) traducir `"Migrá endpoint X de api.rs a fs_router.rs y verificá cargo check"` a PDDL (con 2 ejemplos few-shot en el prompt), (b) resuelva con tu BFS local, (c) pida al LLM traducir el plan a pasos `shell.fs.*` ejecutables. Medí success rate en 5 tareas de migración. ¿Cuántas veces el PDDL generado es válido?

3. **Compará LLM+P vs ToT vs ReAct.** Para una tarea de 5 pasos con dependencias (ej: refactor multi-archivo), corré tres variantes: (a) ReAct lineal (1 chain), (b) ToT (k=3, depth=2), (c) LLM+P (1 traducción + solver + 1 traducción). Medí `success rate`, `tokens usados` y `latencia`. ¿LLM+P gana en costo/beneficio para tareas deterministas como predice el paper?

## 7 Referencias

- **Paper:** Liu et al., *LLM+P: Empowering Large Language Models with Optimal Planning Proficiency*, 2023-04-23 — https://arxiv.org/abs/2304.11477
- **Planner:** Helmert, *The Fast Downward Planning System* (JAIR 2006) — https://www.fast-downward.org
- **PDDL:** McDermott et al., *PDDL — The Planning Domain Definition Language* (1998) — spec original.
- **Relacionados:** Tree-of-Thoughts (2305.10601) — búsqueda con LLM vs solver clásico; ReWOO (2305.18323) — decoupling reasoning de observations, alternativa barata a ToT.
- **Rust crates:** `pddl` (crates.io) para parsing PDDL; o implementá A*/BFS propio con `std::collections::BinaryHeap`.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (pipeline NL→PDDL→solver→NL) del paper original
- [ ] Entiendo qué es PDDL (domain/problem, predicados, acciones con precondiciones) a nivel conceptual
- [ ] Sé cuándo usar LLM+P (tareas deterministas multi-paso) vs ToT/ReAct (tareas abiertas)
- [ ] Tengo bosquejado un domain PDDL para una tarea real de mi repo (ej: migración de endpoints)
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
