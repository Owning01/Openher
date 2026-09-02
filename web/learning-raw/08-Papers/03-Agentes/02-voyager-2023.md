# Voyager — Skill library que crece sola (Wang et al., 2023)

> **Autores:** Wang, Zhu, Guo et al. / NVIDIA, Caltech, UT Austin
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~18 min
> **Link verificado:** [https://arxiv.org/abs/2305.16291](https://arxiv.org/abs/2305.16291)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio · **Versión:** arXiv 2305.16291

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper original:** Voyager: An Open-Ended Embodied Agent with Large Language Models (Wang et al., 2023) — https://arxiv.org/abs/2305.16291 · Code: https://github.com/MineDojo/voyager
> **Relevancia para opencode-remote-android:** es el blueprint de tu sistema de Skills: muestra cómo pasar de "prompt suelto" a "skill = código versionado + test + verificación en entorno real" y cómo una librería que se auto-expande supera a regenerar todo cada vez.
> **Prioridad:** Muy recomendado (inspiración directa para `.agents/skills` y OpenCode Hub).

## 1 Introducción — Qué problema resuelve

Los agentes LLM típicos resuelven una tarea y se olvidan. Cada nuevo pedido arranca de cero, regenerando código que ya generaron antes. Voyager rompe eso en Minecraft: un agente encarnado que **escribe código JavaScript (Mineflayer) como skills reutilizables**, las guarda en una librería persistente, propone su propio curriculum de aprendizaje y se auto-verifica ejecutando en el mundo real — sin un solo paso de fine-tuning, solo GPT-4 + feedback del entorno.

El resultado no es un bot que mina un bloque: es un agente de vida abierta que descubre diamantes, fabrica herramientas y acumula **300+ skills** que reusa composicionalmente. La pregunta que te deja es directa: ¿por qué tu sistema de skills regenera el mismo script cada vez en lugar de catalogarlo, testearlo y componerlo como hace Voyager?

## 2 Ideas clave

### 2.1 El loop de tres patas

```
Curriculum (qué aprender) → Skill Generation (código JS) → Verification (ejecutar y auto-debuggear)
        ↑                                                              |
        └──────────────── feedback del mundo + librería ───────────────┘
```

| Componente | Qué hace | Detalle clave |
|---|---|---|
| **Automatic Curriculum** | Propone la próxima tarea basándose en inventario actual, skills ya dominadas y exploración pendiente. | No es random: maximiza novedad y factibilidad. Ej: si ya tiene `mineStone`, propone `craftStonePickaxe`. |
| **Skill Library** | Cada skill es **código ejecutable** con descripción en lenguaje natural, no un prompt. Se guarda indexada por embedding para retrieval. | Skills son composables: `combatZombie` reusa `craftSword` + `approachEntity`. La librería crece monotónicamente. |
| **Iterative Prompting + Self-Verification** | Genera código, lo ejecuta en Mineflayer, captura errores/traces y auto-debuggea con el LLM hasta que pasa o agota intentos. | El verificador es el entorno mismo (¿crafteó el item? ¿sigue vivo?). Sin reward manual. |

### 2.2 Skills como código, no como texto

La diferencia crucial: Voyager no guarda "cómo minar piedra" como un párrafo. Guarda `mineStone.js` que llama a APIs de Mineflayer, con manejo de errores y test implícito (ejecución). Eso permite versionado, retrieval por similitud y composición. Tu `SKILL.md` actual es un buen inicio, pero Voyager te empuja a `SKILL.md + script.sh + test.sh + metadata.json`.

### 2.3 Sin fine-tuning, todo es prompting + entorno

Voyager usa GPT-4 frozen. Toda la mejora viene de acumular skills y de curriculum, no de gradientes. Esto valida tu thin client: no necesitás entrenar un modelo local para tener un agente que mejora con el tiempo; necesitás una buena librería y un buen verificador.

## 3 Evidencia / Experimentos

| Métrica | Voyager (GPT-4) | Baselines (ReAct, Reflexion, AutoGPT) | Delta |
|---|:---:|:---:|---|
| **Tech tree descubierto** | 63 items únicos | ~20-30 (mejor baseline) | ~2-3× más |
| **Diamante obtenido** | Sí, en ~2.5× menos pasos | Solo Voyager lo logra consistentemente | cualitativo |
| **Skills acumuladas** | 300+ reutilizables | 0 (single-shot) | — |
| **Distancia explorada** | 3.3× más que baselines | 1× | +230% |
| **Ablation sin curriculum** | cae ~40% en tech tree | — | curriculum importa |
| **Ablation sin skill library** | cae ~50% (regenera todo) | — | librería importa |
| **Ablation sin self-verification** | cae ~30% (skills rotas persisten) | — | verificación importa |

Setup: Minecraft 1.19, Mineflayer API, GPT-4 (sin fine-tuning), 160 iteraciones de curriculum. Cada skill se verifica ejecutando en el mundo; si falla, el LLM recibe el stack trace y reintenta (iterative prompting). El paper reporta que la librería no solo crece sino que se **compone**: skills nuevas invocan skills viejas como funciones.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo usás / cómo implementarlo en el repo |
|---|---|
| **Skill = código + test + metadata** | Tu `SKILL.md` en `~/.agents/skills`, `~/.opencode/skills`, `APPDATA\opencode\skills` hoy es markdown. Evolucioná a `skill/` con `SKILL.md` + `run.sh`/`run.ps1` + `test.sh` + `skill.json` (nombre, versión, deps, embedding). El Hub (`OpenCodeHubModal.tsx`) ya escanea 8 roots — agregá ejecución y verificación. |
| **Skill Library persistente + retrieval** | Tu `scannedRoots` siempre visible es el catálogo; falta el retrieval por embedding. Indexá skills por embedding de su descripción y hacé `top-k` por similitud al user prompt antes de inyectar en contexto (ahorrá O(n²)). |
| **Automatic Curriculum** | Para labs/hacking: en vez de lista fija de ejercicios, dejá que el agente proponga el siguiente lab según skills dominadas (ej: si pasó `nmap-quick`, propone `nmap-script-vuln`). Guardá progreso en `kanban.json` como tech tree. |
| **Iterative self-verification** | Cada skill debe tener un `test` que corra en `ptyx :4849` o `desktop-app` sandbox. Si `nmap-quick` no encuentra puerto 80 en DVWA, el agente recibe el stderr y reintenta. No guardes skills que no pasen verificación. |
| **Composición** | `exploit-dvwa-sqli` compone `nmap-quick` + `sqlmap-auto`. Diseñá skills para ser invocables entre sí vía `shell.external.*` o imports, no monolitos. |
| **Sin fine-tuning** | No necesitás entrenar Phi-3 para esto. GPT-4/Claude remoto + librería local + verificador en `ptyx` ya te da el loop Voyager completo. |

```ts
// web/src/features/skills/voyager.ts — skill como código verificable
type Skill = {
  name: string;          // "nmap-quick"
  description: string;   // embedding para retrieval
  code: string;          // bash/ps1 ejecutable
  test: string;          // comando que verifica éxito (exit 0 = pass)
  version: string;
};
async function verifySkill(skill: Skill): Promise<boolean> {
  const result = await ptyx.exec(skill.code); // :4849
  if (result.exitCode !== 0) {
    const fix = await llm.debug(skill.code, result.stderr); // iterative prompting
    return verifySkill({ ...skill, code: fix });
  }
  const testResult = await ptyx.exec(skill.test);
  return testResult.exitCode === 0;
}
```

## 5 Anti-patterns / Limitaciones

- **Guardar skills como texto libre sin ejecutar.** Si tu skill es solo un prompt que "describe cómo hacer X" pero nunca lo ejecutás ni testeás, no es una skill Voyager: es documentación. Sin verificación, acumulás skills rotas.
- **Regenerar en cada turno.** Pedirle al LLM que regenere `nmap-quick` cada vez que lo necesitás paga latencia y tokens O(n²) al pedo. La librería existe para no pagar dos veces por el mismo conocimiento.
- **Curriculum aleatorio o fijo.** Una lista estática de labs no es curriculum automático. Voyager propone la próxima tarea maximizando novedad × factibilidad; si tu agente siempre hace lo mismo, no explora.
- **Skills monolíticas no composables.** Una skill de 200 líneas que hace todo (scan + exploit + report) no se reusa. Partí en skills pequeñas que se invocan entre sí.
- **Dependencia total de GPT-4 sin fallback.** Voyager no funciona bien con modelos pequeños (ablation con GPT-3.5 cae fuerte). Si tu thin client a veces cae a Phi-3 local, tené skills críticas pre-verificadas que no requieran LLM para ejecutarse.

## 6 Ejercicios prácticos (en tu repo)

1. **Skill `nmap-quick` verificable.** Creá `skills/nmap-quick/` con `SKILL.md` + `run.sh` (`nmap -F $TARGET`) + `test.sh` (verifica que encuentra puerto 80 en DVWA local) + `skill.json`. Ejecutá `verifySkill` vía `ptyx :4849` y guardá solo si pasa. Medí cuántos reintentos necesita el LLM para generarla correctamente.

2. **Retrieval por embedding.** Indexá tus 5-10 skills existentes por embedding (usá `text-embedding-3-small` o local). Ante un prompt nuevo, hacé `top-2` por similitud coseno e inyectá solo esas en contexto en lugar de todas. Medí tokens ahorrados y si el agente sigue resolviendo la tarea.

3. **Mini curriculum automático.** Implementá un loop que, dado el estado actual (`skills dominadas` + `kanban.json`), le pida al LLM proponer la próxima tarea ("qué skill falta para llegar a X"). Ejecutá 5 iteraciones y grafica `skills acumuladas` vs `iteración` — ¿crece como en Voyager o se estanca?

## 7 Referencias

- **Paper:** Wang et al., *Voyager: An Open-Ended Embodied Agent with Large Language Models*, 2023 — https://arxiv.org/abs/2305.16291 · PDF: https://arxiv.org/pdf/2305.16291
- **Código:** https://github.com/MineDojo/voyager · Mineflayer: https://github.com/PrismarineJS/mineflayer
- **Relacionados en esta serie:** Generative Agents (Park et al. 2023) para memoria, Building Effective Agents (Anthropic 2024) para workflows, AIDE (Jiang et al. 2025) para búsqueda en árbol.
- **Para profundizar:** *MineDojo* (Fan et al., NeurIPS 2022) — el entorno base de Voyager.

---

## Checklist de lectura

- [ ] Leí el abstract, Fig. 1 (loop) y Tabla 1 (tech tree) del paper original
- [ ] Entiendo la diferencia entre skill como código vs skill como prompt
- [ ] Puedo explicar el loop curriculum → skill → verification en 2 minutos
- [ ] Anoté 1 skill concreta para implementar como código verificable esta semana
- [ ] Link guardado en favoritos / Zotero

*Generado para sección Papers — 03 Agentes · opencode-remote-android*
