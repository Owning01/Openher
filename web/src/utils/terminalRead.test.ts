import { describe, it, expect, vi, afterEach } from "vitest"
import {
  appendTerminalOutput,
  readTerminal,
  stripAnsi,
  resetTerminalBuffer,
  isTerminalIdle,
  terminalIdleFor,
  waitForIdle,
  waitForOutput,
} from "./terminalRead"

const TAB = "t1"

afterEach(() => {
  resetTerminalBuffer(TAB)
  vi.useRealTimers()
})

describe("terminalRead", () => {
  it("acumula salida y la devuelve sin ANSI", () => {
    appendTerminalOutput(TAB, "\u001b[32mok\u001b[0m salida\r")
    const text = readTerminal(TAB)
    expect(text).toContain("ok salida")
    expect(text).not.toContain("\u001b")
  })

  it("decodifica bytes (Uint8Array)", () => {
    appendTerminalOutput(TAB, new TextEncoder().encode("hola"))
    expect(readTerminal(TAB)).toBe("hola")
  })

  it("devuelve solo la cola pedida", () => {
    appendTerminalOutput(TAB, "a".repeat(5000))
    const tail = readTerminal(TAB, 100)
    expect(tail.length).toBe(100)
  })

  it("marca actividad con solo control (proceso vivo)", () => {
    appendTerminalOutput(TAB, "\u001b[0m")
    expect(terminalIdleFor(TAB)).toBeLessThan(1000)
  })

  it("reset limpia el buffer", () => {
    appendTerminalOutput(TAB, "algo")
    resetTerminalBuffer(TAB)
    expect(readTerminal(TAB)).toBe("")
    expect(terminalIdleFor(TAB)).toBe(Number.POSITIVE_INFINITY)
  })

  it("waitForIdle resuelve cuando la salida se detiene", async () => {
    vi.useFakeTimers()
    appendTerminalOutput(TAB, "listo")
    const p = waitForIdle(TAB, { idleMs: 300, timeoutMs: 5000, pollMs: 50 })
    await vi.advanceTimersByTimeAsync(400)
    const res = await p
    expect(res.timedOut).toBe(false)
    expect(res.text).toContain("listo")
  })

  it("waitForIdle corta por timeout si la salida no para", async () => {
    vi.useFakeTimers()
    const p = waitForIdle(TAB, { idleMs: 100000, timeoutMs: 200, pollMs: 50 })
    // salida continua: nunca queda idle
    const tick = setInterval(() => appendTerminalOutput(TAB, "."), 20)
    await vi.advanceTimersByTimeAsync(400)
    clearInterval(tick)
    const res = await p
    expect(res.timedOut).toBe(true)
  })

  it("waitForOutput espera salida nueva posterior a `since`", async () => {
    vi.useFakeTimers()
    appendTerminalOutput(TAB, "viejo")
    const since = Date.now()
    const p = waitForOutput(TAB, { since, timeoutMs: 1000, pollMs: 20 })
    await vi.advanceTimersByTimeAsync(100)
    appendTerminalOutput(TAB, " nuevo")
    await vi.advanceTimersByTimeAsync(100)
    const res = await p
    expect(res.appeared).toBe(true)
    expect(res.text).toContain("nuevo")
  })

  it("isTerminalIdle respeta el umbral", () => {
    appendTerminalOutput(TAB, "x")
    expect(isTerminalIdle(TAB, 100000)).toBe(false)
    expect(isTerminalIdle(TAB, 0)).toBe(true)
  })
})

describe("stripAnsi", () => {
  it("saca CSI, OSC y deja el texto", () => {
    expect(stripAnsi("\u001b[1;31mrojo\u001b[0m")).toBe("rojo")
    expect(stripAnsi("\u001b]0;titulo\u0007texto")).toBe("texto")
  })
})
