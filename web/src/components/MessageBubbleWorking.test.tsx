import { describe, it, expect, vi, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"

vi.mock("../hooks/useOutsideClick", () => ({ useOutsideClick: () => {} }))

import { MessageBubble } from "./MessageBubble"
import type { TurnActivity } from "../utils/turnActivity"

// La caja que acopla pensamiento + herramientas tiene rótulo FIJO: "Working",
// esté el turno en curso o terminado. Antes cambiaba entre el nombre del tool
// que corría y la lista de tools del turno ("read · edit · shell").

function assistantMsg(): never {
  return {
    info: { id: "m1", role: "assistant", sessionID: "s1", time: { created: 1, completed: 2 }, finish: "stop" },
    parts: [],
    text: "",
    thinkingParts: [],
    toolParts: [],
  } as never
}

function activity(working: boolean): TurnActivity {
  return {
    thinkingParts: [{ id: "t1", type: "reasoning", text: "pienso" }] as never,
    toolParts: [
      { id: "c1", type: "tool", tool: "read", callID: "c1", state: { status: "completed" } },
      { id: "c2", type: "tool", tool: "shell", callID: "c2", state: { status: "completed" } },
    ] as never,
    summaryDiffs: [],
    intermediateTexts: [],
    working,
  }
}

const title = (container: HTMLElement) => container.querySelector(".activity-box .collapsible-title")?.textContent?.trim()

afterEach(() => cleanup())

describe("MessageBubble: rótulo de la caja de herramientas", () => {
  it("mientras trabaja dice Working (no el tool en curso)", () => {
    const { container } = render(<MessageBubble message={assistantMsg()} turnActivity={activity(true)} />)
    expect(title(container)).toBe("Working")
  })

  it("con el turno terminado también dice Working (no la lista de tools)", () => {
    const { container } = render(<MessageBubble message={assistantMsg()} turnActivity={activity(false)} />)
    expect(title(container)).toBe("Working")
    expect(container.textContent).not.toContain("read · shell")
  })
})
