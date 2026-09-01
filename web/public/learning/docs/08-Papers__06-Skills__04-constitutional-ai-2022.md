# Constitutional AI — Harmlessness sin labels humanas (Bai et al., 2022)

> **Autores:** Bai et al. / Anthropic
> **Año:** 2022 · **Prioridad:** Complementario · **Lectura:** ~14 min
> **Link verificado:** [https://arxiv.org/abs/2212.08073](https://arxiv.org/abs/2212.08073)
> **Categoría Papers:** 06 Skills · **Nivel:** intro

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

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
- Antes de \"shell.fs.move/delete\" ejecuta chequeo constitutional local: "¿está dentro del scope autorizado? ¿borra fuera de workspace?".
- Define constitution.md para tu harness y haz que Phi-3 la aplique.

## 4. Links
- https://arxiv.org/abs/2212.08073

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
