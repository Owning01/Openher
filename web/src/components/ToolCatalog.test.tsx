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

describe("avisos del server acoplados (code mode + skills + shell)", () => {
  // Forma real del server v2: system/shell con texto top-level (sin content).
  const sysEnv = (text: string, extra: Record<string, unknown> = {}) =>
    toMessageEnvelopeV1({ id: `m-${text.length}`, sessionID: "s1", type: "system", text, description: "notice", ...extra } as never)
  const renderNotice = (env: { info: { id: string } }) => {
    const { out } = computeRenderedMessages([env as never], undefined, new Map())
    expect(out.length).toBe(1)
    return out[0]
  }

  it("catalogo combinado con fecha también se acopla (includes, no startsWith)", () => {
    const msg = renderNotice(sysEnv(`Today's date is now: Wed Aug 26 2026\n\n${TOOL_CATALOG_MARKER} v2\n\n## Search\n...`))
    expect(msg.noticeKind).toBe("codemode")
    expect(msg.isToolCatalog).toBe(true)
    const { container } = render(<MessageBubble message={msg} />)
    expect(container.querySelector(".tool-catalog-card")).not.toBeNull()
    expect(container.querySelector(".message-content")).toBeNull()
  })

  it("aviso de skills con tags <skill> se acopla con su título", () => {
    const msg = renderNotice(sysEnv("New skills are available:\n\n<skill>\n  <id>api-dialect</id>\n</skill>"))
    expect(msg.noticeKind).toBe("skills")
    expect(msg.isToolCatalog).toBe(false)
    const { container } = render(<MessageBubble message={msg} />)
    const toggle = container.querySelector(".tool-catalog-card .collapsible-toggle") as HTMLElement
    expect(toggle.textContent).toContain("Skills")
    fireEvent.click(toggle)
    expect((container.querySelector(".tool-catalog-body") as HTMLElement).textContent).toContain("<id>api-dialect</id>")
  })

  it("salida shell del server se acopla con su título", () => {
    const env = toMessageEnvelopeV1({ id: "msh", sessionID: "s1", type: "shell", command: "git status", output: "On branch main\nnothing to commit" } as never)
    const { out } = computeRenderedMessages([env], undefined, new Map())
    expect(out.length).toBe(1)
    expect(out[0].noticeKind).toBe("shell")
    const { container } = render(<MessageBubble message={out[0]} />)
    const toggle = container.querySelector(".tool-catalog-card .collapsible-toggle") as HTMLElement
    expect(toggle.textContent).toContain("Shell")
    fireEvent.click(toggle)
    expect((container.querySelector(".tool-catalog-body") as HTMLElement).textContent).toContain("nothing to commit")
  })

  it("la tarjeta nunca expande vacía: fallback a los parts si text vino vacío", () => {
    const env = sysEnv(`${TOOL_CATALOG_MARKER} v2`)
    const full = renderNotice(env)
    // Simula un camino que dejó text vacío con parts intactos.
    const emptied = { ...full, text: "" }
    const { container } = render(<MessageBubble message={emptied} />)
    fireEvent.click(container.querySelector(".tool-catalog-card .collapsible-toggle") as HTMLElement)
    expect((container.querySelector(".tool-catalog-body") as HTMLElement).textContent).toContain(TOOL_CATALOG_MARKER)
  })
})
