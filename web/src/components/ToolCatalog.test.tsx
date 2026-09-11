import { describe, it, expect, afterEach } from "vitest"
import { render, cleanup, fireEvent } from "@testing-library/react"
import { MessageBubble } from "./MessageBubble"
import { computeRenderedMessages, TOOL_CATALOG_MARKER } from "../utils/rendered"
import { toMessageEnvelopeV1 } from "../shared/api/mappers"

const CATALOG_TEXT = `${TOOL_CATALOG_MARKER} has changed. This catalog supersedes the previous one.\n\n## Search\n\nCall search(...) to discover tools.\n`.repeat(40)

function systemMsg(text: string): any {
  return {
    info: { id: "msys", role: "system", sessionID: "s1", time: { created: 1, completed: 2 } },
    parts: [{ id: "p1", type: "text", text }],
    text: "",
    thinkingParts: [],
    toolParts: [],
  }
}

afterEach(() => cleanup())

describe("Code Mode catalog colapsado", () => {
  it("mapper v2 system + rendered marca isToolCatalog", () => {
    const env = toMessageEnvelopeV1({ id: "m9", sessionID: "s1", type: "system", text: CATALOG_TEXT } as never)
    const { out } = computeRenderedMessages([env], undefined, new Map())
    expect(out.length).toBe(1)
    expect(out[0].isToolCatalog).toBe(true)
  })

  it("texto user normal y system no-catalog no se marcan", () => {
    const { out } = computeRenderedMessages([systemMsg("hola mundo")], undefined, new Map())
    expect(out[0].isToolCatalog).toBe(false)
    const { out: out2 } = computeRenderedMessages(
      [{ ...systemMsg("x"), info: { id: "m2", role: "user", sessionID: "s1", time: { created: 1 } }, parts: [{ id: "p2", type: "text", text: CATALOG_TEXT }] }],
      undefined,
      new Map()
    )
    expect(out2[0].isToolCatalog).toBe(false)
  })

  it("la bubble colapsa el catalogo: oculto hasta expandir, con scroll fijo", () => {
    const { out } = computeRenderedMessages([systemMsg(CATALOG_TEXT)], undefined, new Map())
    const { container } = render(<MessageBubble message={out[0]} />)
    // Colapsado: el texto largo no está en el DOM, solo el toggle
    expect(container.querySelector(".tool-catalog-card")).not.toBeNull()
    expect(container.querySelector(".tool-catalog-body")).toBeNull()
    expect(container.querySelector(".message-content")).toBeNull()
    const toggle = container.querySelector(".tool-catalog-card .collapsible-toggle") as HTMLElement
    expect(toggle.textContent).toContain("Code Mode")
    fireEvent.click(toggle)
    const body = container.querySelector(".tool-catalog-body") as HTMLElement
    expect(body).not.toBeNull()
    expect(body.textContent).toContain(TOOL_CATALOG_MARKER)
    expect(body.className).toContain("tool-catalog-body")
  })
})
