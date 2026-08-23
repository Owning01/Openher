import { describe, it, expect } from "vitest"
import { mergeCachedMessages } from "./useOfflineCache"
import type { MessageEnvelope } from "../types"

function msg(id: string, created: number, partIDs: string[]): MessageEnvelope {
  return {
    info: { id, sessionID: "s1", role: "assistant", time: { created } },
    parts: partIDs.map((pid) => ({ id: pid, type: "text", text: `text-${pid}` })),
  }
}

describe("mergeCachedMessages", () => {
  it("une por id sin perder mensajes cached que el snapshot no trae", () => {
    const cached = [msg("m1", 100, ["p1"]), msg("m2", 200, ["p2"])]
    const incoming = [msg("m2", 200, ["p2", "p3"])]
    const merged = mergeCachedMessages(cached, incoming)
    const ids = merged.map((m) => m.info.id)
    expect(ids).toContain("m1")
    expect(ids).toContain("m2")
  })

  it("un mensaje presente en ambos hace union por part (conserva parts cached)", () => {
    // App cerrada a mitad de stream: el snapshot nuevo de m2 trae SOLO p3,
    // pero la caché ya tenía p2 completo → no debe perderse.
    const cached = [msg("m2", 200, ["p1", "p2"])]
    const incoming = [msg("m2", 200, ["p3"])]
    const merged = mergeCachedMessages(cached, incoming)
    const m2 = merged.find((m) => m.info.id === "m2")!
    expect(m2.parts.map((p) => p.id).sort()).toEqual(["p1", "p2", "p3"])
  })

  it("el part nuevo reemplaza al cached de la misma id (texto streamed más completo)", () => {
    const cached = [msg("m2", 200, ["p1"])]
    const incoming = [{ ...msg("m2", 200, ["p1"]), parts: [{ id: "p1", type: "text", text: "versión nueva" }] }]
    const merged = mergeCachedMessages(cached, incoming)
    const m2 = merged.find((m) => m.info.id === "m2")!
    expect(m2.parts).toHaveLength(1)
    expect(m2.parts[0].text).toBe("versión nueva")
  })

  it("sortDesc=true ordena nuevos primero (slice de retención)", () => {
    const merged = mergeCachedMessages([], [msg("a", 100, ["1"]), msg("b", 300, ["2"]), msg("c", 200, ["3"])])
    expect(merged.map((m) => m.info.id)).toEqual(["b", "c", "a"])
  })

  it("sortDesc=false ordena antiguos primero (preload)", () => {
    const merged = mergeCachedMessages([], [msg("a", 100, ["1"]), msg("b", 300, ["2"])], false)
    expect(merged.map((m) => m.info.id)).toEqual(["a", "b"])
  })

  it("ignora ítems corruptos (sin info.id)", () => {
    const dirty = [{ ...msg("ok", 1, ["x"]), info: null }] as unknown as MessageEnvelope[]
    const merged = mergeCachedMessages(dirty, [msg("ok", 1, ["x"])])
    expect(merged).toHaveLength(1)
  })

  it("mensajes con created 0 no rompen el sort", () => {
    const zero = { ...msg("z", 0, ["1"]) }
    const merged = mergeCachedMessages([], [msg("a", 100, ["2"]), zero])
    expect(merged).toHaveLength(2)
  })
})