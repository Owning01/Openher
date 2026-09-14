import { describe, it, expect, afterEach } from "vitest"
import { renderHook, act, cleanup } from "@testing-library/react"
import { useFeatureFlags } from "./useFeatureFlags"

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe("useFeatureFlags", () => {
  it("aplica los defaults", () => {
    const { result } = renderHook(() => useFeatureFlags())
    expect(result.current.flags.contextMenu).toBe(true)
  })

  it("toggle enciende y apaga", () => {
    const { result } = renderHook(() => useFeatureFlags())
    act(() => result.current.toggleFlag("contextMenu"))
    expect(result.current.flags.contextMenu).toBe(false)
    act(() => result.current.toggleFlag("contextMenu"))
    expect(result.current.flags.contextMenu).toBe(true)
  })

  it("persiste en localStorage", () => {
    const { result, unmount } = renderHook(() => useFeatureFlags())
    act(() => result.current.setFlag("contextMenu", false))
    unmount()
    const { result: r2 } = renderHook(() => useFeatureFlags())
    expect(r2.current.flags.contextMenu).toBe(false)
  })
})
