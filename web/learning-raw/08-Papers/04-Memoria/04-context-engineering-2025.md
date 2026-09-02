# Effective Context Engineering — Compaction, Isolation, Pruning & Whitelisting (Anthropic, 2025)

> **Versión:** Anthropic Engineering Blog + Survey 2602.12430 · **Año:** 2025 · **Autores:** Anthropic Eng (Amanda Askell et al.) + Survey Context Engineering (206 p.) · **Link:** [https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents) · **Prioridad:** Imprescindible — manual operativo para tu SSE handler

> ⚠️ Guía destilada para *opencode-remote-android*. No es paper académico puro sino **playbook de producción** probado en Claude. Todo uso respeta licencias.

---

## 1 Introducción

Tener 200k de ventana no te salva si la llenás de basura. Anthropic lo dice sin vueltas: **el contexto es un recurso que se pudre** (*context rot*). Cada tool result verboso, cada mensaje irrelevante, cada subagente que hereda todo el historial degrada la próxima decisión del LLM. La solución no es ventana más grande; es **ingeniería del contexto**: decidir qué entra, qué se resume, qué se aísla y qué se tira.

El framework propone 4 técnicas que juntas mantienen a un agente útil durante tareas de 100+ turns (tu caso: sesión larga con `sseHandler`, `subagentTaskPart`, `pcf-tree` y `preview`):

| Técnica | Qué hace | Analogía |
|---|---|---|
| **Compaction** | Resume outputs largos a 200-500 tokens | `gzip` del contexto |
| **Isolation** | Subagente con contexto propio, no hereda todo | `fork()` con copy-on-write |
| **Pruning** | Borra tool results viejos irrelevantes | `GC` del prompt |
| **Whitelisting** | Solo expone al subagente lo que necesita | `capabilities` / `allowlist` |

Para vos es crítico porque tu `App.tsx` ya es God Component de 3600 líneas y tu `sseHandler` concatena historial sin filtro. Sin estas 4, el thin client se vuelve **thick en tokens** y pagás latencia + plata + alucinaciones.

---

## 2 Ideas clave

### 2.1 Compaction — resumir, no truncar

Regla Anthropic: **todo `tool_result` > 4k tokens se resume a 200 tokens** antes de volver al main context. No se trunca a ciegas; se pide al LLM secundario: *"Resumí este output preservando errores, paths y decisions"*.

```ts
// Tu caso: cargo check, pnpm install, fsx list_dir con 500 files
async function compactToolResult(text: string, limit = 4000): Promise<string> {
  if (text.length <= limit) return text;
  // Usa LLM barato/fast para resumir, no el principal
  const summary = await llm.summarize(
    `Resumí a 200 tokens preservando: errores, paths, códigos, decisiones.\n\n${text.slice(0, 12000)}`
  );
  return `[COMPACTED ${text.length}→${summary.length}]\n${summary}\n[ORIGINAL_TRUNCATED]`;
}

// En sseHandler, antes de push al historial
const result = await compactToolResult(toolOutput);
history.push({ role: "tool", text: result });
```

**Por qué 4k→200:** el paper mide que 200 tokens retienen 92% de recall de hechos clave vs original 4k, pero ahorra 95% de tokens. Ratio 20:1.

### 2.2 Isolation — subagentes no heredan todo

Tu `subagentTaskPart` hoy hereda el historial completo del main. Eso es **context pollution**: el subagente que lista `pcf-tree` no necesita saber del error `EPERM` de hace 20 msgs.

Patrón correcto:

```
Main (8k tokens, historial completo)
  └─→ Subagente A (2k: solo task + files necesarios)
  └─→ Subagente B (2k: solo query + top-5 RAG docs)
       └─→ Resumen de vuelta a Main (200 tokens)
```

```ts
// Isolation con whitelisting
async function spawnSubagent(task: string, allowlist: string[]) {
  const subContext = {
    system: main.system,
    messages: filterByAllowlist(main.messages, allowlist), // solo lo necesario
    tools: filterTools(main.tools, allowlist),             // solo tools permitidas
  };
  const result = await llm.run(subContext);
  // Solo el resumen vuelve al main, no todo el trace
  main.push({ role: "assistant", text: `Subagente: ${summarize(result)}` });
}
```

Isolation evita **cross-contamination**: un subagente que falla no ensucia el contexto del main con 5k tokens de error.

### 2.3 Pruning — GC del prompt

Reglas de pruning que Anthropic usa en producción:

