import { describe, it, expect } from "vitest"
import type {
  Session,
  MessageEnvelope,
  AgentOption,
  FileEntry,
  ServerConfig,
  ChatSettings,
  TokenUsage,
  MessageTokens,
  ThinkingPart,
  RenderedMessage,
  StreamingPart,
  CachedMessages,
  ModelSelection,
  SessionStatus,
  SessionView,
  CachedSession,
  ModelOption,
  ProviderInfo,
  ServerProvider,
  CommandInfo,
  Question,
  StatsPayload,
  FileDiff,
  DiffFile,
  DiffContent,
  PathInfo,
  ProjectCurrent,
  VcsStatus,
  HealthResponse,
  FeatureFlags,
  ViewType,
  ConnectionState,
  TunnelConfig,
  ServerProfile,
  PromptSnippet,
  ThemePreference,
  NoticeType,
} from "../types"

import * as message from "./message/model"
import * as session from "./session/model"
import * as agent from "./agent/model"
import * as file from "./file/model"
import * as config from "./config/model"
import * as ui from "./ui/model"
import * as barrel from "../types"

// ---------------------------------------------------------------------------
// 1. Barrel re-exports: objetos dummy que satisfacen cada tipo
// ---------------------------------------------------------------------------
describe("barrel re-exports via ../types", () => {
  it("Session dummy has expected fields", () => {
    const obj: Session = {
      id: "sess-1",
      title: "Test",
      directory: "/tmp",
      time: { created: 1, updated: 2 },
    }
    expect(obj).toBeDefined()
    expect(obj.id).toBe("sess-1")
    expect(obj.time.created).toBe(1)
  })

  it("MessageEnvelope dummy has expected fields", () => {
    const obj: MessageEnvelope = {
      info: { id: "m1", role: "user", sessionID: "sess-1", time: { created: 1 } },
      parts: [{ id: "p1", type: "text", text: "hello" }],
    }
    expect(obj).toBeDefined()
    expect(obj.info.role).toBe("user")
    expect(obj.parts[0].text).toBe("hello")
  })

  it("AgentOption dummy has expected fields", () => {
    const obj: AgentOption = { id: "a1", name: "Agent", mode: "primary" }
    expect(obj).toBeDefined()
    expect(obj.mode).toBe("primary")
  })

  it("FileEntry dummy has expected fields", () => {
    const obj: FileEntry = { name: "file.ts", path: "src/file.ts", absolute: "/abs/file.ts", type: "file" }
    expect(obj).toBeDefined()
    expect(obj.type).toBe("file")
  })

  it("ServerConfig dummy has expected fields", () => {
    const obj: ServerConfig = { host: "localhost", port: 3000, username: "u", password: "p" }
    expect(obj).toBeDefined()
    expect(obj.port).toBe(3000)
  })

  it("ChatSettings dummy has expected fields", () => {
    const obj: ChatSettings = {
      fontSize: 14,
      messageSpacing: "normal",
      showThinking: true,
      thinkingDefault: "auto",
      showToolCalls: true,
      showTimestamps: false,
      showTodoButton: true,
      showModelInfo: true,
      showDiffs: true,
      showSubagentHint: true,
      showCompactionCheckpoint: true,
      showImages: true,
      bubbleRadius: 8,
      messageMaxWidth: "normal",
      fontFamily: "system",
      compactTools: false,
      minimalistMode: false,
      completionSound: false,
      composerCharLimit: 1000,
      desktopGutter: 16,
    }
    expect(obj).toBeDefined()
    expect(obj.fontSize).toBe(14)
  })

  it("TokenUsage dummy has expected fields", () => {
    const obj: TokenUsage = { input: 10, output: 20, reasoning: 5, cache: { read: 1, write: 2 } }
    expect(obj).toBeDefined()
    expect(obj.cache.read).toBe(1)
  })

  it("MessageTokens dummy mirrors TokenUsage shape", () => {
    const obj: MessageTokens = { input: 1, output: 2, reasoning: 0, cache: { read: 0, write: 0 } }
    expect(obj).toBeDefined()
    expect(obj.input).toBe(1)
  })

  it("ThinkingPart dummy has expected fields", () => {
    const obj: ThinkingPart = { id: "t1", text: "thinking" }
    expect(obj).toBeDefined()
    expect(obj.text).toBe("thinking")
  })

  it("RenderedMessage dummy has expected fields", () => {
    const obj: RenderedMessage = {
      info: { id: "m1", role: "assistant", sessionID: "s1", time: { created: 1 } },
      parts: [],
      text: "rendered",
      hasCompaction: false,
      thinkingParts: [],
      toolParts: [],
    }
    expect(obj).toBeDefined()
    expect(obj.text).toBe("rendered")
  })

  it("StreamingPart dummy has expected fields", () => {
    const obj: StreamingPart = { messageID: "m1", partID: "p1", text: "chunk", field: "text" }
    expect(obj).toBeDefined()
    expect(obj.field).toBe("text")
  })

  it("CachedMessages dummy has expected fields", () => {
    const obj: CachedMessages = { sessionID: "s1", messages: [], cachedAt: Date.now() }
    expect(obj).toBeDefined()
    expect(Array.isArray(obj.messages)).toBe(true)
  })

  it("ModelSelection dummy has expected fields", () => {
    const obj: ModelSelection = { providerID: "anthropic", modelID: "claude" }
    expect(obj).toBeDefined()
    expect(obj.providerID).toBe("anthropic")
  })

  it("SessionStatus dummy has expected fields", () => {
    const obj: SessionStatus = { type: "running", attempt: 1 }
    expect(obj).toBeDefined()
    expect(obj.type).toBe("running")
  })

  it("SessionView dummy has expected fields", () => {
    const obj: SessionView = {
      id: "s1",
      title: "T",
      directory: "/tmp",
      updated: 1,
      status: "active",
      files: 2,
      additions: 10,
      deletions: 5,
    }
    expect(obj).toBeDefined()
    expect(obj.files).toBe(2)
  })

  it("CachedSession dummy has expected fields", () => {
    const obj: CachedSession = { id: "s1", title: "T", directory: "/tmp", updated: 1 }
    expect(obj).toBeDefined()
    expect(obj.id).toBe("s1")
  })

  it("ModelOption dummy has expected fields", () => {
    const obj: ModelOption = { providerID: "p1", modelID: "m1", providerName: "Prov", modelName: "Model" }
    expect(obj).toBeDefined()
    expect(obj.providerName).toBe("Prov")
  })

  it("ProviderInfo dummy has expected fields", () => {
    const obj: ProviderInfo = { id: "p1", name: "Prov", modelsCount: 3, connected: true }
    expect(obj).toBeDefined()
    expect(obj.connected).toBe(true)
  })

  it("ServerProvider dummy has expected fields", () => {
    const obj: ServerProvider = { id: "p1", name: "Prov", source: "env", env: ["KEY"], models: {} }
    expect(obj).toBeDefined()
    expect(obj.source).toBe("env")
  })

  it("FileDiff dummy has expected fields", () => {
    const obj: FileDiff = { file: "a.ts", additions: 1, deletions: 0 }
    expect(obj).toBeDefined()
    expect(obj.additions).toBe(1)
  })

  it("DiffFile dummy has expected fields", () => {
    const obj: DiffFile = { file: "a.ts", additions: 5, deletions: 2 }
    expect(obj).toBeDefined()
    expect(obj.file).toBe("a.ts")
  })

  it("HealthResponse dummy has expected fields", () => {
    const obj: HealthResponse = { healthy: true, version: "1.0.0" }
    expect(obj).toBeDefined()
    expect(obj.healthy).toBe(true)
  })

  it("FeatureFlags dummy has expected fields", () => {
    const obj: FeatureFlags = {
      fileBrowser: true,
      inlineDiff: true,
      contextMenu: false,
      planBreakdown: true,
      gitOps: false,
      mcpConfig: true,
      sessionArchive: false,
      streamingFull: true,
      offlineCache: false,
      questionAuto: true,
      permissionUI: false,
    }
    expect(obj).toBeDefined()
    expect(obj.fileBrowser).toBe(true)
  })

  it("ViewType dummy is assignable", () => {
    const obj: ViewType = "sessions"
    expect(obj).toBe("sessions")
  })

  it("ConnectionState dummy is assignable", () => {
    const obj: ConnectionState = "connected"
    expect(obj).toBe("connected")
  })

  it("TunnelConfig dummy has expected fields", () => {
    const obj: TunnelConfig = { name: "t", password: "p", signalingURL: "wss://example.com" }
    expect(obj).toBeDefined()
    expect(obj.signalingURL).toContain("wss://")
  })

  it("ServerProfile dummy has expected fields", () => {
    const obj: ServerProfile = {
      id: "sp1",
      name: "My Server",
      kind: "http",
      config: { host: "localhost", port: 4096, username: "u", password: "p" },
    }
    expect(obj).toBeDefined()
    expect(obj.kind).toBe("http")
  })

  it("PromptSnippet dummy has expected fields", () => {
    const obj: PromptSnippet = { id: "ps1", name: "Snippet", text: "hello" }
    expect(obj).toBeDefined()
    expect(obj.text).toBe("hello")
  })

  it("ThemePreference dummy is assignable", () => {
    const obj: ThemePreference = "dark"
    expect(obj).toBe("dark")
  })

  it("NoticeType dummy is assignable", () => {
    const obj: NoticeType = "success"
    expect(obj).toBe("success")
  })

  it("StatsPayload dummy has expected fields", () => {
    const obj: StatsPayload = {
      meta: { sessions: 1, models: 2, since: "2024-01-01", until: "2024-01-02", avg_cost: 0.1, db: "db", filtered: false },
      totals: { input: 10, output: 20, reasoning: 5, cache_read: 1, cache_write: 2 },
      cost: 0.5,
      est_total: 0.6,
      stats: { mas_cara: { cost: 1, title: "t", model: "m" }, mas_tokens: { title: "t", model: "m" }, input_medio: 10 },
      days: [],
      models_chart: [],
      by_model: [],
      by_project: [],
      by_day: [],
      by_month: [],
      sessions: [],
      limits: [],
      prices: [],
    }
    expect(obj).toBeDefined()
    expect(obj.cost).toBe(0.5)
  })

  it("barrel namespace re-exports all domain keys at type level (runtime barrel object exists)", () => {
    expect(barrel).toBeDefined()
    // barrel is star re-export; at runtime only value exports survive (e.g. DEFAULT_SIGNALING_URL)
    expect(typeof barrel).toBe("object")
  })
})

