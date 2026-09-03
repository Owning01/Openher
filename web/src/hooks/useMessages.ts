import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import type { ServerConfig, DataMode, MessageEnvelope, ModelSelection, RenderedMessage, SessionView } from "../types"
import { api } from "../api"
import { parseCommand, resolveCommand, buildOptimisticMessage, buildStatusMessage } from "../utils/parseCommand"
import { computeRenderedMessages } from "../utils/rendered"
import { isImagePart, countImageParts } from "../utils"
import { formatServerError } from "../shared/errors/serverErrors"

const toolPartTypes = new Set(["tool_use", "tool_result", "tool", "execution", "terminal", "code_execution", "tool_call"])

// Tools de archivos y de terminal: se conservan en modos ahorro para mostrar
// los cambios (+N/−M) y los comandos ejecutados (bash/terminal); el diff
// completo vive en el resumen final.
const fileToolNames = new Set(["write", "edit", "apply_patch", "patch"])
const shellToolNames = new Set(["bash", "execute", "terminal", "shell", "pwsh", "cmd"])

const COMPOSER_STORAGE_KEY = "opencode.remote.composer"

// Translation originals: maps message ID → original (pre-translation) text.
// Populated when TSL is active and a message is sent.
// CAP FIFO: map module-level vivo toda la sesión — sin tope, crece eterno.
const TRANSLATION_ORIGINALS_CAP = 200
const translationOriginals = new Map<string, string>()
export function getTranslationOriginal(id: string): string | undefined {
  return translationOriginals.get(id)
}
export function setTranslationOriginal(id: string, text: string) {
  if (!translationOriginals.has(id) && translationOriginals.size >= TRANSLATION_ORIGINALS_CAP) {
    const oldest = translationOriginals.keys().next().value
    if (oldest !== undefined) translationOriginals.delete(oldest)
  }
  translationOriginals.set(id, text)
}

function extractText(msg: MessageEnvelope): string {
  const blocks: string[] = []
  for (const part of msg.parts) {
    if (!part.text) continue
    if (part.type === "text" || part.type === "compaction") {
      blocks.push(part.text)
    }
  }
  return blocks.join("\n\n").trim()
}

function stripNonEssential(msg: MessageEnvelope, dataMode?: DataMode): MessageEnvelope {
  if (dataMode === "full" || dataMode === "saver") return msg
  const keep = (p: MessageEnvelope["parts"][number]) =>
    p.type === "compaction" || p.type === "reasoning" || p.type === "thinking" ||
    !toolPartTypes.has(p.type) || (typeof p.tool === "string" && (fileToolNames.has(p.tool) || shellToolNames.has(p.tool)))
  const filtered = msg.parts.filter(keep)
  return filtered.length === msg.parts.length ? msg : { ...msg, parts: filtered }
}

// Cola visible de salida: mensajes enviados mientras el agente está ocupado.
// Aparecen en el chat como usuario pendiente (sin enviar) con acciones
// eliminar / editar / enviar-ahora. Por sesión; se filtran al renderizar.
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

function buildOutboxMessage(item: OutboxItem): MessageEnvelope {
  const parts: MessageEnvelope["parts"] = item.text
    ? [{ id: `${item.id}-part`, type: "text", text: item.text }]
    : []
  let n = 0
  for (const img of item.images ?? []) {
    parts.push({ id: `${item.id}-img-${n++}`, type: "image", data: img.base64, mimeType: img.mime })
  }
  return {
    info: { id: item.id, role: "user", sessionID: item.sessionID, time: { created: item.createdAt } },
    parts,
  }
}

