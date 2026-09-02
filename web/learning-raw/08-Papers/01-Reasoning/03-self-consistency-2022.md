# Self-Consistency — Votar entre múltiples razonamientos (Wang et al., 2022)

> **Autores:** Wang, Wei, Schuurmans, Le, Chi, Narang, Chowdhery, Zhou / Google Research
> **Año:** 2022 · **Prioridad:** Muy recomendado · **Lectura:** ~15 min
> **Link verificado:** [https://arxiv.org/abs/2203.11171](https://arxiv.org/abs/2203.11171)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio · **Versión:** ICLR 2023

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Self-Consistency Improves Chain of Thought Reasoning in Language Models (Wang et al., ICLR 2023).
> **Link:** https://arxiv.org/abs/2203.11171
> **Relevancia para opencode-remote-android:** te da un patrón barato para mejorar confiabilidad sin reentrenar: generar k razonamientos diversos y votar. Ideal para compaction de historial, reportes PTES y cualquier paso donde un error cuesta caro.
> **Prioridad:** Muy recomendado · **Tiempo:** 15 min

## 1 Introducción — Qué problema resuelve

Chain-of-Thought mejora el razonamiento, pero tiene un talón de Aquiles: usa **greedy decoding** (siempre elige el token más probable). Eso significa un solo camino de razonamiento. Si ese camino arranca mal, todo el resto se descarrila y no hay vuelta atrás.

Self-Consistency propone algo obvio en retrospectiva: en vez de un solo chain, **sampleá k caminos diversos** con temperatura >0 y elegí la respuesta por **mayoría**. La intuición es que un problema con razonamiento correcto tiene múltiples formas de llegar a la misma respuesta correcta, mientras que los errores se dispersan en respuestas distintas. Votar cancela el ruido.

Es gratis en términos de entrenamiento — solo pagás k llamadas en inferencia— y funciona con cualquier modelo que ya haga CoT.

## 2 Ideas clave

### 2.1 Del greedy a la diversidad — Sampling con temperatura

En lugar de `temperature = 0` (greedy, determinístico), usa `temperature = 0.7` (o 0.5–0.9) y `top-p` para samplear caminos distintos:

```
Prompt + "Let's think step by step."
  → sample 1: "2 latas × 3 = 6, 5+6=11" → 11
  → sample 2: "5 + (2×3) = 5+6=11"      → 11
  → sample 3: "2×3=6, total 5+6=11"      → 11  (mayoría: 11 ✓)
  → sample 4: "2+3=5, 5+5=10"            → 10  (error disperso)
```

Con `k = 40`, la respuesta correcta suele ser la más frecuente aunque cada chain individual tenga ~60% de acierto.

### 2.2 Voto mayoritario — Simple y robusto

No necesitás un judge LLM ni scoring complejo. Contás respuestas finales idénticas y elegís la más votada:

```
final_answer = argmax_a  count(samples donde answer == a)
```

Para tareas abiertas (no clasificación), normalizás la respuesta (ej: extraer número final, lowercase) antes de votar. El paper muestra que este voto simple supera a *weighted voting* por probabilidad del modelo.

### 2.3 Escala con k — Rendimiento logarítmico

Más samples = mejor, pero con rendimientos decrecientes:

| k (samples) | GSM8K (PaLM 540B + CoT) |
|:-----------:|:-----------------------:|
| 1 (greedy) | 58.1% |
| 5 | 68.3% (+10.2) |
| 10 | 71.2% (+13.1) |
| 40 | **74.4%** (+16.3) |

Con `k = 5` ya capturás la mayor parte de la ganancia. No necesitás 40 para uso práctico — 3 a 5 alcanza en tu harness.

### 2.4 Compatible con cualquier CoT

Self-Consistency no reemplaza CoT, lo **envuelve**. Funciona con few-shot CoT, zero-shot CoT, y con cualquier modelo. Es un *wrapper* de inferencia, no un cambio de prompt.

## 3 Evidencia / Experimentos

Todos con PaLM 540B + CoT como baseline, `temperature = 0.7`, voto mayoritario:

| Benchmark | CoT greedy | Self-Consistency (k=40) | Ganancia |
|---|:---:|:---:|:---:|
| **GSM8K** | 56.5% | **74.4%** | **+17.9pp** |
| **SVAMP** | 79.0% | **86.6%** | +7.6pp |
| **AQuA** | 35.8% | **48.3%** | +12.5pp |
| **StrategyQA** | 65.8% | **75.0%** | +9.2pp |
| **ARC-challenge** | 85.2% | **90.0%** | +4.8pp |
| **ASDiv** | 71.4% | **81.1%** | +9.7pp |

- Con **UL2 20B** (modelo más chico) también mejora: GSM8K 10.2% → 16.0% con k=40 — pero menos dramático.
- Con **LaMDA 137B**: SVAMP 38.9% → 47.6% — confirma que no es solo PaLM.
- Ablation: voto por mayoría supera a `pick best by logprob` — la frecuencia es mejor señal que la confianza del modelo.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **Samplear k caminos y votar** | Para pasos críticos donde un error cuesta caro: generar el resumen de `compaction` (`miser/ultra`), redactar un hallazgo PTES, o decidir el plan de refactor. No lo uses en cada `tool_call` — solo donde la confiabilidad importa. |
| **Compaction con voto** | Tu `IndexedDB v2` hace merge-only de mensajes. Al compactar historial largo en `web/src/features/compact/`, generá **3 resúmenes** con `temperature 0.7` y elegí el que mejor preserve info crítica (podés votar por overlap de keywords o usar un judge). Patrón *evaluator-optimizer* de Anthropic. |
| **Reportes PTES** | Si generás un reporte de pentest, sampleá 3 versiones del hallazgo y quedate con la que coincide en severidad + recomendación. Reduce alucinación en texto regulatorio. |
| **Batch vs secuencial y SSE** | Self-Consistency es *embarrassingly parallel*: podés lanzar k=3 llamadas a `opencode serve` en paralelo vía `Promise.all` y votar. No bloquea el SSE — cada sample es independiente. Ojo con rate limits del server `:4096/:4097`. |
| **IndexedDB como cache de samples** | Guardá los k samples en IndexedDB junto a la sesión (`DB_VERSION = 2`). Si el usuario pide "regenerar", ya tenés alternativas sin re-llamar. También sirve para mostrar "otras respuestas consideradas" en UI debug. |
| **Cuando NO usarlo** | No lo uses para `fsx` determinista (`list_dir`, `read`, `move_entry`) ni para `ptyx` donde la observación es verdad externa. Votar entre 3 `ls` distintos no tiene sentido — la verdad está en el filesystem, no en el voto. |

```ts
// web/src/shared/api/selfConsistency.ts — wrapper genérico
export async function selfConsistentAnswer(
  prompt: string,
  k = 3,
  opts = { temperature: 0.7 }
): Promise<string> {
  const samples = await Promise.all(
    Array.from({ length: k }, () => callOpencode(prompt, opts))
  );
  // Normalizá respuestas (trim, lowercase, extrae número final si aplica)
  const normalized = samples.map(s => s.trim().toLowerCase());
  // Voto mayoritario
  const counts = new Map<string, number>();
  for (const n of normalized) counts.set(n, (counts.get(n) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}
```

> **Costo:** k=3 triplica tokens y latencia. Úsalo solo en el 10% de pasos críticos. Para el resto, greedy alcanza.

## 5 Anti-patterns / Limitaciones

- **Costo ×k.** Con k=5 pagás 5× tokens. Si lo aplicás a cada turno ReAct de una sesión de 20 turnos, son 100 llamadas. Reservalo para compaction, planning y generación final — no para cada `Thought → Action`.
- **No corrige errores sistemáticos.** Si el modelo tiene un bias consistente (ej: siempre malinterpreta un formato de fecha), los k samples convergerán al mismo error. Self-Consistency reduce varianza, no bias. Para bias necesitás PAL (ejecutar código) o Reflexion (feedback externo).
- **Voto no sirve para respuestas abiertas largas.** Si la tarea es "escribí un refactor de `external_router.rs`", las 5 respuestas serán todas distintas y el voto no aplica. Úsalo para tareas con respuesta extraíble (número, opción, JSON con schema).
- **Temperatura mal calibrada.** Con `temperature` muy baja (0.1) los k samples son idénticos y no hay diversidad. Con muy alta (1.2) son incoherentes. El paper usa 0.7 — empezá ahí y ajustá.
- **Latencia en thin client.** k llamadas paralelas saturan el WS PTY `:4849` y el HTTP `:4848` si no limitás concurrencia. Usá `p-limit(3)` o similar.

## 6 Ejercicios prácticos (en tu repo)

1. **Implementá `selfConsistentAnswer` y medí.** Creá `web/src/shared/api/selfConsistency.ts` con `k=3, temperature=0.7`. Probalo en 10 preguntas de razonamiento (ej: GAIA-L1, GSM8K sample, o 10 issues reales de tu backlog). Medí `accuracy` con voto vs greedy y latencia p50/p95. ¿En qué tipo de pregunta el voto más ayuda?

2. **Compaction con voto.** Modificá tu lógica de `compact` en `web/src/features/compact/` para generar 3 resúmenes del historial y elegir el mejor. Criterio simple: el que más keywords del último prompt preserve. Compará calidad del resumen votado vs greedy en 5 sesiones largas (>50 mensajes). ¿Se nota menos pérdida de contexto?

3. **Visualizá la diversidad.** En una UI debug (o `console.table`), mostrá los k=5 samples para un mismo prompt con sus respuestas finales y el voto. Esto te entrena el ojo para detectar cuándo el modelo está incierto (voto dividido 3-2) vs seguro (5-0). Usá esa señal para decidir si pedir confirmación al usuario.

## 7 Referencias

- **Paper:** Wang et al., *Self-Consistency Improves Chain of Thought Reasoning in Language Models*, ICLR 2023 — https://arxiv.org/abs/2203.11171
- **Base:** Wei et al., *Chain-of-Thought Prompting* (2201.11903) — CoT es prerrequisito.
- **Patrón harness:** Anthropic, *Building Effective Agents* — *evaluator-optimizer* es Self-Consistency con judge.
- **Relacionado:** Tree-of-Thoughts (2305.10601) — generaliza la búsqueda; Self-Consistency es ToT depth-1 con voto.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 2 (diagrama de voto) del paper original
- [ ] Entiendo por qué `temperature=0.7` + voto supera a greedy determinístico
- [ ] Sé en qué pasos de mi harness justifica pagar k× costo y en cuáles no
- [ ] Implementé o bosquejé `selfConsistentAnswer` con `k=3` en `web/src`
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 01 Reasoning · opencode-remote-android*
