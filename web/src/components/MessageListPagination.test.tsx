import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, cleanup, fireEvent, act } from "@testing-library/react"

vi.mock("./MessageBubble", () => ({
  MessageBubble: ({ message }: { message: { info: { id: string } } }) => (
    <div data-message-id={message.info.id} className="test-bubble" />
  ),
}))

import { MessageList } from "./MessageList"
import { __clearScrollMemory } from "../shared/lib/useFollowTail"

// Crea una lista de turnos (cada turno tiene 1 user + 10 assistant)
function createMultiTurnSession(turnCount: number, assistantPerTurn = 10): any[] {
  const list: any[] = []
  let ts = 1000
  for (let t = 0; t < turnCount; t++) {
    list.push({
      info: { id: `u_${t}`, role: "user", sessionID: "s1", time: { created: ts++ } },
      text: `prompt turno ${t}`,
    })
    for (let a = 0; a < assistantPerTurn; a++) {
      list.push({
        info: { id: `a_${t}_${a}`, role: "assistant", sessionID: "s1", time: { created: ts++ } },
        text: `respuesta turno ${t} item ${a}`,
      })
    }
  }
  return list
}

const base = {
  loadingSessionID: null,
  selectedID: "s1",
  showTypingBubble: false,
  compacting: false,
  isWorking: false,
  messageScrollSignature: "",
  view: "detail",
} as const

beforeEach(() => {
  __clearScrollMemory()
  sessionStorage.clear()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.scrollTo = vi.fn() as any
  vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
    cb(0)
    return 1
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("MessageList - Paginación inicial de 3 turnos y carga de anteriores", () => {
  it("renderiza inicialmente solo los últimos 3 turnos del usuario y muestra botón para cargar anteriores", () => {
    // 6 turnos, 11 mensajes por turno = 66 mensajes en total
    const messages = createMultiTurnSession(6, 10)
    const { container } = render(<MessageList {...base} messages={messages} />)

    // Los últimos 3 turnos son u_3, u_4, u_5 (33 mensajes)
    // Pero como INITIAL_PAGE_SIZE es 40, visibleCount es Math.max(40, 33) = 40.
    // Turno 0 (u_0) y Turno 1 (u_1) deben estar fuera del DOM visible
    expect(container.querySelector('[data-message-id="u_0"]')).toBeNull()
    expect(container.querySelector('[data-message-id="u_1"]')).toBeNull()

    // El último turno (u_5 y a_5_9) debe estar en el DOM
    expect(container.querySelector('[data-message-id="u_5"]')).not.toBeNull()
    expect(container.querySelector('[data-message-id="a_5_9"]')).not.toBeNull()

    // El botón para cargar mensajes anteriores debe estar presente
    const btn = container.querySelector(".load-earlier-btn") as HTMLButtonElement
    expect(btn).not.toBeNull()

    // Al hacer clic en cargar mensajes anteriores, debe expandir visibleCount
    act(() => {
      fireEvent.click(btn)
    })

    // Ahora deben haberse revelado los mensajes anteriores
    expect(container.querySelector('[data-message-id="u_0"]')).not.toBeNull()
    expect(container.querySelector('[data-message-id="u_1"]')).not.toBeNull()
  })

  it("renderiza los 3 turnos completos cuando superan INITIAL_PAGE_SIZE", () => {
    // 5 turnos, con 20 mensajes de asistente cada uno (21 mensajes por turno = 105 mensajes)
    // Los últimos 3 turnos tienen 3 * 21 = 63 mensajes (> 40)
    const messages = createMultiTurnSession(5, 20)
    const { container } = render(<MessageList {...base} messages={messages} />)

    // Turno 2 es el tercer turno contando desde el final (u_2, u_3, u_4)
    expect(container.querySelector('[data-message-id="u_2"]')).not.toBeNull()
    expect(container.querySelector('[data-message-id="u_4"]')).not.toBeNull()

    // Turnos anteriores (u_0, u_1) deben estar ocultos
    expect(container.querySelector('[data-message-id="u_0"]')).toBeNull()
    expect(container.querySelector('[data-message-id="u_1"]')).toBeNull()

    // Botón disponible
    expect(container.querySelector(".load-earlier-btn")).not.toBeNull()
  })
})
