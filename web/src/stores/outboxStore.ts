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
  /** Envío en curso: editar/eliminar están deshabilitados (no se pierde ni duplica). */
  disabled?: boolean
}

// Persistencia: la cola visible debe sobrevivir a reinicio/cierre de la app
// (pedido explícito). localStorage crudo (precedente: el draft del composer en
// useMessages; NO entra en STORAGE_KEYS porque su test pinea el set en 19).
const OUTBOX_STORAGE_KEY = "opencode.remote.outbox"
// Tope: la cuota típica de localStorage es ~5MB; si no entra con imágenes,
// se guardan solo los textos (mejor cola sin fotos que cola perdida).
const OUTBOX_PERSIST_MAX = 1_500_000

export function isValidOutboxItem(v: unknown): v is OutboxItem {
  const o = v as Partial<OutboxItem> | null
  return (
    !!o &&
    typeof o.id === "string" &&
    typeof o.sessionID === "string" &&
    typeof o.text === "string" &&
    typeof o.createdAt === "number" &&
    (!o.images || Array.isArray(o.images))
  )
}

/** JSON seguro para localStorage: valida shape y acota el tamaño. Devuelve
 * `null` sólo si ni siquiera los textos entran; en ese caso el caller NO toca
 * la key (conservar el último snapshot vale más que borrar la cola entera). */
export function serializeOutbox(items: readonly OutboxItem[]): string | null {
  try {
    const clean = items.filter(isValidOutboxItem)
    const full = JSON.stringify(clean)
    if (full.length <= OUTBOX_PERSIST_MAX) return full
    const textOnly = JSON.stringify(
      clean.map(({ id, sessionID, text, createdAt }) => ({ id, sessionID, text, createdAt })),
    )
    return textOnly.length <= OUTBOX_PERSIST_MAX ? textOnly : null
  } catch {
    return null
  }
}

/** Lee la cola persistida; cualquier JSON corrupto vuelve a cola vacía. */
export function parsePersistedOutbox(raw: string | null): OutboxItem[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter(isValidOutboxItem)
  } catch {
    return []
  }
}

function loadPersisted(): OutboxItem[] {
  try {
    return parsePersistedOutbox(localStorage.getItem(OUTBOX_STORAGE_KEY))
  } catch {
    return []
  }
}

function persistOutbox(items: readonly OutboxItem[]): void {
  try {
    const serialized = serializeOutbox(items)
    // null = ni los textos entran en el tope: no se borra la key (se conserva
    // el último snapshot persistido en vez de perder la cola completa).
    if (serialized !== null) localStorage.setItem(OUTBOX_STORAGE_KEY, serialized)
  } catch {
    /* storage lleno o bloqueado: la cola sigue viva en memoria */
  }
}

const outboxStore = createStore<OutboxItem[]>(loadPersisted())

/** Escritura única de la cola: notifica listeners Y persiste en el mismo paso. */
function setOutbox(next: (prev: OutboxItem[]) => OutboxItem[]): void {
  const before = outboxStore.get()
  outboxStore.set((prev) => next(prev))
  const after = outboxStore.get()
  // Persiste sólo writes reales (Object.is vive en el set; un no-op no debe
  // reescribir la key).
  if (!Object.is(before, after)) persistOutbox(after)
}

// Limitación conocida (documentada): dos contextos del MISMO origin (app
// desktop + pestaña en :4848) comparten la key con last-writer-wins y cada
// uno tiene su propio `sending` — el caso de uso real es UNA instancia visible
// a la vez; sincronizar colas cross-contexto necesitaría storage/BroadcastChannel
// con merge, fuera de este alcance.
const sending = new Set<string>()
// Vista reactiva del vuelo para React: los botones editar/eliminar se
// deshabilitan mientras el item está siendo enviado (sin esto, "editar"
// duplicaba y "eliminar" no cancelaba un envío en curso).
const sendingStore = createStore<string[]>([])

function markSending(id: string): void {
  sending.add(id)
  sendingStore.set((prev) => (prev.includes(id) ? prev : [...prev, id]))
}

function unmarkSending(id: string): void {
  sending.delete(id)
  sendingStore.set((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : prev))
}

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

/** Suscripción React: ids de la cola que están EN VUELO (claim tomado). */
export function useSharedOutboxSending(): string[] {
  return useStore(sendingStore)
}

/** `true` si el item está reservado por un flush/botón (envío en curso). */
export function isSharedOutboxSending(id: string): boolean {
  return sending.has(id)
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
  setOutbox((prev) => [...prev, item])
  return item
}

export function removeSharedOutbox(id: string): void {
  unmarkSending(id)
  setOutbox((prev) => (prev.some((o) => o.id === id) ? prev.filter((o) => o.id !== id) : prev))
}

/** Reserva un item para enviarlo; false si otro flush/botón ya lo tomó. */
export function claimSharedOutbox(id: string): boolean {
  if (sending.has(id)) return false
  if (!outboxStore.get().some((o) => o.id === id)) return false
  markSending(id)
  return true
}

export function releaseSharedOutbox(id: string): void {
  unmarkSending(id)
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
