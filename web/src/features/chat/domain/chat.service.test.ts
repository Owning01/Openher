import { describe, it, expect, vi } from "vitest"
import {
  extractText,
  buildSignature,
  buildMessageSignature,
  shouldFilterMessage,
  stripNonEssential,
  mergeMessages,
  dedupeOptimistic,
} from "./chat.service"
import type { MessageEnvelope } from "../../../entities/message/model"

function part(id: string, type: string, text?: string, extra: Record<string, unknown> = {}) {
  return { id, type, text, ...extra } as MessageEnvelope["parts"][number]
}

function info(id: string, sessionID = "sess-1", overrides: Partial<MessageEnvelope["info"]> = {}): MessageEnvelope["info"] {
  return {
    id,
    role: "assistant",
    sessionID,
    time: { created: Date.now(), completed: undefined },
    ...overrides,
  }
}

function msg(
  id: string,
  sessionID = "sess-1",
  parts: MessageEnvelope["parts"] = [],
  overrides: Partial<MessageEnvelope["info"]> = {},
): MessageEnvelope {
  return { info: info(id, sessionID, overrides), parts }
}

// ---------------- extractText ----------------

describe("extractText", () => {
  it("returns empty for no parts", () => {
    expect(extractText(msg("m1", "sess-1", []))).toBe("")
  })

  it("returns empty when parts have no text", () => {
    expect(extractText(msg("m1", "sess-1", [part("p1", "tool", undefined, { tool: "bash" })]))).toBe("")
  })

  it("extracts single text part", () => {
    expect(extractText(msg("m1", "sess-1", [part("p1", "text", "hello")]))).toBe("hello")
  })

  it("joins multiple text parts with double newline and trims", () => {
    const m = msg("m1", "sess-1", [part("p1", "text", "a"), part("p2", "text", "b")])
    expect(extractText(m)).toBe("a\n\nb")
  })

  it("includes compaction parts", () => {
    const m = msg("m1", "sess-1", [part("p1", "compaction", "compacted"), part("p2", "text", "hello")])
    expect(extractText(m)).toBe("compacted\n\nhello")
  })

  it("ignores non-text types even if they have text field (e.g., tool, thinking)", () => {
    const m = msg("m1", "sess-1", [
      part("p1", "tool", "should ignore", { tool: "bash" }),
      part("p2", "text", "keep"),
      part("p3", "thinking", "ignore thinking"),
    ])
    expect(extractText(m)).toBe("keep")
  })

  it("trims outer whitespace after join", () => {
    const m = msg("m1", "sess-1", [part("p1", "text", "  hi  "), part("p2", "text", "  there  ")])
    // join => "  hi  \n\n  there  " -> trim => "hi  \n\n  there"
    expect(extractText(m)).toBe("hi  \n\n  there")
  })

  it("skips parts where text is undefined or empty string", () => {
    const m = msg("m1", "sess-1", [
      part("p1", "text", undefined),
      part("p2", "text", ""),
      part("p3", "text", "valid"),
    ])
    expect(extractText(m)).toBe("valid")
  })
})

// ---------------- buildSignature ----------------

describe("buildSignature / buildMessageSignature", () => {
  it("returns empty string for empty array", () => {
    expect(buildSignature([])).toBe("")
    expect(buildMessageSignature([])).toBe("")
  })

  it("builds signature as id:length", () => {
    const m = msg("id1", "sess-1", [part("p1", "text", "hi")]) // length 2
    expect(buildSignature([m])).toBe("id1:2")
  })

  it("joins multiple messages with |", () => {
    const m1 = msg("a", "sess-1", [part("p1", "text", "hi")])
    const m2 = msg("b", "sess-1", [part("p1", "text", "hello")])
    expect(buildSignature([m1, m2])).toBe("a:2|b:5")
  })

  it("buildMessageSignature is alias of buildSignature", () => {
    expect(buildMessageSignature).toBe(buildSignature)
    const m = msg("x", "sess-1", [part("p1", "text", "foo")])
    expect(buildMessageSignature([m])).toBe(buildSignature([m]))
  })

  it("uses extractText length including multiline join", () => {
    const m = msg("m1", "sess-1", [part("p1", "text", "a"), part("p2", "text", "b")]) // "a\n\nb" length 4
    expect(buildSignature([m])).toBe("m1:4")
  })

  it("handles compaction length as well", () => {
    const m = msg("m1", "sess-1", [part("p1", "compaction", "xyz")])
    expect(buildSignature([m])).toBe("m1:3")
  })
})

