# LangSmith + OTel GenAI — Trazar el harness sin perder la cabeza (LangChain 2024)

> **Guía/Paper:** LangSmith Observability + OpenTelemetry GenAI Semantic Conventions — LangChain (2024)
> **Versión:** v2 · **Año:** 2024 · **Autores:** LangChain Team
> **Links:** [LangSmith Observability](https://docs.smith.langchain.com/observability) · [OTel GenAI SemConv](https://opentelemetry.io/docs/specs/semconv/gen-ai/) · [LangSmith + OTel Docs](https://docs.langchain.com/langsmith/trace-with-opentelemetry)
> **Prioridad:** MEDIA P1 · **Nivel:** Intermedio · **Lectura:** ~13 min

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé la doc original para profundidad completa.

---

## 1. Introducción

LangSmith es la plataforma de observabilidad de LangChain que traza **cada LLM call, cada tool call y cada retriever step** con un modelo de `run` jerárquico, y lo hace interoperable con OpenTelemetry GenAI. La idea es simple: si tu harness hace `gen_ai.request → retriever → tool.call → gen_ai.response` en 4 saltos, querés ver esos 4 saltos como un trace, comparar prompts, evaluar con datasets y detectar regresiones — no scrollear logs de texto.

La gracia de LangSmith + OTel es que no tenés que elegir: podés usar **LangSmith como backend** (hosted, con evaluación y datasets integrados) o **OTel Collector + Jaeger/Tempo** (self-hosted, vendor-neutral) con la misma instrumentación. La spec OTel GenAI (`gen_ai.request`, `tool.call`) es el pegamento que hace que tu `desktop-app` Rust hable el mismo idioma que tu `web/src` TS.

Para opencode-remote-android esto resuelve el debug más doloroso: correlacionar un `SSE event` (`message.part.delta` v1 vs `session.next.*` v2) con el `tool_call` que lo disparó y con la latencia del `probe() 250ms` que lo precedió. Sin tracing, ese debug es `console.log` y esperanza.

## 2. Ideas clave

| Concepto | Qué es | Cómo lo ves en LangSmith / OTel |
|---|---|---|
| **Run jerárquico** | Cada `gen_ai.request` es un run padre; cada `tool.call` y `retriever` es un run hijo | Árbol en LangSmith UI; spans anidados en Jaeger |
| **Datasets + evaluation** | Guardás `input → expected output` y corrés el harness contra el dataset con métricas | Comparás prompt v1 vs v2 en la misma tabla, con pass rate |
| **OTel interop** | LangSmith acepta OTLP; tu Rust emite OTel y aparece en LangSmith sin SDK extra | `opentelemetry-otlp` en Rust → LangSmith endpoint |
| **Prompt hub + versionado** | Cada prompt es versionado y A/B testeable contra el dataset | Ves qué prompt mejora BFCL-mini sin tocar código |
| **Correlación SSE ↔ tool_call** | Cada SSE event lleva `trace_id` / `run_id` que lo ata a su `tool.call` | Click en el trace → ves el delta que disparó cada tool |

```
Trace LangSmith / OTel para un intent "listá archivos de web/src"

run: gen_ai.request (gpt-4o, 2.8k in / 312 out, $0.004)
├── run: retriever (BM25 top-5, 18ms) → tools: [fs.list, fs.read, git.status]
├── run: tool.call fs.list { path: "web/src", duration: 14ms, status: ok }
│   └── span: http.server.request { route: "/shell/fs/list", status: 200, mmap: false }
├── run: tool.call fs.read { path: "web/src/App.tsx", duration: 22ms, status: ok }
│   └── span: hyper :4850 mmap read { bytes: 42k, br: true }
└── run: gen_ai.response (312 tokens, p95 1.2s)
```

```typescript
// web/src/shared/observability/langsmith.ts — tracing en el frontend (conceptual)
import { traceable } from "langsmith/traceable";
import { Client } from "langsmith";

// Envuelve tu harness para que cada call sea un run trazado
const callWithTools = traceable(
  async (intent: string) => {
    const tools = retrieveRelevantTools(intent, 5);          // retriever run
    const result = await callLLM(intent, tools);             // gen_ai.request run
    for (const tc of result.tool_calls) {
      await executeTool(tc);                                 // tool.call run
    }
    return result;
  },
  { name: "harness.callWithTools", run_type: "chain" }
);

// Evaluación contra dataset
const client = new Client();
await client.evaluate(
  (input) => callWithTools(input.question),
  { data: "bfcl-mini", evaluators: [astMatch, executionSuccess] }
);
```

## 3. Evidencia y estado del ecosistema

| Aspecto | Estado 2024-26 | Qué implica para vos |
|---|---|---|
| **LangSmith adoption** | Hosted + self-hosted, usado por LangChain, OTel GenAI | Backend listo sin montar infra si querés hosted |
| **OTel GenAI spec** | Adoptada por LangSmith, Honeycomb, Grafana Tempo, Jaeger | Instrumentás una vez en Rust, visualizás donde quieras |
| **Prompt hub** | Versionado + A/B + playground con datasets | Probás prompts sin redeploy de `desktop-app` |
| **Evaluación** | Datasets + evaluators (LLM-as-judge, exact match, AST) | Tu `bfcl-mini` es un dataset LangSmith nativo |
| **Costo** | LangSmith hosted con free tier; OTel self-hosted gratis | Empezá con Jaeger local, migrá a LangSmith si necesitás eval |

- **No es paper con benchmark** — es plataforma + spec. La "evidencia" es adopción y la capacidad de detectar regresiones que sin tracing no ves.
- **Comparación con OTel puro (ver `01-otel-readiness-2026.md`):** LangSmith añade **datasets + evaluación + prompt hub** sobre OTel. Si solo necesitás spans, OTel + Jaeger alcanza; si querés evaluar prompts contra BFCL-mini, LangSmith aporta más.

## 4. Cómo aplica a opencode-remote-android

| Concepto LangSmith/OTel | Mapeo concreto en tu repo |
|---|---|
| **`tiny_http :4848` handlers** | Cada handler (`fsx.rs`, `scm_router.rs`, `external_router.rs:19`) emite `tool.call` span hijo de `gen_ai.request`. LangSmith muestra el árbol completo. |
| **`hyper :4850 mmap+br`** | Span `http.server.request { route: "/shell/preview/*", mmap: true, br: true, base_href_injected: bool }`. Ves si el 404 es por falta de `<base href>`. |
| **`WS ptyx :4849`** | `tool.call { name: "shell.pty.exec", args: { cmd }, exitCode, duration }` + `stderr` como atributo. Si `cargo check` falla, el trace muestra el `stderr` exacto. |
| **`external_router.rs:19 split_cmd` + `probe 250ms`** | `tool.call:external.probe { target, duration, cached, status }` como span. Si `probe` es el cuello p95, lo ves al instante en el trace. |
| **`mmap+<base href>`** | Atributo `preview.base_href: "/shell/external/<name>/embed/"` en el span de preview. Correlacioná `tool.call` con `preview` render. |
| **`shared/api/version.ts` dialecto v1/v2** | Atributo `opencode.dialect` en `gen_ai.request`. Filtrá traces por dialecto y compará latencia/error rate v1 vs v2. |
| **`SSE` (`message.part.delta` / `session.next.*`)** | Cada SSE event lleva `trace_id` propagado por `traceparent` header. En LangSmith, click en el `delta` → salta al `tool.call` que lo generó. |
| **IndexedDB `DB_VERSION=2`** | Persistí `trace_id` + `tool_calls` en IndexedDB para reconstruir el trace offline. LangSmith puede re-hidratar desde OTLP exportado. |
| **Datasets** | Tu `bfcl-mini` (ver `02-Harness/02-gorilla-bfcl-2023.md`) como dataset LangSmith: cada fila es `{ intent, expected_tool_call }` con evaluators `astMatch` + `executionSuccess`. |

```rust
// desktop-app/src/infrastructure/observability/otel.rs — OTel → LangSmith/Jaeger
use opentelemetry_otlp::WithExportConfig;

pub fn init_tracer() -> Result<(), Box<dyn std::error::Error>> {
    // Mismo tracer, dos backends: Jaeger local o LangSmith OTLP
    let otlp_exporter = opentelemetry_otlp::new_exporter()
        .tonic()
        .with_endpoint(std::env::var("OTEL_EXPORTER_OTLP_ENDPOINT")
            .unwrap_or("http://localhost:4317".into()));

    let tracer = opentelemetry_otlp::new_pipeline()
        .tracing()
        .with_exporter(otlp_exporter)
        .install_batch(opentelemetry_sdk::runtime::Tokio)?;

    global::set_tracer_provider(tracer);
    Ok(())
}
// OTEL_EXPORTER_OTLP_ENDPOINT=https://api.smith.langchain.com/otel  → LangSmith
// OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317                  → Jaeger
```

> **Regla de oro:** si debuggeás tu harness con `console.log` y "probé a mano y anduvo", estás a ciegas. Un trace LangSmith/OTel te muestra en 1 click qué tool falló, cuánto tardó cada `probe 250ms` y qué `SSE delta` lo disparó.

## 5. Anti-patterns y limitaciones

| Anti-pattern | Por qué duele | Qué hacer en cambio |
|---|---|---|
| **Solo logs de texto** | No correlaciona `gen_ai.request` con `tool.call` ni con `SSE delta` | Spans OTel con `trace_id` propagado (`traceparent` header) |
| **Trazar solo el LLM** | Ves tokens pero no sabes qué `probe` o `mmap` falló | `gen_ai.request` + `tool.call` + `http.server.request` como árbol |
| **Sin datasets** | Cada cambio de prompt se evalúa "a ojo" | Dataset `bfcl-mini` en LangSmith con evaluators `astMatch` |
| **OTLP sin muestreo** | Cada `tool.call` como span en prod = overhead + costo | `TraceIdRatioBased 0.1` en prod, `AlwaysOn` en dev |
| **Atributos ad-hoc** | `toolName` vs `tool.name` vs `function` — no agregable | Seguir OTel GenAI SemConv exacto (`gen_ai.*`, `tool.*`) |

**Limitaciones honestas:**

- **LangSmith hosted es vendor lock-in parcial:** si usás prompt hub + datasets hosted, migrar a otro backend cuesta. OTel puro es más portable; LangSmith es más potente para eval.
- **Overhead de instrumentación:** cada span añade 1-2ms + serialización OTLP. Para tu desktop-app con 25 tools, el overhead es despreciable en dev pero medilo en prod antes de `AlwaysOn`.
- **No detecta poisoning solo:** el trace muestra *qué* tool se llamó, no *si* su `description` estaba envenenada. Complementá con vetting MCPTox (`07-Seguridad/01-mcptox-2025.md`).
- **Curva de LangSmith:** datasets + evaluators + prompt hub requieren aprender la plataforma. Empezá con OTel + Jaeger local y añadí LangSmith cuando necesites eval.

## 6. Ejercicios prácticos

### Ejercicio 1 — Jaeger local en 10 minutos (20 min)
1. `docker run -d -p 4317:4317 -p 16686:16686 jaegertracing/all-in-one:latest`
2. Instrumentá `fsx::read` en `desktop-app` con `opentelemetry-otlp` y `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317`.
3. Hacé un `shell.fs.read` desde `web/src` y verificá el trace en `http://localhost:16686` con `tool.call` hijo de `gen_ai.request`.

### Ejercicio 2 — Correlacionar SSE con tool_call (30 min)
1. Propagá `traceparent` desde `web/src` (fetch a `tiny_http :4848`) hasta `desktop-app` (extrae `trace_id` del header).
2. Cada SSE event (`message.part.delta` / `session.next.*`) debe llevar `trace_id` en su payload o header.
3. En Jaeger/LangSmith, click en el `SSE delta` → verificá que salte al `tool.call` que lo generó.

### Ejercicio 3 — Dataset bfcl-mini en LangSmith (45 min)
1. Creá un dataset en LangSmith con 10 filas `{ intent, expected_tool_call }` de tu `bfcl-mini` (ver `02-Harness/02-gorilla-bfcl-2023.md`).
2. Definí evaluators `astMatch` (¿AST coincide?) y `executionSuccess` (¿el call anduvo en `tiny_http :4848`?).
3. Corré tu harness contra el dataset y compará dos prompts (con y sin retriever top-k). Reportá delta de pass rate y tokens.

## 7. Referencias y checklist

- **Docs:** [LangSmith Observability](https://docs.smith.langchain.com/observability) · [LangSmith + OTel](https://docs.langchain.com/langsmith/trace-with-opentelemetry) · [OTel GenAI SemConv](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- **Relacionados:** `01-otel-readiness-2026.md` (framework readiness + SLIs), `02-Harness/02-gorilla-bfcl-2023.md` (BFCL-mini como dataset), `07-Seguridad/01-mcptox-2025.md` (auditar poisoning en traces)

### Checklist de lectura

- [ ] Leí la doc de LangSmith Observability (runs, datasets, evaluators) y la spec OTel GenAI
- [ ] Entiendo la diferencia entre OTel puro (spans) y LangSmith (spans + datasets + prompt hub)
- [ ] Levanté Jaeger local y vi un trace `gen_ai.request → tool.call` de mi harness
- [ ] Correlacioné un SSE event con su `tool.call` vía `trace_id` / `traceparent`
- [ ] Creé un dataset `bfcl-mini` en LangSmith (o local) y corrí evaluators
- [ ] Links guardados en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android · 08 Observabilidad*
