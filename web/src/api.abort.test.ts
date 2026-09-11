import { describe, it, expect, vi, beforeEach } from "vitest"
import { api } from "./api"
import { getApiVersion } from "./shared/api/version"
import { getOpencodeClient } from "./shared/api/opencodeClient"
import { request, requestRaw } from "./shared/api/client"
import type { ServerConfig } from "./types"

// Regresión del botón stop ("no para"): en auto sin versión detectada el
// abort iba a /session/:id/abort e /interrupt SIN el prefijo /api contra un
// server v2 → doble 404 tragado en silencio y el server seguía generando.
vi.mock("./shared/api/version", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared/api/version")>()
  return { ...actual, getApiVersion: vi.fn() }
})

vi.mock("./shared/api/opencodeClient", () => ({
  getOpencodeClient: vi.fn(),
}))

vi.mock("./shared/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./shared/api/client")>()
  return { ...actual, request: vi.fn(), requestRaw: vi.fn() }
})

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
  CapacitorHttp: { request: vi.fn() },
}))

const mockedVersion = getApiVersion as unknown as ReturnType<typeof vi.fn>
const mockedGetClient = getOpencodeClient as unknown as ReturnType<typeof vi.fn>
const mockedRequest = request as unknown as ReturnType<typeof vi.fn>
const mockedRequestRaw = requestRaw as unknown as ReturnType<typeof vi.fn>

function cfg(apiVersion?: ServerConfig["apiVersion"]): ServerConfig {
  return { host: "127.0.0.1", port: 4098, username: "opencode", password: "octavio", apiVersion }
}

function err404() {
  const e = new Error("HTTP 404") as Error & { cause?: unknown }
  e.cause = { status: 404 }
  return e
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("api.abort (botón stop)", () => {
  it("v2 detectado usa el SDK interrupt", async () => {
    mockedVersion.mockResolvedValue("v2")
    const interrupt = vi.fn().mockResolvedValue({ interrupted: true })
    mockedGetClient.mockResolvedValue({ session: { interrupt } })
    await expect(api.abort(cfg(), "s1", "G:/x")).resolves.toBe(true)
    expect(interrupt).toHaveBeenCalledWith({ sessionID: "s1" })
    expect(mockedRequest).not.toHaveBeenCalled()
    expect(mockedRequestRaw).not.toHaveBeenCalled()
  })

  it("v2 con SDK roto cae al path crudo /api/.../interrupt", async () => {
    mockedVersion.mockResolvedValue("v2")
    mockedGetClient.mockRejectedValue(new Error("sdk boom"))
    mockedRequestRaw.mockResolvedValue({ data: { interrupted: true }, headers: {} })
    await expect(api.abort(cfg(), "s1")).resolves.toBe(true)
    const target = String(mockedRequestRaw.mock.calls[0][1])
    expect(target).toContain("/api/session/s1/interrupt")
  })

  it("auto sin detectar + v1 en 404 intenta el path v2 crudo (bug del stop)", async () => {
    mockedVersion.mockResolvedValue("v1")
    mockedRequest.mockRejectedValue(err404())
    mockedRequestRaw.mockResolvedValue({ data: { interrupted: true }, headers: {} })
    await expect(api.abort(cfg(), "s1", "G:/x")).resolves.toBe(true)
    // primary + secondary v1 fallaron…
    expect(mockedRequest).toHaveBeenCalledTimes(2)
    // …y se rescató por el path v2 con prefijo /api explícito.
    const target = String(mockedRequestRaw.mock.calls[0][1])
    expect(target).toContain("/api/session/s1/interrupt")
    expect(target).toContain("directory=")
  })

  it("fallo total lanza error descriptivo (no silencio)", async () => {
    mockedVersion.mockResolvedValue("v1")
    mockedRequest.mockRejectedValue(err404())
    mockedRequestRaw.mockRejectedValue(new Error("Network error"))
    await expect(api.abort(cfg(), "s1")).rejects.toThrow("No se pudo detener")
  })

  it("v1 forzado mantiene la rama clásica sin tocar /api", async () => {
    mockedVersion.mockResolvedValue("v1")
    mockedRequest.mockResolvedValue(true)
    await expect(api.abort(cfg("v1"), "s1")).resolves.toBe(true)
    expect(String(mockedRequest.mock.calls[0][1])).toContain("/session/s1/abort")
    expect(mockedRequestRaw).not.toHaveBeenCalled()
  })
})
