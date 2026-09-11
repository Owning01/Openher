import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useFollowTail, resolveSessionEntry, anchorScrollToSaved, __clearScrollMemory } from "./useFollowTail"

describe("useFollowTail", () => {
  beforeEach(() => {
    __clearScrollMemory()
    sessionStorage.clear()
  })
  function makeContainer(overrides: Partial<{ scrollHeight: number; scrollTop: number; clientHeight: number }> = {}) {
    const el = document.createElement("div") as any
    Object.defineProperties(el, {
      scrollHeight: { value: overrides.scrollHeight ?? 2000, writable: true },
      scrollTop: { value: overrides.scrollTop ?? 0, writable: true },
      clientHeight: { value: overrides.clientHeight ?? 500, writable: true },
    })
    if (!el.scrollTo) el.scrollTo = () => {}
    return el
  }

  it("isAtBottom true cuando está cerca del fondo", () => {
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 1400, clientHeight: 500 }) // distance 100 < 120
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref))
    expect(result.current.isAtBottom).toBe(true)
  })

  it("isAtBottom false cuando está lejos", () => {
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 0, clientHeight: 500 }) // distance 1500
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref))
    expect(result.current.isAtBottom).toBe(false)
  })

  it("ledger evita apagar pin durante scroll programático", () => {
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 1400, clientHeight: 500 })
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref))
    expect(result.current.isAtBottom).toBe(true)
    act(() => result.current.scrollToBottom("smooth"))
    // Simular que el scroll pasa por posición intermedia lejos del fondo
    Object.defineProperty(el, "scrollTop", { value: 0, writable: true })
    el.dispatchEvent(new Event("scroll"))
    // Debe seguir true porque programmaticUntilRef bloquea
    expect(result.current.isAtBottom).toBe(true)
  })

  it("isNearBottom usa threshold extra", () => {
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 1200, clientHeight: 500 }) // distance 300
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref))
    expect(result.current.isNearBottom(400)).toBe(true)
    expect(result.current.isNearBottom(200)).toBe(false)
  })

  it("scrollToBottom auto es instantáneo: fija scrollTop directo sin depender de CSS", () => {
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 0, clientHeight: 500 })
    el.scrollTo = vi.fn()
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref))
    act(() => result.current.scrollToBottom("auto"))
    // Instantáneo aunque el UA tenga scroll-behavior suave: el ancla de
    // entrada nunca debe animarse (causa del "scroll rápido desde arriba").
    expect(el.scrollTop).toBe(2000)
  })
})

describe("resolveSessionEntry (retorno vs cambio de chat)", () => {
  const KEY = "openher.chatScroll.v3"
  beforeEach(() => {
    sessionStorage.clear()
    __clearScrollMemory()
  })
  function seed(id: string, dist: number, ts: number) {
    sessionStorage.setItem(KEY, JSON.stringify({ mem: { [id]: { dist, ts } }, lastSel: id }))
  }

  it("primera entrada a un chat es fresca (abajo)", () => {
    expect(resolveSessionEntry("entry-fresh-1")).toEqual({ kind: "fresh" })
  })

  it("retorno al mismo chat restaura la distancia guardada", () => {
    expect(resolveSessionEntry("entry-ret-1")).toEqual({ kind: "fresh" })
    seed("entry-ret-1", 500, Date.now())
    expect(resolveSessionEntry("entry-ret-1")).toEqual({ kind: "return", dist: 500 })
  })

  it("cambiar de chat preserva mid si había quedado a mitad (por sesión)", () => {
    expect(resolveSessionEntry("entry-sw-a")).toEqual({ kind: "fresh" })
    seed("entry-sw-a", 500, Date.now())
    expect(resolveSessionEntry("entry-sw-a")).toEqual({ kind: "return", dist: 500 })
    // Cambio a otro chat sin memoria: fresco (abajo), sin importar la memoria de A.
    expect(resolveSessionEntry("entry-sw-b")).toEqual({ kind: "fresh" })
    // Volver a A después de estar en B: restaura donde lo dejaste (mid), no abajo.
    expect(resolveSessionEntry("entry-sw-a")).toEqual({ kind: "return", dist: 500 })
  })

  it("distancia pequeña (<=80) es fresca: ya estaba al fondo", () => {
    expect(resolveSessionEntry("entry-near-1")).toEqual({ kind: "fresh" })
    seed("entry-near-1", 10, Date.now())
    expect(resolveSessionEntry("entry-near-1")).toEqual({ kind: "fresh" })
  })

  it("memoria vieja (>2h) es fresca", () => {
    expect(resolveSessionEntry("entry-old-1")).toEqual({ kind: "fresh" })
    seed("entry-old-1", 900, Date.now() - 3 * 60 * 60 * 1000)
    expect(resolveSessionEntry("entry-old-1")).toEqual({ kind: "fresh" })
  })
})

