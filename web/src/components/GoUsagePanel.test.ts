import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useGoUsage, __resetGoUsageCacheForTests } from "./GoUsagePanel"

vi.mock("../shell", () => ({
  shell: {
    zenGo: {
      usage: vi.fn(() =>
        Promise.resolve({
          usage: {
            rolling: { status: "ok", percent: 10, resetsAt: "2026-09-16T01:00:00.000Z" },
            weekly: { status: "ok", percent: 20, resetsAt: "2026-09-21T00:00:00.000Z" },
            monthly: { status: "ok", percent: 99, resetsAt: "2026-09-27T16:00:00.000Z" },
          },
        }),
      ),
      models: vi.fn(() => Promise.resolve({ object: "list", data: [{ id: "kimi-k3" }, { id: "nuevo-xyz" }] })),
      keyStatus: vi.fn(() => Promise.resolve({ configured: true, source: "custom" })),
      setKey: vi.fn(() => Promise.resolve({ ok: true, source: "custom" })),
      clearKey: vi.fn(() => Promise.resolve({ ok: true, source: "auth" })),
    },
  },
}))

const { stableT } = vi.hoisted(() => ({ stableT: (key: string) => key }))

vi.mock("../i18n-context", () => ({
  // Estable entre renders (como el real, memo por idioma): si devolviera una
  // función nueva cada vez, el useEffect([load]) entraría en loop infinito.
  useT: () => stableT,
}))

describe("useGoUsage", () => {
  beforeEach(() => {
    localStorage.clear()
    __resetGoUsageCacheForTests()
  })

  afterEach(() => {
    __resetGoUsageCacheForTests()
  })

  it("carga uso + modelos y queda ready", async () => {
    const { result } = renderHook(() => useGoUsage())
    await waitFor(() => expect(result.current.state.kind).toBe("ready"))
    const st = result.current.state
    if (st.kind !== "ready") throw new Error("no ready")
    expect(st.usage.usage.monthly.percent).toBe(99)
    expect(st.models.map((m) => m.id)).toEqual(["kimi-k3", "nuevo-xyz"])
    expect(st.source).toBe("custom")
  })

  it("falla con mensaje si el puente no responde", async () => {
    const { shell } = await import("../shell")
    vi.mocked(shell.zenGo.usage).mockRejectedValueOnce(new Error("Sin key opencode-go"))
    const { result } = renderHook(() => useGoUsage())
    await waitFor(() => expect(result.current.state.kind).toBe("error"))
    const st = result.current.state
    if (st.kind !== "error") throw new Error("no error")
    expect(st.message).toBe("Sin key opencode-go")
  })

  it("reload vuelve a pedir", async () => {
    const { shell } = await import("../shell")
    const { result } = renderHook(() => useGoUsage())
    await waitFor(() => expect(result.current.state.kind).toBe("ready"))
    const calls = vi.mocked(shell.zenGo.usage).mock.calls.length
    result.current.reload()
    await waitFor(() => expect(vi.mocked(shell.zenGo.usage).mock.calls.length).toBeGreaterThan(calls))
  })

  it("el segundo montaje usa la caché: no pide de nuevo", async () => {
    const { shell } = await import("../shell")
    const first = renderHook(() => useGoUsage())
    await waitFor(() => expect(first.result.current.state.kind).toBe("ready"))
    const calls = vi.mocked(shell.zenGo.usage).mock.calls.length
    // Simula entrar al chat / abrir el modal: otro montaje con dato fresco.
    const second = renderHook(() => useGoUsage())
    await waitFor(() => expect(second.result.current.state.kind).toBe("ready"))
    expect(vi.mocked(shell.zenGo.usage).mock.calls.length).toBe(calls)
    expect(second.result.current.updatedAt).toBe(first.result.current.updatedAt)
    first.unmount()
    second.unmount()
  })

  it("con caché vencida (>20 min) revalida en fondo sin parpadeo", async () => {
    const { shell } = await import("../shell")
    const { __ageGoUsageCacheForTests } = await import("./GoUsagePanel")
    const first = renderHook(() => useGoUsage())
    await waitFor(() => expect(first.result.current.state.kind).toBe("ready"))
    const calls = vi.mocked(shell.zenGo.usage).mock.calls.length
    first.unmount()
    // Pasan 21 minutos: entrar a ver muestra lo guardado y pide en fondo.
    __ageGoUsageCacheForTests(21 * 60 * 1000)
    const second = renderHook(() => useGoUsage())
    await waitFor(() => expect(second.result.current.state.kind).toBe("ready"))
    await waitFor(() => expect(vi.mocked(shell.zenGo.usage).mock.calls.length).toBeGreaterThan(calls))
    second.unmount()
  })
})
