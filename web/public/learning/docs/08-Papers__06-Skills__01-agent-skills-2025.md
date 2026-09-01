# Agent Skills — Paquetes portables de capacidades (Anthropic, 2025)

> **Autores:** Anthropic + Li review
> **Año:** 2025 · **Prioridad:** Imprescindible · **Lectura:** ~18 min
> **Link verificado:** [https://agentskills.io](https://agentskills.io)
> **Categoría Papers:** 06 Skills · **Nivel:** avanzado

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Spec:** Agent Skills (Anthropic dic 2025, estándar abierto) — https://agentskills.io — https://www.anthropic.com/news/skills
> **Survey:** Agent Skills Review 2602.12430 (arxiv)
> **Prioridad:** Imprescindible — *tu scannedRoots ya existe*

## 1. Resumen
Skills = **paquetes portables** (SKILL.md frontmatter + scripts + tools permitidos) que se inyectan JIT. Espec: \"name, description, tools: [fs.read, git.status], permissions, version\". MCP donated a Linux Foundation como transporte.

## 2. Estructura
```
skills/my-skill/
  SKILL.md  # frontmatter: name, description, tools, permissions
  scripts/run.sh
  manifest.json
```
Loader escanea \"~/.agents/skills, ~/.claude/skills, ~/.opencode/skills, ./skills\" — exactamente tus 8 scannedRoots.

## 3. Mapeo
- Estandariza tus skills con agentskills.io spec: añade \"tools\" y \"permissions\" al SKILL.md.
- Convierte \"open-design\" externo en skill MCP instalada, no ruta hardcodeada :3000.
- Valida skills en CI (schema).

## 4. Ejercicio
- Reescribe tu skill \"wiki\" al spec oficial y haz que loader valide frontmatter.

## 5. Links
- https://agentskills.io
- https://arxiv.org/abs/2602.12430

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
