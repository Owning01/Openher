# Gorilla y BFCL — Evaluar tool use de verdad, no a ojo (Patil et al., Berkeley 2023-25)

> **Papers:** Gorilla: Large Language Model Connected with Massive APIs (Patil et al., 2023) + Berkeley Function Calling Leaderboard BFCL v4 (2024-26)
> **Versión:** v2 · **Año:** 2023-2025 · **Autores:** Shishir Patil, Tianjun Zhang, Xin Wang et al. / UC Berkeley
> **Links:** [Gorilla arXiv:2305.15334](https://arxiv.org/abs/2305.15334) · [BFCL Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) · [github.com/ShishirPatil/gorilla](https://github.com/ShishirPatil/gorilla)
> **Prioridad:** Imprescindible (cómo medir tu harness) · **Nivel:** Avanzado · **Lectura:** ~18 min

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé los papers originales para profundidad completa.

---

## 1. Introducción

La mayoría de los equipos evalúa tool use mirando si "parece que anduvo". Gorilla y BFCL demuestran que eso no alcanza. Gorilla fine-tunea LLaMA-7B sobre 1.600 APIs reales (TorchHub, TensorFlow Hub, HuggingFace) y, con evaluación rigurosa, supera a GPT-4 en APIs no vistas. BFCL es el benchmark vivo que lo hace posible: no compara texto con BLEU, compara **árboles sintácticos (AST)** y **ejecución real** en sandbox.

¿Por qué te importa? Tu `external_router.rs:19` expone ~25 tools (`shell.fs.*`, `shell.git.*`, `shell.pty.*`, 5 plugins externos). Si no medís AST accuracy y ejecución, no sabés si tu harness elige la tool correcta o solo "parece" que lo hace. Este paper te da el método para medirlo y el retriever para no fundir tokens.

El aporte no es solo el modelo Gorilla, es el **cambio de métrica**: de "¿el texto se parece?" a "¿el call es sintácticamente correcto y produce el efecto esperado?".

## 2. Ideas clave

| Idea | Qué resuelve | Cómo funciona |
|---|---|---|
| **AST evaluation** | Falsos positivos de BLEU/ROUGE | Parsea `tool_call` a AST y compara función + args tipados, no strings |
| **Execution evaluation** | Calls válidos sintácticamente pero inútiles | Ejecuta el call en sandbox y verifica efecto (archivo creado, output correcto) |
| **Retriever top-k** | 1.600 APIs no entran en contexto | BM25 + dense retriever selecciona top-5 relevantes por intent; solo esas van al prompt |
| **Categorías BFCL** | Un solo número oculta debilidades | Single, parallel, multi-turn, relevancia (¿rechaza tool irrelevante?) |

```python
# Pseudocódigo de evaluación AST (idea BFCL)
import ast

def ast_match(pred_call: str, gold_call: str) -> bool:
    pred = ast.parse(pred_call).body[0].value   # ej: shell_fs_read(path="a.ts")
    gold = ast.parse(gold_call).body[0].value
    return (pred.func.id == gold.func.id
            and pred.keywords.keys() == gold.keywords.keys()
            and all(pred.kw.value == gold.kw.value for kw in pred.keywords))
# No importa si el modelo agregó comillas distintas o espacios: el AST decide.
```

**Pipeline Gorilla:**

```
1.600 APIs + docs → retriever (BM25/dense) → top-5 por intent
                                          → prompt con solo esas 5
                                          → LLaMA-7B fine-tuned genera call
                                          → eval AST + ejecución
```

**Por qué el retriever importa para vos:** mandar 25 tools en cada turno te cuesta 2-3k tokens extra y confunde al modelo. Con retriever top-5 ahorrás ~70% de tokens de system prompt.

## 3. Evidencia y experimentos

| Métrica | Gorilla 7B | GPT-4 (2023) | GPT-3.5 | Comentario |
|---|---|---|---|---|
| **AST accuracy (APIs no vistas)** | **62%** | 54% | ~40% | Gorilla generaliza a APIs fuera del training |
| **Hallucination rate** | menor | mayor | mayor | Fine-tune con docs reduce invención de args |
| **Con retriever vs sin** | +8-12 pts | — | — | Filtrar APIs irrelevantes mejora precisión |

**BFCL v4 (estado 2026-04):**

| Modelo | Overall | Single | Parallel | Multi-turn | Relevancia |
|---|---|---|---|---|---|
| Claude 3.5 Sonnet | top 1-2 | alto | alto | alto | alto |
| GPT-4o | top 1-3 | alto | medio-alto | alto | medio |
| Gemini 2.5 | top 3 | alto | alto | medio | alto |

> Los números exactos cambian porque BFCL es leaderboard vivo; consultá [gorilla.cs.berkeley.edu/leaderboard.html](https://gorilla.cs.berkeley.edu/leaderboard.html) para el estado actual. La lección estable es: **AST + ejecución > BLEU siempre**.

**Ablations:**

- Sin retriever (todas las APIs en contexto): cae accuracy y sube hallucination — el modelo se distrae.
- Solo BLEU como métrica: 15-20% de falsos positivos vs AST (calls que "se ven bien" pero tienen arg mal tipado).

## 4. Cómo aplica a opencode-remote-android

| Concepto Gorilla/BFCL | Mapeo concreto en tu repo |
|---|---|
| **AST eval** | Creá `web/scripts/bfcl-mini.mjs` que valide `tool_call` de `shell.fs.*` por AST, no por string match. Detecta `model` en body v2 (400) al instante. |
| **Execution eval** | No alcanza con "el JSON parsea": ejecutá `shell.fs.read` contra `G:\Proyectos\opencode-remote-android` real y verificá que el contenido coincida. Usa `tiny_http :4848` como sandbox. |
| **Retriever top-k** | Implementá BM25 simple en `shared/api/retriever.ts`: dado el intent del usuario, rankeá tus 25 tools y mandá solo top-5 al system prompt. Ahorro directo de tokens. |
| **Categorías** | Evaluá separado: single (`fs.read`), parallel (`fs.list + git.status`), multi-turn (flujo `view→edit→lint`), relevancia (¿rechaza `shell.fs.delete` cuando no corresponde?). |
| **Probe 250ms + ureq 1800/700ms** | El retriever también decide qué plugins externos chequear: si el intent es "listar archivos", no probes `screenshots :3002` ni `opendesign :3000`. Probe selectivo ahorra latencia. |
| **`external_router.rs:19 split_cmd` + `WS ptyx :4849`** | El router usa `split_cmd` + `CREATE_NO_WINDOW` para spawnear plugins; `ptyx :4849` expone `pty.exec` como tool validable por AST. Guardrails de pty evitan que BFCL execution eval borre archivos. |
| **hyper :4850 mmap + `<base href>`** | Para execution eval de `previewUrl /shell/preview/{token}/{file}`, verificá que el HTML servido tenga `<base href>` inyectado; si no, el AST puede ser correcto pero el render falla (404 de `/assets/*`). |

```typescript
// web/scripts/bfcl-mini.mjs — esqueleto de eval AST + ejecución
import { parseToolCall } from "../src/shared/api/toolParser.js";

const cases = [
  { intent: "leé web/src/App.tsx", gold: `shell_fs_read(path="web/src/App.tsx")` },
  { intent: "listá desktop-app/src", gold: `shell_fs_list(path="desktop-app/src")` },
  // + parallel, multi-turn, relevancia
];

for (const c of cases) {
  const pred = await callModel(c.intent, { retrieverTopK: 5 });
  const astOk = astEqual(pred.tool_call, c.gold);
  const execOk = astOk ? await executeAndVerify(pred.tool_call) : false;
  console.log(c.intent, { astOk, execOk });
}
```

> **Regla de oro:** si tu eval es "probé a mano y anduvo", no tenés eval. BFCL te obliga a automatizar AST + ejecución en CI.

## 5. Anti-patterns y limitaciones

| Anti-pattern | Por qué duele | Qué hacer en cambio |
|---|---|---|
| **Evaluar con BLEU/ROUGE o "a ojo"** | 15-20% falsos positivos; no detecta arg mal tipado | AST + ejecución en sandbox |
| **Mandar las 25 tools siempre** | +2-3k tokens/turn, más hallucination, más costo | Retriever top-k por intent |
| **Snapshot de leaderboard viejo** | BFCL v2 tuvo contaminación con datos enterprise filtrados | Usar leaderboard vivo, no snapshot estático |
| **Solo single-turn eval** | Oculta fallas en flujos reales (`view→edit→lint→run`) | Evaluar las 4 categorías BFCL |

**Limitaciones del paper:**

- Gorilla fine-tuneado rinde bien en APIs vistas/similares; en APIs totalmente nuevas depende del retriever y de docs claras.
- BFCL requiere sandbox de ejecución por dominio — armar el sandbox para `shell.pty.exec` exige aislamiento real (no `rm -rf` en tu workspace).
- El retriever BM25 es simple; dense retriever mejora pero añade infra.

## 6. Ejercicios prácticos

### Ejercicio 1 — BFCL-mini local (60 min)
1. Definí 10 intents que cubran `shell.fs.read/list`, `shell.git.status`, `shell.pty.exec`, `external/screenshots`.
2. Escribí `web/scripts/bfcl-mini.mjs` con eval AST (compará función + args) y execution (ejecutá contra `tiny_http :4848`).
3. Corré contra tu modelo actual y reportá: AST accuracy, execution accuracy, hallucination rate.

### Ejercicio 2 — Retriever y ahorro de tokens (30 min)
1. Implementá BM25 en `shared/api/retriever.ts` sobre las descripciones de tus 25 tools.
2. Medí tokens de system prompt con 25 tools vs top-5 retrieved en 20 intents. Graficá ahorro vs accuracy.
3. Decidí el `k` óptimo para tu app (probá k=3,5,7).

### Ejercicio 3 — Validación de contrato v2 (20 min)
1. Agregá casos BFCL que intenten mandar `model`/`agent` en body v2 (debe dar 400).
2. Verificá que tu `shared/api/version.ts` (detección de dialecto v1/v2 memoizado por host) + validador de schema rechacen esos calls por AST.

## 7. Referencias y checklist

- **Papers:** [Gorilla arXiv:2305.15334](https://arxiv.org/abs/2305.15334) · [BFCL Leaderboard](https://gorilla.cs.berkeley.edu/leaderboard.html) · [BFCL GitHub](https://github.com/ShishirPatil/gorilla)
- **Relacionados en este repo:** `01-toolformer-2023.md` (cómo enseñar tool use), `03-toollm-2023.md` (DFS multi-step), `05-mcp-2024.md` (discovery dinámico)

### Checklist de lectura

- [ ] Leí abstract + §3 (método AST/execution) de Gorilla y exploré BFCL leaderboard vivo
- [ ] Entiendo por qué AST + ejecución > BLEU y por qué el retriever es obligatorio con 25+ tools
- [ ] Implementé `bfcl-mini.mjs` con al menos 10 casos y eval AST
- [ ] Medí ahorro de tokens con retriever top-k vs full tool list
- [ ] Anoté 1 idea para CI de harness esta semana
- [ ] Links guardados en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android · 02 Harness*
