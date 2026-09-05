import { describe, it, expect } from "vitest"
import { extractUserPrompts } from "./promptHistory"
import type { RenderedMessage } from "../types"

function msg(id: string, role: string, text: string, created: number): RenderedMessage {
  return {
    info: { id, role, sessionID: "s1", time: { created } },
    parts: [],
    text,
    hasCompaction: false,
    thinkingParts: [],
    toolParts: [],
  }
}

describe("extractUserPrompts", () => {
  it("devuelve solo mensajes user con texto, numerados en orden", () => {
    const out = extractUserPrompts([
      msg("a1", "assistant", "hola", 3),
      msg("u1", "user", "  primer prompt  ", 1),
      msg("u2", "user", "   ", 2),
      msg("u3", "user", "segundo", 4),
    ])
    expect(out).toEqual([
      { id: "u1", text: "primer prompt", created: 1, n: 1 },
      { id: "u3", text: "segundo", created: 4, n: 2 },
    ])
  })

  it("lista vacía sin prompts", () => {
    expect(extractUserPrompts([msg("a1", "assistant", "x", 1)])).toEqual([])
    expect(extractUserPrompts([])).toEqual([])
  })
})
