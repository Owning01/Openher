# REVISAR — plantilla de nota ciega (Fase 3)

> **Regla de oro: el juez no debe saber qué config generó cada acta.**
> Quien prepara los materiales anonimiza las actas como A, B, C… (mezcladas,
> sin `engine`, `participation` ni nombres de config). Quien puntúa solo ve la
> letra, el dilema y el resultado bueno acordado. Recién después se revela el
> mapeo letra → config para el veredicto §9.

## 0. Preparación (la hace alguien que NO puntúa)

1. Correr la matriz: `node run.mjs --dry-run --out ./out` (o matriz real).
2. Elegir 3–6 celdas representativas (p. ej. D09, D14, D17 × configs A–F).
3. Copiar cada acta a una letra ciega (A, B, C…), orden aleatorio por celda.
4. Registrar el mapeo en un archivo aparte (`mapeo-ciego.json`, NO mostrar al juez):
   `{"D09": {"A": "C-similarity", "B": "A-isolated", ...}}`.
5. Entregar al juez solo las secciones 1–3 de este archivo + las actas ciegas.

## 1. Rúbrica (1–5 por criterio, por acta)

| Criterio | 1 | 3 | 5 |
|---|---|---|---|
| Veredicto accionable | Vago / sin decisión | Decide pero con ambigüedad | Decisión clara + próximos pasos |
| Trade-offs | Omite alternativas | Menciona sin comparar | Matriz con costos reales |
| Salvaguardas | Ninguna | Genéricas | Obligatorias y verificables |
| Plan de acción | Sin plan | Pasos sin dueño/orden | Pasos ordenados y acotados |
| Minorías / disenso | Disenso borrado | Mencionado sin contenido | Minoría registrada con su evidencia |

Fidelidad al resultado bueno acordado (ver `cases.json`, campo `goodOutcome`):
`-2` contradice · `0` tangencial · `+2` coincide plenamente. Sumar al total.

## 2. Hoja de puntuación (una fila por acta ciega)

| Celda | Acta | Veredicto | Trade-offs | Salvaguardas | Plan | Minorías | Fidelidad | Total | Comentario (1 línea) |
|---|---|---|---|---|---|---|---|---|---|
| D09 | A | /5 | /5 | /5 | /5 | /5 | −2/0/+2 | /27 | |
| D09 | B | /5 | /5 | /5 | /5 | /5 | −2/0/+2 | /27 | |
| D14 | A | /5 | /5 | /5 | /5 | /5 | −2/0/+2 | /27 | |
| D14 | B | /5 | /5 | /5 | /5 | /5 | −2/0/+2 | /27 | |
| D17 | A | /5 | /5 | /5 | /5 | /5 | −2/0/+2 | /27 | |
| D17 | B | /5 | /5 | /5 | /5 | /5 | −2/0/+2 | /27 | |

(Duplicar filas según las celdas elegidas en §0.)

## 3. Datos del juez

- Juez: ______________ · Fecha: __________ · Celdas evaluadas: __________
- ¿Conocías el mapeo letra → config antes de puntuar? (debe ser NO): ____
- Tiempo total: __________

## 4. Cierre (tras revelar el mapeo — lo hace el coordinador, no el juez)

1. Promediar totales por config → `blind.json`: `{"A-isolated": 21.3, "C-similarity": 20.9, ...}` (escala 1–27, se normaliza en el reporte).
2. Regenerar veredicto: `node report.mjs --in ./out/results.json --out ./out/report.md --blind ./out/blind.json`.
3. Aplicar criterio §9: mejora calidad o ahorro ≥30% sin degradar >2%.
