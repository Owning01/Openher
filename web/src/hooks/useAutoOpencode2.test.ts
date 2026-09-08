import { describe, it, expect, afterEach, vi } from "vitest"
import { renderHook, act, cleanup, waitFor } from "@testing-library/react"
import { useAutoOpencode2 } from "./useAutoOpencode2"
import { consumePendingAutoOpencode2 } from "../utils/terminalStore"

function stubConfig(autoOpencode2: boolean): void {
  vi.stubGlobal(
    "fetch",
    async () =>
      ({
        ok: true,
        status: 200,
        json: async () => ({ auto_opencode2: autoOpencode2 }),
      }) as Response,
  )
}

afterEach(() => {
  cleanup()
  consumePendingAutoOpencode2()
  localStorage.clear()
  sessionStorage.clear()
  vi.unstubAllGlobals()
})

describe("useAutoOpencode2 arma el pending por sesión", () => {
  it("localStorage en 1 arma el one-shot al montar", () => {
    stubConfig(false)
    localStorage.setItem("opencode.auto_opencode2", "1")
    renderHook(() => useAutoOpencode2())
    expect(consumePendingAutoOpencode2()).toBe(true)
    expect(consumePendingAutoOpencode2()).toBe(false)
  })

  it("config del backend en true arma el one-shot aunque localStorage esté vacío", async () => {
    stubConfig(true)
    const { result } = renderHook(() => useAutoOpencode2())
    await waitFor(() => expect(result.current.enabled).toBe(true))
    expect(consumePendingAutoOpencode2()).toBe(true)
  })

  it("deshabilitado no arma nada", async () => {
    stubConfig(false)
    renderHook(() => useAutoOpencode2())
    await waitFor(() => expect(consumePendingAutoOpencode2()).toBe(false))
  })

  it("setEnabled(true) arma; en la misma sesión no se rearma", () => {
    stubConfig(false)
    const { result, unmount } = renderHook(() => useAutoOpencode2())
    act(() => result.current.setEnabled(true))
    expect(consumePendingAutoOpencode2()).toBe(true)
    unmount()
    renderHook(() => useAutoOpencode2())
    expect(consumePendingAutoOpencode2()).toBe(false)
  })
})
