import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

const h = vi.hoisted(() => ({
  install: vi.fn(async () => ({ ok: true })),
  writeFile: vi.fn(async () => ({ uri: "file:///cache/openher-update.apk" })),
  getInfo: vi.fn(async () => ({ version: "1.0.9", build: "10009" })),
  appVersion: vi.fn(),
  downloadApk: vi.fn(),
  appVersionFrom: vi.fn(),
  desktopVersion: vi.fn(),
  desktopUpdate: vi.fn(),
  desktopUpdateStatus: vi.fn(),
  remoteShellBase: vi.fn(),
  isNative: vi.fn(() => true),
}))

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: () => h.isNative() },
  registerPlugin: () => ({ install: h.install }),
}))
vi.mock("@capacitor/app", () => ({
  App: { getInfo: h.getInfo, addListener: vi.fn(async () => ({ remove: vi.fn() })) },
}))
vi.mock("@capacitor/filesystem", () => ({
  Filesystem: { writeFile: h.writeFile },
  Directory: { Cache: "CACHE" },
}))
vi.mock("../shell", () => ({
  shell: {
    appVersion: h.appVersion,
    downloadApk: h.downloadApk,
    appVersionFrom: h.appVersionFrom,
    desktopVersion: h.desktopVersion,
    desktopUpdate: h.desktopUpdate,
    desktopUpdateStatus: h.desktopUpdateStatus,
  },
  remoteShellBase: h.remoteShellBase,
}))

import { useAppUpdate } from "./useAppUpdate"

const updateInfo = (versionCode: number, version: string, desktop?: { version: string; versionCode: number }) => ({
  name: "OpenHer",
  version,
  versionCode,
  file: "openher.apk",
  sha256: "abc",
  size: 20405580,
  builtAt: "2026-09-12T00:00:00.000Z",
  notes: "cambios",
  desktop: desktop
    ? { file: "openher-desktop.zip", sha256: "def", size: 1234, version: desktop.version, versionCode: desktop.versionCode }
    : undefined,
})

beforeEach(() => {
  vi.clearAllMocks()
  h.isNative.mockReturnValue(true)
  delete (window as unknown as Record<string, unknown>).__OPENHER_DESKTOP__
  h.getInfo.mockResolvedValue({ version: "1.0.9", build: "10009" })
  h.appVersion.mockResolvedValue(null)
  h.downloadApk.mockResolvedValue(new Blob(["apk-bytes"]))
  h.remoteShellBase.mockReturnValue(null)
  h.appVersionFrom.mockResolvedValue(null)
  h.desktopVersion.mockResolvedValue({ version: "1.0.9", versionCode: 10009 })
  h.desktopUpdate.mockResolvedValue(undefined)
  h.desktopUpdateStatus.mockResolvedValue({ state: "idle" })
})

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).__OPENHER_DESKTOP__
})

describe("useAppUpdate (APK)", () => {
  it("detecta versión nueva comparando versionCode con el build instalado", async () => {
    h.appVersion.mockResolvedValue(updateInfo(10010, "1.0.10"))
    const { result, unmount } = renderHook(() => useAppUpdate())
    await act(async () => {
      await result.current.check(true)
    })
    expect(result.current.status).toBe("available")
    expect(result.current.info?.version).toBe("1.0.10")
    unmount()
  })

  it("misma versión no ofrece actualización", async () => {
    h.appVersion.mockResolvedValue(updateInfo(10009, "1.0.9"))
    const { result, unmount } = renderHook(() => useAppUpdate())
    await act(async () => {
      await result.current.check(true)
    })
    expect(result.current.status).toBe("idle")
    unmount()
  })

  it("install descarga, guarda en caché y abre el instalador nativo", async () => {
    h.appVersion.mockResolvedValue(updateInfo(10010, "1.0.10"))
    const { result, unmount } = renderHook(() => useAppUpdate())
    await act(async () => {
      await result.current.check(true)
    })
    await act(async () => {
      await result.current.install()
    })
    expect(h.downloadApk).toHaveBeenCalled()
    expect(h.writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: "openher-update.apk" }))
    expect(h.install).toHaveBeenCalledWith({ name: "openher-update.apk" })
    unmount()
  })
})

describe("useAppUpdate (desktop remoto)", () => {
  beforeEach(() => {
    h.isNative.mockReturnValue(false)
    ;(window as unknown as Record<string, unknown>).__OPENHER_DESKTOP__ = true
    h.remoteShellBase.mockReturnValue("http://100.77.237.102:4848")
  })

  it("sin shell remoto (server local) no chequea", async () => {
    h.remoteShellBase.mockReturnValue(null)
    const { result, unmount } = renderHook(() => useAppUpdate())
    await act(async () => {
      await result.current.check(true)
    })
    expect(h.appVersionFrom).not.toHaveBeenCalled()
    expect(result.current.status).toBe("idle")
    unmount()
  })

  it("detecta el zip del desktop más nuevo que la versión instalada", async () => {
    h.appVersionFrom.mockResolvedValue(updateInfo(10019, "1.0.19", { version: "1.0.19", versionCode: 10019 }))
    h.desktopVersion.mockResolvedValue({ version: "1.0.18", versionCode: 10018 })
    const { result, unmount } = renderHook(() => useAppUpdate())
    await act(async () => {
      await result.current.check(true)
    })
    expect(result.current.status).toBe("available")
    expect(result.current.info?.desktop?.version).toBe("1.0.19")
    unmount()
  })

  it("no ofrece update si la versión instalada ya es la publicada", async () => {
    h.appVersionFrom.mockResolvedValue(updateInfo(10018, "1.0.18", { version: "1.0.18", versionCode: 10018 }))
    h.desktopVersion.mockResolvedValue({ version: "1.0.18", versionCode: 10018 })
    const { result, unmount } = renderHook(() => useAppUpdate())
    await act(async () => {
      await result.current.check(true)
    })
    expect(result.current.status).toBe("idle")
    unmount()
  })

  it("install baja el zip del shell remoto y polling hasta que reinicia", async () => {
    h.appVersionFrom.mockResolvedValue(updateInfo(10019, "1.0.19", { version: "1.0.19", versionCode: 10019 }))
    h.desktopUpdateStatus.mockResolvedValue({ state: "ready" })
    const { result, unmount } = renderHook(() => useAppUpdate())
    await act(async () => {
      await result.current.check(true)
    })
    await act(async () => {
      await result.current.install()
    })
    expect(h.desktopUpdate).toHaveBeenCalledWith(
      "http://100.77.237.102:4848/openher-desktop.zip",
      "def",
    )
    unmount()
  })
})
