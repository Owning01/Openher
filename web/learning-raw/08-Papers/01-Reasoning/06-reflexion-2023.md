# Reflexion — Aprendizaje verbal sin tocar pesos (Shinn et al., 2023)

> **Autores:** Shinn, Cassano, Labash, Borrero, Gopinath, Narasimhan, Yao / NYU + Princeton
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2303.11366](https://arxiv.org/abs/2303.11366)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** NeurIPS 2023

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Reflexion: Language Agents with Verbal Reinforcement Learning (Shinn et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2303.11366 — Código: https://github.com/noahshinn/reflexion
> **Relevancia para opencode-remote-android:** te da el loop de auto-corrección más simple y efectivo para tu harness: cuando `ptyx :4849` falla (`cargo check`, `tsc -b`, tests), el agente reflexiona en texto, guarda la lección en IndexedDB y la usa en el próximo intento. Sin reentrenar, sin RL.
> **Prioridad:** Muy recomendado · **Tiempo:** 16 min

## 1 Introducción — Qué problema resuelve

Los agentes ReAct fallan y no aprenden de sus errores. Si el agente hace `shell.fs.write` con un import roto, `cargo check` falla, y en el próximo intento repite el mismo error porque no recuerda qué pasó. Reentrenar el modelo para cada error es inviable en un thin client.

Reflexion propone **verbal reinforcement learning**: tras fallar, el agente genera una **reflexión en lenguaje natural** ("qué hice mal, qué debería hacer distinto") y la guarda en **memoria episódica**. En el próximo intento (trial), lee esa memoria y evita repetir el error. No toca pesos — todo es texto en contexto.

Es el "aprender de los errores" humano llevado a prompt: fallar → reflexionar → recordar → reintentar. Con 2-3 trials, AlfWorld sube de 55% a 78% y HotpotQA de 30% a 48%.

## 2 Ideas clave

### 2.1 El loop — Actuar, fallar, reflexionar, reintentar

```
Trial 1:  Thought → Action → Observation → ... → FAIL (cargo check: missing import)
              ↓
          Reflexión: "Olvidé agregar `use crate::fsx;` en api.rs. La próxima debo verificar imports antes de escribir."
              ↓
          Memoria episódica: [{ task, error, reflection }]  (IndexedDB v2)
              ↓
Trial 2:  [Memoria inyectada en prompt] → Thought → Action (ahora con import) → PASS ✓
```

Componentes:

- **Actor:** el agente ReAct que intenta la tarea.
- **Evaluator:** determina si falló (ej: `cargo check` exit code ≠ 0, test no pasa, `fs.read` ENOENT). Puede ser heurístico (regex sobre output) o LLM judge.
- **Self-Reflection:** prompt al LLM: *"Dado el error X y tu traza, ¿qué hiciste mal y cómo lo corregirías?"* — genera texto de reflexión.
- **Memoria episódica:** lista de reflexiones previas, inyectada en el próximo prompt como contexto.

### 2.2 Reflexión verbal vs gradiente

En RL clásico, el error actualiza pesos vía gradiente. En Reflexion, el error actualiza **texto** que se inyecta en contexto. Ventajas para thin client:

- No necesitás GPU ni training.
- Funciona con cualquier modelo (GPT-4, Phi-3, etc.).
- La memoria es inspeccionable y editable por el usuario.

Desventaja: consume tokens de contexto (cada reflexión son ~100-200 tokens). Con 5 reflexiones, son 1k tokens extra.

### 2.3 Memoria a largo plazo — No tirar el historial

El paper distingue:

- **Memoria de corto plazo:** la traza ReAct del trial actual (Thought/Action/Observation).
- **Memoria de largo plazo (episódica):** reflexiones de trials previos, persistida entre intentos.

La episódica se inyecta al inicio del próximo prompt: `"Reflexiones previas:\n1. [trial 1] Olvidé el import...\n2. [trial 2] El path era relativo, no absoluto..."`. El modelo la lee y ajusta.

### 2.4 Cuándo reflexionar — Solo al fallar

No reflexionás en cada turno — solo cuando el `Evaluator` dice FAIL. Si la tarea termina en PASS, no hay reflexión. Esto ahorra tokens y evita sobre-pensar.

## 3 Evidencia / Experimentos

| Benchmark | ReAct (1 trial) | Reflexion (2-3 trials) | Ganancia |
|---|:---:|:---:|:---:|
| **AlfWorld** (134 tasks) | 55% | **78%** | +23pp |
| **HotpotQA** (EM) | 30% | **48%** | +18pp |
| **HumanEval** (Python) | 60.9% | **70.1%** | +9.2pp |
| **Programming (LeetCode)** | 31% | **42%** | +11pp |

- **AlfWorld:** tareas domésticas multi-paso — Reflexion corrige errores de planificación (ej: "olvidé abrir la heladera antes de sacar la manzana").
- **HotpotQA:** el agente aprende a reformular queries de búsqueda tras fallar.
- **HumanEval:** tras un `FAIL` de tests, la reflexión identifica el bug y el retry lo corrige en ~40% de casos.
- **Ablation:** sin memoria episódica (solo retry sin reflexión), la mejora cae a +5pp — la reflexión aporta, no solo reintentar.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto Reflexion | Dónde lo implementás en el repo |
|---|---|
| **Evaluator (¿falló?)** | `ptyx :4849` ya te da la señal: `cargo check` exit code, `tsc -b` errores, `fsx::move_entry` ENOENT, `external_router` probe timeout. Parseá el output y decidí PASS/FAIL. Para tareas abiertas (redacción), usá LLM judge: `"¿Esta respuesta resuelve la tarea? sí/no"`. |
| **Self-Reflection prompt** | Tras FAIL, llamá al LLM con: `"Tarea: {task}\nTraza: {reactTurns}\nError: {observation}\nReflexioná: ¿qué hiciste mal y qué harías distinto? 2-3 oraciones."` — guardá el texto resultante. |
| **Memoria episódica en IndexedDB v2** | Nueva tabla `reflections` en tu DB (`DB_VERSION = 2`): `{ id, sessionId, task, error, reflection, trialNo, createdAt }`. Merge-only como el resto. Inyectá las últimas 3 reflexiones al inicio del próximo `sendPrompt`. |
| **Inyección en prompt** | En `web/src/shared/api/prompts.ts`, anteponé al system prompt: `"## Lecciones previas\n- Trial 1: Olvidé importar fsx en api.rs\n- Trial 2: El path debe ser absoluto, no relativo"` — el modelo lo lee antes de razonar. |
| **UI — Lecciones aprendidas** | Mostrá la tabla `reflections` en la UI de sesión como sección "Lecciones aprendidas" colapsable. El usuario ve qué aprendió el agente y puede borrar reflexiones malas manualmente. |
| **Límite de trials** | No hagas loop infinito. `max_trials = 3` — si tras 3 reflexiones sigue fallando, escalá al usuario ("necesito ayuda, probé X, Y, Z y falló por ..."). Guardá todo en IndexedDB para debug. |
| **Combinar con ReAct + CoT** | Reflexion envuelve ReAct: cada trial es un loop ReAct completo. La reflexión es un `Thought` meta que mira la traza entera, no solo el último turno. |

```ts
// web/src/shared/api/reflexion.ts — bosquejo del loop
type Reflection = { task: string; error: string; text: string; trialNo: number };

async function runWithReflexion(task: string, maxTrials = 3): Promise<string> {
  const reflections: Reflection[] = await loadReflections(task); // IndexedDB v2
  for (let trial = 1; trial <= maxTrials; trial++) {
    const context = reflections.map(r => `- Trial ${r.trialNo}: ${r.text}`).join("\n");
    const prompt = context ? `Lecciones previas:\n${context}\n\nTarea: ${task}` : task;
    const result = await runReActAgent(prompt); // Thought→Action→Observation loop
    if (result.ok) return result.answer;
    // FAIL → reflexiona
    const text = await callLLM(
      `Tarea: ${task}\nTraza: ${result.trace}\nError: ${result.error}\n` +
      `Reflexioná en 2-3 oraciones: ¿qué hiciste mal y qué harías distinto?`
    );
    const refl: Reflection = { task, error: result.error, text, trialNo: trial };
    await saveReflection(refl); // IndexedDB
    reflections.push(refl);
  }
  throw new Error(`Falló tras ${maxTrials} trials. Última reflexión: ${reflections.at(-1)?.text}`);
}
```

## 5 Anti-patterns / Limitaciones

- **Reflexión genérica no sirve.** Si el LLM genera `"Debo tener más cuidado la próxima"` sin decir *qué* hizo mal, la memoria no ayuda. Forzá especificidad: `"Mencioná el archivo, el error exacto y la corrección concreta."`
- **Acumular reflexiones sin límite.** Con 10 trials fallidos, inyectar 10 reflexiones consume 2k tokens y confunde al modelo (reflexiones viejas contradicen nuevas). Guardá solo las últimas 3 y expirálas por `sessionId`.
- **Reflexionar sin evaluator confiable.** Si tu evaluator marca PASS cuando en realidad falló (ej: `cargo check` pasó pero el test no), no reflexionás y el bug queda. Asegurate que el evaluator chequee lo que importa (no solo compilación, también tests).
- **No confundir con Self-Refine.** Self-Refine (paper 16) itera *dentro* de un trial (generate → feedback → refine); Reflexion itera *entre* trials con memoria persistida. Son complementarios, no lo mismo.
- **Costo de trials extra.** Cada trial es un ReAct completo (5-15 tool calls). Con `max_trials=3` pagás 3× si siempre falla. Usá Reflexion solo para tareas donde el retry vale la pena (build, tests, migraciones) — no para `list_dir`.

## 6 Ejercicios prácticos (en tu repo)

1. **Tabla `reflections` en IndexedDB v2.** Creá la tabla `reflections` en `web/src/shared/db/index.ts` (o donde tengas `DB_VERSION = 2`) con `{ id, sessionId, task, error, reflection, trialNo }`. Implementá `saveReflection` / `loadReflections` y mostrá las reflexiones en la UI de sesión como sección "Lecciones aprendidas" colapsable. Probá con un `cargo check` que falle a propósito.

2. **Loop Reflexion para `ptyx` errores.** Envolvé tu `sendPrompt` para tareas de compilación: si `ptyx :4849` devuelve error de `cargo check` o `tsc -b`, generá reflexión y reintentá con memoria inyectada (max 3 trials). Medí cuántos fixes que antes requerían intervención manual ahora se auto-corrigen en el retry.

3. **Evaluá calidad de reflexiones.** Corré 10 tareas donde el agente falle en trial 1. Para cada una, calificá la reflexión generada en 1-5 (¿específica? ¿accionable? ¿correcta?). ¿Qué prompt de reflexión genera mejores textos? Probá variante A: `"¿qué hiciste mal?"` vs variante B: `"Mencioná archivo, error exacto y corrección concreta en 2 oraciones."` — ¿B gana?

## 7 Referencias

- **Paper:** Shinn et al., *Reflexion: Language Agents with Verbal Reinforcement Learning*, NeurIPS 2023 — https://arxiv.org/abs/2303.11366
- **Código:** https://github.com/noahshinn/reflexion — implementaciones AlfWorld, HotpotQA, HumanEval.
- **Base:** Yao et al., *ReAct* (2210.03629) — Reflexion envuelve ReAct con memoria.
- **Relacionado:** Self-Refine (2303.17651) — refinamiento intra-trial; ToT (2305.10601) — búsqueda vs retry.
- **Patrón harness:** Anthropic, *Building Effective Agents* — *evaluator-optimizer* y memoria episódica.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (diagrama Actor→Evaluator→Reflection) del paper original
- [ ] Entiendo la diferencia entre memoria de corto plazo (traza) y episódica (reflexiones)
- [ ] Sé cuándo reflexionar (solo al fallar) y cuántas reflexiones inyectar (últimas 3)
- [ ] Tengo bosquejada la tabla `reflections` en IndexedDB v2 y el loop con `max_trials=3`
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
