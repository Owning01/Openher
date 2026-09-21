import { describe, it, expect, vi, afterEach } from "vitest"
import { render, cleanup } from "@testing-library/react"

vi.mock("../hooks/useOutsideClick", () => ({ useOutsideClick: () => {} }))

import { MessageBubble } from "./MessageBubble"
import type { TurnActivity } from "../utils/turnActivity"

// Regresión: mientras el turno trabaja, la caja de actividad (el scroll propio
// de 180px dentro del <article class="message assistant">) se clavaba al fondo
// en CADA delta. Si el usuario scrolleaba arriba para leer un tool anterior,
// el siguiente token lo devolvía abajo. Ahora solo sigue si ya está al fondo.

function assistantMsg(): never {
  return {
    info: { id: "m1", role: "assistant", sessionID: "s1", time: { created: 1 } },
    parts: [],
    text: "",
    thinkingParts: [],
    toolParts: [],
  } as never
}

function activity(thinkingText: string): TurnActivity {
  return {
    thinkingParts: [{ id: "t1", type: "reasoning", text: thinkingText }] as never,
    toolParts: [],
    summaryDiffs: [],
    intermediateTexts: [],
    working: true,
  }
}

// jsdom no hace layout: el scroll del nodo se simula como en useFollowTail.test.
function mockMetrics(el: HTMLElement, scrollHeight: number, clientHeight: number, scrollTop: number) {
  Object.defineProperties(el, {
    scrollHeight: { value: scrollHeight, writable: true },
    clientHeight: { value: clientHeight, writable: true },
    scrollTop: { value: scrollTop, writable: true },
  })
}

function box(container: HTMLElement): HTMLElement {
  const el = container.querySelector(".activity-box .collapsible-content")
  expect(el).not.toBeNull()
  return el as HTMLElement
}

afterEach(() => cleanup())

describe("MessageBubble: auto-scroll de la caja de actividad", () => {
  it("no baja la caja si el usuario scrolleó hacia arriba", () => {
    const msg = assistantMsg()
    const { container, rerender } = render(<MessageBubble message={msg} turnActivity={activity("a")} />)
    const body = box(container)
    mockMetrics(body, 500, 180, 50) // distancia 270 → el usuario está leyendo arriba
    body.dispatchEvent(new Event("scroll"))

    rerender(<MessageBubble message={msg} turnActivity={activity("a".repeat(200))} />)

    expect(body.scrollTop).toBe(50)
  })

  it("sigue al fondo mientras el usuario está abajo", () => {
    const msg = assistantMsg()
    const { container, rerender } = render(<MessageBubble message={msg} turnActivity={activity("a")} />)
    const body = box(container)
    mockMetrics(body, 500, 180, 320) // distancia 0 → al fondo
    body.dispatchEvent(new Event("scroll"))

    rerender(<MessageBubble message={msg} turnActivity={activity("a".repeat(200))} />)

    expect(body.scrollTop).toBe(500)
  })

  it("vuelve a seguir cuando el usuario regresa al fondo", () => {
    const msg = assistantMsg()
    const { container, rerender } = render(<MessageBubble message={msg} turnActivity={activity("a")} />)
    const body = box(container)
    mockMetrics(body, 500, 180, 50)
    body.dispatchEvent(new Event("scroll"))
    rerender(<MessageBubble message={msg} turnActivity={activity("ab")} />)
    expect(body.scrollTop).toBe(50)

    body.scrollTop = 300 // el usuario bajó solo (distancia 20 <= 24)
    body.dispatchEvent(new Event("scroll"))
    rerender(<MessageBubble message={msg} turnActivity={activity("abc")} />)

    expect(body.scrollTop).toBe(500)
  })
})
