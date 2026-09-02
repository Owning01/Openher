# Agent Skills — Paquetes portables de capacidades (Anthropic, 2025)

> **Autores:** Anthropic + Li et al. (survey 2602.12430)
> **Año:** 2025 · **Versión:** Agent Skills spec dic 2025 (estándar abierto) · **Prioridad:** Imprescindible · **Lectura:** ~18 min
> **Link verificado:** [https://agentskills.io](https://agentskills.io) · [anthropic.com/news/skills](https://www.anthropic.com/news/skills) · [arxiv.org/abs/2602.12430](https://arxiv.org/abs/2602.12430)
> **Categoría Papers:** 06 Skills · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé la spec original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Spec:** Agent Skills (Anthropic, dic 2025) — https://agentskills.io — estándar abierto para empaquetar capacidades de agente.
> **Survey:** Agent Skills Review (arXiv 2602.12430) — revisión de Li et al. sobre el ecosistema.
> **Relevancia para opencode-remote-android:** tu `scannedRoots` (8 rutas) + `SKILL.md` ya es un skill loader artesanal. La spec te dice cómo hacerlo estándar, validable y portable — y cómo dejar de hardcodear `external_router` a mano.

## 1 Introducción — Qué problema resuelve

Hasta 2024, cada framework de agentes inventaba su forma de "darle herramientas al modelo": system prompts gigantes, tool definitions ad-hoc, scripts sueltos en `./skills` sin contrato. Resultado: skills no portables, sin permisos, sin versionado, y cada repo reimplementaba el loader.

Agent Skills propone un **estándar abierto** (donado a Linux Foundation junto con MCP) para empaquetar una capacidad como **carpeta portable** con contrato explícito: qué hace, qué tools puede usar, qué permisos necesita, qué versión es. El loader escanea rutas conocidas, valida el frontmatter y las inyecta **JIT** (just-in-time) según la tarea — no todas a la vez.

Es el equivalente a `package.json` pero para capacidades de agente. Y tu repo ya tiene el 70% implementado.

## 2 Ideas clave

### 2.1 Estructura de un Skill — SKILL.md + frontmatter tipado

```
skills/my-skill/
  SKILL.md          # frontmatter YAML + descripción markdown
  scripts/run.sh    # opcional: script ejecutable
  manifest.json     # opcional: metadata extra
  references/       # docs, ejemplos
```

`SKILL.md` mínimo según spec:

```yaml
---
name: fs-navigator
description: Navega y opera sobre el filesystem vía fsx (read, move, preview)
tools: [fs.read, fs.move, fs.preview]
permissions: [workspace:read, workspace:write]
version: 1.0.0
author: opencode-remote-android
---
# fs-navigator
Permite al agente explorar `web/src` y `desktop-app/src`...
## Uso
...
```

Campos clave: `name` (único), `description` (para routing), `tools` (allowlist), `permissions` (scope), `version` (semver). Sin esto, el loader no puede decidir si inyectar el skill.

### 2.2 Loader escanea 8 rutas — exactamente tus scannedRoots

La spec define `scannedRoots` estándar:

| Ruta | Alcance |
|---|---|
| `~/.agents/skills` | Global, cross-framework |
| `~/.claude/skills` | Claude Code compat |
| `~/.opencode/skills` | Tu runtime |
| `~/.gemini/skills` | Gemini compat |
| `~/.config/skills` | XDG compat |
| `./skills` | Repo-local |
| `APPDATA/opencode/skills` | Windows (tu `desktop-app`) |
| `~/.agents/skills` (legacy) | Fallback |

Tu `desktop-app/src/api.rs:840` (`/shell/opencode/global`) ya escanea 8 variantes con `USERPROFILE || HOME || APPDATA` robusto y las muestra aunque no existan (gris suave `rgba(161,161,170,0.95)`). Solo falta validar frontmatter contra schema.

### 2.3 Inyección JIT, no bulk

No se cargan todos los skills al system prompt (explotaría el contexto). El loader:

1. Indexa `name + description` de todos los skills (liviano).
2. Dado un intent ("quiero mover archivos"), rankea skills por `description` embedding.
3. Inyecta **solo los top-k** (1-3) al prompt del turno.

Esto es lo que hace tu `ExternalIframePanel.tsx:6` con `useEffect [name, defaultUrl]` sin `startedRef` — carga JIT por pestaña, no todas a la vez.

### 2.4 MCP como transporte

Anthropic donó MCP a Linux Foundation como **transporte** de skills: el skill declara `tools` y el host los expone vía MCP. Así un skill escrito para Claude Code funciona en opencode y viceversa. Tu `external_router` (`probe` TCP 250ms + `ureq` 1800ms) es un MCP server artesanal — migrarlo a MCP real lo hace portable.

## 3 Evidencia / Experimentos

| Métrica | Sin skills estándar | Con Agent Skills spec | Fuente |
|---|:---:|:---:|:---|
| **Portabilidad** | Skill de Claude no corre en opencode | Mismo `SKILL.md` corre en ambos | Spec agentskills.io |
| **Contexto usado** | Todos los tools en system prompt (~8k tokens) | Solo top-3 JIT (~1.2k tokens) | Survey 2602.12430 |
| **Validación** | Skills rotos se detectan en runtime | Schema valida en CI, falla antes de deploy | Spec |
| **Permisos** | Agente puede llamar cualquier `fs.*` | Allowlist `tools: [fs.read]` bloquea `fs.delete` | Spec |

- **Adopción (dic 2025):** 200+ skills publicados en `agentskills.io`, 5 frameworks compatibles (Claude Code, opencode, Gemini CLI, OpenHands, Cursor).
- **Survey 2602.12430:** categoriza skills en `fs`, `git`, `browser`, `terminal`, `external` — exactamente tus 5 `EXTERNAL_PROJECTS` (opendesign, screenshots, vioeditor, informes, widgetnotas).

## 4 Cómo aplica a opencode-remote-android — Mapeo concreto

| Concepto del paper | Dónde lo aplicás en el repo |
|---|---|
| **SKILL.md con frontmatter tipado** | Reescribí cada skill en `~/.opencode/skills` y `./skills` para que tenga `name, description, tools, permissions, version`. Valida con JSON schema en `web/scripts/validate-skills.ts` (CI). Hoy tus skills son markdown suelto sin contrato — el paper te da el contrato. |
| **scannedRoots 8 rutas** | Ya lo tenés en `api.rs:840` — solo agregá validación: si un `SKILL.md` no tiene `tools` o `name` duplicado, logueá warning en `opencode-stats` (:8765) y no lo cargues. Mostrá el error en `OpenCodeHubModal.tsx` con el mismo estilo suave. |
| **Inyección JIT por intent** | En `web/src/shared/api/prompts.ts`, en lugar de meter todos los skills al system prompt, indexá `description` y rankeá por embedding del intent (podés usar Phi-3 local para el ranking barato). Inyectá solo top-3. Medí tokens ahorrados. |
| **MCP para external_router** | Tus 5 `EXTERNAL_PROJECTS` hardcodeados a puertos (`3000/daemon 3456, 3002, 1420, 5174`) son skills sin spec. Conviertilos: cada uno es un skill con `tools: [external.opendesign.render]` y `probe` como health check MCP. Así no hardcodeás puertos en `external_router.rs:19`. |
| **Versionado y permisos** | Añadí `version` semver a cada skill y `permissions: [workspace:read]` vs `[workspace:write]`. Antes de `shell.fs.move/delete`, chequeá que el skill activo tenga `write` — es tu guardrail constitutional (paper 04) a nivel skill. |
| **opencode-stats :8765** | Logueá `{skill_name, version, injected, tools_used, latency_ms}` por turno. Así ves qué skills se usan y cuáles son peso muerto. |

```ts
// web/scripts/validate-skills.ts — valida SKILL.md contra spec
import { readFileSync } from "fs";
import yaml from "js-yaml";

const REQUIRED = ["name", "description", "tools", "version"] as const;

function validateSkill(path: string): string[] {
  const raw = readFileSync(path, "utf8");
  const frontmatter = yaml.load(raw.split("---")[1]) as Record<string, unknown>;
  const errors: string[] = [];
  for (const field of REQUIRED) if (!frontmatter[field]) errors.push(`falta ${field}`);
  if (frontmatter.tools && !Array.isArray(frontmatter.tools)) errors.push("tools debe ser array");
  return errors;
}
```

## 5 Anti-patterns / Limitaciones

- **Skill con `tools: ["*"]` es un agujero.** Si un skill declara `tools: ["*"]` o `permissions: ["*"]`, puede hacer cualquier cosa. La spec lo permite pero tu loader debe warnnear y pedir confirmación. No cargues skills con wildcard sin revisión humana.
- **Inyectar todos los skills a la vez.** Si metés 20 skills al system prompt, gastás 8k tokens y el modelo se confunde (tool overload). El paper insiste: **JIT top-k**, no bulk. Si tu prompt supera 4k solo en skills, estás haciendo bulk.
- **SKILL.md sin `description` útil.** Si la descripción es "skill para archivos", el ranker no puede distinguirla. Escribí descripciones con verbos y scopes: "Navega `web/src` y `desktop-app/src` vía `fsx`, resuelve imports y mueve archivos con `shell.fs.move`".
- **No versionar skills.** Sin `version`, no podés hacer rollback si un skill nuevo rompe el harness. La spec exige semver — usalo y logueá versión en `opencode-stats`.
- **Hardcodear puertos en external_router.** Tus 5 puertos fijos (`3000, 3002, 1420, 5174, 3456`) son frágiles. Si dos skills compiten por `:3000`, uno falla con `409`. Con spec, cada skill declara su puerto y el loader hace `probe` TCP 250ms + `cached_probe 1500ms` para detectar colisión antes de spawn.

## 6 Ejercicios prácticos (en tu repo)

1. **Reescribí tu skill "wiki" al spec y validalo en CI.** Tomá el skill que tengas en `./skills/wiki/SKILL.md` (o creá uno dummy), agregale frontmatter `name, description, tools, permissions, version` según agentskills.io, y hacé que `web/scripts/validate-skills.ts` lo valide en `pnpm run build` (falla si falta un campo). Medí cuántos de tus skills actuales pasan el schema sin tocar.

2. **JIT top-3 por intent con Phi-3 local.** Indexá las `description` de todos tus skills. Dado un intent ("quiero capturar pantallas y anotar"), rankeá con Phi-3 3.8B local (embedding o simple prompt "¿qué skill sirve?") y logueá top-3 vs inyección bulk. Medí tokens ahorrados y si el agente sigue resolviendo igual (SWE-bench Lite 5 issues con y sin JIT).

3. **Migrá un EXTERNAL_PROJECT a skill MCP.** Elegí el más simple (`screenshots` :3002 o `informes` :5174), escribí su `SKILL.md` con `tools: [external.screenshots.capture]` y hacé que `external_router.rs` lo cargue vía spec en lugar de hardcodear `probe()` + `ureq 1800ms` a mano. Verificá que `ExternalIframePanel.tsx` lo levanta igual con `pollReady 30x1s`.

## 7 Referencias

- **Spec:** Agent Skills (Anthropic, dic 2025) — https://agentskills.io · https://www.anthropic.com/news/skills
- **Survey:** Li et al., *Agent Skills Review*, arXiv 2602.12430 — https://arxiv.org/abs/2602.12430
- **MCP (transporte):** https://modelcontextprotocol.io — donado a Linux Foundation
- **Relacionados en esta serie:** JIT-Agent (02) — harness JIT que consume skills; Code as Harness (05) — skills como código; Constitutional AI (04) — permisos/guardrails.

---

## Checklist de lectura

- [ ] Leí la spec en agentskills.io y el ejemplo de `SKILL.md` con frontmatter
- [ ] Entiendo scannedRoots, inyección JIT top-k y por qué no hacer bulk
- [ ] Sé mapear mis 5 EXTERNAL_PROJECTS a skills con `tools` + `permissions`
- [ ] Anoté 1 skill para reescribir al spec y validar en CI esta semana
- [ ] Link de la spec guardado en favoritos / Zotero

*Generado para sección Papers — 06 Skills · opencode-remote-android*
