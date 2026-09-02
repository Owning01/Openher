# Definition of Ready — filtro de entrada al sprint

Una historia puede elegirse en Planning solo si cumple TODO:

- [ ] **Valor claro en una frase** ("como usuario quiero X para Y")
- [ ] **Criterios de aceptación escritos** (2–5 bullets verificables)
- [ ] **Estimada** en puntos según `05-metricas.md`
- [ ] **≤ 5 puntos** o partida en subtareas
- [ ] **Dependencias identificadas** (archivos/módulos que toca, servers necesarios)
- [ ] **Ejecutable por IA**: con los criterios + DoD, un subagente podría hacerla sin preguntar nada

## Criterios de aceptación — formato

```markdown
Dado <estado inicial>
Cuando <acción del usuario>
Entonces <resultado observable>
```

Mínimo un escenario feliz + un caso borde.

## Antipatrones que bloquean Ready

| Antipatrón | Fix |
|---|---|
| "Mejorar la UI" | Convertir en criterios medibles (tiempo, comportamiento específico) |
| "Refactorizar App.tsx" | Definir qué sale y hacia dónde (ej. PB-002: grid → desktop-workspace) |
| "Investigar SSE" | Timeboxed como tarea dentro de una historia, no historia en sí |