export function useMessages(config: ServerConfig, dataMode?: DataMode, storageKey = COMPOSER_STORAGE_KEY) {
  const [messages, setMessages] = useState<MessageEnvelope[]>([])
  const [optimisticUserMessages, setOptimisticUserMessages] = useState<MessageEnvelope[]>([])
  const [outbox, setOutbox] = useState<OutboxItem[]>([])
  const enqueueOutbox = useCallback((sessionID: string, text: string, images?: OutboxItem["images"]) => {
    const item: OutboxItem = {
      id: `outbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sessionID,
      text,
      images: images && images.length > 0 ? images : undefined,
      createdAt: Date.now(),
    }
    setOutbox((prev) => [...prev, item])
    return item
  }, [])
  const removeOutbox = useCallback((id: string) => {
    setOutbox((prev) => (prev.some((o) => o.id === id) ? prev.filter((o) => o.id !== id) : prev))
  }, [])
  const [composer, setComposer] = useState(() => localStorage.getItem(storageKey) ?? "")
  const [awaitingAssistantReply, setAwaitingAssistantReply] = useState(false)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  // Compacting por sesión: usa Set para no filtrar estado entre sesiones.
  // Antes era boolean global → al cambiar de sesión la otra aparecía como
  // "Compacting" aunque no lo estuviera. Ahora se rastrea por sessionID.
  const [compactingIds, setCompactingIds] = useState<Set<string>>(() => new Set())
  const compactingIdsRef = useRef(compactingIds)
  useEffect(() => { compactingIdsRef.current = compactingIds }, [compactingIds])
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const compacting = useMemo(() => currentSessionId ? compactingIds.has(currentSessionId) : false, [compactingIds, currentSessionId])
  const setCompacting = useCallback((value: boolean, sessionID?: string) => {
    const sid = sessionID ?? currentSessionId ?? loadedSessionIDRef.current
    if (!sid) return
    setCompactingIds((prev) => {
      const next = new Set(prev)
      if (value) next.add(sid)
      else next.delete(sid)
      return next
    })
  }, [currentSessionId])

  const composerRef = useRef(composer)
  composerRef.current = composer
  // NOTA: sin intervalo de persistencia. El Composer persiste su draft por
  // tecla en su key por sesión (composerDraft.ts): un intervalo con la key
  // vieja pisaría el draft de otra sesión al cambiar de chat.

  const loadSelectedRequestRef = useRef(0)
  const awaitingAssistantBaselineRef = useRef("")
  const completionShouldPlayRef = useRef(false)
  const isSendingRef = useRef(false)
  const [isSending, setIsSending] = useState(false)
  const awaitingAssistantReplyRefInner = useRef(false)
  useEffect(() => { awaitingAssistantReplyRefInner.current = awaitingAssistantReply }, [awaitingAssistantReply])
  // Sesión que el estado `messages` representa. Guard contra races: los deltas
  // de otra sesión (que el SSE puede entregar durante una transición de sesión)
  // se rechazan si no coinciden con la sesión cargada.
  const loadedSessionIDRef = useRef<string | null>(null)
  // Ancla partID → mensaje del PADRE para tool parts de subagentes (task): el
  // server los emite con sessionID/messageID de la sesión HIJA; la tarjeta se
  // materializa en el mensaje assistant del padre que los desplegó. El partID
  // se conserva entre updates (running→completed), así el ancla es estable.
  const subagentAnchorRef = useRef<Map<string, { sessionID: string; messageID: string }>>(new Map())
  // Caché de RenderedMessage por id de mensaje fuente (ver renderedMessages):
  // los deltas solo invalidan el mensaje tocado; el resto reusa su objeto y
  // las bubbles memoizadas no re-renderizan.
  const renderedCacheRef = useRef<Map<string, { src: MessageEnvelope; rendered: RenderedMessage; diffs?: import("../types").FileDiff[]; turnMode?: string; dataMode?: DataMode }>>(new Map())

  // ---- Batch de deltas SSE por frame ----
  // Cada `message.part.delta` llega por separado y hoy disparaba un
  // setMessages (y un re-render de la lista) por delta. El server puede
  // emitir decenas de deltas/segundo; se encolan y se aplican con UN solo
  // setMessages por requestAnimationFrame (máx. 60 renders/s, agrupando el
  // trabajo). Al desmontar se drena lo pendiente de forma síncrona para no
  // perder el último tramo del stream.
  const messageBatchRef = useRef<Array<{ sid: string | null; patch: (prev: MessageEnvelope[]) => MessageEnvelope[] }>>([])
  const batchFrameRef = useRef<number | null>(null)
  const batchMountedRef = useRef(true)

  const flushMessageBatch = useCallback(() => {
    batchFrameRef.current = null
    if (messageBatchRef.current.length === 0) return
    const batch = messageBatchRef.current
    messageBatchRef.current = []
    setMessages((prev) => {
      const loaded = loadedSessionIDRef.current
      // Patch encolado para una sesión distinta a la cargada = raza de switch:
      // llegó tarde y ya fue purgada por loadSelected. Descartarlo, nunca
      // re-inyectarlo (era la ventana que mostraba el chat del otro).
      return batch.reduce((acc, entry) => entry.sid && loaded && entry.sid !== loaded ? acc : entry.patch(acc), prev)
    })
  }, [])

  const queueMessageUpdate = useCallback((patch: (prev: MessageEnvelope[]) => MessageEnvelope[], sid: string | null = null, immediate = false) => {
    if (immediate) {
      setMessages((prev) => {
        const loaded = loadedSessionIDRef.current
        if (sid && loaded && sid !== loaded) return prev
        return patch(prev)
      })
      return
    }
    messageBatchRef.current.push({ sid, patch })
    if (batchFrameRef.current === null && batchMountedRef.current) {
      batchFrameRef.current = requestAnimationFrame(flushMessageBatch)
    }
  }, [flushMessageBatch])

  useEffect(() => {
    batchMountedRef.current = true
    return () => {
      batchMountedRef.current = false
      if (batchFrameRef.current !== null) cancelAnimationFrame(batchFrameRef.current)
      batchFrameRef.current = null
      // Drenar pendientes síncronamente: el desmontaje no pierde el stream.
      if (messageBatchRef.current.length > 0) {
        const batch = messageBatchRef.current
        messageBatchRef.current = []
        setMessages((prev) => {
          const loaded = loadedSessionIDRef.current
          return batch.reduce((acc, entry) => entry.sid && loaded && entry.sid !== loaded ? acc : entry.patch(acc), prev)
        })
      }
    }
  }, [])

  const renderedMessages: RenderedMessage[] = useMemo(() => {
    // Optimización: si no hay optimistas ni outbox pendientes, skip el trabajo pesado
    let merged: MessageEnvelope[]
    if (optimisticUserMessages.length === 0 && outbox.length === 0) {
      merged = messages
    } else {
      // Fix: no filtrar optimistas por texto contra todo el historial — eso
      // ocultaba "hola" x2 cuando ya existía un "hola" antiguo y el nuevo
      // parecía duplicado. Solo filtrar por id (nunca coincide, id local vs
      // server) y dejar que loadSelected haga el dedupe por texto al confirmar.
      // Así el mensaje se ve al instante incluso si el texto ya existe.
      const existingIds = new Set(messages.map((m) => m.info.id))
      const pendingOptimistic = optimisticUserMessages.filter((opt) => !existingIds.has(opt.info.id))
      // Outbox: solo la sesión cargada (los de otras sesiones esperan su panel).
      const loaded = loadedSessionIDRef.current ?? messages[0]?.info.sessionID
      const pendingOutbox = outbox
        .filter((o) => o.sessionID === loaded && !existingIds.has(o.id))
        .map(buildOutboxMessage)
      merged = [...messages, ...pendingOptimistic, ...pendingOutbox]
    }
    const { out, cache } = computeRenderedMessages(merged, dataMode, renderedCacheRef.current)
    renderedCacheRef.current = cache
    return out
  }, [messages, optimisticUserMessages, outbox, dataMode])

  // Firmas baratas: solo cambian cuando la cantidad de mensajes o el último
  // id/longitud cambian. Evita O(n) join por frame.
  const lastSigRef = useRef({ count: 0, lastID: "", lastLen: 0, signature: "", assistantCount: 0, assistantLastID: "", assistantLastLen: 0, assistantSignature: "" })
  const messageScrollSignature = useMemo(() => {
    const s = lastSigRef.current
    const n = renderedMessages.length
    const last = n > 0 ? renderedMessages[n - 1] : null
    if (last && last.info.id === s.lastID && last.text.length === s.lastLen && n === s.count) {
      return s.signature
    }
    const sig = renderedMessages.map((m) => `${m.info.id}:${m.text.length}`).join("|")
    s.count = n
    s.lastID = last?.info.id ?? ""
    s.lastLen = last?.text.length ?? 0
    s.signature = sig
    return sig
  }, [renderedMessages])

  const assistantResponseSignature = useMemo(() => {
    const s = lastSigRef.current
    const assistantMsgs = renderedMessages.filter((m) => m.info.role !== "user")
    const ac = assistantMsgs.length
    const aLast = ac > 0 ? assistantMsgs[ac - 1] : null
    if (aLast && aLast.info.id === s.assistantLastID && aLast.text.length === s.assistantLastLen && ac === s.assistantCount) {
      return s.assistantSignature
    }
    const sig = assistantMsgs.map((m) => `${m.info.id}:${m.text.length}`).join("|")
    s.assistantCount = ac
    s.assistantLastID = aLast?.info.id ?? ""
    s.assistantLastLen = aLast?.text.length ?? 0
    s.assistantSignature = sig
    return sig
  }, [renderedMessages])

  const pendingIndex = useMemo(() => {
    let completed = -1
    for (let i = renderedMessages.length - 1; i >= 0; i--) {
      const m = renderedMessages[i]
      if (m.info.role === "assistant" && m.info.time.completed) {
        completed = i
        break
      }
    }
    let pending = -1
    for (let i = renderedMessages.length - 1; i >= 0; i--) {
      const m = renderedMessages[i]
      if (i > completed && m.info.role === "assistant" && !m.info.time.completed) {
        pending = i
        break
      }
    }
    return pending === -1 ? undefined : pending
  }, [renderedMessages])

  const clearSession = useCallback(() => {
    loadedSessionIDRef.current = null
    setCurrentSessionId(null)
    subagentAnchorRef.current.clear()
    setMessages([])
    setOptimisticUserMessages([])
    setAwaitingAssistantReply(false)
    setRuntimeError(null)
  }, [])

  const preloadMessages = useCallback((sessionID: string, cached: MessageEnvelope[]) => {
    if (!cached || cached.length === 0) return
    loadedSessionIDRef.current = sessionID
    setCurrentSessionId(sessionID)
    setMessages((prev) => {
      const map = new Map<string, MessageEnvelope>()
      for (const m of cached) map.set(m.info.id, m)
      for (const m of prev) if (m.info.sessionID === sessionID) map.set(m.info.id, m)
      return [...map.values()].sort((a, b) => (a.info.time.created || 0) - (b.info.time.created || 0))
    })
  }, [])

  const loadSelected = useCallback(async (sessionID: string, directory: string) => {
    const requestID = ++loadSelectedRequestRef.current
    // Seteo ANTES del await: los deltas que lleguen durante el fetch de esta
    // sesión ya se aplican (el merge por id conserva lo streamed local).
    loadedSessionIDRef.current = sessionID
    setCurrentSessionId(sessionID)
    // Podar anchors de subagentes: solo eran válidos para la sesión previa.
    // Sin poda, el map crece toda la vida de la app y retiene mensajes viejos.
    subagentAnchorRef.current.clear()
    const limit = dataMode === "ultra" ? 100 : dataMode === "miser" ? 100 : 200

    const raw = await api.loadMessages(config, sessionID, directory, limit)
    if (requestID !== loadSelectedRequestRef.current) return
    const msg = dataMode === "full" || dataMode === "saver" ? raw : raw.map((m) => stripNonEssential(m, dataMode))
    // Defensivo: un item null/corrupto del server no debe tumbar el render
    // (msg.map(m => m.info.id) con m undefined = TypeError).
    const safe = msg.filter((m): m is MessageEnvelope => !!m && !!m.info?.id)
    // Si el fetch ya trajo el mensaje de compaction, podemos apagar el spinner aunque el SSE aún no haya llegado
    // Detectar por part type compaction O por role compaction (v2 nativo) para no depender del mapper
    const hasCompaction = safe.some((m) => m.parts.some((p) => p.type === "compaction") || (m.info as unknown as { role?: string }).role === "compaction" || (m as unknown as { type?: string }).type === "compaction")
      || raw.some((r: unknown) => (r as { type?: string })?.type === "compaction" || (r as { info?: { role?: string } })?.info?.role === "compaction")
    if (hasCompaction) {
      setCompacting(false, sessionID)
    }

    setMessages((prev) => {
      // Merge por id SOLO de la sesión cargada: el historial local de la sesión
      // nunca se reemplaza ni se descarta por una respuesta parcial o vacía,
      // pero los mensajes residuales de OTRAS sesiones (races de transición)
      // se descartan — el array siempre contiene una sola conversación.
      const seen = new Set<string>()
      let changed = prev.some((m) => m.info.sessionID !== sessionID)
      const msgMap = new Map(safe.map((m) => [m.info.id, m]))
      const merged: MessageEnvelope[] = []
      for (const m of prev) {
        if (m.info.sessionID !== sessionID) continue
        if (seen.has(m.info.id)) { changed = true; continue }
        seen.add(m.info.id)
        const updated = msgMap.get(m.info.id)
        if (updated) {
          // Merge de parts por id: los parts streamed localmente (tools, etc.)
          // que el fetch acotado no traiga se conservan — nunca se borran del chat.
          const remoteIDs = new Set(updated.parts.map((p) => p.id))
          const extraLocal = m.parts.filter((p) => !remoteIDs.has(p.id))
          const parts = extraLocal.length > 0
            ? [...updated.parts, ...extraLocal].sort((a, b) => {
                // ids part_<hex> monotónicos: el sort restaura el orden original
                // cuando los parts locales (streamed) van al final del array.
                if (!a.id || !b.id) return 0
                return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
              })
            : updated.parts
          merged.push({ ...updated, parts })
          msgMap.delete(m.info.id)
          if (updated.info.time.completed !== m.info.time.completed || updated.info.role !== m.info.role) changed = true
        } else if (raw.length >= limit) {
          // Solo conservar mensajes no devueltos si la lista del server fue truncada por límite de paginación
          seen.add(m.info.id)
          merged.push(m)
        } else if (compactingIdsRef.current.has(sessionID)) {
          // Durante compact el fetch intermedio puede llegar vacío/viejo antes de que el server genere el compaction → no borrar historial
          seen.add(m.info.id)
          merged.push(m)
        } else if (awaitingAssistantReplyRefInner.current) {
          // Durante streaming el server aún no persistió el mensaje en curso → no borrar lo streamed
          seen.add(m.info.id)
          merged.push(m)
        } else if (raw.length === 0 && safe.length === 0) {
          // Fetch vacío transitorio (server aún no generó, red) → nunca vaciar chat
          seen.add(m.info.id)
          merged.push(m)
        } else if (Date.now() - (m.info.time.created ?? 0) < 30000) {
          // Ventana de gracia 30s para mensajes recientes aún no persistidos (cubre lag post-streaming/post-compact).
          // Antes solo cubría !completed con 120s → un mensaje recién completado desaparecía si el fetch corría antes de persistir.
          seen.add(m.info.id)
          merged.push(m)
        } else if (!m.info.time.completed && Date.now() - (m.info.time.created ?? 0) < 120000) {
          // Mensaje en progreso reciente (streaming largo) aún no persistido
          seen.add(m.info.id)
          merged.push(m)
        } else if (!hasCompaction && prev.length > 20 && safe.length > 0 && safe.length < prev.length * 0.3) {
          // Safe pequeña sin compaction y prev grande (30% umbral) → probable fetch truncado/race, no borrar todo el historial
          // Sin esto, un fetch race que devuelve solo el último mensaje borraría 50 mensajes y parecería "desaparecen".
          seen.add(m.info.id)
          merged.push(m)
        } else if (hasCompaction) {
          // Compact es ADITIVO: el server poda contexto pero la UI conserva el
          // historial previo para lectura (igual que el TUI, que muestra los
          // mensajes anteriores por encima del divider). Sin esto, tras
          // compactar el chat quedaba solo con el resumen y "no deja ver
          // mensajes anteriores" aunque el botón de paginación existiera.
          seen.add(m.info.id)
          merged.push(m)
        } else {
          // Si el fetch trajo la lista completa y este mensaje no está, fue revertido/borrado en el server.
          changed = true
        }
      }
      for (const m of msgMap.values()) {
        if (seen.has(m.info.id)) continue
        seen.add(m.info.id)
        merged.push(m)
        changed = true
      }
      if (!changed) return prev

      // Orden por time.created: un mensaje de usuario confirmado por el server
      // (que llega en un fetch posterior) debe caer en su posición, no al final.
      merged.sort((a, b) => (a.info.time.created ?? 0) - (b.info.time.created ?? 0))
      return merged
    })

    setOptimisticUserMessages((current) => {
      const confirmedUsers = safe.filter((m) => m.info.role === "user")
      // 1) Confirmación por id: el server devuelve el id real del mensaje.
      const confirmedIDs = new Set(confirmedUsers.map((m) => m.info.id))
      // 2) Fallback por texto (echo SSE con role assistant/id distinto): cada
      //    fetch confirma a lo sumo el optimista MÁS VIEJO con ese texto — si
      //    se envió "hola" dos veces, el segundo espera su propio echo en vez
      //    de desaparecer junto con el primero.
      //    Para mensajes solo-imagen (sin texto), se confirma por cantidad de
      //    partes de imagen coincidente.
      const confirmedTextCounts = new Map<string, number>()
      for (const m of confirmedUsers) {
        const t = extractText(m).trim()
        if (!t) continue
        confirmedTextCounts.set(t, (confirmedTextCounts.get(t) ?? 0) + 1)
      }
      const confirmedImageCountMap = new Map<string, Map<number, number>>()
      for (const m of confirmedUsers) {
        const imgCount = countImageParts(m.parts)
        if (imgCount > 0) {
          let inner = confirmedImageCountMap.get(m.info.sessionID)
          if (!inner) { inner = new Map(); confirmedImageCountMap.set(m.info.sessionID, inner) }
          inner.set(imgCount, (inner.get(imgCount) ?? 0) + 1)
        }
      }
      const removeIDs = new Set<string>(confirmedIDs)
      for (const m of current) {
        if (m.info.sessionID !== sessionID || confirmedIDs.has(m.info.id)) continue
        const t = extractText(m).trim()
        const optImgCount = m.parts.filter((p) => isImagePart(p)).length
        if (t && optImgCount === 0) {
          const cnt = confirmedTextCounts.get(t) ?? 0
          if (cnt > 0) {
            confirmedTextCounts.set(t, cnt - 1)
            removeIDs.add(m.info.id)
          }
        } else {
          // Con imágenes (solo-imagen o texto+imagen): confirmar por conteo.
          // Borrar por texto acá perdería la imagen cuando el echo del server
          // trae el texto pero aún no (o nunca) los parts de imagen.
          const inner = confirmedImageCountMap.get(m.info.sessionID)
          const icnt = inner?.get(optImgCount) ?? 0
          if (icnt > 0) {
            inner!.set(optImgCount, icnt - 1)
            removeIDs.add(m.info.id)
          }
        }
      }
      return current.filter((m) => m.info.sessionID !== sessionID || !removeIDs.has(m.info.id))
    })

    if (safe.length > 0) {
      const last = safe[safe.length - 1]
      if (last.info.role === "assistant" && (last.info.time.completed || last.info.finish)) {
        // Solo apagar si hay algo NUEVO desde que se empezó a esperar: si la
        // firma no cambió, el completed es viejo (poll entre turnos) y el
        // agente puede seguir trabajando → no robar el botón stop.
        if (lastSigRef.current.assistantSignature !== awaitingAssistantBaselineRef.current) {
          setAwaitingAssistantReply(false)
        }
      }
    }
  }, [config, dataMode])

  const removeOptimistic = useCallback((id: string) => {
    setOptimisticUserMessages((current) => current.filter((m) => m.info.id !== id))
  }, [])

  // Sincroniza los ids optimistas en un ref para poder consultarlos desde
  // callbacks asíncronos (confirmación del envío). Los TEXTOS de los optimistas
  // pendientes permiten reconocer el echo del user message en el SSE (que llega
  // con role "assistant") — matchea cualquier envío en vuelo, no solo el último.
  const optimisticIDsRef = useRef<Set<string>>(new Set())
  const optimisticTextsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    optimisticIDsRef.current = new Set(optimisticUserMessages.map((m) => m.info.id))
    optimisticTextsRef.current = new Set(optimisticUserMessages.map(extractText).map((t) => t.trim()).filter(Boolean))
  }, [optimisticUserMessages])

  const abortSession = useCallback(async (sessionID: string, directory: string) => {
    setAwaitingAssistantReply(false)
    completionShouldPlayRef.current = false
    await api.abort(config, sessionID, directory)
  }, [config])

  const isUndoingRef = useRef(false)

  const undoMessage = useCallback(async (
    sessionID: string,
    directory: string,
    revert: { messageID: string } | undefined,
    _onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
    onPatchSession?: (patch: Partial<{ revert: { messageID: string } | undefined }>) => void,
    onSetRevertID?: (id: string | null) => void,
  ) => {
    if (isUndoingRef.current) return
    isUndoingRef.current = true
    const currentRevertID = revert?.messageID
    try {
      const userMessages = messages.filter((m) => (!m.info.sessionID || m.info.sessionID === sessionID) && m.info.role === "user")
      const boundary = currentRevertID ? userMessages.findIndex((m) => m.info.id === currentRevertID) : userMessages.length
      if (boundary <= 0) {
        setRuntimeError("No messages to undo")
        return
      }

      const targetMessage = userMessages[boundary - 1]
      if (!targetMessage) {
        setRuntimeError("No messages to undo")
        return
      }

      const targetID = targetMessage.info.id
      const text = extractText(targetMessage) || ""
      if (text) setComposer(text)

      // Actualización optimista inmediata
      onSetRevertID?.(targetID)
      onPatchSession?.({ revert: { messageID: targetID } })

      if (awaitingAssistantReply) {
        setAwaitingAssistantReply(false)
        await api.abort(config, sessionID, directory).catch(() => {})
      }

      await api.revert(config, sessionID, targetID, directory)
      await onLoadSelected().catch(() => {})
      await _onRefreshSessions().catch(() => {})
    } catch (err) {
      onSetRevertID?.(currentRevertID ?? null)
      onPatchSession?.(currentRevertID ? { revert: { messageID: currentRevertID } } : { revert: undefined })
      setRuntimeError(formatServerError(err))
    } finally {
      isUndoingRef.current = false
    }
  }, [config, messages, awaitingAssistantReply, setComposer])

  const redoMessage = useCallback(async (
    sessionID: string,
    directory: string,
    revert: { messageID: string } | undefined,
    _onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
    onPatchSession?: (patch: Partial<{ revert: { messageID: string } | undefined }>) => void,
    onSetRevertID?: (id: string | null) => void,
  ) => {
    const currentRevertID = revert?.messageID
    try {
      const userMessages = messages.filter((m) => (!m.info.sessionID || m.info.sessionID === sessionID) && m.info.role === "user")
      if (!currentRevertID) return
      const boundary = userMessages.findIndex((m) => m.info.id === currentRevertID)
      if (boundary < 0) return

      const next = userMessages[boundary + 1]

      if (!next) {
        onSetRevertID?.(null)
        onPatchSession?.({ revert: undefined })
        await api.unrevert(config, sessionID, directory)
      } else {
        onSetRevertID?.(next.info.id)
        onPatchSession?.({ revert: { messageID: next.info.id } })
        await api.revert(config, sessionID, next.info.id, directory)
      }
      await onLoadSelected().catch(() => {})
      await _onRefreshSessions().catch(() => {})
    } catch (err) {
      onSetRevertID?.(currentRevertID ?? null)
      onPatchSession?.(currentRevertID ? { revert: { messageID: currentRevertID } } : { revert: undefined })
      setRuntimeError(formatServerError(err))
    }
  }, [config, messages])

  const sendShellCallback = useCallback(async (sessionID: string, directory: string) => {
    const text = composer.trim()
    if (!text || !sessionID) return
    try {
      setComposer("")
      setAwaitingAssistantReply(true)
      awaitingAssistantBaselineRef.current = lastSigRef.current.assistantSignature
      await api.sendShell(config, sessionID, text, directory)
    } catch (err) {
      setAwaitingAssistantReply(false)
      setRuntimeError(formatServerError(err))
    }
  }, [config, composer])

  const compactSession = useCallback(async (
    sessionID: string,
    directory: string,
    providerID: string,
    modelID: string,
    onRefreshSessions: () => Promise<void>,
    _onLoadSelected: () => Promise<void>,
  ) => {
    setCompacting(true, sessionID)
    setAwaitingAssistantReply(true)
    awaitingAssistantBaselineRef.current = lastSigRef.current.assistantSignature
    try {
      const ok = await api.summarize(config, sessionID, providerID, modelID, directory, false)
      if (!ok) { setRuntimeError("Compact returned false from server"); return }
      // Poll hasta que el compaction llegue (SSE puede tardar 3-15s). Mantener
      // `compacting` vivo evita que la UI borre el historial prematuramente
      // (loadSelected con `raw.length < limit` descarta si no estamos en compact).
      for (let i = 0; i < 15; i++) {
        await new Promise((r) => setTimeout(r, 1000))
        // El usuario cambió de chat: NO secuestrar la vista con loadSelected(A).
        // Sin esto el poll pisaba currentSessionId/mensajes de B y B mostraba
        // el bubble "Compacting" de A. Al volver a A, su loadSelected normal
        // traerá el compaction.
        if (loadedSessionIDRef.current !== sessionID) break
        await loadSelected(sessionID, directory).catch(() => {})
        // Si el SSE `compaction.ended` ya limpió el Set, salir temprano — evita 15s de spinner colgado
        if (!compactingIdsRef.current.has(sessionID)) break
      }
      await onRefreshSessions()
    } catch (err) {
      setRuntimeError(formatServerError(err))
    } finally {
      // Fallback: si el SSE no limpió, limpiamos tras el poll. El handler de
      // `compaction.ended` también limpia, así que es idempotente.
      setCompacting(false, sessionID)
      // No pisar el awaiting de otro chat: si el usuario ya está en B, B es
      // dueño del flag (p. ej. B empezó a enviar mientras A compactaba).
      if (loadedSessionIDRef.current === sessionID) setAwaitingAssistantReply(false)
    }
  }, [config, loadSelected, setCompacting, setAwaitingAssistantReply])

  const applyDelta = useCallback((sessionID: string, messageID: string, partID: string, text: string, replace = false, partType = "text") => {
    // Guard contra races: nunca aplicar deltas de una sesión distinta a la cargada.
    if (loadedSessionIDRef.current !== sessionID) return
    queueMessageUpdate((prev) => {
      const existing = prev.find((m) => m.info.sessionID === sessionID && m.info.id === messageID)
      if (!existing) {
        // El SSE etiqueta todo como "assistant"; si el texto coincide con un
        // optimista pendiente es el user message confirmado: con role
        // "user" el bubble conserva su borde/fondo.
        const isUserText = partType === "text" && replace && optimisticTextsRef.current.size > 0
          ? optimisticTextsRef.current.has(text.trim())
          : false
        if (isUserText) {
          setOptimisticUserMessages((current) => {
            const idx = current.findIndex((opt) => opt.info.sessionID === sessionID && extractText(opt).trim() === text.trim())
            if (idx >= 0) {
              return current.filter((_, i) => i !== idx)
            }
            return current
          })
        }
        return [...prev, {
          info: {
            id: messageID,
            role: isUserText ? "user" : "assistant",
            sessionID,
            time: { created: Date.now() },
          },
          parts: [{ id: partID, type: partType, text }]
        }]
      }
      let changed = false
      const next = prev.map((m) => {
        if (m.info.sessionID !== sessionID || m.info.id !== messageID) return m
        const nextParts = m.parts.map((p) => {
          if (p.id !== partID) return p
          // Nunca demotar un part ya tipado (reasoning/tool) a texto por un
          // delta sin tipo resuelto.
          const keepType = partType === "text" && p.type !== "text" ? p.type : partType
          if (replace) {
            if (p.text === text) return p
            changed = true
            return { ...p, text, type: keepType }
          }
          // Sin dedupe por suffix: deltas reales pueden repetir sufijos y se cortaba el stream
          changed = true
          return { ...p, text: (p.text ?? "") + text, type: keepType }
        })
        if (!nextParts.some((p) => p.id === partID)) {
          changed = true
          return { ...m, parts: [...nextParts, { id: partID, type: partType, text }] }
        }
        return { ...m, parts: nextParts }
      })
      return changed ? next : prev
    }, sessionID, partType === "text" && replace)
  }, [queueMessageUpdate])

  // Materializa un part emitido por `message.part.updated`: crea el mensaje/part
  // con el tipo correcto antes de que lleguen los deltas.
  const applyPart = useCallback((sessionID: string, messageID: string, part: { id: string; type?: string; text?: string; tool?: string; callID?: string; state?: unknown; time?: { start?: number; end?: number } }) => {
    if (!part.id) return
    const visible = loadedSessionIDRef.current
    if (visible && visible !== sessionID) {
      // Tool part de una sesión distinta a la visible (subagente en background):
      // SOLO se acepta si existe un ancla previa que apunte al chat visible.
      // El fallback anterior ("sessionID = visible; messageID = ''") adivinaba
      // el último assistant del chat abierto e INYECTABA contenido de otro chat.
      const isTaskPart = part.tool === "task" || part.tool === "subagent" ||
        (part.state && typeof part.state === "object" && (Boolean((part.state as any).input?.subagent_type) || Boolean((part.state as any).metadata?.subagent)))
      if (!isTaskPart) return
      const anchor = subagentAnchorRef.current.get(part.id)
      if (!anchor || anchor.sessionID !== visible) return
      sessionID = anchor.sessionID
      messageID = anchor.messageID
    }
    queueMessageUpdate((prev) => {
      let targetMessageID = messageID
      if (!targetMessageID) {
        const anchorMsg = prev.filter((m) => m.info.sessionID === sessionID && m.info.role === "assistant").pop()
        targetMessageID = anchorMsg?.info.id ?? ""
        if (targetMessageID) subagentAnchorRef.current.set(part.id, { sessionID, messageID: targetMessageID })
        else return prev
      }
      const existing = prev.find((m) => m.info.sessionID === sessionID && m.info.id === targetMessageID)
      if (!existing) {
        const isUserText = part.type === "text" && part.text && optimisticTextsRef.current.size > 0
          ? optimisticTextsRef.current.has(part.text.trim())
          : false
        return [...prev, {
          info: { id: targetMessageID, role: isUserText ? "user" : "assistant", sessionID, time: { created: Date.now() } },
          parts: [{ id: part.id, type: part.type ?? "text", text: part.text ?? "", ...(part.tool ? { tool: part.tool } : {}), ...(part.callID ? { callID: part.callID } : {}), ...(part.state ? { state: part.state } : {}), ...(part.time ? { time: part.time } : {}) }]
        }]
      }
      let changed = false
      const next = prev.map((m) => {
        if (m.info.sessionID !== sessionID || m.info.id !== targetMessageID) return m
        const hasPart = m.parts.some((p) => p.id === part.id)
        if (!hasPart) {
          changed = true
          return { ...m, parts: [...m.parts, { id: part.id, type: part.type ?? "text", text: part.text ?? "", ...(part.tool ? { tool: part.tool } : {}), ...(part.callID ? { callID: part.callID } : {}), ...(part.state ? { state: part.state } : {}), ...(part.time ? { time: part.time } : {}) }] }
        }
        const nextParts = m.parts.map((p) => {
          if (p.id !== part.id) return p
          const incoming = part.text ?? ""          // Los tool parts (task/subagent) suelen llegar SIN texto: solo traen
          // state.status (running→completed) y tool. Mergear siempre esos campos.
          // Compare shallow por campo (evita JSON.stringify en el hot path).
          const newState = part.state && typeof part.state === "object" ? part.state : undefined
          const prevState = p.state && typeof p.state === "object" ? p.state : undefined
          const stateChanged = newState !== undefined
            ? newState !== prevState &&
              ((newState as { status?: string }).status ?? "") !== ((prevState as { status?: string }).status ?? "")
            : false
          const toolChanged = part.tool !== undefined && part.tool !== p.tool
          // El time (start/end) también cambia sin tocar texto: p.ej. el
          // reasoning final llega con time.end aunque el texto ya esté completo.
          const timeChanged = part.time !== undefined && p.time !== undefined
            ? part.time.start !== p.time.start || part.time.end !== p.time.end
            : part.time !== undefined && p.time === undefined
          if (!incoming && p.text && !stateChanged && !toolChanged && !timeChanged) return p
          if (p.text === incoming && (part.type ?? p.type) === p.type && !stateChanged && !toolChanged && !timeChanged) return p
          changed = true
          return {
            ...p,
            text: incoming || p.text,
            ...(part.type ? { type: part.type } : {}),
            ...(part.tool ? { tool: part.tool } : {}),
            ...(part.callID ? { callID: part.callID } : {}),
            ...(newState !== undefined ? { state: newState } : {}),
            ...(part.time ? { time: part.time } : {}),
          }
        })
        return { ...m, parts: nextParts }
      })
      return changed ? next : prev
    }, sessionID)
  }, [queueMessageUpdate])

  const updateSend = useCallback(async (
    selectedSession: SessionView,
    activeModel: ModelSelection | undefined,
    activeAgentID: string,
    commands: { name: string }[],
    onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
    onSetCommands: (cmds: { name: string }[]) => void,
    onSetRuntimeError: (err: string | null) => void,
    images?: Array<{ base64: string; mime: string }>,
    textOverride?: string,
    onSetRevertID?: (id: string | null) => void,
    translatedFrom?: string,
  ) => {
    const text = (textOverride ?? composer).trim()
    if ((!text || !selectedSession) && (!images || images.length === 0)) return false
    try {

    const optimisticMessage = buildOptimisticMessage(selectedSession, text, images)
    // Store original text for "ver original" if this was translated
    if (translatedFrom) {
      setTranslationOriginal(optimisticMessage.info.id, translatedFrom)
    }

    const doSend = async (
      sendFn: () => Promise<unknown>,
      then: () => Promise<void>
    ): Promise<boolean> => {
      // Guard anti doble-envío: SOLO bloquea la fase de HTTP POST, no la
      // confirmación posterior. Antes estaba en el body de updateSend y se
      // pisaba con los returns tempranos de slash commands (help/status/etc),
      // quedando permanentemente en true y bloqueando TODOS los envíos
      // posteriores.
      if (isSendingRef.current) return false
      isSendingRef.current = true
      setIsSending(true)
      let ok = false
      try {
        setComposer("")
        setOptimisticUserMessages((current) => [...current, optimisticMessage])
        // Sync refs inmediato: evita race donde el while loop no ve el optimistic (effect aún no corrió)
        optimisticIDsRef.current = new Set([...optimisticIDsRef.current, optimisticMessage.info.id])
        const t = extractText(optimisticMessage).trim()
        if (t) optimisticTextsRef.current = new Set([...optimisticTextsRef.current, t])
        awaitingAssistantBaselineRef.current = assistantResponseSignature
        completionShouldPlayRef.current = true
        setAwaitingAssistantReply(true)
        onSetRuntimeError(null)

        try {
          await sendFn()
          ok = true
        } catch (err) {
          // Send fallido (red o server): remover el optimistic de inmediato,
          // restaurar el texto original (no el traducido) y mostrar el error.
          // El Composer conserva las imágenes porque recibe `false` como retorno.
          completionShouldPlayRef.current = false
          setAwaitingAssistantReply(false)
          removeOptimistic(optimisticMessage.info.id)
          const restoreText = translatedFrom || text
          setComposer((current) => current || restoreText)
          onSetRuntimeError(formatServerError(err))
        }
      } finally {
        isSendingRef.current = false
        setIsSending(false)
      }

      if (ok) {
        // TUI-like: 1 fetch inmediato; el SSE echo ya borra el optimista sin poll
        try {
          await then().catch(() => undefined)
        } catch {
          // nunca tratar una falla de confirmación como falla de envío
        }
      }

      try {
        await onRefreshSessions()
      } catch {
        // ignore
      }
      return ok
    }

    const parsed = parseCommand(text)
    if (parsed?.type === "help") {
      setComposer("")
      return "help"
    }
    if (parsed?.type === "status") {
      setComposer("")
      setOptimisticUserMessages((current) => [...current, optimisticMessage, buildStatusMessage(selectedSession)])
      return
    }
    if (parsed?.type === "undo") {
      setComposer("")
      await undoMessage(selectedSession.id, selectedSession.directory, selectedSession.revert, onRefreshSessions, onLoadSelected, undefined, onSetRevertID)
      return
    }
    if (parsed?.type === "redo") {
      setComposer("")
      await redoMessage(selectedSession.id, selectedSession.directory, selectedSession.revert, onRefreshSessions, onLoadSelected, undefined, onSetRevertID)
      return
    }
    if (parsed?.type === "compact") {
      setComposer("")
      if (activeModel) {
        completionShouldPlayRef.current = true
        await compactSession(selectedSession.id, selectedSession.directory, activeModel.providerID, activeModel.modelID, onRefreshSessions, onLoadSelected)
      } else {
        onSetRuntimeError("Select a model first to use /compact")
      }
      return
    }
    if (parsed?.type === "themes") {
      setComposer("")
      return "themes"
    }
    if (parsed?.type === "connect") {
      setComposer("")
      // /connect <providerID> <apiKey> → setea la credencial directo.
      // /connect (sin args) → abre el sheet de proveedores.
      const m = parsed.text.trim().match(/^(\S+)\s+(\S+)/)
      if (m) {
        try {
          await api.setProviderAuth(config, m[1], m[2], selectedSession.directory)
          return true
        } catch (err) {
          onSetRuntimeError(formatServerError(err))
          return false
        }
      }
      return "connect"
    }
    if (parsed?.type === "command") {
      const { isKnown } = await resolveCommand(config, parsed.command, commands, onSetCommands)
      if (!isKnown) {
        return doSend(
          () => api.sendPrompt(config, selectedSession.id, text, selectedSession.directory, activeModel, activeAgentID),
          () => onLoadSelected()
        )
      }
      return doSend(
        () => api.sendCommand(config, selectedSession.id, parsed.command, parsed.args, selectedSession.directory, activeModel, activeAgentID),
        () => onLoadSelected()
      )
    }

    return doSend(
      () => api.sendPrompt(config, selectedSession.id, text, selectedSession.directory, activeModel, activeAgentID, images),
      () => onLoadSelected()
    )
    } finally {
      // BUG 1+6: isSendingRef siempre se resetea, incluso si el slash
      // command hace return temprano. Antes esto faltaba y el ref quedaba
      // pegado en true bloqueando TODOS los envíos posteriores.
      isSendingRef.current = false
    }
  }, [composer, config, assistantResponseSignature, removeOptimistic, undoMessage, redoMessage, compactSession])

  return {
    messages, setMessages, optimisticUserMessages,
    outbox, enqueueOutbox, removeOutbox,
    composer, setComposer,
    isSending,
    awaitingAssistantReply, setAwaitingAssistantReply,
    runtimeError, setRuntimeError,
    compacting, setCompacting,
    renderedMessages, messageScrollSignature, assistantResponseSignature, pendingIndex,
    completionShouldPlayRef,
    clearSession, preloadMessages, loadSelected, send: updateSend, abortSession,
    undoMessage, redoMessage, compactSession, sendShell: sendShellCallback,
    applyDelta, applyPart
  }
}
