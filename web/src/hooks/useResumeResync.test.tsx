import { describe, it, expect, vi, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useResumeResync } from "./useResumeResync"

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state })
  document.dispatchEvent(new Event("visibilitychange"))
}

afterEach(() => {
  vi.useRealTimers()
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" })
})

describe("useResumeResync", () => {
  it("dispara onResume al volver tras estar oculto el tiempo mínimo", () => {
    vi.useFakeTimers()
    const onResume = vi.fn()
    const { unmount } = renderHook(() => useResumeResync(onResume, 2000))
    act(() => {
      setVisibility("hidden")
      vi.advanceTimersByTime(5000)
      setVisibility("visible")
    })
    expect(onResume).toHaveBeenCalledTimes(1)
    unmount()
  })

  it("no dispara si el ocultamiento fue breve (cambio de app instantáneo)", () => {
    vi.useFakeTimers()
    const onResume = vi.fn()
    const { unmount } = renderHook(() => useResumeResync(onResume, 2000))
    act(() => {
      setVisibility("hidden")
      vi.advanceTimersByTime(500)
      setVisibility("visible")
    })
    expect(onResume).not.toHaveBeenCalled()
    unmount()
  })

  it("visible sin haberse ocultado no dispara", () => {
    const onResume = vi.fn()
    const { unmount } = renderHook(() => useResumeResync(onResume))
    act(() => {
      setVisibility("visible")
    })
    expect(onResume).not.toHaveBeenCalled()
    unmount()
  })
})
