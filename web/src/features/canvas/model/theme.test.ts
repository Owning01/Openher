import { describe, it, expect } from "vitest"
import { normalizeTheme, presetList, resolveScheme, shapeFactor, isHexColor } from "./theme"

const HEX = /^#[0-9A-F]{6}$/

describe("theme", () => {
  it("resuelve 7 presets con hex validos", () => {
    expect(presetList()).toHaveLength(7)
    for (const p of presetList()) {
      const s = resolveScheme({ seed: p.seed, dark: false, contrast: "standard", shape: "rounded" })
      for (const v of Object.values(s)) expect(v).toMatch(HEX)
    }
  })

  it("el preset violeta claro es el publicado", () => {
    const s = resolveScheme({ seed: "#6750A4", dark: false, contrast: "standard", shape: "rounded" })
    expect(s.primary).toBe("#6750A4")
    expect(s.surface).toBe("#FEF7FF")
  })

  it("oscuro y semilla custom generan schemes distintos y validos", () => {
    const light = resolveScheme({ seed: "#6750A4", dark: false, contrast: "standard", shape: "rounded" })
    const dark = resolveScheme({ seed: "#6750A4", dark: true, contrast: "standard", shape: "rounded" })
    const custom = resolveScheme({ seed: "#C2410C", dark: false, contrast: "standard", shape: "rounded" })
    expect(dark.surface).not.toBe(light.surface)
    expect(custom.primary).not.toBe(light.primary)
    for (const v of [...Object.values(dark), ...Object.values(custom)]) expect(v).toMatch(HEX)
  })

  it("normaliza temas viejos o rotos", () => {
    expect(normalizeTheme(undefined)).toEqual({ seed: "#6750A4", dark: false, contrast: "standard", shape: "rounded" })
    expect(normalizeTheme({ seed: "zzz" } as never).seed).toBe("#6750A4")
    expect(isHexColor("#abc123")).toBe(true)
    expect(isHexColor("rojo")).toBe(false)
    expect(shapeFactor("square")).toBeLessThan(1)
    expect(shapeFactor("full")).toBeGreaterThan(1)
  })
})
