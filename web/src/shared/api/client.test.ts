import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  toBase64,
  authHeader,
  baseUrl,
  normalizeSlashes,
  toServerRelative,
  withDirectory,
  withLocationDirectory,
  responseDetail,
  normalizeHeaders,
  serializedSize,
  arrayBufferToBase64,
  fetchFileBytes,
} from "./client"
import { Capacitor, CapacitorHttp } from "@capacitor/core"

// Mock capacitor
vi.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: vi.fn(() => false) },
  CapacitorHttp: { request: vi.fn() },
}))

const mockedCapacitor = Capacitor as unknown as { isNativePlatform: ReturnType<typeof vi.fn> }
const mockedHttp = CapacitorHttp as unknown as { request: ReturnType<typeof vi.fn> }

describe("toBase64", () => {
  it("encodes ascii", () => {
    expect(toBase64("hello")).toBe(btoa("hello"))
    expect(toBase64("hello")).toBe("aGVsbG8=")
  })
  it("encodes empty string", () => {
    expect(toBase64("")).toBe("")
  })
  it("encodes unicode via utf8 bytes", () => {
    // ✓ = E2 9C 93 => 4pyT
    expect(toBase64("\u2713")).toBe("4pyT")
    // compare with Buffer for correctness if available
    const expected = typeof Buffer !== "undefined" ? Buffer.from("\u2713", "utf8").toString("base64") : "4pyT"
    expect(toBase64("\u2713")).toBe(expected)
  })
  it("encodes string with colon", () => {
    expect(toBase64("user:pass")).toBe(btoa("user:pass"))
  })
  it("encodes high unicode emoji", () => {
    const input = "\u{1F600}"
    const bytes = new TextEncoder().encode(input)
    const binary = Array.from(bytes).map((b) => String.fromCodePoint(b)).join("")
    expect(toBase64(input)).toBe(btoa(binary))
  })
})

describe("authHeader", () => {
  it("returns Basic header", () => {
    expect(authHeader({ username: "user", password: "pass" })).toBe(`Basic ${toBase64("user:pass")}`)
  })
  it("handles empty password", () => {
    expect(authHeader({ username: "admin", password: "" })).toBe(`Basic ${toBase64("admin:")}`)
  })
  it("handles special chars", () => {
    expect(authHeader({ username: "a:b", password: "c:d" })).toBe(`Basic ${toBase64("a:b:c:d")}`)
  })
})

describe("baseUrl", () => {
  it("defaults to http when no scheme", () => {
    expect(baseUrl({ host: "example.com", port: 3000 })).toBe("http://example.com:3000")
  })
  it("preserves http scheme", () => {
    expect(baseUrl({ host: "http://example.com", port: 4000 })).toBe("http://example.com:4000")
  })
  it("preserves https scheme", () => {
    expect(baseUrl({ host: "https://example.com", port: 443 })).toBe("https://example.com:443")
  })
  it("trims host whitespace", () => {
    expect(baseUrl({ host: "  example.com  ", port: 8080 })).toBe("http://example.com:8080")
    expect(baseUrl({ host: "  https://example.com  ", port: 8080 })).toBe("https://example.com:8080")
  })
  it("wraps IPv6 without brackets", () => {
    expect(baseUrl({ host: "2001:db8::1", port: 3000 })).toBe("http://[2001:db8::1]:3000")
  })
  it("does not double wrap already bracketed IPv6", () => {
    expect(baseUrl({ host: "[2001:db8::1]", port: 3000 })).toBe("http://[2001:db8::1]:3000")
  })
  it("wraps IPv6 with https scheme", () => {
    expect(baseUrl({ host: "https://2001:db8::1", port: 443 })).toBe("https://[2001:db8::1]:443")
  })
  it("handles IPv6 with http scheme and trimming", () => {
    expect(baseUrl({ host: "  http://2001:db8::1  ", port: 80 })).toBe("http://[2001:db8::1]:80")
  })
  it("does not bracket hostname with single colon port-like that is already handled via port param", () => {
    // host = "localhost" should not get brackets
    expect(baseUrl({ host: "localhost", port: 3000 })).toBe("http://localhost:3000")
  })
})

describe("normalizeSlashes", () => {
  it("converts backslashes", () => {
    expect(normalizeSlashes("a\\b\\c")).toBe("a/b/c")
  })
  it("leaves forward slashes untouched", () => {
    expect(normalizeSlashes("a/b/c")).toBe("a/b/c")
  })
  it("handles mixed slashes", () => {
    expect(normalizeSlashes("a\\b/c\\d")).toBe("a/b/c/d")
  })
  it("handles empty string", () => {
    expect(normalizeSlashes("")).toBe("")
  })
})

