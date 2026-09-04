import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { api } from "../api"
import { useQuestions } from "./useQuestions"

vi.mock("../api", () => ({
  api: {
    listPendingQuestions: vi.fn(),
    listPermissions: vi.fn(),
  },
}))

const mockedQ = vi.mocked(api.listPendingQuestions)
const mockedP = vi.mocked(api.listPermissions)

beforeEach(() => {
  vi.useFakeTimers()
  mockedQ.mockResolvedValue([])
  mockedP.mockResolvedValue([])
})

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

const baseProps = {
  config: { server: "http://127.0.0.1:4098" } as never,
  directory: "/proj",
  enabled: true,
}

describe("useQuestions anti-loop", () => {
  it("re-render del padre sin cambios no dispara fetch inmediato", async () => {
    const { rerender } = renderHook(({ n }: { n: number }) => useQuestions({ ...baseProps, fallbackSessionID: "s1" }), {
      initialProps: { n: 0 },
    })
    await act(async () => {
      await Promise.resolve()
    })
    // Solo el poll inmediato del mount (sin avanzar timers: el intervalo no corre)
    expect(mockedQ.mock.calls.length).toBe(1)
    // 5 re-renders del padre: 0 fetch extra (antes: loop → fetch por render)
    for (let i = 1; i <= 5; i++) {
      rerender({ n: i })
      await act(async () => {
        await Promise.resolve()
      })
    }
    expect(mockedQ.mock.calls.length).toBe(1)
    expect(mockedP.mock.calls.length).toBe(1)
    // El intervalo sí sigue funcionando: +15s → 1 poll más por endpoint
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(mockedQ.mock.calls.length).toBe(2)
    expect(mockedP.mock.calls.length).toBe(2)
  })

  it("respuesta idéntica repetida no cambia la identidad del estado", async () => {
    mockedQ.mockResolvedValue([{ id: "q1", sessionID: "s1" }] as never)
    const { result, rerender } = renderHook(() => useQuestions({ ...baseProps, fallbackSessionID: "s1" }))
    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })
    const first = result.current.pendingQuestions
    rerender()
    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })
    // Mismo contenido → misma referencia (sin re-render en cascada)
    expect(result.current.pendingQuestions).toBe(first)
  })
})
