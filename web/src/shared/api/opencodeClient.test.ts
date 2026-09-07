import { describe, it, expect, vi, beforeEach } from "vitest"
import { OpenCode } from "@opencode-ai/client"
import { Capacitor, CapacitorHttp } from "@capacitor/core"

// Regresión: en Android (APK) el SDK usaba fetch del WebView y el POST del
// prompt caía por preflight CORS contra http://<tailscale-ip>:puerto, mientras
// los GETs funcionaban por su fallback HTTP. El cliente nativo debe salir por
// CapacitorHttp (sin CORS).
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
  CapacitorHttp: { request: vi.fn() },
}))

vi.mock("@opencode-ai/client", () => ({
  OpenCode: { make: vi.fn(() => ({})) },
}))

const mockedCapacitor = Capacitor as unknown as { isNativePlatform: ReturnType<typeof vi.fn> }
const mockedHttp = CapacitorHttp as unknown as { request: ReturnType<typeof vi.fn> }
const mockedMake = OpenCode.make as unknown as ReturnType<typeof vi.fn>

function cfg(port: number) {
  return { host: "100.64.0.1", port, username: "u", password: "p" } as never
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getOpencodeClient", () => {
  it("en nativo inyecta fetch por CapacitorHttp (sin CORS)", async () => {
    mockedCapacitor.isNativePlatform.mockReturnValue(true)
    const { getOpencodeClient } = await import("./opencodeClient")
    await getOpencodeClient(cfg(4096))
    expect(mockedMake).toHaveBeenCalledOnce()
    const opts = mockedMake.mock.calls[0][0] as { fetch?: unknown }
    expect(typeof opts.fetch).toBe("function")

    mockedHttp.request.mockResolvedValue({
      status: 200,
      headers: { "content-type": "application/json" },
      data: { ok: true },
    })
    const res = await (opts.fetch as typeof fetch)("http://100.64.0.1:4096/api/session/s1/prompt", {
      method: "POST",
      headers: new Headers({ "content-type": "application/json", authorization: "Basic dTpw" }),
      body: JSON.stringify({ text: "hola" }),
    })
    expect(mockedHttp.request).toHaveBeenCalledOnce()
    const args = mockedHttp.request.mock.calls[0][0] as Record<string, unknown>
    expect(args["url"]).toBe("http://100.64.0.1:4096/api/session/s1/prompt")
    expect(args["method"]).toBe("POST")
    expect((args["headers"] as Record<string, string>)["authorization"]).toBe("Basic dTpw")
    expect(args["data"]).toEqual({ text: "hola" })
    expect(res.status).toBe(200)
    expect(res.ok).toBe(true)
    expect(res.headers.get("content-type")).toContain("application/json")
    await expect(res.json()).resolves.toEqual({ ok: true })
  })

  it("en web usa el fetch global (sin shim)", async () => {
    mockedCapacitor.isNativePlatform.mockReturnValue(false)
    const { getOpencodeClient } = await import("./opencodeClient")
    await getOpencodeClient(cfg(4097))
    const opts = mockedMake.mock.calls[0][0] as Record<string, unknown>
    expect("fetch" in opts).toBe(false)
  })
})
