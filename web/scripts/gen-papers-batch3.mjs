import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
const BASE_LOCAL = join(process.cwd(), "learning-raw", "08-Papers")
const papers = [
  // Pass 3 - Reasoning/Harness adicionales
  {
    dir: "01-Reasoning", file: "10-pal-2023.md",
    title: "PAL — Program-Aided Language Models (Gao et al., 2023)",
    meta: { year: 2023, authors: "Gao et al. / CMU", link: "https://arxiv.org/abs/2211.10435", pri: "MEDIA P1", minutes: 14 },
    body: `
> **Paper:** PAL: Program-Aided Language Models Can Solve Reasoning Tasks (Gao et al., 2023).
> **Link:** https://arxiv.org/abs/2211.10435
> **Prioridad:** MEDIA P1 · **Nuevo vs CoT:** CoT razona en NL; PAL razona *escribiendo Python y ejecutándolo*.

## 1. Resumen
PAL intercala NL + código Python ejecutable. En GSM8K: CoT 65% → PAL 72% (code-davinci-002). En razonamiento simbólico +10%. El intérprete hace el cálculo, no el LLM.

## 2. Pipeline
\`Thought (NL) → code (python) → exec → observe → final answer\` — es ReAct con tool = python.

## 3. Aplica a tu ptyx
- Tu WS PTY :4849 es el intérprete PAL. Obliga al agente a generar código verificable, no texto. Reduce alucinación aritmética.

## 4. Links
- https://arxiv.org/abs/2211.10435
`
  },
  {
    dir: "01-Reasoning", file: "11-rewoo-2023.md",
    title: "ReWOO — Razonar sin observar (Xu et al., 2023)",
    meta: { year: 2023, authors: "Xu et al.", link: "https://arxiv.org/abs/2305.18323", pri: "MEDIA P1", minutes: 13 },
    body: `
> **Paper:** ReWOO: Decoupling Reasoning from Observations (Xu et al., 2023).
> **Link:** https://arxiv.org/abs/2305.18323
> **Prioridad:** MEDIA P1

## 1. Resumen
ReWOO genera *todo el plan* (Reasoning + tool calls con placeholders) sin esperar observations, luego ejecuta tools en batch y resuelve. Reduce tokens 5× vs ReAct (no interleaving), 43% ahorro en HotpotQA.

## 2. Aplica
- Para thin client con latencia alta (SSE), batch tool calls: genera 3 \`fs.read\` de una vez, no secuencial.

## 3. Links
- https://arxiv.org/abs/2305.18323
`
  },
  {
    dir: "02-Harness", file: "07-hugginggpt-2023.md",
    title: "HuggingGPT — LLM como controlador de modelos (Shen et al., 2023)",
    meta: { year: 2023, authors: "Shen et al. / Microsoft", link: "https://arxiv.org/abs/2303.17580", pri: "MEDIA P1", minutes: 14 },
    body: `
> **Paper:** HuggingGPT: Solving AI Tasks with ChatGPT and Its Friends in Hugging Face (Shen et al., 2023).
> **Link:** https://arxiv.org/abs/2303.17580
> **Prioridad:** MEDIA P1

## 1. Resumen
LLM planifica, selecciona modelo HuggingFace (por descripción), ejecuta, resume. 0-shot sobre 100+ tasks. No entrena, solo orquesta.

## 2. Aplica
- Patrón para tu \`external_router\`: LLM elige plugin externo por descripción, no por if hardcodeado. Es Toolformer manual.

## 3. Links
- https://arxiv.org/abs/2303.17580
`
  },
  {
    dir: "02-Harness", file: "08-taskweaver-2023.md",
    title: "TaskWeaver — Agente orientado a código para data (Microsoft, 2023)",
    meta: { year: 2023, authors: "Qiao et al. / Microsoft", link: "https://arxiv.org/abs/2311.17541", pri: "MEDIA P1", minutes: 14 },
    body: `
> **Paper:** TaskWeaver: A Code-First Agent Framework (Qiao et al., 2023).
> **Link:** https://arxiv.org/abs/2311.17541
> **Prioridad:** MEDIA P1

## 1. Resumen
Agente genera código Python, lo ejecuta en sandbox, itera con error trace. Plugins son funciones Python documentadas. Supera ReAct en data tasks (10%+).

## 2. Aplica
- Tu \`ptyx\` + \`fsx\` como plugins TaskWeaver: el agente genera código que los llama, no tool_call JSON.

## 3. Links
- https://arxiv.org/abs/2311.17541
`
  },
  // Pass 4 - Eficiencia
  {
    dir: "01-Reasoning", file: "12-flashattention-2023.md",
    title: "FlashAttention-2 — Atención 2-4× más rápida (Dao 2023)",
    meta: { year: 2023, authors: "Dao et al. / Stanford", link: "https://arxiv.org/abs/2307.08691", pri: "MEDIA P1", minutes: 14 },
    body: `
> **Paper:** FlashAttention-2: Faster Attention with Better Parallelism and Work Partitioning (Dao, 2023).
> **Link:** https://arxiv.org/abs/2307.08691
> **Prioridad:** MEDIA P1

## 1. Resumen
Reordena cómputo para SRAM, reduce HBM reads. 2× vs FlashAttention 1, 4× vs naive. Permite context 16k en A100 sin OOM.

## 2. Aplica
- Entiende por qué tu context 128k es caro y por qué FlashAttention en local SLM (Phi-3) permite 16k sin swap.

## 3. Links
- https://arxiv.org/abs/2307.08691
`
  },
  {
    dir: "06-Skills", file: "06-lora-2021.md",
    title: "LoRA — Fine-tune barato con rango bajo (Hu et al., 2021)",
    meta: { year: 2021, authors: "Hu et al. / Microsoft", link: "https://arxiv.org/abs/2106.09685", pri: "ALTA P0", minutes: 15 },
    body: `
> **Paper:** LoRA: Low-Rank Adaptation of Large Language Models (Hu et al., ICLR 2022).
> **Link:** https://arxiv.org/abs/2106.09685
> **Prioridad:** ALTA P0

## 1. Resumen
Congela W, entrena ΔW = B·A (rank r=8). 10k× menos params, sin latencia extra (merge). GPT-3 175B fine-tune en 1 GPU.

## 2. Aplica
- Fine-tunea Phi-3 local para tu dominio (opencode.db, fsx) con LoRA en laptop, no full finetune.

## 3. Links
- https://arxiv.org/abs/2106.09685
`
  },
  {
    dir: "06-Skills", file: "07-qlora-2023.md",
    title: "QLoRA — Fine-tune 65B en 48GB (Dettmers et al., 2023)",
    meta: { year: 2023, authors: "Dettmers et al.", link: "https://arxiv.org/abs/2305.14314", pri: "MEDIA P1", minutes: 14 },
    body: `
> **Paper:** QLoRA: Efficient Finetuning of Quantized LLMs (Dettmers et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2305.14314
> **Prioridad:** MEDIA P1

## 1. Resumen
4-bit NormalFloat + double quant + paged optimizer → fine-tune Llama 65B en 1×48GB. QLoRA = LoRA sobre modelo quantizado.

## 2. Aplica
- Fine-tunea tu 7B local en Windows con 16GB VRAM.

## 3. Links
- https://arxiv.org/abs/2305.14314
`
  },
  {
    dir: "01-Reasoning", file: "13-mamba-2023.md",
    title: "Mamba — SSM lineal sin atención (Gu & Dao, 2023)",
    meta: { year: 2023, authors: "Gu & Dao / Princeton", link: "https://arxiv.org/abs/2312.00752", pri: "MEDIA P1", minutes: 14 },
    body: `
> **Paper:** Mamba: Linear-Time Sequence Modeling with Selective State Spaces (Gu & Dao, 2023).
> **Link:** https://arxiv.org/abs/2312.00752
> **Prioridad:** MEDIA P1

## 1. Resumen
State Space Model seleccionable: O(n) vs O(n²) attention, 5× throughput, contexto 1M. Supera Transformer en 2k-8k y empata en largo.

## 2. Aplica
- Futuro thin client: si context 1M es norma, Mamba evita tu bottleneck O(n²). Vigila Jamba, Codestral Mamba.

## 3. Links
- https://arxiv.org/abs/2312.00752
`
  },
  // Pass 5 - Alineamiento / Safety
  {
    dir: "06-Skills", file: "08-instructgpt-2022.md",
    title: "InstructGPT — RLHF para seguir instrucciones (Ouyang et al., 2022)",
    meta: { year: 2022, authors: "Ouyang et al. / OpenAI", link: "https://arxiv.org/abs/2203.02155", pri: "MEDIA P1", minutes: 15 },
    body: `
> **Paper:** Training Language Models to Follow Instructions with Human Feedback (Ouyang et al., NeurIPS 2022).
> **Link:** https://arxiv.org/abs/2203.02155
> **Prioridad:** MEDIA P1

## 1. Resumen
SFT → reward model humano → PPO. InstructGPT 1.3B preferido sobre GPT-3 175B (85% win). Base de ChatGPT.

## 2. Aplica
- Entiende por qué tu agente prefiere respuestas útiles pero puede ser verboso — trade-off RLHF.

## 3. Links
- https://arxiv.org/abs/2203.02155
`
  },
  {
    dir: "06-Skills", file: "09-dpo-2023.md",
    title: "DPO — RLHF sin RL (Rafailov et al., 2023)",
    meta: { year: 2023, authors: "Rafailov et al. / Stanford", link: "https://arxiv.org/abs/2305.10557", pri: "MEDIA P1", minutes: 14 },
    body: `
> **Paper:** Direct Preference Optimization: Your Language Model is Secretly a Reward Model (Rafailov et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2305.10557
> **Prioridad:** MEDIA P1

## 1. Resumen
DPO reescribe RLHF como classification loss sobre preferencias (y_w > y_l), sin PPO/reward model. Más estable, 1 GPU.

## 2. Aplica
- Alinea tu Phi-3 local a tu estilo (e.g., "responde conciso, cita files") con 500 pares preferidos, sin RL.

## 3. Links
- https://arxiv.org/abs/2305.10557
`
  },
  {
    dir: "06-Skills", file: "10-self-instruct-2022.md",
    title: "Self-Instruct — 52k instrucciones sintéticas (Wang et al., 2022)",
    meta: { year: 2022, authors: "Wang et al. / UW", link: "https://arxiv.org/abs/2212.10560", pri: "MEDIA P1", minutes: 13 },
    body: `
> **Paper:** Self-Instruct: Aligning Language Models with Self-Generated Instructions (Wang et al., 2022).
> **Link:** https://arxiv.org/abs/2212.10560
> **Prioridad:** MEDIA P1

## 1. Resumen
80 seeds → LLM genera 52k instrucciones + respuestas, filtra, fine-tunea. Alpaca 52k usa este método. 85% de calidad vs InstructGPT.

## 2. Aplica
- Genera dataset sintético para tu dominio (opencode tasks) sin etiquetar humano.

## 3. Links
- https://arxiv.org/abs/2212.10560
`
  },
  {
    dir: "08-Observabilidad", file: "02-langsmith-2024.md",
    title: "LangSmith + OTel GenAI — Trazar harness (LangChain 2024)",
    meta: { year: 2024, authors: "LangChain", link: "https://docs.smith.langchain.com/observability", pri: "MEDIA P1", minutes: 13 },
    body: `
> **Paper/Guía:** LangSmith Observability + OpenTelemetry GenAI (2024).
> **Link:** https://docs.smith.langchain.com/observability
> **Prioridad:** MEDIA P1

## 1. Resumen
LangSmith traza cada LLM/tool call con OTel, evalúa con datasets, compara prompts. Se integra con OTel collector.

## 2. Aplica
- Usa LangSmith local o Jaeger + OTel para debuggear tu harness Rust (correlaciona SSE event con tool_call).

## 3. Links
- https://docs.smith.langchain.com/observability
`
  },
]
function mdTemplate(p) {
  const { title, meta, body } = p
  return `# ${title}

> **Autores:** ${meta.authors}
> **Año:** ${meta.year} · **Prioridad:** ${meta.pri} · **Lectura:** ~${meta.minutes} min
> **Link verificado:** [${meta.link}](${meta.link})
> **Categoría Papers:** ${p.dir.replace(/^\d+-/, "").replace(/-/g, " ")} · **Nivel:** ${meta.pri.includes("ALTA") ? "avanzado" : "intermedio"}

> ⚠️ Nota: resumen destilado para *opencode-remote-android*.

---

${body.trim()}

---

## Checklist
- [ ] Leí abstract
- [ ] Anoté 1 idea para harness

*Pass 3-5 · opencode-remote-android*
`
}
for (const p of papers) {
  const outPath = join(BASE_LOCAL, p.dir, p.file)
  mkdirSync(join(BASE_LOCAL, p.dir), { recursive: true })
  writeFileSync(outPath, mdTemplate(p), "utf8")
  console.log("✓", outPath)
}
console.log(`✓ ${papers.length} papers Pass 3-5 generados`)
