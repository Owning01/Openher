import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, waitFor, cleanup, act } from "@testing-library/react"
import { useOpenDesign } from "./useOpenDesign"

const fetchMock = vi.fn()
vi.mock("../../shell", () => ({
  shell: { proxy: { fetch: (...args: unknown[]) => fetchMock(...args) } },
}))

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => body } as unknown as Response
}

beforeEach(() => {
  fetchMock.mockReset()
})

afterEach(() => cleanup())

describe("useOpenDesign", () => {
  it("no consulta nada si está deshabilitado", () => {
    renderHook(() => useOpenDesign(false))
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("detecta el daemon, lista proyectos y resuelve el working directory", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.endsWith("/api/health")) return jsonResponse({ ok: true, version: "0.19.2" })
      if (url.endsWith("/api/projects")) return jsonResponse({ projects: [{ id: "p1", name: "Web Prototype" }] })
      if (url.endsWith("/api/projects/p1")) return jsonResponse({ resolvedDir: "G:\\Proyectos\\landing", name: "Landing", status: { value: "done" } })
      throw new Error(`unexpected url ${url}`)
    })

    const { result } = renderHook(() => useOpenDesign(true))
    await waitFor(() => expect(result.current.projects).toHaveLength(1))
    expect(result.current.projects[0]).toMatchObject({ id: "p1", name: "Landing", directory: "G:\\Proyectos\\landing", status: "done" })
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes("127.0.0.1:3456/api/projects"))).toBe(true)
  })

  it("cae al puerto 7456 si 3456 no responde", async () => {
    fetchMock.mockImplementation(async (url: string) => {
      if (url.includes(":3456/api/health")) return { ok: false, status: 500, json: async () => ({}) } as unknown as Response
      if (url.includes(":7456/api/health")) return jsonResponse({ ok: true })
      if (url.endsWith("/api/projects")) return jsonResponse({ projects: [] })
      throw new Error("unexpected")
    })
    const { result } = renderHook(() => useOpenDesign(true))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toBeNull()
    expect(fetchMock.mock.calls.some(([u]) => String(u).includes(":7456/api/health"))).toBe(true)
  })

  it("reporta error si ningún daemon responde", async () => {
    fetchMock.mockRejectedValue(new Error("connect ECONNREFUSED"))
    const { result } = renderHook(() => useOpenDesign(true))
    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.projects).toEqual([])
  })

  it("una respuesta vieja no pisa a la nueva (request-id)", async () => {
    const lists: Array<(v: unknown) => void> = []
    fetchMock.mockImplementation((url: string) => {
      if (url.endsWith("/api/health")) return Promise.resolve(jsonResponse({ ok: true }))
      if (url.endsWith("/api/projects")) return new Promise((res) => lists.push((v) => res(v)))
      if (url.includes("/api/projects/new")) return Promise.resolve(jsonResponse({ resolvedDir: "G:/new", name: "new" }))
      throw new Error(`unexpected ${url}`)
    })
    const { result } = renderHook(() => useOpenDesign(true))
    await waitFor(() => expect(lists.length).toBe(1))
    await act(async () => { void result.current.refresh() })
    await waitFor(() => expect(lists.length).toBe(2))

    // La petición nueva resuelve primero…
    await act(async () => { lists[1]!(jsonResponse({ projects: [{ id: "new", name: "new" }] })) })
    await waitFor(() => expect(result.current.projects[0]?.id).toBe("new"))

    // …y la vieja resuelve después: no debe pisarla.
    await act(async () => { lists[0]!(jsonResponse({ projects: [{ id: "old", name: "old" }] })) })
    await new Promise((r) => setTimeout(r, 20))
    expect(result.current.projects[0]?.id).toBe("new")
  })
})
