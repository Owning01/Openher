import { describe, it, expect, vi, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"

vi.mock("../hooks/useOutsideClick", () => ({ useOutsideClick: () => {} }))

import { MessageBubble } from "./MessageBubble"
import { buildOptimisticMessage } from "../utils/parseCommand"
import { computeRenderedMessages } from "../utils/rendered"
import { toMessageEnvelopeV1 } from "../shared/api/mappers"

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

  it("pipeline optimistic -> rendered conserva imagen", () => {
    const opt = buildOptimisticMessage({ id: "s1" } as never, "hola", [{ base64: DATAURL, mime: "image/png" }])
    const { out } = computeRenderedMessages([opt], undefined, new Map())
    expect(out.length).toBe(1)
    render(<MessageBubble message={out[0]} />)
    expect(document.querySelector("img.message-image")).not.toBeNull()
  })

  it("mapper v2 user+files renderiza <img> de punta a punta", () => {
    const env = toMessageEnvelopeV1({ id: "m9", sessionID: "s1", type: "user", text: "hola", files: [{ uri: DATAURL, name: "clipboard.png", mime: "image/png" }] } as never)
    const { out } = computeRenderedMessages([env], undefined, new Map())
    expect(out.length).toBe(1)
    render(<MessageBubble message={out[0]} />)
    expect(document.querySelector("img.message-image")).not.toBeNull()
  })
})
