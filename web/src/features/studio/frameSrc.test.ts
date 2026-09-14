import { describe, it, expect } from "vitest"
import { frameSrc } from "./frameSrc"

describe("Studio frameSrc", () => {
  it("vacío devuelve about:blank", () => {
    expect(frameSrc("", false)).toBe("about:blank")
  })

  it("ruta relativa same-origin (/shell/preview) se usa tal cual, incluso en inspección", () => {
    expect(frameSrc("/shell/preview/p1/index.html", false)).toBe("/shell/preview/p1/index.html")
    expect(frameSrc("/shell/preview/p1/index.html", true)).toBe("/shell/preview/p1/index.html")
  })

  it("dev server local directo en modo preview", () => {
    expect(frameSrc("http://127.0.0.1:5173/", false)).toBe("http://127.0.0.1:5173/")
    expect(frameSrc("localhost:5173", false)).toBe("localhost:5173")
  })

  it("dev server local por el proxy en modo inspección (same-origin)", () => {
    const expected = `/shell/proxy?url=${encodeURIComponent("http://127.0.0.1:5173/")}`
    expect(frameSrc("http://127.0.0.1:5173/", true)).toBe(expected)
  })

  it("remoto siempre por el proxy", () => {
    const expected = `/shell/proxy?url=${encodeURIComponent("https://example.com/app")}`
    expect(frameSrc("https://example.com/app", false)).toBe(expected)
  })

  it("URLs protocol-relative (//host y /\\host) van por el proxy, no directo", () => {
    expect(frameSrc("//evil.example/x", false)).toBe(`/shell/proxy?url=${encodeURIComponent("//evil.example/x")}`)
    expect(frameSrc("/\\evil.example/x", false)).toBe(`/shell/proxy?url=${encodeURIComponent("/\\evil.example/x")}`)
  })
})
