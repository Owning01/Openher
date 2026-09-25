import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useChatSettings } from "./useChatSettings"

// Regresión: las CSS vars del chat deben aplicarse al cambiar el setting, no
// solo desde el effect [settings] — con el React Compiler activo
// (`react({ compiler: true })`) el efecto quedaba memoizado y el slider de
// tamaño de letra no movia nada. La var va en rem (base 16) para que el zoom de
// UI escale tambien el chat.

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute("style")
})

describe("useChatSettings: aplicación de CSS vars", () => {
  it("--chat-font-size se aplica al cambiar fontSize (en rem)", () => {
    const { result } = renderHook(() => useChatSettings())
    act(() => result.current.setSetting("fontSize", 22))
    expect(document.documentElement.style.getPropertyValue("--chat-font-size")).toBe(`${22 / 16}rem`)
  })

  it("resetDefaults restaura los valores por defecto", () => {
    const { result } = renderHook(() => useChatSettings())
    act(() => result.current.setSetting("fontSize", 24))
    act(() => result.current.resetDefaults())
    expect(document.documentElement.style.getPropertyValue("--chat-font-size")).toBe("0.875rem")
  })

  it("normaliza fontSize no numérico del storage (migración)", () => {
    localStorage.setItem("openher.chatSettings", JSON.stringify({ fontSize: "14px" }))
    const { result } = renderHook(() => useChatSettings())
    expect(result.current.settings.fontSize).toBe(14)
    expect(document.documentElement.style.getPropertyValue("--chat-font-size")).toBe("0.875rem")
  })
})