describe("memoria de scroll (minimizar/restaurar)", () => {
  beforeEach(() => {
    __clearScrollMemory()
    sessionStorage.clear()
  })
  function makeContainer(overrides: Partial<{ scrollHeight: number; scrollTop: number; clientHeight: number }> = {}) {
    const el = document.createElement("div") as any
    Object.defineProperties(el, {
      scrollHeight: { value: overrides.scrollHeight ?? 2000, writable: true },
      scrollTop: { value: overrides.scrollTop ?? 0, writable: true },
      clientHeight: { value: overrides.clientHeight ?? 500, writable: true },
    })
    if (!el.scrollTo) el.scrollTo = () => {}
    return el
  }

  it("restoreSavedPosition re-afirma la distancia guardada tras un clamp", () => {
    // Leyendo a mitad: dist 400.
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 1100, clientHeight: 500 })
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref, { persistKey: "mem-restore-1" }))
    expect(result.current.isAtBottom).toBe(false)
    // Minimizar colapsa y el navegador clampea scrollTop a 0.
    Object.defineProperty(el, "scrollTop", { value: 0, writable: true })
    let ok = false
    act(() => {
      ok = result.current.restoreSavedPosition()
    })
    expect(ok).toBe(true)
    expect(el.scrollTop).toBe(1100)
    expect(result.current.isAtBottom).toBe(false)
  })

  it("resetSavedPosition evita restaurar una posición vieja", () => {
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 1100, clientHeight: 500 })
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref, { persistKey: "mem-reset-1" }))
    act(() => result.current.resetSavedPosition())
    // Entrada fresca tras el reset: la memoria quedó en 0.
    expect(resolveSessionEntry("mem-reset-1")).toEqual({ kind: "fresh" })
    expect(resolveSessionEntry("mem-reset-1")).toEqual({ kind: "fresh" })
  })

  it("restaurar al fondo confirma memoria en 0 (anti-stale tras tab/minimizar)", () => {
    // Leyendo a mitad: dist 500 → queda en memoria.
    const el = makeContainer({ scrollHeight: 2000, scrollTop: 1000, clientHeight: 500 })
    const ref = { current: el } as any
    const { result } = renderHook(() => useFollowTail(ref, { persistKey: "mem-confirm-1" }))
    expect(resolveSessionEntry("mem-confirm-1")).toEqual({ kind: "return", dist: 500 })
    // Vuelta con snap al fondo (p. ej. reassert tras compaction/revert que
    // acortó el chat): la memoria debe fijarse en 0 para que la próxima
    // entrada no restaure la mitad vieja.
    let ok = false
    act(() => {
      ok = result.current.restoreSavedPosition({ dist: 0, ts: Date.now() })
    })
    expect(ok).toBe(true)
    expect(el.scrollTop).toBe(2000)
    expect(resolveSessionEntry("mem-confirm-1")).toEqual({ kind: "fresh" })
  })
})

