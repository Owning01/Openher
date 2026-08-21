# Guía Solo-Scrum — Framework adaptado a 1 persona

Scrum original asume un equipo. Con una sola persona el riesgo no es la coordinación,
sino la **contaminación de roles**: el que quiere shipear (Dev) le gana al que prioriza
(PO) y nadie inspecciona el proceso (SM). La solución es separar los roles en
**sombreros** con momentos y reglas propias.

## Principios (los 3 pilares, traducidos)

| Pilar | En solo-scrum significa |
|---|---|
| Transparencia | El backlog y los sprints viven en el repo (esta carpeta), no en tu cabeza |
| Inspección | Viernes mirás qué salió, sin defensas: los tests y el dispositivo mandan |
| Adaptación | Cada retro produce máx. 2 cambios concretos para el sprint siguiente |

## Los 3 sombreros

| Sombrero | Cuándo lo ponés | Pregunta guía | Regla |
|---|---|---|---|
| 🎩 **Product Owner** | Planning (lunes) + Refinement (miércoles) | "¿Qué da más valor al usuario del APK/desktop?" | Ordena `02-product-backlog.md`. No toca código en ese momento |
| 🎩 **Scrum Master** | Daily (5 min) + Retro (viernes) | "¿Qué está frenando el avance?" | Protege el objetivo del sprint: si aparece algo nuevo → va al backlog, NO al sprint |
| 👨‍💻 **Developer** | Todo el resto del tiempo | "¿Esto cumple la DoD?" | Trabaja 1 historia a la vez (WIP límite: 2 si hay bloqueo de build) |

**Truco del cambio de sombrero:** cambiar de ubicación física o abrir el archivo
correspondiente (backlog = PO, retro = SM). Suena tonto; funciona porque corta el modo
"codear sin pensar".

## Eventos adaptados

### Sprint Planning — lunes, 30 min
1. Recordar el objetivo del sprint anterior (2 min).
2. PO: leer el top del backlog y proponer el **objetivo del sprint en UNA frase** (10 min).
3. Elegir historias hasta agotar capacidad (~9–12 pts por defecto) (10 min).
4. Developer: desglosar cada historia en tareas verificables en el plan (8 min).

> El objetivo es un resultado medible ("el composer no pierde texto en el APK"),
> nunca una lista de features.

### Daily — inicio del día, 5 min escritos
Completar la fila del día en `daily-log.md`:

```
Ayer logré / Hoy hago / Bloqueos / Nota de sombrero (si corresponde)
```

Si escribís "avanzando con X" tres días seguidos, el Scrum Master interno debe
intervenir: la historia es demasiado grande → partirla.

### Refinement — miércoles, 20 min
- Reordenar el backlog top-10.
- Partir historias > 5 pts.
- Estimar las nuevas con la tabla de puntos de `05-metricas.md`.

### Sprint Review — viernes, 20 min
1. Correr la DoD completa (`03-definicion-done.md`) sobre TODO lo del sprint.
2. Prueba real según alcance: APK en el teléfono (`deploy-apk.ps1`) o
   `build-desktop.ps1 -Run`.
3. Marcar historias como Done **solo si pasan todo**; lo demás vuelve al backlog
   top (no se arrastra por inercia).

### Retrospectiva — viernes, 15 min
Plantilla `_template-retro.md`: Bien / Mejorar / Probar + máximo **2 acciones**
concretas para el sprint siguiente. Una acción que no se cumplió dos sprints seguidos
se descarta o se convierte en historia del backlog.

## Artefactos

| Artefacto | Dónde vive | Compromiso asociado |
|---|---|---|
| Product Backlog | `02-product-backlog.md` | Prioridad clara del top-10 |
| Sprint Backlog | `sprints/sprint-<w>/sprint-plan.md` | Objetivo único + historias + tareas |
| Incremento | `origin/main` verde + tag `sprint/w<N>-done` | Cumple DoD |

## Reglas del juego (anti-trampas típicas del solo-dev)

1. **Un objetivo por sprint.** Si en planning no entra en una frase, es demasiado.
2. **WIP ≤ 2.** Una historia activa + una pausada por bloqueo máximo.
3. **Lo urgente va al backlog, no al sprint.** Excepción: bug que rompe `main`
   → arreglar y anotarlo como impedimento en el daily.
4. **No mover el arco en el medio.** Cambiar el objetivo requiere cancelar el sprint
   (evento raro, documentarlo en la retro).
5. **El sprint cierra el viernes aunque falte.** Lo faltante se re-estima lunes;
   nunca "estiro el sprint unos días".
6. **Duración: 1 semana.** Con 1 persona, sprints de 2 semanas pierden foco.
7. **Subagentes/IA son parte del Dev.** Las historias deben estar tan bien definidas
   que otra IA pueda ejecutarlas (por eso existe la DoR).
