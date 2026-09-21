import { useEffect, useRef } from "react"
import { claimSharedOutbox, releaseSharedOutbox, isSharedOutboxHeld } from "../../../hooks/useMessages"
import type { OutboxItem } from "../../../stores/outboxStore"

export type UseOutboxFlushParams = {
  sessionID: string
  outbox: OutboxItem[]
  /** La sesion esta ocupada: no auto-enviar (evita el bucle de re-encolado). */
  isWorking: boolean
  removeOutbox: (id: string) => void
  /** Envia el item con `force=true`: el que llama decide el literal del envio. */
  sendItem: (item: OutboxItem) => unknown
}

/**
 * C3: auto-flush de la cola visible (claim compartido + cooldown 4s + hold
 * tras Stop). Extraido 1:1 del efecto que vivia en SessionChatPanel; la
 * semantica del outbox no cambia:
 * - no correr con la sesion ocupada (si no `handleSend` re-encola y cada
 *   render duplica el pendiente);
 * - `isSharedOutboxHeld` bloquea tras un Stop explicito;
 * - cooldown de 4s para fallos repetidos;
 * - claim compartido: otro panel/vista de la misma sesion pudo tomarlo.
 */
export function useOutboxFlush({ sessionID, outbox, isWorking, removeOutbox, sendItem }: UseOutboxFlushParams) {
  const flushingRef = useRef(false)
  const flushLastTryRef = useRef(0)
  useEffect(() => {
    if (isWorking || flushingRef.current) return
    if (isSharedOutboxHeld(sessionID)) return
    if (Date.now() - flushLastTryRef.current < 4_000) return
    const next = outbox.find((o) => o.sessionID === sessionID)
    if (!next || !claimSharedOutbox(next.id)) return
    flushLastTryRef.current = Date.now()
    flushingRef.current = true
    void Promise.resolve(sendItem(next)).then((res) => {
      if (res !== false) removeOutbox(next.id)
      else releaseSharedOutbox(next.id)
    }).catch(() => releaseSharedOutbox(next.id)).finally(() => {
      flushingRef.current = false
    })
  })
}
