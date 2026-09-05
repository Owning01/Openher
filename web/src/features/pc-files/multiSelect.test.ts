import { describe, it, expect } from "vitest"
import { nextSelection, parseDragPaths, joinDragPaths } from "./multiSelect"

const ORDER = ["/a", "/b", "/c", "/d"]

describe("nextSelection", () => {
  it("click simple selecciona solo esa fila", () => {
    const r = nextSelection(["/a", "/b"], ORDER, "/c", { ctrl: false, shift: false, anchor: "/a" })
    expect(r.selected).toEqual(["/c"])
    expect(r.anchor).toBe("/c")
  })

  it("ctrl agrega y quita sin tocar el resto", () => {
    const add = nextSelection(["/a"], ORDER, "/c", { ctrl: true, shift: false, anchor: "/a" })
    expect(add.selected).toEqual(["/a", "/c"])
    expect(add.anchor).toBe("/c")
    const del = nextSelection(["/a", "/c"], ORDER, "/a", { ctrl: true, shift: false, anchor: "/c" })
    expect(del.selected).toEqual(["/c"])
  })

  it("shift selecciona el rango entre anchor y click", () => {
    const r = nextSelection(["/a"], ORDER, "/c", { ctrl: false, shift: true, anchor: "/a" })
    expect(r.selected).toEqual(["/a", "/b", "/c"])
    expect(r.anchor).toBe("/a")
  })

  it("shift funciona hacia atrás", () => {
    const r = nextSelection(["/d"], ORDER, "/b", { ctrl: false, shift: true, anchor: "/d" })
    expect(r.selected).toEqual(["/b", "/c", "/d"])
  })

  it("shift sin anchor válido cae a selección simple", () => {
    expect(
      nextSelection([], ORDER, "/b", { ctrl: false, shift: true, anchor: null }).selected,
    ).toEqual(["/b"])
    expect(
      nextSelection([], ORDER, "/b", { ctrl: false, shift: true, anchor: "/z" }).selected,
    ).toEqual(["/b"])
  })
})

describe("drag payload", () => {
  it("une y separa varias rutas con salto de línea", () => {
    const paths = ["C:\\a\\x.txt", "C:\\a\\y.txt"]
    expect(parseDragPaths(joinDragPaths(paths))).toEqual(paths)
    expect(parseDragPaths("C:\\a\\x.txt\r\n\r\nC:\\a\\y.txt\r\n")).toEqual(paths)
    expect(parseDragPaths("")).toEqual([])
  })
})
