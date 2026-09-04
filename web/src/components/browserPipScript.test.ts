import { describe, it, expect } from "vitest"
import { buildPipScript } from "./browserPipScript"

describe("buildPipScript", () => {
  it("devuelve un IIFE autocontenido", () => {
    const s = buildPipScript()
    expect(s.startsWith("(function(){")).toBe(true)
    expect(s.endsWith("})()")).toBe(true)
  })
  it("cubre video en vivo y región flotante con toggle", () => {
    const s = buildPipScript()
    expect(s).toContain("requestPictureInPicture")
    expect(s).toContain("documentPictureInPicture")
    expect(s).toContain("requestWindow")
    expect(s).toContain("__oc_pip_cleanup")
    expect(s).toContain("pagehide")
  })
})
