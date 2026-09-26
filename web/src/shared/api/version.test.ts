import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  versionKey,
  resolveApiVersion,
  rememberApiVersion,
  onApiVersionChange,
  apiPath,
  unwrapData,
  ensureVersionDetected,
  getApiVersion,
  setHealthProbe,
  detectedVersionCache,
  detectionPromises,
  versionListeners,
} from "./version"
import type { ServerConfig } from "../../types"

function makeConfig(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    host: "example.com",
    port: 3000,
    username: "",
    password: "",
    apiVersion: "auto",
    ...overrides,
  }
}

describe("versionKey", () => {
  it("trims host", () => {
    expect(versionKey(makeConfig({ host: "  example.com  ", port: 3000 }))).toBe("example.com:3000")
  })
  it("combines host and port", () => {
    expect(versionKey(makeConfig({ host: "localhost", port: 4096 }))).toBe("localhost:4096")
  })
  it("preserves scheme in host if present (only trims)", () => {
    expect(versionKey(makeConfig({ host: "https://example.com", port: 443 }))).toBe("https://example.com:443")
  })
})

describe("resolveApiVersion", () => {
  beforeEach(() => {
    detectedVersionCache.clear()
    localStorage.clear()
    detectionPromises.clear()
  })
  it("returns forced v1 without cache", () => {
    expect(resolveApiVersion(makeConfig({ apiVersion: "v1" }))).toBe("v1")
  })
  it("returns forced v2 without cache", () => {
    expect(resolveApiVersion(makeConfig({ apiVersion: "v2" }))).toBe("v2")
  })
  it("returns v1 when auto and no cache", () => {
    expect(resolveApiVersion(makeConfig({ apiVersion: "auto" }))).toBe("v1")
  })
  it("returns cached v2 when auto", () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    detectedVersionCache.set(versionKey(cfg), "v2")
    expect(resolveApiVersion(cfg)).toBe("v2")
  })
  it("returns cached v1 when auto", () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    detectedVersionCache.set(versionKey(cfg), "v1")
    expect(resolveApiVersion(cfg)).toBe("v1")
  })
  it("forced version takes precedence over cache", () => {
    const cfg = makeConfig({ apiVersion: "v2" })
    detectedVersionCache.set(versionKey(cfg), "v1")
    expect(resolveApiVersion(cfg)).toBe("v2")
  })
  it("returns v1 when apiVersion undefined and no cache", () => {
    const cfg = makeConfig()
    delete (cfg as any).apiVersion
    expect(resolveApiVersion(cfg)).toBe("v1")
  })
})

describe("rememberApiVersion", () => {
  beforeEach(() => {
    detectedVersionCache.clear()
    localStorage.clear()
    versionListeners.clear()
  })
  it("stores version in cache", () => {
    const cfg = makeConfig()
    rememberApiVersion(cfg, "v2")
    expect(detectedVersionCache.get(versionKey(cfg))).toBe("v2")
  })
  it("notifies listeners when version changes", () => {
    const cfg = makeConfig()
    const fn = vi.fn()
    versionListeners.add(fn)
    rememberApiVersion(cfg, "v2")
    expect(fn).toHaveBeenCalledOnce()
  })
  it("does not notify if same version already cached", () => {
    const cfg = makeConfig()
    rememberApiVersion(cfg, "v1")
    const fn = vi.fn()
    versionListeners.add(fn)
    rememberApiVersion(cfg, "v1")
    expect(fn).not.toHaveBeenCalled()
  })
  it("notifies multiple listeners", () => {
    const cfg = makeConfig()
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    versionListeners.add(fn1)
    versionListeners.add(fn2)
    rememberApiVersion(cfg, "v2")
    expect(fn1).toHaveBeenCalledOnce()
    expect(fn2).toHaveBeenCalledOnce()
  })
  it("trims host for key", () => {
    const cfg1 = makeConfig({ host: "  example.com ", port: 3000 })
    rememberApiVersion(cfg1, "v2")
    const cfg2 = makeConfig({ host: "example.com", port: 3000 })
    expect(resolveApiVersion(cfg2)).toBe("v2")
  })
})