describe("toServerRelative", () => {
  it("returns normalized path when no directory", () => {
    expect(toServerRelative("a\\b\\c")).toBe("a/b/c")
  })
  it("strips directory prefix", () => {
    expect(toServerRelative("/home/user/project/src/file.ts", "/home/user/project")).toBe("src/file.ts")
  })
  it("is case-insensitive", () => {
    expect(toServerRelative("/HOME/USER/file.txt", "/home/user")).toBe("file.txt")
  })
  it("handles trailing slash in directory", () => {
    expect(toServerRelative("/home/user/project/src/file.ts", "/home/user/project/")).toBe("src/file.ts")
  })
  it("returns norm when rel is empty (path == directory)", () => {
    expect(toServerRelative("/home/user", "/home/user")).toBe("/home/user")
  })
  it("returns norm when directory does not match", () => {
    expect(toServerRelative("/other/path/file.ts", "/home/user")).toBe("/other/path/file.ts")
  })
  it("normalizes backslashes before comparison", () => {
    expect(toServerRelative("C:\\home\\user\\file.txt", "C:\\home\\user")).toBe("file.txt")
  })
  it("handles directory with backslashes", () => {
    expect(toServerRelative("C:/home/user/project/file.ts", "C:\\home\\user\\project\\")).toBe("file.ts")
  })
})

describe("withDirectory", () => {
  it("returns path unchanged when no directory", () => {
    expect(withDirectory("/api/file", undefined)).toBe("/api/file")
    expect(withDirectory("/api/file", "")).toBe("/api/file")
  })
  it("appends ?directory when no query", () => {
    expect(withDirectory("/api/file", "/home/user")).toBe("/api/file?directory=%2Fhome%2Fuser")
  })
  it("appends &directory when query exists", () => {
    expect(withDirectory("/api/file?foo=1", "/home/user")).toBe("/api/file?foo=1&directory=%2Fhome%2Fuser")
  })
  it("normalizes slashes before encoding", () => {
    expect(withDirectory("/api/file", "C:\\home\\user")).toBe("/api/file?directory=C%3A%2Fhome%2Fuser")
  })
})

describe("withLocationDirectory", () => {
  it("returns path unchanged when no directory", () => {
    expect(withLocationDirectory("/api/file")).toBe("/api/file")
  })
  it("appends ?location[directory] when no query", () => {
    expect(withLocationDirectory("/api/file", "/home/user")).toBe("/api/file?location[directory]=%2Fhome%2Fuser")
  })
  it("appends & when query exists", () => {
    expect(withLocationDirectory("/api/file?foo=1", "/home")).toBe("/api/file?foo=1&location[directory]=%2Fhome")
  })
  it("normalizes slashes", () => {
    expect(withLocationDirectory("/api", "C:\\Users\\bob")).toBe("/api?location[directory]=C%3A%2FUsers%2Fbob")
  })
})

describe("responseDetail", () => {
  it("returns null for falsy", () => {
    expect(responseDetail(null)).toBeNull()
    expect(responseDetail(undefined)).toBeNull()
    expect(responseDetail("")).toBeNull()
    expect(responseDetail(0 as unknown as string)).toBeNull()
  })
  it("returns plain string body", () => {
    expect(responseDetail("plain error")).toBe("plain error")
  })
  it("parses JSON string with message", () => {
    expect(responseDetail(JSON.stringify({ message: "oops" }))).toBe("oops")
  })
  it("parses JSON string with data.message", () => {
    expect(responseDetail(JSON.stringify({ data: { message: "nested" } }))).toBe("nested")
  })
  it("prefers data.message over message", () => {
    expect(responseDetail({ data: { message: "nested" }, message: "top" })).toBe("nested")
  })
  it("falls back to message when no data.message", () => {
    expect(responseDetail({ message: "top" })).toBe("top")
  })
  it("stringifies object without message", () => {
    const obj = { foo: 123 }
    expect(responseDetail(obj)).toBe(JSON.stringify(obj))
  })
  it("handles invalid JSON string gracefully", () => {
    expect(responseDetail("{invalid json")).toBe("{invalid json")
  })
  it("handles non-object primitive number", () => {
    expect(responseDetail(42 as unknown as string)).toBe("42")
  })
  it("json string that parses to nested data.message with precedence", () => {
    const body = JSON.stringify({ data: { message: "a" }, message: "b" })
    expect(responseDetail(body)).toBe("a")
  })
})

describe("normalizeHeaders", () => {
  it("returns empty for undefined", () => {
    expect(normalizeHeaders(undefined)).toEqual({})
  })
  it("lowercases keys", () => {
    expect(normalizeHeaders({ "Content-Type": "json" })).toEqual({ "content-type": "json" })
  })
  it("joins array values with comma", () => {
    expect(normalizeHeaders({ "X-Custom": ["a", "b"] as unknown as string })).toEqual({ "x-custom": "a, b" })
  })
  it("stringifies non-array values", () => {
    expect(normalizeHeaders({ "X-Num": 123 as unknown as string })).toEqual({ "x-num": "123" })
  })
  it("handles multiple headers", () => {
    expect(normalizeHeaders({ A: "1", B: ["2", "3"] as unknown as string })).toEqual({ a: "1", b: "2, 3" })
  })
  it("returns empty for empty object", () => {
    expect(normalizeHeaders({})).toEqual({})
  })
})