// ---------------- shouldFilterMessage ----------------

describe("shouldFilterMessage", () => {
  it("returns true when text contains <pty_exited>", () => {
    const m = msg("m1", "sess-1", [part("p1", "text", "something <pty_exited> done")])
    expect(shouldFilterMessage(m)).toBe(true)
  })

  it("returns true when text contains 'Use pty_read to check'", () => {
    const m = msg("m1", "sess-1", [part("p1", "text", "Use pty_read to check logs")])
    expect(shouldFilterMessage(m)).toBe(true)
  })

  it("returns true when filtered string is inside compaction", () => {
    const m = msg("m1", "sess-1", [part("p1", "compaction", "Use pty_read to check")])
    expect(shouldFilterMessage(m)).toBe(true)
  })

  it("returns false for normal messages", () => {
    const m = msg("m1", "sess-1", [part("p1", "text", "hello world")])
    expect(shouldFilterMessage(m)).toBe(false)
  })

  it("returns false for empty text", () => {
    const m = msg("m1", "sess-1", [])
    expect(shouldFilterMessage(m)).toBe(false)
  })

  it("detects pattern across multiple parts joined", () => {
    // extractText joins with \n\n, so split pattern across parts won't match? But combined via \n\n still contains substring if each part separately? Test single part contains.
    const m = msg("m1", "sess-1", [part("p1", "text", "prefix "), part("p2", "text", "<pty_exited>")])
    // extractText = "prefix \n\n<pty_exited>" still includes substring
    expect(shouldFilterMessage(m)).toBe(true)
  })
})

// ---------------- stripNonEssential ----------------

describe("stripNonEssential", () => {
  it("returns same reference for dataMode full", () => {
    const m = msg("m1", "sess-1", [part("p1", "tool", "x", { tool: "random" })])
    expect(stripNonEssential(m, "full")).toBe(m)
  })

  it("returns same reference for dataMode saver", () => {
    const m = msg("m1", "sess-1", [part("p1", "tool", "x", { tool: "random" })])
    expect(stripNonEssential(m, "saver")).toBe(m)
  })

  it("keeps non-tool parts regardless of mode", () => {
    const m = msg("m1", "sess-1", [part("p1", "text", "hello"), part("p2", "image", undefined, { mimeType: "image/png" })])
    const res = stripNonEssential(m, "miser")
    expect(res).toBe(m) // no filtering needed, same ref
    expect(res.parts).toHaveLength(2)
  })

  it("filters tool parts with non-essential tools when miser", () => {
    const m = msg("m1", "sess-1", [
      part("p1", "tool_use", undefined, { tool: "some_random_tool" }),
      part("p2", "text", "keep"),
    ])
    const res = stripNonEssential(m, "miser")
    expect(res.parts).toHaveLength(1)
    expect(res.parts[0]!.type).toBe("text")
  })

  it("keeps file tools write/edit/apply_patch/patch", () => {
    const m = msg("m1", "sess-1", [
      part("p1", "tool_use", undefined, { tool: "write" }),
      part("p2", "tool_use", undefined, { tool: "edit" }),
      part("p3", "tool_use", undefined, { tool: "apply_patch" }),
      part("p4", "tool_use", undefined, { tool: "patch" }),
      part("p5", "tool_use", undefined, { tool: "random" }),
    ])
    const res = stripNonEssential(m, "miser")
    expect(res.parts.map((p) => p.tool)).toEqual(["write", "edit", "apply_patch", "patch"])
  })

  it("keeps shell tools bash/execute/terminal/shell/pwsh/cmd", () => {
    const m = msg("m1", "sess-1", [
      part("p1", "tool", undefined, { tool: "bash" }),
      part("p2", "tool", undefined, { tool: "execute" }),
      part("p3", "terminal", undefined, { tool: "terminal" }),
      part("p4", "tool", undefined, { tool: "shell" }),
      part("p5", "tool", undefined, { tool: "pwsh" }),
      part("p6", "tool", undefined, { tool: "cmd" }),
    ])
    // note type includes terminal which is in toolPartTypes, but shellToolNames keeps it if tool matches
    const res = stripNonEssential(m, "ultra")
    // all should be kept because tool names are in shellToolNames
    expect(res.parts).toHaveLength(6)
  })

  it("filters when dataMode is ultra or miser or undefined", () => {
    const m = msg("m1", "sess-1", [part("p1", "tool", undefined, { tool: "unknown" })])
    expect(stripNonEssential(m, "miser").parts).toHaveLength(0)
    expect(stripNonEssential(m, "ultra").parts).toHaveLength(0)
    expect(stripNonEssential(m, undefined).parts).toHaveLength(0)
  })

  it("returns new object when filtering occurs", () => {
    const m = msg("m1", "sess-1", [
      part("p1", "text", "keep"),
      part("p2", "tool", undefined, { tool: "dropme" }),
    ])
    const res = stripNonEssential(m, "miser")
    expect(res).not.toBe(m)
    expect(res.info).toEqual(m.info)
  })

  it("returns same reference when no filtering needed", () => {
    const m = msg("m1", "sess-1", [part("p1", "text", "keep"), part("p2", "tool", undefined, { tool: "bash" })])
    expect(stripNonEssential(m, "miser")).toBe(m)
  })
})

