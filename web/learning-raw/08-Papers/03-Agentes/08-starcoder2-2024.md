# StarCoder2 — Código abierto permissivo a escala (Lozhkov et al., 2024)

> **Autores:** Lozhkov, Li, Allal et al. / BigCode (Hugging Face + ServiceNow)
> **Año:** 2024 · **Prioridad:** Media P1 · **Lectura:** ~15 min
> **Link verificado:** [https://arxiv.org/abs/2402.19173](https://arxiv.org/abs/2402.19173)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio · **Versión:** arXiv 2402.19173 (The Stack v2)

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper original:** StarCoder 2 and The Stack v2 (Lozhkov et al., 2024) — https://arxiv.org/abs/2402.19173 · Code/weights: https://huggingface.co/bigcode/starcoder2-15b · Base: StarCoder 2305.06161
> **Relevancia para opencode-remote-android:** es tu candidato #1 para code-specialist offline en `desktop-app` / APK: modelo permissivo (licencias filtradas), 3B/7B/15B, fill-in-middle y 16k context, que te permite edits/lint/format sin pagar API ni mandar código privado al server.
> **Prioridad:** Media P1 — *cuando necesitás code sin nube.*

## 1 Introducción — Qué problema resuelve

La mayoría de los code LLMs potentes son cerrados (GPT-4, Claude) o tienen licencias restrictivas sobre sus datos de entrenamiento. Si querés correr un modelo **en tu máquina, offline, sobre código privado, sin mandar nada a la nube y con licencia comercial limpia**, las opciones eran pocas y flojas. StarCoder2 ataca eso de frente: **3 modelos (3B/7B/15B) entrenados en The Stack v2 — 600+ lenguajes, 3.3-4.3T tokens, con filtrado riguroso de licencias permissivas** — que compiten con modelos 2× más grandes y cerrados.

No es solo "otro code model": es la prueba de que **curaduría de datos + entrenamiento limpio superan a escalar parámetros a lo bruto**. Para vos, que mantenés un thin client que a veces tiene que funcionar sin `opencode serve` (APK offline, `desktop-app` sin red), StarCoder2 es el especialista local que hace `edits`, `lint`, `format` y `fill-in-middle` sin pagar O(n²) remoto ni filtrar código.

## 2 Ideas clave

### 2.1 The Stack v2 — Datos curados > datos gigantes sin filtro

| Propiedad | The Stack v1 | The Stack v2 (StarCoder2) |
|---|:---:|---|
| **Lenguajes** | ~350 | **600+** |
| **Tokens** | ~1T | **3.3-4.3T** (según tamaño) |
| **Licencias** | permissive filter básico | **filtrado estricto + opt-out** (solo permissive: MIT, Apache, BSD) |
| **Dedup** | básico | near-dedup + PII redaction |
| **Issues/PRs** | no | incluye issues y PRs para contexto |

La lección: no es "más datos = mejor". Es "datos con licencia limpia + dedup + PII handling = modelo que podés usar comercialmente sin miedo legal".

### 2.2 Arquitectura y entrenamiento

| Modelo | Params | Tokens | Context | Vocab | Fill-in-Middle |
|---|:---:|:---:|:---:|:---:|:---:|
| StarCoder2-3B | 3B | 3.3T | 16k | 49k | ✅ |
| StarCoder2-7B | 7B | 3.6T | 16k | 49k | ✅ |
| StarCoder2-15B | 15B | 4.3T | 16k | 49k | ✅ |

- **Fill-in-Middle (FIM):** entrenado para completar código en el medio, no solo al final. Crucial para `edits` donde tenés prefix + suffix y necesitás el medio.
- **16k context:** suficiente para un archivo grande o 2-3 archivos chicos sin truncar.
- **Multi-query attention (MQA)** en 15B para inferencia más rápida (menos KV cache).
- **Sliding window attention** opcional para extrapolar más allá de 16k.

### 2.3 Por qué importa vs CodeLlama / DeepSeek-Coder

StarCoder2-15B supera a CodeLlama-34B en HumanEval con la mitad de parámetros. No por magia: por datos mejores y FIM. Y con licencia permissiva real, no "research only".

## 3 Evidencia / Experimentos

| Benchmark | StarCoder2-15B | CodeLlama-34B | DeepSeek-Coder-33B | StarCoder2-7B |
|---|:---:|:---:|:---:|:---:|
| **HumanEval pass@1** | **46.3%** | 41.5% | 44.5% | 35.4% |
| **MBPP pass@1** | **66.2%** | 57.0% | 65.2% | 54.4% |
| **MultiPL-E (6 langs)** | **~45% avg** | ~38% | ~43% | ~33% |
| **FIM (SantaCoder)** | **~85% exact match** | — | — | ~78% |
| **GSM8K (math)** | ~30% | ~35% | ~32% | ~22% |

Setup: evaluación estándar HumanEval/MBPP con greedy decoding, MultiPL-E para 6 lenguajes (Python, JS, Java, Go, Rust, C++). FIM evaluado en SantaCoder benchmark (completar código con prefix+suffix).

Hallazgo clave: **15B permissivo > 34B no-permissivo** en code puro. La curaduría de The Stack v2 compensa 2× parámetros. Para math/reasoning general, sigue por debajo de CodeLlama — es un especialista, no un generalista.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo usás / cómo implementarlo en el repo |
|---|---|
| **Code-specialist offline** | `desktop-app` Rust sidecar puede correr StarCoder2-3B/7B local vía `llama.cpp` o `candle` sin `opencode serve`. Para `edits` (cambiar una función), `lint` (sugerir fix) y `format`, no necesitás GPT-4 remoto. |
| **Fill-in-Middle para edits** | Tu `fsx` + `ptyx` hacen edits file-level. Con FIM, el modelo completa el medio dado prefix+suffix del archivo — ideal para "agregá validación entre línea 40 y 60" sin reescribir todo el file (ahorra O(n²) tokens). |
| **Licencia permissiva** | Si tu APK o `desktop-app` distribuye un modelo embebido, StarCoder2 es seguro comercialmente (MIT/Apache data). CodeLlama tiene licencia custom con restricciones; DeepSeek-Coder es MIT pero con menos transparencia de datos. |
| **Routing local vs remoto** | En `shared/api/version.ts` / `shared/api/client.ts`, ruteá: `edit trivial / lint / format → StarCoder2 local (3B/7B)`, `feature multi-archivo / research → opencode serve remoto (GPT-4/Claude)`. Ahorrás latencia y costo. |
| **16k context suficiente para file** | Un archivo `web/src/features/kanban/*.tsx` típico son ~300 líneas ≈ 2k tokens. 16k te da 5-8 archivos chicos o 1 grande sin truncar — suficiente para edits locales sin paginación. |
| **Alternativa a Phi-3** | Phi-3 (3.8B) es generalista bueno en tu APK; StarCoder2-3B es especialista code que lo supera en HumanEval/MBPP. Si tu bottleneck es code, cambiá el sidecar a StarCoder2. |

```ts
// web/src/features/edit/fim.ts — fill-in-middle con StarCoder2 local
type FIMRequest = { prefix: string; suffix: string; file: string };
async function fimEdit(req: FIMRequest): Promise<string> {
  // StarCoder2 FIM format: <fim_prefix>prefix<fim_suffix>suffix<fim_middle>
  const prompt = `<fim_prefix>${req.prefix}<fim_suffix>${req.suffix}<fim_middle>`;
  // Llamada a sidecar Rust local (no a opencode serve remoto)
  const res = await fetch("http://127.0.0.1:4848/shell/llm/fim", {
    method: "POST",
    body: JSON.stringify({ prompt, max_tokens: 512 }),
  });
  return res.json().then(r => r.completion);
}
// Routing: ¿local o remoto?
function routeEdit(complexity: "trivial" | "complex"): "local" | "remote" {
  return complexity === "trivial" ? "local" : "remote"; // trivial → StarCoder2, complex → opencode
}
```

```rs
// desktop-app/src/infrastructure/http/llm_router.rs — sidecar local (esbozo)
pub fn llm_router() -> Router {
  Router::new()
    .route("/shell/llm/fim", post(handle_fim))      // StarCoder2 FIM
    .route("/shell/llm/complete", post(handle_complete))
}
// handle_fim carga StarCoder2-3B vía candle/llama.cpp, no llama a la nube
```

## 5 Anti-patterns / Limitaciones

- **Usar StarCoder2 como generalista.** Es code-specialist: en math (GSM8K ~30%), reasoning general y chat, pierde contra Phi-3, Mistral o GPT-4. No le pidas que planifique tu curriculum o resuma جلسة — para eso está el modelo remoto.
- **Esperar 128k context.** StarCoder2 tiene 16k, no 128k. Para tareas multi-archivo grandes (5+ files), necesitás chunking o RAG, o rutear a modelo remoto con contexto largo. No intentes meter todo `web/src` en 16k.
- **Ignorar el costo de inferencia local.** 15B en CPU es lento (~2-5 tok/s sin GPU); 7B es ~10 tok/s en CPU decente; 3B es el único viable en APK sin GPU. Elegí tamaño según hardware, no por benchmark.
- **Distribuir pesos sin verificar licencia de tu app.** Aunque The Stack v2 es permissive, los pesos de StarCoder2 tienen su propia licencia (BigCode OpenRAIL-M). Leé la licencia antes de bundlear en APK comercial.
- **FIM sin suffix.** Si llamás FIM sin suffix (solo prefix), es completion normal y no aprovecha la ventaja del modelo. Siempre pasá `prefix + suffix` cuando edits en el medio del archivo.

## 6 Ejercicios prácticos (en tu repo)

1. **FIM edit local.** Tomá un archivo `web/src/features/kanban/*.tsx`, borrá 10 líneas del medio y pedile a StarCoder2-3B (vía `llama.cpp` local o HuggingFace Inference) que las complete con `prefix + suffix`. Medí `exact match` vs GPT-4 remoto en 10 edits. ¿Cuántos hace bien el local sin pagar API?

2. **Routing local vs remoto.** En `shared/api/client.ts`, implementá `routeEdit(complexity)` que mande `trivial` (lint, format, rename) a StarCoder2 local y `complex` (feature multi-archivo) a `opencode serve`. Logueá latencia y costo en 20 edits. ¿Cuánto ahorrás ruteando lo trivial local?

3. **Benchmark offline en tu codebase.** Corré HumanEval/MBPP subset (20 tasks) con StarCoder2-7B local y compará contra GPT-4 remoto. Si 7B local saca >35% pass@1, es suficiente para edits triviales offline en APK sin red — documentá el threshold donde conviene local.

## 7 Referencias

- **Paper:** Lozhkov et al., *StarCoder 2 and The Stack v2*, 2024 — https://arxiv.org/abs/2402.19173 · PDF: https://arxiv.org/pdf/2402.19173
- **Pesos:** https://huggingface.co/bigcode/starcoder2-15b (también 3B/7B) · https://huggingface.co/bigcode/starcoder2-7b
- **Dataset:** The Stack v2 — https://huggingface.co/datasets/bigcode/the-stack-v2
- **Base:** StarCoder (Li et al., 2023) — https://arxiv.org/abs/2305.06161
- **Relacionados en esta serie:** CodeT5 (Wang et al. 2021) para encoder-decoder, AlphaCode (Li et al. 2022) para sampling, Phi-3 para SLM generalista.
- **Para profundizar:** *BigCode OpenRAIL-M license* — https://huggingface.co/bigcode/starcoder2-15b/blob/main/LICENSE

---

## Checklist de lectura

- [ ] Leí el abstract, Tabla 1 (HumanEval/MBPP) y Sec. 3 (The Stack v2) del paper original
- [ ] Entiendo por qué The Stack v2 permissive + FIM importan más que escalar a 34B
- [ ] Puedo explicar FIM (`prefix + suffix → middle`) con ejemplo de edit
- [ ] Anoté 1 lugar en `desktop-app` / APK donde correr StarCoder2 local
- [ ] Link y pesos guardados en favoritos / Zotero

*Generado para sección Papers — 03 Agentes · opencode-remote-android*
