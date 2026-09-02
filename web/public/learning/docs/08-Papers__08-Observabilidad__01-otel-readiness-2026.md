# LLM Readiness + OTel GenAI — Observabilidad del harness (2026)

> **Paper/Guía:** LLM Readiness Harness + OpenTelemetry GenAI Semantic Conventions — preprint 2603.27355 + OTel spec (2026)
> **Versión:** v2 · **Año:** 2026 · **Autores:** OTel GenAI SIG + LangSmith / OpenTelemetry
> **Links:** [arXiv:2603.27355](https://arxiv.org/abs/2603.27355) · [OTel GenAI SemConv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) · [LangSmith + OTel](https://docs.langchain.com/langsmith/trace-with-opentelemetry)
> **Prioridad:** ALTA P0 · **Nivel:** Avanzado · **Lectura:** ~16 min

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper y la spec originales para profundidad completa.

---

## 1. Introducción

Tu harness hoy es una caja negra: el agente llama tools, el SSE escupe `message.part.delta` (v1) o `session.next.*` (v2), y si algo falla no sabés si fue el modelo, el `probe() 250ms`, el `mmap` o el prompt. El framework **LLM Readiness Harness** (2603.27355, 2026) propone cerrar esa brecha con tres pilares: **benchmarks** (SWE-bench, BFCL, GAIA), **spans OTel tipados** (`gen_ai.request`, `tool.call`) y **CI gates** (promptfoo) que bloquean deploy si el readiness score cae. El resultado es un **score + Pareto cost/latency/quality** que te dice si tu harness está listo para producción o no.

La otra mitad es **OpenTelemetry GenAI Semantic Conventions**: la spec que estandariza cómo instrumentar `gen_ai.request { model, tokens, cost } → tool.call { name, args, duration, error } → gen_ai.response` para que Jaeger, Grafana o LangSmith puedan correlacionar cada `tool_call` con su latencia, costo y error — sin inventar tu propio formato. Define SLIs concretos para harness: **p95 latency, tool success rate, cost per task**.

Para opencode-remote-android esto es P0 porque sin observabilidad no podés optimizar (DSPy), evaluar (Gorilla/BFCL) ni defender (MCPTox). Es el cimiento.

## 2. Ideas clave

| Concepto | Qué es | Por qué importa |
|---|---|---|
| **Readiness score** | Agregado de benchmarks + OTel metrics + CI gates en un score único | Un número que bloquea deploy si baja — como coverage pero para harness |
| **OTel GenAI spans** | `gen_ai.request` → `tool.call` → `gen_ai.response` con atributos estándar | Correlación automática en cualquier backend OTel (Jaeger, Honeycomb) |
| **Pareto cost/latency/quality** | Frontera que muestra trade-off entre costo, latencia p95 y calidad (pass rate) | Decidís si pagar 2× por +5% accuracy vale la pena |
| **SLIs de harness** | `p95_latency`, `tool_success_rate`, `cost_per_task`, `tokens_per_task` | SLIs medibles con SLO y alerta, no "se siente lento" |
| **CI gates con promptfoo** | Evala prompts/tools en CI y falla el pipeline si regresa | Evita que un cambio en `shared/api` rompa el harness sin que te enteres |

```python
# Spans OTel GenAI — idea conceptual (spec 2025-26)
# Cada LLM call y cada tool call es un span con atributos estándar

# Span 1: gen_ai.request
span_genai = tracer.start_span("gen_ai.request", attributes={
    "gen_ai.system": "openai",              # o "anthropic", "ollama"
    "gen_ai.request.model": "gpt-4o",
    "gen_ai.usage.input_tokens": 2840,
    "gen_ai.usage.output_tokens": 312,
    "gen_ai.request.temperature": 0.2,
})

# Span 2: tool.call (hijo del anterior)
span_tool = tracer.start_span("tool.call", attributes={
    "tool.name": "shell.fs.read",
    "tool.args": '{"path": "web/src/App.tsx"}',
    "tool.duration_ms": 18,
    "tool.error": None,                     # o "ENOENT" si falla
})

# Span 3: gen_ai.response
span_resp = tracer.start_span("gen_ai.response", attributes={
    "gen_ai.response.id": "chatcmpl-abc",
    "gen_ai.usage.cost_usd": 0.0042,
})
```

**Jerarquía de spans para tu harness:**

```
trace: user_intent "agregá un log en fsx.rs"
├── gen_ai.request { model, tokens, cost }
│   ├── tool.call { name: "shell.fs.view", duration: 12ms, error: null }
│   ├── tool.call { name: "shell.fs.edit", duration: 45ms, error: null }
│   └── tool.call { name: "shell.pty.exec: cargo check", duration: 2100ms, error: null }
└── gen_ai.response { tokens_out, cost, latency_p95 }
```

## 3. Evidencia y experimentos

| Aspecto | Qué propone el framework | Cómo se mide |
|---|---|---|
| **Benchmarks** | SWE-bench + BFCL + GAIA como suite readiness | Pass rate por benchmark, agregado en readiness score |
| **OTel spans** | `gen_ai.*` + `tool.call` con atributos estándar | p95 latency, tool success rate, cost/task desde spans |
| **CI gates** | promptfoo eval en cada PR | Si `tool_success_rate < 95%` o `p95 > 3s`, falla CI |
| **Pareto** | Cost vs latency vs quality frontier | Cada config (modelo, k retriever, timeout) es un punto; elegís en la frontera |

- **No es paper con benchmark único** — es framework + spec. La "evidencia" es que define SLIs que antes no existían y da una forma reproducible de medir readiness.
- **OTel GenAI spec** ya está adoptada por LangSmith, Honeycomb, Grafana Tempo — instrumentás una vez, visualizás en cualquier backend.
- **promptfoo** (mencionado en el paper) permite gates del tipo: "si cambio el system prompt y BFCL-mini cae >3%, bloqueá el merge".

## 4. Cómo aplica a opencode-remote-android

| Concepto Readiness/OTel | Mapeo concreto en tu repo |
|---|---|
| **`hyper :4850` (mmap+br estáticos)** | Instrumentá cada `serve_file_mmap` con span `http.server.request { route: "/shell/preview/*", duration, status }`. Correlacioná con `tool.call` que lo disparó. |
| **`tiny_http :4848` (API + shell/*)** | Cada handler (`fsx.rs`, `scm_router.rs`, `external_router.rs:19`) emite `tool.call { name, args, duration, error }` hijo de `gen_ai.request`. |
| **`WS ptyx :4849`** | `pty.exec` como span `tool.call { name: "shell.pty.exec", args: { cmd }, duration, exitCode, error }`. Si `cargo check` tarda 2s, lo ves en el trace. |
| **`external_router.rs:19 split_cmd` + `probe 250ms`** | `probe()` y `ureq 1800/700ms` como spans anidados: `tool.call:external.probe { target: "screenshots:3002", duration, cached: bool }`. Ves si el 250ms es el cuello. |
| **`mmap+<base href>`** | `previewUrl /shell/preview/{token}/{file}` → span con atributo `preview.base_href_injected: true/false`. Si es false, el 404 de `/assets/*` se explica solo. |
| **`shared/api/version.ts` (dialecto v1/v2)** | Atributo `opencode.dialect: "v1"|"v2"` en `gen_ai.request`. Permite filtrar traces por dialecto y ver si v2 tiene más 400s por `model` en body. |
| **IndexedDB `DB_VERSION=2` merge-only** | Cada `tool.call` exitoso persiste `trace_id` en IndexedDB junto al resultado. Offline, podés reconstruir el trace sin server. |
| **CI gate** | En GitHub Actions / Codemagic, corrés `bfcl-mini` + `toolbench-mini` y fallás si `tool_success_rate < 95%` o `cost_per_task` sube >10%. |

```rust
// desktop-app/src/infrastructure/http/api.rs — instrumentación OTel (conceptual)
// Con opentelemetry + opentelemetry-otlp en Rust
use opentelemetry::{global, trace::{Tracer, SpanKind}};

pub fn handle_fs_read(path: &str) -> HttpResponse {
    let tracer = global::tracer("desktop-app");
    let mut span = tracer.start_with_context("tool.call", &Context::current());
    span.set_attribute(KeyValue::new("tool.name", "shell.fs.read"));
    span.set_attribute(KeyValue::new("tool.args.path", path.to_string()));
    let start = Instant::now();

    let result = fsx::read(path); // tu mmap por debajo

    span.set_attribute(KeyValue::new("tool.duration_ms", start.elapsed().as_millis() as i64));
    span.set_attribute(KeyValue::new("tool.error", result.as_ref().err().map(|e| e.to_string()).unwrap_or_default()));
    span.end();
    result.into_response()
}
```

```typescript
// web/src/shared/observability/tracing.ts — correlación SSE ↔ tool_call
// Cada SSE event lleva trace_id que correlaciona con tool.call spans
interface TracedSSEEvent {
  traceId: string;           // OTel trace_id
  spanId: string;            // span del gen_ai.request
  event: "message.part.delta" | "session.next.*";
  data: unknown;
}
// En IndexedDB: { traceId, toolCalls: [{ name, duration, error }], cost, latency }
```

> **Regla de oro:** si no podés responder "¿cuánto cuesta y cuánto tarda cada tool_call p95?" con un dashboard, no tenés observabilidad. OTel GenAI te da el schema; solo tenés que instrumentar.

## 5. Anti-patterns y limitaciones

| Anti-pattern | Por qué duele | Qué hacer en cambio |
|---|---|---|
| **Logs de texto sin spans** | `console.log("fs.read ok")` no correlaciona con `gen_ai.request` | Spans OTel con `trace_id` propagado desde `gen_ai.request` a cada `tool.call` |
| **Un solo número ("funciona")** | Oculta si p95 es 5s o si `probe 250ms` falla 20% | Readiness score + Pareto + SLIs separados |
| **Sin CI gates** | Un cambio en `shared/api` rompe BFCL y nadie se entera hasta producción | promptfoo / bfcl-mini en CI que bloquea merge |
| **Instrumentar solo el LLM** | Ves tokens pero no sabes qué tool falló ni por qué | `gen_ai.request` + `tool.call` + `http.server.request` como spans relacionados |
| **Atributos ad-hoc sin spec** | Cada team inventa `toolName` vs `tool.name` vs `function` — no agregable | Seguir OTel GenAI SemConv exacto (`gen_ai.*`, `tool.*`) |

**Limitaciones del paper/spec:**

- **Preprint 2026, spec en evolución:** la semconv GenAI sigue cambiando (breaking en atributos). Fijá versión (`opentelemetry-semantic-conventions 1.30+`) y actualizá con changelog.
- **Overhead de spans:** cada `tool.call` como span añade ~1-2ms + payload OTLP. Para tu desktop-app con 25 tools, muestrea (`TraceIdRatioBased 0.1` en prod, `AlwaysOn` en dev).
- **No cubre seguridad:** OTel traza *qué* pasó, no *si* fue poisoning. Complementá con vetting MCPTox (`07-Seguridad/01-mcptox-2025.md`).
- **Readiness score subjetivo:** ponderar SWE-bench vs BFCL vs cost es decisión de producto, no del paper. Definí tus pesos y documentalos.

## 6. Ejercicios prácticos

### Ejercicio 1 — Primer span OTel en Rust (45 min)
1. Agregá `opentelemetry` + `opentelemetry-otlp` a `desktop-app/Cargo.toml`.
2. Instrumentá `fsx::read` con span `tool.call { name, args.path, duration_ms, error }` hijo de un `gen_ai.request` propagado por header `traceparent`.
3. Levantá Jaeger (`docker run -p 16686:16686 jaegertracing/all-in-one`) y verificá que el trace aparezca con ambos spans correlacionados.

### Ejercicio 2 — Dashboard de SLIs (30 min)
1. Definí SLIs: `p95_tool_latency`, `tool_success_rate`, `cost_per_task` (tokens × precio).
2. Emití 20 `tool.calls` variados (fs.read, pty.exec, probe) y calculá p95 y success rate desde los spans.
3. Graficá Pareto: cada config (sync vs async probe, k=3 vs k=5 retriever) como punto cost/latency/quality.

### Ejercicio 3 — CI gate con bfcl-mini (30 min)
1. Integrá `web/scripts/bfcl-mini.mjs` (ver `02-Harness/02-gorilla-bfcl-2023.md`) en CI con threshold: `tool_success_rate >= 95%`.
2. Introducí un cambio que rompa un `description` de tool y verificá que CI falle.
3. Añadí gate de costo: si `tokens_per_task` sube >10% vs main, warning.

## 7. Referencias y checklist

- **Paper/Preprint:** [LLM Readiness — arXiv:2603.27355](https://arxiv.org/abs/2603.27355)
- **Spec:** [OTel GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/) · [OTel Rust](https://github.com/open-telemetry/opentelemetry-rust)
- **Guías:** [LangSmith + OTel](https://docs.langchain.com/langsmith/trace-with-opentelemetry) · [promptfoo](https://www.promptfoo.dev/)
- **Relacionados:** `02-langsmith-2024.md` (trazado práctico), `02-Harness/02-gorilla-bfcl-2023.md` (BFCL para readiness), `07-Seguridad/01-mcptox-2025.md` (auditar tool poisoning)

### Checklist de lectura

- [ ] Leí el preprint 2603.27355 (al menos §2 readiness + §3 OTel spans) y la spec OTel GenAI
- [ ] Entiendo la diferencia entre readiness score, Pareto y SLIs y por qué van juntos
- [ ] Instrumenté al menos 1 `tool.call` con OTel en `desktop-app` y lo vi en Jaeger/Tempo
- [ ] Definí SLIs `p95`, `success_rate`, `cost/task` para mi harness y los grafiqué
- [ ] Configuré CI gate que bloquea si BFCL-mini o cost regresa
- [ ] Link del paper/spec guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android · 08 Observabilidad*
