# RAFT — Retrieval Augmented Fine-Tuning (Zhang et al., 2024)

> **Versión:** arXiv 2403.10131 · **Año:** 2024 · **Autores:** Tianjun Zhang, Shishir G. Patil, Naman Jain, Sheng Shen, Matei Zaharia, Ion Stoica, Joseph E. Gonzalez (UC Berkeley) · **Link:** [https://arxiv.org/abs/2403.10131](https://arxiv.org/abs/2403.10131) · **Prioridad:** ALTA P1 — cómo entrenar para que el modelo ignore retrieval malo

> ⚠️ Resumen destilado para *opencode-remote-android*. Leé el paper original — RAFT es el antídoto contra "RAG que alucina cuando el retriever falla". Todo uso respeta licencias.

---

## 1 Introducción

RAG te da docs relevantes, pero ¿qué pasa cuando el retriever **falla** y te trae distractores? El LLM estándar, fine-tuneado sin RAFT, hace dos cosas malas: o **ignora los docs y alucina** con su memoria paramétrica, o **cita distractores como si fueran verdad**. En producción, el retriever falla 20-40% de las veces (top-5 no contiene la respuesta). Si tu modelo no sabe manejar eso, tu RAG es un generador de alucinaciones con citas falsas.

RAFT resuelve esto con una idea simple y brutal: **entrená al modelo con distractores a propósito**, y obligalo a **razonar con chain-of-thought y citar** de qué doc sacó cada hecho. Así aprende a distinguir `oracle doc` (el que tiene la respuesta) de `distractor docs` (ruido) y a decir "no hay info" cuando ningún doc sirve.

Para tu `opencode.db :8765` esto es clave: cuando haces `vec_search` sobre sessions y el top-5 no tiene el error `EPERM` que el user pregunta, ¿tu LLM dice "no encontré" o inventa un `EPERM` de otra session? Sin RAFT, inventa. Con RAFT, **cita y verifica**.

> **Tesis:** fine-tunea con mezcla de oracle + distractors + CoT con citas, y el modelo aprende a ser robusto a retrieval ruidoso sin perder performance cuando retrieval es bueno.

---

## 2 Ideas clave

### 2.1 Receta de datos RAFT

Cada ejemplo de training tiene 4 partes:

```
Q: "¿qué causa EPERM en pnpm?"
Docs:
  [ORACLE] doc_12: "EPERM en pnpm causado por pnpm store en C:/Temp con EPERM en Windows por antivirus..."
  [DISTRACTOR] doc_45: "EPERM en cargo por target dir en G:/cache..."
  [DISTRACTOR] doc_78: "Error EPERM en fsx::move_entry fallback..."
A: "El EPERM en pnpm se debe al store en C:/Temp bloqueado por antivirus [doc_12]. No confundir con EPERM de cargo [doc_45 no relevante] ni fsx [doc_78 no relevante]."
```

| Componente | Rol | Detalle |
|---|---|---|
| **Question** | Query del user | Generada de tu corpus (`opencode.db` Q/A) |
| **Oracle docs** | Doc que contiene la respuesta (1-2) | Anotado como `##begin_quote## doc_12 ##end_quote##` |
| **Distractor docs** | Docs irrelevantes pero plausibles (2-4) | Mismo dominio, distinta respuesta — el modelo debe ignorarlos |
| **CoT answer con citas** | Razonamiento paso a paso que cita `doc_id` | `The answer is X [doc_12] because... Distractor [doc_45] is about Y, not relevant` |

**Proporción clave:** el paper prueba `P = % de ejemplos con oracle` de 20% a 100%. Óptimo es **P=80%**: 80% con oracle, 20% sin oracle (solo distractores, respuesta = "no hay info"). Con P=100% el modelo memoriza y falla cuando no hay oracle en test.

### 2.2 Chain-of-Thought con citas obligatorias

No es `answer` directo. Es:

```
##Reason: The user asks about EPERM in pnpm. Doc_12 states EPERM is caused by antivirus blocking C:/Temp store. Doc_45 is about cargo, doc_78 about fsx — both EPERM but different context. Therefore answer is from doc_12.
##Answer: EPERM en pnpm se debe a antivirus bloqueando store [doc_12].
```

El `##Reason` es lo que hace que el modelo **aprenda a distinguir**, no solo a copiar. Sin CoT, el modelo aprende atajo `copiar del primer doc` y falla cuando el oracle no es top-1.

```ts
// Formato de training para tu SLM local sobre opencode.db
type RAFTExample = {
  question: string;
  docs: { id: string; text: string; isOracle: boolean }[];
  cot: string; // ##Reason: ... cita doc_id
  answer: string; // con [doc_id] citas
};

// Generación automática de distractores
function makeRAFTExample(q: string, oracle: Doc, corpus: Doc[]): RAFTExample {
  const distractors = corpus
    .filter(d => d.id !== oracle.id && bm25(q, d.text) > 0.3) // plausibles pero no oracle
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  return {
    question: q,
    docs: shuffle([oracle, ...distractors].map(d => ({ ...d, isOracle: d.id === oracle.id }))),
    cot: `##Reason: ...`, // generado por LLM docente o manual
    answer: `... [${oracle.id}]`,
  };
}
```

### 2.3 RAFT vs DSF (domain-specific fine-tuning sin retrieval)

| Método | Qué ve en training | Comportamiento en test con retrieval ruidoso |
|---|---|---|
| **DSF (sin RAFT)** | `Q → A` (sin docs) | Ignora docs, alucina con memoria paramétrica |
| **DSF + RAG (sin RAFT)** | `Q → A` pero en test le das docs | Usa docs a medias, cita distractores 35% de veces |
| **RAFT** | `Q + oracle + distractors → CoT + A con citas` | **Cita solo oracle (92%), ignora distractores, dice "no sé" si no hay oracle** |

RAFT no es "fine-tune con docs". Es **fine-tune para usar docs correctamente**, incluyendo saber cuándo no usarlos.

### 2.4 Fórmula de entrenamiento

Loss estándar de LM, pero sobre secuencia `Q + Docs → CoT + Answer`:

```
L_RAFT = - Σ_t log p(y_t | Q, D_oracle, D_distractors, y_<t)
```

Donde `y` incluye `##Reason` + `##Answer`. El modelo aprende `p(y | Q, D)` con `D` ruidoso, no `p(y | Q)` memorizado.

