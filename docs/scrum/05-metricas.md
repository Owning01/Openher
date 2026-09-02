# Métricas — velocity y burndown

## Definición de puntos (estimación relativa, Fibonacci recortado)

| Pts | Significado | Ejemplo real |
|---|---|---|
| 1 | ≤ 1 h, cambio acotado, sin riesgos | PB-011 auditar claves i18n |
| 2 | Medio bloque, QA en dispositivo incluido | PB-001 QA composer en APK |
| 3 | Bloque completo o incertidumbre media | PB-007 telemetría SSE |
| 5 | Varios archivos + tests + riesgo de regresión | PB-003 split shellPanels |
| 8 | Día(s) entero(s), migración estructural | PB-002 desmontar grid de App.tsx |

> Si al estimar dudás entre 5 y 8 → es 8 y hay que partirla.

## Velocity

Se calcula al cerrar cada sprint (solo historias Done según DoD). Con 3 sprints
tenés el promedio para planificar con confianza.

| Sprint | Comprometido | Done | Velocity | Notas |
|---|---|---|---|---|
| w34 | 9 | — | — | Sprint de adopción del método |
| w35 | | | | |
| w36 | | | | |

**Capacidad por defecto:** 9–12 pts/semana. Ajustar con datos reales, no con deseo.

## Burndown simple (por sprint)

Completar día a día en el `sprint-plan.md` del sprint:

```
Pts restantes
L: 9   M: 9   X: 7   J: 4   V: 0   ← línea ideal
L: 9   M: 8   X: 7   J: 3   V: _   ← real
```

Patrón sano: plano lunes-marita (planning/setup), caída fuerte miércoles-jueves.
Plano hasta jueves = sprint en riesgo → el SM interno corta scope el jueves, no el viernes.

## KPIs mínimos (los únicos 3 que importan)

1. **Velocity estable** ±20% entre sprints.
2. **DoD incumplida = 0** (nada se marca Done "casi").
3. **Impedimentos resueltos < 48 h** o escalados a backlog.

Todo lo demás (coverage %, gráficos lindos) es opcional; no confundir métricas con trabajo.
