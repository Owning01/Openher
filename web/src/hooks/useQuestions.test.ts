import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { api } from "../api"
import { useQuestions } from "./useQuestions"
import { clearQuestionSettled, recordQuestionSettled } from "../utils/questionStore"

vi.mock("../api", () => ({
  api: {
    listPendingQuestions: vi.fn(),
    listPermissions: vi.fn(),
    questionReply: vi.fn(),
    questionReject: vi.fn(),
  },
}))

const mockedQ = vi.mocked(api.listPendingQuestions)
const mockedP = vi.mocked(api.listPermissions)
const mockedReply = vi.mocked(api.questionReply)

beforeEach(() => {
  vi.useFakeTimers()
  clearQuestionSettled()
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

const question = (id: string, sessionID: string, callID: string) => ({
  id,
  sessionID,
  questions: [{ question: "¿Seguimos?", header: "Seguir", options: [], multiple: false, custom: true }],
  tool: { messageID: `msg_${id}`, callID },
})

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

describe("useQuestions cierre sticky", () => {
  it("dismiss agrega el id a dismissed y el poll no la reinyecta", async () => {
    mockedQ.mockResolvedValue([question("frm_1", "s1", "call_1")] as never)
    const { result } = renderHook(() => useQuestions({ ...baseProps, fallbackSessionID: "s1" }))
    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })
    expect(result.current.pendingQuestions.map((q) => q.id)).toEqual(["frm_1"])

    act(() => {
      result.current.handleDismissQuestion("frm_1")
    })
    expect(result.current.pendingQuestions).toHaveLength(0)
    expect(result.current.dismissedQuestions.has("frm_1")).toBe(true)
    expect(result.current.dismissedQuestions.has("call_1")).toBe(true)

    // +15s: el server sigue reportando la pregunta, pero sigue dismissada.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(result.current.pendingQuestions).toHaveLength(0)
  })

  it("clearDismissedQuestions reabre la pregunta (click en badge)", async () => {
    mockedQ.mockResolvedValue([question("frm_1", "s1", "call_1")] as never)
    const { result } = renderHook(() => useQuestions({ ...baseProps, fallbackSessionID: "s1" }))
    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })
    act(() => {
      result.current.handleDismissQuestion("frm_1")
    })
    expect(result.current.pendingQuestions).toHaveLength(0)

    act(() => {
      result.current.clearDismissedQuestions()
    })
    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })
    expect(result.current.pendingQuestions.map((q) => q.id)).toEqual(["frm_1"])
  })

  it("dismissSessionQuestions cierra solo las preguntas de la sesión indicada (abort)", async () => {
    mockedQ.mockResolvedValue([
      question("frm_1", "s1", "call_1"),
      question("frm_2", "s2", "call_2"),
    ] as never)
    const { result } = renderHook(() => useQuestions({ ...baseProps }))
    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })
    expect(result.current.pendingQuestions).toHaveLength(2)

    act(() => {
      result.current.dismissSessionQuestions("s2")
    })
    expect(result.current.pendingQuestions.map((q) => q.id)).toEqual(["frm_1"])

    // El poll no la reinyecta.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(result.current.pendingQuestions.map((q) => q.id)).toEqual(["frm_1"])
  })

  it("recordQuestionSettled(formID) quita la pregunta y bloquea la reinyección", async () => {
    mockedQ.mockResolvedValue([question("frm_1", "s1", "call_1")] as never)
    const { result } = renderHook(() => useQuestions({ ...baseProps, fallbackSessionID: "s1" }))
    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })
    expect(result.current.pendingQuestions).toHaveLength(1)

    act(() => {
      recordQuestionSettled("frm_1", "answered", [["sí"]])
    })
    expect(result.current.pendingQuestions).toHaveLength(0)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000)
    })
    expect(result.current.pendingQuestions).toHaveLength(0)
  })

  it("handleQuestionReply propaga el error sin cerrar la pregunta", async () => {
    mockedQ.mockResolvedValue([question("frm_1", "s1", "call_1")] as never)
    mockedReply.mockRejectedValueOnce(new Error("Unknown form field: q0"))
    const { result } = renderHook(() => useQuestions({ ...baseProps, fallbackSessionID: "s1" }))
    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })

    await act(async () => {
      await expect(result.current.handleQuestionReply("frm_1", [["x"]])).rejects.toThrow("Unknown form field")
    })
    expect(result.current.pendingQuestions).toHaveLength(1)
  })
})
