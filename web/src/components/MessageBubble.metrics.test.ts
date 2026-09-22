import { describe, it, expect } from "vitest"
import { calcDuration, calcTokensPerSecond } from "./MessageBubble"
import type { RenderedMessage } from "../types"

// Métricas del footer: el tiempo de trabajo va del mensaje del USUARIO al
// `completed` del asistente, y el tok/s usa el fin del STREAMING (`streamed`),
// no `completed` (que incluye el tiempo de tools: medido 10.5 vs 43.4 tok/s).

function msg(over: {
  created: number
  streamed?: number
  completed?: number
  finish?: string
  output?: number
  reasoning?: number
}): RenderedMessage {
  return {
    info: {
      id: "msg_test",
      role: "assistant",
      sessionID: "s1",
      time: { created: over.created, streamed: over.streamed, completed: over.completed },
      finish: over.finish,
      tokens: { input: 0, output: over.output ?? 0, reasoning: over.reasoning ?? 0, cache: { read: 0, write: 0 } },
    },
    parts: [],
    text: "",
  } as unknown as RenderedMessage
}

describe("calcTokensPerSecond (velocidad de generación)", () => {
  it("con tools usa `streamed` (no `completed`) — caso medido 499 tok en 11.5s vs 47.4s", () => {
    const m = msg({ created: 1_000, streamed: 12_485, completed: 48_382, finish: "tool-calls", output: 499 })
    expect(calcTokensPerSecond(m)).toBe("43.4 tok/s")
  })

  it("sin `streamed` cae a `completed` (compatibilidad)", () => {
    const m = msg({ created: 1_000, completed: 11_000, finish: "stop", output: 100 })
    expect(calcTokensPerSecond(m)).toBe("10.0 tok/s")
  })

  it("suma reasoning al output y no muestra nada si no completó o es muy corto", () => {
    const m = msg({ created: 1_000, streamed: 5_000, completed: 5_100, finish: "stop", output: 4, reasoning: 106 })
    expect(calcTokensPerSecond(m)).toBe("27.5 tok/s")
    expect(calcTokensPerSecond(msg({ created: 1_000, streamed: 1_300, completed: 1_300, finish: "stop", output: 50 }))).toBe("")
    expect(calcTokensPerSecond(msg({ created: 1_000, output: 50 }))).toBe("")
  })
})

describe("calcDuration (tiempo de trabajo del turno)", () => {
  it("va del mensaje del usuario al completed del asistente", () => {
    const m = msg({ created: 1_790_049_849_833, completed: 1_790_049_853_931, finish: "stop" })
    // 4483ms desde el user.created del ejemplo real => 4.5s
    expect(calcDuration(m, 1_790_049_849_448)).toBe("4.5s")
  })

  it("sin prevUserTs cae al created del asistente (conducta previa)", () => {
    const m = msg({ created: 1_000, completed: 5_098, finish: "stop" })
    expect(calcDuration(m, undefined)).toBe("4.1s")
  })

  it("no muestra en pasos intermedios ni en curso", () => {
    expect(calcDuration(msg({ created: 1_000, completed: 6_000, finish: "tool-calls" }), 1_000)).toBe("")
    expect(calcDuration(msg({ created: 1_000, completed: 6_000, finish: "unknown" }), 1_000)).toBe("")
    expect(calcDuration(msg({ created: 1_000 }), 1_000)).toBe("")
  })
})