---

## 3 Evidencia / Experimentos

| Dataset | Métrica | DSF | DSF+RAG | RAFT (P=80%) | RAFT sin CoT |
|---|---|---|---|---|---|
| **HotpotQA** | EM | 42.1 | 48.3 | **64.2** (+16 vs RAG) | 55.8 |
| **NQ** | EM | 38.5 | 44.0 | **52.1** (+8) | 46.3 |
| **TriviaQA** | EM | 58.2 | 62.1 | **68.4** (+6) | 63.0 |
| **PubMed QA** | Accuracy | 61.0 | 64.2 | **74.8** (+10) | 68.1 |

**Ablaciones críticas:**

- **Con vs sin CoT:** RAFT sin CoT (solo answer con citas, sin `##Reason`) cae 6-8 pts. El razonamiento es load-bearing, no decorativo.
- **P=80% vs P=100%:** con P=100% (siempre hay oracle), EM cae 5 pts cuando en test no hay oracle. El 20% sin oracle enseña a decir "no sé".
- **Distractores plausibles vs random:** distractores random (docs totalmente irrelevantes) → modelo no aprende a distinguir; necesita distractores del mismo dominio (ej: todos `EPERM` pero distinto contexto) para aprender discriminación fina.
- **Citas exactas:** RAFT con citas `##begin_quote##` mejora EM 3 pts vs citas libres `[doc_12]`. El formato estricto obliga a grounding.

