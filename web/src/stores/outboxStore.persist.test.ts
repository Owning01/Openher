import { describe, it, expect, vi, beforeEach } from "vitest"
import {
  serializeOutbox,
  parsePersistedOutbox,
  isValidOutboxItem,
  enqueueSharedOutbox,
  removeSharedOutbox,
  claimSharedOutbox,
  releaseSharedOutbox,
  getSharedOutbox,
  isSharedOutboxSending,
  type OutboxItem,
} from "./outboxStore"

// La cola visible debe sobrevivir a reinicio/cierre de la app (localStorage)
// y el estado de vuelo (claim) debe reflejarse en isSharedOutboxSending para
// que editar/eliminar se deshabiliten durante un envío en curso.

const item = (over: Partial<OutboxItem> = {}): OutboxItem => ({
  id: "outbox-1",
  sessionID: "sess-p",
  text: "hola",
  createdAt: 1_700_000_000_000,
  ...over,
})

beforeEach(() => {
  localStorage.clear()
  for (const o of getSharedOutbox()) removeSharedOutbox(o.id)
})

describe("persistencia del outbox (serialize/parse)", () => {
  it("roundtrip con imágenes", () => {
    const items = [item({ images: [{ base64: "AAA", mime: "image/png", name: "a.png" }] })]
    const restored = parsePersistedOutbox(serializeOutbox(items))
    expect(restored).toHaveLength(1)
    expect(restored[0].images?.[0].name).toBe("a.png")
    expect(restored[0].text).toBe("hola")
  })

  it("JSON corrupto o no-array vuelve a cola vacía (nunca lanza)", () => {
    expect(parsePersistedOutbox("no-json{")).toEqual([])
    expect(parsePersistedOutbox('{"a":1}')).toEqual([])
    expect(parsePersistedOutbox(null)).toEqual([])
  })

  it("filtra items con shape inválido y conserva los válidos", () => {
    const raw = JSON.stringify([item(), { id: 1, sessionID: "x" }, null, item({ id: "outbox-2" })])
    const restored = parsePersistedOutbox(raw)
    expect(restored.map((r) => r.id)).toEqual(["outbox-1", "outbox-2"])
    expect(isValidOutboxItem({ id: "a", sessionID: "b", text: "c", createdAt: 1 })).toBe(true)
    expect(isValidOutboxItem({ id: "a" })).toBe(false)
  })

  it("si no entra con imágenes, persiste solo los textos", () => {
    const big = item({ id: "outbox-big", text: "x", images: [{ base64: "A".repeat(2_000_000), mime: "image/png", name: "g.png" }] })
    const serialized = serializeOutbox([big])
    expect(serialized).not.toBeNull()
    const restored = parsePersistedOutbox(serialized!)
    expect(restored).toHaveLength(1)
    expect(restored[0].text).toBe("x")
    expect(restored[0].images).toBeUndefined()
  })

  it("enqueue persiste en localStorage y remove limpia", () => {
    const o = enqueueSharedOutbox("sess-persist", "para el reinicio", undefined)
    const raw = localStorage.getItem("opencode.remote.outbox")
    expect(raw).not.toBeNull()
    expect(parsePersistedOutbox(raw!).map((x) => x.id)).toContain(o.id)
    removeSharedOutbox(o.id)
    expect(parsePersistedOutbox(localStorage.getItem("opencode.remote.outbox"))).toEqual([])
  })

  it("quota: si setItem lanza, enqueue no revienta y la cola sigue viva", () => {
    const spy = vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError")
    })
    let item: OutboxItem | undefined
    expect(() => {
      item = enqueueSharedOutbox("sess-quota", "sin storage", undefined)
    }).not.toThrow()
    expect(item).toBeDefined()
    // La cola en memoria/proceso sigue funcionando (get + claim + remove).
    expect(getSharedOutbox().some((o) => o.id === item!.id)).toBe(true)
    removeSharedOutbox(item!.id)
    spy.mockRestore()
  })

  it("si ni textos caben en el tope, NO se borra la key (se conserva el último snapshot)", () => {
    const small = enqueueSharedOutbox("sess-tope", "chiquito", undefined)
    const before = localStorage.getItem("opencode.remote.outbox")
    expect(before).not.toBeNull()
    // Item gigante: ni full ni text-only entran en OUTBOX_PERSIST_MAX (1.5MB).
    enqueueSharedOutbox("sess-tope", "G".repeat(1_600_000), undefined)
    const after = localStorage.getItem("opencode.remote.outbox")
    // La key NO desaparece ni se vacía: conserva el último snapshot válido.
    expect(after).not.toBeNull()
    expect(parsePersistedOutbox(after!).map((x) => x.text)).toContain("chiquito")
    removeSharedOutbox(small.id)
    for (const o of getSharedOutbox()) removeSharedOutbox(o.id)
  })
})

describe("estado de vuelo (sending) para los botones", () => {
  it("claim marca en vuelo; release y remove lo liberan", () => {
    const o = enqueueSharedOutbox("sess-vuelo", "en vuelo", undefined)
    expect(isSharedOutboxSending(o.id)).toBe(false)
    expect(claimSharedOutbox(o.id)).toBe(true)
    expect(isSharedOutboxSending(o.id)).toBe(true)
    // Segundo claim (otro flush/botón) no lo toma.
    expect(claimSharedOutbox(o.id)).toBe(false)
    releaseSharedOutbox(o.id)
    expect(isSharedOutboxSending(o.id)).toBe(false)
    // remove también limpia el mark (item eliminado durante vuelo no queda huérfano).
    claimSharedOutbox(o.id)
    removeSharedOutbox(o.id)
    expect(isSharedOutboxSending(o.id)).toBe(false)
    expect(claimSharedOutbox(o.id)).toBe(false)
  })
})
