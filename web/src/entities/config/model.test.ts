import { describe, it, expect } from "vitest"
import type {
  ServerConfig,
  HealthResponse,
  FeatureFlags,
  ViewType,
  HelpPage,
  ConnectionState,
  DataMode,
  StreamState,
  SSEEvent,
  TunnelConfig,
  ServerProfile,
  DeepLinkAction,
} from "./model"
import { DEFAULT_SIGNALING_URL } from "./model"

// Helpers
const allViewTypes: ViewType[] = ["settings", "sessions", "detail", "help", "stats", "quickchat"]
const allHelpPages: HelpPage[] = ["overview", "server", "network", "troubleshooting", "commands"]
const allConnectionStates: ConnectionState[] = ["idle", "connecting", "connected", "reconnecting", "offline"]
const allDataModes: DataMode[] = ["full", "saver", "ultra", "miser"]
const allStreamStates: StreamState[] = ["polling", "streaming", "reconnecting"]

// ---------------------------------------------------------------------------
// ServerConfig
// ---------------------------------------------------------------------------
describe("ServerConfig", () => {
  it("acepta config mínimo requerido", () => {
    const cfg: ServerConfig = { host: "127.0.0.1", port: 8080, username: "admin", password: "secret" }
    expect(cfg.host).toBe("127.0.0.1")
    expect(cfg.port).toBe(8080)
    expect(cfg.apiVersion).toBeUndefined()
  })

  it("acepta apiVersion auto/v1/v2", () => {
    for (const v of ["auto", "v1", "v2"] as const) {
      const cfg: ServerConfig = { host: "h", port: 1, username: "u", password: "p", apiVersion: v }
      expect(cfg.apiVersion).toBe(v)
    }
  })

  it("port es número entero positivo", () => {
    const cfg: ServerConfig = { host: "localhost", port: 3000, username: "u", password: "p" }
    expect(Number.isInteger(cfg.port)).toBe(true)
    expect(cfg.port).toBeGreaterThan(0)
  })

  it("serializa/deserializa sin pérdida", () => {
    const cfg: ServerConfig = { host: "10.0.0.1", port: 4096, username: "user", password: "pass", apiVersion: "v2" }
    const clone = JSON.parse(JSON.stringify(cfg)) as ServerConfig
    expect(clone).toEqual(cfg)
  })
})

