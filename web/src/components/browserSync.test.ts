import { describe, it, expect } from "vitest"
import { buildWheelScript } from "./browserWheelScript"
import { parseShortcutEvent, parseZoomLevel, shouldAdoptExternalUrl, loadBrowserStack, saveBrowserStack } from "./browserSync"

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

function memStore() {
  const m = new Map<string, string>()
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => { m.set(k, v) },
    removeItem: (k: string) => { m.delete(k) },
  }
}

describe("browserStack", () => {
  it("roundtrip de historial con idx", () => {
    const s = memStore()
    saveBrowserStack(s, "k", { url: "https://b.com", history: ["https://a.com", "https://b.com"], historyIdx: 1 })
    expect(loadBrowserStack(s, "k")).toEqual({ url: "https://b.com", history: ["https://a.com", "https://b.com"], historyIdx: 1 })
  })
  it("rechaza JSON roto, tipos mal y storage nulo", () => {
    const s = memStore()
    s.setItem("k", "{roto")
    expect(loadBrowserStack(s, "k")).toBeNull()
    s.setItem("k", JSON.stringify({ url: 1, history: "x" }))
    expect(loadBrowserStack(s, "k")).toBeNull()
    expect(loadBrowserStack(null, "k")).toBeNull()
    expect(loadBrowserStack(s, "")).toBeNull()
  })
  it("acota a 50, sanea no-strings y borra con snapshot vacío", () => {
    const s = memStore()
    const big = Array.from({ length: 70 }, (_, i) => `https://s${i}.com`)
    saveBrowserStack(s, "k", { url: big[69]!, history: [...big, 1 as any], historyIdx: 99 })
    const snap = loadBrowserStack(s, "k")
    expect(snap!.history.length).toBe(50)
    expect(snap!.historyIdx).toBe(49)
    expect(snap!.url).toBe("https://s69.com")
    saveBrowserStack(s, "k", { url: "", history: [], historyIdx: 0 })
    expect(loadBrowserStack(s, "k")).toBeNull()
  })
})
