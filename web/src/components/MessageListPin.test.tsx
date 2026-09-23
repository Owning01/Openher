import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, cleanup } from "@testing-library/react"

// Burbuja mínima: el pin se apoya en las clases reales (`message user` /
// `message assistant`), no en el contenido del bubble.
vi.mock("./MessageBubble", () => ({
  MessageBubble: ({ message }: { message: { info: { id: string; role: string } } }) => (
    <div className={`message ${message.info.role}`} data-message-id={message.info.id} />
  ),
}))

import { MessageList } from "./MessageList"
import { __clearScrollMemory } from "../shared/lib/useFollowTail"

const base = {
  loadingSessionID: null,
  selectedID: "s1",
  showTypingBubble: false,
  compacting: false,
  isWorking: false,
  messageScrollSignature: "",
  view: "detail",
} as const

const user = (id: string) => ({
  info: { id, role: "user", sessionID: "s1", time: { created: 1 } },
  text: "hola",
})

// working: sin `time.completed` ni `finish` + una herramienta => la caja del
// turno queda en curso (buildTurnActivity.working = true).
const assistant = (id: string, working = false) => ({
  info: {
    id,
    role: "assistant",
    sessionID: "s1",
    time: working ? { created: 2 } : { created: 2, completed: 3 },
    finish: working ? undefined : "stop",
  },
  text: "respuesta",
  toolParts: working ? [{ id: "t1" }] : [],
  thinkingParts: [],
  summaryDiffs: [],
  parts: [],
})

beforeEach(() => {
  __clearScrollMemory()
  sessionStorage.clear()
  // jsdom no trae ResizeObserver; el efecto de medición de --pin-h lo usa
  // solo cuando hay un turno en curso.
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.scrollTo = vi.fn() as any
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
    cb(0)
    return 1
  })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("MessageList pin del prompt (turn-group)", () => {
  it("agrupa cada prompt con las respuestas de su turno", () => {
    render(<MessageList {...base} messages={[user("u1"), assistant("a1"), user("u2"), assistant("a2")] as any} />)
    const groups = [...document.querySelectorAll(".messages > .turn-group")]
    expect(groups.length).toBe(2)
    expect(groups[0]!.getAttribute("data-turn-group")).toBe("u1")
    expect(groups[1]!.getAttribute("data-turn-group")).toBe("u2")
    // El prompt es hijo DIRECTO del grupo: sin eso `position: sticky` no tiene
    // bloque contenedor propio y el pin no se suelta en el turno siguiente.
    expect(groups[0]!.querySelector(":scope > .message.user")).not.toBeNull()
    expect(groups[0]!.querySelector(":scope > .message.assistant")).not.toBeNull()
    expect(groups[1]!.querySelector(":scope > .message.user")).not.toBeNull()
    // Ningún mensaje queda suelto fuera de un grupo.
    expect(document.querySelectorAll(".messages > .message").length).toBe(0)
  })

  it("marca con turn-group-active solo el turno en curso", () => {
    render(<MessageList {...base} messages={[user("u1"), assistant("a1"), user("u2"), assistant("a2", true)] as any} />)
    const active = document.querySelectorAll(".turn-group-active")
    expect(active.length).toBe(1)
    expect(active[0]!.getAttribute("data-turn-group")).toBe("u2")
    expect(active[0]!.querySelector(":scope > .message.user")).not.toBeNull()
  })

  it("sin turno en curso no hay pin de caja", () => {
    render(<MessageList {...base} messages={[user("u1"), assistant("a1")] as any} />)
    expect(document.querySelector(".turn-group-active")).toBeNull()
    expect(document.querySelectorAll(".messages > .turn-group").length).toBe(1)
  })
})
