import { describe, it, expect, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { useFeatureFlags } from "./useFeatureFlags"

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe("useFeatureFlags virtualChat", () => {
  it("default OFF (rollback seguro: MessageList clásico)", () => {
    const { result } = renderHook(() => useFeatureFlags())
    expect(result.current.flags.virtualChat).toBe(false)
  })

  it("toggle enciende y apaga", () => {
    const { result } = renderHook(() => useFeatureFlags())
    act(() => result.current.toggleFlag("virtualChat"))
    expect(result.current.flags.virtualChat).toBe(true)
    act(() => result.current.toggleFlag("virtualChat"))
    expect(result.current.flags.virtualChat).toBe(false)
  })

  it("persiste en localStorage", () => {
    const { result, unmount } = renderHook(() => useFeatureFlags())
    act(() => result.current.setFlag("virtualChat", true))
    unmount()
    const { result: r2 } = renderHook(() => useFeatureFlags())
    expect(r2.current.flags.virtualChat).toBe(true)
  })
})
