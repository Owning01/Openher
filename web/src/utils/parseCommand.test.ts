import { describe, it, expect, vi, beforeEach } from "vitest"
import { parseCommand, resolveCommand, buildOptimisticMessage, buildStatusMessage } from "./parseCommand"
import type { ServerConfig, SessionView } from "../types"

// Mock api module for resolveCommand
vi.mock("../api", () => ({
  api: {
    listCommands: vi.fn(),
  },
}))

import { api } from "../api"

const mockConfig: ServerConfig = {
  host: "localhost",
  port: 4096,
  username: "",
  password: "",
}

function makeSession(overrides: Partial<SessionView> = {}): SessionView {
  return {
    id: "sess-1",
    title: "My Session",
    directory: "/home/project",
    updated: Date.now(),
    status: "idle",
    files: 0,
    additions: 0,
    deletions: 0,
    ...overrides,
  }
}

describe("parseCommand", () => {
  it("returns null for text not starting with /", () => {
    expect(parseCommand("hello world")).toBeNull()
  })

  it("returns null for empty string", () => {
    expect(parseCommand("")).toBeNull()
  })

  it("returns null for text starting with space slash", () => {
    expect(parseCommand(" /help")).toBeNull()
  })

  it("parses /help to help type", () => {
    const result = parseCommand("/help")
    expect(result).toEqual({ type: "help", text: "/help" })
  })

  it("parses /commands to help type", () => {
    const result = parseCommand("/commands")
    expect(result).toEqual({ type: "help", text: "/commands" })
  })

  it("parses /skills to help type", () => {
    const result = parseCommand("/skills")
    expect(result).toEqual({ type: "help", text: "/skills" })
  })

  it("parses help case-insensitively", () => {
    expect(parseCommand("/HELP")).toEqual({ type: "help", text: "/HELP" })
    expect(parseCommand("/Help")).toEqual({ type: "help", text: "/Help" })
    expect(parseCommand("/SKILLS")).toEqual({ type: "help", text: "/SKILLS" })
  })

  it("parses /status to status type", () => {
    const result = parseCommand("/status")
    expect(result).toEqual({ type: "status", session: { title: "", status: "", directory: "" } })
  })

  it("parses /status case-insensitively", () => {
    expect(parseCommand("/STATUS")).toEqual({ type: "status", session: { title: "", status: "", directory: "" } })
  })

  it("parses /undo", () => {
    expect(parseCommand("/undo")).toEqual({ type: "undo" })
  })

  it("parses /redo", () => {
    expect(parseCommand("/redo")).toEqual({ type: "redo" })
  })

  it("parses /compact", () => {
    expect(parseCommand("/compact")).toEqual({ type: "compact" })
  })

  it("parses /themes", () => {
    expect(parseCommand("/themes")).toEqual({ type: "themes" })
  })

  it("parses /history and /timeline to panel types", () => {
    expect(parseCommand("/history")).toEqual({ type: "history" })
    expect(parseCommand("/timeline")).toEqual({ type: "timeline" })
    expect(parseCommand("/HISTORY")).toEqual({ type: "history" })
    expect(parseCommand("/Timeline")).toEqual({ type: "timeline" })
  })

  it("parses /connect with args", () => {
    expect(parseCommand("/connect myprovider")).toEqual({ type: "connect", text: "myprovider" })
  })

  it("parses /connect without args", () => {
    expect(parseCommand("/connect")).toEqual({ type: "connect", text: "" })
  })

  it("parses /connect with multiple word args", () => {
    expect(parseCommand("/connect provider with spaces")).toEqual({ type: "connect", text: "provider with spaces" })
  })

  it("parses unknown command with args as command type", () => {
    expect(parseCommand("/mycommand arg1 arg2")).toEqual({ type: "command", command: "mycommand", args: "arg1 arg2" })
  })

  it("parses unknown command without args", () => {
    expect(parseCommand("/mycommand")).toEqual({ type: "command", command: "mycommand", args: "" })
  })

  it("preserves original command casing in command type", () => {
    const result = parseCommand("/MyCommand args") as { type: "command"; command: string; args: string }
    expect(result.type).toBe("command")
    expect(result.command).toBe("MyCommand")
    expect(result.args).toBe("args")
  })

  it("handles slash alone as command with empty name", () => {
    const result = parseCommand("/") as { type: "command"; command: string; args: string }
    expect(result.type).toBe("command")
    expect(result.command).toBe("")
    expect(result.args).toBe("")
  })

  it("trims args correctly", () => {
    expect(parseCommand("/connect   spaced   args  ")).toEqual({ type: "connect", text: "spaced   args" })
  })

  it("parses local commands case-insensitively for undo/redo/compact/themes", () => {
    expect(parseCommand("/UNDO")).toEqual({ type: "undo" })
    expect(parseCommand("/REDO")).toEqual({ type: "redo" })
    expect(parseCommand("/COMPACT")).toEqual({ type: "compact" })
    expect(parseCommand("/THEMES")).toEqual({ type: "themes" })
  })

  it("returns command type for unknown slash command", () => {
    const result = parseCommand("/unknown")
    expect(result).toEqual({ type: "command", command: "unknown", args: "" })
  })
})

