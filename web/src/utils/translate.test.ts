import { describe, it, expect, vi, beforeEach } from "vitest"
import { translateToEnglish } from "./translate"

const ENDPOINT = "https://translate.googleapis.com/translate_a/single"

describe("translateToEnglish", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
    vi.restoreAllMocks // will be overridden by stubGlobal, so re-stub fetch
    // re-stub after restore
    fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)
  })

  it("returns original text when empty string", async () => {
    const result = await translateToEnglish("")
    expect(result).toBe("")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("returns original text when whitespace only", async () => {
    const result = await translateToEnglish("   \t\n")
    expect(result).toBe("   \t\n")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("returns original text when single space", async () => {
    const result = await translateToEnglish(" ")
    expect(result).toBe(" ")
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("calls fetch with correct URL and encoded text", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [[["hello", "hola", null, null, 10]]],
    } as Response)

    await translateToEnglish("hola mundo")

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, opts] = fetchMock.mock.calls[0]
    expect(url).toBe(`${ENDPOINT}?client=gtx&sl=es&tl=en&dt=t&q=${encodeURIComponent("hola mundo")}`)
    expect(opts).toHaveProperty("signal")
    expect(opts.signal).toBeInstanceOf(AbortSignal)
  })

  it("encodes special characters in URL", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [[["hello & goodbye", "hola & adiós", null, null, 10]]],
    } as Response)

    await translateToEnglish("hola & adiós")
    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain(encodeURIComponent("hola & adiós"))
  })

  it("returns single translated sentence", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [[["hello", "hola", null, null, 10]]],
    } as Response)

    const result = await translateToEnglish("hola")
    expect(result).toBe("hello")
  })

  it("joins multiple translated sentences", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        [
          ["Hello ", "Hola ", null, null, 10],
          ["world", "mundo", null, null, 10],
        ],
      ],
    } as Response)

    const result = await translateToEnglish("Hola mundo")
    expect(result).toBe("Hello world")
  })

  it("joins three sentences", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        [
          ["One ", "Uno ", null, null, 10],
          ["two ", "dos ", null, null, 10],
          ["three", "tres", null, null, 10],
        ],
      ],
    } as Response)

    const result = await translateToEnglish("Uno dos tres")
    expect(result).toBe("One two three")
  })

  it("skips blocks where block[0] is falsy", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [
        [
          [null, "hola", null, null, 10],
          ["", "mundo", null, null, 10],
          ["hello", "hola", null, null, 10],
        ],
      ],
    } as Response)

    const result = await translateToEnglish("hola")
    expect(result).toBe("hello")
  })

  it("skips non-array blocks", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [[null, "not array", ["valid", "valido", null, null, 10]]],
    } as Response)

    const result = await translateToEnglish("valido")
    expect(result).toBe("valid")
  })

  it("returns original text when data[0] is not array", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [null, null, "es"],
    } as unknown as Response)

    const result = await translateToEnglish("hola")
    expect(result).toBe("hola")
  })

  it("returns original text when data is null", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => null,
    } as unknown as Response)

    const result = await translateToEnglish("hola")
    expect(result).toBe("hola")
  })

  it("returns original text when sentences empty after filtering", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [[[null, "hola", null, null, 10]]],
    } as Response)

    const result = await translateToEnglish("hola")
    expect(result).toBe("hola")
  })

  it("throws when response not ok", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response)

    await expect(translateToEnglish("hola")).rejects.toThrow("Translation failed: 500")
  })

  it("throws with 429 status", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    } as Response)

    await expect(translateToEnglish("hola")).rejects.toThrow("Translation failed: 429")
  })

  it("clears timeout after successful fetch", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout")
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => [[["hello", "hola", null, null, 10]]],
    } as Response)

    await translateToEnglish("hola")
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it("clears timeout even when fetch throws", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout")
    fetchMock.mockRejectedValue(new Error("network fail"))

    await expect(translateToEnglish("hola")).rejects.toThrow("network fail")
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it("clears timeout even when response not ok", async () => {
    const clearSpy = vi.spyOn(globalThis, "clearTimeout")
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response)

    await expect(translateToEnglish("hola")).rejects.toThrow()
    expect(clearSpy).toHaveBeenCalled()
    clearSpy.mockRestore()
  })

  it("aborts after 6000ms timeout", async () => {
    vi.useFakeTimers()
    const abortSpy = vi.spyOn(AbortController.prototype, "abort")
    fetchMock.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          // reject when signal aborts
          abortSpy.mock.calls // ensure spy is set
        }),
    )
    // use a fetch that will reject on abort by listening to signal
    fetchMock.mockImplementation((_url: string, opts: { signal: AbortSignal }) => {
      return new Promise((_, reject) => {
        opts.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")))
      })
    })

    const promise = translateToEnglish("hola")
    vi.advanceTimersByTime(6000)
    expect(abortSpy).toHaveBeenCalled()

    await expect(promise).rejects.toThrow()
    abortSpy.mockRestore()
    vi.useRealTimers()
  })
})
