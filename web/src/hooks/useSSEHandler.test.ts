import { describe, it, expect, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import type { SSEEvent } from "../types"
import { useSSEHandler } from "./useSSEHandler"

// El cierre de turno por SSE solo debe reaccionar al assistant NUEVO. Un
// `message.updated` de un assistant viejo (p. ej. el reemitido tras un revert)
// apagaba el spinner y disparaba el settled del turno en curso.
function makeDeps(overrides: Partial<Parameters<typeof useSSEHandler>[0]> = {}) {
  return {
    sessionID: "s1",
    directory: "/dir",
    loadSelected: vi.fn(),
    applyDelta: vi.fn(),
    applyPart: vi.fn(),
    setAwaitingAssistantReply: vi.fn(),
    setRuntimeError: vi.fn(),
    awaitingRef: () => true,
    onSettled: vi.fn(),
    setCompacting: vi.fn(),
    awaitingBaselineIDRef: () => "assistant-viejo",
    ...overrides,
  }
}

function completedMessage(id: string): SSEEvent {
  return {
    id: `evt-${id}`,
    type: "message.updated",
    properties: {
      sessionID: "s1",
      message: { id, info: { id, role: "assistant", time: { completed: Date.now() } } },
    },
  } as unknown as SSEEvent
}

describe("useSSEHandler — cierre de turno", () => {
  it("no apaga el spinner con un assistant viejo ya completado", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(completedMessage("assistant-viejo"))
    expect(deps.setAwaitingAssistantReply).not.toHaveBeenCalled()
    expect(deps.onSettled).not.toHaveBeenCalled()
  })

  it("apaga el spinner y hace settled con el assistant nuevo", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(completedMessage("assistant-nuevo"))
    expect(deps.setAwaitingAssistantReply).toHaveBeenCalledWith(false)
    expect(deps.onSettled).toHaveBeenCalledWith("s1", "/dir")
  })

  it("sin awaiting no reacciona aunque sea un assistant nuevo", () => {
    const deps = makeDeps({ awaitingRef: () => false })
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(completedMessage("assistant-nuevo"))
    expect(deps.setAwaitingAssistantReply).not.toHaveBeenCalled()
    expect(deps.onSettled).not.toHaveBeenCalled()
  })
})

describe("useSSEHandler — session.error", () => {
  function sessionError(sessionID: string, error: unknown): SSEEvent {
    return {
      id: `evt-err-${sessionID}`,
      type: "session.error",
      properties: { sessionID, error },
    } as unknown as SSEEvent
  }

  it("muestra el mensaje real del error (name + data.message)", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(sessionError("s1", { name: "ProviderAuthError", data: { providerID: "anthropic", message: "invalid api key" } }))
    expect(deps.setRuntimeError).toHaveBeenCalledWith("invalid api key")
    expect(deps.setAwaitingAssistantReply).toHaveBeenCalledWith(false)
  })

  it("ignora errores de otra sesión", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(sessionError("s2", { name: "UnknownError", data: { message: "boom" } }))
    expect(deps.setRuntimeError).not.toHaveBeenCalled()
    expect(deps.setAwaitingAssistantReply).not.toHaveBeenCalled()
  })

  it("soporta el emisor que manda message plano", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(sessionError("s1", { name: "UnknownError", message: "plano" }))
    expect(deps.setRuntimeError).toHaveBeenCalledWith("plano")
  })
})
