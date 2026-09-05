import { describe, it, expect, beforeEach } from "vitest"
import { CHAT_NOTES_MAX, chatNotesKey, readChatNotes, writeChatNotes } from "./chatNotes"

beforeEach(() => {
  localStorage.clear()
})

describe("chatNotesKey", () => {
  it("key por sesión, global si no hay", () => {
    expect(chatNotesKey("abc")).toBe("openher.chatNotes.abc")
    expect(chatNotesKey()).toBe("openher.chatNotes.global")
    expect(chatNotesKey(null)).toBe("openher.chatNotes.global")
  })
})

describe("read/write notes", () => {
  it("roundtrip por sesión sin cruzarse", () => {
    writeChatNotes("A", "nota A")
    writeChatNotes("B", "nota B")
    expect(readChatNotes("A")).toBe("nota A")
    expect(readChatNotes("B")).toBe("nota B")
    expect(readChatNotes("C")).toBe("")
  })
  it("vacío borra la key", () => {
    writeChatNotes("A", "x")
    writeChatNotes("A", "")
    expect(localStorage.getItem("openher.chatNotes.A")).toBeNull()
  })
  it("trunca al tope para acotar RAM/storage", () => {
    writeChatNotes("A", "x".repeat(CHAT_NOTES_MAX + 500))
    expect(readChatNotes("A").length).toBe(CHAT_NOTES_MAX)
  })
})
