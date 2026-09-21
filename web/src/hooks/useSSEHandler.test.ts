import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
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

describe("useSSEHandler — session.error", () => {  function sessionError(sessionID: string, error: unknown): SSEEvent {
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

// Dialecto v2 vigente (server 2.x): el sobre SSE es el envelope
// {id, created, type, data} y el parser lo deja entero en properties.
describe("useSSEHandler — dialecto v2 (session.text/reasoning/execution)", () => {
  // Los deltas se coalescan por requestAnimationFrame: en tests se ejecuta
  // directo para que applyDelta corra sincrónico.
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => { cb(0); return 1 })
    vi.stubGlobal("cancelAnimationFrame", () => {})
  })
  afterEach(() => { vi.unstubAllGlobals() })

  function v2(type: string, data: Record<string, unknown>): SSEEvent {
    return {
      id: `evt-${type}`,
      type,
      properties: { id: `evt-${type}`, created: Date.now(), type, data },
    } as unknown as SSEEvent
  }

  it("session.text.delta pinta el delta en vivo", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(v2("session.text.delta", { sessionID: "s1", assistantMessageID: "msg-1", ordinal: 0, delta: "hola" }))
    expect(deps.applyDelta).toHaveBeenCalledWith("s1", "msg-1", "msg-1:text:0", "hola", false, "text")
  })

  it("session.text.delta sin ordinal usa part estable por mensaje", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(v2("session.text.delta", { sessionID: "s1", assistantMessageID: "msg-1", delta: "hola" }))
    expect(deps.applyDelta).toHaveBeenCalledWith("s1", "msg-1", "msg-1:text", "hola", false, "text")
  })

  it("ignora deltas de otra sesión (nunca inyectar texto ajeno)", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(v2("session.text.delta", { sessionID: "s2", assistantMessageID: "msg-9", delta: "ajeno" }))
    expect(deps.applyDelta).not.toHaveBeenCalled()
  })

  it("session.reasoning.delta llega tipado como reasoning", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(v2("session.reasoning.delta", { sessionID: "s1", assistantMessageID: "msg-1", ordinal: 1, delta: "pienso" }))
    expect(deps.applyDelta).toHaveBeenCalledWith("s1", "msg-1", "msg-1:reasoning:1", "pienso", false, "reasoning")
  })

  it("session.text.started/ended no pintan ni cierran el turno", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(v2("session.text.started", { sessionID: "s1", assistantMessageID: "msg-1" }))
    result.current(v2("session.text.ended", { sessionID: "s1", assistantMessageID: "msg-1" }))
    expect(deps.applyDelta).not.toHaveBeenCalled()
    expect(deps.onSettled).not.toHaveBeenCalled()
  })

  it("session.execution.succeeded cierra el turno en curso", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(v2("session.execution.succeeded", { sessionID: "s1" }))
    expect(deps.setAwaitingAssistantReply).toHaveBeenCalledWith(false)
    expect(deps.onSettled).toHaveBeenCalledWith("s1", "/dir")
  })

  it("sin awaiting igual reconcilia el historial (turno de otro cliente)", () => {
    const deps = makeDeps({ awaitingRef: () => false })
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(v2("session.execution.succeeded", { sessionID: "s1" }))
    expect(deps.setAwaitingAssistantReply).not.toHaveBeenCalled()
    expect(deps.onSettled).not.toHaveBeenCalled()
    expect(deps.loadSelected).toHaveBeenCalledWith("s1", "/dir")
  })

  it("session.execution.failed muestra el error y cierra", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(v2("session.execution.failed", { sessionID: "s1", error: { type: "x", message: "se cayó el provider" } }))
    expect(deps.setRuntimeError).toHaveBeenCalledWith("se cayó el provider")
    expect(deps.setAwaitingAssistantReply).toHaveBeenCalledWith(false)
    expect(deps.onSettled).toHaveBeenCalledWith("s1", "/dir")
  })

  it("session.execution.interrupted cierra sin error", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(v2("session.execution.interrupted", { sessionID: "s1", reason: "user" }))
    expect(deps.setRuntimeError).not.toHaveBeenCalled()
    expect(deps.setAwaitingAssistantReply).toHaveBeenCalledWith(false)
    expect(deps.onSettled).toHaveBeenCalledWith("s1", "/dir")
  })

  it("session.tool.input.delta pinta input de tool", () => {
    const deps = makeDeps()
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(v2("session.tool.input.delta", { sessionID: "s1", assistantMessageID: "msg-1", id: "call-7", delta: "{\"a\":" }))
    expect(deps.applyDelta).toHaveBeenCalledWith("s1", "msg-1", "call-7", "{\"a\":", false, "tool")
  })
})

describe("useSSEHandler — re-arme de awaiting con deltas en vivo", () => {
  beforeEach(() => {
    vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => { cb(0); return 1 })
    vi.stubGlobal("cancelAnimationFrame", () => {})
  })
  afterEach(() => { vi.unstubAllGlobals() })

  function delta(sessionID: string): SSEEvent {
    return {
      id: `evt-delta-${sessionID}`,
      type: "session.text.delta",
      properties: {
        id: `evt-delta-${sessionID}`, created: Date.now(), type: "session.text.delta",
        data: { sessionID, assistantMessageID: "msg-1", ordinal: 0, delta: "hola" },
      },
    } as unknown as SSEEvent
  }

  it("un delta de la sesión visible re-arma awaiting tras un settle prematuro", () => {
    const deps = makeDeps({ awaitingRef: () => false })
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(delta("s1"))
    expect(deps.applyDelta).toHaveBeenCalledWith("s1", "msg-1", "msg-1:text:0", "hola", false, "text")
    expect(deps.setAwaitingAssistantReply).toHaveBeenCalledWith(true)
  })

  it("un delta de otra sesión no re-arma ni pinta", () => {
    const deps = makeDeps({ awaitingRef: () => false })
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(delta("s2"))
    expect(deps.applyDelta).not.toHaveBeenCalled()
    expect(deps.setAwaitingAssistantReply).not.toHaveBeenCalled()
  })

  it("con awaiting activo no llama de más, solo pinta", () => {
    const deps = makeDeps({ awaitingRef: () => true })
    const { result } = renderHook(() => useSSEHandler(deps))
    result.current(delta("s1"))
    expect(deps.applyDelta).toHaveBeenCalled()
    expect(deps.setAwaitingAssistantReply).not.toHaveBeenCalled()
  })
})
