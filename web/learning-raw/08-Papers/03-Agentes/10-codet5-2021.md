# CodeT5 — Encoder-decoder para código (Wang et al., 2021)

> **Autores:** Wang, Le, Zhou et al. / Salesforce Research
> **Año:** 2021 · **Prioridad:** Media P1 · **Lectura:** ~13 min
> **Link verificado:** [https://arxiv.org/abs/2109.00859](https://arxiv.org/abs/2109.00859)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio · **Versión:** arXiv 2109.00859 (EMNLP 2021)

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper original:** CodeT5: Identifier-aware Unified Pre-trained Encoder-Decoder Models for Code Understanding and Generation (Wang et al., EMNLP 2021) — https://arxiv.org/abs/2109.00859 · Code: https://github.com/salesforce/CodeT5
> **Relevancia para opencode-remote-android:** es el ancestro arquitectónico de StarCoder2, CodeLlama y tu pipeline code: el primer T5 que entiende que los identificadores (`variableNames`, `functionNames`) no son tokens cualquiera y que un mismo modelo puede hacer summarization, generation y translation de código.
> **Prioridad:** Media P1 — *entender de dónde viene tu code LLM.*

## 1 Introducción — Qué problema resuelve

Antes de CodeT5, los modelos de código eran o bien encoder-only (CodeBERT, para entender pero no generar) o decoder-only (GPT, para generar pero sin entender estructura). Ninguno hacía bien ambas cosas, y todos trataban `myVariable` igual que `the` — como un token más. CodeT5 rompe esa dicotomía con una idea simple: **T5 encoder-decoder + pre-training que respeta la estructura del código, especialmente los identificadores**.

Los autores parten de T5 (Raffel et al. 2020) y lo adaptan a código con dos objetivos nuevos: *masked span prediction* con máscara de identificadores y *identifier tagging* (¿este token es un identificador?). Con eso, un solo modelo hace code summarization, generation, translation y refinement — y sienta las bases para todo lo que vino después (StarCoder, CodeLlama, DeepSeek-Coder). Para vos, que usás `opencode serve` para generar código y a veces un SLM local para edits, CodeT5 explica por qué tu modelo "entiende" `handleSSE` distinto que `the`.

## 2 Ideas clave

### 2.1 T5 para código — Encoder-decoder unificado

```
Input:  "def <mask> ( x , y ) : <mask> x + y"  →  Encoder  →  Decoder  →  "add / return"
         (masked span)                              (bidirectional)  (autoregressive)
```

| Componente | Qué hace | Por qué importa |
|---|---|---|
| **Encoder** | Lee todo el input bidireccionalmente (como BERT) | Entiende contexto completo: ve `x` e `y` antes y después del `<mask>` |
| **Decoder** | Genera output autoregresivamente (como GPT) | Puede generar código nuevo, no solo clasificar |
| **Unificado** | Mismo modelo para 4 tasks con prefijos distintos | `summarize:`, `generate:`, `translate:`, `refine:` — un checkpoint, múltiples usos |

Ventaja sobre decoder-only: el encoder ve todo el contexto sin máscara causal, ideal para entender código existente antes de generar.

### 2.2 Identifier-aware pre-training — Los nombres importan

El insight central: en código, `calculateTotal` no es un token arbitrario — es un identificador con semántica. CodeT5 lo trata especial:

| Objetivo | Cómo funciona | Qué aprende |
|---|---|---|
| **Masked Span Prediction (MSP)** | Enmascara spans aleatorios (15%) y el decoder los reconstruye | Estructura general del código |
| **Identifier Tagging (IT)** | Clasifica cada token: ¿es identificador? (binary) | Qué tokens son nombres vs sintaxis |
| **Masked Identifier Prediction (MIP)** | Enmascara TODOS los identificadores y los predice | Semántica de nombres: `calculateTotal` vs `x` |

MIP es la clave: al forzar al modelo a predecir `calculateTotal` en lugar de `x`, aprende que los nombres llevan significado. Ablation: sin MIP, cae ~2 BLEU en summarization.

### 2.3 CodeT5+ — Escalando a 770M y más tasks

CodeT5+ (2023) extiende a 220M/770M, agrega más lenguajes (8 → 9), instruction tuning y retrieval-augmented generation. Es el puente directo a StarCoder2 y a tu `opencode serve` actual.

## 3 Evidencia / Experimentos

| Task | Dataset | CodeT5-base (220M) | CodeBERT (125M) | PLBART (140M) | SOTA previo |
|---|:---:|:---:|:---:|:---:|:---:|
| **Code Summarization** (BLEU) | **20.0** | 17.8 | 18.3 | 17.5 |
| **Code Generation** (EM) | **22.3%** | — | 18.7% | 18.0% |
| **Code Translation** (EM, Java→C#) | **65.9%** | — | 59.4% | 58.0% |
| **Code Refinement** (small, EM) | **21.6%** | 16.4% | 19.2% | 16.9% |
| **Defect Detection** (Acc) | **65.8%** | 62.1% | 63.2% | 62.8% |
| **Ablation sin MIP** | −2.0 BLEU (summ) | — | — | — |
| **Ablation sin IT** | −1.2 BLEU (summ) | — | — | — |

Setup: pre-training en CodeSearchNet (8 lenguajes, ~5M funciones) + BigQuery, fine-tuning por task. Métricas: BLEU para summarization, Exact Match (EM) para generation/translation/refinement, accuracy para defect detection.

Hallazgo: **identifier-aware objectives aportan +2 BLEU consistentes** y permiten que un modelo de 220M supere a CodeBERT/PLBART en todas las tasks con el mismo o menos parámetros.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo usás / cómo evoluciona en el repo |
|---|---|
| **Encoder-decoder vs decoder-only** | Tu `opencode serve` hoy es decoder-only (GPT-4/Claude). Para tasks de *entender* código (ej: "¿qué hace `external_router.rs:19`?"), un encoder-decoder como CodeT5 es más eficiente: el encoder lee todo el file bidireccionalmente antes de responder. Considerá CodeT5/StarCoder2 local para code understanding sin pagar API. |
| **Identifier-aware → tu naming importa** | Si tus variables son `x`, `tmp`, `data`, el modelo tiene menos señal que si son `sessionToken`, `probeTimeoutMs`, `cachedProbeResult`. CodeT5 demuestra que buenos nombres mejoran generación — no es estética, es performance del modelo. |
| **Unificado: un modelo, múltiples tasks** | CodeT5 hace summarization + generation + translation + refinement con un checkpoint. Para tu thin client, un solo SLM local (StarCoder2-3B) que haga `summarize file` + `generate fix` + `translate py→rs` es más práctico que 3 modelos distintos en APK. |
| **MIP → completado con nombres** | Cuando tu agente genera `fix` para `ptyx :4849`, los identificadores (`SessionSandbox`, `container_id`) deben ser consistentes con el codebase. Un modelo con MIP genera nombres coherentes; uno sin, inventa `foo`/`bar`. |
| **Evolución CodeT5 → StarCoder2 → CodeLlama** | Entender esta línea te ayuda a elegir: CodeT5 (220M, encoder-decoder, 2021) → StarCoder (15B, decoder-only, FIM, 2023) → StarCoder2 (15B, permissive, 2024) → DeepSeek-Coder (33B, 2024). Cada salto es datos + escala + FIM. |
| **Para `opencode-stats :8765`** | CodeT5 puede hacer code summarization local: "resumí qué hace `opencode.db` esta semana" sin mandar el DB a la nube. Úsalo como summarizer offline para informes. |

```ts
// web/src/features/codet5/naming.ts — por qué buenos nombres importan (MIP)
// ❌ Malo para CodeT5/StarCoder2: sin señal semántica
function f(x: any, y: any) { return x + y; }
const data = await fetch(url); const tmp = await data.json();

// ✅ Bueno: identificadores con semántica que MIP aprendió a predecir
function calculateTotal(sessions: Session[], fee: number) { return sessions.reduce((acc, s) => acc + s.tokens * fee, 0); }
const sessions = await fetchSessions(host); const stats = await sessions.json();

// El modelo genera mejor código cuando los nombres le dan contexto — no es gusto, es BLEU.
```

```ts
// web/src/shared/api/routing.ts — ¿cuándo usar CodeT5/StarCoder2 local?
type Task = "understand" | "generate" | "translate" | "refine";
function routeByTask(task: Task): "local" | "remote" {
  // tasks de understanding/refinement chicos → local (CodeT5/StarCoder2)
  // generation compleja multi-archivo → remoto (GPT-4/Claude)
  if (task === "understand" || task === "refine") return "local";
  return "remote";
}
```

## 5 Anti-patterns / Limitaciones

- **Tratar identificadores como tokens cualquiera.** Si tu tokenizer o tu prompt no distinguen `handleSSE` de `the`, perdés la señal que CodeT5 demuestra que vale +2 BLEU. Usá modelos identifier-aware o al menos prompts que preserven nombres completos sin abreviar.
- **Usar CodeT5-220M para generation compleja.** 220M es bueno para summarization/translation pero flojo para generation multi-archivo. Para `feature` completa, necesitás StarCoder2-7B+ o modelo remoto. CodeT5 es para entender/refinar, no para generar features enteras.
- **Encoder-decoder para todo.** Decoder-only (GPT) es mejor para generation pura y chat; encoder-decoder brilla en tasks donde necesitás entender input completo antes de generar. Elegí arquitectura según task, no por moda.
- **Ignorar la evolución.** Quedarse en CodeT5-220M (2021) cuando StarCoder2-15B (2024) existe y es permissivo es perder 2 años de mejora en datos y FIM. CodeT5 es para entender historia, no para deploy actual.
- **Pre-training sin PII handling.** CodeT5 original no filtraba PII tan rigurosamente como StarCoder2/The Stack v2. Si entrenás o fine-tuneás sobre tu codebase privado, filtrá secrets/tokens antes.

## 6 Ejercicios prácticos (en tu repo)

1. **Mide el impacto de buenos nombres.** Tomá 10 funciones de `web/src` con nombres malos (`f`, `data`, `tmp`) y renombralas a nombres semánticos (`calculateTotal`, `sessionStats`, `probeResult`). Pedile al mismo modelo (local o remoto) que genere un fix para cada versión y medí si los fixes con buenos nombres son más correctos (pasan tests) que con nombres malos.

2. **Code summarization local.** Usá CodeT5-base (220M) o StarCoder2-3B local para resumir 5 archivos de `desktop-app/src` ("¿qué hace este file en 2 oraciones?"). Compará contra GPT-4 remoto. ¿El local es suficiente para generar descripciones para tu `kanban` o `OpenCodeHubModal`?

3. **Línea evolutiva.** Corré el mismo prompt de code generation ("implementá un LRU cache en TS") con CodeT5-220M, StarCoder2-3B y GPT-4. Scoreá cada output con `tsc -b` + tests. Graficá `pass rate` vs `año del modelo` y verificá la evolución CodeT5 → StarCoder2 → GPT-4.

## 7 Referencias

- **Paper:** Wang et al., *CodeT5: Identifier-aware Unified Pre-trained Encoder-Decoder Models for Code Understanding and Generation*, EMNLP 2021 — https://arxiv.org/abs/2109.00859 · PDF: https://arxiv.org/pdf/2109.00859
- **Código:** https://github.com/salesforce/CodeT5 · Pesos: https://huggingface.co/Salesforce/codet5-base
- **CodeT5+:** Wang et al., 2023 — https://arxiv.org/abs/2305.07922 (770M, instruction tuning)
- **Relacionados en esta serie:** StarCoder2 (Lozhkov et al. 2024) para evolución directa, AlphaCode (Li et al. 2022) para encoder-decoder asimétrico, T5 (Raffel et al. 2020) para base arquitectónica.
- **Para profundizar:** *CodeSearchNet* — dataset base de CodeT5 (Husain et al., 2019).

---

## Checklist de lectura

- [ ] Leí el abstract, Fig. 1 (arquitectura) y Tabla 2 (6 tasks) del paper original
- [ ] Entiendo MSP vs MIP vs IT y por qué MIP aporta +2 BLEU
- [ ] Puedo explicar encoder-decoder vs decoder-only con ejemplo de task
- [ ] Anoté 1 lugar en `web/` / `desktop-app` donde CodeT5/StarCoder2 local reemplace remoto
- [ ] Link guardado en favoritos / Zotero

*Generado para sección Papers — 03 Agentes · opencode-remote-android*
