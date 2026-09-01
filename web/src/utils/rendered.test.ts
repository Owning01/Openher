import { describe, it, expect } from "vitest"
import { computeRenderedMessages, type RenderedCache } from "./rendered"
import type { MessageEnvelope, FileDiff } from "../types"

// Helpers
function makeEnvelope(overrides: Partial<MessageEnvelope> & { info: MessageEnvelope["info"] }): MessageEnvelope {
  return {
    parts: [],
    ...overrides,
  } as MessageEnvelope
}

function baseInfo(id: string, role = "assistant", sessionID = "sess-1"): MessageEnvelope["info"] {
  return {
    id,
    role,
    sessionID,
    time: { created: Date.now() },
  }
}

function textPart(id: string, text: string, type = "text") {
  return { id, type, text } as MessageEnvelope["parts"][number]
}
function thinkingPart(id: string, text: string) {
  return { id, type: "thinking", text, time: { start: 1, end: 2 } } as MessageEnvelope["parts"][number]
}
function reasoningPart(id: string, text: string) {
  return { id, type: "reasoning", text } as MessageEnvelope["parts"][number]
}
function toolPart(id: string, tool: string, sessionID?: string, extra: Record<string, unknown> = {}) {
  return { id, type: "tool", tool, sessionID, text: "tool text", callID: "call-1", state: { status: "completed" }, ...extra } as MessageEnvelope["parts"][number]
}

