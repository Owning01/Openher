import { describe, it, expect } from "vitest"
import type {
  TokenUsage,
  MessageTokens,
  MessageEnvelope,
  ThinkingPart,
  RenderedMessage,
  StreamingPart,
  CachedMessages,
} from "./model"
import type { FileDiff } from "../file/model.ts"

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
function makeTokenUsage(overrides: Partial<TokenUsage> = {}): TokenUsage {
  return {
    input: 100,
    output: 50,
    reasoning: 10,
    cache: { read: 20, write: 5 },
    ...overrides,
    cache: { read: 20, write: 5, ...overrides.cache },
  }
}

function makeFileDiff(overrides: Partial<FileDiff> = {}): FileDiff {
  return {
    additions: 10,
    deletions: 2,
    file: "src/foo.ts",
    patch: "@@ -1 +1 @@",
    status: "modified",
    ...overrides,
  }
}

function makeMessageEnvelope(overrides: Partial<MessageEnvelope["info"]> = {}, partsOverride?: MessageEnvelope["parts"]): MessageEnvelope {
  return {
    info: {
      id: "msg-1",
      role: "user",
      sessionID: "ses-1",
      time: { created: 1_700_000_000_000 },
      ...overrides,
    },
    parts: partsOverride ?? [{ id: "part-1", type: "text", text: "hello" }],
  }
}

// ---------------------------------------------------------------------------
// TokenUsage
// ---------------------------------------------------------------------------
describe("TokenUsage", () => {
  it("creates valid TokenUsage with required fields", () => {
    const u: TokenUsage = makeTokenUsage()
    expect(u.input).toBe(100)
    expect(u.output).toBe(50)
    expect(u.reasoning).toBe(10)
    expect(u.cache.read).toBe(20)
    expect(u.cache.write).toBe(5)
  })

  it("allows optional total field", () => {
    const u: TokenUsage = makeTokenUsage({ total: 160 })
    expect(u.total).toBe(160)
  })

  it("allows undefined total (optional)", () => {
    const u: TokenUsage = makeTokenUsage()
    expect(u.total).toBeUndefined()
  })

  it("supports zero values for all numeric fields", () => {
    const u: TokenUsage = makeTokenUsage({ input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } })
    expect(u.input).toBe(0)
    expect(u.cache.read).toBe(0)
  })

  it("cache read/write are numbers", () => {
    const u: TokenUsage = makeTokenUsage()
    expect(typeof u.cache.read).toBe("number")
    expect(typeof u.cache.write).toBe("number")
  })
})

// ---------------------------------------------------------------------------
// MessageTokens (duplicate shape)
// ---------------------------------------------------------------------------
describe("MessageTokens", () => {
  it("creates valid MessageTokens", () => {
    const t: MessageTokens = { input: 10, output: 20, reasoning: 0, cache: { read: 0, write: 0 } }
    expect(t.input).toBe(10)
    expect(t.output).toBe(20)
  })

  it("allows optional total in MessageTokens", () => {
    const t: MessageTokens = { total: 30, input: 10, output: 20, reasoning: 0, cache: { read: 1, write: 1 } }
    expect(t.total).toBe(30)
  })
})

