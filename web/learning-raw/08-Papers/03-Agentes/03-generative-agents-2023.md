# Generative Agents — Memoria, reflexión y comportamiento emergente (Park et al., 2023)

> **Autores:** Park, O'Brien, Cai, Morris, Liang, Bernstein / Stanford & Google
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2304.03442](https://arxiv.org/abs/2304.03442)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio · **Versión:** UIST 2023 (arXiv 2304.03442)

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper original:** Generative Agents: Interactive Simulacra of Human Behavior (Park et al., UIST 2023) — https://arxiv.org/abs/2304.03442 · Demo: https://reverie.herokuapp.com
> **Relevancia para opencode-remote-android:** es el blueprint de memoria que tu `IndexedDB v2` y tu `cacheMessages merge-only` necesitan: cómo pasar de log cronológico a retrieval por recencia + relevancia + importancia, con reflexión periódica que compacta experiencia en conocimiento reutilizable.
> **Prioridad:** Muy recomendado — *si tu agente olvida, este paper es la cura.*

## 1 Introducción — Qué problema resuelve

¿Cómo hacés que un LLM se comporte como una persona coherente durante días, no solo durante un chat de 10 turnos? Los autores crean **Smallville**: un pueblo estilo The Sims con 25 agentes generativos que viven, planifican su día, conversan, recuerdan y —sin un solo script— organizan fiestas, se pasan chismes y coordinan. Cada agente corre sobre un LLM (GPT-3.5) pero lo que lo hace creíble no es el modelo: es la **arquitectura de memoria**.

El paper demuestra que con tres piezas —*memory stream* (log de todo lo vivido), *retrieval* ponderado y *reflection* (resúmenes de alto nivel)— emergen comportamientos sociales complejos que ningún prompt single-shot logra. Para vos, que mantenés sesiones largas con `opencode serve` vía SSE y un cache `IndexedDB v2` que hoy es merge-only cronológico, este paper te muestra cómo evitar que tu agente olvide lo importante y recuerde lo irrelevante.

## 2 Ideas clave

### 2.1 Memory Stream — Todo es una memoria con timestamp

Cada observación, acción, conversación y pensamiento es un objeto en un stream append-only:

```ts
type Memory = {
  text: string;          // "Klaus preguntó por la fiesta"
  timestamp: number;     // 2023-02-13 10:00
  embedding: number[];   // para relevancia
  importance: number;    // 1-10, preguntado al LLM: "¿cuán importante es esto?"
  lastAccess: number;    // para recencia
};
```

No hay borrado: solo acumulación. La pregunta no es "¿qué guardo?" sino "¿qué recupero cuando necesito actuar?".

### 2.2 Retrieval — Recencia + Relevancia + Importancia

Cuando el agente necesita decidir qué hacer o qué decir, no manda todo el stream (O(n²) lo mataría). Hace retrieval con score combinado:

```
score(m) = α · recency(m) + β · relevance(m, query) + γ · importance(m)
```

| Señal | Cómo se calcula | Por qué importa |
|---|---|---|
| **Recencia** | Decaimiento exponencial desde `lastAccess` (0.995 por hora en el paper). | Lo reciente es más accionable. |
| **Relevancia** | Similitud coseno entre embedding de `query` y `memory.text`. | Solo trae lo pertinente al contexto actual. |
| **Importancia** | LLM auto-scorea 1-10 al crear la memoria ("¿cuán memorable es esto?"). | Un error de compilación vale más que un "hola". |

El agente recupera `top-k` (k≈5-10) y solo eso entra al prompt. Es exactamente lo que tu `loadSelected` debería hacer en lugar de paginar cronológicamente.

### 2.3 Reflection — La noche que resume el día

Cada N memorias (o cada "noche" simulada), el agente hace:

1. Toma las últimas 100 memorias.
2. Pregunta al LLM: "¿qué 3 preguntas de alto nivel puedo responder sobre esto?" (ej: "¿qué le gusta a Klaus?").
3. Para cada pregunta, recupera memorias relevantes y genera un **insight** ("Klaus está interesado en investigación").
4. Guarda cada insight como una **nueva memoria de alto nivel** con importancia alta.

Es compresión con pérdida pero con ganancia semántica: 100 eventos → 3 insights reutilizables. Tu `compaction miser/ultra` hace truncado; reflection hace *síntesis*.

### 2.4 Planning — Del día a la hora al minuto

El agente planifica jerárquicamente: plan del día ("trabajar en la novela") → descompuesto en bloques horarios → en acciones de 5-15 min. Cada nivel se genera con retrieval del nivel superior + memorias relevantes. Si algo cambia (una invitación), replanifica. Es `orchestrator-workers` (Anthropic) aplicado a tiempo.

## 3 Evidencia / Experimentos

| Evaluación | Setup | Resultado |
|---|---|---|
| **Creíble vs humano** | Evaluadores humanos rankean respuestas de agente vs humano en entrevistas sobre Smallville | Agentes indistinguibles en coherencia de personaje; mantienen identidad a lo largo de 2 días simulados |
| **Emergencia social** | 25 agentes libres sin script, 2 días | Emergen: fiesta en el café (5 agentes coordinan), chisme que se propaga, invitaciones espontáneas |
| **Ablation sin reflection** | Mismo agente sin insights nocturnos | Pierde coherencia a largo plazo; olvida motivaciones y repite preguntas |
| **Ablation sin importance** | Retrieval solo por recencia+relevancia | Recupera trivialidades ("comió pan") por encima de eventos clave ("rompió relación") |
| **Ablation sin recencia** | Solo relevancia+importancia | Trae memorias viejas irrelevantes para el contexto inmediato |
| **Costo** | GPT-3.5, 25 agentes × 2 días | ~$5000 en API calls (2023); cada agente ~$0.50/hora simulada |

El hallazgo central no es una métrica BLEU sino **emergencia**: comportamientos sociales no programados que solo aparecen cuando memoria + retrieval + reflection funcionan juntos. Quitar cualquiera de los tres colapsa la ilusión.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo usás / cómo implementarlo en el repo |
|---|---|
| **Memory stream** | Tu `IndexedDB v2` (`DB_VERSION = 2`, merge-only) ya es un memory stream primitivo. Evolucioná: cada mensaje/part es `Memory` con `embedding + importance + timestamp`. No borres al compactar: archivá. |
| **Retrieval ponderado** | Hoy `loadSelected` pagina cronológico (20/100). Cambiá a `top-k` por `score = recencia + relevancia(query) + importancia`. Solo `k=10-15` memorias entran al prompt → ahorrás O(n²) y mejorás Lost-in-Middle. |
| **Importance scoring** | Al recibir `message.part.delta` vía SSE, scoreá importancia con heurística barata: `error/success/fix` → 9, `pregunta del user` → 7, `ack` → 2. O preguntá al LLM cada 10 mensajes. Guardá en IndexedDB. |
| **Reflection nocturna** | Tras sesión larga (>50 mensajes) o al cerrar pestaña, generá 2-3 insights ("el usuario prefiere Rust sobre TS para desktop-app") y guardalos como memorias de alto nivel. Inyectalos al inicio de la próxima sesión. |
| **Planning jerárquico** | Tu `kanban.json` es el plan del día. Descomponé cada tarjeta en sub-tareas horarias y usá `subagentTaskPart` (filtrado en `useSSE.ts`) como plan de minutos. Si el user cambia de idea, replanificá. |
| **Smallville → tu pueblo** | Pensá tus 5 plugins externos como 25 agentes de Smallville: cada uno con su memory stream y retrieval. `DesktopPanelRenderer.tsx` es el pueblo; `ExternalIframePanel` son las casas. |

```ts
// web/src/features/memory/retrieval.ts — retrieval ponderado
type Memory = { text: string; ts: number; importance: number; embedding: number[] };
function score(m: Memory, queryEmb: number[], now: number): number {
  const recency = Math.pow(0.995, (now - m.ts) / 3600_000); // decae por hora
  const relevance = cosineSimilarity(m.embedding, queryEmb);
  const importance = m.importance / 10;
  return 0.3 * recency + 0.5 * relevance + 0.2 * importance;
}
function retrieve(memories: Memory[], queryEmb: number[], k = 10): Memory[] {
  const now = Date.now();
  return memories.map(m => ({ m, s: score(m, queryEmb, now) }))
    .sort((a, b) => b.s - a.s).slice(0, k).map(x => x.m);
}
```

## 5 Anti-patterns / Limitaciones

- **Mandar todo el historial al LLM.** Con 200 mensajes, pagás O(n²) y Lost-in-Middle te degrada el medio del contexto. Retrieval top-k no es opcional a partir de ~50 mensajes; es física del Transformer.
- **Truncar sin sintetizar.** Tu `compaction miser/ultra` que corta mensajes viejos pierde información irrecuperable. Reflection la *comprime* en insights; truncado la *tira*. Preferí lo primero.
- **Importance uniforme.** Si todas las memorias valen lo mismo, retrieval trae lo más reciente o lo más similar, no lo más *importante*. Un `rm -rf` fallido vale más que 10 "ok" — sin importance, tu agente no lo sabe.
- **Reflection demasiado frecuente o nunca.** Cada mensaje → caro y ruidoso. Nunca → olvido a largo plazo. El paper usa cada ~100 memorias o cada "noche"; para vos, cada 30-50 mensajes o al cerrar sesión es buen compromiso.
- **Costo del paper.** 25 agentes × GPT-3.5 × 2 días = $5000 (2023). No repliques Smallville literal en tu APK: usá heurísticas locales para importance/recencia y reservá LLM para reflection.

## 6 Ejercicios prácticos (en tu repo)

1. **Importance heurística.** En `web/src/shared/sse/handler.ts`, al recibir cada `message.part.delta`, asigná `importance` con reglas: contiene `error|failed|success|fix` → 9, es pregunta del user → 7, es `ack/thinking` → 2, resto → 5. Persistí en IndexedDB y logueá distribución en 20 turnos. ¿Qué % queda en 9 vs 2?

2. **Retrieval top-k vs cronológico.** Implementá `retrieve()` como arriba (aunque sea con BM25 en lugar de embeddings al inicio) y compará: ante la pregunta "¿qué decidimos sobre el puerto 4097?" tras 60 mensajes, ¿trae retrieval la decisión correcta en top-5 vs paginación cronológica de 20? Medí recall en 10 queries.

3. **Reflection al cerrar sesión.** Al detectar `visibilitychange hidden` o `beforeunload`, tomá los últimos 50 mensajes, pedile al LLM "resumí en 3 insights lo que aprendiste de esta sesión" y guardalos como memorias con `importance=10` para la próxima sesión. Verificá que en la siguiente sesión el agente recuerde preferencias sin que el user las repita.

## 7 Referencias

- **Paper:** Park et al., *Generative Agents: Interactive Simulacra of Human Behavior*, UIST 2023 — https://arxiv.org/abs/2304.03442 · PDF: https://arxiv.org/pdf/2304.03442
- **Demo interactiva:** https://reverie.herokuapp.com (Smallville jugable)
- **Código:** https://github.com/joonspk-research/generative_agents
- **Relacionados en esta serie:** Voyager (Wang et al. 2023) para skill library, MemGPT (Packer et al. 2023) para memoria externa, Lost in the Middle (Liu et al. 2023) para por qué retrieval importa.
- **Para profundizar:** *Memory in LLM Agents* — survey de arquitecturas de memoria (2024).

---

## Checklist de lectura

- [ ] Leí el abstract, Fig. 2 (arquitectura de memoria) y Sec. 4 (Smallville) del paper original
- [ ] Entiendo la fórmula `score = recencia + relevancia + importancia` y cada término
- [ ] Puedo explicar reflection (100 memorias → 3 insights) en 2 minutos
- [ ] Anoté 1 mejora concreta para `IndexedDB v2` / `loadSelected` esta semana
- [ ] Link guardado en favoritos / Zotero

*Generado para sección Papers — 03 Agentes · opencode-remote-android*
