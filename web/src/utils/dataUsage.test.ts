import { describe, it, expect, vi, beforeEach, afterAll } from "vitest"
import { recordDataUsage, getDataUsage, resetDataUsage, formatBytes } from "./dataUsage"

const STORAGE_KEY = "opencode.datausage.v1"
const DAY_MS = 24 * 60 * 60 * 1000

beforeEach(() => {
  if (!vi.isFakeTimers()) vi.useFakeTimers()
  vi.setSystemTime(new Date("2024-01-15T12:00:00Z"))
  // ensure clean storage and flush pendingBatch from previous test
  // resetDataUsage does flush() then removeItem, clearing pendingBatch
  try { resetDataUsage() } catch {}
  localStorage.clear()
  vi.unstubAllGlobals()
  // remove any mocked navigator.connection from previous test
  try { delete (navigator as unknown as Record<string, unknown>).connection } catch {}
})

afterAll(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  localStorage.clear()
  try { resetDataUsage() } catch {}
})

describe("formatBytes", () => {
  it("returns bytes for values < 1024", () => {
    expect(formatBytes(0)).toBe("0 B")
    expect(formatBytes(1)).toBe("1 B")
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(1023)).toBe("1023 B")
  })

  it("formats 1024 as 1.0 KB", () => {
    expect(formatBytes(1024)).toBe("1.0 KB")
  })

  it("formats non-round KB with one decimal when <100", () => {
    expect(formatBytes(1536)).toBe("1.5 KB") // 1.5 KB
    expect(formatBytes(2048)).toBe("2.0 KB")
  })

  it("formats MB (1024*1024)", () => {
    expect(formatBytes(1024 * 1024)).toBe("1.0 MB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB")
  })

  it("formats GB (1024^3)", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1.0 GB")
  })

  it("uses 0 decimals when value >= 100", () => {
    // 150 KB = 150 * 1024
    expect(formatBytes(150 * 1024)).toBe("150 KB")
    expect(formatBytes(150 * 1024 * 1024)).toBe("150 MB")
  })

  it("uses 1 decimal when value < 100", () => {
    expect(formatBytes(99 * 1024)).toBe("99.0 KB")
    expect(formatBytes(10 * 1024 * 1024 + 512 * 1024)).toBe("10.5 MB")
  })

  it("handles large GB values with 0 decimals", () => {
    expect(formatBytes(200 * 1024 * 1024 * 1024)).toBe("200 GB")
  })
})