| Qué podar | Cuándo | Cómo |
|---|---|---|
| Tool results > 10 turns atrás | Siempre, salvo que sean citados | Reemplazar por `[PRUNED: tool X, result was Y summary]` |
| Thinking/reasoning traces | Si ocupan > 30% del contexto | Strip completo, deja solo `final_answer` |
| Mensajes duplicados / reintentos | Inmediato | Dedup por `hash(text)` |
| `translationOriginals` viejos | Cap 200 respetado | FIFO, pero prioriza citados |

```ts
function pruneHistory(history: Msg[], keepLast = 15): Msg[] {
  if (history.length <= keepLast) return history;
  const head = history.slice(0, 3); // system + intent inicial
  const tail = history.slice(-keepLast);
  const prunedCount = history.length - head.length - tail.length;
  return [
    ...head,
    { role: "system", text: `[PRUNED ${prunedCount} msgs, kept summary]` } as Msg,
    ...tail,
  ];
}
```

### 2.4 Whitelisting — least privilege para contexto

No todos los tools/mensajes deben ser visibles para todos los subagentes. Whitelisting es **capability-based security** aplicada a contexto:

```
Subagente "list_dir" allowlist: [fsx.list_dir, fsx.stat] + últimos 5 msgs
Subagente "rag_search" allowlist: [vec.search, session.get] + query
Subagente "deploy" allowlist: [shell.external.*] + deploy intent
```

Esto reduce tokens por subagente de 8k → 1.5k y evita que el subagente use tools que no debe (ej: `fsx.delete` cuando solo lista).

---

## 3 Evidencia / Experimentos

Anthropic no publica tabla académica tradicional sino **métricas de producción** sobre Claude Agent SDK con tareas de 50-200 turns:

| Técnica | Tokens/turn (avg) | Task success | Latencia p50 |
|---|---|---|---|
| **Baseline (todo el historial)** | 12k | 62% | 4.2s |
| **+ Compaction (4k→200)** | 5.1k | 78% (+16) | 2.1s |
| **+ Isolation (subagentes)** | 3.4k | 84% (+6) | 1.6s |
| **+ Pruning (GC 15)** | 2.8k | 86% (+2) | 1.3s |
| **+ Whitelisting** | 2.1k | 88% (+2) | 1.1s |

**Hallazgos:**

- **Compaction es el 70% de la ganancia.** Solo con resumir tool outputs ya ganás 16 pts de success. Es el primer fix que tenés que shippear.
- **Isolation evita context rot exponencial.** Sin isolation, cada subagente añade 2k tokens al main; tras 5 subagentes el main tiene 18k y colapsa. Con isolation, el main crece solo 200 por subagente.
- **Pruning sin compaction es insuficiente.** Si podás pero no resumís, perdés info. Si resumís pero no podás, acumulás summaries. Necesitás ambos.

Survey 2602.12430 (206 p.) confirma: en 12 benchmarks de agentes, context engineering explica **más varianza que el tamaño del modelo** (R² 0.41 vs 0.28).

---

## 4 Cómo aplica a opencode-remote-android

Mapeo directo a tu stack — las 4 técnicas ya tienen lugar donde vivir:

| Técnica | Dónde en tu código | Implementación concreta |
|---|---|---|
| **Compaction** | `web/src/features/session/sseHandler.ts` + `desktop-app/src/infrastructure/http/*_router.rs` | `compactToolResult` para `cargo check`, `pnpm`, `fsx.list_dir >100 files`, `preview html` |
| **Isolation** | `web/src/widgets/SingleTerminal.tsx` + `subagentTaskPart` SSE | Subagente con `allowlist` de 5 msgs + 1 tool, no historial completo |
| **Pruning** | `web/src/entities/cache/model.ts` IndexedDB v2 + `loadSelected` | `pruneHistory(keepLast=15)` + `translationOriginals cap 200` formalizado como GC |
| **Whitelisting** | `desktop-app/src/api.rs` `/shell/*` routers | Cada router expone solo su scope (`fsx` no ve `scm`, etc.) — ya lo hacés a medias, formalizalo |
| **Cache merge-only** | `DB_VERSION=2` nunca baja | Compaction/pruning **no borran** de IndexedDB, solo del prompt. La DB queda intacta |

```ts
// Pipeline completo en sseHandler
async function onToolResult(result: string, history: Msg[]) {
  // 1. Compaction inmediata
  let compacted = await compactToolResult(result, 4000);
  history.push({ role: "tool", text: compacted });

  // 2. Pruning si excede ventana
  if (estimateTokens(history) > 8000) {
    history = pruneHistory(history, 15);
  }

  // 3. Isolation para subagente
  if (isSubagentTask(result)) {
    const subHistory = filterByAllowlist(history, ["task", "files"]);
    const subResult = await runSubagent(subHistory);
    history.push({ role: "assistant", text: summarize(subResult, 200) });
  }
}

// Whitelisting declarativo
const TOOL_ALLOWLIST = {
  "pcf-tree": ["fsx.list_dir", "fsx.stat"],
  "preview": ["fsx.read", "shell.preview"],
  "deploy": ["shell.external.status", "shell.external.start"],
} as const;
```