describe("resolveCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns isKnown true when command exists in provided list", async () => {
    const commands = [{ name: "mycommand" }, { name: "other" }]
    const result = await resolveCommand(mockConfig, "mycommand", commands, vi.fn())
    expect(result.isKnown).toBe(true)
    expect(result.updatedCommands).toEqual(commands)
  })

  it("returns isKnown false when command not in list", async () => {
    const commands = [{ name: "other" }]
    const result = await resolveCommand(mockConfig, "mycommand", commands, vi.fn())
    expect(result.isKnown).toBe(false)
  })

  it("does not call api.listCommands when commands list is non-empty", async () => {
    const spy = vi.mocked(api.listCommands)
    const commands = [{ name: "existing" }]
    await resolveCommand(mockConfig, "existing", commands, vi.fn())
    expect(spy).not.toHaveBeenCalled()
  })

  it("fetches commands via api when list is empty and finds known command", async () => {
    const fetched = [{ name: "fetched-cmd" }, { name: "another" }]
    vi.mocked(api.listCommands).mockResolvedValue(fetched)
    const onSetCommands = vi.fn()
    const result = await resolveCommand(mockConfig, "fetched-cmd", [], onSetCommands)
    expect(api.listCommands).toHaveBeenCalledWith(mockConfig)
    expect(onSetCommands).toHaveBeenCalledWith(fetched)
    expect(result.isKnown).toBe(true)
    expect(result.updatedCommands).toEqual(fetched)
  })

  it("handles api failure gracefully when list is empty", async () => {
    vi.mocked(api.listCommands).mockRejectedValue(new Error("network error"))
    const onSetCommands = vi.fn()
    const result = await resolveCommand(mockConfig, "any", [], onSetCommands)
    expect(result.isKnown).toBe(false)
    expect(result.updatedCommands).toEqual([])
    expect(onSetCommands).not.toHaveBeenCalled()
  })

  it("returns updatedCommands from api when command not found after fetch", async () => {
    const fetched = [{ name: "other" }]
    vi.mocked(api.listCommands).mockResolvedValue(fetched)
    const result = await resolveCommand(mockConfig, "missing", [], vi.fn())
    expect(result.isKnown).toBe(false)
    expect(result.updatedCommands).toEqual(fetched)
  })
})