describe("onApiVersionChange", () => {
  beforeEach(() => {
    versionListeners.clear()
    detectedVersionCache.clear()
    localStorage.clear()
  })
  it("adds listener and returns unsubscribe", () => {
    const fn = vi.fn()
    const unsub = onApiVersionChange(fn)
    expect(versionListeners.has(fn)).toBe(true)
    unsub()
    expect(versionListeners.has(fn)).toBe(false)
  })
  it("calls listener on remember", () => {
    const fn = vi.fn()
    onApiVersionChange(fn)
    rememberApiVersion(makeConfig(), "v2")
    expect(fn).toHaveBeenCalledOnce()
  })
  it("unsubscribed listener not called", () => {
    const fn = vi.fn()
    const unsub = onApiVersionChange(fn)
    unsub()
    rememberApiVersion(makeConfig(), "v2")
    expect(fn).not.toHaveBeenCalled()
  })
  it("multiple subscriptions", () => {
    const fn1 = vi.fn()
    const fn2 = vi.fn()
    const u1 = onApiVersionChange(fn1)
    onApiVersionChange(fn2)
    u1()
    rememberApiVersion(makeConfig(), "v1")
    expect(fn1).not.toHaveBeenCalled()
    expect(fn2).toHaveBeenCalledOnce()
  })
})

describe("apiPath", () => {
  beforeEach(() => {
    detectedVersionCache.clear()
    localStorage.clear()
  })
  it("returns /api prefix for v2 forced", () => {
    expect(apiPath(makeConfig({ apiVersion: "v2" }), "/session")).toBe("/api/session")
  })
  it("returns raw path for v1 forced", () => {
    expect(apiPath(makeConfig({ apiVersion: "v1" }), "/session")).toBe("/session")
  })
  it("returns /api prefix when auto resolved to v2 via cache", () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    detectedVersionCache.set(versionKey(cfg), "v2")
    expect(apiPath(cfg, "/session")).toBe("/api/session")
  })
  it("returns raw when auto resolved to v1", () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    // no cache => v1
    expect(apiPath(cfg, "/session")).toBe("/session")
  })
})

describe("unwrapData", () => {
  it("unwraps {data: ...} object", () => {
    expect(unwrapData({ data: { foo: 1 } })).toEqual({ foo: 1 })
    expect(unwrapData({ data: "hello" })).toBe("hello")
  })
  it("unwraps array via data", () => {
    expect(unwrapData({ data: [1, 2, 3] })).toEqual([1, 2, 3])
  })
  it("returns same when no data key", () => {
    const obj = { foo: 1 }
    expect(unwrapData(obj as any)).toEqual(obj)
  })
  it("returns primitive as-is", () => {
    expect(unwrapData("hello" as any)).toBe("hello")
    expect(unwrapData(42 as any)).toBe(42)
  })
  it("returns null/undefined as-is", () => {
    expect(unwrapData(null as any)).toBeNull()
    expect(unwrapData(undefined as any)).toBeUndefined()
  })
  it("returns unwrapped even if data is null", () => {
    expect(unwrapData({ data: null } as any)).toBeNull()
  })
})

describe("ensureVersionDetected", () => {
  beforeEach(() => {
    detectedVersionCache.clear()
    localStorage.clear()
    detectionPromises.clear()
    setHealthProbe(() => Promise.resolve())
  })

  it("returns forced v1 directly", async () => {
    const probe = vi.fn()
    setHealthProbe(probe)
    const cfg = makeConfig({ apiVersion: "v1" })
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v1")
    expect(probe).not.toHaveBeenCalled()
    expect(detectionPromises.size).toBe(0)
  })

  it("returns forced v2 directly", async () => {
    const probe = vi.fn()
    setHealthProbe(probe)
    const cfg = makeConfig({ apiVersion: "v2" })
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v2")
    expect(probe).not.toHaveBeenCalled()
  })

  it("returns cached version without probing", async () => {
    const probe = vi.fn()
    setHealthProbe(probe)
    const cfg = makeConfig({ apiVersion: "auto" })
    detectedVersionCache.set(versionKey(cfg), "v2")
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v2")
    expect(probe).not.toHaveBeenCalled()
  })

  it("probes and returns v1 when no cached after probe", async () => {
    const probe = vi.fn().mockResolvedValue({})
    setHealthProbe(probe)
    const cfg = makeConfig({ apiVersion: "auto" })
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v1")
    expect(probe).toHaveBeenCalledWith(cfg)
  })

  it("probes that sets cache to v2 returns v2", async () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    const probe = vi.fn().mockImplementation(async () => {
      rememberApiVersion(cfg, "v2")
    })
    setHealthProbe(probe)
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v2")
  })

  it("handles probe throwing and still returns v1", async () => {
    const probe = vi.fn().mockRejectedValue(new Error("down"))
    setHealthProbe(probe)
    const cfg = makeConfig({ apiVersion: "auto" })
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v1")
  })

  it("handles probe throwing but cached v2 still returns v2", async () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    const probe = vi.fn().mockImplementation(async () => {
      rememberApiVersion(cfg, "v2")
      throw new Error("fail after remember")
    })
    // ensureVersionDetected catches probe error; but remember already set
    setHealthProbe(probe)
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v2")
  })

  it("deduplicates concurrent calls", async () => {
    const probe = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(() => r({}), 20)))
    setHealthProbe(probe)
    const cfg = makeConfig({ apiVersion: "auto" })
    const p1 = ensureVersionDetected(cfg)
    const p2 = ensureVersionDetected(cfg)
    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1).toBe("v1")
    expect(r2).toBe("v1")
    expect(probe).toHaveBeenCalledOnce()
  })
})