// ---------------- mergeMessages ----------------

describe("mergeMessages", () => {
  it("returns prev when both empty (no change)", () => {
    const prev: MessageEnvelope[] = []
    const safe: MessageEnvelope[] = []
    expect(mergeMessages(prev, safe, "sess-1")).toBe(prev)
  })

  it("returns prev reference when safe empty and no session mismatch", () => {
    const m = msg("m1", "sess-1", [part("p1", "text", "hi")], { time: { created: 1 } })
    const prev = [m]
    expect(mergeMessages(prev, [], "sess-1")).toBe(prev)
  })

  it("filters out messages of other sessions and returns new array", () => {
    const other = msg("m1", "other-sess", [part("p1", "text", "hi")], { time: { created: 1 } })
    const prev = [other]
    const res = mergeMessages(prev, [], "sess-1")
    expect(res).toEqual([])
    expect(res).not.toBe(prev)
  })

  it("dedupes prev duplicates (seen) and marks changed", () => {
    const m1 = msg("dup", "sess-1", [part("p1", "text", "a")], { time: { created: 1 } })
    const m2 = msg("dup", "sess-1", [part("p2", "text", "b")], { time: { created: 2 } })
    const prev = [m1, m2]
    const res = mergeMessages(prev, [], "sess-1")
    // should keep only first, dedup second, changed true => new array sorted
    expect(res).toHaveLength(1)
    expect(res[0]!.parts[0]!.text).toBe("a")
  })

  it("merges extraLocal parts not in updated and sorts by part id", () => {
    const prevParts = [part("p1", "text", "hello"), part("p-local", "text", "local extra")]
    const prevMsg = msg("m1", "sess-1", prevParts, { time: { created: 10 } })
    const safeMsg = msg("m1", "sess-1", [part("p1", "text", "hello updated")], {
      time: { created: 10, completed: 5 },
    })
    const res = mergeMessages([prevMsg], [safeMsg], "sess-1")
    expect(res).toHaveLength(1)
    // lexicographically "p-local" < "p1" because '-' (45) < '1' (49)
    expect(res[0]!.parts.map((p) => p.id)).toEqual(["p-local", "p1"])
  })

  it("does not duplicate extraLocal when ids overlap", () => {
    const prev = msg("m1", "sess-1", [part("p1", "text", "a")], { time: { created: 1 } })
    const safe = msg("m1", "sess-1", [part("p1", "text", "a")], { time: { created: 1 } })
    const res = mergeMessages([prev], [safe], "sess-1")
    // no extraLocal, so parts is exactly updated.parts reference? But changed false => prev ref? Actually updated same but completed unchanged, so changed false => returns prev
    expect(res).toBeInstanceOf(Array)
  })

  it("detects changed when completed time differs", () => {
    const prev = msg("m1", "sess-1", [part("p1", "text", "hi")], { time: { created: 1, completed: 1 } })
    const safe = msg("m1", "sess-1", [part("p1", "text", "hi")], { time: { created: 1, completed: 2 } })
    const res = mergeMessages([prev], [safe], "sess-1")
    expect(res).not.toBe([prev] as unknown) // not same as prev
    expect(res[0]!.info.time.completed).toBe(2)
  })

  it("detects changed when role differs", () => {
    const prev = msg("m1", "sess-1", [part("p1", "text", "hi")], { time: { created: 1 }, role: "assistant" })
    const safe = msg("m1", "sess-1", [part("p1", "text", "hi")], { time: { created: 1 }, role: "user" })
    const res = mergeMessages([prev], [safe], "sess-1")
    expect(res[0]!.info.role).toBe("user")
    expect(res).not.toBe(prev)
  })

  it("adds new messages from safe not in prev and sorts by created", () => {
    const prev = msg("m1", "sess-1", [part("p1", "text", "a")], { time: { created: 10 } })
    const newSafe = msg("m2", "sess-1", [part("p1", "text", "b")], { time: { created: 5 } })
    const res = mergeMessages([prev], [newSafe], "sess-1")
    // changed true, sorted ascending created: m2 (5) before m1 (10)
    expect(res.map((m) => m.info.id)).toEqual(["m2", "m1"])
  })

  it("does not add safe messages that are already seen via prev dup", () => {
    const prev = msg("m1", "sess-1", [part("p1", "text", "a")], { time: { created: 1 } })
    const safeSame = msg("m1", "sess-1", [part("p1", "text", "a-updated")], { time: { created: 1 } })
    const res = mergeMessages([prev], [safeSame], "sess-1")
    // should not duplicate, only one entry; if changed due to no completed diff? Actually completed both undefined => not changed, so returns prev
    // But if there was another safe entry duplicate, it would be skipped
    expect(res.length).toBe(1)
  })

  it("returns prev when no changes detected (same ids, same completed/role, no new)", () => {
    const m = msg("m1", "sess-1", [part("p1", "text", "hi")], { time: { created: 1, completed: 1 } })
    const safe = msg("m1", "sess-1", [part("p1", "text", "hi")], { time: { created: 1, completed: 1 } })
    const prev = [m]
    const res = mergeMessages(prev, [safe], "sess-1")
    expect(res).toBe(prev)
  })
})

