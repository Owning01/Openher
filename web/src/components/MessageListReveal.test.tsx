import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, cleanup, act } from "@testing-library/react"

vi.mock("./MessageBubble", () => ({
  MessageBubble: ({ message }: { message: { info: { id: string } } }) => (
    <div data-message-id={message.info.id} />
  ),
}))

import { MessageList } from "./MessageList"
import { __clearScrollMemory, resolveSessionEntry } from "../shared/lib/useFollowTail"

function msgs(n: number): any[] {
  return Array.from({ length: n }, (_, i) => ({
    info: { id: `m${i}`, role: "user", sessionID: "s1", time: { created: i } },
    text: `prompt ${i}`,
  }))
}

function msgsFor(sessionID: string, n: number): any[] {
  return Array.from({ length: n }, (_, i) => ({
    info: { id: `${sessionID}-m${i}`, role: "user", sessionID, time: { created: i } },
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

  it("cambio de sesión: spinner sobre stale y ancla solo con frescos (igual longitud)", () => {
    const stale = msgsFor("s1", 60)
    const fresh = msgsFor("s2", 60) // misma longitud: el ancla por longitud no re-dispararía
    const { rerender } = render(
      <MessageList {...base} selectedID="s2" messages={stale} revealMessageID={null} revealNonce={0} />
    )
    const wrap = document.querySelector(".messages") as HTMLElement
    // Stale oculto: no se ve el chat viejo; en su lugar un spinner de carga
    // (nunca un área negra vacía).
    expect(wrap.style.opacity).toBe("1")
    expect(wrap.querySelector(".grid-spinner")).not.toBeNull()
    expect(wrap.querySelector('[data-message-id="s1-m59"]')).toBeNull()
    const scrollTo = window.HTMLElement.prototype.scrollTo as unknown as ReturnType<typeof vi.fn>
    scrollTo.mockClear()
    act(() => {
      rerender(
        <MessageList {...base} selectedID="s2" messages={fresh} revealMessageID={null} revealNonce={0} />
      )
    })
    expect(scrollTo).toHaveBeenCalled() // frescos: ancla directa al final
    expect(wrap.style.opacity).toBe("1")
    expect(wrap.querySelector('[data-message-id="s2-m59"]')).not.toBeNull()
  })

  it("entrada: ningún scroll suave (todo ancla/asentamiento instantáneo)", () => {
    render(<MessageList {...base} messages={msgs(60)} revealMessageID={null} revealNonce={0} />)
    const scrollTo = window.HTMLElement.prototype.scrollTo as unknown as ReturnType<typeof vi.fn>
    expect(scrollTo.mock.calls.length).toBeGreaterThan(0)
    // Regresión del "scroll rápido desde arriba": nada de la entrada anima.
    for (const c of scrollTo.mock.calls) {
      expect((c[0] as { behavior?: string } | undefined)?.behavior ?? "auto").not.toBe("smooth")
    }
  })

  it("no ancla sobre el spinner: espera a que termine la carga", () => {
    const fresh = msgsFor("s1", 60)
    const { rerender } = render(
      <MessageList {...base} messages={fresh} loadingSessionID="s1" revealMessageID={null} revealNonce={0} />
    )
    const scrollTo = window.HTMLElement.prototype.scrollTo as unknown as ReturnType<typeof vi.fn>
    // Spinner montado (sin DOM de mensajes): el ancla no se consume acá.
    expect(scrollTo).not.toHaveBeenCalled()
    act(() => {
      rerender(
        <MessageList {...base} messages={fresh} loadingSessionID={null} revealMessageID={null} revealNonce={0} />
      )
    })
    expect(scrollTo).toHaveBeenCalled()
    const wrap = document.querySelector(".messages") as HTMLElement
    expect(wrap.style.opacity).toBe("1")
  })

  it("memoria envenenada (ancla inexistente): entra abajo y limpia la memoria", () => {
    sessionStorage.setItem(
      "openher.chatScroll.v3",
      JSON.stringify({ mem: { s2: { dist: 9999, ts: Date.now(), mid: "m-que-no-existe" } }, lastSel: "s2" }),
    )
    render(
      <MessageList {...base} selectedID="s2" messages={msgsFor("s2", 60)} revealMessageID={null} revealNonce={0} />
    )
    // La distancia guardada no es representable y el mid no existe: NO clavar
    // arriba; la entrada cae al fondo y la memoria queda limpia para la próxima.
    expect(resolveSessionEntry("s2")).toEqual({ kind: "fresh" })
    const wrap = document.querySelector(".messages") as HTMLElement
    expect(wrap.style.opacity).toBe("1")
  })

  it("datos stale no escriben memoria de la sesión nueva", () => {
    const stale = msgsFor("s1", 60)
    render(
      <MessageList {...base} selectedID="s2" messages={stale} revealMessageID={null} revealNonce={0} />
    )
    // Con stale montado (velo oculto), un scroll no debe persistir bajo s2.
    const el = document.querySelector(".messages") as HTMLElement
    act(() => {
      Object.defineProperty(el, "scrollTop", { value: 5000, writable: true })
      el.dispatchEvent(new Event("scroll"))
    })
    expect(resolveSessionEntry("s2")).toEqual({ kind: "fresh" })
  })

  it("cap duro: revela aunque el loop de asentamiento no corra (nunca chat negro)", () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
    // rAF no-op: el loop de settle nunca avanza (simula ráfagas de merges que
    // reinician el presupuesto de frames).
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1)
    render(<MessageList {...base} messages={msgs(60)} revealMessageID={null} revealNonce={0} />)
    const wrap = document.querySelector(".messages") as HTMLElement
    expect(wrap.style.opacity).toBe("0")
    act(() => {
      vi.advanceTimersByTime(1300)
    })
    // El cap por reloj muestra el contenido pase lo que pase.
    expect(wrap.style.opacity).toBe("1")
    vi.useRealTimers()
  })
})
