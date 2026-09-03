import { describe, it, expect, beforeEach } from "vitest"
import { composerDraftKey, readComposerDraft, writeComposerDraft } from "./composerDraft"

beforeEach(() => {
  localStorage.clear()
})

describe("composerDraftKey", () => {
  it("key por sesión, global si no hay", () => {
    expect(composerDraftKey("abc")).toBe("composer-abc")
    expect(composerDraftKey()).toBe("opencode.remote.composer")
    expect(composerDraftKey(null)).toBe("opencode.remote.composer")
  })
})

describe("read/write draft", () => {
  it("roundtrip por sesión sin cruzarse", () => {
    writeComposerDraft("A", "hola A")
    writeComposerDraft("B", "hola B")
    expect(readComposerDraft("A")).toBe("hola A")
    expect(readComposerDraft("B")).toBe("hola B")
    expect(readComposerDraft("C")).toBe("")
  })
  it("vacío borra la key", () => {
    writeComposerDraft("A", "x")
    writeComposerDraft("A", "")
    expect(localStorage.getItem("composer-A")).toBeNull()
  })
})
