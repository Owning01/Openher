import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { api } from "../api"
import { useMessages } from "./useMessages"

vi.mock("../api", () => ({
  api: {
    loadMessages: vi.fn(),
  },
}))

const mockedLoad = vi.mocked(api.loadMessages)

const config = { host: "127.0.0.1", port: 4098, username: "u", password: "p" } as never

beforeEach(() => {
  mockedLoad.mockReset()
  mockedLoad.mockResolvedValue([])
})

// La conversación visible debe aislarse por sesión: un mensaje que entró por
// otra vía (race de transición, SSE tardío, caché) no puede renderizarse en el
// chat abierto — p. ej. el resumen de compactación de OTRO chat.
describe("useMessages — aislamiento por sesión", () => {
  it("no renderiza mensajes de otra sesión", async () => {
    const { result } = renderHook(() => useMessages(config))
    await act(async () => {
      await result.current.loadSelected("s1", "/dir")
    })
    act(() => {
      result.current.setMessages([
        { info: { id: "m1", role: "user", sessionID: "s1", time: { created: 1 } }, parts: [{ id: "p1", type: "text", text: "propio" }] },
        { info: { id: "m2", role: "assistant", sessionID: "s2", time: { created: 2 } }, parts: [{ id: "p2", type: "compaction", text: "resumen ajeno" }] },
      ])
    })
    expect(result.current.renderedMessages.map((m) => m.info.id)).toEqual(["m1"])
  })

  it("conserva mensajes sin sessionID (optimistas locales)", async () => {
    const { result } = renderHook(() => useMessages(config))
    await act(async () => {
      await result.current.loadSelected("s1", "/dir")
    })
    act(() => {
      result.current.setMessages([
        { info: { id: "m1", role: "assistant", sessionID: "s1", time: { created: 1 } }, parts: [{ id: "p1", type: "text", text: "propio" }] },
        { info: { id: "local", role: "user", time: { created: 2 } }, parts: [{ id: "p2", type: "text", text: "sin sesión" }] },
      ])
    })
    expect(result.current.renderedMessages.map((m) => m.info.id).sort()).toEqual(["local", "m1"])
  })
})