describe("recordDataUsage - validation", () => {
  it("ignores 0, negative, NaN, Infinity", () => {
    recordDataUsage(0, "up")
    recordDataUsage(-100, "down")
    recordDataUsage(NaN, "up")
    recordDataUsage(Infinity, "down")
    recordDataUsage(-Infinity, "up")
    const s = getDataUsage()
    expect(s.day.total).toBe(0)
    expect(s.day.up).toBe(0)
    expect(s.day.down).toBe(0)
  })

  it("rounds bytes with Math.round", () => {
    recordDataUsage(100.6, "up")
    recordDataUsage(100.4, "down")
    const s = getDataUsage()
    expect(s.day.up).toBe(101)
    expect(s.day.down).toBe(100)
  })

  it("records up and down separately", () => {
    recordDataUsage(500, "up")
    recordDataUsage(300, "down")
    const s = getDataUsage()
    expect(s.day.up).toBe(500)
    expect(s.day.down).toBe(300)
    expect(s.day.total).toBe(800)
  })

  it("detects mobile network from cellular", () => {
    vi.stubGlobal("navigator", { connection: { type: "cellular" } } as unknown as Navigator)
    recordDataUsage(1000, "up")
    const s = getDataUsage()
    expect(s.day.byNet.mobile.up).toBe(1000)
  })

  it("detects mobile from 4g/5g variants", () => {
    vi.stubGlobal("navigator", { connection: { type: "4g" } } as unknown as Navigator)
    recordDataUsage(200, "up")
    let s = getDataUsage()
    expect(s.day.byNet.mobile.up).toBe(200)
    // cleanup and test 5g
    vi.unstubAllGlobals()
    try { delete (navigator as unknown as Record<string, unknown>).connection } catch {}
    localStorage.clear()
    // need to flush pending before next record, getDataUsage already flushed
    vi.stubGlobal("navigator", { connection: { type: "5G" } } as unknown as Navigator)
    recordDataUsage(300, "down")
    s = getDataUsage()
    expect(s.day.byNet.mobile.down).toBe(300)
  })

  it("detects wifi from wifi and ethernet", () => {
    vi.stubGlobal("navigator", { connection: { type: "wifi" } } as unknown as Navigator)
    recordDataUsage(400, "up")
    let s = getDataUsage()
    expect(s.day.byNet.wifi.up).toBe(400)
    vi.unstubAllGlobals()
    try { delete (navigator as unknown as Record<string, unknown>).connection } catch {}
    localStorage.clear()
    // reset pending already flushed via getDataUsage, need to clear again for second part
    // getDataUsage flushed, pending empty. Manually clear storage to isolate
    vi.stubGlobal("navigator", { connection: { type: "ethernet" } } as unknown as Navigator)
    recordDataUsage(500, "down")
    s = getDataUsage()
    expect(s.day.byNet.wifi.down).toBe(500)
  })

  it("falls back to other for unknown type", () => {
    vi.stubGlobal("navigator", { connection: { type: "bluetooth" } } as unknown as Navigator)
    recordDataUsage(123, "up")
    const s = getDataUsage()
    expect(s.day.byNet.other.up).toBe(123)
  })

  it("falls back to other when connection missing", () => {
    vi.stubGlobal("navigator", {} as Navigator)
    recordDataUsage(321, "down")
    const s = getDataUsage()
    expect(s.day.byNet.other.down).toBe(321)
  })

  it("falls back to other when navigator access throws", () => {
    // define navigator getter that throws - simulate catch path
    const orig = (globalThis as unknown as { navigator: unknown }).navigator
    Object.defineProperty(globalThis, "navigator", {
      get() { throw new Error("boom") },
      configurable: true,
    })
    recordDataUsage(777, "up")
    const s = getDataUsage()
    expect(s.day.byNet.other.up).toBe(777)
    // restore
    Object.defineProperty(globalThis, "navigator", { value: orig, writable: true, configurable: true })
  })
})

