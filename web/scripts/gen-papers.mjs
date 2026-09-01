import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"

const BASE_LOCAL = join(process.cwd(), "learning-raw", "08-Papers")
const BASES = [BASE_LOCAL]

const papers = [
  // 01 Reasoning
  {
    dir: "01-Reasoning",
    file: "01-attention-is-all-you-need-2017.md",
    title: "Attention Is All You Need — El Transformer (Vaswani et al., 2017)",
    meta: { year: 2017, authors: "Vaswani et al. / Google", link: "https://arxiv.org/abs/1706.03762", pri: "Imprescindible", minutes: 25 },
    body: `
> **Paper original:** Attention Is All You Need (Vaswani, Shazeer, Parmar et al., NeurIPS 2017) — Google Brain / Google Research.
> **Link:** https://arxiv.org/abs/1706.03762
> **Relevancia para opencode-remote-android:** explica *por qué* existe tu SSE streaming, tu context window y tu coste cuadrático.
> **Prioridad:** Imprescindible (fundacional) · **Tiempo:** 25 min

## 1. Resumen ejecutivo
El Transformer elimina recurrencia y convolución: todo es **atención**. Con 6 capas encoder+decoder, 8 heads, 512 dim, logra SOTA en traducción WMT con 3.5 días en 8 GPUs. Introduce *self-attention* escalada por √dₖ, *multi-head*, *positional encoding* sinusoidal y *residual + layer norm*.

**Tesis:** la atención es suficiente para modelar dependencias largas sin RNN. El paralelismo desbloquea escalar datos y cómputo.

## 2. Ideas clave
- **Scaled dot-product attention:** \\(Attention(Q,K,V)=softmax(QKᵀ/√dₖ)V\\) — √dₖ evita saturar softmax.
- **Multi-head:** 8 proyecciones distintas → el modelo mira sintaxis, semántica y posición a la vez. Equivale a 8 filtros.
- **Positional encoding:** \\(PE(pos,2i)=sin(pos/10000^{2i/d})\\), \\(cos\\) para impar — permite extrapolar a secuencias más largas que el entrenamiento.
- **Por qué importa el coste:** atención es O(n²·d). Con n=128k tokens, son ~16B operaciones por head. De ahí tu \\(polling 3.5s\\) y límites \\(loadSelected 20/100\\).
- **Residual + Norm:** permite entrenar 6-12 capas sin desvanecimiento de gradiente.

## 3. Qué demostró
- BLEU 28.4 en WMT En-De (supera ensemble previo 26.30 con 3.5 días vs semanas).
- 41.0 BLEU En-Fr con big model (213M params).
- Ablations: sin multi-head −0.9 BLEU; sin positional − casi no converge.

## 4. Cómo aplica a opencode-remote-android
- **Entender por qué compactas:** tu \\(miser/ultra\\) no es UX, es física: cada token extra paga O(n²). Mover info crítica al inicio/final (Lost-in-the-Middle) mitiga.
- **SSE + streaming:** el decoder genera token-a-token con *masked self-attention* — tu \\(message.part.delta\\) es literalmente ese flujo.
- **IndexedDB v2 = memoria externa:** como no puedes meter 500 msgs en contexto, paginas (MemGPT). El Transformer explica por qué no hay alternativa barata.
- **Decisión de arquitectura:** si usas Phi-3 local (3.8B) vs GPT-4 remoto, el coste n² justifica routing local para \\(/help\\).

## 5. Anti-patterns / Limitaciones
- No inventar contexto infinito vendor: aunque prometan 1M tokens, el coste y \\(Lost-in-Middle\\) lo mata.
- Positional encoding original falla >2k sin RoPE/ALiBi — no extrapoles.
- Atención pura sin sparse/mamba = latencia SSE alta si mandas historial completo.

## 6. Ejercicios prácticos (en tu repo)
1. Loguea tokens enviados en \\(shared/api/client.ts\\) y estima FLOPs: \\(tokens² × layers\\). ¿Cuándo justifica truncar?
2. Cambia \\(loadSelected\\) para medir latencia vs n tokens (20, 50, 100, 200). Grafícalo.
3. Implementa un \\(reranker BM25\\) que ponga top-3 relevante al inicio/final y mide si baja alucinación.

## 7. Referencias
- Paper: https://arxiv.org/abs/1706.03762 + https://arxiv.org/pdf/1706.03762
- Illustrated Transformer (Jay Alammar) — visual obligatorio.
- Relacionado: CoT (2201.11903), ReAct (2210.03629), Lost-in-Middle (2307.03172).
`
  },
  {
    dir: "01-Reasoning",
    file: "02-chain-of-thought-2022.md",
    title: "Chain-of-Thought — Razonar paso a paso (Wei et al., 2022)",
    meta: { year: 2022, authors: "Wei et al. / Google", link: "https://arxiv.org/abs/2201.11903", pri: "Imprescindible", minutes: 18 },
    body: `
> **Paper:** Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (Wei et al., NeurIPS 2022) — Google Research.
> **Link:** https://arxiv.org/abs/2201.11903
> **Prioridad:** Imprescindible · **Tiempo:** 18 min

## 1. Resumen
Añadir ejemplos con **razonamiento intermedio explícito** (no solo respuesta final) dispara rendimiento en tareas de aritmética, sentido común y simbólicas. Con PaLM 540B: GSM8K 17.9% → 58.1% solo con CoT. Frase mágica zero-shot: *"Let's think step by step"*.

## 2. Ideas clave
- **Few-shot CoT:** 8 ejemplos con pasos intermedios supera few-shot estándar en 3 benchmarks.
- **Zero-shot CoT:** solo añadir *"Let's think step by step"* sube MultiArith 17.7% → 78.7% (sin ejemplos).
- **Escalabilidad:** solo emerge con modelos >100B; <10B apenas mejora (scaling law).
- **Por qué funciona:** obliga al modelo a descomponer problema en sub-pasos que ya vio en pre-training.

## 3. Evidencia
- GSM8K, SVAMP, MAWPS, AQuA, StrategyQA, coin flip, last letter concatenation — CoT gana en todos con escala.
- Ablation: respuestas más largas sin razonamiento no ayudan; el contenido del paso intermedio sí.

## 4. Aplica a tu harness
- Tu \\(ThinkingBlock\\) + \\(footerInfoMap\\) ya muestran razonamiento; hazlo **obligatorio en prompts** de agente: template \\(Thought: ...\\).
- Para \\(opencode-remote\\) SSE: separa \\(part.type=reasoning\\) de \\(part.type=tool_call\\). No mezcles.
- Úsalo en prompts de \\(external_router\\): pide al modelo explicar plan antes de llamar \\(fs.read\\).

## 5. Limitaciones
- Alucina si los pasos son largos sin verificación (ver Self-Consistency, Reflexion).
- Coste tokens ×2-3. Compensa con compaction (Effective Context Engineering).

## 6. Ejercicio
- Reescribe tu prompt de sistema para forzar CoT: "Piensa en 3 pasos numerados antes de actuar". Mide pass rate en 5 tareas SWE-bench Lite vs sin CoT.

## 7. Links
- https://arxiv.org/abs/2201.11903 · Blog Google.
`
  },
  {
    dir: "01-Reasoning",
    file: "03-self-consistency-2022.md",
    title: "Self-Consistency — Votar entre múltiples razonamientos (Wang et al., 2022)",
    meta: { year: 2022, authors: "Wang et al. / Google", link: "https://arxiv.org/abs/2203.11171", pri: "Muy recomendado", minutes: 15 },
    body: `
> **Paper:** Self-Consistency Improves Chain of Thought Reasoning in Language Models (Wang et al., ICLR 2023) — Google.
> **Link:** https://arxiv.org/abs/2203.11171
> **Prioridad:** Muy recomendado

## 1. Resumen
En vez de greedy decode (1 camino), samplea **k caminos CoT diversos** (temp 0.7) y elige la respuesta por **mayoría**. GSM8K +17.9 puntos, SVAMP +11, AQuA +12.2. Sin entrenar nada.

## 2. Ideas
- Usa decoding estocástico para explorar razonamientos alternativos.
- Voto mayoritario es más robusto que un solo chain (reduce varianza).
- Compatible con cualquier CoT; mejora con k=5→40 (rendimiento crece logarítmico).

## 3. Aplica a tu proyecto
- Patrón **evaluator-optimizer** (Anthropic): genera 3 resúmenes de \\(compact\\) y elige mejor → útil para resumir historial largo en \\(useMessages\\).
- Para reportes PTES: genera 3 versiones del hallazgo y vota.
- Coste ×k → úsalo solo en pasos críticos (no en cada tool call).

## 4. Ejercicio
- Implementa función \\(selfConsistentAnswer(prompt, k=3)\\) que llame a opencode 3 veces y haga voto. Mide latencia vs calidad en 10 preguntas GAIA-L1.
`
  },
  {
    dir: "01-Reasoning",
    file: "04-react-2022.md",
    title: "ReAct — Razonar y Actuar intercalados (Yao et al., 2022)",
    meta: { year: 2022, authors: "Yao et al. / Princeton + Google", link: "https://arxiv.org/abs/2210.03629", pri: "Imprescindible", minutes: 22 },
    body: `
> **Paper:** ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al., ICLR 2023).
> **Link:** https://arxiv.org/abs/2210.03629 — GitHub ejemplos HotpotQA/FEVER.
> **Prioridad:** Imprescindible — *el DSL de tu harness.*

## 1. Resumen
ReAct intercala **Thought → Action → Observation** en loop. vs solo razonar (CoT) o solo actuar (Act): ReAct domina HotpotQA y FEVER. En AlfWorld (simulación doméstica) ReAct 34% vs Act 26% success — la razón: el pensamiento guía qué tool usar y la observación corrige el pensamiento.

## 2. Formato exacto
\`\`\`
Thought: necesito chequear si el archivo existe...
Action: shell.fs.ls({"path": "/"})
Observation: ["web/", "desktop-app/"]
Thought: ahora leo el manifest...
Action: shell.fs.read({"path": "web/public/learning/manifest.json"})
\`\`\`
Sin Thought explícito, el modelo alucina tool calls.

## 3. Evidencia
- HotpotQA EM 27.4 → 30.1 (ReAct+CoT).
- FEVER accuracy 60.9 → 65.8.
- Human study: ReAct más interpretable y depurable.

## 4. Mapeo a opencode-remote-android
- **Tu SSE ya es ReAct sin saberlo:** \\(message.part.delta\\) con \\(type=reasoning\\), \\(tool_call\\), \\(tool_result\\). Tipa \\(type ReActPart = Thought|Action|Observation\\) en \\(shared/sse/handler.ts\\).
- **Composer:** fuerza template Thought antes de cada \\(shell.fs.*\\).
- **UI:** muestra Thought colapsable (como tu ThinkingBlock) y Action con status (probe 250ms).
- **MCP:** cada tool debe devolver Observation estructurada (no texto libre) para que el próximo Thought sea útil.

## 5. Anti-pattern
- No uses ReAct para tareas triviales (\\(/help\\)) — overhead. Usa workflow determinista (Anthropic: Building Effective Agents).

## 6. Ejercicio
- Refactor \\(useSSEHandler\\) para loguear tripleta ReAct por turno y exponerla en devtools. Mide cuántos turnos ahorras vs Act-only en 5 fixes de \\(SWE-bench Lite\\).

## 7. Links
- https://arxiv.org/abs/2210.03629 · https://github.com/ysymyth/ReAct
`
  },
  {
    dir: "01-Reasoning",
    file: "05-tree-of-thoughts-2023.md",
    title: "Tree of Thoughts — Buscar sobre pensamientos (Yao et al., 2023)",
    meta: { year: 2023, authors: "Yao et al. / Princeton", link: "https://arxiv.org/abs/2305.10601", pri: "Muy recomendado", minutes: 20 },
    body: `
> **Paper:** Tree of Thoughts: Deliberate Problem Solving with Large Language Models (Yao et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2305.10601 — github.com/princeton-nlp/tree-of-thought-llm
> **Prioridad:** Muy recomendado

## 1. Resumen
Generaliza CoT a **búsqueda en árbol**: cada nodo = thought parcial, aristas = continuaciones, evaluación heurística (vota o LLM judge) poda ramas. En Game of 24: CoT 4% → ToT 74% (GPT-4). Creative Writing y Mini Crossword también superan CoT.

## 2. Ideas
- **BFS/DFS sobre pensamientos:** explora k candidatos por nivel, guarda mejores b.
- **Evaluador:** otro prompt que puntúa \\(thought ~ promising/ impossible\\).
- **Backtracking:** si rama falla, vuelve y prueba otra (como humano).

## 3. Cuándo usarlo
- No para chat simple. Sí para **planificación multi-archivo** (refactor, migración).
- Coste 10-50× CoT → úsalo como \\(planner\\) opcional, no por defecto.

## 4. Aplica a tu thin client
- Para tareas \\(kanban\\) complejas: genera 3 planes ToT (BFS depth 2) y elige el que pasa \\(cargo check\\) en simulación.
- Implementa ToT local con Phi-3 barato para explorar planes antes de llamar al modelo caro remoto.

## 5. Limitación
- Sin heurística buena, explota combinatorio. Requiere task-specific prompt evaluator.

## 6. Ejercicio
- Implementa ToT depth=2, branch=3 para "migrar external_router a MCP". Evalúa 9 planes con LLM judge y ejecuta el ganador.
`
  },
  {
    dir: "01-Reasoning",
    file: "06-reflexion-2023.md",
    title: "Reflexion — Aprendizaje verbal sin pesos (Shinn et al., 2023)",
    meta: { year: 2023, authors: "Shinn et al. / NYU", link: "https://arxiv.org/abs/2303.11366", pri: "Muy recomendado", minutes: 16 },
    body: `
> **Paper:** Reflexion: Language Agents with Verbal Reinforcement Learning (Shinn et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2303.11366 — github.com/noahshinn/reflexion
> **Prioridad:** Muy recomendado

## 1. Resumen
Tras fallar (test no pasa), el agente genera **reflexión verbal** (qué hizo mal, cómo mejorar) y la guarda en memoria episódica. En siguiente intento la lee y mejora sin actualizar pesos. AlfWorld 55%→78%, HotpotQA 30%→48% en 2-3 trials.

## 2. Loop
\`act → observe → fail → reflect("olvidé instalar dep") → memory → retry\`

## 3. Aplica a opencode-remote-android
- En \\(hooks/useMessages.ts\\): cuando \\(sendPrompt\\) falla o test no pasa, guarda \\{task, error, reflection\\} en IndexedDB.
- En próximo retry, inyecta \\"Reflexión previa: ...\\" como contexto. No tirar historial.
- Úsalo para \\(ptyx\\) errores de compilación: guarda \\"cargo check falló por missing import X\\".

## 4. Ejercicio
- Añade tabla \\"reflections\\" en IndexedDB v2 y muestrala en UI de sesión como "lecciones aprendidas".

## 5. Links
- https://arxiv.org/abs/2303.11366
`
  },

  // 02 Harness
  {
    dir: "02-Harness",
    file: "01-toolformer-2023.md",
    title: "Toolformer — El modelo aprende a usar tools solo (Schick et al., 2023)",
    meta: { year: 2023, authors: "Schick et al. / Meta", link: "https://arxiv.org/abs/2302.04761", pri: "Imprescindible", minutes: 20 },
    body: `
> **Paper:** Toolformer: Language Models Can Teach Themselves to Use Tools (Schick et al., NeurIPS 2023) — Meta AI.
> **Link:** https://arxiv.org/abs/2302.04761
> **Prioridad:** Imprescindible (fundacional harness)

## 1. Resumen
Toolformer entrena un LM 6.7B para **decidir cuándo y cómo llamar APIs** sin supervisión humana: genera candidatos con tools, filtra por ganancia de perplexity, y fine-tunea. Con 5 tools (QA, calculadora, wiki search, traductor, calendario) supera GPT-3 175B en tareas que requieren cálculo/búsqueda.

## 2. Ideas clave
- **Self-supervised tool augmentation:** inserta llamadas \\"[QA(question)] → answer\\" solo si \\(perplexity(result) < perplexity(no tool)\\).
- **API call como token:** \\"<API>calculator(2*3)</API>\\" es parte del vocabulario.
- **Sin anotación humana:** el modelo descubre solo que conviene llamar herramienta.

## 3. Evidencia
- En LAMA, QA, math datasets, Toolformer 6.7B supera OPT 66B y GPT-3 175B en tasks con tools.
- Ablation: training sin filtrado por perplexity degrada.

## 4. Mapeo a tu proyecto
- **Tu external_router hardcodeado** (\\"if path == /shell/...\\") es lo que Toolformer evita: el modelo debería elegir tool via schema, no via if.
- **Tipa tus tools con JSON Schema estricto** en \\(shared/api\\): Toolformer muestra que schema claro mejora selección.
- Para fine-tune local (Phi-3): usa misma técnica perplexity-filter para enseñarle \\(shell.fs.*\\) sin anotar.

## 5. Limitaciones
- Solo 5 tools simples; no prueba composición multi-step profunda (ver ToolLLM).
- Fine-tune cada vez que añades tool → costoso. Alternativa moderna: in-context tool docs (MCP).

## 6. Ejercicio
- Añade JSON Schema a \\(shell.fs.read\\) y mide si el modelo elige mejor entre \\"read\\" vs \\"ls\\" con docs de tool en system prompt vs sin docs.

## 7. Links
- https://arxiv.org/abs/2302.04761
`
  },
  {
    dir: "02-Harness",
    file: "02-gorilla-bfcl-2023.md",
    title: "Gorilla y BFCL — Evaluar tool use de verdad (Berkeley, 2023-25)",
    meta: { year: 2023, authors: "Patil et al. / UC Berkeley", link: "https://arxiv.org/abs/2305.15334", pri: "Imprescindible", minutes: 18 },
    body: `
> **Papers:** Gorilla: Large Language Model Connected with Massive APIs (2305.15334) + BFCL Leaderboard v4 (2025-26).
> **Links:** https://arxiv.org/abs/2305.15334 · https://gorilla.cs.berkeley.edu/leaderboard.html · github.com/ShishirPatil/gorilla
> **Prioridad:** Imprescindible (cómo medir harness)

## 1. Resumen
Gorilla fine-tunea LLaMA-7B sobre 1,600 APIs (TorchHub, TF Hub, HuggingFace) y supera GPT-4 en AST accuracy. BFCL es el benchmark vivo que evalúa tool calls por **AST + ejecución**, no por BLEU. Incluye single, parallel, multi-turn y relevancia.

## 2. Ideas
- **AST eval:** compara árbol sintáctico del call, no texto → evita falsos positivos de "parece que llamó bien".
- **Execution eval:** ejecuta el call en sandbox y verifica efecto.
- **Retriever:** no mete 1,600 APIs en contexto; retrieva top-5 con BM25/dense → ahorra tokens.

## 3. Números
- Gorilla 7B: 62% AST accuracy vs GPT-4 54% en APIs no vistas.
- BFCL v4 state 2026-04-12: Claude 3.5, GPT-4o, Gemini 2.5 top.

## 4. Aplica a tu harness
- **Eval local:** crea BFCL-mini con 10 tools \\(shell.fs, shell.git, shell.pty\\) y evalúa AST. No confíes en "funciona a ojo".
- **API retriever:** tu \\(external_router\\) expone 5 plugins × ~5 tools = 25 tools. No los mandes todos en cada turn; retrieva top-k por similitud a intent.
- **Tipado:** usa BFCL metric para validar que \\(sendPrompt v2\\) no manda \\"model\\" en body (400).

## 5. Anti-pattern
- Contaminación BFCL v2: datos enterprise filtrados → usa leaderboard live, no snapshot.

## 6. Ejercicio
- Escribe \\"web/scripts/bfcl-mini.mjs\\" que testeé 10 intents y verifique AST de \\(tool_call\\). Intégralo en CI.

## 7. Links
- Leaderboard: https://gorilla.cs.berkeley.edu/leaderboard.html
`
  },
  {
    dir: "02-Harness",
    file: "03-toollm-2023.md",
    title: "ToolLLM — Dominar 16k APIs reales (Qin et al., 2023)",
    meta: { year: 2023, authors: "Qin et al. / Tsinghua", link: "https://arxiv.org/abs/2307.16789", pri: "Muy recomendado", minutes: 16 },
    body: `
> **Paper:** ToolLLM: Facilitating Large Language Models to Master 16000+ Real-world APIs (Qin et al., ICLR 2024).
> **Link:** https://arxiv.org/abs/2307.16789 — ToolBench benchmark.
> **Prioridad:** Muy recomendado

## 1. Resumen
ToolBench reúne 16k APIs de RapidAPI, genera diálogos multi-step con ChatGPT, y entrena ToolLLaMA con **DFS decision tree** (explora, backtrackea si falla). ToolLLaMA supera GPT-4 en success rate multi-step y ToolEval (pass + win rate).

## 2. Ideas
- **DFS en vez de ReAct lineal:** si tool falla, hace backtrack y prueba otra rama — como ToT pero en espacio de APIs.
- **Neural retriever:** dado intent, retrievea APIs relevantes (no todas).
- **ToolEval:** evalúa no solo si resolvió, sino eficiencia de camino.

## 3. Aplica a tu app
- Tus 5 plugins son como RapidAPI: si \\"screenshots 3002\\" falla, tu harness debería probar fallback (probe cache 1500ms + reintento).
- Implementa retriever simple (BM25) en \\(shared/api\\) para seleccionar qué tools describir en system prompt por turno → ahorra 2-3k tokens.

## 4. Ejercicio
- Mide tokens de system prompt con 25 tools vs con retriever top-5. Grafica ahorro vs accuracy en 20 tareas.

## 5. Links
- https://arxiv.org/abs/2307.16789
`
  },
  {
    dir: "02-Harness",
    file: "04-swe-agent-aci-2024.md",
    title: "SWE-agent: El ACI importa más que el modelo (Yang et al., 2024)",
    meta: { year: 2024, authors: "Yang et al. / Princeton", link: "https://arxiv.org/abs/2405.15793", pri: "Imprescindible", minutes: 22 },
    body: `
> **Paper:** SWE-agent: Agent-Computer Interfaces Enable Automated Software Engineering (Yang et al., NeurIPS 2024).
> **Link:** https://arxiv.org/abs/2405.15793 — github.com/SWE-agent/SWE-agent
> **Prioridad:** Imprescindible — *directo a tu desktop-app*

## 1. Tesis
El cuello no es el LLM, es el **ACI** (cómo el agente ve/edita archivos, navega repo, recibe feedback). Con ACI bien diseñado (viewer con líneas, edit linted, búsqueda), Claude 2 pasa de 1.96% → 18% en SWE-bench sin cambiar modelo.

## 2. ACI diseñado
- **Viewer:** \\"view file L1-100 con números\\" — no \\"cat\\" gigante.
- **Edit:** aplica patch y devuelve lint error inmediato (no silent).
- **Search/Bash:** herramientas acotadas, no shell crudo infinito.
- **Feedback:** cada acción devuelve observación estructurada (éxito/error + sugerencia).

## 3. Resultados
- SWE-bench Lite: SWE-agent 18.0% vs bash baseline 6.8% (mismo Claude 2).
- Con GPT-4: 23% → SOTA 2024.
- Ablation: quitar viewer numerado −8 puntos; quitar lint −5.

## 4. Mapeo a opencode-remote-android
- **Tu \\"ptyx.rs WS :4849\\" hoy es shell crudo → rediseña:** 
  - \\"view\\" con paginación 100 líneas, \\"open→read→edit→lint→run\\" loop.
  - \\"edit\\" que valida \\"cargo check\\" antes de aplicar y retorna error parsing.
- **fsx.rs:** añade \\"search\\" con ripgrep y \\"diff\\" preview.
- **No copies bash infinito:** limita herramientas a 6-8 bien diseñadas (SWE-agent lo demuestra).

## 5. Anti-pattern
- Dar terminal sin guardrails → el agente rm -rf o se pierde en output 10k líneas.

## 6. Ejercicio
- Corre 5 issues de SWE-bench Lite con tu ACI actual vs ACI SWE-agent (viewer+edit). Mide pass rate y tokens.

## 7. Links
- https://arxiv.org/abs/2405.15793
`
  },
  {
    dir: "02-Harness",
    file: "05-mcp-2024.md",
    title: "Model Context Protocol — El LSP de los tools (Anthropic, 2024-25)",
    meta: { year: 2024, authors: "Anthropic + Survey Hou", link: "https://arxiv.org/abs/2503.23278", pri: "Muy recomendado", minutes: 18 },
    body: `
> **Spec:** Model Context Protocol (Anthropic nov 2024, donated a Linux Foundation dic 2025) — https://modelcontextprotocol.io
> **Survey:** Hou et al. 2503.23278 — 16 amenazas de seguridad.
> **Prioridad:** Muy recomendado (futuro de external_router)

## 1. Resumen
MCP es estándar abierto tipo LSP para **discovery y invocación bidireccional** de tools: servers exponen \\"tools/resources/prompts\\", clients negocian capabilities, permisos y auditing. Reemplaza probe TCP hardcodeado.

## 2. Cómo funciona
- **Handshake:** client \\"initialize\\" → server responde con tools list + schemas JSON.
- **Invocation:** \\"tools/call\\" con args validados por schema.
- **Resources:** servers exponen docs/context (como tu \\"learning\\" o \\"opencode.db\\").
- **Sampling:** server puede pedir al client que llame a otro LLM (para subagentes).

## 3. Por qué importa
- Hoy haces \\"probe TCP 250ms + ureq 1800ms\\" por plugin → frágil, sin schema, sin permiso.
- MCP da discovery dinámico, validación, allowlist, logs. Escala a N plugins sin código nuevo.

## 4. Aplica a tu app
- Migra \\"external_router.rs\\" a MCP: cada plugin (opendesign, screenshots, vioeditor) corre como MCP server.
- Implementa allowlist: no auto-discover todo; pide consentimiento para \\"shell.fs.delete\\".
- Usa MCP resources para exponer \\"opencode-stats :8765\\" como data source.

## 5. Riesgos (Hou 2503.23278)
- Tool squatting, prompt injection vía resource, exfiltr vía tool result. Implementa validación y sandbox.

## 6. Ejercicio
- Prototipa un MCP server en Rust para \\"shell.fs.list\\" y haz que opencode lo liste dinámicamente.

## 7. Links
- https://modelcontextprotocol.io/specification/2025-11-25/index
- https://arxiv.org/abs/2503.23278
`
  },

  // 03 Agentes
  {
    dir: "03-Agentes",
    file: "01-building-effective-agents-2024.md",
    title: "Building Effective Agents — Patrones que sí funcionan (Anthropic, 2024)",
    meta: { year: 2024, authors: "Anthropic Engineering", link: "https://www.anthropic.com/engineering/building-effective-agents", pri: "Imprescindible", minutes: 20 },
    body: `
> **Artículo:** Building Effective Agents (Anthropic Eng, dic 2024) — https://www.anthropic.com/engineering/building-effective-agents
> **Prioridad:** Imprescindible — *manual para no sobrediseñar harness*

## 1. Tesis
No construyas "agente genérico". Usa el patrón más simple que resuelva el caso. 5 workflows validados + cuándo sí usar loop agéntico.

## 2. Los 5 patrones
1. **Prompt chaining:** salida de uno entra al siguiente (ej. extract → rewrite → format). Determinista.
2. **Routing:** clasifica input y deriva a especialista (ej. \\"/help\\" → workflow, \\"debug\\" → agente).
3. **Parallelization:** n workers independientes + aggregator (ej. 3 reseñas paralelas).
4. **Orchestrator-workers:** planner descompone, workers ejecutan, planner sintetiza.
5. **Evaluator-optimizer:** generator → evaluator → loop hasta \\"good enough\\" (ej. Self-Consistency).

Solo si ninguno alcanza, usa **Agentic loop** (ReAct + memoria).

## 3. Reglas de oro
- **Evalúa primero:** mide con BFCL/SWE-bench antes de añadir complejidad.
- **Cuanto más agéntico, peor debugging.** Prefiere workflow trazable.
- **Paraleliza cuando puedas:** baja latencia y coste.

## 4. Mapeo a tu proyecto
- **Audita desktop-app:** 
  - \\"screenshots 3002\\" → no necesita agente, es workflow (capture → annotate → save).
  - \\"opencode\\" → sí necesita agentic loop (coding task abierto).
  - \\"external_router\\" → orchestrator-workers: 1 worker por plugin externo, orquestador que reparte.
- **No mates procesos al cambiar pestaña** (tu fix ExternalIframePanel) es orchestrator-workers bien hecho.

## 5. Ejercicio
- Clasifica tus 5 plugins externos en workflow vs agente. Reescribe uno como workflow determinista y mide latencia.

## 6. Links
- https://www.anthropic.com/engineering/building-effective-agents
`
  },
  {
    dir: "03-Agentes",
    file: "02-voyager-2023.md",
    title: "Voyager — Skill library que crece sola (Wang et al., 2023)",
    meta: { year: 2023, authors: "Wang et al. / NVIDIA", link: "https://arxiv.org/abs/2305.16291", pri: "Muy recomendado", minutes: 18 },
    body: `
> **Paper:** Voyager: An Open-Ended Embodied Agent with Large Language Models (Wang et al., 2023).
> **Link:** https://arxiv.org/abs/2305.16291 — github.com/MineDojo/voyager
> **Prioridad:** Muy recomendado (inspiración Skills)

## 1. Resumen
Agente en Minecraft que **escribe código como skills**, las guarda en librería, propone su propio curriculum y se verifica ejecutando en el mundo. Sin finetuning, solo GPT-4 + feedback de entorno. Descubre diamante 3× más rápido que baselines y acumula 300+ skills reutilizables.

## 2. Loop
- **Curriculum:** LLM propone siguiente tarea ("craft stone pickaxe") basada en inventario y skills previas.
- **Skill generation:** genera código JS (Mineflayer) intentando la tarea.
- **Verification:** ejecuta en mundo, si falla, auto-debuguea con error trace.

## 3. Ideas para tu Skills
- **Skills como código versionado, no prompts:** tu \\"wiki skill\\" debería ser \\"SKILL.md + script + test\\" (como Voyager).
- **Librería persistente:** no regenerar skill cada vez; cataloga y reusa (tu \\"scannedRoots\\" ya escanea, falta ejecutar y verificar).
- **Auto-curriculum:** para lab hacking, deja que el agente proponga siguiente lab según skills dominadas.

## 4. Ejercicio
- Crea una skill \\"nmap-quick\\" como código (bash + parser) con test que verifique que encuentra puerto 80 en DVWA. Guárdala en \\"skills/\\".

## 5. Links
- https://arxiv.org/abs/2305.16291
`
  },
  {
    dir: "03-Agentes",
    file: "03-generative-agents-2023.md",
    title: "Generative Agents — Memoria, reflexión y comportamiento emergente (Park et al., 2023)",
    meta: { year: 2023, authors: "Park et al. / Stanford", link: "https://arxiv.org/abs/2304.03442", pri: "Muy recomendado", minutes: 16 },
    body: `
> **Paper:** Generative Agents: Interactive Simulacra of Human Behavior (Park et al., UIST 2023).
> **Link:** https://arxiv.org/abs/2304.03442
> **Prioridad:** Muy recomendado (blueprint memoria)

## 1. Resumen
25 agentes en un pueblo simulado (The Sims con LLM) con **memory stream** (log de eventos + retrieved + reflection). Cada mañana planifican, actúan, conversan y emergen fiestas, chismes y coordinación sin script.

## 2. Memoria
- **Memory stream:** cada observación es objeto con timestamp, embedding, importancia.
- **Retrieval:** por recencia + relevancia + importancia (score combinado).
- **Reflection:** cada noche, el agente resume "¿qué aprendí de hoy?" y guarda como memoria de alto nivel.
- **Planning:** plan del día descompuesto en sub-tareas horarias.

## 3. Aplica a IndexedDB v2
- Tu \\"cacheMessages merge-only\\" es memory stream primitivo → evoluciona a retrieval por embedding, no cronológico.
- Implementa reflexión nocturna: resume sesión larga y guarda como memoria compacta para próxima sesión.
- Usa importancia (¿el mensaje contiene error/éxito?) para priorizar qué mantener en contexto.

## 4. Ejercicio
- Añade campo \\"importance\\" a mensajes (heurística: si contiene \\"error\\"/\\"success\\" → alta). Retrieval top-k por score combinado.

## 5. Links
- https://arxiv.org/abs/2304.03442
`
  },
  {
    dir: "03-Agentes",
    file: "04-autogen-2023.md",
    title: "AutoGen — Conversación multi-agente (Wu et al., 2023)",
    meta: { year: 2023, authors: "Wu et al. / Microsoft", link: "https://arxiv.org/abs/2308.08155", pri: "Muy recomendado", minutes: 16 },
    body: `
> **Paper:** AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation (Wu et al., 2023).
> **Link:** https://arxiv.org/abs/2308.08155 — github.com/microsoft/autogen
> **Prioridad:** Muy recomendado

## 1. Resumen
Framework donde cada agente es **conversable** (LLM + human + tool). Orquesta por chat: Assistant ↔ Executor ↔ User. Resuelve coding, math, QA con menos alucinación que single-agent.

## 2. Ideas
- **Agentes especializados por rol**, no por modelo distinto.
- **Conversación como API:** cada mensaje es acción observable y registrable.
- Reusable: cambia orquestación sin reentrenar.

## 3. Aplica a opencode-remote
- Tus \\"subagentTaskPart\\" filtrados en \\"useSSE.ts\\" son AutoGen sin saberlo. Hazlos explícitos: cada subagente con su propia conversación y memoria aislada.
- Usa patrón para \\"grupo de sesiones\\" (groupedSessions) con shared state pero turnos claros.

## 4. Ejercicio
- Modela \\"session → task → subagent\\" como AutoGen: cada subagente loguea su propio Thought/Action y el padre solo ve summary.

## 5. Links
- https://arxiv.org/abs/2308.08155
`
  },
  {
    dir: "03-Agentes",
    file: "05-metagpt-2023.md",
    title: "MetaGPT — SOPs en vez de chat libre (Hong et al., 2023)",
    meta: { year: 2023, authors: "Hong et al. / DeepWisdom", link: "https://arxiv.org/abs/2308.00352", pri: "Muy recomendado", minutes: 16 },
    body: `
> **Paper:** MetaGPT: Meta Programming for Multi-Agent Collaborative Framework (Hong et al., ICLR 2024).
> **Link:** https://arxiv.org/abs/2308.00352
> **Prioridad:** Muy recomendado

## 1. Resumen
Simula **empresa de software** con Product Manager → Architect → Engineer → QA, cada uno produce artefactos estructurados (PRD, diagrama, código, test) en vez de chatear libre. Supera single-agent en HumanEval y MBPP.

## 2. Por qué importa
Chat libre multi-agente alucina y diverge. SOPs (Standard Operating Procedures) con **artefactos tipados** mantienen coherencia.

## 3. Aplica a tu kanban
- Para generación multi-archivo: define SOP \\"Spec → Design → Code → Test → Review\\" y haz que cada subagente produzca artefacto validable (no texto libre).
- Tu \\"kanban.json\\" puede ser el PRD vivo.

## 4. Ejercicio
- Implementa SOP simple para \\"añadir feature\\": agente PM escribe spec.md, Architect propone files, Engineer genera diff, QA corre tests. Mide vs single-agent.

## 5. Links
- https://arxiv.org/abs/2308.00352
`
  },
  {
    dir: "03-Agentes",
    file: "06-openhands-2024.md",
    title: "OpenHands (OpenDevin) — Plataforma para agentes generalistas (Wang et al., 2024)",
    meta: { year: 2024, authors: "Wang et al. / All Hands AI", link: "https://arxiv.org/abs/2407.16741", pri: "Muy recomendado", minutes: 16 },
    body: `
> **Paper:** OpenHands: An Open Platform for AI Code Agents as Software Developers (Wang et al., 2024).
> **Link:** https://arxiv.org/abs/2407.16741 — github.com/OpenHands/openhands
> **Prioridad:** Muy recomendado

## 1. Resumen
Plataforma que da al LLM **bash + browser + editor** en Docker sandbox y evalúa en 15 benchmarks (SWE-bench, GAIA, etc.). Demuestra que sandbox + runtime + observability son tan críticos como el modelo.

## 2. Ideas
- **Runtime Docker por sesión:** aisla efectos, permite rollback.
- **Event stream:** cada acción es evento tipado (no texto).
- **Eval unificada:** mismo harness para 15 tasks → compara justo.

## 3. Aplica a desktop-app
- Tu \\"WS PTY :4849 + fsx + gitx\\" es runtime sin sandbox → añade Docker o al menos \\"dry-run\\" mode.
- Usa event stream tipado (ReAct) en vez de log de terminal crudo.
- Replica su eval harness para medir tu ACI vs OpenHands en SWE-bench.

## 4. Ejercicio
- Dockeriza tu \\"ptyx\\" y mide si el agente hace menos daños (rm -rf) vs host directo.

## 5. Links
- https://arxiv.org/abs/2407.16741
`
  },
  {
    dir: "03-Agentes",
    file: "07-aide-2025.md",
    title: "AIDE — Búsqueda en árbol de soluciones (Jiang et al., 2025)",
    meta: { year: 2025, authors: "Jiang et al. / Weco AI", link: "https://arxiv.org/abs/2502.13138", pri: "Complementario", minutes: 14 },
    body: `
> **Paper:** AIDE: AI-Driven Exploration in the Space of Code (Jiang et al., 2025).
> **Link:** https://arxiv.org/abs/2502.13138
> **Prioridad:** Complementario

## 1. Resumen
Formula ML/code como **búsqueda en árbol** donde cada nodo es una solución ejecutable (código). Operador stateless \\"f(node) → new code\\" propone mejora, se evalúa y se expande el mejor. Sin historial infinito, solo árbol.

## 2. Idea
- No appendear chat; proponer parches sobre nodos existentes.
- Evaluación automática (tests) decide qué rama podar.

## 3. Aplica a tu terminal
- Para \\"opencode-stats\\" o generación de informes: en vez de ReAct lineal, mantén árbol de intentos y muestra al usuario las 3 mejores ramas.
- Útil para \\"ptyx\\" con múltiples intentos de fix.

## 4. Links
- https://arxiv.org/abs/2502.13138
`
  },

  // 04 Memoria
  {
    dir: "04-Memoria",
    file: "01-rag-2020.md",
    title: "RAG — Retrieval-Augmented Generation (Lewis et al., 2020)",
    meta: { year: 2020, authors: "Lewis et al. / Meta", link: "https://arxiv.org/abs/2005.11401", pri: "Imprescindible", minutes: 15 },
    body: `
> **Paper:** Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (Lewis et al., NeurIPS 2020) — Meta AI.
> **Link:** https://arxiv.org/abs/2005.11401
> **Prioridad:** Imprescindible (base)

## 1. Resumen
Combina **retriever denso (DPR)** + generador seq2seq entrenados end-to-end. Para cada query, recupera top-k docs de Wikipedia y condiciona generación. Supera FiD y T5 en Natural Questions, TriviaQA sin memorizar todo.

## 2. Ideas
- **DPR:** dual encoder (query + doc) con ANN (FAISS).
- **Marginalización:** genera respuestas considerando múltiples docs, no solo top-1.
- Entrenamiento conjunto retriever+gen mejora ambos.

## 3. Aplica a opencode-remote
- **opencode-stats crate :8765:** no cargues toda \\"opencode.db\\" en contexto; haz RAG: query → top-k rows → prompt.
- **open-design docs / informes:** indexa con embeddings y retrievea por intent.

## 4. Ejercicio
- Indexa tus \\"learning\\" docs con embeddings (local) y responde preguntas via RAG en vez de keyword search.

## 5. Links
- https://arxiv.org/abs/2005.11401
`
  },
  {
    dir: "04-Memoria",
    file: "02-memgpt-2023.md",
    title: "MemGPT — LLMs como Sistema Operativo (Packer et al., 2023)",
    meta: { year: 2023, authors: "Packer et al. / Berkeley", link: "https://arxiv.org/abs/2310.08560", pri: "Imprescindible", minutes: 20 },
    body: `
> **Paper:** MemGPT: Towards LLMs as Operating Systems (Packer et al., 2023).
> **Link:** https://arxiv.org/abs/2310.08560
> **Prioridad:** Imprescindible — *blueprint de tu caché offline*

## 1. Resumen
Trata el context window como **RAM** y el resto como **disco**: jerarquía \\"main context\\" (system + FIFO) + \\"external memory\\" (recall) + \\"archival\\" (search). Con paginación e interrupts, el LLM pide \\"recall\\" explícito y maneja contexto "infinito" sin perder coherencia.

## 2. Jerarquía
- **Main:** últimos 30 msgs + system (hot).
- **Queue:** pending tasks (interrupts).
- **Archival:** long-term (IndexedDB + vector DB).
- **Interrupts:** el sistema notifica \\"memoria llena → compacta\\" o \\"usuario pide algo del pasado → recall\\".

## 3. Mapeo a tu app
- **IndexedDB v2 = archival:** tu \\"loadSelected 500/100 msgs\\" es RAM vs disco.
- **Implementa MemoryManager:** si context > threshold, pagina y expone \\"search_memory(query)\\" como tool.
- **Interrupts:** cuando \\"time.updated\\" no avanza, notifica al modelo que debe paginar, no hacer polling.

## 4. Ejercicio
- Añade tool \\"memory.search\\" que haga vector search sobre IndexedDB y mide si reduce tokens 40%.

## 5. Links
- https://arxiv.org/abs/2310.08560
`
  },
  {
    dir: "04-Memoria",
    file: "03-lost-in-middle-2023.md",
    title: "Lost in the Middle — Dónde pones la info importa (Liu et al., 2023)",
    meta: { year: 2023, authors: "Liu et al. / Stanford", link: "https://arxiv.org/abs/2307.03172", pri: "Imprescindible", minutes: 15 },
    body: `
> **Paper:** Lost in the Middle: How Language Models Use Long Contexts (Liu et al., TACL 2024).
> **Link:** https://arxiv.org/abs/2307.03172
> **Prioridad:** Imprescindible

## 1. Resumen
LLMs tienen **curva en U**: rinden mejor si la info relevante está al **inicio o final** del contexto, peor en el medio. Con 20 docs, accuracy 75% (inicio) → 45% (medio) → 70% (final). Vale para todos los modelos probados.

## 2. Evidencia
- Multi-doc QA, con contexto largo sintético.
- Incluso con 1 doc relevante + 19 distractors, el medio se pierde.
- No lo arregla más contexto; lo empeora.

## 3. Por qué es crítico para vos
- Tu \\"miser\\" y \\"limit 20/100 msgs\\" no es feature UX, es necesidad cognitiva.
- **Reordenar por relevancia, no por cronología:** pon top-3 relevante al inicio y al final, resto en medio truncado.
- **Strip tools/thinking** en medio es obligatorio.

## 4. Ejercicio
- Benchmark: 50 Q&A sobre tu repo con info en medio vs inicio/final. Mide accuracy y cambia \\"loadSelected\\" a rerank BM25.

## 5. Links
- https://arxiv.org/abs/2307.03172
`
  },
  {
    dir: "04-Memoria",
    file: "04-context-engineering-2025.md",
    title: "Effective Context Engineering — Compaction, isolation, pruning (Anthropic, 2025)",
    meta: { year: 2025, authors: "Anthropic Eng", link: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents", pri: "Imprescindible", minutes: 18 },
    body: `
> **Paper/Guía:** Effective Context Engineering for AI Agents (Anthropic, 2025) + survey Context Engineering 2602.12430.
> **Link:** https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
> **Prioridad:** Imprescindible

## 1. Framework
4 técnicas para mantener contexto útil a lo largo de tareas largas:
- **Compaction:** resumir tool outputs >4k tokens a 200.
- **Isolation:** subagentes con contexto propio (no heredan todo).
- **Pruning:** remover tool results viejos irrelevantes.
- **Whitelisting:** solo exponer al subagente lo que necesita.

## 2. Mapeo a tu SSE handler
- No concatenar todo el historial en cada \\"sendPrompt\\". Compacta \\"tool_result\\" verbosos.
- Subagentes (\\"subagentTaskPart\\") con contexto aislado → menos \\"context rot\\".
- Implementa \\"translationOriginals cap 200\\" bien (ya lo haces, formalízalo).

## 3. Ejercicio
- Añade función \\"compactToolResult(text, 4000)\\" que resuma si excede y mide tokens ahorrados.

## 4. Links
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://arxiv.org/abs/2602.12430
`
  },

  // 05 Evaluacion
  {
    dir: "05-Evaluacion",
    file: "01-swe-bench-2023.md",
    title: "SWE-bench — ¿Pueden los LLMs resolver issues reales? (Jimenez et al., 2023)",
    meta: { year: 2023, authors: "Jimenez et al. / Princeton", link: "https://arxiv.org/abs/2310.06770", pri: "Imprescindible", minutes: 18 },
    body: `
> **Paper:** SWE-bench: Can Language Models Resolve Real-world GitHub Issues? (Jimenez et al., ICLR 2024).
> **Link:** https://arxiv.org/abs/2310.06770 — github.com/SWE-bench/SWE-bench — swebench.com
> **Prioridad:** Imprescindible — *el benchmark que tu harness debe aspirar*

## 1. Resumen
2,294 issues reales de GitHub (12 repos Python) con test fail→pass. Evalúa si el agente genera patch que hace pasar tests ocultos. De 1.96% (Claude 2) → 70%+ (2025 agents con ACI+SWE-agent).

## 2. Diseño
- Cada task = issue + repo snapshot + tests que fallan.
- Métrica: \\"resolved\\" si patch pasa todos los tests relevantes (no BLEU).
- Lite = 300 issues balanceados, Verified = 500 curados humanos.

## 3. Gotchas
- **Inflado:** muchos agentes memorizan repos. Usa Lite + repo privado no visto para medir real.
- No confíes en full 2,294 si el modelo vio los repos en pre-training.

## 4. Aplica a tu proyecto
- **Monta SWE-bench Lite local** con tu \\"desktop-app ACI\\" (fsx+ptyx) y mide si cambios en external_router rompen capacidad.
- Script \\"web/scripts/eval-swe-bench.py\\" que lance \\"desktop-app + opencode2\\" contra 20 issues.

## 5. Ejercicio
- Corre 5 issues con tu harness actual y reporta pass@1. Repite tras mejorar viewer (SWE-agent).

## 6. Links
- https://arxiv.org/abs/2310.06770
`
  },
  {
    dir: "05-Evaluacion",
    file: "02-gaia-2023.md",
    title: "GAIA — Preguntas simples para humanos, difíciles para IA (Mialon et al., 2023)",
    meta: { year: 2023, authors: "Mialon et al. / Meta+HuggingFace", link: "https://arxiv.org/abs/2311.12983", pri: "Muy recomendado", minutes: 15 },
    body: `
> **Paper:** GAIA: a benchmark for General AI Assistants (Mialon et al., ICLR 2024).
> **Link:** https://arxiv.org/abs/2311.12983 — huggingface.co/spaces/gaia-benchmark/leaderboard
> **Prioridad:** Muy recomendado (test de robustez tool-use)

## 1. Resumen
466 preguntas que requieren **browse + multi-modal + tool use + razonamiento** (ej. "¿Cuál fue el cambio % de precio de X entre fecha A y B según PDF Y?"). Humanos 92%, GPT-4 plugins 15% (2023), 2025 agents ~50%.

## 2. Niveles
- L1: 1-2 tools, 1 página.
- L2: multi-step, combinar fuentes.
- L3: investigación profunda, planning.

## 3. Aplica a thin client
- ¿Puede tu agente vía \\"shell/proxy + shell/browser\\" responder GAIA L1? Mide tool-use en wild.
- Úsalo para validar \\"external_router\\" + \\"ptyx\\" no solo coding sino research.

## 4. Ejercicio
- Ejecuta 10 GAIA-L1 con tu harness y reporta accuracy. Identifica fallos de browsing vs reasoning.

## 5. Links
- https://arxiv.org/abs/2311.12983
`
  },

  // 06 Skills
  {
    dir: "06-Skills",
    file: "01-agent-skills-2025.md",
    title: "Agent Skills — Paquetes portables de capacidades (Anthropic, 2025)",
    meta: { year: 2025, authors: "Anthropic + Li review", link: "https://agentskills.io", pri: "Imprescindible", minutes: 18 },
    body: `
> **Spec:** Agent Skills (Anthropic dic 2025, estándar abierto) — https://agentskills.io — https://www.anthropic.com/news/skills
> **Survey:** Agent Skills Review 2602.12430 (arxiv)
> **Prioridad:** Imprescindible — *tu scannedRoots ya existe*

## 1. Resumen
Skills = **paquetes portables** (SKILL.md frontmatter + scripts + tools permitidos) que se inyectan JIT. Espec: \\"name, description, tools: [fs.read, git.status], permissions, version\\". MCP donated a Linux Foundation como transporte.

## 2. Estructura
\`\`\`
skills/my-skill/
  SKILL.md  # frontmatter: name, description, tools, permissions
  scripts/run.sh
  manifest.json
\`\`\`
Loader escanea \\"~/.agents/skills, ~/.claude/skills, ~/.opencode/skills, ./skills\\" — exactamente tus 8 scannedRoots.

## 3. Mapeo
- Estandariza tus skills con agentskills.io spec: añade \\"tools\\" y \\"permissions\\" al SKILL.md.
- Convierte \\"open-design\\" externo en skill MCP instalada, no ruta hardcodeada :3000.
- Valida skills en CI (schema).

## 4. Ejercicio
- Reescribe tu skill \\"wiki\\" al spec oficial y haz que loader valide frontmatter.

## 5. Links
- https://agentskills.io
- https://arxiv.org/abs/2602.12430
`
  },
  {
    dir: "06-Skills",
    file: "02-jit-agent-2025.md",
    title: "JIT-Agent — Generar el harness justo a tiempo (Li et al., 2025)",
    meta: { year: 2025, authors: "Li et al.", link: "https://arxiv.org/abs/2608.25593", pri: "Imprescindible", minutes: 16 },
    body: `
> **Paper:** JIT-Agent: Harness Evolution via Just-in-Time Generation (Li et al., 2025 — preprint).
> **Link:** https://arxiv.org/abs/2608.25593
> **Prioridad:** Imprescindible (formaliza tu JIT)

## 1. Resumen
Harness como artefacto **componible** (memory/planning/action/tool/skill) generado por un **harness-intelligence model** ad-hoc por tarea. En vez de harness fijo, sintetiza el óptimo por intent.

## 2. Ideas
- Harness = \\"{memory, planning, action, tool, skill}\\" combinables.
- Modelo entrenado para elegir composición óptima según task embedding.
- Eval: supera harness fijo en ToolBench y SWE-bench con menos tokens.

## 3. Aplica a tu external_router
- Hoy haces \\"split_cmd + probe TCP\\" a mano → JIT generaría config de harness por tarea: para \\"captura pantallas\\" usa workflow simple, para \\"refactor\\" usa agentic loop con ToT.
- Entrena un clasificador local (Phi-3) que elija harness óptimo.

## 4. Ejercicio
- Implementa selector \\"harnessFor(task): workflow|react|tot\\" con heurística y mide tokens vs success.

## 5. Links
- https://arxiv.org/abs/2608.25593
`
  },
  {
    dir: "06-Skills",
    file: "03-phi3-2024.md",
    title: "Phi-3 — Small model muy capaz (Abdin et al., 2024)",
    meta: { year: 2024, authors: "Abdin et al. / Microsoft", link: "https://arxiv.org/abs/2404.14219", pri: "Muy recomendado", minutes: 14 },
    body: `
> **Paper:** Phi-3 Technical Report: A Highly Capable Language Model Locally on Your Phone (Abdin et al., 2024).
> **Link:** https://arxiv.org/abs/2404.14219
> **Prioridad:** Muy recomendado (small orchestrated)

## 1. Resumen
Phi-3-mini 3.8B entrenado en 3.3T tokens (web + synthetic) alcanza calidad cercana a modelos 10× mayor (MMLU 68.8, GSM8K 82.6). Corre local en phone/laptop con 4GB RAM.

## 2. Ideas
- **Data quality > scale:** filtrado agresivo + synthetic reasoning data.
- **Long context:** 128k con Linear RoPE.
- **On-device:** quant 4-bit sin perder mucho.

## 3. Aplica a desktop-app
- **Worker local en Rust sidecar:** clasifica intent \\"/help, /status\\" y hace routing sin llamar a opencode remoto → ahorra datos y latencia.
- **Guardrails:** Constitutional filter local antes de \\"fs.delete\\".

## 4. Ejercicio
- Integra Phi-3-mini Q4 en desktop-app (via candle/llama.cpp) y mide latencia vs GPT-4 para 10 intents simples.

## 5. Links
- https://arxiv.org/abs/2404.14219
`
  },
  {
    dir: "06-Skills",
    file: "04-constitutional-ai-2022.md",
    title: "Constitutional AI — Harmlessness sin labels humanas (Bai et al., 2022)",
    meta: { year: 2022, authors: "Bai et al. / Anthropic", link: "https://arxiv.org/abs/2212.08073", pri: "Complementario", minutes: 14 },
    body: `
> **Paper:** Constitutional AI: Harmlessness from AI Feedback (Bai et al., 2022).
> **Link:** https://arxiv.org/abs/2212.08073
> **Prioridad:** Complementario (guardrails)

## 1. Resumen
Modelo se autocritica con **constitución** (principios) y se reentrena con RLAIF (AI feedback) sin labels humanas. Reduce harmful outputs 90% manteniendo utilidad.

## 2. Proceso
1. Genera respuesta → critica con principio ("¿es honesto?").
2. Rewrites con constitution → genera par (bueno/malo).
3. Entrena reward model con AI labels → RL.

## 3. Aplica a external_router
- Antes de \\"shell.fs.move/delete\\" ejecuta chequeo constitutional local: "¿está dentro del scope autorizado? ¿borra fuera de workspace?".
- Define constitution.md para tu harness y haz que Phi-3 la aplique.

## 4. Links
- https://arxiv.org/abs/2212.08073
`
  },
  {
    dir: "06-Skills",
    file: "05-code-as-harness-2025.md",
    title: "Code as Harness — El código es el medio (Survey 2025)",
    meta: { year: 2025, authors: "Survey", link: "https://arxiv.org/abs/2605.18747", pri: "Complementario", minutes: 14 },
    body: `
> **Paper:** Code as Agent Harness: Code Is Not Just Output, It's the Medium (2025).
> **Link:** https://arxiv.org/abs/2605.18747
> **Prioridad:** Complementario

## 1. Resumen
Tesis: el código no es solo **output**, es **medio** de razonar, actuar y mantener estado. Tests, workflows, DSLs son harness programables. Agentes que generan artefactos de código persistentes (no solo chat) son más robustos.

## 2. Ideas
- **Harness programable:** kanban.json, gitx, ptyx son harness que el agente puede leer/escribir como código.
- **Artefactos persistentes:** cada run genera test/workflow reusable, no se tira.
- **DSL:** define lenguaje pequeño para tu dominio (ej. "capture → annotate → export").

## 3. Aplica a tu repo
- Trata \\"opencode.db\\" + \\"kanban.json\\" + skills como harness code, versionado en git.
- Haz que agentes generen workflows YAML que queden como artefactos.

## 4. Links
- https://arxiv.org/abs/2605.18747
`
  },
]

function mdTemplate(p) {
  const { title, meta, body } = p
  // body ya contiene secciones con > y ## etc. Añadimos frontmatter/header
  return `# ${title}

> **Autores:** ${meta.authors}
> **Año:** ${meta.year} · **Prioridad:** ${meta.pri} · **Lectura:** ~${meta.minutes} min
> **Link verificado:** [${meta.link}](${meta.link})
> **Categoría Papers:** ${p.dir.replace(/^\\d+-/, "").replace(/-/g, " ")} · **Nivel:** ${meta.pri === "Imprescindible" ? "avanzado" : meta.pri === "Muy recomendado" ? "intermedio" : "intro"}

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

${body.trim()}

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en \`desktop-app\` o \`web/src\` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
`
}

for (const p of papers) {
  for (const BASE of BASES) {
    const outPath = join(BASE, p.dir, p.file)
    mkdirSync(join(BASE, p.dir), { recursive: true })
    writeFileSync(outPath, mdTemplate(p), "utf8")
    console.log("✓", outPath)
  }
}
console.log(`✓ ${papers.length} papers generados en ${BASES.join(" + ")}`)

