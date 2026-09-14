import { describe, it, expect, vi, beforeEach } from "vitest"
import { api } from "./api"
import { getApiVersion } from "./shared/api/version"
import { request } from "./shared/api/client"
import type { ServerConfig } from "./types"

// v2 no devuelve un array `connected`: se deduce de `connections` de cada
// integración. Sin esto el sheet /connect mostraba TODOS como desconectados
// (nunca el badge ni el botón Desconectar con la credencial ya guardada).
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

describe("api providers (v2 /integration)", () => {
  it("deduce `connected` de connections y conserva el resto", async () => {
    mockedVersion.mockResolvedValue("v2")
    mockedRequest.mockResolvedValue([
      { id: "opencode", name: "OpenCode", connections: [{ type: "credential", id: "cred_1", label: "default" }] },
      { id: "github-copilot", name: "GitHub Copilot", connections: [{ type: "env", name: "GITHUB_TOKEN" }] },
      { id: "anthropic", name: "Anthropic", connections: [] },
      { id: "sin-name", connections: [] },
    ])
    const list = await api.loadProviders(cfg(), "G:/x")
    expect(list.connected).toEqual(["opencode", "github-copilot"])
    expect(list.all.map((p) => p.id)).toEqual(["opencode", "github-copilot", "anthropic", "sin-name"])
    expect(list.all.map((p) => p.name)).toEqual(["OpenCode", "GitHub Copilot", "Anthropic", "sin-name"])
    // Cada cuenta se conserva con id+label para poder listarlas/quitarlas.
    expect(list.all[0].connections).toEqual([{ type: "credential", id: "cred_1", label: "default" }])
    expect(list.all[1].connections).toEqual([{ type: "env", name: "GITHUB_TOKEN" }])
    expect(list.all[2].connections).toEqual([])
    const path = String(mockedRequest.mock.calls[0][1])
    expect(path).toContain("/integration")
    expect(path).toContain("location[directory]=")
  })

  it("varias cuentas del mismo proveedor se listan por separado", async () => {
    mockedVersion.mockResolvedValue("v2")
    mockedRequest.mockResolvedValue([
      {
        id: "anthropic",
        name: "Anthropic",
        connections: [
          { type: "credential", id: "cred_a", label: "personal" },
          { type: "credential", id: "cred_b", label: "trabajo" },
        ],
      },
    ])
    const list = await api.loadProviders(cfg())
    expect(list.all[0].connections).toEqual([
      { type: "credential", id: "cred_a", label: "personal" },
      { type: "credential", id: "cred_b", label: "trabajo" },
    ])
    expect(list.connected).toEqual(["anthropic"])
  })

  it("connect/key manda el label de la cuenta", async () => {
    mockedVersion.mockResolvedValue("v2")
    mockedRequest.mockResolvedValue(undefined)
    await api.setProviderAuth(cfg(), "anthropic", "sk-123", "G:/x", "trabajo")
    const [config, path, options] = mockedRequest.mock.calls[0]
    expect(config.port).toBe(4098)
    expect(String(path)).toContain("/integration/anthropic/connect/key")
    expect(options?.method).toBe("POST")
    expect(options?.body).toEqual({ key: "sk-123", label: "trabajo" })
  })

  it("quitar/activar cuenta usa /credential/:id (v2)", async () => {
    mockedRequest.mockResolvedValue(undefined)
    await api.removeProviderCredential(cfg(), "cred_b", "G:/x")
    expect(String(mockedRequest.mock.calls[0][1])).toContain("/credential/cred_b")
    expect(mockedRequest.mock.calls[0][2]?.method).toBe("DELETE")
    await api.activateProviderCredential(cfg(), "cred_b", "G:/x")
    expect(String(mockedRequest.mock.calls[1][1])).toContain("/credential/cred_b/activate")
    expect(mockedRequest.mock.calls[1][2]?.method).toBe("POST")
  })

  it("removeProviderAuth v2 borra todas las credenciales del proveedor", async () => {
    mockedVersion.mockResolvedValue("v2")
    mockedRequest.mockImplementation((_c: unknown, path: unknown, options?: { method?: string }) => {
      if (options?.method === "DELETE") return Promise.resolve(undefined)
      return Promise.resolve({
        id: "anthropic",
        connections: [
          { type: "credential", id: "cred_a", label: "personal" },
          { type: "env", name: "ANTHROPIC_API_KEY" },
          { type: "credential", id: "cred_b", label: "trabajo" },
        ],
      })
    })
    const removed = await api.removeProviderAuth(cfg(), "anthropic")
    expect(removed).toBe(true)
    const deletes = mockedRequest.mock.calls
      .filter((c) => (c[2] as { method?: string } | undefined)?.method === "DELETE")
      .map((c) => String(c[1]))
    expect(deletes.some((p) => p.includes("/credential/cred_a"))).toBe(true)
    expect(deletes.some((p) => p.includes("/credential/cred_b"))).toBe(true)
    expect(deletes.some((p) => p.includes("/integration/anthropic/disconnect"))).toBe(false)
  })

  it("tolera integraciones sin connections", async () => {
    mockedVersion.mockResolvedValue("v2")
    mockedRequest.mockResolvedValue([{ id: "x", name: "X" }])
    const list = await api.loadProviders(cfg())
    expect(list.connected).toEqual([])
    expect(list.all).toHaveLength(1)
  })

  it("v1 sigue usando /provider tal cual", async () => {
    mockedVersion.mockResolvedValue("v1")
    mockedRequest.mockResolvedValue({ all: [], default: {}, connected: ["anthropic"] })
    const list = await api.loadProviders(cfg())
    expect(list.connected).toEqual(["anthropic"])
    expect(String(mockedRequest.mock.calls[0][1])).toContain("/provider")
  })
})
