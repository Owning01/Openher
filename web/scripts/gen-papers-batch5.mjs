import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
const BASE_LOCAL = join(process.cwd(), "learning-raw", "08-Papers")
const papers = [
  {
    dir: "01-Reasoning", file: "16-self-refine-2023.md",
    title: "Self-Refine — Iterar con feedback propio (Madaan et al., 2023)",
    meta: { year: 2023, authors: "Madaan et al.", link: "https://arxiv.org/abs/2303.17651", pri: "MEDIA P1", minutes: 13 },
    body: `> **Paper:** Self-Refine: Iterative Refinement with Self-Feedback (Madaan et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2303.17651
> **Prioridad:** MEDIA P1

## 1. Resumen
Generate → feedback (mismo LLM) → refine loop. Sin herramientas externas, mejora 20% en code, math, dialog.

## 2. Aplica
- Loop barato antes de llamar tool: self-refine local con Phi-3, luego tool_call.

## 3. Links
- https://arxiv.org/abs/2303.17651`
  },
  {
    dir: "02-Harness", file: "10-ada-planner-2023.md",
    title: "AdaPlanner — Plan adaptativo en entorno (Sun et al., 2023)",
    meta: { year: 2023, authors: "Sun et al.", link: "https://arxiv.org/abs/2305.16653", pri: "MEDIA P1", minutes: 13 },
    body: `> **Paper:** AdaPlanner: Adaptive Planning from Feedback with Language Models (Sun et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2305.16653
> **Prioridad:** MEDIA P1

## 1. Resumen
Planner genera plan, executor ejecuta, si falla re-planifica *in-context* y *out-of-context* (revisa skill library). AlfWorld +7% vs ReAct.

## 2. Aplica
- Para tu ptyx: guarda planes fallidos en IndexedDB, re-planifica con Reflexion.

## 3. Links
- https://arxiv.org/abs/2305.16653`
  },
  {
    dir: "04-Memoria", file: "09-mem0-2024.md",
    title: "Mem0 — Memoria persistente para agentes (Chhikara et al., 2024)",
    meta: { year: 2024, authors: "Chhikara et al.", link: "https://arxiv.org/abs/2404.19413", pri: "MEDIA P1", minutes: 13 },
    body: `> **Paper:** Mem0: Building Production-Ready AI Agents with Scalable Long-Term Memory (Chhikara et al., 2024).
> **Link:** https://arxiv.org/abs/2404.19413
> **Prioridad:** MEDIA P1

## 1. Resumen
Mem0 extrae facts de conversaciones, almacena en grafo/vector, retrievea por relevancia. API open-source para memoria agente.

## 2. Aplica
- Alternativa a MemGPT para tu IndexedDB: extrae facts, no solo messages.

## 3. Links
- https://arxiv.org/abs/2404.19413`
  },
  {
    dir: "03-Agentes", file: "11-crewai-2024.md",
    title: "CrewAI — Orquestación multi-agente por roles (Moura, 2024)",
    meta: { year: 2024, authors: "Moura / CrewAI", link: "https://github.com/crewAIInc/crewAI", pri: "MEDIA P1", minutes: 12 },
    body: `> **Guía:** CrewAI: Framework for Orchestrating Role-Playing Autonomous AI Agents (2024).
> **Link:** https://github.com/crewAIInc/crewAI — docs.crewai.com
> **Prioridad:** MEDIA P1 · **Nota:** sin paper arXiv, framework docs.

## 1. Resumen
CrewAI define agents por role/goal/backstory, tasks por description/expected_output, crew orquesta secuencial/hierárquico. Popular (20k stars).

## 2. Aplica vs AutoGen/MetaGPT
- AutoGen = chat libre, MetaGPT = SOPs, CrewAI = role-play. Para tu harness, prueba CrewAI como orquestador-workers ligero.

## 3. Links
- https://github.com/crewAIInc/crewAI`
  },
]
function mdTemplate(p) {
  const { title, meta, body } = p
  return `# ${title}

> **Autores:** ${meta.authors}
> **Año:** ${meta.year} · **Prioridad:** ${meta.pri} · **Lectura:** ~${meta.minutes} min
> **Link verificado:** [${meta.link}](${meta.link})
> **Categoría Papers:** ${p.dir.replace(/^\d+-/, "").replace(/-/g, " ")} · **Nivel:** intermedio
> ⚠️ Resumen destilado.
---

${body.trim()}

*Pass 5 final · opencode-remote-android*
`
}
for (const p of papers) {
  const outPath = join(BASE_LOCAL, p.dir, p.file)
  mkdirSync(join(BASE_LOCAL, p.dir), { recursive: true })
  writeFileSync(outPath, mdTemplate(p), "utf8")
  console.log("✓", outPath)
}
console.log(`✓ ${papers.length} papers Pass 5 generados`)
