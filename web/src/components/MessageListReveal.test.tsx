import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, cleanup, act } from "@testing-library/react"

vi.mock("./MessageBubble", () => ({
  MessageBubble: ({ message }: { message: { info: { id: string } } }) => (
    <div data-message-id={message.info.id} />
  ),
}))

import { MessageList } from "./MessageList"

function msgs(n: number): any[] {
  return Array.from({ length: n }, (_, i) => ({
    info: { id: `m${i}`, role: "user", sessionID: "s1", time: { created: i } },
    text: `prompt ${i}`,
  }))
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

describe("MessageList reveal (salto del historial)", () => {
  it("oculta los antiguos tras la ventana inicial", () => {
    render(<MessageList {...base} messages={msgs(60)} revealMessageID={null} revealNonce={0} />)
    expect(document.querySelector('[data-message-id="m0"]')).toBeNull()
    expect(document.querySelector('[data-message-id="m59"]')).not.toBeNull()
    expect(document.querySelector(".load-earlier-btn")).not.toBeNull()
  })

  it("expande hasta el objetivo y le da destello", () => {
    const { rerender } = render(
      <MessageList {...base} messages={msgs(60)} revealMessageID={null} revealNonce={0} />
    )
    expect(document.querySelector('[data-message-id="m0"]')).toBeNull()
    act(() => {
      rerender(<MessageList {...base} messages={msgs(60)} revealMessageID="m0" revealNonce={1} />)
    })
    const el = document.querySelector('[data-message-id="m0"]')
    expect(el).not.toBeNull()
    expect(el!.classList.contains("msg-flash")).toBe(true)
    // Ventana ya completa: el botón de carga desaparece.
    expect(document.querySelector(".load-earlier-btn")).toBeNull()
  })

  it("el mismo id con nuevo nonce repite el salto", () => {
    const { rerender } = render(
      <MessageList {...base} messages={msgs(60)} revealMessageID="m0" revealNonce={1} />
    )
    const fn = window.HTMLElement.prototype.scrollIntoView as unknown as ReturnType<typeof vi.fn>
    const calls1 = fn.mock.calls.length
    expect(calls1).toBeGreaterThan(0)
    act(() => {
      rerender(<MessageList {...base} messages={msgs(60)} revealMessageID="m0" revealNonce={2} />)
    })
    expect(fn.mock.calls.length).toBeGreaterThan(calls1)
  })
})
