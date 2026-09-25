import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

const mockIsNativePlatform = vi.fn()
const mockReaddir = vi.fn()
const mockMkdir = vi.fn()
const mockReadFile = vi.fn()
const mockWriteFile = vi.fn()

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: (...args: any[]) => mockIsNativePlatform(...args),
  },
}))

vi.mock("@capacitor/filesystem", () => ({
  Filesystem: {
    readdir: (...args: any[]) => mockReaddir(...args),
    mkdir: (...args: any[]) => mockMkdir(...args),
    readFile: (...args: any[]) => mockReadFile(...args),
    writeFile: (...args: any[]) => mockWriteFile(...args),
  },
  Directory: { Documents: "DOCUMENTS" },
  Encoding: { UTF8: "utf8" },
}))

import { STORAGE_KEYS } from "./constants"
import { restorePersistedConfig, persistConfig, flushSave } from "./persistentStorage"

describe("persistentStorage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockIsNativePlatform.mockReturnValue(false)
    mockReaddir.mockResolvedValue({})
    mockMkdir.mockResolvedValue({})
    mockReadFile.mockResolvedValue({ data: "{}" })
    mockWriteFile.mockResolvedValue(undefined)
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  // restorePersistedConfig
  // -------------------------------------------------------------------------
  describe("restorePersistedConfig", () => {
    it("no hace nada si no es plataforma nativa", async () => {
      mockIsNativePlatform.mockReturnValue(false)
      await restorePersistedConfig()
      expect(mockReadFile).not.toHaveBeenCalled()
    })

    it("restaura claves desde archivo cuando es nativo", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      const payload: Record<string, string> = {
        [STORAGE_KEYS.SERVER]: "https://example.com",
        [STORAGE_KEYS.THEME]: "dark",
      }
      mockReadFile.mockResolvedValue({ data: JSON.stringify(payload) })

      await restorePersistedConfig()

      expect(localStorage.getItem(STORAGE_KEYS.SERVER)).toBe("https://example.com")
      expect(localStorage.getItem(STORAGE_KEYS.THEME)).toBe("dark")
    })

    it("ignora claves no trackeadas en el archivo", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      mockReadFile.mockResolvedValue({
        data: JSON.stringify({ unknownKey: "value", [STORAGE_KEYS.SERVER]: "srv" }),
      })

      await restorePersistedConfig()

      expect(localStorage.getItem("unknownKey")).toBeNull()
      expect(localStorage.getItem(STORAGE_KEYS.SERVER)).toBe("srv")
    })

    it("no falla si Filesystem.readFile lanza", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      mockReadFile.mockRejectedValue(new Error("no file"))

      await expect(restorePersistedConfig()).resolves.toBeUndefined()
    })

    it("no falla si JSON es inválido", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      mockReadFile.mockResolvedValue({ data: "not-json" })

      await expect(restorePersistedConfig()).resolves.toBeUndefined()
    })

    it("maneja result.data no-string via Response.text (mocked Response)", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      const payload = JSON.stringify({ [STORAGE_KEYS.MODEL]: "gpt" })
      const originalResponse = globalThis.Response
      // stub Response to return payload regardless of input
      // @ts-ignore
      globalThis.Response = class {
        constructor(private _body: any) {}
        async text() {
          return payload
        }
      }
      mockReadFile.mockResolvedValue({ data: new Uint8Array([1, 2, 3]) } as any)

      await restorePersistedConfig()

      expect(localStorage.getItem(STORAGE_KEYS.MODEL)).toBe("gpt")

      globalThis.Response = originalResponse
    })

    it("ensureDirectory: intenta readdir y si falla hace mkdir", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      mockReaddir.mockRejectedValue(new Error("no dir"))
      mockReadFile.mockResolvedValue({ data: "{}" })

      await restorePersistedConfig()

      expect(mockReaddir).toHaveBeenCalled()
      expect(mockMkdir).toHaveBeenCalled()
    })

    it("ensureDirectory: no hace mkdir si readdir ok", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      mockReaddir.mockResolvedValue({ files: [] })
      mockReadFile.mockResolvedValue({ data: "{}" })

      await restorePersistedConfig()

      expect(mockReaddir).toHaveBeenCalled()
      expect(mockMkdir).not.toHaveBeenCalled()
    })

    it("no sobrescribe localStorage si valor no existe en archivo", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      localStorage.setItem(STORAGE_KEYS.SERVER, "original")
      mockReadFile.mockResolvedValue({ data: JSON.stringify({}) })

      await restorePersistedConfig()

      expect(localStorage.getItem(STORAGE_KEYS.SERVER)).toBe("original")
    })

    it("tolera payload con null y no crashea", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      mockReadFile.mockResolvedValue({
        data: JSON.stringify({ [STORAGE_KEYS.SERVER]: null }),
      })
      await expect(restorePersistedConfig()).resolves.toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // persistConfig
  // -------------------------------------------------------------------------
  describe("persistConfig", () => {
    it("no hace nada si no es nativo", async () => {
      mockIsNativePlatform.mockReturnValue(false)
      localStorage.setItem(STORAGE_KEYS.SERVER, "val")
      await persistConfig()
      expect(mockWriteFile).not.toHaveBeenCalled()
    })

    it("no escribe si no hay datos en localStorage", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      localStorage.clear()
      await persistConfig()
      expect(mockWriteFile).not.toHaveBeenCalled()
    })

    it("escribe solo claves trackeadas con valor", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      localStorage.setItem(STORAGE_KEYS.SERVER, "srv")
      localStorage.setItem(STORAGE_KEYS.THEME, "light")
      localStorage.setItem("randomKey", "shouldIgnore")

      await persistConfig()

      expect(mockWriteFile).toHaveBeenCalledTimes(1)
      const arg = mockWriteFile.mock.calls[0][0]
      const parsed = JSON.parse(arg.data)
      expect(parsed[STORAGE_KEYS.SERVER]).toBe("srv")
      expect(parsed[STORAGE_KEYS.THEME]).toBe("light")
      expect(parsed["randomKey"]).toBeUndefined()
    })

    it("usa CONFIG_FILE y Directory.Documents", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      localStorage.setItem(STORAGE_KEYS.SERVER, "x")
      await persistConfig()
      const arg = mockWriteFile.mock.calls[0][0]
      expect(arg.path).toBe("opencode-config.json")
      expect(arg.directory).toBe("DOCUMENTS")
      expect(arg.encoding).toBe("utf8")
    })

    it("silencia errores de writeFile", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      localStorage.setItem(STORAGE_KEYS.SERVER, "x")
      mockWriteFile.mockRejectedValue(new Error("disk full"))

      await expect(persistConfig()).resolves.toBeUndefined()
    })
  })

  // -------------------------------------------------------------------------
  // flushSave
  // -------------------------------------------------------------------------
  describe("flushSave", () => {
    it("llama a persistConfig aunque no haya timer activo", async () => {
      mockIsNativePlatform.mockReturnValue(true)
      localStorage.setItem(STORAGE_KEYS.SERVER, "val")
      flushSave()
      await new Promise((r) => setTimeout(r, 20))
      expect(mockWriteFile).toHaveBeenCalled()
    })
  })
})
