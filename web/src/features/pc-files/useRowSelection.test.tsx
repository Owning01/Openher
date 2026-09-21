import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useRowSelection } from "./multiSelect"

// Evidencia de la fuga O2: el hook devolvía un objeto nuevo en cada render y
// recreaba los callbacks que lo usaban como dependencia, rompiendo
// memo(FileRow/TreeFolder). Debe ser estable mientras no cambie la selección.
describe("useRowSelection: identidad estable", () => {
  it("no cambia entre renders si la selección no cambió", () => {
    const { result, rerender } = renderHook(() => useRowSelection())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
    expect(result.current.clear).toBe(first.clear)
    expect(result.current.select).toBe(first.select)
  })

  it("cambia cuando cambia la selección, pero conserva las funciones", () => {
    const { result } = renderHook(() => useRowSelection())
    const first = result.current
    act(() => {
      first.select("/a", ["/a", "/b"], { ctrlKey: false, metaKey: false, shiftKey: false })
    })
    expect(result.current).not.toBe(first)
    expect(result.current.selected).toEqual(["/a"])
    expect(result.current.clear).toBe(first.clear)
    expect(result.current.select).toBe(first.select)
    expect(result.current.selectAll).toBe(first.selectAll)
  })
})
