import { describe, it, expect } from "vitest"
import { GO_MODELS_REF, formatReset, goModelLimit, usageTone } from "./goModels"

describe("goModels: tabla de referencia", () => {
  it("toda ficha tiene tope y precios positivos", () => {
    for (const [id, ref] of Object.entries(GO_MODELS_REF)) {
      expect(ref.limit, id).toBeGreaterThan(0)
      expect(ref.input, id).toBeGreaterThan(0)
      expect(ref.output, id).toBeGreaterThan(0)
    }
  })

  it("cubre los modelos más usados", () => {
    for (const id of ["deepseek-v4.1-flash", "kimi-k2.7-code", "muse-spark-1.3-contributor", "glm-5.3-flash"]) {
      expect(goModelLimit(id), id).not.toBeNull()
    }
  })

  it("modelo nuevo sin ficha → null (la UI lo marca)", () => {
    expect(goModelLimit("modelo-del-futuro")).toBeNull()
  })
})

describe("usageTone", () => {
  it("ok < 70, warn 70-89, bad ≥ 90", () => {
    expect(usageTone(0)).toBe("ok")
    expect(usageTone(69)).toBe("ok")
    expect(usageTone(70)).toBe("warn")
    expect(usageTone(89)).toBe("warn")
    expect(usageTone(90)).toBe("bad")
    expect(usageTone(99)).toBe("bad")
  })
})

describe("formatReset", () => {
  it("ISO válido → texto corto con día", () => {
    const out = formatReset("2026-09-27T16:52:43.964Z")
    expect(out).toContain("27")
  })

  it("inválido → devuelve el crudo", () => {
    expect(formatReset("no-fecha")).toBe("no-fecha")
  })
})
