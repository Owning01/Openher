import { describe, it, expect } from "vitest"
import {
  enqueueSharedOutbox,
  removeSharedOutbox,
  claimSharedOutbox,
  releaseSharedOutbox,
  holdSharedOutbox,
  resumeSharedOutbox,
  isSharedOutboxHeld,
} from "./useMessages"

// La cola visible pertenece a la SESIÓN y se comparte entre todas las
// instancias del hook (paneles desktop + vista detalle/móvil). Estos tests
// cubren el contrato del store: visibilidad compartida y claim anti-doble-envío.
describe("shared outbox", () => {
  it("encola y elimina por id", () => {
    const item = enqueueSharedOutbox("sess-a", "hola", undefined)
    expect(item.sessionID).toBe("sess-a")
    expect(item.text).toBe("hola")
    // El claim funciona sobre un item existente…
    expect(claimSharedOutbox(item.id)).toBe(true)
    // …y se libera al eliminarlo.
    removeSharedOutbox(item.id)
    expect(claimSharedOutbox(item.id)).toBe(false)
  })

  it("el claim evita que dos flush tomen el mismo item", () => {
    const item = enqueueSharedOutbox("sess-b", "doble?", undefined)
    expect(claimSharedOutbox(item.id)).toBe(true)
    // Segundo flush (otro panel/vista de la misma sesión) debe desistir.
    expect(claimSharedOutbox(item.id)).toBe(false)
    releaseSharedOutbox(item.id)
    expect(claimSharedOutbox(item.id)).toBe(true)
    removeSharedOutbox(item.id)
  })

  it("no se puede reservar un id inexistente", () => {
    expect(claimSharedOutbox("outbox-inexistente")).toBe(false)
  })

  it("items de distintas sesiones coexisten", () => {
    const a = enqueueSharedOutbox("sess-1", "para uno", undefined)
    const b = enqueueSharedOutbox("sess-2", "para otro", undefined)
    expect(a.id).not.toBe(b.id)
    expect(claimSharedOutbox(a.id)).toBe(true)
    // El de la otra sesión sigue libre.
    expect(claimSharedOutbox(b.id)).toBe(true)
    removeSharedOutbox(a.id)
    removeSharedOutbox(b.id)
  })

  it("hold tras Stop se reanuda con resume", () => {
    expect(isSharedOutboxHeld("sess-stop")).toBe(false)
    holdSharedOutbox("sess-stop")
    expect(isSharedOutboxHeld("sess-stop")).toBe(true)
    // Solo afecta a esa sesión.
    expect(isSharedOutboxHeld("sess-otra")).toBe(false)
    resumeSharedOutbox("sess-stop")
    expect(isSharedOutboxHeld("sess-stop")).toBe(false)
  })
})
