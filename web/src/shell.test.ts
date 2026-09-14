import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { kanbanPromptText, shellAuthHeader, shell, deriveShellBaseFromServer, resolveShellBase, invalidateShellBase } from "./shell"
import { Capacitor, CapacitorHttp } from "@capacitor/core"

// El shell debe usar el puente nativo en APK (CapacitorHttp): un fetch plano
// desde https://localhost a http://<pc>:4848 es mixed-content + CORS.
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
  CapacitorHttp: { request: vi.fn() },
}))

const mockedCapacitor = Capacitor as unknown as { isNativePlatform: ReturnType<typeof vi.fn> }
const mockedHttp = CapacitorHttp as unknown as { request: ReturnType<typeof vi.fn> }

describe("kanbanPromptText", () => {
  it("solo título sin notas", () => {
    expect(kanbanPromptText("Hacer login", "")).toBe("Hacer login")
    expect(kanbanPromptText("Hacer login", "   ")).toBe("Hacer login")
  })
  it("título + notas separadas por línea en blanco", () => {
    expect(kanbanPromptText("Hacer login", "usar OAuth2")).toBe("Hacer login\n\nusar OAuth2")
  })
  it("recorta bordes", () => {
    expect(kanbanPromptText("  T  ", "  N  ")).toBe("T\n\nN")
  })
})

describe("shellAuthHeader", () => {
  beforeEach(() => localStorage.clear())

  it("manda Basic con username aunque el password esté vacío (pair móvil sin contraseña)", () => {
    localStorage.setItem(
      "opencode.remote.server",
      JSON.stringify({ host: "100.64.0.2", port: 4098, username: "opencode", password: "" })
    )
    expect(shellAuthHeader()).toEqual({ Authorization: `Basic ${btoa("opencode:")}` })
  })

  it("manda Basic con user:pass cuando hay contraseña", () => {
    localStorage.setItem(
      "opencode.remote.server",
      JSON.stringify({ host: "100.64.0.2", port: 4098, username: "opencode", password: "secreto" })
    )
    expect(shellAuthHeader()).toEqual({ Authorization: `Basic ${btoa("opencode:secreto")}` })
  })

  it("sin username no manda header", () => {
    localStorage.setItem("opencode.remote.server", JSON.stringify({ host: "100.64.0.2", port: 4098 }))
    expect(shellAuthHeader()).toEqual({})
  })
})

describe("deriveShellBaseFromServer", () => {
  beforeEach(() => localStorage.clear())

  it("deriva http://<host>:4848 del server opencode (sin puerto 4098)", () => {
    localStorage.setItem("opencode.remote.server", JSON.stringify({ host: "100.64.0.2:4098", port: 4098 }))
    expect(deriveShellBaseFromServer()).toBe("http://100.64.0.2:4848")
  })

  it("cae a los perfiles guardados cuando SERVER no tiene host útil", () => {
    localStorage.setItem("opencode.remote.server", JSON.stringify({ host: "127.0.0.1", port: 4098 }))
    localStorage.setItem("openher.activeServer", "p2")
    localStorage.setItem(
      "openher.servers",
      JSON.stringify([
        { id: "p1", config: { host: "100.0.0.1" } },
        { id: "p2", config: { host: "100.64.0.9" } },
      ])
    )
    expect(deriveShellBaseFromServer()).toBe("http://100.64.0.9:4848")
  })

  it("null si solo hay loopback o nada", () => {
    expect(deriveShellBaseFromServer()).toBeNull()
    localStorage.setItem("opencode.remote.server", JSON.stringify({ host: "localhost" }))
    expect(deriveShellBaseFromServer()).toBeNull()
  })
})

describe("shell nativo (APK): transporte CapacitorHttp", () => {
  beforeEach(() => {
    localStorage.clear()
    invalidateShellBase()
    vi.clearAllMocks()
    mockedCapacitor.isNativePlatform.mockReturnValue(true)
    localStorage.setItem("opencode.remote.server", JSON.stringify({ host: "100.64.0.2", port: 4098, username: "opencode", password: "x" }))
    mockedHttp.request.mockImplementation(async (opts: { url: string }) => {
      if (opts.url.includes("/shell/health")) return { status: 200, data: { ok: true }, headers: {} }
      if (opts.url.includes("/shell/fs/list")) {
        return {
          status: 200,
          data: { path: "C:\\", dirs: [{ name: "sub", path: "C:\\sub", is_dir: true, size: null, modified: null }], files: [] },
          headers: {},
        }
      }
      return { status: 404, data: { error: "nope" }, headers: {} }
    })
  })

  afterEach(() => {
    mockedCapacitor.isNativePlatform.mockReturnValue(false)
    invalidateShellBase()
  })

  it("resuelve la base derivada y lista carpetas por CapacitorHttp (no fetch)", async () => {
    const res = await shell.fs.list("C:\\")
    expect(res.dirs[0]?.name).toBe("sub")
    const urls = mockedHttp.request.mock.calls.map((c) => (c[0] as { url: string }).url)
    expect(urls.some((u) => u === "http://100.64.0.2:4848/shell/health")).toBe(true)
    expect(urls.some((u) => u.startsWith("http://100.64.0.2:4848/shell/fs/list?path="))).toBe(true)
    const listCall = mockedHttp.request.mock.calls.find((c) => String((c[0] as { url: string }).url).includes("/shell/fs/list"))
    expect((listCall?.[0] as { headers?: Record<string, string> }).headers?.Authorization).toBe(`Basic ${btoa("opencode:x")}`)
  })

  it("resolveShellBase en nativo no acepta el same-origin: usa el host del PC", async () => {
    expect(await resolveShellBase()).toBe("http://100.64.0.2:4848")
    mockedHttp.request.mockClear()
    expect(await resolveShellBase()).toBe("http://100.64.0.2:4848")
    // cacheado: no vuelve a probar dentro del TTL
    expect(mockedHttp.request).not.toHaveBeenCalled()
  })
})
