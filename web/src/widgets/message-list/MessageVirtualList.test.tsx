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

function msgsFor(sessionID: string, n: number): any[] {
  return Array.from({ length: n }, (_, i) => ({
    info: { id: `${sessionID}-m${i}`, role: i % 2 ? "assistant" : "user", sessionID, time: { created: i } },
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
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe("MessageVirtualList (Plan 2)", () => {
  it("monta 200 mensajes sin crashear y no renderiza todos los elementos (solo la ventana virtual)", () => {
    render(<MessageVirtualList {...base} messages={msgs(200)} revealMessageID={null} revealNonce={0} />)
    expect(document.querySelector(".messages")).not.toBeNull()
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

  it("cambio de sesión: ignora los stale y ancla con los frescos aunque midan igual", async () => {
    const stale = msgsFor("s1", 50)
    const fresh = msgsFor("s2", 50) // misma longitud: el ancla por longitud no re-dispararía
    // Remount con key={selectedID} (como hace ChatView): instancia nueva con
    // los mensajes viejos mientras el fetch de la nueva sesión vuelve.
    const { rerender } = render(
      <MessageVirtualList {...base} selectedID="s2" messages={stale} revealMessageID={null} revealNonce={0} />
    )
    const el = document.querySelector(".messages") as HTMLElement
    expect(el.scrollTop).toBe(0) // stale: sin ancla, sin flash de scroll
    await act(async () => {
      rerender(
        <MessageVirtualList {...base} selectedID="s2" messages={fresh} revealMessageID={null} revealNonce={0} />
      )
    })
    expect(el.scrollTop).toBeGreaterThan(0) // frescos: ancla directa al final
  })

  it("leyendo arriba (200px del fondo), un mensaje nuevo NO arrastra abajo", async () => {
    const { rerender } = render(
      <MessageVirtualList {...base} messages={msgs(200)} messageScrollSignature="sig1" revealMessageID={null} revealNonce={0} />
    )
    // Asentar scroll de entrada (velo + clavado hasta tamaño estable, ~12
    // frames en jsdom) + expirar el ledger programático (150ms tras el último pin).
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600))
    })
    const el = document.querySelector(".messages") as HTMLElement
    // Viewport simulado: distancia al fondo = 200px (entre 80 y los 400
    // viejos: con la tolerancia vieja esto te arrastraba, con 80px no).
    Object.defineProperty(el, "scrollHeight", { configurable: true, value: 20000 })
    Object.defineProperty(el, "clientHeight", { configurable: true, value: 800 })
    el.scrollTop = 20000 - 800 - 200
    const scrollTo = window.HTMLElement.prototype.scrollTo as unknown as ReturnType<typeof vi.fn>
    scrollTo.mockClear()
    // Usuario scrollea hacia arriba.
    await act(async () => {
      el.dispatchEvent(new Event("scroll"))
    })
    // Aparece el botón "ir abajo": el sistema sabe que no estamos al fondo.
    expect(document.querySelector(".scroll-to-bottom")).not.toBeNull()
    scrollTo.mockClear()
    // Llega un mensaje nuevo (streaming): no debe robar la lectura.
    rerender(
      <MessageVirtualList {...base} messages={msgs(201)} messageScrollSignature="sig2" revealMessageID={null} revealNonce={0} />
    )
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50))
    })
    expect(scrollTo).not.toHaveBeenCalled()
    expect(el.scrollTop).toBe(20000 - 800 - 200)
    expect(document.querySelector(".scroll-to-bottom")).not.toBeNull()
  })

  it("entrada: velo exterior hasta asentarse y ningún scroll suave (solo instantáneos)", async () => {
    const fresh = msgsFor("s2", 50)
    render(
      <MessageVirtualList {...base} selectedID="s2" messages={fresh} revealMessageID={null} revealNonce={0} />
    )
    const el = document.querySelector(".messages") as HTMLElement
    // Velo exterior (no el interno): estimado/stale/etapas ocultos.
    expect(el.style.opacity).toBe("0")
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400))
    })
    expect(el.style.opacity).toBe("1")
    const scrollTo = window.HTMLElement.prototype.scrollTo as unknown as ReturnType<typeof vi.fn>
    expect(scrollTo.mock.calls.length).toBeGreaterThan(0)
    // Regresión del "scroll rápido desde arriba": el ancla y el asentamiento
    // nunca animan; todo programático de entrada es instantáneo.
    for (const c of scrollTo.mock.calls) {
      expect((c[0] as { behavior?: string } | undefined)?.behavior ?? "auto").not.toBe("smooth")
    }
  })

  it("no ancla sobre la rama del spinner: espera a los mensajes reales", async () => {
    const fresh = msgsFor("s1", 50)
    const { rerender } = render(
      <MessageVirtualList {...base} messages={fresh} loadingSessionID="s1" revealMessageID={null} revealNonce={0} />
    )
    const scrollTo = window.HTMLElement.prototype.scrollTo as unknown as ReturnType<typeof vi.fn>
    // TanStack hace un scroll interno al montar (top ~0); lo que no debe pasar
    // sobre el spinner es NUESTRA ancla al fondo (top = scrollHeight enorme).
    // Sin este guard, el ancla se consumía con scrollHeight del spinner y al
    // montar la lista real el scroll quedaba arriba + salto visible.
    const tops = () =>
      scrollTo.mock.calls.map((c) => (c[0] as { top?: number } | undefined)?.top ?? 0)
    expect(tops().every((t) => t < 1000)).toBe(true)
    const callsBefore = scrollTo.mock.calls.length
    await act(async () => {
      rerender(
        <MessageVirtualList {...base} messages={fresh} loadingSessionID={null} revealMessageID={null} revealNonce={0} />
      )
      await new Promise((r) => setTimeout(r, 400))
    })
    // Carga terminada: el ancla al fondo sí corre (llamadas nuevas con top grande).
    expect(scrollTo.mock.calls.length).toBeGreaterThan(callsBefore)
    expect(tops().some((t) => t >= 1000)).toBe(true)
  })
})
