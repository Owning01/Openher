# MetaGPT — SOPs en vez de chat libre (Hong et al., 2023)

> **Autores:** Hong, Zheng, Chen et al. / DeepWisdom
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2308.00352](https://arxiv.org/abs/2308.00352)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio · **Versión:** ICLR 2024 (arXiv 2308.00352)

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper original:** MetaGPT: Meta Programming for Multi-Agent Collaborative Framework (Hong et al., ICLR 2024) — https://arxiv.org/abs/2308.00352 · Code: https://github.com/geekan/MetaGPT
> **Relevancia para opencode-remote-android:** te enseña por qué tus subagentes no deberían "chatear libremente" sino producir artefactos estructurados (PRD, diseño, código, tests) con SOPs — y cómo tu `kanban.json` puede ser el PRD vivo que orquesta esa cadena.
> **Prioridad:** Muy recomendado — *el antídoto al chat multi-agente que diverge.*

## 1 Introducción — Qué problema resuelve

Multi-agente suena bien hasta que lo probás: tres LLMs chateando libremente se interrumpen, se contradicen, alucinan requisitos y terminan con código que no compila ni pasa tests. MetaGPT identifica la causa: **falta de proceso**. En una empresa real de software, Product Manager, Architect, Engineer y QA no chatean sin parar: siguen SOPs (Standard Operating Procedures) y se pasan **artefactos tipados** (PRD, diagrama de clases, código, casos de test).

MetaGPT simula exactamente esa empresa: cada agente tiene un rol con prompts especializados y solo se comunica vía artefactos estructurados en un **shared message pool** con suscripción pub/sub. El resultado supera a single-agent y a AutoGen en HumanEval/MBPP, no por un modelo mejor sino por **proceso**. Para vos, que querés que `opencode-remote-android` genere features multi-archivo sin que cada subagente invente su propia spec, este paper es el molde.

## 2 Ideas clave

### 2.1 SOPs — Proceso antes que conversación

```
PRD (Product Manager) → System Design (Architect) → Tasks + Code (Engineer) → Tests (QA)
        │                        │                         │                    │
        └──────────────── shared message pool (pub/sub) ────────────────────────┘
```

Cada flecha es un **artefacto validable**, no un mensaje de chat. El PM no le "dice" al Architect qué hacer: publica un PRD estructurado que el Architect consume.

| Rol | Input (artefacto) | Output (artefacto) | Validación |
|---|---|---|---|
| **Product Manager** | User requirement | `PRD.md` (user stories, requisitos, constraints) | ¿PRD tiene secciones completas? |
| **Architect** | PRD | `system_design.md` (APIs, file list, data structures) | ¿Diseño cubre todos los reqs del PRD? |
| **Project Manager** | Design | `tasks.json` (task list priorizada) | ¿Tasks mapean 1:1 a files del diseño? |
| **Engineer** | Design + tasks | `code diff` por task | ¿Compila? ¿Pasa `cargo check` / `tsc -b`? |
| **QA Engineer** | Code | `tests` + reporte | ¿Tests pasan? ¿Cobertura mínima? |

### 2.2 Shared Message Pool con pub/sub

En lugar de chat directo A→B, todos los agentes publican y se suscriben a un pool:

```ts
type Artifact = { role: "PRD" | "Design" | "Tasks" | "Code" | "Test"; content: string; from: string };
class MessagePool {
  artifacts: Artifact[] = [];
  publish(a: Artifact) { this.artifacts.push(a); }
  subscribe(role: string): Artifact[] { return this.artifacts.filter(a => a.role === role); }
}
```

Ventajas: desacopla agentes, hace el flujo auditable, permite replay y evita que un agente vea mensajes irrelevantes (ahorra O(n²)).

### 2.3 Artefactos tipados > texto libre

El paper es enfático: la ganancia de calidad viene de **forzar estructura**. Un PRD con secciones fijas (`Goals`, `User Stories`, `Requirements`, `Constraints`) es validable automáticamente; un chat libre no. Cada artefacto tiene schema y cada agente valida el input antes de producir output.

## 3 Evidencia / Experimentos

| Benchmark | MetaGPT (GPT-4) | ChatDev (chat libre) | Single-agent GPT-4 | Delta MetaGPT |
|---|:---:|:---:|:---:|---|
| **HumanEval pass@1** | **85.9%** | ~70% | ~67% | +15-18 pts |
| **MBPP pass@1** | **87.7%** | ~75% | ~72% | +12-15 pts |
| **SoftwareDev (7 tasks)** | 4.2/5 executability | 2.5/5 | — | +68% |
| **Productivity (tokens/task)** | ~31k tokens | ~19k | ~10k | más caro pero mejor |
| **Human revision cost** | 0.83 revisions/task | 2.1 | — | −60% |

Evaluación SoftwareDev: 7 tareas de desarrollo end-to-end (ej: "creá un juego 2048 en Python") evaluadas por humanos en executability, completeness y revision cost. MetaGPT genera proyectos que corren y requieren menos corrección manual que ChatDev (que usa chat libre multi-agente).

El costo es mayor en tokens (SOPs generan más artefactos intermedios), pero el **costo de revisión humana** cae 60% — tradeoff que en producción compensa.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo usás / cómo implementarlo en el repo |
|---|---|
| **PRD como artefacto** | Tu `kanban.json` puede ser el PRD vivo: cada tarjeta con `title`, `description`, `constraints`, `acceptance` es un PRD en miniatura. El agente PM lo escribe; Architect y Engineer lo consumen. |
| **SOP Spec → Design → Code → Test → Review** | Para "añadir feature multi-archivo": `PM escribe spec.md` → `Architect propone file list + interfaces` → `Engineer genera diff por file` → `QA corre tsc -b && cargo check && pnpm test` → `Review`. Cada paso valida antes de avanzar. |
| **Shared message pool** | Implementá `MessagePool` en `web/src/features/kanban/pool.ts` donde cada subagente publica su artefacto. `DesktopPanelRenderer` / `groupedSessions` suscribe solo a lo relevante — no inunda contexto. |
| **Artefactos tipados validables** | Definí schemas Zod para cada artefacto: `PRD { goals, stories, constraints }`, `Design { files, apis }`, `Tasks { items[] }`. Validá con `zod.parse()` antes de pasar al siguiente agente; si falla, el agente reintenta. |
| **Engineer → QA con tests** | Tu `external_router` + `ptyx :4849` ya pueden ejecutar tests. El QA agent corre `pnpm test` / `cargo test` y publica el reporte como artefacto; si falla, vuelve a Engineer con el log. |
| **Menos chat, más artefacto** | Si tus subagentes hoy chatean libre (AutoGen style) y divergen, probá restringirlos a SOPs: cada subagente solo puede publicar UN artefacto tipado por turno. Medí si baja alucinación. |

```ts
// web/src/features/metagpt/sop.ts — SOP mínimo para "añadir feature"
import { z } from "zod";
const PRD = z.object({ goals: z.array(z.string()), stories: z.array(z.string()), constraints: z.array(z.string()) });
const Design = z.object({ files: z.array(z.string()), apis: z.array(z.object({ name: z.string(), signature: z.string() })) });

async function runSOP(requirement: string) {
  const prdRaw = await agentPM.generate(requirement); // LLM
  const prd = PRD.parse(JSON.parse(prdRaw));           // valida o throw
  pool.publish({ role: "PRD", content: JSON.stringify(prd), from: "PM" });

  const designRaw = await agentArch.generate(prd);
  const design = Design.parse(JSON.parse(designRaw));
  pool.publish({ role: "Design", content: JSON.stringify(design), from: "Architect" });

  for (const file of design.files) {
    const diff = await agentEng.generate(file, design);
    await ptyx.exec(`apply diff for ${file}`); // :4849
    const testResult = await ptyx.exec("pnpm test 2>&1 | tail -20");
    if (testResult.exitCode !== 0) await agentEng.fix(file, testResult.stdout);
  }
}
```

## 5 Anti-patterns / Limitaciones

- **Chat libre multi-agente sin SOPs.** Es el anti-pattern que MetaGPT ataca directamente: 3 agentes chateando sin artefactos tipados divergen, se contradicen y generan código inconsistente. Si tu harness hoy es "que los agentes conversen", estás en este bucket.
- **SOP demasiado rígido para tareas exploratorias.** Para "investigá este bug que no entiendo", forzar PRD → Design → Code es overhead. SOPs brillan en tareas con spec clara; para exploración, un loop agéntico (Anthropic) o AutoGen es mejor. Elegí según la tarea.
- **Artefactos gigantes que inflan contexto.** Un PRD de 2000 tokens + Design de 2000 + Code de 5000 = 9000 tokens solo en artefactos intermedios. Pagás O(n²) por cada artefacto que arrastrás. Publicá en pool pero inyectá solo lo relevante al siguiente agente (retrieval, no dump completo).
- **Validación solo sintáctica.** Que el PRD tenga todas las secciones no significa que sea *bueno*. Validación de schema (Zod) es necesaria pero no suficiente; necesitás un evaluator semántico (otro LLM o heurística) que juzgue calidad.
- **Costo en tokens.** MetaGPT usa ~3× más tokens que single-agent por tarea (31k vs 10k). En tu thin client con `opencode serve` remoto, eso es plata y latencia SSE. Usalo solo para features multi-archivo donde la calidad compense.

## 6 Ejercicios prácticos (en tu repo)

1. **SOP mínimo para una feature real.** Elegí una feature pequeña (ej: "agregar filtro por estado en kanban"). Implementá el SOP `PM → Architect → Engineer → QA` con artefactos tipados y validación Zod. Cada agente es un call a `opencode serve` con system prompt distinto. Medí `pass rate` (¿compila y pasa tests al primer intento?) vs single-agent que hace todo en un prompt.

2. **Message pool pub/sub.** Creá `web/src/features/kanban/pool.ts` con `publish`/`subscribe` por rol. Hacé que cada subagente solo vea artefactos de su rol previo (Engineer solo ve Design, no PRD). Medí tokens ahorrados vs mandar todo el historial a cada agente.

3. **Kanban como PRD vivo.** Extendé `kanban.json` para que cada tarjeta tenga `prd: { goals, stories, constraints }` y `design: { files, apis }`. Al mover tarjeta de "Todo" a "Doing", el sistema genera PRD y Design automáticamente y los muestra en `DesktopPanelRenderer`. Verificá que el flujo SOP se refleje en columnas del kanban.

## 7 Referencias

- **Paper:** Hong et al., *MetaGPT: Meta Programming for Multi-Agent Collaborative Framework*, ICLR 2024 — https://arxiv.org/abs/2308.00352 · PDF: https://arxiv.org/pdf/2308.00352
- **Código:** https://github.com/geekan/MetaGPT · Docs: https://docs.deepwisdom.ai/
- **Comparativa directa:** ChatDev (Qian et al., 2023) — el baseline de chat libre que MetaGPT supera.
- **Relacionados en esta serie:** AutoGen (Wu et al. 2023) para chat libre, CrewAI (Moura 2024) para roles, Building Effective Agents (Anthropic 2024) para workflows.
- **Para profundizar:** *SWE-bench* — benchmark donde SOPs vs chat libre se pueden medir objetivamente.

---

## Checklist de lectura

- [ ] Leí el abstract, Fig. 1 (SOPs) y Tabla 1 (HumanEval/MBPP) del paper original
- [ ] Entiendo la diferencia entre artefacto tipado y mensaje de chat libre
- [ ] Puedo dibujar el flujo PRD → Design → Tasks → Code → Test de memoria
- [ ] Anoté 1 feature de `web/` o `desktop-app` para probar con SOP esta semana
- [ ] Link guardado en favoritos / Zotero

*Generado para sección Papers — 03 Agentes · opencode-remote-android*
