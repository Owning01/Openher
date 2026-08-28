import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import type { ServerConfig, DataMode, MessageEnvelope, ModelSelection, RenderedMessage, SessionView } from "../types"
import { api } from "../api"
import { resolveApiVersion } from "../shared/api/version"
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
    !toolPartTypes.has(p.type) || (typeof p.tool === "string" && (fileToolNames.has(p.tool) || shellToolNames.has(p.tool)))
  const filtered = msg.parts.filter(keep)
  return filtered.length === msg.parts.length ? msg : { ...msg, parts: filtered }
}

export function useMessages(config: ServerConfig, dataMode?: DataMode, storageKey = COMPOSER_STORAGE_KEY) {
  const [messages, setMessages] = useState<MessageEnvelope[]>([])
  const [optimisticUserMessages, setOptimisticUserMessages] = useState<MessageEnvelope[]>([])
  const [composer, setComposer] = useState(() => localStorage.getItem(storageKey) ?? "")
  const [awaitingAssistantReply, setAwaitingAssistantReply] = useState(false)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  // Compacting por sesión: usa Set para no filtrar estado entre sesiones.
  // Antes era boolean global → al cambiar de sesión la otra aparecía como
  // "Compacting" aunque no lo estuviera. Ahora se rastrea por sessionID.
  const [compactingIds, setCompactingIds] = useState<Set<string>>(() => new Set())
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
  useEffect(() => {
    const timer = setInterval(() => {
      const current = composerRef.current
      if (current) localStorage.setItem(storageKey, current)
      else localStorage.removeItem(storageKey)
    }, 2000)
    return () => clearInterval(timer)
  }, [storageKey])

  const loadSelectedRequestRef = useRef(0)
  const awaitingAssistantBaselineRef = useRef("")
  const completionShouldPlayRef = useRef(false)
  const isSendingRef = useRef(false)
  const [isSending, setIsSending] = useState(false)
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
    // Optimización: si no hay optimistas pendientes, skip el trabajo pesado
    let merged: MessageEnvelope[]
    if (optimisticUserMessages.length === 0) {
      merged = messages
    } else {
      // Fix: no filtrar optimistas por texto contra todo el historial — eso
      // ocultaba "hola" x2 cuando ya existía un "hola" antiguo y el nuevo
      // parecía duplicado. Solo filtrar por id (nunca coincide, id local vs
      // server) y dejar que loadSelected haga el dedupe por texto al confirmar.
      // Así el mensaje se ve al instante incluso si el texto ya existe.
      const existingIds = new Set(messages.map((m) => m.info.id))
      const pendingOptimistic = optimisticUserMessages.filter((opt) => !existingIds.has(opt.info.id))
      merged = [...messages, ...pendingOptimistic]
    }
    const { out, cache } = computeRenderedMessages(merged, dataMode, renderedCacheRef.current)
    renderedCacheRef.current = cache
    return out
  }, [messages, optimisticUserMessages, dataMode])

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
        if (t) {
          const cnt = confirmedTextCounts.get(t) ?? 0
          if (cnt > 0) {
            confirmedTextCounts.set(t, cnt - 1)
            removeIDs.add(m.info.id)
          }
        } else {
          const optImgCount = m.parts.filter((p) => isImagePart(p)).length
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
        setAwaitingAssistantReply(false)
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
    // Fire-and-forget: no await race, UI ya está en idle
    api.abort(config, sessionID, directory).catch(() => {})
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
    try {
      const userMessages = messages.filter((m) => (!m.info.sessionID || m.info.sessionID === sessionID) && m.info.role === "user")
      const currentRevertID = revert?.messageID
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
        api.abort(config, sessionID, directory).catch(() => {})
      }

      await api.revert(config, sessionID, targetID, directory)
      await onLoadSelected().catch(() => {})
      await _onRefreshSessions().catch(() => {})
    } catch (err) {
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
    try {
      const userMessages = messages.filter((m) => (!m.info.sessionID || m.info.sessionID === sessionID) && m.info.role === "user")
      const currentRevertID = revert?.messageID
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
      setRuntimeError(formatServerError(err))
    }
  }, [config, messages])

  const sendShellCallback = useCallback(async (sessionID: string, directory: string) => {
    const text = composer.trim()
    if (!text || !sessionID) return
    try {
      setComposer("")
      setAwaitingAssistantReply(true)
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
    try {
      const ok = await api.summarize(config, sessionID, providerID, modelID, directory, false)
      if (!ok) { setRuntimeError("Compact returned false from server"); return }
      await new Promise((r) => setTimeout(r, 500))
      await loadSelected(sessionID, directory)
      await onRefreshSessions()
    } catch (err) {
      setRuntimeError(formatServerError(err))
    }
  }, [config, loadSelected])

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
    // v2 no soporta imágenes (server las descarta y el optimistic quedaría huérfano/duplicado)
    if (images && images.length > 0 && resolveApiVersion(config) === "v2") {
      onSetRuntimeError("This server (v2) doesn't support images — switch to v1 or remove attachments")
      return false
    }
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
          // restaurar el texto y mostrar el error. El Composer conserva las
          // imágenes porque recibe `false` como retorno.
          completionShouldPlayRef.current = false
          setAwaitingAssistantReply(false)
          removeOptimistic(optimisticMessage.info.id)
          setComposer((current) => current || text)
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
        setCompacting(true, selectedSession.id)
        setAwaitingAssistantReply(true)
        completionShouldPlayRef.current = true
        try {
          await compactSession(selectedSession.id, selectedSession.directory, activeModel.providerID, activeModel.modelID, onRefreshSessions, onLoadSelected)
        } finally {
          setCompacting(false, selectedSession.id)
          setAwaitingAssistantReply(false)
        }
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
