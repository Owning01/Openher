import { describe, it, expect, vi } from "vitest"
import { discoveryCandidates, discoverServer, isLoopbackHost } from "./serverDiscovery"
import type { ServerConfig } from "../types"

const base: ServerConfig = { host: "127.0.0.1", port: 4098, username: "opencode", password: "octavio", apiVersion: "auto" }

describe("isLoopbackHost", () => {
  it("detecta loopback/vacío y rechaza remotos", () => {
    for (const h of ["", "localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0", "LOCALHOST"]) {
      expect(isLoopbackHost(h)).toBe(true)
    }
    expect(isLoopbackHost("100.77.237.102")).toBe(false)
    expect(isLoopbackHost("192.168.0.10")).toBe(false)
  })
})

describe("discoveryCandidates", () => {
  it("prioriza la config guardada y deduplica", () => {
    const list = discoveryCandidates(base, "127.0.0.1")
    expect(list[0]).toEqual(base)
    const keys = list.map((c) => `${c.host}:${c.port}:${c.username}:${c.password}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("incluye hostname y defaults aunque no haya config", () => {
    const list = discoveryCandidates(null, "100.77.237.102")
    const keys = list.map((c) => `${c.host}:${c.port}:${c.username}`)
    expect(keys).toContain("100.77.237.102:4096:opencode")
    expect(keys).toContain("127.0.0.1:4098:opencode")
    expect(list.every((c) => c.apiVersion === "auto")).toBe(true)
  })

  it("no supera el máximo de candidatos", () => {
    expect(discoveryCandidates(null, "10.0.0.1").length).toBeLessThanOrEqual(18)
  })
})

describe("discoverServer", () => {
  it("devuelve null si ningún candidato responde", async () => {
    const health = vi.fn(async () => { throw new Error("nope") })
    expect(await discoverServer({ health, hostname: "127.0.0.1", timeoutMs: 50 })).toBeNull()
    expect(health).toHaveBeenCalled()
  })

  it("prefiere la config guardada si responde (un solo intento)", async () => {
    const health = vi.fn(async (cfg: ServerConfig) => {
      if (cfg.port === base.port) return { version: "2.0.0" }
      throw new Error("nope")
    })
    const found = await discoverServer({ health, stored: base, hostname: "127.0.0.1" })
    expect(found?.config).toEqual(base)
    expect(found?.version).toBe("2.0.0")
    expect(health).toHaveBeenCalledTimes(1)
  })

  it("cae al fallback 4098/octavio si el default 4096 no responde", async () => {
    const health = vi.fn(async (cfg: ServerConfig) => {
      if (cfg.port === 4098 && cfg.password === "octavio") return { version: "3.0" }
      throw new Error("nope")
    })
    const found = await discoverServer({ health, hostname: "127.0.0.1", timeoutMs: 50 })
    expect(found?.config.port).toBe(4098)
    expect(found?.config.password).toBe("octavio")
  })
})
