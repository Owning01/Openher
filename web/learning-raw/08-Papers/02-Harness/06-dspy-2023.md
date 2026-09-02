# DSPy — Compilar prompts en programas que se auto-mejoran (Khattab et al., 2023)

> **Paper:** DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines — Khattab et al., Stanford / ICLR 2024
> **Versión:** v2 · **Año:** 2023 · **Autores:** Omar Khattab, Arnav Singhvi, Paridhi Maheshwari, Zhiyuan Zhang, Keshav Santhanam, Sri Vardhamanan, Saiful Haq et al. / Stanford NLP
> **Link:** [https://arxiv.org/abs/2310.03714](https://arxiv.org/abs/2310.03714) · [dspy.ai](https://dspy.ai) · [github.com/stanfordnlp/dspy](https://github.com/stanfordnlp/dspy)
> **Prioridad:** ALTA P0 · **Nivel:** Avanzado · **Lectura:** ~18 min

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

## 1. Introducción

DSPy propone algo radical para 2023: **dejar de escribir prompts a mano y tratar los LLMs como programas declarativos que se compilan y optimizan automáticamente**. En vez de tunear un system prompt gigante en `web/src/App.tsx` (tu god component de ~3.600 líneas), declarás `Signature("question -> answer")` y un `Module` (`ChainOfThought`, `ReAct`, `Retrieve`), y un **Teleprompter** optimiza el pipeline con bootstrap de ejemplos, validación cruzada y búsqueda — como un compilador que optimiza código, pero para prompts.

La analogía es precisa: hoy escribís prompts como si escribieras assembly a mano; DSPy te da un lenguaje de alto nivel y un compilador que genera el assembly óptimo. El resultado supera prompt engineering manual en QA, matemáticas y tool use, y es **portable entre modelos** (optimizás una vez, usás con GPT-4, Claude o un SLM local).

Para opencode-remote-android esto ataca tu deuda técnica más visible: `App.tsx` viola FSD con fetch/CapacitorHttp en componentes y prompts hardcodeados. DSPy te da el patrón para desmontarlo en pipelines declarativos testeables.

## 2. Ideas clave

| Concepto | Qué es | Analogía clásica |
|---|---|---|
| **Signature** | Declara input→output: `"question, context -> answer"` | Firma de función tipada |
| **Module** | Compone signatures: `ChainOfThought`, `ReAct`, `Retrieve`, `MultiChainComparison` | Función / clase |
| **Teleprompter** | Optimiza el module: `BootstrapFewShot`, `MIPRO`, `COPRO` | Compilador + optimizer |
| **Metric** | Función que evalúa output: `answer_exact_match`, `pass@k` | Test suite |
| **Bootstrap demos** | Genera few-shots automáticamente a partir de trainset + metric | Auto-generación de casos de test |

```python
# DSPy — de prompt hardcodeado a programa compilado
import dspy

# 1. Declarás qué querés, no cómo pedirlo
qa = dspy.ChainOfThought("question, context -> answer")

# 2. Definís cómo medir éxito
def answer_exact_match(example, pred, trace=None):
    return example.answer.lower() == pred.answer.lower()

# 3. El teleprompter compila: genera demos, prueba variantes, elige la mejor
teleprompter = dspy.BootstrapFewShot(metric=answer_exact_match)
compiled_qa = teleprompter.compile(qa, trainset=train_examples)

# 4. Usás el programa compilado — el prompt óptimo ya está adentro
answer = compiled_qa(question="¿Qué hace external_router.rs:19?", context=code)
```

**Pipeline típico DSPy para un harness:**

```
Retrieve(context) → ChainOfThought(question, context -> draft) → ReAct(draft -> tool_calls) → Evaluate
     ↑                       ↑                                              ↑
  retriever BM25      teleprompter optimiza CoT              teleprompter optimiza tool selection
```

**Por qué supera prompt engineering manual:**

| Prompt manual | DSPy |
|---|---|
| Un humano itera a ojo, sin métrica | Teleprompter optimiza contra metric en trainset |
| Acoplado a un modelo ("este prompt anda en GPT-4") | Portable: recompilás para otro modelo |
| Frágil ante cambios de tools | Recompilás cuando cambia `shared/api` |

## 3. Evidencia y experimentos

| Tarea | DSPy (compilado) | Prompt manual | Delta |
|---|---|---|---|
| **HotPotQA** | supera baseline few-shot | baseline | +10-15% con BootstrapFewShot |
| **GSM8K (math)** | ChainOfThought compilado > CoT manual | CoT a mano | +5-8% |
| **Tool use / ReAct** | ReAct compilado > ReAct manual | ReAct hardcodeado | Consistente, portable entre modelos |
| **MIPRO (optimizer avanzado)** | mejor que BootstrapFewShot | — | +3-5% extra, más costo de compilación |

- **Portabilidad:** un programa compilado para GPT-3.5 se puede recompilar para GPT-4 o LLaMA sin reescribir prompts — solo cambiás `dspy.LM("openai/gpt-4o")` y recompilás.
- **Costo de compilación:** MIPRO/COPRO requieren múltiples llamadas al LM durante la optimización (bootstrap + eval). Es costo upfront que se amortiza en producción.
- **No es magia:** si tu `trainset` es malo o tu `metric` no correlaciona con calidad real (ver `05-Evaluacion/`), el teleprompter optimiza para la métrica equivocada.

## 4. Cómo aplica a opencode-remote-android

| Concepto DSPy | Mapeo concreto en tu repo |
|---|---|
| **`App.tsx` god component (~3.600 líneas)** | Desmontalo en `features/` con DSPy modules: `Retrieve(retriever) → Generate(ChainOfThought) → Evaluate(metric)`. Cada module es un `Signature` testeable, no un `useEffect` con fetch. |
| **FSD violation (fetch en componentes)** | DSPy fuerza ports + adapters: el `Module` declara `Signature`, el adapter (`infrastructure/api`) implementa el `LM` call. Cero `fetch` en `widgets/` o `entities/`. |
| **SSE handler** | Compilá tu handler SSE (`message.part.delta` v1 vs `session.next.*` v2) como DSPy pipeline con metric `sse_parse_success`. El teleprompter encuentra el mejor few-shot para cada dialecto (`shared/api/version.ts`). |
| **`external_router.rs:19 split_cmd` + probe** | Modelá `retrieve_tools → select_tool → call_tool → observe` como DSPy `ReAct` signature. El teleprompter optimiza qué tools describir y en qué orden. |
| **`hyper :4850 mmap+br` + `tiny_http :4848` + `WS ptyx :4849`** | Cada infra es un `Tool` en DSPy `ReAct`. El pipeline declara `Signature("intent -> tool_call")` y el teleprompter aprende a elegir entre `fs.read` (mmap), `pty.exec` (WS) y `preview` (mmap+base href). |
| **Evaluación** | Definí `metric` sobre SWE-bench Lite o tu `bfcl-mini` (ver `02-gorilla-bfcl-2023.md`): `tool_ast_match` + `execution_success`. El teleprompter optimiza directamente para esa metric. |

```typescript
// web/src/features/qa/model/qaProgram.ts — idea DSPy en TS (conceptual)
// Con dspy.js o portando la idea a tu harness TS
import { Signature, ChainOfThought, BootstrapFewShot } from "dspy-ts"; // pseudocódigo

const qaSignature = new Signature("question: string, context: string -> answer: string, reasoning: string");
const qaModule = new ChainOfThought(qaSignature);

// Trainset: ejemplos de tu dominio (opencode-remote-android)
const trainset = [
  { question: "¿Cómo funciona probe 250ms?", context: externalRouterCode, answer: "TCP connect_timeout..." },
  // +20 ejemplos
];

const teleprompter = new BootstrapFewShot({ metric: answerExactMatch });
const compiledQA = await teleprompter.compile(qaModule, trainset);
// compiledQA ya tiene los few-shots óptimos inyectados — usalo en producción
```

> **Regla de oro:** si tu prompt vive hardcodeado en un componente React y solo anda con un modelo, tenés deuda técnica. DSPy convierte prompts en programas versionables, testeables y portables.

## 5. Anti-patterns y limitaciones

| Anti-pattern | Por qué duele | Qué hacer en cambio |
|---|---|---|
| **Prompt gigante hardcodeado en `App.tsx`** | Frágil, no testeable, viola FSD, acoplado a un modelo | `Signature` + `Module` en `features/` + teleprompter |
| **`fetch`/`CapacitorHttp` en componentes** | Viola regla FSD hexagonal (solo `shared/api` o adapters) | DSPy `LM` adapter en `infrastructure/`; componentes solo llaman `Module` |
| **Optimizar sin metric** | El teleprompter no tiene señal; optimiza ruido | Definí `metric` que correlacione con calidad real (AST match, pass@k) |
| **Trainset de 3 ejemplos** | Bootstrap no tiene de dónde generar demos diversas | Mínimo 20-50 ejemplos con `question/context/answer` de tu dominio |
| **Compilar una vez y olvidar** | Si cambian tools o modelo, el compiled prompt queda stale | Recompilá en CI cuando cambia `shared/api/tools.ts` o el modelo base |

**Limitaciones del paper:**

- **Costo de compilación:** MIPRO puede requerir 100+ llamadas al LM para optimizar. Para tu desktop-app local con SLM, es costo upfront significativo.
- **Dependencia de trainset:** si tus ejemplos no cubren `mmap+base href` o `probe 250ms`, el optimizer no aprenderá esos casos.
- **No resuelve discovery dinámico:** DSPy optimiza *cómo* llamar tools, no *qué* tools existen. Complementalo con MCP (`05-mcp-2024.md`) para discovery.
- **Curva de aprendizaje:** pasar de prompts a `Signature`/`Module`/`Teleprompter` requiere cambio de mentalidad. Empezá con un solo pipeline (ej: QA sobre tu codebase).

## 6. Ejercicios prácticos

### Ejercicio 1 — Primer Signature (30 min)
1. Instalá `dspy` (Python) o portá la idea a TS: definí `Signature("question, context -> answer")` para QA sobre `desktop-app/src`.
2. Creá 10 ejemplos `trainset` con preguntas reales sobre tu repo ("¿qué hace split_cmd?", "¿cómo funciona mmap+base href?").
3. Corré `BootstrapFewShot` y compará accuracy vs prompt manual con los mismos 10 ejemplos.

### Ejercicio 2 — Desmontar un flujo de App.tsx (60 min)
1. Elegí un flujo de `App.tsx` con fetch hardcodeado (ej: SSE handler o `shell.fs` call).
2. Reescribilo como DSPy `ReAct("intent -> tool_call, observation -> result")` con `Signature` tipada.
3. Definí `metric = ast_match + execution_success` (ver `02-gorilla-bfcl-2023.md`) y compilá.

### Ejercicio 3 — Metric que importa (20 min)
1. Definí una `metric` para tu harness: `tool_ast_match` (¿eligió la tool correcta?) + `execution_success` (¿el call anduvo?).
2. Evaluá tu harness actual contra esa metric en 20 intents antes de compilar.
3. Compilá con DSPy y medí delta. Si no mejora, tu metric o trainset necesitan ajuste.

## 7. Referencias y checklist

- **Paper:** [DSPy — arXiv:2310.03714](https://arxiv.org/abs/2310.03714) · [dspy.ai](https://dspy.ai) · [GitHub stanfordnlp/dspy](https://github.com/stanfordnlp/dspy)
- **Relacionados:** `04-swe-agent-aci-2024.md` (diseño ACI que DSPy puede optimizar), `02-gorilla-bfcl-2023.md` (métricas para teleprompter), `05-mcp-2024.md` (discovery que DSPy no cubre)

### Checklist de lectura

- [ ] Leí abstract + §3 (Signatures/Modules) + §4 (Teleprompters) del paper original
- [ ] Entiendo la diferencia entre Signature, Module y Teleprompter y por qué el compilador supera prompt manual
- [ ] Definí al menos 1 `Signature` con `trainset` de 10+ ejemplos de mi dominio
- [ ] Corrí `BootstrapFewShot` y medí delta vs prompt manual
- [ ] Identifiqué 1 flujo de `App.tsx` para desmontar en `features/` con DSPy
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android · 02 Harness*
