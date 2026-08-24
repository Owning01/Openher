import { describe, it, expect } from "vitest"
import { parseDragPayload, parseDockPayload, isTerminalTabPayload } from "./drag"

describe("parseDragPayload", () => {
  it("returns unknown for empty string", () => {
    expect(parseDragPayload("")).toEqual({ kind: "unknown", raw: "" })
  })

  it("parses panel payload with idx and payload", () => {
    const result = parseDragPayload("panel:2:kind:terminal")
    expect(result).toEqual({ kind: "panel", idx: 2, payload: "kind:terminal", raw: "panel:2:kind:terminal" })
  })

  it("parses panel with colon in payload (joined)", () => {
    const result = parseDragPayload("panel:0:session:abc:extra")
    expect(result).toEqual({ kind: "panel", idx: 0, payload: "session:abc:extra", raw: "panel:0:session:abc:extra" })
  })

  it("handles panel with NaN idx", () => {
    const result = parseDragPayload("panel:abc:something")
    expect(result.kind).toBe("panel")
    if (result.kind === "panel") {
      expect(Number.isNaN(result.idx)).toBe(true)
      expect(result.payload).toBe("something")
    }
  })

  it("parses session kind", () => {
    expect(parseDragPayload("session:my-session-123")).toEqual({
      kind: "session",
      id: "my-session-123",
      raw: "session:my-session-123",
    })
  })

  it("parses session with empty id", () => {
    expect(parseDragPayload("session:")).toEqual({ kind: "session", id: "", raw: "session:" })
  })

  it("parses kind", () => {
    expect(parseDragPayload("kind:terminal")).toEqual({ kind: "kind", value: "terminal", raw: "kind:terminal" })
  })

  it("parses kind with empty value", () => {
    expect(parseDragPayload("kind:")).toEqual({ kind: "kind", value: "", raw: "kind:" })
  })

  it("parses tab", () => {
    expect(parseDragPayload("tab:")).toEqual({ kind: "tab", raw: "tab:" })
    expect(parseDragPayload("tab:anything")).toEqual({ kind: "tab", raw: "tab:anything" })
  })

  it("parses file with slash", () => {
    expect(parseDragPayload("src/utils.ts")).toEqual({ kind: "file", path: "src/utils.ts", raw: "src/utils.ts" })
  })

  it("parses file with backslash", () => {
    expect(parseDragPayload("C:\\Users\\file.txt")).toEqual({ kind: "file", path: "C:\\Users\\file.txt", raw: "C:\\Users\\file.txt" })
  })

  it("parses file with dot", () => {
    expect(parseDragPayload("file.txt")).toEqual({ kind: "file", path: "file.txt", raw: "file.txt" })
  })

  it("returns unknown for plain string without file indicators", () => {
    expect(parseDragPayload("hello")).toEqual({ kind: "unknown", raw: "hello" })
  })

  it("prioritizes panel prefix over file detection", () => {
    // even if payload contains slashes, panel wins
    expect(parseDragPayload("panel:1:foo/bar")).toMatchObject({ kind: "panel" })
  })
})

describe("parseDockPayload", () => {
  it("parses panel with kind payload", () => {
    const result = parseDockPayload("panel:1:kind:terminal")
    expect(result).toMatchObject({ targetKind: "terminal", targetSessionId: null, fromIndex: 1 })
  })

  it("parses panel with legacy shell kind", () => {
    expect(parseDockPayload("panel:0:explorer")).toMatchObject({ targetKind: "explorer", targetSessionId: null, fromIndex: 0 })
    expect(parseDockPayload("panel:2:kanban")).toMatchObject({ targetKind: "kanban", targetSessionId: null, fromIndex: 2 })
    expect(parseDockPayload("panel:0:stats")).toMatchObject({ targetKind: "stats", targetSessionId: null, fromIndex: 0 })
    expect(parseDockPayload("panel:0:terminal")).toMatchObject({ targetKind: "session", targetSessionId: "terminal", fromIndex: 0 })
  })

  it("parses panel with session payload", () => {
    expect(parseDockPayload("panel:3:session:abc123")).toMatchObject({
      targetKind: "session",
      targetSessionId: "abc123",
      fromIndex: 3,
    })
  })

  it("parses panel with raw session id (fallback)", () => {
    expect(parseDockPayload("panel:5:my-session-id")).toMatchObject({
      targetKind: "session",
      targetSessionId: "my-session-id",
      fromIndex: 5,
    })
  })

  it("parses kind prefix", () => {
    expect(parseDockPayload("kind:terminal")).toMatchObject({ targetKind: "terminal", targetSessionId: null, fromIndex: null })
  })

  it("parses legacy shell kind directly", () => {
    expect(parseDockPayload("explorer")).toMatchObject({ targetKind: "explorer", targetSessionId: null, fromIndex: null })
    expect(parseDockPayload("terminal")).toMatchObject({ targetKind: "session", targetSessionId: "terminal", fromIndex: null })
  })

  it("parses session prefix directly", () => {
    expect(parseDockPayload("session:xyz")).toMatchObject({ targetKind: "session", targetSessionId: "xyz", fromIndex: null })
  })

  it("treats unknown raw as session id", () => {
    expect(parseDockPayload("my-session-999")).toMatchObject({ targetKind: "session", targetSessionId: "my-session-999", fromIndex: null })
  })

  it("handles panel with slash-containing payload as session", () => {
    // payload "foo/bar" is not kind/session/legacy, so treated as session id
    expect(parseDockPayload("panel:0:foo/bar")).toMatchObject({ targetKind: "session", targetSessionId: "foo/bar", fromIndex: 0 })
  })

  it("handles panel with NaN index", () => {
    const result = parseDockPayload("panel:abc:kind:terminal")
    expect(result.targetKind).toBe("terminal")
    expect(Number.isNaN(result.fromIndex!)).toBe(true)
  })

  it("empty string becomes session with empty id", () => {
    expect(parseDockPayload("")).toMatchObject({ targetKind: "session", targetSessionId: "", fromIndex: null })
  })
})

describe("isTerminalTabPayload", () => {
  it("detects terminal-tab inside panel payload (docked terminal)", () => {
    expect(isTerminalTabPayload("panel:0:terminal-tab:tab-1:bottom-terminal")).toBe(true)
  })

  it("detects terminal-tab inside panel payload (grid terminal)", () => {
    expect(isTerminalTabPayload("panel:2:terminal-tab:abc123:panel-2-term")).toBe(true)
  })

  it("detects bare terminal-tab payload", () => {
    expect(isTerminalTabPayload("terminal-tab:tab-1:panel-0-term")).toBe(true)
  })

  it("rejects plain panel payloads", () => {
    expect(isTerminalTabPayload("panel:2:kind:terminal")).toBe(false)
    expect(isTerminalTabPayload("panel:1:session:abc")).toBe(false)
    expect(isTerminalTabPayload("panel:0:terminal")).toBe(false)
  })

  it("rejects empty and unrelated payloads", () => {
    expect(isTerminalTabPayload("")).toBe(false)
    expect(isTerminalTabPayload("session:abc")).toBe(false)
    expect(isTerminalTabPayload("kind:terminal")).toBe(false)
    expect(isTerminalTabPayload("src/utils/file.ts")).toBe(false)
  })
})
