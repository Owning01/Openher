import { describe, it, expect, vi, beforeEach } from "vitest"
import { api } from "./api"
import { request } from "./shared/api/client"
import type { ServerConfig } from "./types"

// POST /experimental/session/:sessionID/background?directory= → promueve los
// subagentes sincrónicos de la sesión a background (Ctrl+B de la TUI).
vi.mock("./shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared/api/client")>()
  return { ...actual, request: vi.fn() }
})

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
  CapacitorHttp: { request: vi.fn() },
}))

const mockedRequest = request as unknown as ReturnType<typeof vi.fn>

function cfg(): ServerConfig {
  return { host: "127.0.0.1", port: 4098, username: "opencode", password: "octavio", apiVersion: "auto" }
}

beforeEach(() => vi.clearAllMocks())

describe("promoteSessionBackground", () => {
  it("hace POST al endpoint experimental con el sessionID encodeado y el directory", async () => {
    mockedRequest.mockResolvedValue(true)
    await expect(api.promoteSessionBackground(cfg(), "ses_abc/123", "G:/x")).resolves.toBe(true)
    const [config, path, options] = mockedRequest.mock.calls[0]
    expect(config.port).toBe(4098)
    expect(String(path)).toContain("/experimental/session/ses_abc%2F123/background")
    expect(String(path)).toContain("directory=")
    expect(options?.method).toBe("POST")
    expect(options?.retryable).toBe(false)
  })

  it("propaga false cuando el server no promovió nada", async () => {
    mockedRequest.mockResolvedValue(false)
    await expect(api.promoteSessionBackground(cfg(), "ses_x")).resolves.toBe(false)
  })
})
