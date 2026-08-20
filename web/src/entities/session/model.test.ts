import { describe, it, expect } from "vitest"
import type { Session, SessionView, CachedSession, ModelSelection, SessionStatus } from "./model"
import type { TokenUsage } from "../message/model.ts"

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
function makeTokenUsage(overrides: Partial<TokenUsage> = {}): TokenUsage {
  return {
    input: 100,
    output: 50,
    reasoning: 5,
    cache: { read: 10, write: 2 },
    ...overrides,
    cache: { read: 10, write: 2, ...overrides.cache },
  }
}

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: "ses-1",
    title: "Test Session",
    directory: "/home/user/project",
    time: { created: 1_700_000_000_000, updated: 1_700_000_100_000 },
    ...overrides,
    time: { created: 1_700_000_000_000, updated: 1_700_000_100_000, ...overrides.time },
  }
}

function makeSessionView(overrides: Partial<SessionView> = {}): SessionView {
  return {
    id: "ses-1",
    title: "View Title",
    directory: "/home/user/project",
    updated: 1_700_000_100_000,
    status: "active",
    files: 3,
    additions: 100,
    deletions: 20,
    ...overrides,
  }
}

function makeCachedSession(overrides: Partial<CachedSession> = {}): CachedSession {
  return {
    id: "ses-1",
    title: "Cached",
    directory: "/tmp/proj",
    updated: 1_700_000_100_000,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// ModelSelection
// ---------------------------------------------------------------------------
describe("ModelSelection", () => {
  it("creates valid ModelSelection with required fields", () => {
    const m: ModelSelection = { providerID: "openai", modelID: "gpt-4o" }
    expect(m.providerID).toBe("openai")
    expect(m.modelID).toBe("gpt-4o")
  })

  it("allows optional variant", () => {
    const m: ModelSelection = { providerID: "anthropic", modelID: "claude-3", variant: "opus" }
    expect(m.variant).toBe("opus")
  })

  it("variant is optional (undefined)", () => {
    const m: ModelSelection = { providerID: "openai", modelID: "gpt-4o" }
    expect(m.variant).toBeUndefined()
  })

  it("supports different provider/model combos", () => {
    const m: ModelSelection = { providerID: "google", modelID: "gemini-2.0" }
    expect(m.providerID).toBe("google")
    expect(typeof m.modelID).toBe("string")
  })
})

// ---------------------------------------------------------------------------
// Session – required fields
// ---------------------------------------------------------------------------
describe("Session required fields", () => {
  it("has required id, title, directory, time.created/updated", () => {
    const s = makeSession()
    expect(s.id).toBe("ses-1")
    expect(s.title).toBe("Test Session")
    expect(s.directory).toBe("/home/user/project")
    expect(typeof s.time.created).toBe("number")
    expect(typeof s.time.updated).toBe("number")
  })

  it("title can be empty string", () => {
    const s = makeSession({ title: "" })
    expect(s.title).toBe("")
  })

  it("directory is a string path", () => {
    const s = makeSession({ directory: "/tmp/foo" })
    expect(s.directory).toBe("/tmp/foo")
  })

  it("time.created and time.updated are numbers", () => {
    const s = makeSession()
    expect(s.time.created).toBeGreaterThan(0)
    expect(s.time.updated).toBeGreaterThanOrEqual(s.time.created)
  })

  it("id is a non-empty string", () => {
    const s = makeSession({ id: "abc-123" })
    expect(s.id).toBe("abc-123")
    expect(s.id.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Session – optional time fields
// ---------------------------------------------------------------------------
describe("Session time optional fields", () => {
  it("compacting and archived are optional", () => {
    const s = makeSession()
    expect(s.time.compacting).toBeUndefined()
    expect(s.time.archived).toBeUndefined()
  })

  it("supports compacting timestamp", () => {
    const s = makeSession({ time: { created: 1, updated: 2, compacting: 3 } })
    expect(s.time.compacting).toBe(3)
  })

  it("supports archived timestamp", () => {
    const s = makeSession({ time: { created: 1, updated: 2, archived: 999 } })
    expect(s.time.archived).toBe(999)
  })
})

// ---------------------------------------------------------------------------
// Session – summary, tokens, cost, agent
// ---------------------------------------------------------------------------
describe("Session summary/tokens/cost/agent", () => {
  it("summary is optional", () => {
    const s = makeSession()
    expect(s.summary).toBeUndefined()
  })

  it("supports summary with additions/deletions/files", () => {
    const s = makeSession({ summary: { additions: 50, deletions: 10, files: 2 } })
    expect(s.summary?.additions).toBe(50)
    expect(s.summary?.deletions).toBe(10)
    expect(s.summary?.files).toBe(2)
  })

  it("tokens is optional and follows TokenUsage shape", () => {
    const s = makeSession()
    expect(s.tokens).toBeUndefined()
    const s2 = makeSession({ tokens: makeTokenUsage() })
    expect(s2.tokens?.input).toBe(100)
    expect(s2.tokens?.cache.read).toBe(10)
  })

  it("supports cost field", () => {
    const s = makeSession({ cost: 0.05 })
    expect(s.cost).toBeCloseTo(0.05)
  })

  it("agent is optional", () => {
    const s = makeSession({ agent: "default" })
    expect(s.agent).toBe("default")
    const s2 = makeSession()
    expect(s2.agent).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// Session – parentID, version, revert, model, project
// ---------------------------------------------------------------------------
describe("Session parentID/version/revert/model/project", () => {
  it("parentID is optional", () => {
    const s = makeSession({ parentID: "parent-1" })
    expect(s.parentID).toBe("parent-1")
  })

  it("parentID undefined when not forked", () => {
    const s = makeSession()
    expect(s.parentID).toBeUndefined()
  })

  it("version is optional string", () => {
    const s = makeSession({ version: "1.0.0" })
    expect(s.version).toBe("1.0.0")
  })

  it("revert is optional and requires messageID", () => {
    const s = makeSession({ revert: { messageID: "msg-1" } })
    expect(s.revert?.messageID).toBe("msg-1")
    expect(s.revert?.partID).toBeUndefined()
  })

  it("revert supports optional partID, snapshot, diff", () => {
    const s = makeSession({ revert: { messageID: "m1", partID: "p1", snapshot: "snap", diff: "diff content" } })
    expect(s.revert?.partID).toBe("p1")
    expect(s.revert?.snapshot).toBe("snap")
    expect(s.revert?.diff).toBe("diff content")
  })

  it("model is optional with id/providerID/variant", () => {
    const s = makeSession({ model: { id: "gpt-4o", providerID: "openai", variant: "high" } })
    expect(s.model?.id).toBe("gpt-4o")
    expect(s.model?.providerID).toBe("openai")
    expect(s.model?.variant).toBe("high")
  })

  it("model variant is optional", () => {
    const s = makeSession({ model: { id: "claude", providerID: "anthropic" } })
    expect(s.model?.variant).toBeUndefined()
  })

  it("project can be null", () => {
    const s = makeSession({ project: null })
    expect(s.project).toBeNull()
  })

  it("project supports object with id/worktree and optional name", () => {
    const s = makeSession({ project: { id: "proj-1", worktree: "/tmp/wt", name: "MyProject" } })
    expect(s.project && typeof s.project !== "string" && (s.project as { id: string }).id).toBe("proj-1")
    if (s.project) expect(s.project.worktree).toBe("/tmp/wt")
  })

  it("project name is optional", () => {
    const s = makeSession({ project: { id: "p1", worktree: "/tmp" } })
    expect(s.project && (s.project as { name?: string }).name).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// SessionStatus
// ---------------------------------------------------------------------------
describe("SessionStatus", () => {
  it("creates valid SessionStatus with type", () => {
    const st: SessionStatus = { type: "idle" }
    expect(st.type).toBe("idle")
  })

  it("supports optional attempt, message, next", () => {
    const st: SessionStatus = { type: "retrying", attempt: 2, message: "retrying...", next: 5000 }
    expect(st.attempt).toBe(2)
    expect(st.message).toBe("retrying...")
    expect(st.next).toBe(5000)
  })

  it("optional fields are undefined when not provided", () => {
    const st: SessionStatus = { type: "active" }
    expect(st.attempt).toBeUndefined()
    expect(st.message).toBeUndefined()
    expect(st.next).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// SessionView
// ---------------------------------------------------------------------------
describe("SessionView", () => {
  it("has required fields id/title/directory/updated/status/files/additions/deletions", () => {
    const v = makeSessionView()
    expect(v.id).toBe("ses-1")
    expect(v.title).toBe("View Title")
    expect(v.updated).toBe(1_700_000_100_000)
    expect(v.status).toBe("active")
    expect(v.files).toBe(3)
    expect(v.additions).toBe(100)
    expect(v.deletions).toBe(20)
  })

  it("supports zero files/additions/deletions", () => {
    const v = makeSessionView({ files: 0, additions: 0, deletions: 0 })
    expect(v.files).toBe(0)
    expect(v.additions).toBe(0)
  })

  it("optional tokens/cost/agent/parentID are undefined by default", () => {
    const v = makeSessionView()
    expect(v.tokens).toBeUndefined()
    expect(v.cost).toBeUndefined()
    expect(v.agent).toBeUndefined()
    expect(v.parentID).toBeUndefined()
  })

  it("supports optional tokens and cost", () => {
    const v = makeSessionView({ tokens: makeTokenUsage(), cost: 0.1 })
    expect(v.tokens?.input).toBe(100)
    expect(v.cost).toBeCloseTo(0.1)
  })

  it("supports optional parentID and agent", () => {
    const v = makeSessionView({ parentID: "p1", agent: "agent-x" })
    expect(v.parentID).toBe("p1")
    expect(v.agent).toBe("agent-x")
  })

  it("supports optional revert with messageID/partID", () => {
    const v = makeSessionView({ revert: { messageID: "m1", partID: "p1" } })
    expect(v.revert?.messageID).toBe("m1")
    expect(v.revert?.partID).toBe("p1")
  })

  it("supports optional model as ModelSelection", () => {
    const v = makeSessionView({ model: { providerID: "openai", modelID: "gpt-4o", variant: "mini" } })
    expect(v.model?.providerID).toBe("openai")
    expect(v.model?.variant).toBe("mini")
  })
})

// ---------------------------------------------------------------------------
// CachedSession
// ---------------------------------------------------------------------------
describe("CachedSession", () => {
  it("has required id/title/directory/updated", () => {
    const c = makeCachedSession()
    expect(c.id).toBe("ses-1")
    expect(c.title).toBe("Cached")
    expect(c.directory).toBe("/tmp/proj")
    expect(typeof c.updated).toBe("number")
  })

  it("optional summary/tokens/cost/agent/model undefined by default", () => {
    const c = makeCachedSession()
    expect(c.summary).toBeUndefined()
    expect(c.tokens).toBeUndefined()
    expect(c.cost).toBeUndefined()
    expect(c.agent).toBeUndefined()
    expect(c.model).toBeUndefined()
  })

  it("supports summary", () => {
    const c = makeCachedSession({ summary: { additions: 10, deletions: 5, files: 1 } })
    expect(c.summary?.files).toBe(1)
  })

  it("supports tokens and cost", () => {
    const c = makeCachedSession({ tokens: makeTokenUsage({ input: 999 }), cost: 1.23 })
    expect(c.tokens?.input).toBe(999)
    expect(c.cost).toBeCloseTo(1.23)
  })

  it("supports agent and model", () => {
    const c = makeCachedSession({ agent: "agent-1", model: { providerID: "openai", modelID: "gpt-4o" } })
    expect(c.agent).toBe("agent-1")
    expect(c.model?.modelID).toBe("gpt-4o")
  })

  it("updated is a timestamp number", () => {
    const c = makeCachedSession({ updated: 1234567890 })
    expect(c.updated).toBe(1234567890)
  })
})