describe("serializedSize", () => {
  it("returns 0 for undefined", () => {
    expect(serializedSize(undefined)).toBe(0)
  })
  it("returns 0 for null", () => {
    expect(serializedSize(null)).toBe(0)
  })
  it("returns number value directly", () => {
    expect(serializedSize(42)).toBe(8)
    expect(serializedSize(0)).toBe(8)
  })
  it("returns 4 for boolean", () => {
    expect(serializedSize(true)).toBe(4)
    expect(serializedSize(false)).toBe(4)
  })
  it("returns length for string", () => {
    expect(serializedSize("hello")).toBe(5)
    expect(serializedSize("")).toBe(0)
  })
  it("returns 0 for object", () => {
    expect(serializedSize({ a: 1 })).toBe(7)
    expect(serializedSize([])).toBe(2)
  })
})

describe("arrayBufferToBase64", () => {
  it("encodes empty array", () => {
    expect(arrayBufferToBase64(new Uint8Array([]))).toBe("")
  })
  it("encodes hello bytes to base64", () => {
    const bytes = new TextEncoder().encode("hello")
    expect(arrayBufferToBase64(bytes)).toBe("aGVsbG8=")
  })
  it("roundtrips via atob", () => {
    const original = "test data 123"
    const bytes = new TextEncoder().encode(original)
    const b64 = arrayBufferToBase64(bytes)
    expect(atob(b64)).toBe(original)
  })
  it("handles large array > 0x8000 chunk", () => {
    const len = 0x8001
    const bytes = new Uint8Array(len)
    bytes.fill(65) // 'A'
    const b64 = arrayBufferToBase64(bytes)
    // decode check length
    const decoded = atob(b64)
    expect(decoded.length).toBe(len)
    expect(decoded[0]).toBe("A")
    expect(decoded[len - 1]).toBe("A")
  })
  it("matches btoa of binary string for arbitrary bytes", () => {
    const bytes = new Uint8Array([0, 1, 2, 255, 254, 128])
    let binary = ""
    for (const b of bytes) binary += String.fromCharCode(b)
    expect(arrayBufferToBase64(bytes)).toBe(btoa(binary))
  })
})

describe("fetchFileBytes", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // reset capacitor mocks
    vi.mocked(mockedCapacitor.isNativePlatform).mockReturnValue(false)
    vi.mocked(mockedHttp.request).mockReset()
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("fetches via web fetch when not native", async () => {
    vi.mocked(mockedCapacitor.isNativePlatform).mockReturnValue(false)
    const bytes = new TextEncoder().encode("web bytes")
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      arrayBuffer: () => Promise.resolve(ab),
    } as unknown as Response)
    vi.stubGlobal("fetch", mockFetch)

    const config = { host: "localhost", port: 3000, username: "", password: "" }
    const result = await fetchFileBytes(config as any, "http://localhost:3000/file")
    expect(result).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(result)).toBe("web bytes")
    expect(mockFetch).toHaveBeenCalledOnce()
  })

  it("fetches via CapacitorHttp when native and includes auth", async () => {
    vi.mocked(mockedCapacitor.isNativePlatform).mockReturnValue(true)
    // "hello" => aGVsbG8=, data url prefix mimics blob response
    const b64 = btoa("hello")
    vi.mocked(mockedHttp.request).mockResolvedValue({
      status: 200,
      data: `data:application/octet-stream;base64,${b64}`,
    })
    const config = { host: "localhost", port: 3000, username: "user", password: "pass" }
    const result = await fetchFileBytes(config as any, "http://localhost:3000/file")
    expect(new TextDecoder().decode(result)).toBe("hello")
    expect(mockedHttp.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: "http://localhost:3000/file",
        method: "GET",
        headers: expect.objectContaining({ Authorization: expect.stringContaining("Basic ") }),
      }),
    )
  })

  it("throws on native HTTP >=400", async () => {
    vi.mocked(mockedCapacitor.isNativePlatform).mockReturnValue(true)
    vi.mocked(mockedHttp.request).mockResolvedValue({ status: 404, data: "" })
    const config = { host: "localhost", port: 3000, username: "", password: "" }
    await expect(fetchFileBytes(config as any, "http://localhost:3000/missing")).rejects.toThrow("HTTP 404")
  })

  it("throws on web fetch not ok", async () => {
    vi.mocked(mockedCapacitor.isNativePlatform).mockReturnValue(false)
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    } as unknown as Response)
    vi.stubGlobal("fetch", mockFetch)
    const config = { host: "localhost", port: 3000, username: "", password: "" }
    await expect(fetchFileBytes(config as any, "http://localhost:3000/file")).rejects.toThrow("HTTP 500")
  })
})