describe("anchorScrollToSaved (ancla por mensaje)", () => {
  beforeEach(() => {
    __clearScrollMemory()
    sessionStorage.clear()
  })
  function makeAnchored() {
    const el = document.createElement("div") as any
    Object.defineProperties(el, {
      scrollHeight: { value: 8000, writable: true },
      scrollTop: { value: 0, writable: true },
      clientHeight: { value: 500, writable: true },
    })
    el.getBoundingClientRect = () => ({ top: 100, bottom: 600, left: 0, right: 300, width: 300, height: 500, x: 100, y: 100, toJSON: () => ({}) })
    const msg = document.createElement("div")
    msg.setAttribute("data-message-id", "m-abc")
    // Mensaje 200px bajo el top del contenedor.
    msg.getBoundingClientRect = () => ({ top: 300, bottom: 420, left: 0, right: 300, width: 300, height: 120, x: 0, y: 300, toJSON: () => ({}) })
    el.appendChild(msg)
    return { el, msg }
  }

  it("prioriza el mensaje sobre la distancia (streaming creció abajo)", () => {
    const { el } = makeAnchored()
    // Guardado: offset 200; ahora el chat creció 6000px abajo → la distancia
    // vieja apuntaría a otro lado, el mensaje no.
    const ok = anchorScrollToSaved(el, { dist: 50, mid: "m-abc", moff: 200 })
    expect(ok).toBe(true)
    // msgTop(300) - cTop(100) = 200; target = 0 + 200 - 200 = 0.
    expect(el.scrollTop).toBe(0)
  })

  it("compensa el crecimiento: mismo mensaje, misma posición visual", () => {
    const { el } = makeAnchored()
    // scrollTop actual 1000 con el mensaje a 200 del top → mover a offset 60.
    Object.defineProperty(el, "scrollTop", { value: 1000, writable: true })
    const ok = anchorScrollToSaved(el, { dist: 9999, mid: "m-abc", moff: 60 })
    expect(ok).toBe(true)
    // target = 1000 + (300-100) - 60 = 1140.
    expect(el.scrollTop).toBe(1140)
  })

  it("mensaje inexistente → fallback por distancia", () => {
    const { el } = makeAnchored()
    const ok = anchorScrollToSaved(el, { dist: 400, mid: "no-existe", moff: 0 })
    expect(ok).toBe(true)
    expect(el.scrollTop).toBe(8000 - 500 - 400)
  })

  it("distancia mayor que el contenido → false sin clavar arriba (regresión 'entra arriba')", () => {
    const { el } = makeAnchored()
    Object.defineProperty(el, "scrollTop", { value: 1234, writable: true })
    // Memoria envenenada: 12000px del fondo cuando el contenido solo tiene 7500.
    const ok = anchorScrollToSaved(el, { dist: 12000, mid: "no-existe", moff: 0 })
    expect(ok).toBe(false)
    // No debe tocar la posición (el llamador decide: entrada → fondo).
    expect(el.scrollTop).toBe(1234)
  })
})

describe("canPersistRef: no envenenar la memoria con datos stale", () => {
  beforeEach(() => {
    __clearScrollMemory()
    sessionStorage.clear()
  })
  function makeContainer(overrides: Partial<{ scrollHeight: number; scrollTop: number; clientHeight: number }> = {}) {
    const el = document.createElement("div") as any
    Object.defineProperties(el, {
      scrollHeight: { value: overrides.scrollHeight ?? 2000, writable: true },
      scrollTop: { value: overrides.scrollTop ?? 0, writable: true },
      clientHeight: { value: overrides.clientHeight ?? 500, writable: true },
    })
    if (!el.scrollTo) el.scrollTo = () => {}
    return el
  }

  it("con la puerta cerrada (stale/settling) no se guarda; al abrir sí", () => {
    // Geometría del chat ANTERIOR montado bajo la sesión nueva (stale).
    const el = makeContainer({ scrollHeight: 9000, scrollTop: 0, clientHeight: 500 })
    const ref = { current: el } as any
    const gate = { current: false }
    renderHook(() => useFollowTail(ref, { persistKey: "gate-stale-1", canPersistRef: gate }))
    // La lectura inicial stale quedó descartada.
    expect(resolveSessionEntry("gate-stale-1")).toEqual({ kind: "fresh" })
    // Llegan los mensajes frescos y termina el asentamiento: se abre la puerta.
    act(() => {
      gate.current = true
      Object.defineProperty(el, "scrollTop", { value: 7900, writable: true }) // dist 600
      el.dispatchEvent(new Event("scroll"))
    })
    expect(resolveSessionEntry("gate-stale-1")).toEqual({ kind: "return", dist: 600, mid: undefined, moff: undefined })
  })
})