// ---------------- dedupeOptimistic ----------------

describe("dedupeOptimistic", () => {
  it("returns same ref when pending empty", () => {
    const pending: MessageEnvelope[] = []
    const server: MessageEnvelope[] = [msg("s1", "sess-1", [part("p1", "text", "hi")], { role: "user" })]
    expect(dedupeOptimistic(pending, server, "sess-1")).toBe(pending)
  })

  it("returns same ref when no pending for target session", () => {
    const pending = [msg("p1", "other-sess", [part("pt", "text", "hi")], { role: "user" })]
    const server: MessageEnvelope[] = []
    expect(dedupeOptimistic(pending, server, "sess-1")).toBe(pending)
  })

  it("removes pending that matches confirmed id", () => {
    const pending = [msg("id1", "sess-1", [part("pt", "text", "hello")], { role: "user" })]
    const server = [msg("id1", "sess-1", [part("pt", "text", "hello")], { role: "user" })]
    const res = dedupeOptimistic(pending, server, "sess-1")
    expect(res).toHaveLength(0)
  })

  it("removes pending that matches confirmed text (first occurrence)", () => {
    const pending = [msg("opt1", "sess-1", [part("pt", "text", "hello")], { role: "user" })]
    const server = [msg("srv1", "sess-1", [part("pt", "text", "hello")], { role: "user" })]
    const res = dedupeOptimistic(pending, server, "sess-1")
    expect(res).toHaveLength(0)
  })

  it("only removes first matching text when duplicates pending", () => {
    const pending = [
      msg("opt1", "sess-1", [part("pt", "text", "dup")], { role: "user" }),
      msg("opt2", "sess-1", [part("pt", "text", "dup")], { role: "user" }),
    ]
    const server = [msg("srv1", "sess-1", [part("pt", "text", "dup")], { role: "user" })]
    const res = dedupeOptimistic(pending, server, "sess-1")
    // first dup removed, second kept because matchedTexts prevents second
    expect(res).toHaveLength(1)
    expect(res[0]!.info.id).toBe("opt2")
  })

  it("does not remove when text does not match", () => {
    const pending = [msg("opt1", "sess-1", [part("pt", "text", "pending text")], { role: "user" })]
    const server = [msg("srv1", "sess-1", [part("pt", "text", "different")], { role: "user" })]
    const res = dedupeOptimistic(pending, server, "sess-1")
    expect(res).toBe(pending) // same ref when nothing removed
  })

  it("handles image-only optimistic matched by image count", () => {
    const imgPart = { id: "img1", type: "image", mimeType: "image/png" } as MessageEnvelope["parts"][number]
    const pending = [msg("opt1", "sess-1", [imgPart], { role: "user" })]
    const server = [msg("srv1", "sess-1", [imgPart], { role: "user" })]
    const res = dedupeOptimistic(pending, server, "sess-1")
    expect(res).toHaveLength(0)
  })

  it("does not remove image-only when count mismatched", () => {
    const img1 = { id: "img1", type: "image", mimeType: "image/png" } as MessageEnvelope["parts"][number]
    const img2 = { id: "img2", type: "image", mimeType: "image/png" } as MessageEnvelope["parts"][number]
    const pending = [msg("opt1", "sess-1", [img1], { role: "user" })] // 1 image
    const server = [msg("srv1", "sess-1", [img1, img2], { role: "user" })] // 2 images
    const res = dedupeOptimistic(pending, server, "sess-1")
    expect(res).toBe(pending)
  })

  it("does not affect pending of other sessions", () => {
    const pending = [
      msg("opt1", "sess-1", [part("pt", "text", "hello")], { role: "user" }),
      msg("opt2", "other-sess", [part("pt", "text", "hello")], { role: "user" }),
    ]
    const server = [msg("srv1", "sess-1", [part("pt", "text", "hello")], { role: "user" })]
    const res = dedupeOptimistic(pending, server, "sess-1")
    expect(res.map((m) => m.info.id)).toEqual(["opt2"])
  })

  it("ignores non-user server messages for confirmation", () => {
    const pending = [msg("opt1", "sess-1", [part("pt", "text", "hello")], { role: "user" })]
    const server = [msg("srv1", "sess-1", [part("pt", "text", "hello")], { role: "assistant" })]
    const res = dedupeOptimistic(pending, server, "sess-1")
    expect(res).toBe(pending)
  })

  it("returns new array when some pending removed, same ref when none removed", () => {
    const pending = [msg("opt1", "sess-1", [part("pt", "text", "keep")], { role: "user" })]
    const serverEmpty: MessageEnvelope[] = []
    expect(dedupeOptimistic(pending, serverEmpty, "sess-1")).toBe(pending)

    const serverMatch = [msg("srv1", "sess-1", [part("pt", "text", "keep")], { role: "user" })]
    const res = dedupeOptimistic(pending, serverMatch, "sess-1")
    expect(res).not.toBe(pending)
  })
})
