import { describe, it, expect } from "vitest"
import { extractUserPrompts } from "./promptHistory"
import type { RenderedMessage } from "../types"

function msg(id: string, role: string, text: string, created: number, sessionID = "s1"): RenderedMessage {
  return {
    info: { id, role, sessionID, time: { created } },
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

  it("con sessionID filtra los de otras sesiones y renumera", () => {
    const out = extractUserPrompts([
      msg("u1", "user", "de A", 1, "sA"),
      msg("u2", "user", "de B", 2, "sB"),
      msg("u3", "user", "otro de A", 3, "sA"),
    ], "sA")
    expect(out).toEqual([
      { id: "u1", text: "de A", created: 1, n: 1 },
      { id: "u3", text: "otro de A", created: 3, n: 2 },
    ])
  })

  it("sin sessionID no filtra (compat)", () => {
    const out = extractUserPrompts([msg("u1", "user", "a", 1, "sA"), msg("u2", "user", "b", 2, "sB")])
    expect(out).toHaveLength(2)
  })
})
