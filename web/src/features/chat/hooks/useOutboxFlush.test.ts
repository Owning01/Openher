import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useOutboxFlush } from "./useOutboxFlush"
import * as outboxStore from "../../../stores/outboxStore"
import { holdSharedOutbox, resumeSharedOutbox } from "../../../hooks/useMessages"

// Q2 (cola visible): el flush automatico reclama el item, respeta el hold tras
// Stop y aplica el cooldown de 4s entre reintentos. Semantica intacta tras C3.

const SID = "sess-flush"
const clearStore = () => {
  for (const o of outboxStore.getSharedOutbox()) outboxStore.removeSharedOutbox(o.id)
  resumeSharedOutbox(SID)
}

beforeEach(() => {
  clearStore()
  vi.restoreAllMocks()
})
afterEach(() => {
  clearStore()
  vi.restoreAllMocks()
})

describe("useOutboxFlush", () => {
  it("envia el pendiente mas antiguo cuando no esta trabajando", async () => {
    outboxStore.enqueueSharedOutbox(SID, "uno")
    const sendItem = vi.fn(async () => true)
    const removeOutbox = vi.fn()
    const view = renderHook((p) => useOutboxFlush(p), {
      initialProps: { sessionID: SID, outbox: outboxStore.getSharedOutbox(), isWorking: false, removeOutbox, sendItem },
    })
    await act(async () => {})
    expect(sendItem).toHaveBeenCalledTimes(1)
    expect(sendItem.mock.calls[0][0].text).toBe("uno")
    // Exito: el item sale de la cola.
    expect(removeOutbox).toHaveBeenCalledTimes(1)
    expect(removeOutbox.mock.calls[0][0]).toBe(sendItem.mock.calls[0][0].id)
    view.unmount()
  })

  it("no envia si la sesion esta ocupada (evita el bucle de re-encolado)", async () => {
    outboxStore.enqueueSharedOutbox(SID, "uno")
    const sendItem = vi.fn(async () => true)
    renderHook((p) => useOutboxFlush(p), {
      initialProps: { sessionID: SID, outbox: outboxStore.getSharedOutbox(), isWorking: true, removeOutbox: vi.fn(), sendItem },
    })
    await act(async () => {})
    expect(sendItem).not.toHaveBeenCalled()
  })

  it("no envia con la cola en hold tras un Stop explicito", async () => {
    holdSharedOutbox(SID)
    outboxStore.enqueueSharedOutbox(SID, "uno")
    const sendItem = vi.fn(async () => true)
    renderHook((p) => useOutboxFlush(p), {
      initialProps: { sessionID: SID, outbox: outboxStore.getSharedOutbox(), isWorking: false, removeOutbox: vi.fn(), sendItem },
    })
    await act(async () => {})
    expect(sendItem).not.toHaveBeenCalled()
  })

  it("aplica cooldown de 4s tras un fallo y reintenta despues", async () => {
    outboxStore.enqueueSharedOutbox(SID, "uno")
    let now = 1_000_000
    vi.spyOn(Date, "now").mockImplementation(() => now)
    const sendItem = vi.fn(async () => false)
    const props = { sessionID: SID, outbox: outboxStore.getSharedOutbox(), isWorking: false, removeOutbox: vi.fn(), sendItem }
    const view = renderHook((p) => useOutboxFlush(p), { initialProps: props })
    await act(async () => {})
    expect(sendItem).toHaveBeenCalledTimes(1)

    // Dentro del cooldown, aunque la sesion vuelva a quedar libre, no reintenta.
    await act(async () => { view.rerender({ ...props }) })
    await act(async () => {})
    expect(sendItem).toHaveBeenCalledTimes(1)

    // Pasado el cooldown, reintenta.
    now += 4_001
    await act(async () => { view.rerender({ ...props }) })
    await act(async () => {})
    expect(sendItem).toHaveBeenCalledTimes(2)
    view.unmount()
  })
})
