import { describe, it, expect } from "vitest"
import { STORAGE_KEYS } from "./constants"

describe("STORAGE_KEYS", () => {
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
})