describe("buildOptimisticMessage", () => {
  it("builds message with text part", () => {
    const session = makeSession()
    const msg = buildOptimisticMessage(session, "hello")
    expect(msg.info.role).toBe("user")
    expect(msg.info.sessionID).toBe(session.id)
    expect(msg.parts).toHaveLength(1)
    expect(msg.parts[0].type).toBe("text")
    expect(msg.parts[0].text).toBe("hello")
  })

  it("builds message with empty text produces no text part", () => {
    const session = makeSession()
    const msg = buildOptimisticMessage(session, "")
    expect(msg.parts).toHaveLength(0)
  })

  it("builds message with images", () => {
    const session = makeSession()
    const images = [{ base64: "abc123", mime: "image/png" }]
    const msg = buildOptimisticMessage(session, "look", images)
    expect(msg.parts).toHaveLength(2)
    expect(msg.parts[0].type).toBe("text")
    expect(msg.parts[1].type).toBe("image")
    expect(msg.parts[1].data).toBe("abc123")
    expect(msg.parts[1].mimeType).toBe("image/png")
  })

  it("builds message with empty text but images still has image parts", () => {
    const session = makeSession()
    const images = [{ base64: "xyz", mime: "image/jpeg" }]
    const msg = buildOptimisticMessage(session, "", images)
    expect(msg.parts).toHaveLength(1)
    expect(msg.parts[0].type).toBe("image")
  })

  it("handles multiple images", () => {
    const session = makeSession()
    const images = [
      { base64: "a", mime: "image/png" },
      { base64: "b", mime: "image/jpeg" },
      { base64: "c", mime: "image/webp" },
    ]
    const msg = buildOptimisticMessage(session, "multi", images)
    expect(msg.parts).toHaveLength(4)
    expect(msg.parts.filter((p) => p.type === "image")).toHaveLength(3)
  })

  it("generates unique ids for each part", () => {
    const session = makeSession()
    const msg = buildOptimisticMessage(session, "hello", [{ base64: "x", mime: "image/png" }])
    const ids = msg.parts.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("sets created time", () => {
    const session = makeSession()
    const before = Date.now()
    const msg = buildOptimisticMessage(session, "hi")
    const after = Date.now()
    expect(msg.info.time.created).toBeGreaterThanOrEqual(before)
    expect(msg.info.time.created).toBeLessThanOrEqual(after)
  })

  it("uses session id in info", () => {
    const session = makeSession({ id: "custom-id" })
    const msg = buildOptimisticMessage(session, "hi")
    expect(msg.info.sessionID).toBe("custom-id")
  })
})

describe("buildStatusMessage", () => {
  it("builds assistant message with session info", () => {
    const session = makeSession({ title: "Test", status: "busy", directory: "/tmp/proj" })
    const msg = buildStatusMessage(session)
    expect(msg.info.role).toBe("assistant")
    expect(msg.info.sessionID).toBe(session.id)
    expect(msg.parts).toHaveLength(1)
    expect(msg.parts[0].type).toBe("text")
    expect(msg.parts[0].text).toContain("Session: Test (busy)")
    expect(msg.parts[0].text).toContain("Directory: /tmp/proj")
  })

  it("includes both session and directory lines", () => {
    const session = makeSession({ title: "A", status: "idle", directory: "/a/b" })
    const msg = buildStatusMessage(session)
    const lines = msg.parts[0].text!.split("\n")
    expect(lines).toHaveLength(2)
    expect(lines[0]).toBe("Session: A (idle)")
    expect(lines[1]).toBe("Directory: /a/b")
  })

  it("sets completed time equal to created", () => {
    const session = makeSession()
    const msg = buildStatusMessage(session)
    expect(msg.info.time.completed).toBe(msg.info.time.created)
  })

  it("generates unique ids", () => {
    const session = makeSession()
    const msg1 = buildStatusMessage(session)
    const msg2 = buildStatusMessage(session)
    expect(msg1.info.id).not.toBe(msg2.info.id)
  })

  it("handles empty title and directory", () => {
    const session = makeSession({ title: "", status: "", directory: "" })
    const msg = buildStatusMessage(session)
    expect(msg.parts[0].text).toBe("Session:  ()\nDirectory: ")
  })
})
