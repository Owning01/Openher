# AutoGen — Conversación multi-agente como API (Wu et al., 2023)

> **Autores:** Wu, Bansal, Zhang, Wu et al. / Microsoft Research, Penn State, UW
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2308.08155](https://arxiv.org/abs/2308.08155)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio · **Versión:** arXiv 2308.08155

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper original:** AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation (Wu et al., 2023) — https://arxiv.org/abs/2308.08155 · Code: https://github.com/microsoft/autogen
> **Relevancia para opencode-remote-android:** te da el patrón formal para lo que ya hacés a medias con `subagentTaskPart` filtrados en `useSSE.ts` y `groupedSessions`: cada subagente con su propia conversación aislada, orquestados por turnos observables y registrables.
> **Prioridad:** Muy recomendado — *conversación como arquitectura, no como log.*

## 1 Introducción — Qué problema resuelve

Un solo LLM con un solo prompt y una sola memoria no escala a tareas complejas: se confunde entre roles, mezcla contextos y no sabe cuándo pedir ayuda. AutoGen propone una idea desarmante de simple: **todo es una conversación entre agentes conversables**. Cada agente es `LLM + tools + human` envuelto en una interfaz común (`send`/`receive`), y la orquestación es simplemente decidir quién habla después.

Con esa abstracción mínima, los autores resuelven coding, math, QA y orquestación multi-paso con menos alucinación que single-agent, sin reentrenar nada: solo cambiando quién conversa con quién y en qué orden. Para vos, que ya tenés `session → task → subagent` y filtrás `subagentTaskPart` en el SSE, AutoGen te dice cómo hacerlo explícito, testeable y extensible en lugar de un `if` escondido en el handler.

## 2 Ideas clave

### 2.1 Agente conversable — La única abstracción

```ts
interface ConversableAgent {
  name: string;
  systemMessage: string;       // rol: "Assistant", "Executor", "Critic"
  llmConfig?: LLMConfig;
  tools?: Tool[];              // code executor, file ops, web search
  humanInputMode: "ALWAYS" | "NEVER" | "TERMINATE";
  send(msg: Message, to: Agent): void;
  receive(msg: Message, from: Agent): Message | null;
}
```

Tres tipos predefinidos que cubren el 90% de los casos:

| Agente | Rol | Ejemplo en tu repo |
|---|---|---|
| **AssistantAgent** | Razona y propone (LLM puro) | El LLM que genera el plan en `opencode serve` |
| **UserProxyAgent** | Ejecuta código/tools y representa al humano | `ptyx :4849` + `fsx` + `gitx` + `external_router` |
| **GroupChatManager** | Decide quién habla después (orquestador) | `DesktopPanelRenderer` / `groupedSessions` manager |

La gracia: podés componerlos sin cambiar su implementación interna. Cambiás el orden de conversación y tenés un workflow distinto.

### 2.2 Conversación como API — Cada mensaje es acción observable

En AutoGen, no hay "estado interno oculto". Todo lo que un agente hace es un **mensaje** en la conversación compartida: `Thought`, `ToolCall`, `ToolResult`, `Summary`. Eso hace que:

- Cada paso sea **registrable y replayable** (tu `IndexedDB v2` ya lo hace a medias).
- Podés inyectar un humano en cualquier turno (`humanInputMode: "ALWAYS"`).
- Podés cambiar orquestación sin tocar los agentes (solo el `GroupChatManager`).

### 2.3 Patrones de orquestación incluidos

| Patrón | Flujo | Cuándo usarlo |
|---|---|---|
| **Two-agent chat** | `Assistant ↔ UserProxy` (ejecutor) | Coding single-task: el Assistant propone código, el Proxy lo ejecuta y devuelve output. |
| **Sequential chat** | `A → B → C` (cada uno ve el historial previo) | Pipeline: `PM → Architect → Engineer → QA` (ver MetaGPT). |
| **Group chat** | `Manager` elige speaker cada turno entre N agentes | Brainstorming, debate, tareas donde no sabés quién debe hablar después. |
| **Nested chat** | Un agente inicia un sub-chat con otros y vuelve con resumen | Tu `subagentTaskPart`: el agente padre delega sub-tareas y solo ve el summary. |

### 2.4 Code execution como feedback, no como side-effect

El `UserProxyAgent` con `code_execution_config` ejecuta código real (Python, bash) y devuelve stdout/stderr como mensaje. El Assistant lo ve y corrige. Es el loop `generate → execute → observe → fix` que tu `ptyx :4849` ya hace, pero formalizado como conversación.

## 3 Evidencia / Experimentos

| Tarea | Setup AutoGen | Baseline single-agent | Delta |
|---|---|---|---|
| **HumanEval (coding)** | Assistant + Executor (2 agents, 3 turns) | Single LLM | +10-15 pts pass@1 (según modelo) |
| **MATH (resolución)** | Assistant + Executor con Python | CoT single-agent | +8-12% accuracy |
| **MiniWob++ (web tasks)** | Assistant + WebExecutor | Single-agent ReAct | +20% success rate |
| **Conversational chess** | 3 agents (player, board, critic) | Single-agent | Partidas coherentes vs colapso en 5 jugadas |
| **Costo** | 2-4 agents × 3-6 turns | 1 agent × 1 turn | 2-4× tokens, pero +10-20% accuracy |

Los autores enfatizan que la ganancia no viene de un modelo mejor sino de **descomposición + feedback de ejecución**: el Executor corrige alucinaciones del Assistant con evidencia del mundo real (stdout/stderr). Es el mismo principio que Voyager y OpenHands.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo usás / cómo implementarlo en el repo |
|---|---|
| **Assistant ↔ UserProxy** | Tu `opencode serve :4096/:4097` (Assistant) + `ptyx :4849` + `fsx`/`gitx` (UserProxy) ya es este patrón. Hacelo explícito: tipá `AgentRole = "assistant" \| "executor" \| "manager"` y logueá cada turno con `from`/`to`. |
| **GroupChatManager** | `groupedSessions` / `DesktopGrid` donde múltiples sesiones comparten contexto pero necesitan turnos claros. Implementá un `GroupChatManager` que decide qué sesión/subagente habla después según `kanban` o prioridad. |
| **Nested chat (subagentes)** | Tu `subagentTaskPart` filtrado en `useSSE.ts` es nested chat sin saberlo. Formalizá: cada subagente tiene su propia conversación aislada; el padre solo ve `summary` al terminar. Ver `web/src/shared/sse/handler.ts`. |
| **Conversación como log replayable** | Tu `IndexedDB v2` merge-only ya guarda mensajes. Agregá `from`/`to`/`turn` a cada mensaje para poder replayar cualquier conversación agente-a-agente y debuggear sin reproducir el LLM. |
| **Human-in-the-loop** | `humanInputMode: "TERMINATE"` → el humano solo interviene si el agente pide `TERMINATE` o falla N veces. Úsalo para `kanban` cards que requieren aprobación manual antes de `Done`. |
| **Code execution feedback** | Cada `tool_call` a `shell.ptyx.exec` o `shell.fs.write` debe devolver `stdout/stderr` como mensaje conversacional, no como side-effect silencioso. El agente padre debe ver el resultado para corregir. |

```ts
// web/src/features/autogen/conversation.ts — conversación como API
type AgentMsg = { from: string; to: string; content: string; toolCalls?: ToolCall[]; toolResults?: ToolResult[] };
class GroupChatManager {
  constructor(private agents: ConversableAgent[]) {}
  nextSpeaker(history: AgentMsg[]): ConversableAgent {
    // heurística simple: si último msg tiene toolResults con error → mismo agent reintenta
    // si no, round-robin o LLM elige
    const last = history[history.length - 1];
    if (last?.toolResults?.some(r => r.exitCode !== 0)) {
      return this.agents.find(a => a.name === last.from)!;
    }
    return this.agents[history.length % this.agents.length];
  }
}
// Cada subagente aísla su conversación; el padre solo ve summary
async function delegateToSubagent(task: string): Promise<string> {
  const subHistory: AgentMsg[] = [];
  // ... loop subagente con su propia conversación ...
  return summarize(subHistory); // solo summary vuelve al padre
}
```

## 5 Anti-patterns / Limitaciones

- **Chat libre sin roles.** Si todos los agentes son "Assistant genérico" sin `systemMessage` diferenciado, conversan en círculos y alucinan igual que single-agent. Cada agente necesita rol, goal y tools distintos — si no, es overhead sin ganancia.
- **Conversación sin terminación.** Un `GroupChat` sin `max_rounds` ni condición de `TERMINATE` puede loopear infinito (cada agente responde "estoy de acuerdo, sigamos"). Definí siempre `max_rounds=10` y `termination_msg="TERMINATE"`.
- **Mezclar todas las conversaciones en un solo log.** Si subagentes y padre comparten el mismo array de mensajes sin aislar, el contexto explota O(n²) y el padre ve ruido. Aislá cada sub-conversación; el padre solo consume summaries.
- **Ejecución sin sandbox.** AutoGen ejecuta código real; sin Docker/sandbox (ver OpenHands), un `rm -rf` del Assistant borra tu host. Tu `ptyx :4849` hoy corre en host — considerá al menos `dry-run` o `allowlist` de comandos.
- **Costo multiplicado.** 3 agentes × 5 turnos = 15 LLM calls vs 1. Solo vale la pena si la tarea es lo suficientemente compleja para justificarlo. Para `screenshots :3002`, un workflow determinista (Anthropic) gana.

## 6 Ejercicios prácticos (en tu repo)

1. **Tipá tu subagente como nested chat.** En `web/src/shared/sse/handler.ts`, donde filtrás `subagentTaskPart`, creá `type SubagentConversation = { id: string; parentId: string; messages: AgentMsg[]; summary?: string }`. Cada subagente acumula su propia conversación; al terminar, solo `summary` se inyecta en la conversación padre. Logueá tokens ahorrados vs mandar todo el sub-trace.

2. **Two-agent loop para `ptyx`.** Implementá `Assistant (LLM) ↔ UserProxy (ptyx :4849)` explícito: el Assistant propone un comando, el Proxy lo ejecuta y devuelve `stdout/stderr` como mensaje. El Assistant corrige si hay error. Medí cuántos bugs de `desktop-app` se arreglan en ≤3 turns vs single-shot.

3. **GroupChatManager para `groupedSessions`.** Si tenés 3 sesiones agrupadas trabajando en el mismo repo, implementá un `GroupChatManager` que decide round-robin quién habla y permite que una sesión pida `TERMINATE` para pedir aprobación humana. Probá con una tarea que requiera tocar `web/`, `desktop-app/` y `opencode-stats` en paralelo.

## 7 Referencias

- **Paper:** Wu et al., *AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation*, 2023 — https://arxiv.org/abs/2308.08155 · PDF: https://arxiv.org/pdf/2308.08155
- **Código:** https://github.com/microsoft/autogen (ahora `AG2`) · Docs: https://microsoft.github.io/autogen/
- **Relacionados en esta serie:** MetaGPT (Hong et al. 2023) para SOPs vs chat libre, CrewAI (Moura 2024) para roles, Building Effective Agents (Anthropic 2024) para cuándo NO usar multi-agente.
- **Para profundizar:** *AutoGen Studio* — UI low-code para diseñar conversaciones multi-agente.

---

## Checklist de lectura

- [ ] Leí el abstract, Fig. 1 (arquitectura) y Sec. 3 (conversable agents) del paper original
- [ ] Entiendo la diferencia entre Two-agent, Group chat y Nested chat
- [ ] Puedo explicar por qué "conversación como API" mejora trazabilidad vs estado oculto
- [ ] Anoté 1 lugar en `useSSE.ts` / `DesktopGrid` donde formalizar agente conversable
- [ ] Link guardado en favoritos / Zotero

*Generado para sección Papers — 03 Agentes · opencode-remote-android*
