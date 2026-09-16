import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
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

const persistedFinal = (text: string) => ({
  info: { id: "A", role: "assistant", sessionID: "s1", time: { created: 1, completed: 2 } },
  parts: [{ id: "prt_server_1", type: "text", text }],
})

  // Los deltas se coalescan por requestAnimationFrame; en tests se ejecuta
  // directo para que applyDelta corra sincrónico (también los append).
  beforeEach(() => {
    mockedLoad.mockReset()
    mockedLoad.mockResolvedValue([])
    vi.stubGlobal("requestAnimationFrame", (cb: (t: number) => void) => { cb(0); return 1 })
    vi.stubGlobal("cancelAnimationFrame", () => {})
  })
  afterEach(() => { vi.unstubAllGlobals() })

// El shell streameado usa part IDs sintetizados (A:text:0) mientras el server
// persiste con sus propios IDs (prt_*). Al conciliar el fetch, el part local
// no debe duplicar el texto ya traído por el server.
describe("useMessages — conciliación de parts streameados", () => {
  it("no duplica el texto final (server + shell streameado)", async () => {
    const { result } = renderHook(() => useMessages(config))
    await act(async () => {
      await result.current.loadSelected("s1", "/dir")
    })
    // Stream en vivo con replace (vía inmediata, sin rAF).
    act(() => {
      result.current.applyDelta("s1", "A", "A:text:0", "hola mundo", true, "text")
    })
    expect(result.current.renderedMessages.map((m) => m.text)).toEqual(["hola mundo"])
    // Cierre de turno: el fetch trae el mismo texto con IDs del server.
    mockedLoad.mockResolvedValue([persistedFinal("hola mundo")])
    await act(async () => {
      await result.current.loadSelected("s1", "/dir")
    })
    expect(result.current.renderedMessages.map((m) => m.text)).toEqual(["hola mundo"])
  })

  it("conserva tool parts locales que el fetch no trae", async () => {
    const { result } = renderHook(() => useMessages(config))
    await act(async () => {
      await result.current.loadSelected("s1", "/dir")
    })
    act(() => {
      result.current.applyDelta("s1", "A", "call-local", '{"a":1}', false, "tool")
    })
    mockedLoad.mockResolvedValue([persistedFinal("listo")])
    await act(async () => {
      await result.current.loadSelected("s1", "/dir")
    })
    const [msg] = result.current.renderedMessages
    expect(msg.text).toBe("listo")
    expect(msg.toolParts.map((p) => p.id)).toContain("call-local")
  })
})
