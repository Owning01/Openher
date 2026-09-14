import { describe, it, expect, vi, beforeEach } from "vitest"
import { api } from "./api"
import { getApiVersion } from "./shared/api/version"
import { request } from "./shared/api/client"
import type { ServerConfig } from "./types"

// El server v2 expone GET /api/mcp + POST /api/mcp/:name/(dis)connect.
// El modal de MCP necesitaba esto para listar servidores con estado y
// activarlos/desactivarlos (antes solo existía el catálogo de resources).
vi.mock("./shared/api/version", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared/api/version")>()
  return { ...actual, getApiVersion: vi.fn() }
})

vi.mock("./shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared/api/client")>()
  return { ...actual, request: vi.fn() }
})

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
})

describe("api MCP servers (v2)", () => {
  it("lista servidores con estado y error normalizados", async () => {
    mockedVersion.mockResolvedValue("v2")
    mockedRequest.mockResolvedValue([
      { name: "chrome-devtools", status: { status: "connected" } },
      { name: "firebase", status: { status: "disabled" } },
      { name: "roto", status: { status: "failed", error: "spawn ENOENT" } },
      { name: "raro", status: { status: "otro-estado" } },
      { status: { status: "connected" } },
    ])
    const list = await api.listMCPServers(cfg(), "G:/x")
    expect(list).toEqual([
      { name: "chrome-devtools", status: "connected", error: undefined },
      { name: "firebase", status: "disabled", error: undefined },
      { name: "roto", status: "failed", error: "spawn ENOENT" },
      { name: "raro", status: "disabled", error: undefined },
    ])
    const path = String(mockedRequest.mock.calls[0][1])
    expect(path).toContain("/mcp")
    expect(path).toContain("location[directory]=")
  })

  it("v1 no tiene el endpoint: devuelve [] sin pegarle al server", async () => {
    mockedVersion.mockResolvedValue("v1")
    await expect(api.listMCPServers(cfg())).resolves.toEqual([])
    expect(mockedRequest).not.toHaveBeenCalled()
  })

  it("connect usa POST /mcp/:name/connect con el nombre encodeado", async () => {
    mockedRequest.mockResolvedValue(true)
    await api.connectMCPServer(cfg(), "@playwright/mcp", "G:/x")
    const [config, path, options] = mockedRequest.mock.calls[0]
    expect(config.port).toBe(4098)
    expect(String(path)).toContain("/mcp/%40playwright%2Fmcp/connect")
    expect(String(path)).toContain("location[directory]=")
    expect(options?.method).toBe("POST")
  })

  it("disconnect usa POST /mcp/:name/disconnect", async () => {
    mockedRequest.mockResolvedValue(true)
    await api.disconnectMCPServer(cfg(), "firebase")
    const path = String(mockedRequest.mock.calls[0][1])
    expect(path).toContain("/mcp/firebase/disconnect")
    expect(mockedRequest.mock.calls[0][2]?.method).toBe("POST")
  })
})
