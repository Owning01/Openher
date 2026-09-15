import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { shell, invalidateShellBase } from "./shell"
import { Capacitor } from "@capacitor/core"

vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
  CapacitorHttp: { request: vi.fn() },
}))

void Capacitor

const USAGE = {
  usage: {
    rolling: { status: "ok", percent: 12, resetsAt: "2026-09-16T01:05:54.964Z" },
    weekly: { status: "ok", percent: 34, resetsAt: "2026-09-21T00:00:00.000Z" },
    monthly: { status: "ok", percent: 99, resetsAt: "2026-09-27T16:52:43.000Z" },
  },
}
const MODELS = { object: "list", data: [{ id: "kimi-k3" }, { id: "modelo-nuevo-xyz" }] }

function stubFetch() {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: { method?: string }) => {
      const u = String(url)
      const method = (init?.method ?? "GET").toUpperCase()
      const json = (v: unknown) => Promise.resolve(v)
      if (u.includes("/shell/health")) return Promise.resolve({ ok: true, status: 200, json: () => json({}), blob: () => Promise.resolve(new Blob()) })
      if (u.includes("/shell/zen/go/usage")) return Promise.resolve({ ok: true, status: 200, json: () => json(USAGE), blob: () => Promise.resolve(new Blob()) })
      if (u.includes("/shell/zen/go/models")) return Promise.resolve({ ok: true, status: 200, json: () => json(MODELS), blob: () => Promise.resolve(new Blob()) })
      if (u.includes("/shell/zen/go/key-status")) return Promise.resolve({ ok: true, status: 200, json: () => json({ configured: true, source: "custom" }), blob: () => Promise.resolve(new Blob()) })
      if (u.includes("/shell/zen/go/key") && method === "POST") return Promise.resolve({ ok: true, status: 200, json: () => json({ ok: true, source: "custom" }), blob: () => Promise.resolve(new Blob()) })
      if (u.includes("/shell/zen/go/key") && method === "DELETE") return Promise.resolve({ ok: true, status: 200, json: () => json({ ok: true, source: "auth" }), blob: () => Promise.resolve(new Blob()) })
      return Promise.resolve({ ok: false, status: 404, json: () => json({ error: "not found" }), blob: () => Promise.resolve(new Blob()) })
    }),
  )
}

beforeEach(() => {
  localStorage.clear()
  invalidateShellBase()
  stubFetch()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("shell.zenGo (puente OpenCode Go)", () => {
  it("usage trae rolling/weekly/monthly", async () => {
    const u = await shell.zenGo.usage()
    expect(u.usage.monthly.percent).toBe(99)
    expect(u.usage.rolling.resetsAt).toContain("2026-09-16")
  })

  it("models trae la lista en vivo", async () => {
    const m = await shell.zenGo.models()
    expect(m.data.map((x) => x.id)).toEqual(["kimi-k3", "modelo-nuevo-xyz"])
  })

  it("sin desktop lanza con el motivo (la UI lo muestra)", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("red caída"))))
    await expect(shell.zenGo.usage()).rejects.toThrow()
  })

  it("keyStatus dice el origen sin exponer la key", async () => {
    await expect(shell.zenGo.keyStatus()).resolves.toEqual({ configured: true, source: "custom" })
  })

  it("setKey guarda y clearKey vuelve a la TUI", async () => {
    await expect(shell.zenGo.setKey("sk-otra-clave")).resolves.toEqual({ ok: true, source: "custom" })
    await expect(shell.zenGo.clearKey()).resolves.toEqual({ ok: true, source: "auth" })
  })
})
