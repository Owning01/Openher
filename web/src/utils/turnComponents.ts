// Actividad del turno agrupada POR COMPONENTE (25-sep).
//
// Antes: la caja "Working" listaba todas las tools en una sola lista plana, sin
// decir quién las hizo. Ahora cada componente (el agente principal y cada
// subagente) tiene su PROPIA fila con un resumen ("3 Edited · 2 Ran"), y al
// desacoplarla se ve todo su detalle (edited / ran / shell / read...).
//
// Las tarjetas de subagente NO entran en el grupo: van afuera de la caja, en el
// chat, con el mismo tamaño que una tool pero en gris y sin icono (pedido del
// usuario), porque no son "actividad del agente principal" sino una delegación.
import { isTaskToolPart, toolVerb } from "./toolName"
import { subagentBackground } from "./subagentBackground"
import type { RenderedToolPart } from "../types"

export type TurnComponent = {
  /** "main" o el id de la sesión del subagente. */
  key: string
  /** Nombre legible del componente. */
  label: string
  /** Sesión del subagente, si el componente es uno. */
  childSessionID: string | null
  /** Tools del componente (nunca incluye tarjetas de subagente). */
  parts: RenderedToolPart[]
  /** "3 Edited · 2 Ran": conteo por verbo, en el orden en que aparecen. */
  summary: string
}

export type SplitActivity = {
  components: TurnComponent[]
  /** Tarjetas de subagente, para pintarlas fuera de la caja. */
  subagentParts: RenderedToolPart[]
}

/** Etiqueta de la tarjeta de subagente: su descripción, o el id como plan B. */
export function subagentLabel(part: RenderedToolPart): string {
  const input = part.state?.input as { description?: unknown } | undefined
  const desc = input?.description
  if (typeof desc === "string" && desc.trim()) return desc.trim()
  const child = subagentBackground(part).childSessionID
  return child ? child.slice(0, 8) : "subagent"
}

function summarize(parts: RenderedToolPart[]): string {
  // "3 Edited · 2 Ran": una cuenta por verbo, en el orden de primera aparición.
  const counts = new Map<string, number>()
  for (const p of parts) {
    const verb = toolVerb(p.tool)
    counts.set(verb, (counts.get(verb) ?? 0) + 1)
  }
  return [...counts].map(([verb, n]) => `${n} ${verb}`).join(" · ")
}

/**
 * Parte la lista de tools del turno en componentes + tarjetas de subagente.
 * Puro: no toca el DOM ni i18n (los verbos salen de `toolVerb`).
 */
export function splitActivityByComponent(parts: RenderedToolPart[]): SplitActivity {
  const subagentParts: RenderedToolPart[] = []
  const byKey = new Map<string, TurnComponent>()

  for (const p of parts) {
    if (isTaskToolPart(p)) {
      subagentParts.push(p)
      continue
    }
    const child = subagentBackground(p).childSessionID
    const key = child ?? "main"
    let group = byKey.get(key)
    if (!group) {
      group = {
        key,
        // El principal no lleva etiqueta: la caja ya se titula "Working" y una
        // fila que dice "main" no le aporta nada. Los subagentes sí, con su id.
        label: child ? child.slice(0, 8) : "",
        childSessionID: child,
        parts: [],
        summary: "",
      }
      byKey.set(key, group)
    }
    group.parts.push(p)
  }

  const components = [...byKey.values()]
  for (const c of components) c.summary = summarize(c.parts)
  // El principal primero: es el que esta leyendo el chat.
  components.sort((a, b) => (a.key === "main" ? -1 : b.key === "main" ? 1 : 0))
  return { components, subagentParts }
}
