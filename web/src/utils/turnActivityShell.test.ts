import { describe, it, expect } from "vitest"
import { buildTurnActivity } from "./turnActivity"
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

// Resultado de un comando en segundo plano: mensaje `synthetic` (rol distinto de
// assistant) con UN tool part de shell — tal como lo deja `rendered.ts`.
function shellMsg(id: string): RenderedMessage {
  return {
    info: { id, role: "synthetic", sessionID: "s1", time: { created: 3_000 }, metadata: { source: "shell", shellID: "sh_1" } },
    parts: [],
    text: "",
    hasCompaction: false,
    thinkingParts: [],
    toolParts: [{ id: `${id}:shell`, type: "tool", tool: "shell", callID: "sh_1", state: { status: "completed", input: { command: "pnpm test" }, output: "ok" } }],
  } as unknown as RenderedMessage
}

describe("buildTurnActivity con resultados de shell", () => {
  it("acopla el shell a la caja del turno sin robarle el dueño", () => {
    const messages = [
      msg("u1", "user"),
      msg("a1", "assistant", { toolParts: [tool("c1", "read")] }),
      msg("a2", "assistant", { text: "listo" }),
      shellMsg("s1"),
    ]
    const { box, absorbed, swallowed } = buildTurnActivity(messages, new Set(["u1", "a1", "a2", "s1"]))
    expect(box.size).toBe(1)
    // La caja sigue pegada a la respuesta final, no al shell (que llega después).
    const activity = box.get("a2")!
    expect(activity.toolParts.map((t) => t.tool)).toEqual(["read", "shell"])
    expect(activity.working).toBe(false)
    // El shell queda absorbido por la caja; la respuesta final se sigue viendo.
    expect(absorbed.has("s1")).toBe(true)
    expect(absorbed.has("a2")).toBe(false)
    expect(swallowed.has("a2")).toBe(false)
    expect(swallowed.has("s1")).toBe(false)
  })

  it("el shell no cierra el turno: si el assistant sigue abierto, la caja sigue working", () => {
    const open = msg("a1", "assistant", { toolParts: [tool("c1", "read")] })
    open.info.time.completed = undefined
    open.info.finish = undefined
    const { box } = buildTurnActivity([msg("u1", "user"), open, shellMsg("s1")], new Set(["u1", "a1", "s1"]))
    expect(box.get("a1")!.working).toBe(true)
  })

  it("el shell no contamina el turno siguiente", () => {
    const messages = [
      msg("u1", "user"),
      msg("a1", "assistant", { toolParts: [tool("c1", "read")] }),
      shellMsg("s1"),
      msg("u2", "user"),
      msg("a2", "assistant", { toolParts: [tool("c2", "edit")] }),
    ]
    const { box } = buildTurnActivity(messages, new Set(["u1", "a1", "s1", "u2", "a2"]))
    expect(box.size).toBe(2)
    expect(box.get("a1")!.toolParts.map((t) => t.tool)).toEqual(["read", "shell"])
    expect(box.get("a2")!.toolParts.map((t) => t.tool)).toEqual(["edit"])
  })

  it("un shell suelto (sin assistant en su turno) arma su propia caja y no queda working", () => {
    const { box } = buildTurnActivity([msg("u1", "user"), shellMsg("s1")], new Set(["u1", "s1"]))
    expect([...box.keys()]).toEqual(["s1"])
    expect(box.get("s1")!.toolParts.map((t) => t.tool)).toEqual(["shell"])
    expect(box.get("s1")!.working).toBe(false)
  })
})
