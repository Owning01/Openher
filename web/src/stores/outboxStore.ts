import { createStore, useStore } from "../shared/lib/store"
import { buildUserMessage } from "../utils/messageShape"
import type { MessageEnvelope } from "../types"

// Cola visible de salida: mensajes enviados mientras el agente está ocupado.
// Aparecen en el chat como usuario pendiente (sin enviar) con acciones
// eliminar / editar / enviar-ahora. Por sesión; se filtran al renderizar.
//
// La cola pertenece a la SESIÓN, no a la instancia del hook: cada panel del
// desktop y la vista detalle/móvil tienen su propio useMessages, y con un
// useState por instancia el mensaje encolado quedaba huérfano al cambiar de
// pestaña (invisible en su sesión pero auto-enviándose igual) o se perdía al
// desmontar. Este store de módulo lo comparte todo; `claimSharedOutbox`
// evita que el flush del panel y el global envíen el mismo item dos veces.
//
// (Onda 3 / B2: extraído desde hooks/useMessages.ts sobre el primitivo
// shared/lib/store. Semántica intacta: mismo orden, mismo claim, mismo hold;
// useMessages re-exporta la API para sus consumidores.)
export type OutboxItem = {
  id: string
  sessionID: string
  text: string
  images?: Array<{ base64: string; mime: string; name?: string }>
  createdAt: number
}

export type OutboxActions = {
  onDelete: () => void
  onEdit: () => void
  onSendNow: () => void
}

const outboxStore = createStore<OutboxItem[]>([])
const sending = new Set<string>()

// El store notifica a los listeners sin aislar errores; el emit original
// atrapaba el throw de un listener para no tumbar a los demás. Se conserva
// envolviendo cada alta.
export function subscribeSharedOutbox(fn: () => void): () => void {
  return outboxStore.subscribe(() => {
    try { fn() } catch { /* un listener roto no tumba a los demás */ }
  })
}

export function getSharedOutbox(): OutboxItem[] {
  return outboxStore.get()
}

/** Suscripción React a la cola compartida (misma que el `useSyncExternalStore` previo). */
export function useSharedOutbox(): OutboxItem[] {
  return useStore(outboxStore)
}

export function enqueueSharedOutbox(sessionID: string, text: string, images?: OutboxItem["images"]): OutboxItem {
  const item: OutboxItem = {
    id: `outbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sessionID,
    text,
    images: images && images.length > 0 ? images : undefined,
    createdAt: Date.now(),
  }
  outboxStore.set((prev) => [...prev, item])
  return item
}

export function removeSharedOutbox(id: string): void {
  sending.delete(id)
  outboxStore.set((prev) => (prev.some((o) => o.id === id) ? prev.filter((o) => o.id !== id) : prev))
}

/** Reserva un item para enviarlo; false si otro flush/botón ya lo tomó. */
export function claimSharedOutbox(id: string): boolean {
  if (sending.has(id)) return false
  if (!outboxStore.get().some((o) => o.id === id)) return false
  sending.add(id)
  return true
}

export function releaseSharedOutbox(id: string): void {
  sending.delete(id)
}

// Hold del auto-flush: tras un Stop explícito NO se auto-envían los pendientes
// (el usuario cortó a propósito; si no, el abort parecía "no hacer nada"
// porque el flush arrancaba otro turno al instante). Se reanuda al mandar algo
// manualmente o al tocar "Enviar ahora".
const sharedOutboxHold = new Set<string>()
export function holdSharedOutbox(sessionID: string): void {
  sharedOutboxHold.add(sessionID)
}
export function resumeSharedOutbox(sessionID: string): void {
  sharedOutboxHold.delete(sessionID)
}
export function isSharedOutboxHeld(sessionID: string): boolean {
  return sharedOutboxHold.has(sessionID)
}

export function buildOutboxMessage(item: OutboxItem): MessageEnvelope {
  return buildUserMessage({
    id: item.id,
    sessionID: item.sessionID,
    text: item.text,
    images: item.images,
    createdAt: item.createdAt,
  })
}
