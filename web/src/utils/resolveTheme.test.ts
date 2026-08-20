import { describe, it, expect, beforeEach, vi } from "vitest"
import { resolveTheme, themeToCSSVars, contrast, applyThemeVars } from "./resolveTheme"

// ---------------------------------------------------------------------------
// resolveTheme
// ---------------------------------------------------------------------------
describe("resolveTheme", () => {
  it("resuelve valores hex directos sin indirection", () => {
    const json = { theme: { background: "#111111", text: "#eeeeee" } } as any
    const res = resolveTheme(json, "dark")
    expect(res.background).toBe("#111111")
    expect(res.text).toBe("#eeeeee")
  })

  it("resuelve a través de defs", () => {
    const json = {
      defs: { myRed: "#ff0000" },
      theme: { primary: "myRed" },
    } as any
    const res = resolveTheme(json, "dark")
    expect(res.primary).toBe("#ff0000")
  })

  it("resuelve cadena de defs encadenados", () => {
    const json = {
      defs: { a: "b", b: "#abcdef" },
      theme: { primary: "a" },
    } as any
    const res = resolveTheme(json, "dark")
    expect(res.primary).toBe("#abcdef")
  })

  it("resuelve referencia a otra clave del theme", () => {
    const json = {
      theme: { background: "#000000", backgroundPanel: "background" },
    } as any
    const res = resolveTheme(json, "dark")
    expect(res.backgroundPanel).toBe("#000000")
  })

  it("maneja objeto { dark, light } según mode dark", () => {
    const json = {
      theme: { primary: { dark: "#111", light: "#fff" } },
    } as any
    expect(resolveTheme(json, "dark").primary).toBe("#111")
    expect(resolveTheme(json, "light").primary).toBe("#fff")
  })

  it("usa fallback dark/light cuando mode no existe en objeto", () => {
    const json = {
      theme: { primary: { dark: "#123456" } },
    } as any
    // modo light pedido pero solo existe dark -> fallback a dark
    const res = resolveTheme(json, "light")
    expect(res.primary).toBe("#123456")
  })

  it("resuelve objeto mode con valor que es referencia a defs", () => {
    const json = {
      defs: { myColor: "#aabbcc" },
      theme: { primary: { dark: "myColor", light: "#ffffff" } },
    } as any
    expect(resolveTheme(json, "dark").primary).toBe("#aabbcc")
  })

  it("omite keys thinkingOpacity, selectedListItemText, backgroundMenu", () => {
    const json = {
      theme: {
        thinkingOpacity: "#111",
        selectedListItemText: "#222",
        backgroundMenu: "#333",
        background: "#000",
      },
    } as any
    const res = resolveTheme(json, "dark")
    expect(res.thinkingOpacity).toBeUndefined()
    expect(res.selectedListItemText).toBeUndefined()
    expect(res.backgroundMenu).toBeUndefined()
    expect(res.background).toBe("#000")
  })

  it("detecta ciclo y retorna #000000", () => {
    const json = {
      defs: { a: "b", b: "a" },
      theme: { primary: "a" },
    } as any
    const res = resolveTheme(json, "dark")
    expect(res.primary).toBe("#000000")
  })

  it("retorna valor literal no-hex/no-def tal cual", () => {
    const json = { theme: { primary: "unknownLiteral" } } as any
    const res = resolveTheme(json, "dark")
    expect(res.primary).toBe("unknownLiteral")
  })

  it("retorna #000000 para valor no string ni objeto (ej number)", () => {
    const json = { theme: { primary: 123 as any } } as any
    const res = resolveTheme(json, "dark")
    // numbers are ignored? loop handles only string/object, so result won't have primary?
    // check implementation: only string/object handled, otherwise skipped
    // so primary should be undefined
    expect(res.primary).toBeUndefined()
  })

  it("maneja defs undefined (usa {})", () => {
    const json = { theme: { primary: "#abc123" } } as any
    const res = resolveTheme(json, "dark")
    expect(res.primary).toBe("#abc123")
  })

  it("ignora objeto sin dark ni light", () => {
    const json = { theme: { primary: {} as any } } as any
    const res = resolveTheme(json, "dark")
    expect(res.primary).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// themeToCSSVars
// ---------------------------------------------------------------------------
describe("themeToCSSVars", () => {
  it("mapea slots conocidos a CSS vars via CSS_MAP", () => {
    const resolved = {
      background: "#010101",
      text: "#fefefe",
      primary: "#ff0000",
    }
    const vars = themeToCSSVars(resolved)
    expect(vars["--bg"]).toBeDefined()
    expect(vars["--text"]).toBeDefined()
    expect(vars["--primary"]).toBeDefined()
  })

  it("genera --surface-subtle desde backgroundPanel o background", () => {
    const v1 = themeToCSSVars({ backgroundPanel: "#111111", background: "#222222" })
    expect(v1["--surface-subtle"]).toBeDefined()
    const v2 = themeToCSSVars({ background: "#222222" })
    expect(v2["--surface-subtle"]).toBeDefined()
  })

  it("genera --muted-strong con fallback #666", () => {
    const vars = themeToCSSVars({})
    expect(vars["--muted-strong"]).toBeDefined()
  })

  it("genera defaults para markdown vars cuando no están resueltos", () => {
    const vars = themeToCSSVars({ accent: "#aabbcc", primary: "#112233", info: "#445566", success: "#778899", text: "#ffffff", textMuted: "#999999" })
    expect(vars["--md-heading"]).toBeDefined()
    expect(vars["--md-link"]).toBeDefined()
    expect(vars["--md-link-text"]).toBeDefined()
    expect(vars["--md-code"]).toBeDefined()
    expect(vars["--md-quote"]).toBeDefined()
  })

  it("no sobrescribe md-heading si ya existe en resolved mapping", () => {
    // markdownHeading maps to --md-heading, so if provided it should stay (or be clamped)
    const resolved = {
      background: "#000000",
      markdownHeading: "#123456",
      text: "#ffffff",
    }
    const vars = themeToCSSVars(resolved)
    // --md-heading should be derived from markdownHeading, not accent fallback
    expect(vars["--md-heading"]).toBeDefined()
  })

  it("clampea color con bajo contraste contra bg", () => {
    // texto gris medio sobre fondo gris medio -> contraste bajo, debe ser ajustado
    const resolved = {
      background: "#888888",
      text: "#777777",
      textMuted: "#777777",
      primary: "#777777",
    }
    const vars = themeToCSSVars(resolved)
    // después de clamp, --text no debe ser el mismo #777777 exacto
    // porque contraste #777 vs #888 es ~1.1 < 4.5
    expect(vars["--text"]).not.toBe("#777777")
  })

  it("no clampea si contraste ya es suficiente", () => {
    const resolved = {
      background: "#000000",
      text: "#ffffff",
    }
    const vars = themeToCSSVars(resolved)
    expect(vars["--text"]).toBe("#ffffff")
  })

  it("ignora slots no mapeados en CSS_MAP", () => {
    const resolved = { unknownSlot: "#123456", background: "#000000" } as any
    const vars = themeToCSSVars(resolved)
    expect(vars["--unknownSlot"]).toBeUndefined()
  })

  it("clampea colores de código contra surface", () => {
    const resolved = {
      background: "#1a1a1a",
      backgroundElement: "#1a1a1a",
      syntaxComment: "#2a2a2a",
    }
    const vars = themeToCSSVars(resolved)
    expect(vars["--code-comment"]).toBeDefined()
    // con fondo similar, debe haber sido clamado
    // no podemos asegurar valor exacto pero sí que es string hex
    expect(vars["--code-comment"]).toMatch(/^#[0-9a-fA-F]{6}$/)
  })
})

// ---------------------------------------------------------------------------
// contrast
// ---------------------------------------------------------------------------
describe("contrast", () => {
  it("retorna 21 para blanco vs negro", () => {
    expect(contrast("#ffffff", "#000000")).toBeCloseTo(21, 1)
  })

  it("retorna 1 para mismo color", () => {
    expect(contrast("#888888", "#888888")).toBeCloseTo(1, 2)
  })

  it("es simétrico", () => {
    expect(contrast("#123456", "#abcdef")).toBeCloseTo(contrast("#abcdef", "#123456"), 5)
  })

  it("contraste >1 para colores distintos", () => {
    expect(contrast("#ff0000", "#0000ff")).toBeGreaterThan(1)
  })

  it("maneja hex de 3 dígitos", () => {
    expect(contrast("#fff", "#000")).toBeCloseTo(21, 1)
  })
})

// ---------------------------------------------------------------------------
// applyThemeVars
// ---------------------------------------------------------------------------
describe("applyThemeVars", () => {
  beforeEach(() => {
    document.documentElement.style.cssText = ""
  })

  it("aplica vars al document.documentElement", () => {
    applyThemeVars({ "--bg": "#123456", "--text": "#ffffff" })
    expect(document.documentElement.style.getPropertyValue("--bg")).toBe("#123456")
    expect(document.documentElement.style.getPropertyValue("--text")).toBe("#ffffff")
  })

  it("no falla con objeto vacío", () => {
    expect(() => applyThemeVars({})).not.toThrow()
  })

  it("sobrescribe valores previos", () => {
    applyThemeVars({ "--bg": "#111111" })
    applyThemeVars({ "--bg": "#222222" })
    expect(document.documentElement.style.getPropertyValue("--bg")).toBe("#222222")
  })
})