// ---------------------------------------------------------------------------
// FileDiff shape via MessageEnvelope summary
// ---------------------------------------------------------------------------
describe("FileDiff shape", () => {
  it("creates valid FileDiff with required additions/deletions", () => {
    const d = makeFileDiff()
    expect(d.additions).toBe(10)
    expect(d.deletions).toBe(2)
  })

  it("FileDiff allows optional file/patch/status omitted", () => {
    const d: FileDiff = { additions: 1, deletions: 1 }
    expect(d.file).toBeUndefined()
    expect(d.patch).toBeUndefined()
    expect(d.status).toBeUndefined()
  })

  it("FileDiff can represent added file", () => {
    const d = makeFileDiff({ file: "new.ts", additions: 50, deletions: 0, status: "added" })
    expect(d.status).toBe("added")
    expect(d.deletions).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// MessageEnvelope
// ---------------------------------------------------------------------------
describe("MessageEnvelope", () => {
  it("has required info fields id, role, sessionID, time.created", () => {
    const m = makeMessageEnvelope()
    expect(m.info.id).toBe("msg-1")
    expect(m.info.role).toBe("user")
    expect(m.info.sessionID).toBe("ses-1")
    expect(typeof m.info.time.created).toBe("number")
  })

  it("time.completed is optional", () => {
    const m = makeMessageEnvelope()
    expect(m.info.time.completed).toBeUndefined()
    const m2 = makeMessageEnvelope({ time: { created: 1, completed: 2 } })
    expect(m2.info.time.completed).toBe(2)
  })

  it("parts is an array with required id and type", () => {
    const m = makeMessageEnvelope()
    expect(Array.isArray(m.parts)).toBe(true)
    expect(m.parts[0].id).toBe("part-1")
    expect(m.parts[0].type).toBe("text")
  })

  it("supports empty parts array", () => {
    const m = makeMessageEnvelope({}, [])
    expect(m.parts).toHaveLength(0)
  })

  it("supports multiple parts", () => {
    const m = makeMessageEnvelope({}, [
      { id: "p1", type: "text", text: "hi" },
      { id: "p2", type: "tool", tool: "bash", callID: "c1" },
    ])
    expect(m.parts).toHaveLength(2)
    expect(m.parts[1].tool).toBe("bash")
  })

  it("info supports optional agent, parentID, modelID, providerID, mode, finish", () => {
    const m = makeMessageEnvelope({
      agent: "default",
      parentID: "parent-1",
      modelID: "gpt-4",
      providerID: "openai",
      mode: "chat",
      finish: "stop",
    })
    expect(m.info.agent).toBe("default")
    expect(m.info.parentID).toBe("parent-1")
    expect(m.info.modelID).toBe("gpt-4")
    expect(m.info.providerID).toBe("openai")
    expect(m.info.mode).toBe("chat")
    expect(m.info.finish).toBe("stop")
  })

  it("info supports error shape", () => {
    const m = makeMessageEnvelope({ error: { name: "ApiError", message: "fail" } })
    expect(m.info.error?.name).toBe("ApiError")
    expect(m.info.error?.message).toBe("fail")
  })

  it("info supports tokens and cost", () => {
    const m = makeMessageEnvelope({
      tokens: { input: 10, output: 20, reasoning: 0, cache: { read: 0, write: 0 }, total: 30 },
      cost: 0.002,
    })
    expect(m.info.tokens?.input).toBe(10)
    expect(m.info.cost).toBeCloseTo(0.002)
  })

  it("info supports summary diffs with FileDiff[]", () => {
    const diff = makeFileDiff()
    const m = makeMessageEnvelope({ summary: { diffs: [diff] } })
    expect(m.info.summary?.diffs).toHaveLength(1)
    expect(m.info.summary?.diffs?.[0].file).toBe("src/foo.ts")
  })

  it("part supports time with created/completed/start/end", () => {
    const m = makeMessageEnvelope({}, [
      { id: "p1", type: "text", time: { created: 1, completed: 2, start: 1, end: 2 } },
    ])
    expect(m.parts[0].time?.start).toBe(1)
    expect(m.parts[0].time?.end).toBe(2)
  })

  it("part supports state with input/output/error/duration/metadata", () => {
    const m = makeMessageEnvelope({}, [
      {
        id: "p1",
        type: "tool",
        state: { status: "completed", input: { cmd: "ls" }, output: "ok", duration: 100, metadata: { foo: "bar" } },
      },
    ])
    expect(m.parts[0].state?.status).toBe("completed")
    expect(m.parts[0].state?.duration).toBe(100)
    expect(m.parts[0].state?.metadata).toEqual({ foo: "bar" })
  })

  it("part supports binary fields url/mimeType/mime/filename/data", () => {
    const m = makeMessageEnvelope({}, [
      { id: "p1", type: "file", url: "https://example.com/a.png", mimeType: "image/png", filename: "a.png", data: "base64..." },
    ])
    expect(m.parts[0].url).toBe("https://example.com/a.png")
    expect(m.parts[0].mimeType).toBe("image/png")
    expect(m.parts[0].filename).toBe("a.png")
  })
})

// ---------------------------------------------------------------------------
// ThinkingPart
// ---------------------------------------------------------------------------
describe("ThinkingPart", () => {
  it("creates valid ThinkingPart with id and text", () => {
    const t: ThinkingPart = { id: "th-1", text: "thinking..." }
    expect(t.id).toBe("th-1")
    expect(t.text).toBe("thinking...")
  })

  it("allows optional time.start/end", () => {
    const t: ThinkingPart = { id: "th-1", text: "x", time: { start: 100, end: 200 } }
    expect(t.time?.start).toBe(100)
    expect(t.time?.end).toBe(200)
  })

  it("time is optional", () => {
    const t: ThinkingPart = { id: "th-1", text: "x" }
    expect(t.time).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// RenderedMessage
// ---------------------------------------------------------------------------
describe("RenderedMessage", () => {
  it("creates valid RenderedMessage with required fields", () => {
    const rm: RenderedMessage = {
      info: { id: "m1", role: "assistant", sessionID: "s1", time: { created: 1 } },
      parts: [{ id: "p1", type: "text", text: "hi" }],
      text: "hi",
      hasCompaction: false,
      thinkingParts: [],
      toolParts: [],
    }
    expect(rm.text).toBe("hi")
    expect(rm.hasCompaction).toBe(false)
    expect(rm.thinkingParts).toHaveLength(0)
  })

  it("supports hasCompaction true and thinkingParts", () => {
    const rm: RenderedMessage = {
      info: { id: "m1", role: "assistant", sessionID: "s1", time: { created: 1 } },
      parts: [],
      text: "",
      hasCompaction: true,
      thinkingParts: [{ id: "th-1", text: "hmm" }],
      toolParts: [],
    }
    expect(rm.hasCompaction).toBe(true)
    expect(rm.thinkingParts[0].text).toBe("hmm")
  })

  it("supports toolParts with state", () => {
    const rm: RenderedMessage = {
      info: { id: "m1", role: "assistant", sessionID: "s1", time: { created: 1 } },
      parts: [],
      text: "",
      hasCompaction: false,
      thinkingParts: [],
      toolParts: [{ id: "tp1", type: "tool", tool: "bash", callID: "c1", state: { status: "running", title: "Running" } }],
    }
    expect(rm.toolParts[0].tool).toBe("bash")
    expect(rm.toolParts[0].state?.title).toBe("Running")
  })

  it("supports optional summaryDiffs, dataMode, turnMode, tokens, cost", () => {
    const rm: RenderedMessage = {
      info: { id: "m1", role: "assistant", sessionID: "s1", time: { created: 1 } },
      parts: [],
      text: "hello",
      hasCompaction: false,
      thinkingParts: [],
      toolParts: [],
      summaryDiffs: [makeFileDiff()],
      dataMode: "chat",
      turnMode: "build",
      tokens: { input: 1, output: 2, reasoning: 0, cache: { read: 0, write: 0 } },
      cost: 0.01,
    }
    expect(rm.summaryDiffs).toHaveLength(1)
    expect(rm.dataMode).toBe("chat")
    expect(rm.turnMode).toBe("build")
    expect(rm.tokens?.input).toBe(1)
    expect(rm.cost).toBe(0.01)
  })
})

// ---------------------------------------------------------------------------
// StreamingPart
// ---------------------------------------------------------------------------
describe("StreamingPart", () => {
  it("creates valid StreamingPart", () => {
    const s: StreamingPart = { messageID: "m1", partID: "p1", text: "chunk", field: "text" }
    expect(s.messageID).toBe("m1")
    expect(s.partID).toBe("p1")
    expect(s.text).toBe("chunk")
    expect(s.field).toBe("text")
  })

  it("field can be different string values", () => {
    const s: StreamingPart = { messageID: "m1", partID: "p1", text: "x", field: "data" }
    expect(s.field).toBe("data")
  })

  it("text can be empty string for incremental streaming", () => {
    const s: StreamingPart = { messageID: "m1", partID: "p1", text: "", field: "text" }
    expect(s.text).toBe("")
  })
})

// ---------------------------------------------------------------------------
// CachedMessages
// ---------------------------------------------------------------------------
describe("CachedMessages", () => {
  it("creates valid CachedMessages", () => {
    const c: CachedMessages = { sessionID: "s1", messages: [makeMessageEnvelope()], cachedAt: Date.now() }
    expect(c.sessionID).toBe("s1")
    expect(c.messages).toHaveLength(1)
    expect(typeof c.cachedAt).toBe("number")
  })

  it("supports empty messages array", () => {
    const c: CachedMessages = { sessionID: "s1", messages: [], cachedAt: 123 }
    expect(c.messages).toHaveLength(0)
  })

  it("cachedAt is a timestamp number", () => {
    const now = 1_700_000_000_000
    const c: CachedMessages = { sessionID: "s1", messages: [], cachedAt: now }
    expect(c.cachedAt).toBe(now)
    expect(c.cachedAt).toBeGreaterThan(0)
  })

  it("messages contain valid MessageEnvelope shapes", () => {
    const c: CachedMessages = {
      sessionID: "s1",
      messages: [
        makeMessageEnvelope({ id: "m1", role: "user" } as never),
        makeMessageEnvelope({ id: "m2", role: "assistant" } as never),
      ],
      cachedAt: 1,
    }
    expect(c.messages[0].info.role).toBe("user")
    expect(c.messages[1].info.role).toBe("assistant")
  })
})
