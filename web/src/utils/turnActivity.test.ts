import { describe, it, expect } from "vitest"
import { buildTurnActivity, formatDurationMs } from "./turnActivity"
import type { RenderedMessage } from "../types"

function msg(id: string, role: "user" | "assistant", extra: Partial<RenderedMessage> = {}): RenderedMessage {
  return {
    info: { id, role, sessionID: "s1", time: { created: 1_000, completed: 2_000 } },
    parts: [],
    text: extra.text ?? "",
    hasCompaction: false,
    thinkingParts: extra.thinkingParts ?? [],
    toolParts: extra.toolParts ?? [],
    ...(extra.summaryDiffs ? { summaryDiffs: extra.summaryDiffs } : {}),
  } as RenderedMessage
}

const tool = (id: string, name: string) => ({ id, type: "tool", tool: name, callID: id, state: { status: "completed" } })
const think = (id: string, text: string) => ({ id, text })

describe("buildTurnActivity", () => {
  it("agrupa en una sola caja todo el turno (varios mensajes del asistente)", () => {
    const messages = [
      msg("u1", "user", { text: "hacé X" }),
      msg("a1", "assistant", { thinkingParts: [think("t1", "pienso")], toolParts: [tool("c1", "read")] }),
      msg("a2", "assistant", { toolParts: [tool("c2", "edit")] }),
      msg("a3", "assistant", { text: "listo" }),
    ]
    const { box, absorbed } = buildTurnActivity(messages, new Set(["u1", "a1", "a2", "a3"]))
    expect(box.size).toBe(1)
    const activity = box.get("a1")!
    expect(activity.toolParts.map((t) => t.tool)).toEqual(["read", "edit"])
    expect(activity.thinkingParts).toHaveLength(1)
    expect(activity.working).toBe(false)
    // Los demás mensajes del turno no dibujan caja propia.
    expect(absorbed.has("a1")).toBe(false)
    expect(absorbed.has("a2")).toBe(true)
    expect(absorbed.has("a3")).toBe(true)
  })

  it("separa turnos por mensaje del usuario", () => {
    const messages = [
      msg("u1", "user"),
      msg("a1", "assistant", { toolParts: [tool("c1", "read")] }),
      msg("u2", "user"),
      msg("a2", "assistant", { toolParts: [tool("c2", "shell")] }),
    ]
    const { box } = buildTurnActivity(messages, new Set(["u1", "a1", "u2", "a2"]))
    expect(box.size).toBe(2)
    expect(box.get("a1")!.toolParts.map((t) => t.tool)).toEqual(["read"])
    expect(box.get("a2")!.toolParts.map((t) => t.tool)).toEqual(["shell"])
  })

  it("marca working mientras el último mensaje del turno no cerró", () => {
    const open = msg("a2", "assistant", { toolParts: [tool("c2", "shell")] })
    open.info.time.completed = undefined
    open.info.finish = undefined
    const { box } = buildTurnActivity([msg("u1", "user"), msg("a1", "assistant", { toolParts: [tool("c1", "read")] }), open], new Set(["u1", "a1", "a2"]))
    expect(box.get("a1")!.working).toBe(true)
  })

  it("elige el primer mensaje visible del turno como dueño (debajo del prompt)", () => {
    const messages = [
      msg("a1", "assistant", { toolParts: [tool("c1", "read")] }),
      msg("a2", "assistant", { toolParts: [tool("c2", "edit")] }),
    ]
    // Con los dos visibles manda el primero: [user][caja][mensajes…].
    expect([...buildTurnActivity(messages, new Set(["a1", "a2"])).box.keys()]).toEqual(["a1"])
    // a1 quedó fuera de la ventana visible: la caja cae en el más viejo visible.
    expect([...buildTurnActivity(messages, new Set(["a2"])).box.keys()]).toEqual(["a2"])
  })

  it("la caja no cambia de dueño cuando el turno crece (sin saltos)", () => {
    const base = [msg("u1", "user"), msg("a1", "assistant", { toolParts: [tool("c1", "read")] })]
    const first = buildTurnActivity(base, new Set(["u1", "a1"]))
    const grownMessages = [...base, msg("a2", "assistant", { toolParts: [tool("c2", "edit")] }), msg("a3", "assistant", { text: "listo" })]
    const grown = buildTurnActivity(grownMessages, new Set(["u1", "a1", "a2", "a3"]))
    expect([...first.box.keys()]).toEqual(["a1"])
    expect([...grown.box.keys()]).toEqual(["a1"])
  })

  it("no inventa caja sin actividad", () => {
    const { box, absorbed } = buildTurnActivity([msg("u1", "user"), msg("a1", "assistant", { text: "hola" })], new Set(["u1", "a1"]))
    expect(box.size).toBe(0)
    expect(absorbed.size).toBe(0)
  })
})

describe("formatDurationMs", () => {
  it("formatea ms, segundos, minutos y horas", () => {
    expect(formatDurationMs(500)).toBe("500ms")
    expect(formatDurationMs(12_400)).toBe("12.4s")
    expect(formatDurationMs(72_000)).toBe("1m 12s")
    expect(formatDurationMs(3 * 3600_000 + 5 * 60_000)).toBe("3h 5m")
    expect(formatDurationMs(-1)).toBe("")
  })
})