// ---------------------------------------------------------------------------
// 2. No hay duplicados indebidos entre entidades
// ---------------------------------------------------------------------------
describe("no duplicados indebidos entre entidades", () => {
  it("message y session no solapan runtime keys", () => {
    const mKeys = new Set(Object.keys(message))
    const sKeys = new Set(Object.keys(session))
    const overlap = [...mKeys].filter((k) => sKeys.has(k))
    expect(overlap).toEqual([])
  })

  it("message y agent no solapan runtime keys", () => {
    const overlap = Object.keys(message).filter((k) => Object.keys(agent).includes(k))
    expect(overlap).toEqual([])
  })

  it("message y file no solapan runtime keys", () => {
    const overlap = Object.keys(message).filter((k) => Object.keys(file).includes(k))
    expect(overlap).toEqual([])
  })

  it("session y file no solapan runtime keys", () => {
    const overlap = Object.keys(session).filter((k) => Object.keys(file).includes(k))
    expect(overlap).toEqual([])
  })

  it("agent y file no solapan runtime keys", () => {
    const overlap = Object.keys(agent).filter((k) => Object.keys(file).includes(k))
    expect(overlap).toEqual([])
  })

  it("agent y ui no solapan runtime keys", () => {
    const overlap = Object.keys(agent).filter((k) => Object.keys(ui).includes(k))
    expect(overlap).toEqual([])
  })

  it("TokenUsage solo tiene runtime presencia via message (si hubiera value) — session no exporta valores", () => {
    // Ambos son type-only, por lo que Object.keys debe ser vacío; verifica deduplicación intencional
    expect(Object.keys(message)).not.toContain("TokenUsage")
    expect(Object.keys(session)).not.toContain("TokenUsage")
    // El tipo TokenUsage debe ser importable desde message pero session lo consume como type-only
    // Verificación indirecta: session model no re-exporta TokenUsage como valor
    expect(Object.keys(session).includes("TokenUsage")).toBe(false)
  })

  it("ProviderInfo solo existe como tipo en agent, no en ui ni config a nivel runtime", () => {
    expect(Object.keys(agent)).not.toContain("ProviderInfo")
    expect(Object.keys(ui)).not.toContain("ProviderInfo")
    expect(Object.keys(config)).not.toContain("ProviderInfo")
  })

  it("ViewType solo existe como tipo en config, no en ui a nivel runtime", () => {
    expect(Object.keys(config)).not.toContain("ViewType")
    expect(Object.keys(ui)).not.toContain("ViewType")
  })

  it("DEFAULT_SIGNALING_URL solo está en config entre todos los dominios", () => {
    expect(Object.keys(config)).toContain("DEFAULT_SIGNALING_URL")
    expect(Object.keys(message)).not.toContain("DEFAULT_SIGNALING_URL")
    expect(Object.keys(session)).not.toContain("DEFAULT_SIGNALING_URL")
    expect(Object.keys(agent)).not.toContain("DEFAULT_SIGNALING_URL")
    expect(Object.keys(file)).not.toContain("DEFAULT_SIGNALING_URL")
    expect(Object.keys(ui)).not.toContain("DEFAULT_SIGNALING_URL")
  })

  it("ningún dominio excepto config exporta valores runtime inesperados", () => {
    expect(Object.keys(message)).toEqual([])
    expect(Object.keys(session)).toEqual([])
    expect(Object.keys(agent)).toEqual([])
    expect(Object.keys(file)).toEqual([])
    expect(Object.keys(ui)).toEqual([])
    expect(Object.keys(config)).toEqual(["DEFAULT_SIGNALING_URL"])
  })

  it("barrel runtime keys son la unión de los dominios sin duplicados", () => {
    const barrelKeys = Object.keys(barrel)
    // Solo DEFAULT_SIGNALING_URL debe aparecer en el barrel a nivel runtime
    expect(barrelKeys).toEqual(["DEFAULT_SIGNALING_URL"])
    expect(barrelKeys).toContain("DEFAULT_SIGNALING_URL")
  })
})

