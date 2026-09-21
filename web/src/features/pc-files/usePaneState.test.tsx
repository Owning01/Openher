import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { usePaneState } from "./usePaneState"

// Evidencia de la fuga O2: el hook devolvía un objeto nuevo por render. Debe
// mantenerse estable si el estado interno no cambió (cierra la recreación de
// callbacks que dependen del pane completo y el memo de las filas).
describe("usePaneState: identidad estable", () => {
  it("no cambia entre renders sin cambios de estado", () => {
    const { result, rerender } = renderHook(() => usePaneState())
    const first = result.current
    rerender()
    expect(result.current).toBe(first)
    expect(result.current.load).toBe(first.load)
  })
})