// ---------------------------------------------------------------------------
// HealthResponse
// ---------------------------------------------------------------------------
describe("HealthResponse", () => {
  it("healthy true con versión semver", () => {
    const h: HealthResponse = { healthy: true, version: "1.2.3" }
    expect(h.healthy).toBe(true)
    expect(h.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it("healthy false aún con versión", () => {
    const h: HealthResponse = { healthy: false, version: "0.0.0" }
    expect(h.healthy).toBe(false)
    expect(h.version).toBe("0.0.0")
  })

  it("versión es string no vacío", () => {
    const h: HealthResponse = { healthy: true, version: "2.0.0-beta.1" }
    expect(typeof h.version).toBe("string")
    expect(h.version.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// FeatureFlags
// ---------------------------------------------------------------------------
describe("FeatureFlags", () => {
  it("todas las flags en true", () => {
    const f: FeatureFlags = {
      fileBrowser: true, inlineDiff: true, contextMenu: true, planBreakdown: true,
      gitOps: true, mcpConfig: true, sessionArchive: true, streamingFull: true,
      offlineCache: true, questionAuto: true, permissionUI: true,
    }
    for (const v of Object.values(f)) expect(v).toBe(true)
  })

  it("todas las flags en false", () => {
    const f: FeatureFlags = {
      fileBrowser: false, inlineDiff: false, contextMenu: false, planBreakdown: false,
      gitOps: false, mcpConfig: false, sessionArchive: false, streamingFull: false,
      offlineCache: false, questionAuto: false, permissionUI: false,
    }
    for (const v of Object.values(f)) expect(v).toBe(false)
  })

  it("tiene exactamente 11 claves booleanas", () => {
    const f: FeatureFlags = {
      fileBrowser: true, inlineDiff: false, contextMenu: true, planBreakdown: false,
      gitOps: true, mcpConfig: false, sessionArchive: true, streamingFull: false,
      offlineCache: true, questionAuto: false, permissionUI: true,
    }
    expect(Object.keys(f)).toHaveLength(11)
    for (const v of Object.values(f)) expect(typeof v).toBe("boolean")
  })

  it("flags mixtas arbitrarias", () => {
    const f: FeatureFlags = {
      fileBrowser: true, inlineDiff: false, contextMenu: true, planBreakdown: true,
      gitOps: false, mcpConfig: true, sessionArchive: false, streamingFull: true,
      offlineCache: false, questionAuto: true, permissionUI: false,
    }
    expect(f.fileBrowser).toBe(true)
    expect(f.gitOps).toBe(false)
    expect(f.permissionUI).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ViewType / HelpPage
// ---------------------------------------------------------------------------
describe("ViewType", () => {
  it("contiene 6 valores esperados", () => {
    expect(allViewTypes).toHaveLength(6)
    expect(allViewTypes).toEqual(expect.arrayContaining(["settings", "sessions", "detail", "help", "stats", "quickchat"]))
  })

  it("cada ViewType es string no vacío", () => {
    for (const v of allViewTypes) {
      expect(typeof v).toBe("string")
      expect(v.length).toBeGreaterThan(0)
    }
  })

  it("no contiene duplicados", () => {
    expect(new Set(allViewTypes).size).toBe(allViewTypes.length)
  })
})

describe("HelpPage", () => {
  it("contiene 5 valores esperados", () => {
    expect(allHelpPages).toHaveLength(5)
    expect(allHelpPages).toEqual(expect.arrayContaining(["overview", "server", "network", "troubleshooting", "commands"]))
  })

  it("no contiene duplicados", () => {
    expect(new Set(allHelpPages).size).toBe(allHelpPages.length)
  })
})

// ---------------------------------------------------------------------------
// ConnectionState / DataMode / StreamState
// ---------------------------------------------------------------------------
describe("ConnectionState", () => {
  it("contiene 5 estados", () => {
    expect(allConnectionStates).toHaveLength(5)
    expect(allConnectionStates).toContain("connected")
    expect(allConnectionStates).toContain("offline")
  })

  it("no tiene duplicados", () => {
    expect(new Set(allConnectionStates).size).toBe(5)
  })
})

describe("DataMode", () => {
  it("contiene 4 modos ordenados por agresividad", () => {
    expect(allDataModes).toEqual(["full", "saver", "ultra", "miser"])
  })

  it("todos son strings", () => {
    for (const m of allDataModes) expect(typeof m).toBe("string")
  })
})

describe("StreamState", () => {
  it("contiene 3 estados", () => {
    expect(allStreamStates).toHaveLength(3)
    expect(allStreamStates).toEqual(expect.arrayContaining(["polling", "streaming", "reconnecting"]))
  })

  it("reconnecting aparece tanto en ConnectionState como StreamState", () => {
    expect(allConnectionStates).toContain("reconnecting")
    expect(allStreamStates).toContain("reconnecting")
  })
})

// ---------------------------------------------------------------------------
// SSEEvent
// ---------------------------------------------------------------------------
describe("SSEEvent", () => {
  it("valida shape básico", () => {
    const e: SSEEvent = { id: "evt-1", type: "message", properties: {} }
    expect(e.id).toBe("evt-1")
    expect(e.type).toBe("message")
    expect(e.properties).toEqual({})
  })

  it("properties acepta valores heterogéneos", () => {
    const e: SSEEvent = { id: "2", type: "update", properties: { count: 3, flag: true, nested: { a: 1 } } }
    expect(e.properties["count"]).toBe(3)
    expect(e.properties["flag"]).toBe(true)
    expect((e.properties["nested"] as Record<string, unknown>)["a"]).toBe(1)
  })

  it("serializa/deserializa preservando id y type", () => {
    const e: SSEEvent = { id: "abc", type: "session.updated", properties: { sessionID: "s1" } }
    const clone = JSON.parse(JSON.stringify(e)) as SSEEvent
    expect(clone.id).toBe(e.id)
    expect(clone.type).toBe(e.type)
    expect(clone.properties).toEqual(e.properties)
  })
})

// ---------------------------------------------------------------------------
// TunnelConfig
// ---------------------------------------------------------------------------
describe("TunnelConfig", () => {
  it("valida shape mínimo sin iceServers", () => {
    const t: TunnelConfig = { name: "my-tunnel", password: "p123", signalingURL: "wss://example.com/signal" }
    expect(t.name).toBe("my-tunnel")
    expect(t.iceServers).toBeUndefined()
  })

  it("acepta iceServers con urls", () => {
    const t: TunnelConfig = {
      name: "t", password: "p", signalingURL: "wss://example.com",
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    }
    expect(t.iceServers).toHaveLength(1)
    expect(t.iceServers![0].urls).toContain("stun")
  })

  it("signalingURL debe ser wss://", () => {
    const t: TunnelConfig = { name: "t", password: "p", signalingURL: DEFAULT_SIGNALING_URL }
    expect(t.signalingURL.startsWith("wss://")).toBe(true)
  })

  it("iceServers puede ser arreglo vacío", () => {
    const t: TunnelConfig = { name: "t", password: "p", signalingURL: "wss://x", iceServers: [] }
    expect(t.iceServers).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// ServerProfile
// ---------------------------------------------------------------------------
describe("ServerProfile", () => {
  it("kind http con ServerConfig", () => {
    const p: ServerProfile = { id: "1", name: "local", kind: "http", config: { host: "127.0.0.1", port: 8080, username: "u", password: "p" } }
    expect(p.kind).toBe("http")
    expect(p.config.host).toBe("127.0.0.1")
  })

  it("kind pair con ServerConfig", () => {
    const p: ServerProfile = { id: "2", name: "pair-server", kind: "pair", config: { host: "192.168.1.10", port: 3000, username: "a", password: "b", apiVersion: "auto" } }
    expect(p.kind).toBe("pair")
    expect(p.config.apiVersion).toBe("auto")
  })

  it("id y name son strings no vacíos", () => {
    const p: ServerProfile = { id: "abc-123", name: "My Server", kind: "http", config: { host: "h", port: 80, username: "u", password: "p" } }
    expect(p.id.length).toBeGreaterThan(0)
    expect(p.name.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// DeepLinkAction
// ---------------------------------------------------------------------------
describe("DeepLinkAction", () => {
  it("kind server con host/port/username", () => {
    const a: DeepLinkAction = { kind: "server", host: "10.0.0.5", port: 4096, username: "admin" }
    expect(a.kind).toBe("server")
    expect(a.host).toBe("10.0.0.5")
    expect(a.port).toBe(4096)
  })

  it("kind session con sessionID y directory", () => {
    const a: DeepLinkAction = { kind: "session", sessionID: "ses_123", directory: "/home/user/proj" }
    expect(a.kind).toBe("session")
    expect(a.sessionID).toBe("ses_123")
    expect(a.directory).toBe("/home/user/proj")
  })

  it("todos los campos opcionales pueden omitirse", () => {
    const a1: DeepLinkAction = { kind: "server" }
    const a2: DeepLinkAction = { kind: "session" }
    expect(a1.host).toBeUndefined()
    expect(a2.sessionID).toBeUndefined()
  })

  it("kind solo permite server | session", () => {
    const kinds: DeepLinkAction["kind"][] = ["server", "session"]
    expect(kinds).toHaveLength(2)
    for (const k of kinds) {
      const a: DeepLinkAction = { kind: k }
      expect(["server", "session"]).toContain(a.kind)
    }
  })
})

// ---------------------------------------------------------------------------
// DEFAULT_SIGNALING_URL
// ---------------------------------------------------------------------------
describe("DEFAULT_SIGNALING_URL", () => {
  it("valor exacto esperado", () => {
    expect(DEFAULT_SIGNALING_URL).toBe("wss://opencode-tunnel-signaling.owning01.workers.dev/signal")
  })

  it("usa protocolo wss y termina en /signal", () => {
    expect(DEFAULT_SIGNALING_URL.startsWith("wss://")).toBe(true)
    expect(DEFAULT_SIGNALING_URL.endsWith("/signal")).toBe(true)
  })

  it("es una URL válida", () => {
    expect(() => new URL(DEFAULT_SIGNALING_URL)).not.toThrow()
    expect(new URL(DEFAULT_SIGNALING_URL).protocol).toBe("wss:")
  })

  it("contiene dominio workers.dev", () => {
    expect(DEFAULT_SIGNALING_URL).toContain("workers.dev")
  })
})
