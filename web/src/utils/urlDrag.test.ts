import { describe, it, expect } from "vitest"
import { extractUrlFromDataTransfer, isInternalPayload } from "./urlDrag"

function dt(data: Record<string, string>): DataTransfer {
  return { getData: (t: string) => data[t] ?? "" } as DataTransfer
}

describe("isInternalPayload", () => {
  it("marca payloads internos de DnD", () => {
    for (const p of [
      "panel:0:ses_0877c9a4fffeEDvdcC9aghYVhB",
      "session:xyz",
      "kind:terminal",
      "plugin:canvas",
      "plugin:external:m3e-canvas",
      "__kanban__",
      "__stats__",
      "terminal:abc",
      "terminal-tab:a:b",
      "editor:/x/y.ts",
      "tab:2",
    ]) {
      expect(isInternalPayload(p)).toBe(true)
    }
  })

  it("no marca URLs ni archivos", () => {
    expect(isInternalPayload("https://example.com/a")).toBe(false)
    expect(isInternalPayload("example.com/docs")).toBe(false)
    expect(isInternalPayload("C:\\Users\\a\\f.md")).toBe(false)
    expect(isInternalPayload("src/a.ts")).toBe(false)
  })
})

describe("extractUrlFromDataTransfer", () => {
  it("ignora payloads internos en text/plain (no abren browser al splitear)", () => {
    expect(extractUrlFromDataTransfer(dt({ "text/plain": "panel:0:ses_0877c9a4fffeEDvdcC9aghYVhB" }))).toBeNull()
    expect(
      extractUrlFromDataTransfer(dt({ "text/plain": "plugin:canvas", "application/x-opencode-path": "plugin:canvas" })),
    ).toBeNull()
    expect(extractUrlFromDataTransfer(dt({ "text/plain": "session:xyz" }))).toBeNull()
    expect(extractUrlFromDataTransfer(dt({ "text/plain": "kind:terminal" }))).toBeNull()
    expect(extractUrlFromDataTransfer(dt({ "text/plain": "__kanban__" }))).toBeNull()
  })

  it("sigue extrayendo URLs reales", () => {
    expect(extractUrlFromDataTransfer(dt({ "text/plain": "https://example.com/a" }))).toBe("https://example.com/a")
    expect(extractUrlFromDataTransfer(dt({ "text/uri-list": "https://example.com\r\n" }))).toBe("https://example.com")
    expect(extractUrlFromDataTransfer(dt({ "text/plain": "example.com/docs" }))).toBe("https://example.com/docs")
  })
})
