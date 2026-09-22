import { describe, it, expect } from "vitest"
import { hydrateAutomations, isAutomationDue } from "./automationStore"

const RUNNING_RAW = JSON.stringify([
  {
    id: "z",
    name: "x",
    kind: "prompt",
    prompt: "p",
    sessionID: "s",
    command: "",
    intervalMinutes: 5,
    enabled: true,
    lastRunAt: 1,
    lastStatus: "running",
  },
])

describe("hydrateAutomations", () => {
  it("limpia lastStatus running de corridas interrumpidas por una recarga", () => {
    const list = hydrateAutomations(RUNNING_RAW)
    expect(list).toHaveLength(1)
    expect(list[0].lastStatus).toBeUndefined()
  })

  it("tras hidratar, la automatización vuelve a tener turno (no queda muerta)", () => {
    const list = hydrateAutomations(RUNNING_RAW)
    // Corrió en t=1 con intervalo 5min: a los 6min le toca de nuevo.
    expect(isAutomationDue(list[0], 1 + 5 * 60_000)).toBe(true)
  })

  it("conserva los otros estados y no rompe con basura", () => {
    const okRaw = RUNNING_RAW.replace('"running"', '"ok"')
    expect(hydrateAutomations(okRaw)[0].lastStatus).toBe("ok")
    expect(hydrateAutomations("no-json")).toEqual([])
    expect(hydrateAutomations(null)).toEqual([])
  })
})
