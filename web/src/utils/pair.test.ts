import { describe, it, expect, vi, beforeEach } from "vitest"
import { parsePairPayload } from "./pair"

describe("parsePairPayload", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns null for empty string", () => {
    expect(parsePairPayload("")).toBeNull()
  })

  it("returns null for whitespace only", () => {
    expect(parsePairPayload("   \n\t")).toBeNull()
  })

  it("returns null for nullish input coerced", () => {
    expect(parsePairPayload(null as unknown as string)).toBeNull()
    expect(parsePairPayload(undefined as unknown as string)).toBeNull()
  })

  it("parses JSON with host and port", () => {
    const raw = JSON.stringify({ host: "192.168.1.10", port: 3000, username: "admin", password: "secret" })
    expect(parsePairPayload(raw)).toEqual({
      host: "192.168.1.10",
      port: 3000,
      username: "admin",
      password: "secret",
    })
  })

  it("parses JSON with hostname alias", () => {
    const raw = JSON.stringify({ hostname: "10.0.0.1", port: 8080 })
    expect(parsePairPayload(raw)).toEqual({
      host: "10.0.0.1",
      port: 8080,
      username: "opencode",
      password: "",
    })
  })

  it("uses default port 4096 when port missing in JSON", () => {
    const raw = JSON.stringify({ host: "example.com" })
    const result = parsePairPayload(raw)!
    expect(result.port).toBe(4096)
    expect(result.host).toBe("example.com")
  })

  it("uses default username opencode when missing", () => {
    const raw = JSON.stringify({ host: "example.com", port: 5000 })
    expect(parsePairPayload(raw)!.username).toBe("opencode")
  })

  it("uses empty password when missing", () => {
    const raw = JSON.stringify({ host: "example.com", port: 5000 })
    expect(parsePairPayload(raw)!.password).toBe("")
  })

  it("handles user/pass aliases in JSON", () => {
    const raw = JSON.stringify({ host: "example.com", user: "bob", pass: "1234" })
    const result = parsePairPayload(raw)!
    expect(result.username).toBe("bob")
    expect(result.password).toBe("1234")
  })

  it("parses JSON url field via parseUrl", () => {
    const raw = JSON.stringify({ url: "http://myhost:4000?username=alice&password=xyz" })
    expect(parsePairPayload(raw)).toEqual({
      host: "myhost",
      port: 4000,
      username: "alice",
      password: "xyz",
    })
  })

  it("parses JSON uri alias", () => {
    const raw = JSON.stringify({ uri: "myhost:5000" })
    const result = parsePairPayload(raw)!
    expect(result.host).toBe("myhost")
    expect(result.port).toBe(5000)
  })

  it("overrides url port with explicit port field", () => {
    const raw = JSON.stringify({ url: "http://myhost:4000", port: 9000 })
    expect(parsePairPayload(raw)!.port).toBe(9000)
  })

  it("overrides url username/password with explicit fields", () => {
    const raw = JSON.stringify({ url: "http://myhost:4000?username=alice&password=xyz", username: "bob", password: "override" })
    const result = parsePairPayload(raw)!
    expect(result.username).toBe("bob")
    expect(result.password).toBe("override")
  })

  it("falls back to parseUrl for plain host:port text", () => {
    expect(parsePairPayload("192.168.0.5:3000")).toEqual({
      host: "192.168.0.5",
      port: 3000,
      username: "opencode",
      password: "",
    })
  })

  it("parses URL with credentials user:pass@host:port", () => {
    const result = parsePairPayload("http://bob:secret@myhost:8080")!
    expect(result.host).toBe("myhost")
    expect(result.port).toBe(8080)
    expect(result.username).toBe("bob")
    expect(result.password).toBe("secret")
  })

  it("parses URL with encoded username/password", () => {
    const result = parsePairPayload("http://bob%40mail:se%20cret@myhost:8080")!
    expect(result.username).toBe("bob@mail")
    expect(result.password).toBe("se cret")
  })

  it("parses URL with query params username/password", () => {
    const result = parsePairPayload("http://myhost:4000?username=alice&password=xyz")!
    expect(result.username).toBe("alice")
    expect(result.password).toBe("xyz")
  })

  it("parses query param aliases user/pass", () => {
    const result = parsePairPayload("http://myhost:4000?user=alice&pass=xyz")!
    expect(result.username).toBe("alice")
    expect(result.password).toBe("xyz")
  })

  it("adds http:// when scheme missing", () => {
    const result = parsePairPayload("myhost:3000")!
    expect(result.host).toBe("myhost")
    expect(result.port).toBe(3000)
  })

  it("defaults port to 4096 when not specified in URL", () => {
    const result = parsePairPayload("http://myhost")!
    expect(result.port).toBe(4096)
  })

  it("handles invalid port string defaults to 4096", () => {
    const raw = JSON.stringify({ host: "myhost", port: "not-a-number" })
    expect(parsePairPayload(raw)!.port).toBe(4096)
  })

  it("handles port 0 defaults to 4096", () => {
    const raw = JSON.stringify({ host: "myhost", port: 0 })
    expect(parsePairPayload(raw)!.port).toBe(4096)
  })

  it("handles negative port defaults to 4096", () => {
    const raw = JSON.stringify({ host: "myhost", port: -100 })
    expect(parsePairPayload(raw)!.port).toBe(4096)
  })

  it("handles Infinity port defaults to 4096", () => {
    const raw = JSON.stringify({ host: "myhost", port: Infinity })
    expect(parsePairPayload(raw)!.port).toBe(4096)
  })

  it("returns null for invalid URL", () => {
    // A string that is not valid URL even after adding http://
    // URL constructor throws for invalid; but our parseUrl catches
    expect(parsePairPayload("http://")).toBeNull()
  })

  it("returns null for JSON without host or url", () => {
    const raw = JSON.stringify({ foo: "bar" })
    // it will try parseUrl on the raw JSON string which is not a valid URL, returns null
    expect(parsePairPayload(raw)).toBeNull()
  })

  it("trims whitespace before parsing", () => {
    const raw = JSON.stringify({ host: "myhost", port: 3000 })
    expect(parsePairPayload(`  ${raw}  `)).toEqual({
      host: "myhost",
      port: 3000,
      username: "opencode",
      password: "",
    })
  })

  it("handles numeric host via String conversion", () => {
    const raw = JSON.stringify({ host: 12345, port: 3000 })
    expect(parsePairPayload(raw)!.host).toBe("12345")
  })

  it("handles JSON url that is not parseable returns null", () => {
    const raw = JSON.stringify({ url: "http://" })
    expect(parsePairPayload(raw)).toBeNull()
  })
})
