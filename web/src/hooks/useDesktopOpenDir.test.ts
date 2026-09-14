import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { renderHook, cleanup, act } from "@testing-library/react"
import { useDesktopOpenDir } from "./useDesktopOpenDir"

beforeEach(() => {
  window.__OPENHER_OPEN_DIR__ = null
  delete window.__openherOpenDir
  window.history.replaceState({}, "", "/")
})

afterEach(() => cleanup())

describe("useDesktopOpenDir", () => {
  it("consume el global inyectado por --open-dir una sola vez", () => {
    window.__OPENHER_OPEN_DIR__ = "C:/proj"
    const onOpen = vi.fn()
    renderHook(() => useDesktopOpenDir(onOpen))
    expect(onOpen).toHaveBeenCalledWith("C:/proj")
    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(window.__OPENHER_OPEN_DIR__).toBeNull()
  })

  it("consume ?openDir= (modo navegador) y lo limpia de la URL", () => {
    window.history.replaceState({}, "", "/?openDir=C%3A%2Fproj&x=1")
    const onOpen = vi.fn()
    renderHook(() => useDesktopOpenDir(onOpen))
    expect(onOpen).toHaveBeenCalledWith("C:/proj")
    expect(window.location.search).not.toContain("openDir")
    expect(window.location.search).toContain("x=1")
  })

  it("el global tiene prioridad sobre ?openDir=", () => {
    window.history.replaceState({}, "", "/?openDir=fromParam")
    window.__OPENHER_OPEN_DIR__ = "fromGlobal"
    const onOpen = vi.fn()
    renderHook(() => useDesktopOpenDir(onOpen))
    expect(onOpen).toHaveBeenCalledWith("fromGlobal")
    expect(onOpen).not.toHaveBeenCalledWith("fromParam")
  })

  it("abre por evento cuando el shell invoca __openherOpenDir", () => {
    const onOpen = vi.fn()
    renderHook(() => useDesktopOpenDir(onOpen))
    expect(typeof window.__openherOpenDir).toBe("function")
    act(() => { window.__openherOpenDir!("D:/otro") })
    expect(onOpen).toHaveBeenCalledWith("D:/otro")
  })

  it("ignora valores vacíos del shell", () => {
    const onOpen = vi.fn()
    renderHook(() => useDesktopOpenDir(onOpen))
    act(() => { window.__openherOpenDir!("   ") })
    act(() => { window.__openherOpenDir!(42) })
    expect(onOpen).not.toHaveBeenCalled()
  })
})
