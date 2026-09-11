import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, cleanup, act } from "@testing-library/react"
import { VirtuosoMockContext } from "react-virtuoso"

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
  },
)

import { ChatVirtuosoList } from "./ChatVirtuosoList"
import { __clearChatAnchors } from "../../shared/lib/chatAnchor"

function msgs(n: number, sessionID = "s1"): any[] {
  return Array.from({ length: n }, (_, i) => ({
    info: { id: `m${i}`, role: i % 2 ? "assistant" : "user", sessionID, time: { created: i } },
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

const mockCtx = { viewportHeight: 800, itemHeight: 60 }

function mount(ui: React.ReactElement) {
  return render(
    <VirtuosoMockContext.Provider value={mockCtx}>{ui}</VirtuosoMockContext.Provider>,
  )
}

beforeEach(() => {
  __clearChatAnchors()
  sessionStorage.clear()
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
  window.HTMLElement.prototype.scrollTo = vi.fn() as any
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("ChatVirtuosoList", () => {
  it("monta y muestra mensajes con ancla por id", async () => {
    mount(<ChatVirtuosoList {...base} messages={msgs(200)} revealMessageID={null} revealNonce={0} />)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300))
    })
    expect(document.querySelector(".message-list-root")).not.toBeNull()
    expect(document.querySelectorAll("[data-message-id]").length).toBeGreaterThan(0)
    expect(document.querySelectorAll("[data-message-id]").length).toBeLessThan(200)
  })

  it("estado vacío", () => {
    mount(<ChatVirtuosoList {...base} messages={[]} revealMessageID={null} revealNonce={0} />)
    expect(document.querySelector(".empty-state")).not.toBeNull()
  })

  it("typing bubble visible", () => {
    mount(
      <ChatVirtuosoList {...base} messages={msgs(3)} showTypingBubble revealMessageID={null} revealNonce={0} />,
    )
    expect(document.querySelector(".typing-bubble")).not.toBeNull()
  })

  it("reveal no crashea", async () => {
    await act(async () => {
      mount(
        <ChatVirtuosoList {...base} messages={msgs(60)} revealMessageID="m59" revealNonce={1} />,
      )
    })
  })

  it("botón cargar anteriores con hasMoreMessages", () => {
    mount(
      <ChatVirtuosoList
        {...base}
        messages={msgs(35)}
        hasMoreMessages
        isLoadingMore={false}
        onLoadMoreMessages={() => {}}
        revealMessageID={null}
        revealNonce={0}
      />,
    )
    expect(document.querySelector(".load-previous-messages-btn")).not.toBeNull()
  })

  it("anteponer historial no crashea y conserva el scroller", async () => {
    const all = msgs(70)
    const { rerender } = mount(
      <ChatVirtuosoList {...base} messages={all.slice(35)} revealMessageID={null} revealNonce={0} />,
    )
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200))
    })
    await act(async () => {
      rerender(
        <ChatVirtuosoList {...base} messages={all} revealMessageID={null} revealNonce={0} />,
      )
      await new Promise((r) => setTimeout(r, 200))
    })
    // El mock de Virtuoso no representa el fondo (scroll real sí); lo que se
    // valida acá es que el rebaseo de firstItemIndex no tumbe la lista.
    expect(document.querySelector("[data-virtuoso-scroller]")).not.toBeNull()
  })

  it("adjustFirstIndex solo se mueve al anteponer", async () => {
    const { adjustFirstIndex } = await import("./ChatVirtuosoList")
    const all = msgs(70)
    // append abajo: fijo
    expect(adjustFirstIndex(99965, "m35", all.slice(35).concat([{ ...all[35]!, info: { ...all[35]!.info, id: "m70" } }])))
      .toEqual({ first: 99965, firstId: "m35" })
    // prepend 35: retrocede 35
    expect(adjustFirstIndex(99965, "m35", all)).toEqual({ first: 99930, firstId: "m0" })
    // mismo primer id = append: fijo aunque cambie la longitud
    expect(adjustFirstIndex(99930, "m0", msgs(10))).toEqual({ first: 99930, firstId: "m0" })
    // reemplazo total con otro primer id: resetea a la base
    const other = msgs(10).map((m, i) => ({ ...m, info: { ...m.info, id: `x${i}` } }))
    expect(adjustFirstIndex(99930, "m0", other)).toEqual({ first: 100000 - 10, firstId: "x0" })
  })
})
