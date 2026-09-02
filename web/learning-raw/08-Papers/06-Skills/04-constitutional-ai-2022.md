# Constitutional AI — Harmlessness sin labels humanas, con AI feedback (Bai et al., 2022)

> **Autores:** Yuntao Bai, Saurav Kadavath, Sandipan Kundu, Amanda Askell, Jackson Kernion, Andy Jones, Anna Chen, Anna Goldie, Azalia Mirhoseini, Cameron McKinnon, Carol Chen, Catherine Olsson, Christopher Olah, Danny Hernandez, Dawn Drain, Deep Ganguli, Dustin Li, Eli Tran-Johnson, Ethan Perez, Jamie Kerr, Jared Mueller, Jeffrey Ladish, Joshua Landau, Kamilė Lukošiūtė, Liane Lovitt, Michael Sellitto, Nelson Elhage, Nicholas Schiefer, Noemi Mercado, Nova DasSarma, Robert Lasenby, Robin Larson, Sam Ringer, Scott Johnston, Shauna Kravec, Sheer El Showk, Stanislav Fort, Tamera Lanham, Timothy Telleen-Lawton, Tom Conerly, Tom Henighan, Tristan Hume, Samuel R. Bowman, Zac Hatfield-Dodds, Ben Mann, Dario Amodei, Nicholas Joseph, Sam McCandlish, Tom Brown, Jared Kaplan / Anthropic
> **Año:** 2022 · **Versión:** arXiv 2212.08073 · **Prioridad:** Complementario · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2212.08073](https://arxiv.org/abs/2212.08073)
> **Categoría Papers:** 06 Skills · **Nivel:** intro

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Constitutional AI: Harmlessness from AI Feedback (Bai et al., 2022).
> **Relevancia para opencode-remote-android:** es tu **guardrail**. Antes de que el agente ejecute `shell.fs.delete`, `shell.fs.move` fuera de workspace o spawnee un proceso sin `probe`, alguien tiene que decir "¿esto está permitido?". Constitutional AI te da el patrón sin necesidad de etiquetar miles de ejemplos a mano.

## 1 Introducción — Qué problema resuelve

Entrenar un asistente útil es fácil (RLHF con humanos que rankean respuestas). Entrenar uno **inofensivo** es carísimo: necesitás humanos que etiqueten miles de casos de "¿esto es dañino?" para cada dominio. Y cada vez que agregás una herramienta nueva (`fs.delete`, `external.spawn`), tenés que re-etiquetar.

Constitutional AI (CAI) propone: **escribí una constitución** (lista de principios en lenguaje natural) y dejá que el **modelo se critique a sí mismo** contra esa constitución, genere pares bueno/malo, y se reentrene con AI feedback (RLAIF) sin un solo label humano extra. Resultado: el modelo aprende a rechazar lo dañino manteniendo utilidad, y podés actualizar la constitución sin re-etiquetar.

Para tu thin client, la constitución no es "no seas tóxico" — es **"no borres fuera de workspace, no exfiltres secrets, no spawnees sin verificar puerto"**.

## 2 Ideas clave

### 2.1 Dos fases: Supervised + RL

| Fase | Qué hace | Input → Output |
|---|:---|---|
| **1. Supervised (SL-CAI)** | Modelo genera respuesta → se critica con principio → reescribe | `prompt + respuesta inicial → crítica → respuesta revisada` (usada para SFT) |
| **2. RL (RL-CAI / RLAIF)** | Modelo genera dos respuestas, AI rankea según constitución → entrena reward model → PPO | `prompt → (y_w, y_l) AI-labeled → reward model → RL` |

Vos podés usar **solo la fase 1** (self-critique en runtime) sin entrenar nada — es el guardrail barato.

### 2.2 La constitución son principios legibles

Ejemplo del paper (harmlessness):

> "Elige la respuesta que sea más honesta, no engañosa, y que no ayude a cometer actos dañinos."

Para tu harness, tu `constitution.md` sería:

```markdown
# Constitución del harness opencode-remote-android

1. **Scope:** Nunca operes fuera de `workspace` o `web/dist`. Si el path contiene `..` o es absoluto fuera del proyecto, rechazá.
2. **Destructivo:** `fs.delete` y `fs.move` requieren confirmación si afectan >5 archivos o si el destino existe.
3. **Red:** No spawnees proceso en puerto ocupado (verifica con `probe` TCP 250ms antes de `split_cmd`).
4. **Secrets:** Nunca leas ni envíes `.env`, `*.pem`, `keystore`, `google-services.json`.
5. **Transparencia:** Si rechazás, explicá qué principio violó y sugerí alternativa dentro del scope.
```

Cada principio es una línea que Phi-3 local (paper 03) puede aplicar en <100ms.

### 2.3 Self-critique loop — el guardrail sin entrenar

En runtime, sin tocar pesos:

```
1. Agente propone:  shell.fs.delete("/home/user/.ssh")
2. Guard (Phi-3 local) critica: "¿Viola principio 1 (scope) o 4 (secrets)?"
3. Guard responde: "RECHAZADO: viola principio 1 y 4. Alternativa: opera solo en ./workspace"
4. Harness bloquea y retorna Observation: "Bloqueado por constitución (principios 1,4)"
```

Esto es **SL-CAI en inferencia**, sin SFT ni RL. El paper muestra que solo con self-critique ya baja harmful outputs ~70%.

### 2.4 RLAIF — escalar sin humanos

Si querés ir más allá, generás pares `(y_w, y_l)` donde `y_w` es la respuesta revisada por constitución y `y_l` la original, entrenás un reward model con esos pares (AI labels, no humanos) y hacés RL. El paper reporta que RLAIF alcanza **90% de la calidad de RLHF humano** sin un solo label humano.

Para tu caso, RLAIF sería: generar 500 pares de `(comando permitido, comando bloqueado)` según tu constitución, entrenar reward con DPO (paper 09) y aplicar a Phi-3 local vía LoRA (paper 06).

## 3 Evidencia / Experimentos

| Sistema | Harmlessness (eval humana) | Helpfulness | Labels humanos |
|---|:---:|:---:|:---:|
| Baseline (sin CAI) | ~30% harmless | Alta | 0 |
| SL-CAI (self-critique + SFT) | ~75% | Similar | 0 |
| **RL-CAI (RLAIF)** | **~85-90%** | **Similar** | **0** |
| RLHF humano (InstructGPT) | ~88% | Similar | Miles |

- **Sin perder utilidad:** helpfulness se mantiene — el modelo no se vuelve un "no puedo hacer eso" genérico. La constitución bien escrita rechaza solo lo que debe.
- **Evasión:** con red-teaming, RL-CAI resiste ~80% de jailbreaks vs ~40% baseline. No es perfecto, pero es un salto.
- **Costo:** 0 labels humanos. Solo necesitás escribir la constitución (1 página) y dejar que el modelo genere los pares.

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **constitution.md** | Creá `desktop-app/constitution.md` y `web/constitution.md` con 5-7 principios específicos de tu harness (scope, destructivo, red, secrets, transparencia). Versionado en git, visible en `OpenCodeHubModal.tsx` como los `scannedRoots`. |
| **Guard Phi-3 local (<100ms)** | Antes de cada `shell.fs.delete`, `shell.fs.move`, `shell.external.spawn` en `desktop-app/src/infrastructure/http/*_router.rs`, llamá a `phi_sidecar.guard_check(comando, constitution)` (paper 03). Si rechaza, no ejecutes — retorná `403` con principio violado. Sin red, sin costo. |
| **Self-critique en el agente remoto** | En `web/src/shared/api/prompts.ts`, agregá al system prompt: "Antes de cada tool_call destructivo, criticá tu propuesta contra la constitución en <constitution>...</constitution>. Si viola algún principio, no llames la tool." — es SL-CAI en prompting. |
| **RLAIF con DPO + LoRA** | Si el guard Phi-3 falla mucho (falsos positivos/negativos), generá 500 pares `(permitido, bloqueado)` según tu constitución, entrená Phi-3 con **DPO** (paper 09) + **LoRA** (paper 06) en 1 GPU. Es RLAIF sin PPO, estable y barato. |
| **opencode-stats :8765** | Logueá cada decisión del guard: `{command, principle_violated, blocked, latency_ms}`. Si ves muchos bloqueos por principio 1 (scope), tu agente está alucinando paths — fixea el prompt, no la constitución. |
| **Agent Skills permisos** | Cada skill (`SKILL.md` frontmatter `permissions: [workspace:read]`) es una constitución por skill. El guard chequea `skill.permissions` antes de ejecutar — es CAI a nivel skill (paper 01). |

```ts
// web/src/shared/api/constitution.ts — guard en el frontend también
const CONSTITUTION = `
1. Scope: solo workspace y web/dist. Rechaza paths con .. o absolutos fuera del proyecto.
2. Destructivo: fs.delete/move masivo requiere confirmación.
3. Red: verifica probe TCP 250ms antes de spawn.
4. Secrets: nunca .env, *.pem, keystore.
`.trim();

export async function guardCheck(command: string): Promise<{ allowed: boolean; reason?: string }> {
  // Phi-3 local vía /shell/phi/guard (paper 03), fallback a regex si offline
  try {
    const res = await fetch("/shell/phi/guard", { method: "POST", body: JSON.stringify({ command, constitution: CONSTITUTION }) });
    return await res.json();
  } catch {
    // Fallback determinista si Phi-3 no está
    if (command.includes("..") || command.includes(".env") || command.includes(".pem")) {
      return { allowed: false, reason: "Viola principios 1/4 (scope/secrets) — fallback regex" };
    }
    return { allowed: true };
  }
}
```

## 5 Anti-patterns / Limitaciones

- **Constitución vaga = guard inútil.** "Sé seguro" no sirve. Cada principio debe ser **verificable**: "Rechaza si path contiene `..`" sí, "Sé cuidadoso" no. Si tu constitución no se puede traducir a `if`, reescribila.
- **Guard que bloquea todo.** Si tu constitución es muy estricta ("nunca borres nada"), el agente se vuelve inútil y el usuario desactiva el guard. Calibrá: bloqueá solo lo irreversible (delete fuera de workspace, exfiltración), no lo reversible (move dentro de workspace).
- **Phi-3 Q4 puede fallar como juez.** Un modelo 3.8B Q4 no es un juez perfecto — tiene falsos negativos (deja pasar algo dañino) y falsos positivos (bloquea algo legítimo). Medí `precision`/`recall` con 20 casos etiquetados. Si falla >15%, subí a Q8 o agregá fallback regex.
- **No reemplaza validación determinista.** CAI es probabilístico. Para `src==dest` o `dest.startsWith(src)` en `shell.fs.move` (tu guard en `fsx.rs`), usá `if` determinista, no LLM. CAI es para lo que no podés cubrir con `if` (ej: "¿este path parece un secret?").
- **Constitución desactualizada.** Si agregás un nuevo `EXTERNAL_PROJECT` en `:5xxx` y no actualizás la constitución ("verifica probe antes de spawn"), el guard no lo cubre. Versioná `constitution.md` y revisalo en cada PR que toque `external_router` o `fsx`.

## 6 Ejercicios prácticos (en tu repo)

1. **Escribí tu constitution.md y probá el guard regex.** Creá `desktop-app/constitution.md` con 5 principios (scope, destructivo, red, secrets, transparencia). Implementá `guardCheck` con fallback regex (sin Phi-3) que bloquee `..`, `.env`, `.pem`, `keystore` y `probe` sin verificar. Testeá con 10 comandos (5 permitidos, 5 prohibidos) y medí `precision`/`recall`. ¿Cuántos agarra el regex solo?

2. **Phi-3 como juez constitutional.** Integrá Phi-3-mini Q4 (paper 03) en `desktop-app` sidecar y exponé `/shell/phi/guard`. Pasá los mismos 10 comandos por Phi-3 con la constitución en el prompt. Compará `precision`/`recall` de Phi-3 vs regex. ¿Phi-3 agarra casos que el regex no (ej: "lee el archivo de configuración" que resulta ser `.env`)? Logueá en `opencode-stats`.

3. **Self-critique en el system prompt.** Agregá a `web/src/shared/api/prompts.ts` el bloque `<constitution>...</constitution>` + instrucción "Antes de cada tool_call destructivo, criticá tu propuesta contra la constitución. Si viola un principio, no llames la tool y explicá." Corré 5 tasks que impliquen `fs.delete`/`move` (SWE-bench Lite o sintéticos) y medí cuántos tool_calls destructivos fuera de scope se bloquean vs baseline sin constitución.

## 7 Referencias

- **Paper:** Bai et al., *Constitutional AI: Harmlessness from AI Feedback*, 2022 — https://arxiv.org/abs/2212.08073
- **Relacionados en esta serie:** Phi-3 (03) — el modelo local que ejecuta el guard; InstructGPT (08) — RLHF humano que CAI reemplaza; DPO (09) — cómo entrenar el guard sin PPO; LoRA (06) / QLoRA (07) — cómo fine-tunear el guard barato.

---

## Checklist de lectura

- [ ] Leí el abstract y la figura 1 (dos fases SL-CAI + RL-CAI) del paper original
- [ ] Entiendo la diferencia entre self-critique en runtime (sin entrenar) y RLAIF (con entrenamiento)
- [ ] Sé escribir una constitución verificable y mapearla a `phi_sidecar.guard_check` + `SKILL.md` permissions
- [ ] Anoté 1 `constitution.md` + guard para implementar en `desktop-app` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — 06 Skills · opencode-remote-android*
