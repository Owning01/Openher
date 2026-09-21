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
  it("mientras trabaja no se traga ningún texto (siguen visibles en el chat)", () => {
    const msgs = [user("u1"), msg("a1", "Voy a revisar el archivo", { tool: true }), msg("a2", "Encontré esto")]
    const { swallowed, box } = buildTurnActivity(msgs, new Set(["u1", "a1", "a2"]))
    expect(swallowed.size).toBe(0)
    const act = box.get("a2")!
    expect(act.working).toBe(true)
    expect(act.intermediateTexts.map((t) => t.id)).toEqual(["a1"])
  })

  it("al cerrar el turno, el intermedio se traga y queda dentro de la caja", () => {
    const msgs = [user("u1"), msg("a1", "Voy a revisar el archivo", { tool: true, closed: true }), msg("a2", "Encontré esto", { closed: true })]
    const { swallowed, box } = buildTurnActivity(msgs, new Set(["u1", "a1", "a2"]))
    expect([...swallowed]).toEqual(["a1"])
    expect(box.get("a2")!.intermediateTexts).toEqual([{ id: "a1", text: "Voy a revisar el archivo" }])
  })

  it("la respuesta final del turno nunca se traga", () => {
    const msgs = [user("u1"), msg("a1", "intermedio", { closed: true }), msg("a2", "final", { closed: true })]
    const { swallowed, box } = buildTurnActivity(msgs, new Set(["u1", "a1", "a2"]))
    expect(swallowed.has("a2")).toBe(false)
    expect(swallowed.has("a1")).toBe(true)
    // Turno sin tools ni pensamiento: igual nace caja porque hay textos que agrupar.
    expect(box.get("a2")!.intermediateTexts).toHaveLength(1)
  })
})
