# HuggingGPT — El LLM como controlador de modelos (Shen et al., 2023)

> **Paper:** HuggingGPT: Solving AI Tasks with ChatGPT and Its Friends in Hugging Face — Shen et al., Microsoft Research (2023)
> **Versión:** v2 · **Año:** 2023 · **Autores:** Yongliang Shen, Kaitao Song, Xu Tan, Dongsheng Li, Weiming Lu, Yueting Zhuang / Microsoft
> **Link:** [https://arxiv.org/abs/2303.17580](https://arxiv.org/abs/2303.17580) · [github.com/microsoft/JARVIS](https://github.com/microsoft/JARVIS)
> **Prioridad:** MEDIA P1 · **Nivel:** Intermedio · **Lectura:** ~14 min

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa.

---

## 1. Introducción

HuggingGPT plantea una idea simple y potente: **usar un LLM no para resolver la tarea directamente, sino como controlador que planifica, selecciona el modelo experto adecuado de HuggingFace, lo ejecuta y resume el resultado**. El LLM no traduce, no detecta objetos, no genera imágenes — elige *qué modelo* debe hacerlo basándose en descripciones, arma un plan en DAG y orquesta la ejecución. Todo zero-shot, sin entrenar nada, solo con prompting.

El pipeline es de 4 etapas: **Task Planning** (descompone el request en subtareas), **Model Selection** (rankea modelos HuggingFace por descripción vs subtarea), **Task Execution** (corre cada modelo y pasa outputs entre ellos) y **Response Generation** (resume todo en lenguaje natural). Evaluado en 100+ tareas que combinan NLP, visión y audio, demuestra que un LLM puede orquestar un ecosistema de modelos sin fine-tuning.

Para opencode-remote-android, HuggingGPT es el antecedente directo de tu `external_router.rs:19`: hoy tu router elige plugin con `if path ==` hardcodeado; HuggingGPT muestra cómo el LLM puede elegir plugin por **descripción + ranking**, no por condición estática. Es Toolformer manual pero con modelos en vez de APIs.

## 2. Ideas clave

| Etapa | Qué hace | Cómo elige |
|---|---|---|
| **Task Planning** | Descompone "describí esta imagen y traducila" en [image captioning → translation] | LLM genera DAG de subtareas con dependencias |
| **Model Selection** | Rankea modelos HuggingFace por similitud descripción ↔ subtarea | Embedding de descripción del modelo vs descripción de la subtarea |
| **Task Execution** | Ejecuta cada modelo en orden topológico, pasa outputs como inputs | HuggingFace Inference API |
| **Response Generation** | Sintetiza resultados parciales en respuesta final | LLM resume con contexto de toda la traza |

```
Usuario: "¿Qué hay en esta imagen? Traducilo al alemán"
  → Planning: [image-to-text] → [translation(en→de)]
  → Selection: rankea 100+ modelos captioning → elige BLIP mejor rankeado
               rankea 50+ modelos translation → elige Helsinki-NLP/opus-mt-en-de
  → Execution: BLIP("image.jpg") → "a cat sitting on a couch" → Helsinki("a cat...") → "eine Katze..."
  → Response: "En la imagen hay un gato... Traducido: eine Katze..."
```

| Idea | Por qué importa para tu harness |
|---|---|
| **Selección por descripción, no por if** | Tu `external_router` puede exponer `description` por plugin y dejar que el LLM rankee, en vez de `if name == "screenshots"` |
| **DAG de subtareas** | Tareas multi-step (`view→edit→lint→preview`) son DAGs; HuggingGPT muestra cómo planificarlos sin código imperativo |
| **Zero-shot sin training** | No necesitás fine-tuning para agregar un plugin nuevo — solo una descripción clara |

## 3. Evidencia y experimentos

| Aspecto | Resultado | Comentario |
|---|---|---|
| **Tareas evaluadas** | 100+ combinando NLP, visión, audio, video | GPT-4 como planner + HuggingFace como executors |
| **Model selection accuracy** | Alta cuando la descripción del modelo es clara; cae si es genérica | La calidad de la descripción es el bottleneck |
| **Planning accuracy** | Buena en descomposición lineal; sufre en DAGs complejos con dependencias no triviales | Ver TaskWeaver para DAGs con ejecución de código |
| **Sin fine-tuning** | Todo zero-shot via prompting | Ventaja: agregar modelo = agregar descripción, no reentrenar |

- **Ablation implícita:** si las descripciones de modelos son vagas ("this model does translation"), el ranking falla. Descripciones específicas ("English to German, trained on OPUS, BLEU 32") mejoran selección significativamente.
- **Costo:** cada subtarea es una llamada a HuggingFace Inference API + overhead del LLM planner. Para 3-4 subtareas, latencia acumulada es notable.
- **Comparación con Toolformer/Gorilla:** HuggingGPT no entrena selección; confía en prompting + ranking. Menos preciso que fine-tuning (Gorilla) pero más flexible para agregar modelos.

## 4. Cómo aplica a opencode-remote-android

| Concepto HuggingGPT | Mapeo concreto en tu repo |
|---|---|
| **Model selection por descripción** | En `shared/api/tools.ts`, cada tool/plugin lleva `description` rica: no "screenshots tool" sino "Captura screenshot de la webview actual, útil para verificar render de preview mmap+base href". El LLM rankea por intent. |
| **`external_router.rs:19 split_cmd` → planner** | Reemplazá `if path == "/shell/external/screenshots"` por: LLM genera plan `[probe screenshots → capture → return image]`, selecciona plugin por descripción, ejecuta. `split_cmd` queda como executor, no como router. |
| **DAG de subtareas** | Modelá `view→edit→lint→preview` como DAG: `view` y `search` en paralelo → `edit` → `lint` (cargo check) → `preview` (hyper :4850 mmap). El planner decide el orden, no tu código imperativo. |
| **`hyper :4850 mmap+br` + `tiny_http :4848` + `WS ptyx :4849`** | Cada infra es un "modelo" en términos HuggingGPT: `fs.read` (mmap), `pty.exec` (WS), `preview` (mmap+base href) compiten por ser seleccionados según la subtarea. Descripciones claras deciden. |
| **`probe() 250ms` + `cached_probe 1500ms`** | El planner puede decidir no probear `screenshots :3002` si la subtarea es "listar archivos" — selección inteligente ahorra probes innecesarios. |
| **5 plugins → N plugins** | Con HuggingGPT, agregar `widgetnotas` o `informes :5174` es agregar una entrada con descripción; el LLM lo descubre sin tocar el router. Es el paso previo a MCP (`05-mcp-2024.md`). |

```typescript
// shared/api/tools.ts — descripciones que HuggingGPT necesita para rankear bien
export const externalTools = [
  {
    name: "shell.external.screenshots.capture",
    description: "Captura screenshot de la webview actual. Usar para verificar render visual de preview, PDFs o HTML con mmap+base href. Retorna imagen base64.",
    inputSchema: { type: "object", properties: { fullPage: { type: "boolean" } } }
  },
  {
    name: "shell.fs.view",
    description: "Muestra archivo paginado con líneas numeradas (100 por página). Usar SIEMPRE antes de editar. Soporta mmap para archivos grandes.",
    inputSchema: { type: "object", properties: { path: { type: "string" }, startLine: { type: "number" } }, required: ["path"] }
  },
  // Cada description es el "ranking signal" — cuanto más específica, mejor selecciona el LLM
] as const;
```

```python
# Pseudocódigo planner estilo HuggingGPT para tu harness
def plan_and_execute(user_intent: str, tools: list[Tool]):
    # 1. Planning: LLM descompone intent en subtareas DAG
    dag = llm.plan(user_intent, available_tools=tools)  # ej: [view, edit, lint]
    # 2. Selection: rankea tools por descripción vs cada subtarea
    for task in dag.topological_order():
        ranked = rank_tools(task.description, tools)  # embedding similarity
        selected = ranked[0]
        # 3. Execution: corre tool y pasa output a siguiente tarea
        result = execute(selected, task.args)
        task.output = result
    # 4. Response: sintetiza
    return llm.summarize(dag)
```

> **Regla de oro:** si tu router necesita un `if` nuevo por cada plugin, estás haciendo routing imperativo. HuggingGPT muestra que routing por descripción + ranking escala a N plugins sin tocar código.

## 5. Anti-patterns y limitaciones

| Anti-pattern | Por qué duele | Qué hacer en cambio |
|---|---|---|
| **Descripciones genéricas** ("tool for files") | El LLM no puede rankear; elige al azar | Descripciones específicas con cuándo usar y qué retorna |
| **Plan lineal hardcodeado** (`view→edit→run` siempre igual) | No adapta a la tarea; hace pasos innecesarios | Planner DAG que decide orden según intent |
| **Sin validación de selección** | El LLM puede elegir `screenshots` para "listar archivos" | Validá selección con retriever o allowlist; logueá ranking |
| **Mandar todos los modelos/tools al prompt** | Explota contexto con 25+ tools | Retriever top-k antes de ranking (ver Gorilla `02-gorilla-bfcl-2023.md`) |

**Limitaciones del paper:**

- **Selección frágil sin fine-tuning:** prompting zero-shot es menos preciso que Gorilla fine-tuneado (62% AST accuracy). Para tu harness con 25 tools, el ranking por descripción puede fallar si dos tools se parecen.
- **DAGs complejos sufren:** el planner LLM alucina dependencias en tareas con muchas subtareas interconectadas. Necesita validación del DAG antes de ejecutar.
- **Costo y latencia:** cada subtarea = 1 LLM call (planning) + 1 tool call + 1 LLM call (selection) + 1 LLM call (response). Para 4 subtareas, 6+ llamadas al LLM.
- **No cubre seguridad:** cualquier tool con descripción maliciosa puede ser rankeada primera (ver `07-Seguridad/01-mcptox-2025.md`).

## 6. Ejercicios prácticos

### Ejercicio 1 — Mejorar descripciones (20 min)
1. Auditá las `description` de tus 25 tools en `shared/api`. ¿Son específicas o genéricas?
2. Reescribí 5 descripciones vagas con formato: "Qué hace + cuándo usar + qué retorna + ejemplo".
3. Medí si el LLM elige mejor con descripciones nuevas vs viejas en 10 intents (AST match).

### Ejercicio 2 — Planner DAG (45 min)
1. Tomá una tarea multi-step real: "encontrá el bug en fsx.rs, editalo, verificá con cargo check, mostrá preview".
2. Pedí al LLM que genere un DAG de subtareas con tus tools disponibles.
3. Validá que el DAG sea topológicamente correcto y ejecutalo paso a paso. Medí cuántos pasos se ahorra vs plan lineal.

### Ejercicio 3 — Ranking vs hardcode (30 min)
1. Implementá `rank_tools(intent, tools)` con embedding similarity (ej: `sentence-transformers` local o cosine sobre descripciones).
2. Compará: routing hardcodeado (`if intent.contains("screenshot") → screenshots`) vs ranking por descripción en 20 intents.
3. Reportá accuracy y casos donde el ranking falla (descripciones ambiguas).

## 7. Referencias y checklist

- **Paper:** [HuggingGPT — arXiv:2303.17580](https://arxiv.org/abs/2303.17580) · [GitHub microsoft/JARVIS](https://github.com/microsoft/JARVIS)
- **Relacionados:** `01-toolformer-2023.md` (tool use aprendido), `02-gorilla-bfcl-2023.md` (retriever + eval), `05-mcp-2024.md` (discovery dinámico superador), `08-taskweaver-2023.md` (code-first alternativo)

### Checklist de lectura

- [ ] Leí abstract + §3 (4 etapas) del paper original
- [ ] Entiendo por qué la calidad de la descripción es el bottleneck de model selection
- [ ] Reescribí al menos 5 `description` de tools con formato específico
- [ ] Probé planner DAG en una tarea multi-step real de mi repo
- [ ] Anoté 1 idea para desacoplar `external_router.rs:19` con routing por descripción
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android · 02 Harness*
