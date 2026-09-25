import { describe, it, expect, vi, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"

vi.mock("../hooks/useOutsideClick", () => ({ useOutsideClick: () => {} }))

import { MessageBubble } from "./MessageBubble"

const DATAURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
const RAW = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

function userMsg(parts: Array<Record<string, unknown>>): any {
  return {
    info: { id: "m1", role: "user", sessionID: "s1", time: { created: 1 } },
    parts,
    text: "hola",
    thinkingParts: [],
    toolParts: [],
  }
}

afterEach(() => cleanup())

// Regresión: la imagen enviada debe verse en el chat (optimista, eco v1/v2,
// base64 crudo). El server puede podar los dataURL en el eco — eso lo cubre
// rehydrateImages (ver parseCommand.test.ts); acá se prueba el render.
describe("MessageBubble imagen", () => {
  it("parte image con dataURL renderiza <img>", () => {
    render(<MessageBubble message={userMsg([{ id: "p1", type: "image", data: DATAURL, mimeType: "image/png" }])} />)
    const img = document.querySelector("img.message-image") as HTMLImageElement | null
    expect(img).not.toBeNull()
    expect(img!.src.startsWith("data:")).toBe(true)
  })

  it("parte image con base64 crudo compone dataURL", () => {
    render(<MessageBubble message={userMsg([{ id: "p1", type: "image", data: RAW, mimeType: "image/png" }])} />)
    const img = document.querySelector("img.message-image") as HTMLImageElement | null
    expect(img).not.toBeNull()
    expect(img!.src).toBe(`data:image/png;base64,${RAW}`)
  })

  it("parte file v1 con url dataURL renderiza <img>", () => {
    render(<MessageBubble message={userMsg([{ id: "p1", type: "file", mime: "image/png", filename: "clipboard.png", url: DATAURL }])} />)
    expect(document.querySelector("img.message-image")).not.toBeNull()
  })
})
