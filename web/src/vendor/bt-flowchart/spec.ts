// Payload del bloque ```flowchart (id bt-flowchart del catálogo anim-lab).
// El agente escribe JSON con steps+edges; aquí se valida antes de renderizar:
// un JSON malo no debe tumbar el chat, devuelve null y el bloque se muestra
// como código normal (fallback en components/Markdown.tsx).
// El ErrorBoundary de la raíz es el único de la app: un JSON que llegue con
// un objeto donde va un string tumbaría TODA la app, no sólo este mensaje.
import type { Edge, StepNode } from "./Flowchart"

export type FlowchartSpec = { steps: StepNode[]; edges?: Edge[] }

// Techos contra DoS de render: el layout del fork es O(filas×steps) en rowH +
// O(edges×steps) en bezier y usa Math.max(...spread) por fila.
export const MAX_STEPS = 100
export const MAX_EDGES = 200

function isFiniteNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v)
}

// title/caption/kind van como hijos de React: un objeto donde va un string
// lanza "Objects are not valid as a React child" y el ErrorBoundary raíz
// tumbaría toda la app. Nada de eso llega al canvas sin pasar por acá.
function isShortString(v: unknown, max: number): v is string {
  return typeof v === "string" && v.length <= max
}

export function parseFlowchartSpec(raw: string): FlowchartSpec | null {
  try {
    // JSON.parse revienta con BOM (JSON válido llegado del portapapeles).
    const data = JSON.parse(raw.replace(/^﻿/, "")) as { steps?: unknown; edges?: unknown }
    if (!Array.isArray(data.steps) || data.steps.length === 0) return null
    if (data.steps.length > MAX_STEPS) return null

    const steps: StepNode[] = []
    const ids = new Set<string>()
    for (const candidate of data.steps) {
      const n = candidate as Partial<StepNode>
      if (
        typeof n?.id !== "string" ||
        n.id.length > 200 ||
        !isFiniteNumber(n.row) ||
        !isFiniteNumber(n.x) ||
        !isFiniteNumber(n.w)
      ) {
        return null
      }
      // Ids duplicados = keys duplicadas + colisión en el Map de refs.
      if (ids.has(n.id)) return null
      ids.add(n.id)
      if (n.title !== undefined && !isShortString(n.title, 300)) return null
      if (n.caption !== undefined && !isShortString(n.caption, 1000)) return null
      if (n.condition !== undefined && typeof n.condition !== "boolean") return null
      if (n.kind !== undefined) {
        const k = n.kind as { label?: unknown; hue?: unknown }
        if (typeof k !== "object" || k === null) return null
        if (!isShortString(k.label, 60) || !isShortString(k.hue, 64)) return null
      }
      steps.push(n as StepNode)
    }

    // Solo se conservan aristas entre nodos existentes (y no self-edges): el
    // canvas del fork resuelve from/to con find()! y un id suelto rompería el
    // render. 1 arista mala no debe tirar todo el diagrama.
    const edges: Edge[] = []
    if (Array.isArray(data.edges)) {
      if (data.edges.length > MAX_EDGES) return null
      const seen = new Set<string>()
      for (const candidate of data.edges) {
        const e = candidate as Partial<Edge>
        if (typeof e?.from !== "string" || typeof e?.to !== "string") continue
        if (e.from === e.to) continue
        if (!ids.has(e.from) || !ids.has(e.to)) continue
        const key = `${e.from} ${e.to}`
        if (seen.has(key)) continue
        seen.add(key)
        edges.push({ from: e.from, to: e.to })
      }
    }

    return { steps, edges: edges.length > 0 ? edges : undefined }
  } catch {
    return null
  }
}
