import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { buildSSEUrl, parseSSEChunk, shouldReconnect } from "./client"
import type { ServerConfig } from "../../types"

function cfg(overrides: Partial<ServerConfig> = {}): ServerConfig {
  return {
    host: "localhost",
    port: 3000,
    username: "",
    password: "",
    ...overrides,
  }
}

describe("buildSSEUrl", () => {
  it("builds v1 url without params", () => {
    expect(buildSSEUrl(cfg())).toBe("http://localhost:3000/event")
  })

  it("builds v1 url with directory param", () => {
    const url = buildSSEUrl(cfg(), "/tmp/project")
    expect(url).toBe("http://localhost:3000/event?directory=%2Ftmp%2Fproject")
  })

  it("uses location[directory] when apiVersion is v2", () => {
    const url = buildSSEUrl(cfg({ apiVersion: "v2" }), "/tmp/project")
    expect(url).toContain("location%5Bdirectory%5D=%2Ftmp%2Fproject")
    expect(url).not.toContain("?directory=")
  })

  it("uses location[directory] key when directory string is exactly 'location' in v2", () => {
    const url = buildSSEUrl(cfg({ apiVersion: "v2" }), "location")
    expect(url).toContain("location%5Bdirectory%5D=location")
  })

  it("builds url with sessionID only", () => {
    const url = buildSSEUrl(cfg(), undefined, "sess-123")
    expect(url).toBe("http://localhost:3000/event?sessionID=sess-123")
  })

  it("builds url with directory and sessionID", () => {
    const url = buildSSEUrl(cfg(), "/foo", "abc")
    expect(url).toContain("directory=%2Ffoo")
    expect(url).toContain("sessionID=abc")
    expect(url).toContain("?")
    expect(url).toContain("&")
  })

  it("builds v2 url with /api prefix", () => {
    expect(buildSSEUrl(cfg({ apiVersion: "v2" }))).toBe("http://localhost:3000/api/event")
  })

  it("builds v2 url with directory and sessionID using location[directory]", () => {
    const url = buildSSEUrl(cfg({ apiVersion: "v2" }), "/my/dir", "s1")
    expect(url).toBe("http://localhost:3000/api/event?location%5Bdirectory%5D=%2Fmy%2Fdir&sessionID=s1")
  })

  it("respects explicit v1 version (no /api prefix)", () => {
    expect(buildSSEUrl(cfg({ apiVersion: "v1" }))).toBe("http://localhost:3000/event")
  })

  it("handles https scheme in host", () => {
    const url = buildSSEUrl(cfg({ host: "https://example.com", port: 443 }))
    expect(url).toBe("https://example.com:443/event")
  })

  it("handles host with trailing spaces trimmed via baseUrl", () => {
    const url = buildSSEUrl(cfg({ host: "  localhost  ", port: 3000 }))
    expect(url).toBe("http://localhost:3000/event")
  })
})

describe("parseSSEChunk", () => {
  it("returns null for empty string", () => {
    expect(parseSSEChunk("")).toBeNull()
  })

  it("returns null for whitespace only", () => {
    expect(parseSSEChunk("   \n  ")).toBeNull()
  })

  it("returns null for comment lines starting with :", () => {
    expect(parseSSEChunk(": keep-alive")).toBeNull()
    expect(parseSSEChunk("  : comment")).toBeNull()
  })

  it("returns null when data is empty after trimming", () => {
    expect(parseSSEChunk("data:   ")).toBeNull()
  })

  it("returns null when no data line present (only event)", () => {
    expect(parseSSEChunk("event: custom")).toBeNull()
  })

  it("parses valid JSON with type, properties and id", () => {
    const raw = `data: ${JSON.stringify({ type: "session.status", properties: { status: "busy" }, id: "evt-1" })}`
    const ev = parseSSEChunk(raw)
    expect(ev).toEqual({ id: "evt-1", type: "session.status", properties: { status: "busy" } })
  })

  it("parses JSON without id generating an id", () => {
    const raw = `data: ${JSON.stringify({ type: "my.type", properties: { a: 1 } })}`
    const ev = parseSSEChunk(raw)!
    expect(ev.type).toBe("my.type")
    expect(ev.properties).toEqual({ a: 1 })
    expect(typeof ev.id).toBe("string")
    expect(ev.id.length).toBeGreaterThan(0)
  })

  it("falls back to event name when parsed.type missing", () => {
    const raw = `event: my.event\ndata: ${JSON.stringify({ properties: { x: 1 } })}`
    const ev = parseSSEChunk(raw)!
    expect(ev.type).toBe("my.event")
  })

  it("uses default event 'message' when no event line", () => {
    const raw = `data: ${JSON.stringify({ properties: { y: 2 } })}`
    const ev = parseSSEChunk(raw)!
    expect(ev.type).toBe("message")
  })

  it("returns properties via unwrapData when data wrapper present", () => {
    const raw = `data: ${JSON.stringify({ data: { wrapped: true }, type: "wrapped.type" })}`
    const ev = parseSSEChunk(raw)!
    expect(ev.properties).toEqual({ wrapped: true })
    expect(ev.type).toBe("wrapped.type")
  })

  it("handles invalid JSON by returning raw data in properties", () => {
    const ev = parseSSEChunk("data: not-json-at-all\nevent: custom.event")!
    expect(ev.type).toBe("custom.event")
    expect(ev.properties).toEqual({ data: "not-json-at-all" })
    expect(typeof ev.id).toBe("string")
  })

  it("concatenates multiple data: lines and parses combined JSON", () => {
    const ev = parseSSEChunk("data: {\"a\":\ndata: 1}")
    expect(ev).not.toBeNull()
  })

  it("ignores comment-like lines after trim? only early colon check", () => {
    const raw = `data: ${JSON.stringify({ type: "t", properties: {} })}\n: comment`
    const ev = parseSSEChunk(raw)
    expect(ev).not.toBeNull()
    expect(ev!.type).toBe("t")
  })

  it("handles multiline with event and data in any order", () => {
    const raw = `event: session.idle\ndata: ${JSON.stringify({ type: "session.idle", properties: {} , id: "id1"})}`
    expect(parseSSEChunk(raw)).toEqual({ id: "id1", type: "session.idle", properties: {} })
  })
})

describe("shouldReconnect", () => {
  it("returns false when state is polling regardless of attempt", () => {
    expect(shouldReconnect("polling", 0)).toBe(false)
    expect(shouldReconnect("polling", 4)).toBe(false)
    expect(shouldReconnect("polling", 10)).toBe(false)
  })

  it("returns true for streaming when attempt <5", () => {
    expect(shouldReconnect("streaming", 0)).toBe(true)
    expect(shouldReconnect("streaming", 4)).toBe(true)
  })

  it("returns false for streaming when attempt >=5", () => {
    expect(shouldReconnect("streaming", 5)).toBe(false)
    expect(shouldReconnect("streaming", 10)).toBe(false)
  })

  it("returns true for reconnecting when attempt <5", () => {
    expect(shouldReconnect("reconnecting", 0)).toBe(true)
    expect(shouldReconnect("reconnecting", 3)).toBe(true)
  })

  it("returns false for reconnecting when attempt >=5", () => {
    expect(shouldReconnect("reconnecting", 5)).toBe(false)
    expect(shouldReconnect("reconnecting", 100)).toBe(false)
  })

  it("boundary: attempt 4 is last allowed", () => {
    expect(shouldReconnect("streaming", 4)).toBe(true)
    expect(shouldReconnect("streaming", 5)).toBe(false)
  })
})
