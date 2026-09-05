import { describe, it, expect } from "vitest"
import type { FsEntry } from "../../shell"
import { sortFsEntries, splitCrumbs, pushHistory } from "./explorerView"

function entry(name: string, size: number | null = null, modified: number | null = null): FsEntry {
  return { name, path: `/w/${name}`, is_dir: false, size, modified }
}

describe("sortFsEntries", () => {
  it("nombre ascendente sin importar mayúsculas", () => {
    const out = sortFsEntries([entry("b"), entry("A"), entry("c")], "name", 1)
    expect(out.map((e) => e.name)).toEqual(["A", "b", "c"])
  })

  it("nombre descendente", () => {
    const out = sortFsEntries([entry("b"), entry("A")], "name", -1)
    expect(out.map((e) => e.name)).toEqual(["b", "A"])
  })

  it("tamaño con desempate por nombre", () => {
    const out = sortFsEntries(
      [entry("b", 10), entry("a", 10), entry("c", 5)],
      "size",
      1,
    )
    expect(out.map((e) => e.name)).toEqual(["c", "a", "b"])
  })

  it("fecha descendente (recientes primero)", () => {
    const out = sortFsEntries(
      [entry("viejo", null, 100), entry("nuevo", null, 300), entry("sfecha", null, null)],
      "date",
      -1,
    )
    expect(out.map((e) => e.name)).toEqual(["nuevo", "viejo", "sfecha"])
  })
})

describe("splitCrumbs", () => {
  it("ruta Windows con unidad", () => {
    expect(splitCrumbs("C:\\a\\b")).toEqual([
      { label: "C:", path: "C:\\" },
      { label: "a", path: "C:\\a" },
      { label: "b", path: "C:\\a\\b" },
    ])
  })

  it("raíz de unidad y null", () => {
    expect(splitCrumbs("D:\\")).toEqual([{ label: "D:", path: "D:\\" }])
    expect(splitCrumbs(null)).toEqual([])
  })

  it("ruta Unix", () => {
    expect(splitCrumbs("/x/y")).toEqual([
      { label: "x", path: "/x" },
      { label: "y", path: "/x/y" },
    ])
    expect(splitCrumbs("/")).toEqual([{ label: "/", path: "/" }])
  })
})

describe("pushHistory", () => {
  it("agrega, no duplica el actual y trunca el futuro", () => {
    let s = pushHistory([], -1, "/a")
    expect(s).toEqual({ hist: ["/a"], idx: 0 })
    // recarga del mismo: sin cambios (misma referencia)
    expect(pushHistory(s.hist, s.idx, "/a").hist).toBe(s.hist)
    s = pushHistory(s.hist, s.idx, "/b")
    // atrás y navegar: el futuro se descarta
    s = pushHistory(s.hist, 0, "/c")
    expect(s).toEqual({ hist: ["/a", "/c"], idx: 1 })
  })
})
