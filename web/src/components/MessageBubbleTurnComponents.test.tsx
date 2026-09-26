import { describe, it, expect, vi, afterEach } from "vitest"
import { render, cleanup, fireEvent } from "@testing-library/react"

vi.mock("../hooks/useOutsideClick", () => ({ useOutsideClick: () => {} }))

import { MessageBubble } from "./MessageBubble"
import type { TurnActivity } from "../utils/turnActivity"
import { splitActivityByComponent } from "../utils/turnComponents"

// Lote 25-sep: la caja "Working" agrupa su actividad POR COMPONENTE (cada fila
// es un resumen; al desacoplarla se ve todo su detalle), las tarjetas de
// subagente se pintan AFUERA de la caja, y un mensaje de usuario envuelto en
// <subagent>…</subagent> aparece acoplado con scroll propio.

function assistantMsg(): never {
  return {
    info: { id: "m1", role: "assistant", sessionID: "s1", time: { created: 1 } },
    parts: [],
    text: "",
    thinkingParts: [],
    toolParts: [],
  } as never
}

function userMsg(text: string): never {
  return {
    info: { id: "u1", role: "user", sessionID: "s1", time: { created: 1 } },
    parts: [],
    text,
    thinkingParts: [],
    toolParts: [],
  } as never
}

function toolPart(id: string, tool: string, over: Record<string, unknown> = {}): never {
  return {
    id,
    tool,
    callID: `c-${id}`,
    state: { status: "completed", input: {}, output: "ok", ...over },
  } as never
}

function activity(parts: unknown[]): TurnActivity {
  return {
    thinkingParts: [],
    toolParts: parts as never,
    summaryDiffs: [],
    intermediateTexts: [],
    working: false,
  }
}

afterEach(() => cleanup())

describe("splitActivityByComponent", () => {
  it("agrupa por componente, cuenta por verbo y saca las tarjetas de subagente", () => {
    const { components, subagentParts } = splitActivityByComponent([
      toolPart("a", "edit"),
      toolPart("b", "bash"),
      toolPart("c", "bash"),
      toolPart("d", "task", { input: { description: "auditar" }, metadata: { sessionId: "ses_hija" } }),
    ] as never)

    expect(subagentParts).toHaveLength(1)
    expect(components).toHaveLength(1)
    expect(components[0].key).toBe("main")
    // El principal no se etiqueta: la caja ya dice "Working".
    expect(components[0].label).toBe("")
    expect(components[0].summary).toBe("1 Edited · 2 Ran")
  })
})

describe("MessageBubble: caja Working por componente", () => {
  it("muestra un resumen por componente y al desacoplarlo, todas sus tools", () => {
    const parts = [toolPart("a", "edit"), toolPart("b", "bash"), toolPart("c", "read")]
    const { container } = render(
      <MessageBubble message={assistantMsg()} turnActivity={activity(parts)} compactTools={false} />
    )

    const rows = container.querySelectorAll(".turn-component")
    expect(rows).toHaveLength(1)
    const resumen = container.querySelector(".turn-component-summary")
    expect(resumen?.textContent).toBe("1 Edited · 1 Ran · 1 Analyzed")

    // Cerrado: ninguna tool a la vista.
    expect(container.querySelectorAll(".activity-box .tool-part")).toHaveLength(0)

    fireEvent.click(container.querySelector(".turn-component .collapsible-toggle") as HTMLElement)
    expect(container.querySelectorAll(".activity-box .tool-part")).toHaveLength(3)
  })

  it("deja el shimmer del título solo mientras el turno corre", () => {
    const apagado = render(
      <MessageBubble message={assistantMsg()} turnActivity={activity([toolPart("a", "edit")])} />
    )
    expect(apagado.container.querySelector(".shimmer-char")).toBeNull()
    cleanup()

    const encendido = render(
      <MessageBubble
        message={assistantMsg()}
        turnActivity={{ ...activity([toolPart("a", "edit")]), working: true }}
      />
    )
    expect(encendido.container.querySelectorAll(".shimmer-char").length).toBeGreaterThan(1)
  })

  it("saca la tarjeta de subagente de la caja y la deja en el chat, sin icono", () => {
    const parts = [toolPart("a", "edit"), toolPart("s", "task", { input: { description: "auditar" }, metadata: { sessionId: "ses_hija" } })]
    const { container } = render(<MessageBubble message={assistantMsg()} turnActivity={activity(parts)} />)

    const box = container.querySelector(".activity-box") as HTMLElement
    const row = container.querySelector(".subagent-row") as HTMLElement
    expect(row).not.toBeNull()
    expect(box.contains(row)).toBe(false) // AFUERA de la caja
    expect(row.textContent).toContain("auditar")
    // Mismo tamaño que una tool, sin ícono de herramienta.
    expect(row.className).toContain("tool-part")
    expect(row.querySelector("svg")).toBeNull()
  })
})

describe("MessageBubble: mensaje de usuario <subagent>", () => {
  it("lo muestra acoplado y sin los tags", () => {
    const { container } = render(
      <MessageBubble message={userMsg("<subagent>\nresultado del subagente\n</subagent>")} />
    )
    const block = container.querySelector(".subagent-attached")
    expect(block).not.toBeNull()
    expect(block?.textContent).toContain("resultado del subagente")
    expect(block?.textContent).not.toContain("<subagent>")
  })

  it("un mensaje normal sigue yendo como mensaje normal", () => {
    const { container } = render(<MessageBubble message={userMsg("hola chat")} />)
    expect(container.querySelector(".subagent-attached")).toBeNull()
  })
})