describe("computeRenderedMessages", () => {
  it("returns empty out for empty input", () => {
    const { out, cache } = computeRenderedMessages([], undefined, new Map())
    expect(out).toEqual([])
    expect(cache.size).toBe(0)
  })

  it("keeps an assistant error visible even without text or parts", () => {
    const msg = makeEnvelope({
      info: { ...baseInfo("m-error"), role: "assistant", error: { name: "ProviderError", message: "rate limited" } },
      parts: [],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out).toHaveLength(1)
    expect(out[0]!.info.error?.message).toBe("rate limited")
  })

  it("renders single text message and sets text trimmed with join", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [textPart("p1", "hello "), textPart("p2", " world ")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out).toHaveLength(1)
    expect(out[0]!.text).toBe("hello \n\n world")
    expect(out[0]!.hasCompaction).toBe(false)
  })

  it("trims text outer ends but preserves inner padding around join", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [textPart("p1", "  a  "), textPart("p2", "  b  ")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    // join then trim: "  a  \n\n  b  ".trim() => "a  \n\n  b"
    expect(out[0]!.text).toBe("a  \n\n  b")
  })

  it("sets hasCompaction when compaction part present", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [textPart("p1", "hi", "compaction")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out[0]!.hasCompaction).toBe(true)
    expect(out[0]!.text).toBe("hi")
  })

  it("extracts thinking and reasoning parts separately", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [thinkingPart("t1", "think1"), reasoningPart("r1", "reason1"), textPart("p1", "hello")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out[0]!.thinkingParts).toHaveLength(2)
    expect(out[0]!.thinkingParts[0]!.text).toBe("think1")
    expect(out[0]!.thinkingParts[1]!.text).toBe("reason1")
    expect(out[0]!.text).toBe("hello")
  })

  it("preserves thinking time field", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [thinkingPart("t1", "deep")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out[0]!.thinkingParts[0]!.time).toEqual({ start: 1, end: 2 })
  })

  it("renders message with only thinking parts even without text", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [thinkingPart("t1", "only thinking")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out).toHaveLength(1)
    expect(out[0]!.text).toBe("")
  })

  it("extracts tool parts", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [toolPart("tp1", "bash"), textPart("p1", "hi")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out[0]!.toolParts).toHaveLength(1)
    expect(out[0]!.toolParts[0]!.tool).toBe("bash")
  })

  it("filters tool parts from different sessionID unless is task card", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1", "assistant", "sess-1"),
      parts: [
        toolPart("tp1", "bash", "sess-2"), // should be filtered
        toolPart("tp2", "task", "sess-2"), // task card kept
        toolPart("tp3", "other", "sess-1"), // same session kept
      ],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out[0]!.toolParts.map((p) => p.id)).toEqual(["tp2", "tp3"])
  })

  it("keeps subagent tool when state.input contains subagent_type", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1", "assistant", "sess-1"),
      parts: [
        {
          id: "tp1",
          type: "tool",
          tool: "other",
          sessionID: "sess-2",
          state: { input: { subagent_type: "explore" } },
        } as unknown as MessageEnvelope["parts"][number],
      ],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out[0]!.toolParts).toHaveLength(1)
  })

  it("filters pty internal messages containing <pty_exited>", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [textPart("p1", "hello <pty_exited> something")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out).toHaveLength(0)
  })

  it("filters pty internal messages containing 'Use pty_read to check'", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [textPart("p1", "Use pty_read to check logs")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out).toHaveLength(0)
  })

  it("skips messages with no text, no thinking, no tools, no images", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [textPart("p1", "")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out).toHaveLength(0)
  })

  it("renders message with image part even if text empty", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [{ id: "img1", type: "image", mimeType: "image/png" } as MessageEnvelope["parts"][number]],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out).toHaveLength(1)
  })

  it("renders file image part with mime image/", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [{ id: "f1", type: "file", mimeType: "image/jpeg" } as MessageEnvelope["parts"][number]],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out).toHaveLength(1)
  })

  it("deduplicates messages with same id (keeps first)", () => {
    const msg1 = makeEnvelope({ info: baseInfo("dup"), parts: [textPart("p1", "first")] })
    const msg2 = makeEnvelope({ info: baseInfo("dup"), parts: [textPart("p1", "second")] })
    const { out } = computeRenderedMessages([msg1, msg2], undefined, new Map())
    expect(out).toHaveLength(1)
    expect(out[0]!.text).toBe("first")
  })

  it("assigns pendingDiffs from user summary to next assistant message", () => {
    const diffs: FileDiff[] = [{ file: "a.ts", additions: 1, deletions: 0 }]
    const user = makeEnvelope({
      info: { ...baseInfo("u1", "user"), summary: { diffs } },
      parts: [textPart("p1", "user text")],
    })
    const assistant = makeEnvelope({
      info: baseInfo("a1", "assistant"),
      parts: [textPart("p1", "assistant text")],
    })
    const { out } = computeRenderedMessages([user, assistant], undefined, new Map())
    // user has no diffs attached, assistant gets them
    const renderedAssistant = out.find((m) => m.info.id === "a1")
    expect(renderedAssistant?.summaryDiffs).toBe(diffs)
  })

  it("pendingDiffs only to last assistant after user (replaces previous)", () => {
    const diffs: FileDiff[] = [{ file: "a.ts", additions: 1, deletions: 0 }]
    const user = makeEnvelope({
      info: { ...baseInfo("u1", "user"), summary: { diffs } },
      parts: [textPart("p1", "u")],
    })
    const a1 = makeEnvelope({ info: baseInfo("a1", "assistant"), parts: [textPart("p1", "a1")] })
    const a2 = makeEnvelope({ info: baseInfo("a2", "assistant"), parts: [textPart("p1", "a2")] })
    const { out } = computeRenderedMessages([user, a1, a2], undefined, new Map())
    // only a2 should retain diffs (a1 deleted)
    const ra1 = out.find((m) => m.info.id === "a1")
    const ra2 = out.find((m) => m.info.id === "a2")
    expect(ra2?.summaryDiffs).toBe(diffs)
    // ra1 still rendered but without diffs (deleted from map before a2 set)
    // Actually logic deletes lastAssistantId's entry when new assistant arrives with pending diffs
    // so a1 loses diffs
    expect(ra1?.summaryDiffs).toBeUndefined()
  })

  it("propagates turnMode from assistant mode to user via map", () => {
    const user = makeEnvelope({ info: baseInfo("u1", "user"), parts: [textPart("p1", "hi")] })
    const assistant = makeEnvelope({
      info: { ...baseInfo("a1", "assistant"), mode: "plan" },
      parts: [textPart("p1", "resp")],
    })
    const { out } = computeRenderedMessages([user, assistant], undefined, new Map())
    const ru = out.find((m) => m.info.id === "u1")
    expect(ru?.turnMode).toBe("plan")
  })

  it("uses message.info.mode directly for turnMode if present", () => {
    const msg = makeEnvelope({
      info: { ...baseInfo("m1", "assistant"), mode: "build" },
      parts: [textPart("p1", "hi")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out[0]!.turnMode).toBe("build")
  })

  it("caches and reuses rendered object when src reference identical and deps unchanged", () => {
    const msg = makeEnvelope({ info: baseInfo("m1"), parts: [textPart("p1", "hello")] })
    const cache: RenderedCache = new Map()
    const first = computeRenderedMessages([msg], "full" as any, cache)
    expect(first.out).toHaveLength(1)
    const firstRendered = first.out[0]
    const second = computeRenderedMessages([msg], "full" as any, first.cache)
    expect(second.out[0]).toBe(firstRendered) // same reference
    expect(second.cache.get("m1")!.rendered).toBe(firstRendered)
  })

  it("invalidates cache when src reference changes (immutable update)", () => {
    const msg1 = makeEnvelope({ info: baseInfo("m1"), parts: [textPart("p1", "hello")] })
    const cache: RenderedCache = new Map()
    const first = computeRenderedMessages([msg1], undefined, cache)
    const firstRendered = first.out[0]!
    const msg2 = makeEnvelope({ info: msg1.info, parts: [textPart("p1", "hello world")] })
    // same id but different object reference
    const second = computeRenderedMessages([msg2], undefined, first.cache)
    expect(second.out[0]).not.toBe(firstRendered)
    expect(second.out[0]!.text).toBe("hello world")
  })

  it("invalidates cache when dataMode changes", () => {
    const msg = makeEnvelope({ info: baseInfo("m1"), parts: [textPart("p1", "hi")] })
    const first = computeRenderedMessages([msg], "full" as any, new Map())
    const second = computeRenderedMessages([msg], "saver" as any, first.cache)
    expect(second.out[0]).not.toBe(first.out[0])
    expect(second.out[0]!.dataMode).toBe("saver")
  })

  it("invalidates cache when diffs change", () => {
    const diffs1: FileDiff[] = [{ file: "a.ts", additions: 1, deletions: 0 }]
    const diffs2: FileDiff[] = [{ file: "b.ts", additions: 2, deletions: 0 }]
    const user1 = makeEnvelope({
      info: { ...baseInfo("u1", "user"), summary: { diffs: diffs1 } },
      parts: [textPart("p1", "u")],
    })
    const assistant = makeEnvelope({ info: baseInfo("a1", "assistant"), parts: [textPart("p1", "a")] })
    const first = computeRenderedMessages([user1, assistant], undefined, new Map())
    const firstRendered = first.out.find((m) => m.info.id === "a1")!
    const user2 = makeEnvelope({
      info: { ...baseInfo("u1", "user"), summary: { diffs: diffs2 } },
      parts: [textPart("p1", "u")],
    })
    // need new reference for assistant as well to trigger re-eval? Actually cache key is assistant, but diffs is derived from user.
    // To invalidate, we pass new array with changed diffs reference and same assistant ref; diffs !== cached diffs so should miss.
    const second = computeRenderedMessages([user2, assistant], undefined, first.cache)
    const secondRendered = second.out.find((m) => m.info.id === "a1")!
    expect(secondRendered).not.toBe(firstRendered)
    expect(secondRendered.summaryDiffs).toBe(diffs2)
  })

  it("nextCache is new Map, not same as input cache (inmutabilidad)", () => {
    const msg = makeEnvelope({ info: baseInfo("m1"), parts: [textPart("p1", "hi")] })
    const inputCache: RenderedCache = new Map()
    const { cache: nextCache } = computeRenderedMessages([msg], undefined, inputCache)
    expect(nextCache).not.toBe(inputCache)
  })

  it("handles compaction type correctly join and flag", () => {
    const msg = makeEnvelope({
      info: baseInfo("m1"),
      parts: [textPart("p1", "a", "compaction"), textPart("p2", "b", "text")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out[0]!.hasCompaction).toBe(true)
    expect(out[0]!.text).toBe("a\n\nb")
  })

  it("exposes tokens and cost from info", () => {
    const msg = makeEnvelope({
      info: {
        ...baseInfo("m1"),
        tokens: { input: 10, output: 20, reasoning: 0, cache: { read: 0, write: 0 } },
        cost: 0.05,
      },
      parts: [textPart("p1", "hi")],
    })
    const { out } = computeRenderedMessages([msg], undefined, new Map())
    expect(out[0]!.tokens?.input).toBe(10)
    expect(out[0]!.cost).toBe(0.05)
  })
})
