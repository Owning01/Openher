import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
const BASE_LOCAL = join(process.cwd(), "learning-raw", "08-Papers")
const papers = [
  {
    dir: "01-Reasoning", file: "14-speculative-decoding-2023.md",
    title: "Speculative Decoding — Acelerar inferencia 2-3× (Leviathan et al., 2023)",
    meta: { year: 2023, authors: "Leviathan et al. / Google", link: "https://arxiv.org/abs/2211.17192", pri: "MEDIA P1", minutes: 13 },
    body: `
> **Paper:** Fast Inference from Transformers via Speculative Decoding (Leviathan et al., ICML 2023).
> **Link:** https://arxiv.org/abs/2211.17192
> **Prioridad:** MEDIA P1

## 1. Resumen
Usa draft model pequeño para proponer k tokens, target model verifica en paralelo. 2-3× speedup sin perder calidad.

## 2. Aplica
- Acelera tu Phi-3 local en desktop-app: draft 1B + target 7B.

## 3. Links
- https://arxiv.org/abs/2211.17192
`
  },
  {
    dir: "02-Harness", file: "09-vllm-pagedattention-2023.md",
    title: "vLLM PagedAttention — Servir LLMs 24× throughput (Kwon et al., 2023)",
    meta: { year: 2023, authors: "Kwon et al. / UC Berkeley", link: "https://arxiv.org/abs/2309.06180", pri: "MEDIA P1", minutes: 14 },
    body: `
> **Paper:** Efficient Memory Management for Large Language Model Serving with PagedAttention (Kwon et al., SOSP 2023).
> **Link:** https://arxiv.org/abs/2309.06180
> **Prioridad:** MEDIA P1

## 1. Resumen
PagedAttention pagina KV cache como OS, reduce fragmentación 4×, throughput 2-4×, 24× vs HF.

## 2. Aplica
- Si sirves SLM local en Rust, implementa paged KV para batch requests del harness.

## 3. Links
- https://arxiv.org/abs/2309.06180
`
  },
  {
    dir: "06-Skills", file: "11-llama2-2023.md",
    title: "Llama 2 — Open foundation 7-70B (Touvron et al., 2023)",
    meta: { year: 2023, authors: "Touvron et al. / Meta", link: "https://arxiv.org/abs/2307.09288", pri: "MEDIA P1", minutes: 14 },
    body: `
> **Paper:** Llama 2: Open Foundation and Fine-Tuned Chat Models (Touvron et al., 2023).
> **Link:** https://arxiv.org/abs/2307.09288
> **Prioridad:** MEDIA P1

## 1. Resumen
2T tokens, RLHF, 70B supera GPT-3.5 en MMLU. Base de Code Llama y de tu Phi-3 distill.

## 2. Aplica
- Entiende trade-off 7B vs 70B para local vs remoto.

## 3. Links
- https://arxiv.org/abs/2307.09288
`
  },
  {
    dir: "01-Reasoning", file: "15-orca-2023.md",
    title: "Orca — Imitación progresiva de GPT-4 (Mukherjee et al., 2023)",
    meta: { year: 2023, authors: "Mukherjee et al. / Microsoft", link: "https://arxiv.org/abs/2306.02707", pri: "MEDIA P1", minutes: 13 },
    body: `
> **Paper:** Orca: Progressive Learning from Complex Explanation Traces of GPT-4 (Mukherjee et al., 2023).
> **Link:** https://arxiv.org/abs/2306.02707
> **Prioridad:** MEDIA P1

## 1. Resumen
Orca 13B entrenada en 5M traces de GPT-4 con explicaciones paso a paso supera Vicuna 13B +100% en AGIEval, casi ChatGPT.

## 2. Aplica
- Receta para distilar tu harness: genera traces con GPT-4, fine-tunea 7B local.

## 3. Links
- https://arxiv.org/abs/2306.02707
`
  },
  {
    dir: "03-Agentes", file: "10-codet5-2021.md",
    title: "CodeT5 — Encoder-decoder para código (Wang et al., 2021)",
    meta: { year: 2021, authors: "Wang et al. / Salesforce", link: "https://arxiv.org/abs/2109.00859", pri: "MEDIA P1", minutes: 13 },
    body: `
> **Paper:** CodeT5: Identifier-aware Unified Pre-trained Encoder-Decoder Models for Code Understanding and Generation (Wang et al., 2021).
> **Link:** https://arxiv.org/abs/2109.00859
> **Prioridad:** MEDIA P1

## 1. Resumen
T5 para código: pre-train con masked span + identifier tagging. Base de muchos code agents.

## 2. Aplica
- Histórico: de CodeT5 → StarCoder2 → Code Llama. Entiende evolución.

## 3. Links
- https://arxiv.org/abs/2109.00859
`
  },
]
function mdTemplate(p) {
  const { title, meta, body } = p
  return `# ${title}

> **Autores:** ${meta.authors}
> **Año:** ${meta.year} · **Prioridad:** ${meta.pri} · **Lectura:** ~${meta.minutes} min
> **Link verificado:** [${meta.link}](${meta.link})
> **Categoría Papers:** ${p.dir.replace(/^\d+-/, "").replace(/-/g, " ")} · **Nivel:** intermedio

> ⚠️ Resumen destilado para *opencode-remote-android*.

---

${body.trim()}

---

*Pass 4 final · opencode-remote-android*
`
}
for (const p of papers) {
  const outPath = join(BASE_LOCAL, p.dir, p.file)
  mkdirSync(join(BASE_LOCAL, p.dir), { recursive: true })
  writeFileSync(outPath, mdTemplate(p), "utf8")
  console.log("✓", outPath)
}
console.log(`✓ ${papers.length} papers Pass 4 generados`)