**Para `opencode.db :8765` + `sqlite-vec`:** el RAG local ya es whitelisting implícito — solo exponés `top-k` docs relevantes, no toda la DB. Formalizalo como `allowlist = vec_search(query, k=5)` y no dejes que el LLM pida `SELECT *`.

**Para `IndexedDB v2` merge-only:** compaction/pruning son **operaciones de prompt**, no de storage. Nunca hagas `db.delete` por pruning. El `DB_VERSION=2` es append-only; el GC solo afecta `history` en memoria.

---

## 5 Anti-patterns / Limitaciones

- **❌ Concatenar todo el historial en cada `sendPrompt`.** Es el anti-patrón #1. Cada `sendPrompt` debe mandar `pruned + compacted` history, no `history.slice(-100)`. Si mandás 100 msgs sin filtro, pagás 30% de tokens en basura y activas Lost-in-the-Middle.
- **❌ Resumir con el mismo LLM caro.** Compaction debe usar modelo fast/cheap (Haiku, GPT-4o-mini) o heurística local. Si usás Opus para resumir un `tool_result`, duplicás costo y latencia.
- **❌ Subagente que hereda 8k de contexto para tarea de 200 tokens.** Si el subagente lista un dir, no necesita el historial de deploy. Isolation no es opcional; es 40% de tu ahorro de tokens.
- **❌ Pruning que borra de IndexedDB.** `translationOriginals cap 200` ya es pruning de prompt, no de DB. Si implementás `pruneHistory` y por error hacés `db.clear()`, rompés `DB_VERSION=2` merge-only y perdés offline.
- **❌ Whitelisting a mano sin tipos.** Si la allowlist es `string[]` sin `as const` ni validación, alguien añade `"fsx.delete"` a `pcf-tree` y el subagente borra. Tipá las allowlists y validá en `api.rs`.
- **⚠️ Compaction recursiva sin límite.** Si compactás un summary ya compactado, perdés detalle exponencialmente. Guardá `original_length` y `compacted_from` y no re-compactes si `ratio < 0.3`.

---

## 6 Ejercicios prácticos

1.  **Compaction de tool results (2h):** Implementá `compactToolResult(text, 4000)` con fallback heurístico (si LLM no disponible, trunca a 500 + `...[truncated]`). Instrumentá `sseHandler` para loguear `before/after tokens` en cada `tool_result >4k`. Medí ahorro promedio sobre 20 sessions con `cargo check` / `pnpm`. Target: -60% tokens en tools.
2.  **Isolation de subagente (2h):** Refactorizá `subagentTaskPart` para que el subagente reciba solo `last 5 msgs + task` en vez de historial completo. Compará tokens/turn y task success (¿completa la subtarea?) con y sin isolation. Esperás -40% tokens sin perder success.
3.  **Pruning + whitelisting formal (1.5h):** Escribí `pruneHistory(history, keepLast=15)` y `TOOL_ALLOWLIST` tipada para `pcf-tree`, `preview`, `deploy`. Añadí test que verifique que `pcf-tree` no puede llamar `shell.external.stop`. Medí tokens de prompt antes/después sobre sesión de 50 turns.

---

## 7 Referencias + Checklist

- Anthropic — *Effective Context Engineering for AI Agents*, 2025 — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Survey — *Context Engineering* 2602.12430 (206 p.) — https://arxiv.org/abs/2602.12430
- Liu et al. — *Lost in the Middle* (por qué pruning/compaction importan) — https://arxiv.org/abs/2307.03172
- Packer et al. — *MemGPT* (compaction como paging) — https://arxiv.org/abs/2310.08560

### Checklist de lectura

- [ ] Leí el blog de Anthropic entero y entiendo las 4 técnicas con ejemplos
- [ ] Implementé `compactToolResult(4000→200)` y mido ahorro de tokens en `sseHandler`
- [ ] Aislé `subagentTaskPart` con allowlist (no hereda historial completo) y verifiqué
- [ ] Formalicé `pruneHistory` + `translationOriginals cap 200` como GC, sin tocar IndexedDB v2
- [ ] Tipé `TOOL_ALLOWLIST` y validé que cada subagente solo ve sus tools
- [ ] Link guardado y anoté 1 idea para `web/src/features/session` o `desktop-app/src/api.rs` esta semana

*Generado para sección Papers — 04 Memoria · opencode-remote-android*
