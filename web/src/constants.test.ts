import { describe, it, expect } from "vitest"
import {
  STORAGE_KEYS,
  STREAMING_POLL_INTERVAL_MS,
  DEFAULT_POLL_INTERVALS,
  SSE_CONNECT_TIMEOUT_MS,
  SSE_RECONNECT_BASE_MS,
  SSE_RECONNECT_MAX_MS,
  SSE_HEARTBEAT_TIMEOUT_MS,
  POLL_BACKOFF_BASE_MS,
  POLL_BACKOFF_MAX_MS,
  POLL_BACKOFF_JITTER,
  POLL_MAX_RETRIES,
  QUESTION_POLL_INTERVAL_MS,
  DB_NAME,
  DB_VERSION,
  DB_STORES,
} from "./constants"

describe("STORAGE_KEYS", () => {
  it("está definido y contiene 19 claves", () => {
    expect(STORAGE_KEYS).toBeDefined()
    expect(typeof STORAGE_KEYS).toBe("object")
    expect(Object.keys(STORAGE_KEYS)).toHaveLength(19)
  })

  it("todos los valores son strings con prefijo openher. u opencode.", () => {
    for (const [k, v] of Object.entries(STORAGE_KEYS)) {
      expect(typeof v, `key ${k} should be string`).toBe("string")
      expect(v.startsWith("openher.") || v.startsWith("opencode."), `${k} => ${v} should start with openher. or opencode.`).toBe(true)
    }
  })

  it("SERVER y SERVER_FILE tienen prefijo opencode.remote", () => {
    expect(STORAGE_KEYS.SERVER).toBe("opencode.remote.server")
    expect(STORAGE_KEYS.SERVER_FILE).toBe("opencode.remote.server_file")
  })

  it("claves de servidor/móvil están correctamente namespaced", () => {
    expect(STORAGE_KEYS.RECENT_MODELS).toBe("openher.recentModels")
    expect(STORAGE_KEYS.BLOCKED_MODELS).toBe("openher.blockedModels")
    expect(STORAGE_KEYS.FEATURE_FLAGS).toBe("openher.featureFlags")
  })

  it("no hay valores duplicados", () => {
    const vals = Object.values(STORAGE_KEYS)
    const unique = new Set(vals)
    expect(unique.size).toBe(vals.length)
  })

  it("todas las claves esperadas existen", () => {
    const expected = [
      "SERVER",
      "THEME",
      "FAVORITES",
      "MODEL",
      "AGENT",
      "LANGUAGE",
      "NAVBAR",
      "SERVERS",
    ] as const
    for (const k of expected) {
      expect(STORAGE_KEYS).toHaveProperty(k)
    }
  })
})

describe("numeric constants", () => {
  it("STREAMING_POLL_INTERVAL_MS es 1000", () => {
    expect(STREAMING_POLL_INTERVAL_MS).toBe(1000)
  })

  it("DEFAULT_POLL_INTERVALS tiene 4 modos con valores crecientes", () => {
    expect(DEFAULT_POLL_INTERVALS).toEqual({
      full: 3500,
      saver: 15000,
      ultra: 30000,
      miser: 60000,
    })
    expect(DEFAULT_POLL_INTERVALS.full).toBeLessThan(DEFAULT_POLL_INTERVALS.saver)
    expect(DEFAULT_POLL_INTERVALS.saver).toBeLessThan(DEFAULT_POLL_INTERVALS.ultra)
    expect(DEFAULT_POLL_INTERVALS.ultra).toBeLessThan(DEFAULT_POLL_INTERVALS.miser)
  })

  it("DEFAULT_POLL_INTERVALS valores son numbers positivos", () => {
    for (const v of Object.values(DEFAULT_POLL_INTERVALS)) {
      expect(typeof v).toBe("number")
      expect(v).toBeGreaterThan(0)
    }
  })

  it("SSE timeouts son coherentes", () => {
    expect(SSE_CONNECT_TIMEOUT_MS).toBe(3000)
    expect(SSE_RECONNECT_BASE_MS).toBe(1000)
    expect(SSE_RECONNECT_MAX_MS).toBe(30000)
    expect(SSE_HEARTBEAT_TIMEOUT_MS).toBe(15000)
    expect(SSE_RECONNECT_BASE_MS).toBeLessThan(SSE_RECONNECT_MAX_MS)
    expect(SSE_CONNECT_TIMEOUT_MS).toBeLessThan(SSE_HEARTBEAT_TIMEOUT_MS)
  })

  it("POLL_BACKOFF constants son válidos", () => {
    expect(POLL_BACKOFF_BASE_MS).toBe(1000)
    expect(POLL_BACKOFF_MAX_MS).toBe(60000)
    expect(POLL_BACKOFF_JITTER).toBe(0.3)
    expect(POLL_MAX_RETRIES).toBe(5)
    expect(POLL_BACKOFF_BASE_MS).toBeLessThan(POLL_BACKOFF_MAX_MS)
    expect(POLL_BACKOFF_JITTER).toBeGreaterThan(0)
    expect(POLL_BACKOFF_JITTER).toBeLessThan(1)
  })

  it("QUESTION_POLL_INTERVAL_MS es 15000", () => {
    expect(QUESTION_POLL_INTERVAL_MS).toBe(15000)
  })

  it("DB constants correctos", () => {
    expect(DB_NAME).toBe("openher")
    expect(DB_VERSION).toBe(3)
    expect(typeof DB_VERSION).toBe("number")
    expect(DB_STORES.sessions).toBe("sessions")
    expect(DB_STORES.messages).toBe("messages")
  })

  it("todos los numeric constants son numbers y no NaN", () => {
    const nums = [
      STREAMING_POLL_INTERVAL_MS,
      SSE_CONNECT_TIMEOUT_MS,
      SSE_RECONNECT_BASE_MS,
      SSE_RECONNECT_MAX_MS,
      SSE_HEARTBEAT_TIMEOUT_MS,
      POLL_BACKOFF_BASE_MS,
      POLL_BACKOFF_MAX_MS,
      POLL_BACKOFF_JITTER,
      POLL_MAX_RETRIES,
      QUESTION_POLL_INTERVAL_MS,
      DB_VERSION,
    ]
    for (const n of nums) {
      expect(typeof n).toBe("number")
      expect(Number.isNaN(n)).toBe(false)
    }
  })
})
