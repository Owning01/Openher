import { describe, it, expect, beforeEach } from "vitest"
import {
  saveChatAnchor,
  loadChatAnchor,
  resolveInitialIndex,
  __clearChatAnchors,
} from "./chatAnchor"

function msgs(n: number) {
  return Array.from({ length: n }, (_, i) => ({ info: { id: `m${i}` } }))
}

beforeEach(() => {
  __clearChatAnchors()
  sessionStorage.clear()
})

describe("chatAnchor", () => {
  it("sin memoria entra abajo (último índice)", () => {
    expect(resolveInitialIndex(msgs(50), "s1")).toBe(49)
  })

  it("retorno a mitad por id de mensaje", () => {
    saveChatAnchor("s1", { kind: "at", messageId: "m10" })
    expect(loadChatAnchor("s1")).toEqual({ kind: "at", messageId: "m10" })
    expect(resolveInitialIndex(msgs(50), "s1")).toBe(10)
  })

  it("id podado (revert) cae abajo, nunca arriba", () => {
    saveChatAnchor("s1", { kind: "at", messageId: "m999" })
    expect(resolveInitialIndex(msgs(50), "s1")).toBe(49)
  })

  it("fondo explícito entra abajo", () => {
    saveChatAnchor("s1", { kind: "bottom" })
    expect(resolveInitialIndex(msgs(50), "s1")).toBe(49)
  })

  it("lista vacía no resuelve índice", () => {
    expect(resolveInitialIndex([], "s1")).toBeUndefined()
  })
})