// ---------------------------------------------------------------------------
// 3. Modelos puros importables independientemente sin traer React
// ---------------------------------------------------------------------------
describe("modelos puros importables sin React", () => {
  it("message/model es importable y no expone React", () => {
    expect(message).toBeDefined()
    expect(Object.keys(message)).not.toContain("React")
    expect(Object.keys(message)).not.toContain("createElement")
  })

  it("session/model es importable y no expone React", () => {
    expect(session).toBeDefined()
    expect(Object.keys(session)).not.toContain("React")
  })

  it("agent/model es importable y no expone React", () => {
    expect(agent).toBeDefined()
    expect(Object.keys(agent)).not.toContain("React")
  })

  it("file/model es importable y no expone React", () => {
    expect(file).toBeDefined()
    expect(Object.keys(file)).not.toContain("React")
  })

  it("config/model es importable independientemente y expone DEFAULT_SIGNALING_URL como valor puro", () => {
    expect(config).toBeDefined()
    expect(config.DEFAULT_SIGNALING_URL).toBe("wss://opencode-tunnel-signaling.owning01.workers.dev/signal")
    expect(Object.keys(config)).not.toContain("React")
  })

  it("ui/model es importable y no expone React", () => {
    expect(ui).toBeDefined()
    expect(Object.keys(ui)).not.toContain("React")
  })

  it("cada modelo puro puede usarse para tipar objetos sin importar React en el bundle", async () => {
    // dynamic import verifica que no hay dependencia oculta de React
    const mod = await import("./message/model")
    expect(mod).toBeDefined()
    expect(Object.keys(mod)).not.toContain("React")
  })
})
