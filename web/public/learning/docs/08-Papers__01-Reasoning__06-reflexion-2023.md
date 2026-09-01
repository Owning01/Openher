# Reflexion — Aprendizaje verbal sin pesos (Shinn et al., 2023)

> **Autores:** Shinn et al. / NYU
> **Año:** 2023 · **Prioridad:** Muy recomendado · **Lectura:** ~16 min
> **Link verificado:** [https://arxiv.org/abs/2303.11366](https://arxiv.org/abs/2303.11366)
> **Categoría Papers:** 01 Reasoning · **Nivel:** intermedio

> ⚠️ Nota: resumen destilado para *opencode-remote-android*. Leé el paper original para profundidad completa. Todo uso debe respetar licencias y scopes autorizados.

---

> **Paper:** Reflexion: Language Agents with Verbal Reinforcement Learning (Shinn et al., NeurIPS 2023).
> **Link:** https://arxiv.org/abs/2303.11366 — github.com/noahshinn/reflexion
> **Prioridad:** Muy recomendado

## 1. Resumen
Tras fallar (test no pasa), el agente genera **reflexión verbal** (qué hizo mal, cómo mejorar) y la guarda en memoria episódica. En siguiente intento la lee y mejora sin actualizar pesos. AlfWorld 55%→78%, HotpotQA 30%→48% en 2-3 trials.

## 2. Loop
`act → observe → fail → reflect("olvidé instalar dep") → memory → retry`

## 3. Aplica a opencode-remote-android
- En \(hooks/useMessages.ts\): cuando \(sendPrompt\) falla o test no pasa, guarda \{task, error, reflection\} en IndexedDB.
- En próximo retry, inyecta \"Reflexión previa: ...\" como contexto. No tirar historial.
- Úsalo para \(ptyx\) errores de compilación: guarda \"cargo check falló por missing import X\".

## 4. Ejercicio
- Añade tabla \"reflections\" en IndexedDB v2 y muestrala en UI de sesión como "lecciones aprendidas".

## 5. Links
- https://arxiv.org/abs/2303.11366

---

## Checklist de lectura
- [ ] Leí el abstract y la intro del paper original
- [ ] Entiendo el trade-off coste vs calidad para mi harness
- [ ] Anoté 1 idea para probar en `desktop-app` o `web/src` esta semana
- [ ] Link del paper guardado en favoritos / Zotero

*Generado para sección Papers — Aprendizaje · opencode-remote-android*
