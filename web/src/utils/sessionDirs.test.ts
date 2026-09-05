import { describe, it, expect } from "vitest"
import { dirKey, groupSessionsByDir, buildDirPlan, keepUncoveredSessions } from "./sessionDirs"

describe("dirKey", () => {
  it("unifica mayúsculas, slashes y trailing", () => {
    expect(dirKey("G:/Proyectos/Foo/")).toBe(dirKey("g:\\proyectos\\foo"))
    expect(dirKey("C:\\a")).toBe(dirKey("c:/a/"))
  })
  it("vacío y raíz colapsan igual", () => {
    expect(dirKey("")).toBe("")
    expect(dirKey("/")).toBe("")
  })
})

describe("groupSessionsByDir", () => {
  it("fusiona variantes del mismo dir, display del primero", () => {
    const out = groupSessionsByDir([
      { directory: "G:/Proyectos/foo", id: 1 },
      { directory: "g:\\proyectos\\foo\\", id: 2 },
      { directory: "G:\\OTRO", id: 3 },
    ])
    expect(out).toHaveLength(2)
    expect(out[0]![0]).toBe("G:/Proyectos/foo")
    expect(out[0]![1].map((s) => s.id)).toEqual([1, 2])
    expect(out[1]![0]).toBe("G:\\OTRO")
  })
  it("dir vacío usa display /", () => {
    const out = groupSessionsByDir([{ directory: "", id: 1 }])
    expect(out).toEqual([["/", [{ directory: "", id: 1 }]]])
  })
})

describe("buildDirPlan", () => {
  it("lo fresco entra al historial aunque esté lleno (anti-congelamiento)", () => {
    const history = Array.from({ length: 80 }, (_, i) => `C:\\viejo${i}`)
    const { query, history: next } = buildDirPlan({
      itemDirs: ["D:\\nuevo"],
      stateDirs: [],
      projectDirs: [],
      historyDirs: history,
      cap: 80,
    })
    // cubierto por el global: no se re-pregunta, pero sí se recuerda
    expect(query).not.toContain("D:\\nuevo")
    expect(next[0]).toBe("D:\\nuevo")
    expect(next).toHaveLength(80)
  })
  it("lo fresco visible entra al query aunque el historial esté lleno", () => {
    const history = Array.from({ length: 80 }, (_, i) => `C:\\viejo${i}`)
    const { query } = buildDirPlan({
      itemDirs: [],
      stateDirs: ["D:\\nuevo"],
      projectDirs: [],
      historyDirs: history,
      cap: 80,
    })
    expect(query).toContain("D:\\nuevo")
  })
  it("nunca olvida dirs visibles en la UI aunque el global venga vacío", () => {
    const { query } = buildDirPlan({
      itemDirs: [],
      stateDirs: ["C:\\a", "C:\\b"],
      projectDirs: [],
      historyDirs: [],
      cap: 80,
    })
    expect(query).toEqual(["C:\\a", "C:\\b"])
  })
  it("no re-pregunta dirs ya cubiertos por el global", () => {
    const { query, history } = buildDirPlan({
      itemDirs: ["C:\\a"],
      stateDirs: ["C:\\a"],
      projectDirs: ["C:\\a"],
      historyDirs: [],
      cap: 80,
    })
    expect(query).toEqual([])
    expect(history).toEqual(["C:\\a"])
  })
  it("dedup por key y respeta cap con prioridad fresco>historial", () => {
    const { history } = buildDirPlan({
      itemDirs: ["c:/A"],
      stateDirs: ["C:\\a\\"],
      projectDirs: ["C:\\b"],
      historyDirs: ["C:\\c"],
      cap: 2,
    })
    expect(history).toEqual(["c:/A", "C:\\b"])
  })
})

describe("keepUncoveredSessions", () => {
  const s = (id: string, directory: string) => ({ id, directory })
  // isCovered como lo construye useSessions: verifiedKeys.has(dirKey(d)).
  const covered = (...dirs: string[]) => {
    const set = new Set(dirs.map(dirKey))
    return (d: string) => set.has(dirKey(d))
  }

  it("conserva sesiones de dirs con fallo parcial aunque no vengan en el mapped", () => {
    const current = [s("a", "C:\\proyA"), s("b", "C:\\proyB")]
    const kept = keepUncoveredSessions(current, new Set(["a"]), covered("C:\\proyA"))
    expect(kept.map((x) => x.id)).toEqual(["b"])
  })

  it("suelta el borrado real: dir verificado y sesión ausente", () => {
    const current = [s("a", "C:\\proyA"), s("borrada", "C:\\proyA")]
    const kept = keepUncoveredSessions(current, new Set(["a"]), covered("C:\\proyA"))
    expect(kept).toEqual([])
  })

  it("no duplica lo que ya trae el mapped y normaliza escritura del dir", () => {
    const current = [s("a", "c:/proya/")]
    const kept = keepUncoveredSessions(current, new Set(["a"]), covered("C:\\ProyA"))
    expect(kept).toEqual([])
  })

  it("dir vacío no verificado se conserva (el global no informó sobre él)", () => {
    const current = [s("x", "")]
    const kept = keepUncoveredSessions(current, new Set(), covered("C:\\otro"))
    expect(kept.map((x) => x.id)).toEqual(["x"])
  })
})
