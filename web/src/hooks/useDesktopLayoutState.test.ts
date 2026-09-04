import { describe, it, expect } from "vitest"
import { pruneBrowserUrls } from "./useDesktopLayoutState"

describe("pruneBrowserUrls", () => {
  it("pasa undefined tal cual", () => {
    expect(pruneBrowserUrls(undefined, new Set(["browser:1"]))).toBeUndefined()
  })
  it("sin huérfanos devuelve la misma referencia", () => {
    const urls = { "browser:1": "https://a.com" }
    expect(pruneBrowserUrls(urls, ["browser:1"])).toBe(urls)
  })
  it("elimina bids cerrados y conserva vivos (Set y array)", () => {
    const urls = { "browser:1": "https://a.com", "browser:2": "https://b.com", "browser:3": "https://c.com" }
    expect(pruneBrowserUrls(urls, new Set(["browser:1", "browser:3"]))).toEqual({
      "browser:1": "https://a.com",
      "browser:3": "https://c.com",
    })
    expect(pruneBrowserUrls(urls, ["browser:2"])).toEqual({ "browser:2": "https://b.com" })
    expect(pruneBrowserUrls(urls, [])).toEqual({})
  })
})