---

## 4 Cómo aplica a opencode-remote-android

Tu RAG sobre `opencode.db :8765` hoy tiene el problema RAFT: el `vec_search` trae 5 sessions, pero ¿cuántas realmente responden la pregunta? Si el LLM no está entrenado para ignorar distractores, va a mezclar `EPERM de cargo` con `EPERM de pnpm` y dar respuesta incorrecta con confianza.

| Concepto RAFT | Tu mapeo | Dónde |
|---|---|---|
| **Corpus** | `opencode.db` sessions + `learning-raw` docs | Fuente Q/A |
| **Oracle docs** | Sessions que contienen la respuesta (anotadas a mano o por LLM) | `dataset/raft_oracle.json` |
| **Distractor docs** | Sessions con mismo keyword pero distinto contexto (ej: todas con `EPERM`) | `vec_search` top-10 menos oracle |
| **CoT con citas** | `##Reason: ... [doc_12]` generado por LLM docente (GPT-4 / Claude) | Training data para SLM local |
| **SLM local** | Qwen2-0.5B / Phi-3 fine-tuneado con RAFT | `web/src/shared/lib/slm.ts` o `desktop-app` sidecar |
| **Cache merge-only** | Dataset RAFT append-only, `DB_VERSION=2` no se regenera | `dataset/raft/` incremental |

```ts
// Pipeline RAFT para opencode.db — generá dataset esta semana
async function buildRAFTDataset(sessions: Session[], n = 200) {
  const dataset: RAFTExample[] = [];
  for (let i = 0; i < n; i++) {
    // 1. Generá Q/A de una session (usa LLM docente)
    const oracle = sessions[rand(sessions.length)];
    const { question, answer } = await teacherLLM(
      `Generá pregunta y respuesta breve de: ${oracle.text}`
    );
    // 2. Buscá distractores plausibles (mismo dominio, no oracle)
    const distractors = await vecSearch(question, 10)
      .then(results => results.filter(r => r.id !== oracle.id).slice(0, 3));
    // 3. Generá CoT con citas (LLM docente)
    const cot = await teacherLLM(
      `Q: ${question}\nOracle: ${oracle.text}\nDistractors: ${distractors.map(d=>d.text).join("\n---\n")}\nGenerá ##Reason que distingue oracle de distractors y cita doc ids.`
    );
    dataset.push({ question, docs: shuffle([oracle, ...distractors]), cot, answer });
  }
  // 4. Añadí 20% sin oracle (solo distractores, answer="No hay info")
  for (let i = 0; i < n*0.25; i++) {
    const question = dataset[rand(dataset.length)].question;
    const distractors = await vecSearch(question, 4);
    dataset.push({ question, docs: distractors, cot: "##Reason: Ningún doc contiene la respuesta.", answer: "No hay información relevante en los docs recuperados." });
  }
  return dataset;
}

// Fine-tune SLM local (usa axolotl / unsloth / transformers trainer)
 // Training: Q + docs → CoT + answer, loss solo sobre CoT+answer