describe("getApiVersion", () => {
  beforeEach(() => {
    detectedVersionCache.clear()
    localStorage.clear()
    detectionPromises.clear()
    setHealthProbe(() => Promise.resolve())
  })
  it("delegates to ensureVersionDetected for auto", async () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    await expect(getApiVersion(cfg)).resolves.toBe("v1")
  })
  it("returns forced version", async () => {
    await expect(getApiVersion(makeConfig({ apiVersion: "v2" }))).resolves.toBe("v2")
  })
  it("returns cached v2", async () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    detectedVersionCache.set(versionKey(cfg), "v2")
    await expect(getApiVersion(cfg)).resolves.toBe("v2")
  })
})

// Contrato nuevo: la versión detectada se persiste por `host:port` para que la
// carga siguiente no pague el sondeo (2-3 requests secuenciales) en el camino
// crítico. Fallas cubiertas: valor viejo (se confirma en background y corrige),
// server caído (NO baja la versión persistida), storage bloqueado (cae al
// sondeo de siempre) y TTL (no se confirma en cada carga).
describe("persistencia de la versión detectada", () => {
  beforeEach(() => {
    detectedVersionCache.clear()
    detectionPromises.clear()
    versionListeners.clear()
    localStorage.clear()
    setHealthProbe(() => Promise.resolve())
  })

  const persistedKey = (cfg: ServerConfig) => `openher.apiVersion.${versionKey(cfg)}`

  it("la hidrata en la próxima carga sin sondear", async () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    rememberApiVersion(cfg, "v2")
    // Próxima carga: se pierde la memoria (Map), no el disco.
    detectedVersionCache.clear()
    const probe = vi.fn()
    setHealthProbe(probe)
    expect(resolveApiVersion(cfg)).toBe("v2")
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v2")
    expect(probe).not.toHaveBeenCalled()
  })

  it("con TTL vencido confirma en background y corrige si el server cambió", async () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    localStorage.setItem(persistedKey(cfg), JSON.stringify({ v: "v1", at: Date.now() - 2 * 60 * 60_000 }))
    const probe = vi.fn().mockImplementation(async () => {
      rememberApiVersion(cfg, "v2")
    })
    setHealthProbe(probe)
    // Responde ya con lo persistido: la confirmación NO está en el camino.
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v1")
    await new Promise((r) => setTimeout(r, 0))
    expect(probe).toHaveBeenCalledOnce()
    expect(resolveApiVersion(cfg)).toBe("v2")
  })

  it("si la confirmación falla NO baja la versión persistida", async () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    localStorage.setItem(persistedKey(cfg), JSON.stringify({ v: "v2", at: 0 }))
    setHealthProbe(vi.fn().mockRejectedValue(new Error("server caído")))
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v2")
    await new Promise((r) => setTimeout(r, 0))
    expect(resolveApiVersion(cfg)).toBe("v2")
  })

  it("storage bloqueado: cae al sondeo de siempre", async () => {
    const cfg = makeConfig({ apiVersion: "auto" })
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage bloqueado")
    })
    const probe = vi.fn().mockImplementation(async () => {
      rememberApiVersion(cfg, "v2")
    })
    setHealthProbe(probe)
    await expect(ensureVersionDetected(cfg)).resolves.toBe("v2")
    expect(probe).toHaveBeenCalledOnce()
    spy.mockRestore()
  })
})
