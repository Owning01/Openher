# Voyager — Skill library que crece sola (Wang et al., 2023)

> **Autores:** Wang et al. / NVIDIA
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~18 min
> **Link verificado:** [https://arxiv.org/abs/2305.16291](https://arxiv.org/abs/2305.16291)
> **Categoría Papers:** 03 Agentes · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

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
- **Skills como código versionado, no prompts:** tu \"wiki skill\" debería ser \"SKILL.md + script + test\" (como Voyager).
- **Librería persistente:** no regenerar skill cada vez; cataloga y reusa (tu \"scannedRoots\" ya escanea, falta ejecutar y verificar).
- **Auto-curriculum:** para lab hacking, deja que el agente proponga siguiente lab según skills dominadas.

## 4. Ejercicio
- Crea una skill \"nmap-quick\" como código (bash + parser) con test que verifique que encuentra puerto 80 en DVWA. Guárdala en \"skills/\".

## 5. Links
- https://arxiv.org/abs/2305.16291

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
