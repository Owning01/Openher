import { describe, it, expect } from "vitest"
import { buildTurnActivity } from "./turnActivity"
import type { RenderedMessage } from "../types"

// Regresión del agrupado "Trabajado": los textos intermedios del asistente
// (los que acompañan tools y NO son la respuesta final) siguen visibles en el
// chat mientras el turno trabaja, y al cerrarse se mudan adentro de la caja.

function msg(id: string, text: string, opts: { closed?: boolean; tool?: boolean } = {}): RenderedMessage {
  return {
    info: { id, role: "assistant", sessionID: "s1", time: { created: 1_000, ...(opts.closed ? { completed: 2_000 } : {}) } },
    parts: [],
    text,
    hasCompaction: false,
    thinkingParts: [],
    toolParts: opts.tool ? [{ id: `c-${id}`, type: "tool", tool: "read", callID: `c-${id}`, state: { status: "completed" } }] : [],
  } as unknown as RenderedMessage
}

function user(id: string): RenderedMessage {
  return {
    info: { id, role: "user", sessionID: "s1", time: { created: 500 } },
    parts: [],
    text: "hace X",
    hasCompaction: false,
    thinkingParts: [],
    toolParts: [],
  } as unknown as RenderedMessage
}

describe("buildTurnActivity: textos intermedios", () => {
  it("el texto del dueño queda en su burbuja: no se traga ni se duplica en la caja", () => {
    const msgs = [user("u1"), msg("a1", "Voy a revisar el archivo", { tool: true }), msg("a2", "Encontré esto")]
    const { swallowed, box } = buildTurnActivity(msgs, new Set(["u1", "a1", "a2"]))
    expect(swallowed.size).toBe(0)
    const act = box.get("a1")!
    expect(act.working).toBe(true)
    // El texto del dueño vive en su burbuja; la caja lleva la actividad.
    expect(act.intermediateTexts).toEqual([])
    expect(act.toolParts).toHaveLength(1)
  })

  it("al cerrar el turno, los intermedios (no el del dueño) van a la caja", () => {
    const msgs = [user("u1"), msg("a1", "dueño", { tool: true, closed: true }), msg("a2", "medio", { closed: true }), msg("a3", "final", { closed: true })]
    const { swallowed, box } = buildTurnActivity(msgs, new Set(["u1", "a1", "a2", "a3"]))
    expect([...swallowed]).toEqual(["a2"])
    expect(box.get("a1")!.intermediateTexts).toEqual([{ id: "a2", text: "medio" }])
  })

  it("la respuesta final del turno nunca se traga", () => {
    const msgs = [user("u1"), msg("a1", "dueño", { tool: true, closed: true }), msg("a2", "final", { closed: true })]
    const { swallowed, box } = buildTurnActivity(msgs, new Set(["u1", "a1", "a2"]))
    expect(swallowed.has("a2")).toBe(false)
    expect(box.get("a1")).toBeTruthy()
  })

  // Invariante que faltaba: el dueño NUNCA puede caer en `swallowed` porque
  // MessageList no monta los mensajes tragados y la caja se iría con la burbuja
  // (el turno cerrado perdía la caja entera).
  it("el dueño de la caja nunca cae en swallowed", () => {
    const msgs = [user("u1"), msg("a1", "Voy a revisar el archivo", { tool: true, closed: true }), msg("a2", "listo", { closed: true })]
    const { box, swallowed } = buildTurnActivity(msgs, new Set(["u1", "a1", "a2"]))
    expect(box.size).toBe(1)
    for (const id of box.keys()) expect(swallowed.has(id)).toBe(false)
  })
})
