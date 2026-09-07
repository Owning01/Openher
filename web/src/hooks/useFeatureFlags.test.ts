import { describe, it, expect, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { useFeatureFlags } from "./useFeatureFlags"

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe("useFeatureFlags virtualChat", () => {
  it("default ON (chat virtualizado)", () => {
    const { result } = renderHook(() => useFeatureFlags())
    expect(result.current.flags.virtualChat).toBe(true)
  })

  it("toggle enciende y apaga", () => {
    const { result } = renderHook(() => useFeatureFlags())
    act(() => result.current.toggleFlag("virtualChat"))
    expect(result.current.flags.virtualChat).toBe(false)
    act(() => result.current.toggleFlag("virtualChat"))
    expect(result.current.flags.virtualChat).toBe(true)
  })

  it("persiste en localStorage", () => {
    const { result, unmount } = renderHook(() => useFeatureFlags())
    act(() => result.current.setFlag("virtualChat", true))
    unmount()
    const { result: r2 } = renderHook(() => useFeatureFlags())
    expect(r2.current.flags.virtualChat).toBe(true)
  })
})