describe("getDataUsage - aggregation and time ranges", () => {
  it("returns zeros when storage empty", () => {
    const s = getDataUsage()
    expect(s.day).toEqual({ up: 0, down: 0, total: 0, byNet: { mobile: { up: 0, down: 0, total: 0 }, wifi: { up: 0, down: 0, total: 0 }, other: { up: 0, down: 0, total: 0 } } })
    expect(s.week.total).toBe(0)
    expect(s.month.total).toBe(0)
  })

  it("aggregates day/week/month correctly", () => {
    const now = Date.now()
    // entry 12h ago -> inside day/week/month
    const recent = { ts: now - 12 * 60 * 60 * 1000, bytes: 1000, dir: "up" as const, net: "wifi" as const }
    // entry 3 days ago -> outside day, inside week/month
    const threeDays = { ts: now - 3 * DAY_MS, bytes: 2000, dir: "down" as const, net: "mobile" as const }
    // entry 10 days ago -> outside week, inside month
    const tenDays = { ts: now - 10 * DAY_MS, bytes: 3000, dir: "up" as const, net: "other" as const }
    localStorage.setItem(STORAGE_KEY, JSON.stringify([recent, threeDays, tenDays]))
    const s = getDataUsage()
    expect(s.day.total).toBe(1000)
    expect(s.week.total).toBe(3000) // recent + threeDays
    expect(s.month.total).toBe(6000)
    expect(s.day.up).toBe(1000)
    expect(s.week.down).toBe(2000)
  })

  it("computes byNet totals per period", () => {
    const now = Date.now()
    const entries = [
      { ts: now - 1000, bytes: 100, dir: "up" as const, net: "wifi" as const },
      { ts: now - 2000, bytes: 200, dir: "down" as const, net: "wifi" as const },
      { ts: now - 3000, bytes: 300, dir: "up" as const, net: "mobile" as const },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    const s = getDataUsage()
    expect(s.day.byNet.wifi.up).toBe(100)
    expect(s.day.byNet.wifi.down).toBe(200)
    expect(s.day.byNet.wifi.total).toBe(300)
    expect(s.day.byNet.mobile.up).toBe(300)
    expect(s.day.byNet.mobile.total).toBe(300)
    expect(s.day.byNet.other.total).toBe(0)
  })

  it("includes pending batch via flush on getDataUsage", () => {
    recordDataUsage(999, "up")
    // before getDataUsage, storage still empty (pending not flushed yet unless timer)
    const rawBefore = localStorage.getItem(STORAGE_KEY)
    // pendingBatch hasn't been flushed to storage yet via timer; but getDataUsage will flush
    const s = getDataUsage()
    expect(s.day.up).toBe(999)
    const rawAfter = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(rawAfter.length).toBe(1)
    expect(rawAfter[0].bytes).toBe(999)
    // ensure rawBefore was null or didn't contain the entry (if timer not yet fired)
    // we don't assert rawBefore strictly because first test may have created interval, but with our stub, pending should not be in storage until flush
    expect(s.day.total).toBe(999)
  })

  it("flushes pending via timer interval", () => {
    recordDataUsage(555, "down")
    // advance 3s to trigger interval flush
    vi.advanceTimersByTime(3000)
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(raw.some((e: { bytes: number }) => e.bytes === 555)).toBe(true)
  })

  it("normalizes unknown net to other", () => {
    const now = Date.now()
    const entries = [{ ts: now - 1000, bytes: 400, dir: "up" as const, net: "satellite" as unknown as "wifi" }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    const s = getDataUsage()
    expect(s.day.byNet.other.up).toBe(400)
    expect(s.day.byNet.wifi.up).toBe(0)
  })
})

describe("persistence and edge cases", () => {
  it("handles invalid JSON gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "not-json{{{")
    const s = getDataUsage()
    expect(s.day.total).toBe(0)
  })

  it("handles non-array JSON", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ foo: "bar" }))
    const s = getDataUsage()
    expect(s.day.total).toBe(0)
  })

  it("filters entries without ts/bytes", () => {
    const now = Date.now()
    const entries = [
      { ts: now, bytes: 100, dir: "up", net: "wifi" },
      { ts: "bad", bytes: 100, dir: "up", net: "wifi" },
      { ts: now, bytes: "bad", dir: "up", net: "wifi" },
      null,
      { ts: now, bytes: 200, dir: "down", net: "mobile" },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    const s = getDataUsage()
    expect(s.day.total).toBe(300)
  })

  it("prunes entries older than 31 days on read", () => {
    const now = Date.now()
    const oldTs = now - 32 * DAY_MS
    const recentTs = now - 1000
    const entries = [
      { ts: oldTs, bytes: 9999, dir: "up", net: "wifi" },
      { ts: recentTs, bytes: 111, dir: "up", net: "wifi" },
    ]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    const s = getDataUsage()
    expect(s.month.total).toBe(111)
    expect(s.month.up).toBe(111)
  })

  it("prunes and slices to 5000 on write", () => {
    const now = Date.now()
    const many = Array.from({ length: 5002 }, (_, i) => ({ ts: now - i * 1000, bytes: 1, dir: "up" as const, net: "wifi" as const }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(many))
    // trigger write via record + flush
    recordDataUsage(10, "up")
    vi.advanceTimersByTime(3000)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.length).toBeLessThanOrEqual(5000)
    // the stored should contain the newest 5000 (slice(-5000) behavior)
    expect(stored.length).toBe(5000)
  })

  it("resetDataUsage clears storage", () => {
    recordDataUsage(123, "up")
    vi.advanceTimersByTime(3000)
    expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull()
    resetDataUsage()
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it("handles localStorage errors without throwing", () => {
    const getSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("quota") })
    expect(() => getDataUsage()).not.toThrow()
    getSpy.mockRestore()

    const setSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full") })
    // record will try to write on flush, should not throw
    recordDataUsage(100, "up")
    expect(() => vi.advanceTimersByTime(3000)).not.toThrow()
    expect(() => getDataUsage()).not.toThrow()
    setSpy.mockRestore()

    const removeSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => { throw new Error("fail") })
    expect(() => resetDataUsage()).not.toThrow()
    removeSpy.mockRestore()
  })

  it("ignores entries with future edge: cutoff is 31 days, future entries kept", () => {
    const now = Date.now()
    const future = now + 1000
    localStorage.setItem(STORAGE_KEY, JSON.stringify([{ ts: future, bytes: 500, dir: "up", net: "wifi" }]))
    const s = getDataUsage()
    expect(s.day.total).toBe(500)
  })
})
