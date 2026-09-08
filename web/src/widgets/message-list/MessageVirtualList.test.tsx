import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, cleanup, act } from "@testing-library/react"

vi.mock("../../components/MessageBubble", () => ({
  MessageBubble: ({ message }: { message: { info: { id: string } } }) => (
    <div data-message-id={message.info.id} />
  ),
}))

vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

import { MessageVirtualList } from "./MessageVirtualList"

function msgs(n: number): any[] {
  return Array.from({ length: n }, (_, i) => ({
    info: { id: `m${i}`, role: i % 2 ? "assistant" : "user", sessionID: "s1", time: { created: i } },
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

describe("MessageVirtualList (Plan 2)", () => {
  it("monta 200 mensajes sin crashear y no renderiza la cola", () => {
    render(<MessageVirtualList {...base} messages={msgs(200)} revealMessageID={null} revealNonce={0} />)
    expect(document.querySelector(".messages")).not.toBeNull()
    // La cola queda fuera de la ventana virtualizada.
    expect(document.querySelector('[data-message-id="m199"]')).toBeNull()
    const rendered = document.querySelectorAll("[data-message-id]").length
    expect(rendered).toBeLessThan(200)
  })

  it("estado vacío", () => {
    render(<MessageVirtualList {...base} messages={[]} revealMessageID={null} revealNonce={0} />)
    expect(document.querySelector(".empty-state")).not.toBeNull()
  })

  it("typing bubble visible", () => {
    render(<MessageVirtualList {...base} messages={msgs(3)} showTypingBubble revealMessageID={null} revealNonce={0} />)
    expect(document.querySelector(".typing-bubble")).not.toBeNull()
  })

  it("al entrar intenta ir al final (scroll programático)", async () => {
    render(<MessageVirtualList {...base} messages={msgs(200)} revealMessageID={null} revealNonce={0} />)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    const el = document.querySelector(".messages") as HTMLElement
    const scrollTo = window.HTMLElement.prototype.scrollTo as unknown as ReturnType<typeof vi.fn>
    expect(scrollTo.mock.calls.length + (el.scrollTop > 0 ? 1 : 0)).toBeGreaterThan(0)
  })

  it("reveal no crashea", () => {
    let tree: ReturnType<typeof render>
    expect(() => {
      act(() => {
        tree = render(
          <MessageVirtualList {...base} messages={msgs(60)} revealMessageID="m59" revealNonce={1} />
        )
      })
    }).not.toThrow()
    tree!.unmount()
  })
})
