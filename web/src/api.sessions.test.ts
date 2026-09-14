import { describe, it, expect, vi, beforeEach } from "vitest"
import { api } from "./api"
import { getApiVersion } from "./shared/api/version"
import { request } from "./shared/api/client"
import type { ServerConfig } from "./types"

// Regresión "solo un proyecto visible": v2 /session devuelve 50 por defecto y
// /project devuelve `canonical` (no directory/worktree). El snapshot completo
// necesita limit alto y los proyectos sus dirs.
vi.mock("./shared/api/version", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared/api/version")>()
  return { ...actual, getApiVersion: vi.fn() }
})

vi.mock("./shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared/api/client")>()
  return { ...actual, request: vi.fn(), requestRaw: vi.fn() }
})

vi.mock("./shared/api/opencodeClient", () => ({
  getOpencodeClient: vi.fn(),
}))

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
  CapacitorHttp: { request: vi.fn() },
}))

const mockedVersion = getApiVersion as unknown as ReturnType<typeof vi.fn>
const mockedRequest = request as unknown as ReturnType<typeof vi.fn>

function cfg(): ServerConfig {
  return { host: "127.0.0.1", port: 4098, username: "opencode", password: "octavio", apiVersion: "auto" }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockedVersion.mockResolvedValue("v2")
})

describe("api.listSessions limit", () => {
  it("v2 agrega limit (snapshot completo)", async () => {
    mockedRequest.mockResolvedValue([])
    await api.listSessions(cfg(), undefined, 5000)
    expect(String(mockedRequest.mock.calls[0]![1])).toBe("/session?limit=5000")
  })

  it("v2 combina directory + limit", async () => {
    mockedRequest.mockResolvedValue([])
    await api.listSessions(cfg(), "G:\\Proyectos\\a", 5000)
    expect(String(mockedRequest.mock.calls[0]![1])).toBe("/session?directory=G%3A%2FProyectos%2Fa&limit=5000")
  })

  it("v2 combina limit + project (sesiones por proyecto)", async () => {
    mockedRequest.mockResolvedValue([])
    await api.listSessions(cfg(), undefined, 1000, "6c76bff9")
    expect(String(mockedRequest.mock.calls[0]![1])).toBe("/session?limit=1000&project=6c76bff9")
  })

  it("v1 ignorar project (no existe el filtro)", async () => {
    mockedVersion.mockResolvedValue("v1")
    mockedRequest.mockResolvedValue([])
    await api.listSessions(cfg(), undefined, 1000, "6c76bff9")
    expect(String(mockedRequest.mock.calls[0]![1])).toBe("/session")
  })

  it("v1 ignora limit (pagina con /experimental/session)", async () => {
    mockedVersion.mockResolvedValue("v1")
    mockedRequest.mockResolvedValue([])
    await api.listSessions(cfg(), "G:\\Proyectos\\a", 5000)
    expect(String(mockedRequest.mock.calls[0]![1])).toBe("/session?directory=G%3A%2FProyectos%2Fa")
  })

  it("v2 sin limit usa el default del server", async () => {
    mockedRequest.mockResolvedValue([])
    await api.listSessions(cfg())
    expect(String(mockedRequest.mock.calls[0]![1])).toBe("/session")
  })

  it("listGlobalSessions v2 reenvía el limit", async () => {
    mockedRequest.mockResolvedValue([])
    await api.listGlobalSessions(cfg(), 5000)
    expect(String(mockedRequest.mock.calls[0]![1])).toBe("/session?limit=5000")
  })

  it("v2 mapea location.directory a Session.directory", async () => {
    mockedRequest.mockResolvedValue([
      { id: "s1", title: "t", location: { directory: "G:\\Proyectos\\a" }, time: { created: 1, updated: 2 } },
    ])
    const out = await api.listSessions(cfg())
    expect(out[0]!.directory).toBe("G:\\Proyectos\\a")
  })

  it("listSessionsByProject usa /api explícito (no depende de la versión detectada)", async () => {
    mockedRequest.mockResolvedValue([
      { id: "s1", location: { directory: "G:\\Proyectos\\a" }, time: { created: 1, updated: 2 } },
    ])
    const out = await api.listSessionsByProject(cfg(), "6c76bff9", 1000)
    expect(String(mockedRequest.mock.calls[0]![1])).toBe("/api/session?limit=1000&project=6c76bff9")
    expect((mockedRequest.mock.calls[0]![2] as { rawPath?: boolean }).rawPath).toBe(true)
    expect(out[0]!.directory).toBe("G:\\Proyectos\\a")
  })
})

describe("api.listProjects canonicals", () => {
  it("v2 mapea canonical cuando no hay directory/worktree", async () => {
    mockedRequest.mockResolvedValue([
      { id: "p1", canonical: "G:\\Proyectos\\a" },
      { id: "p2", canonical: "G:\\Proyectos\\b" },
    ])
    const out = await api.listProjects(cfg())
    expect(out.map((p) => p.directory)).toEqual(["G:\\Proyectos\\a", "G:\\Proyectos\\b"])
    expect(out[0]!.name).toBe("a")
    expect(out[1]!.id).toBe("p2")
  })

  it("prefiere directory/worktree sobre canonical", async () => {
    mockedRequest.mockResolvedValue([
      { id: "p", directory: "G:/Explicit", canonical: "G:/Canon" },
      { id: "q", worktree: "G:/Worktree", canonical: "G:/Canon2" },
    ])
    const out = await api.listProjects(cfg())
    expect(out.map((p) => p.directory)).toEqual(["G:/Explicit", "G:/Worktree"])
  })

  it("descarta proyectos sin dir resoluble", async () => {
    mockedRequest.mockResolvedValue([{ id: "p1" }, { id: "p2", canonical: "" }])
    const out = await api.listProjects(cfg())
    expect(out).toEqual([])
  })

  it("cae al path v2 explícito si la versión detectada devuelve vacío/SPA", async () => {
    mockedRequest.mockResolvedValueOnce([])
    mockedRequest.mockResolvedValueOnce([{ id: "p1", canonical: "G:\\Proyectos\\a" }])
    const out = await api.listProjects(cfg())
    expect(out.map((p) => p.directory)).toEqual(["G:\\Proyectos\\a"])
    expect(String(mockedRequest.mock.calls[1]![1])).toBe("/api/project")
    expect((mockedRequest.mock.calls[1]![2] as { rawPath?: boolean }).rawPath).toBe(true)
  })
})
