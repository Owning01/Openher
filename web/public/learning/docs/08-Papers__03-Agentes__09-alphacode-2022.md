# AlphaCode — Sampling masivo + filter + cluster (Li et al., 2022)

> **Autores:** Li, Choi, Chung et al. / DeepMind
> **Año:** 2022 · **Prioridad:** Baja P2 · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2203.07814](https://arxiv.org/abs/2203.07814)
> **Categoría Papers:** 03 Agentes · **Nivel:** intro · **Versión:** Science 2022 (arXiv 2203.07814)

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper original:** Competition-Level Code Generation with AlphaCode (Li et al., Science 2022) — https://arxiv.org/abs/2203.07814 · AlphaCode 2: https://storage.googleapis.com/deepmind-media/AlphaCode2/AlphaCode2-report.pdf
> **Relevancia para opencode-remote-android:** es el anti-pattern de referencia para tu thin client: muestra por qué *sampling masivo + ranking* (1M programas por problema) no escala en mobile/desktop y por qué tu harness debe preferir agentes iterativos (OpenHands/AIDE) sobre generate-and-rank.
> **Prioridad:** Baja P2 — *valor pedagógico, no para implementar.*

## 1 Introducción — Qué problema resuelve

Competitive programming (Codeforces) es el extremo de code generation: problemas nunca vistos, tests ocultos, necesidad de algoritmos no triviales y soluciones que deben compilar y pasar tests estrictos. AlphaCode fue el primer sistema en alcanzar **nivel mediano humano en Codeforces** (percentil ~55%, Elo ~1238) sin ser un solver simbólico: puro LLM + sampling masivo + filtrado inteligente.

La idea es brutalmente simple y brutalmente cara: **samplear 1 millón de programas por problema, filtrar el 95% que no compila o falla tests públicos, clusterizar los restantes por comportamiento y elegir 10 diversos para submitir**. Funciona — pero a un costo que tu APK jamás puede pagar. Para vos, AlphaCode importa no como modelo a replicar sino como **límite superior de fuerza bruta** que te enseña por qué tu `opencode-remote-android` debe ser iterativo y no generativo-masivo.

## 2 Ideas clave

### 2.1 Pipeline en 3 etapas

```
1. SAMPLE masivo          2. FILTER              3. CLUSTER + SELECT
1M programas/problem ──→ 95% descartado      ──→ 10 programas finales
(temperature alta,       (no compila, falla     (agrupar por output
 diverse prompts)         tests públicos)        en tests generados,
                                                elegir 1 por cluster)
```

| Etapa | Qué hace | Por qué importa |
|---|---|---|
| **Sample** | Genera ~1M programas por problema con temperature 0.8-1.0, prompts diversos y modelo 41B encoder-decoder. | Diversidad es clave: con greedy (1 sample) el modelo falla; con 1M, alguno acierta. |
| **Filter** | Descarta ~95% que no compila o falla tests de ejemplo. Quedan ~50k candidatos. | Filtro barato (compilar + tests públicos) elimina la mayoría del ruido sin LLM. |
| **Cluster** | Ejecuta los 50k restantes en tests generados, clusteriza por vector de outputs (comportamiento), elige 1 por cluster. | Evita submitir 10 variantes del mismo bug; maximiza diversidad de los 10 submits permitidos. |

### 2.2 Entrenamiento — Encoder-decoder asimétrico + pre-training masivo

- **Arquitectura:** encoder-decoder Transformer 41B (encoder shallow, decoder deep) — no decoder-only como GPT.
- **Pre-training:** The Pile + GitHub (~700GB code) con objetivo `next-token` + `masked span`.
- **Fine-tuning:** Codeforces problems + soluciones humanas (con metadata de rating/tags).
- **Tempering + diverse prompts:** cada sample usa un prompt ligeramente distinto (tags, rating, ejemplos) para forzar diversidad.

### 2.3 AlphaCode 2 — Gemini al rescate

AlphaCode 2 (2023) reemplaza el modelo 41B custom por **Gemini Pro** fine-tuneado y mejora de percentil 55% → **85%** en Codeforces (resuelve 43% de problemas vs 25% de AlphaCode 1). La lección: mejor base model + mismo pipeline = salto cualitativo, pero el costo de sampling sigue siendo extremo.

## 3 Evidencia / Experimentos

| Métrica | AlphaCode (41B) | AlphaCode 2 (Gemini) | Humano mediano CF | Humano top 10% |
|---|:---:|:---:|:---:|:---:|
| **Elo Codeforces** | ~1238 (top 54%) | ~1700 (top 15%) | ~1200 | ~1800 |
| **Solve rate (10 submits)** | ~25% (CF) | **43%** | — | — |
| **Solve rate (1 submit)** | ~10% | ~20% | — | — |
| **Filter rate** | 95% descartado | similar | — | — |
| **Samples por problema** | **1,000,000** | ~1,000,000 | 1 (humano) | 1 |
| **Costo por problema** | ~$100-500 (est. 2022) | similar | $0 | $0 |

Setup: Codeforces problems (1600+ rating), 10 submits permitidos, evaluación Elo simulada contra participantes reales. Cada problema requiere generar 1M programas, filtrar y clusterizar — el paper reporta que sin clustering (elegir 10 al azar de los filtrados) el solve rate cae ~40%.

Hallazgo clave: **diversidad > calidad individual**. Un solo programa greedy del modelo rara vez es correcto; pero entre 1M diversos, alguno lo es. El pipeline es un *generate-and-rank* llevado al extremo.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde aplica / qué NO hacer en el repo |
|---|---|
| **Sampling masivo = anti-pattern para thin client** | 1M samples × ~500 tokens × $0.01/1k = $5000 por problema. Tu APK con `opencode serve` remoto no puede pagar ni 100 samples. No repliques AlphaCode: es el ejemplo de lo que NO hacer en mobile. |
| **Filter barato antes que LLM** | La idea de filtrar 95% con compilación + tests públicos SÍ aplica: antes de pedirle al LLM que "revise" código, corré `tsc -b` / `cargo check` local. Es gratis y descarta lo obvio sin pagar tokens. |
| **Cluster por comportamiento** | Si alguna vez generás N candidatos (ej: 5 fixes para el mismo bug en `ptyx :4849`), no elijas al azar: ejecutalos, clusterizá por output y elegí 1 por cluster. Es AIDE (Jiang et al. 2025) con sabor AlphaCode. |
| **Generate-and-rank vs iterativo** | AlphaCode genera 1M y rankea; OpenHands/AIDE generan 1, ejecutan, corrigen, iteran. Para tu harness, iterativo gana por costo y por feedback: cada iteración aprende del error anterior, no genera a ciegas. |
| **Diverse prompts** | Si generás 3 ramas en AIDE beam k=3, usá prompts diversos ("fix minimal", "fix con refactor", "fix con tests") como hace AlphaCode con tags/rating. Diversidad de prompt → diversidad de solución. |
| **AlphaCode 2 lección** | Mejor base model (Gemini) + mismo pipeline = 55% → 85% percentil. Para vos: mejorar `opencode serve` de GPT-3.5 a GPT-4/Claude mueve más la métrica que generar 10× más samples con modelo chico. |

```ts
// web/src/features/aide/alpha-vs-aide.ts — por qué NO hacer AlphaCode en tu thin client
// ❌ AlphaCode style: 1M samples, filter, cluster — impagable en mobile
async function alphaStyle(problem: string) {
  const samples = await Promise.all(Array.from({ length: 1_000_000 }, () => llm.generate(problem))); // $$$
  const filtered = samples.filter(s => compiles(s) && passesPublicTests(s)); // 95% descartado
  const clusters = clusterByOutput(filtered); // por comportamiento
  return clusters.slice(0, 10).map(c => c[0]);
}

// ✅ AIDE/OpenHands style: iterativo, barato, con feedback
async function aideStyle(problem: string) {
  let node = { code: await llm.generate(problem), score: 0 };
  for (let i = 0; i < 5; i++) {
    const result = await ptyx.exec(node.code); // :4849 ejecuta
    if (result.exitCode === 0 && passesTests(result.stdout)) return node.code;
    node = { code: await llm.fix(node.code, result.stderr), score: result.exitCode === 0 ? 0.5 : 0 };
  }
  return node.code;
}
// Costo: Alpha ~1M calls vs AIDE ~5 calls. En tu thin client, la elección es obvia.
```

## 5 Anti-patterns / Limitaciones

- **Replicar sampling masivo en thin client.** Es el anti-pattern central: 1M samples es impagable en latencia (horas), costo (miles de dólares) y batería (APK). Si tu harness genera >10 candidatos por task, estás en territorio AlphaCode sin presupuesto AlphaCode.
- **Filtrar solo con LLM.** AlphaCode filtra 95% con compilación barata, no con otro LLM. Si tu pipeline manda cada candidato a GPT-4 para "¿está bien?", pagás 20× más que filtrando con `tsc -b` / `cargo check` primero.
- **Elegir N candidatos al azar.** Sin clustering por comportamiento, 10 samples pueden ser 10 variantes del mismo bug. Si generás múltiples candidatos, clusterizá por output — no elijas random.
- **Ignorar el costo de AlphaCode 2.** Aunque Gemini mejora el percentil a 85%, sigue necesitando ~1M samples. Mejor modelo no resuelve el problema de costo del pipeline; solo mejora el techo.
- **Confundir Codeforces con tu codebase.** Codeforces son problemas autocontenidos con tests claros. Tu `web/` y `desktop-app` son codebases grandes con dependencias, estado y tests de integración. Sampling masivo no escala a "arreglá este bug en 5 archivos con contexto de 50k tokens".

## 6 Ejercicios prácticos (en tu repo)

1. **Filter barato vs LLM judge.** Tomá 20 snippets de código generados por tu agente (10 correctos, 10 con errores de compilación). Medí cuántos descarta `tsc -b` / `cargo check` sin LLM vs cuántos descarta un LLM judge. ¿Qué % filtra el compilador gratis? ¿Vale la pena pagar LLM para el resto?

2. **Diversidad de prompts en AIDE.** Generá 3 fixes para el mismo bug con prompts diversos ("fix minimal", "fix con refactor", "fix con tests") y medí si los 3 fixes son distintos (distancia de edición) vs 3 fixes con el mismo prompt. ¿La diversidad de prompt genera diversidad real?

3. **Costo estimado AlphaCode en tu harness.** Calculá: si tu `opencode serve` cobra $0.01/1k tokens y cada sample son ~500 tokens, ¿cuánto cuesta resolver 1 bug con 1M samples? ¿Y con 5 iteraciones AIDE? Graficá costo vs solve rate y justificá por qué tu thin client debe ser iterativo.

## 7 Referencias

- **Paper:** Li et al., *Competition-Level Code Generation with AlphaCode*, Science 2022 — https://arxiv.org/abs/2203.07814 · PDF: https://arxiv.org/pdf/2203.07814
- **AlphaCode 2:** DeepMind, *AlphaCode 2 Technical Report*, 2023 — https://storage.googleapis.com/deepmind-media/AlphaCode2/AlphaCode2-report.pdf
- **Relacionados en esta serie:** StarCoder2 (Lozhkov et al. 2024) para code-specialist sin sampling masivo, AIDE (Jiang et al. 2025) para búsqueda en árbol vs sampling, CodeT5 (Wang et al. 2021) para encoder-decoder base.
- **Para profundizar:** *Codeforces* — https://codeforces.com · *APPS benchmark* (Hendrycks et al. 2021) — dataset de competitive programming.

---

## Checklist de lectura

- [ ] Leí el abstract, Fig. 1 (pipeline sample→filter→cluster) y Tabla 1 (Elo) del paper original
- [ ] Entiendo por qué 1M samples + filter + cluster funciona pero no escala a thin client
- [ ] Puedo explicar la diferencia entre generate-and-rank (AlphaCode) e iterativo (AIDE/OpenHands)
- [ ] Calculé el costo estimado de AlphaCode vs AIDE para 1 task en mi harness
- [ ] Link guardado en favoritos / Zotero

*Generado para sección Papers — 03 Agentes · opencode-remote-android*
