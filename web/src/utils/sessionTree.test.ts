import { describe, it, expect } from "vitest"
import { coupleSessionRows } from "./sessionTree"

type S = { id: string; parentID?: string | null; updated: number }

const s = (id: string, updated: number, parentID?: string | null): S => ({ id, updated, parentID })

describe("coupleSessionRows", () => {
  it("pone la hija debajo del padre y ordena el grupo por la actividad del hijo", () => {
    // Entrada ordenada por actividad: la hija (100) es más nueva que el padre (10).
    const out = coupleSessionRows([s("hija", 100, "padre"), s("padre", 10)])
    expect(out.map((r) => [r.session.id, r.isChild])).toEqual([
      ["padre", false],
      ["hija", true],
    ])
  })

  it("el grupo más reciente (por su hija) va primero", () => {
    const out = coupleSessionRows([
      s("viejo", 10),
      s("viejo-hija", 50, "viejo"),
      s("nuevo", 40),
    ])
    expect(out.map((r) => r.session.id)).toEqual(["viejo", "viejo-hija", "nuevo"])
  })

  it("varias hijas quedan bajo su padre en orden de actividad", () => {
    const out = coupleSessionRows([
      s("p", 5),
      s("c2", 90, "p"),
      s("c1", 80, "p"),
      s("solo", 60),
    ])
    expect(out.map((r) => [r.session.id, r.isChild])).toEqual([
      ["p", false],
      ["c2", true],
      ["c1", true],
      ["solo", false],
    ])
  })

  it("la hija con padre en OTRA lista se omite (no duplicar)", () => {
    const known = new Set(["padre", "hija", "otra-hija"])
    const out = coupleSessionRows([s("otra-hija", 90, "padre"), s("x", 10)], known)
    expect(out.map((r) => r.session.id)).toEqual(["x"])
  })

  it("la hija huérfana (padre borrado) queda como fila suelta", () => {
    const known = new Set(["hija", "x"])
    const out = coupleSessionRows([s("hija", 90, "padre-borrado"), s("x", 10)], known)
    expect(out.map((r) => [r.session.id, r.isChild])).toEqual([
      ["hija", false],
      ["x", false],
    ])
  })

  it("sin knownIds toda hija sin padre en la lista es fila suelta", () => {
    const out = coupleSessionRows([s("hija", 90, "ausente"), s("x", 10)])
    expect(out.map((r) => r.session.id)).toEqual(["hija", "x"])
  })

  it("cadena A←B←C se resuelve hasta la raíz", () => {
    const out = coupleSessionRows([s("c", 90, "b"), s("b", 50, "a"), s("a", 10)])
    expect(out[0]).toEqual({ session: expect.objectContaining({ id: "a" }), isChild: false })
    // Hijas cuelgan de la raíz, por actividad (c es más nueva que b).
    expect(out.slice(1).map((r) => [r.session.id, r.isChild])).toEqual([
      ["c", true],
      ["b", true],
    ])
  })

  it("no pierde filas con un ciclo defensivo", () => {
    const out = coupleSessionRows([s("a", 20, "b"), s("b", 10, "a")])
    expect(out).toHaveLength(2)
    expect(out[0]!.session.id).toBe("a")
    expect(out[1]!.session.id).toBe("b")
  })

  it("lista vacía y entradas sin updated no explotan", () => {
    expect(coupleSessionRows([])).toEqual([])
    const out = coupleSessionRows([{ id: "solo" } as S])
    expect(out.map((r) => [r.session.id, r.isChild])).toEqual([["solo", false]])
  })
})
