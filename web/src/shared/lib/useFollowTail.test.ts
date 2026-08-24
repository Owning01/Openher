import { describe, it, expect } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useFollowTail } from "./useFollowTail"

describe("useFollowTail", () => {
  function makeContainer(overrides: Partial<{ scrollHeight: number; scrollTop: number; clientHeight: number }> = {}) {
    const el = document.createElement("div") as any
    Object.defineProperties(el, {
      scrollHeight: { value: overrides.scrollHeight ?? 2000, writable: true },
      scrollTop: { value: overrides.scrollTop ?? 0, writable: true },
      clientHeight: { value: overrides.clientHeight ?? 500, writable: true },
    })
    if (!el.scrollTo) el.scrollTo = () => {}
    return el
  }

  it("isAtBottom true cuando está cerca del fondo", () => {
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 1400, clientHeight: 500 }) // distance 100 < 120
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref))
    expect(result.current.isAtBottom).toBe(true)
  })

  it("isAtBottom false cuando está lejos", () => {
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 0, clientHeight: 500 }) // distance 1500
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref))
    expect(result.current.isAtBottom).toBe(false)
  })

  it("ledger evita apagar pin durante scroll programático", () => {
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 1400, clientHeight: 500 })
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref))
    expect(result.current.isAtBottom).toBe(true)
    act(() => result.current.scrollToBottom("smooth"))
    // Simular que el scroll pasa por posición intermedia lejos del fondo
    Object.defineProperty(el, "scrollTop", { value: 0, writable: true })
    el.dispatchEvent(new Event("scroll"))
    // Debe seguir true porque programmaticUntilRef bloquea
    expect(result.current.isAtBottom).toBe(true)
  })

  it("isNearBottom usa threshold extra", () => {
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 1200, clientHeight: 500 }) // distance 300
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref))
    expect(result.current.isNearBottom(400)).toBe(true)
    expect(result.current.isNearBottom(200)).toBe(false)
  })
})