```

**Para `IndexedDB v2` + `sqlite-vec`:** el retrieval en producción sigue siendo `vec_search(query, k=5)` local. RAFT no cambia retrieval; cambia **cómo el generador usa el retrieval**. Tu `sqlite-vec` puede seguir igual; el que mejora es el LLM que consume sus resultados.

**Para thin client:** si no fine-tuneás SLM, podés **simular RAFT con prompting**: en `sendPrompt`, instruye al LLM remoto con `"Cita solo docs relevantes [id]. Si ningún doc responde, decí 'no hay info'. Ignorá distractores."` + few-shot con CoT. Es RAFT-zero-shot: no entrena, pero induce comportamiento similar. Medí: ¿reduce citas falsas de 35% a <15%?

---

## 5 Anti-patterns / Limitaciones

- **❌ Fine-tunear sin distractores.** Si entrenás solo con `Q + oracle → A`, el modelo aprende `siempre hay respuesta en docs` y nunca dice "no sé". En producción, cuando retrieval falla, inventa. El 20% sin oracle es obligatorio.
- **❌ Distractores random en vez de plausibles.** Si tus distractores son docs totalmente irrelevantes ("EPERM" vs "receta de torta"), el modelo aprende discriminación trivial y falla con distractores reales (mismo keyword, distinto contexto). Usa `bm25 >0.3` para plausibles.
- **❌ Sin CoT, solo answer con citas.** El paper muestra -6 pts sin `##Reason`. El modelo necesita aprender *por qué* ignora un distractor, no solo *que* lo ignora. El CoT es el gradiente de discriminación.
- **❌ Citas sin formato estricto.** Si permitís citas libres (`[doc_12]` puede ser cualquier cosa), el modelo alucina ids que no existen. Usa `##begin_quote## doc_12 ##end_quote##` o valida que toda cita esté en `docs` input; si no, penalizá.
- **❌ RAFT con P=100% (siempre oracle).** Sobreajusta a "siempre responder". En test con retrieval malo, el modelo fuerza respuesta de distractor. P=80% es el sweet spot medido.
- **⚠️ Costo de dataset.** Generar 200 ejemplos RAFT con LLM docente son ~$5-10 + revisión manual de 20%. No lo hagas para 10 ejemplos; el fine-tune necesita 100+ para generalizar.

---

## 6 Ejercicios prácticos

1.  **RAFT prompting sin fine-tune (1h):** Modificá `sendPrompt` para añadir system: `"Sos un asistente RAFT. Citá solo docs relevantes [id]. Si ningún doc responde, decí 'no hay info'. Razoná en ##Reason antes de responder."` + 2 few-shot con CoT y distractores. Sobre 20 Q&A de `opencode.db`, medí citas correctas vs alucinadas antes/después. Target: -50% citas falsas.
2.  **Dataset RAFT mínimo (2h):** Generá 30 ejemplos RAFT a mano (10 con oracle+distractors, 10 con distractores plausibles, 10 sin oracle). Usa `opencode.db :8765` sessions reales. Verificá que los distractores compartan keyword con la pregunta pero no la respuesta. ¿Cuántos podrías generar con LLM docente sin revisión?
3.  **Benchmark P=80% vs P=100% (2h):** Si tenés SLM local, fine-tuneá dos versiones con 100 ejemplos cada una (P=80% vs P=100%) y evaluá sobre 20 queries donde 5 no tienen oracle. Medí "dice no sé correctamente" — esperás 80% con P=80% vs 20% con P=100%.

---

## 7 Referencias + Checklist

- Zhang et al. — *RAFT: Adapting Language Model to Domain Specific RAG*, 2024 — https://arxiv.org/abs/2403.10131
- Lewis et al. — *RAG* (baseline que RAFT mejora) — https://arxiv.org/abs/2005.11401
- Liu et al. — *Lost in the Middle* (por qué retrieval ruidoso es inevitable) — https://arxiv.org/abs/2307.03172
- `unsloth` / `axolotl` — fine-tune eficiente para RAFT — https://github.com/unslothai/unsloth

### Checklist de lectura

- [ ] Leí figura 1 (receta RAFT) y tabla 1 (ganancias vs DSF+RAG) del paper
- [ ] Entiendo oracle vs distractor y por qué P=80% (20% sin oracle)
- [ ] Probé RAFT prompting (CoT + citas + "no hay info") sin fine-tune y medí citas falsas
- [ ] Generé ≥30 ejemplos RAFT de `opencode.db` con distractores plausibles (no random)
- [ ] Si tengo SLM, fine-tuneé con RAFT y medí robustez a retrieval ruidoso
- [ ] Link guardado y anoté 1 idea para `sendPrompt` o dataset RAFT esta semana

*Generado para sección Papers — 04 Memoria · opencode-remote-android*
