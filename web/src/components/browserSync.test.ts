import { describe, it, expect } from "vitest"
import { buildWheelScript } from "./browserWheelScript"
import { parseShortcutEvent, parseZoomLevel, shouldAdoptExternalUrl } from "./browserSync"

describe("buildWheelScript", () => {
  it("inyectable por /eval y autocontenido", () => {
    const s = buildWheelScript("http://127.0.0.1:4848")
    expect(s.startsWith("(function(){")).toBe(true)
    expect(s).toContain("__oc_wheel_on")
    expect(s).toContain("__oc_setZoom")
    expect(s).toContain("zoom-level")
    expect(s).toContain("http://127.0.0.1:4848")
  })
})

describe("parseShortcutEvent", () => {
  it("acepta objeto y string serializado", () => {
    expect(parseShortcutEvent({ type: "browser-shortcut", action: "reload" })).toBe("reload")
    expect(parseShortcutEvent(JSON.stringify({ type: "browser-shortcut", action: "focus-url" }))).toBe("focus-url")
  })
  it("rechaza tipos/acciones desconocidas y basura", () => {
    expect(parseShortcutEvent({ type: "pick" })).toBeNull()
    expect(parseShortcutEvent({ type: "browser-shortcut", action: "eval" })).toBeNull()
    expect(parseShortcutEvent("no-json")).toBeNull()
    expect(parseShortcutEvent(null)).toBeNull()
  })
})

describe("parseZoomLevel", () => {
  it("normaliza y acota 0.5–2.5", () => {
    expect(parseZoomLevel({ type: "zoom-level", value: 1.25 })).toBe(1.3)
    expect(parseZoomLevel({ type: "zoom-level", value: 9 })).toBe(2.5)
    expect(parseZoomLevel({ type: "zoom-level", value: "x" })).toBeNull()
    expect(parseZoomLevel({ type: "otro" })).toBeNull()
  })
})

describe("shouldAdoptExternalUrl", () => {
  it("solo cambios reales y sin estar escribiendo", () => {
    expect(shouldAdoptExternalUrl("https://b.com", "https://a.com", false)).toBe(true)
    expect(shouldAdoptExternalUrl("https://a.com", "https://a.com", false)).toBe(false)
    expect(shouldAdoptExternalUrl("https://b.com", "https://a.com", true)).toBe(false)
    expect(shouldAdoptExternalUrl("about:blank", "https://a.com", false)).toBe(false)
    expect(shouldAdoptExternalUrl("", "https://a.com", false)).toBe(false)
  })
})
