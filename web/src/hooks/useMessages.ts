import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import type { ServerConfig, DataMode, MessageEnvelope, RenderedMessage } from "../types"
import { api } from "../api"
import { rehydrateImages, collectLocalImages, type LocalImageEntry } from "../utils/parseCommand"
import { computeRenderedMessages } from "../utils/rendered"
import { isImagePart, countImageParts } from "../utils"
import { formatServerError } from "../shared/errors/serverErrors"
import { messageText } from "../utils/messageShape"
import {
  useSharedOutbox,
  enqueueSharedOutbox,
  removeSharedOutbox,
  buildOutboxMessage,
  type OutboxItem,
} from "../stores/outboxStore"
import { useStreamPatch } from "./useStreamPatch"
import { useMessageSend } from "./useMessageSend"

// Onda 3 / B2: useMessages quedó como compositor delgado. Las piezas viven en
//   - stores/outboxStore.ts        (cola compartida + claim/hold)
//   - stores/translationOriginals.ts (original pre-traducción)
//   - hooks/useStreamPatch.ts      (batching rAF + applyDelta/applyPart)
//   - hooks/useMessageSend.ts      (updateSend / slash commands)
// La conducta observable es la misma; la API pública se re-exporta abajo para
// no tocar a los consumidores (useAppController, SessionChatPanel,
// useChatActions, MessageBubble y los tests).
export {
  getTranslationOriginal,
  setTranslationOriginal,
} from "../stores/translationOriginals"
export {
  enqueueSharedOutbox,
  removeSharedOutbox,
  claimSharedOutbox,
  releaseSharedOutbox,
  holdSharedOutbox,
  resumeSharedOutbox,
  isSharedOutboxHeld,
  type OutboxItem,
  type OutboxActions,
} from "../stores/outboxStore"

const toolPartTypes = new Set(["tool_use", "tool_result", "tool", "execution", "terminal", "code_execution", "tool_call"])

// Tools de archivos y de terminal: se conservan en modos ahorro para mostrar
// los cambios (+N/−M) y los comandos ejecutados (bash/terminal); el diff
// completo vive en el resumen final.
const fileToolNames = new Set(["write", "edit", "apply_patch", "patch"])
const shellToolNames = new Set(["bash", "execute", "terminal", "shell", "pwsh", "cmd"])

const COMPOSER_STORAGE_KEY = "opencode.remote.composer"

function stripNonEssential(msg: MessageEnvelope, dataMode?: DataMode): MessageEnvelope {
  if (dataMode === "full" || dataMode === "saver") return msg
  const keep = (p: MessageEnvelope["parts"][number]) =>
    p.type === "compaction" || p.type === "reasoning" || p.type === "thinking" ||
    !toolPartTypes.has(p.type) || (typeof p.tool === "string" && (fileToolNames.has(p.tool) || shellToolNames.has(p.tool)))
  const filtered = msg.parts.filter(keep)
  return filtered.length === msg.parts.length ? msg : { ...msg, parts: filtered }
}

const INITIAL_PAGE_LIMIT = 35

export function useMessages(config: ServerConfig, dataMode?: DataMode, storageKey = COMPOSER_STORAGE_KEY) {
  const [messages, setMessages] = useState<MessageEnvelope[]>([])
  const [optimisticUserMessages, setOptimisticUserMessages] = useState<MessageEnvelope[]>([])
  // Cola compartida por sesión entre todas las instancias (ver stores/outboxStore).
  const outbox = useSharedOutbox()
  const [messageLimit, setMessageLimit] = useState(INITIAL_PAGE_LIMIT)
  const enqueueOutbox = useCallback((sessionID: string, text: string, images?: OutboxItem["images"]) => {
    return enqueueSharedOutbox(sessionID, text, images)
  }, [])
  const removeOutbox = useCallback((id: string) => {
    removeSharedOutbox(id)
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
  // ID del último assistant ANTES del envío. Al completarse el turno nuevo, el
  // assistant tiene otro id → recién ahí se apaga el spinner. Comparar por id
  // (no por firma) evita que un revert/poda cambie la firma y apague el spinner
  // antes de tiempo, y que un `message.updated` de un assistant viejo lo apague.
  const awaitingBaselineIDRef = useRef("")
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
  // Sincroniza los ids optimistas en un ref para poder consultarlos desde
  // callbacks asíncronos (confirmación del envío). Los TEXTOS de los optimistas
  // pendientes permiten reconocer el echo del user message en el SSE (que llega
  // con role "assistant") — matchea cualquier envío en vuelo, no solo el último.
  const optimisticIDsRef = useRef<Set<string>>(new Set())
  const optimisticTextsRef = useRef<Set<string>>(new Set())
  const localImagesRef = useRef<LocalImageEntry[]>([])

  // Batch de deltas SSE por frame + applyDelta/applyPart (hooks/useStreamPatch).
  const { applyDelta, applyPart } = useStreamPatch({
    setMessages,
    loadedSessionIDRef,
    optimisticTextsRef,
    setOptimisticUserMessages,
    subagentAnchorRef,
  })

  const renderedMessages: RenderedMessage[] = useMemo(() => {
    // Aísla la conversación: mensajes de OTRAS sesiones (races de transición,
    // SSE tardío, caché) nunca deben renderizarse acá. El merge de loadSelected
    // los descarta, pero si alguno entra por otra vía la vista mostraba p. ej.
    // el compaction de otro chat hasta el próximo fetch.
    const loaded = loadedSessionIDRef.current
    const scoped = loaded
      ? messages.filter((m) => !m.info.sessionID || m.info.sessionID === loaded)
      : messages
    // Optimización: si no hay optimistas ni outbox pendientes, skip el trabajo pesado
    let merged: MessageEnvelope[]
    if (optimisticUserMessages.length === 0 && outbox.length === 0) {
      merged = scoped
    } else {
      // Fix: no filtrar optimistas por texto contra todo el historial — eso
      // ocultaba "hola" x2 cuando ya existía un "hola" antiguo y el nuevo
      // parecía duplicado. Solo filtrar por id (nunca coincide, id local vs
      // server) y dejar que loadSelected haga el dedupe por texto al confirmar.
      // Así el mensaje se ve al instante incluso si el texto ya existe.
      const existingIds = new Set(scoped.map((m) => m.info.id))
      const pendingOptimistic = optimisticUserMessages.filter((opt) => !existingIds.has(opt.info.id))
      // Outbox: solo la sesión cargada (los de otras sesiones esperan su panel).
      const target = loaded ?? scoped[0]?.info.sessionID
      const pendingOutbox = outbox
        .filter((o) => o.sessionID === target && !existingIds.has(o.id))
        .map(buildOutboxMessage)
      merged = [...scoped, ...pendingOptimistic, ...pendingOutbox]
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
    setMessageLimit(INITIAL_PAGE_LIMIT)
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

  const loadSelectedInner = useCallback(async (sessionID: string, directory: string) => {
    const requestID = ++loadSelectedRequestRef.current
    // Seteo ANTES del await: los deltas que lleguen durante el fetch de esta
    // sesión ya se aplican (el merge por id conserva lo streamed local).
    loadedSessionIDRef.current = sessionID
    setCurrentSessionId(sessionID)
    // Podar anchors de subagentes: solo eran válidos para la sesión previa.
    // Sin poda, el map crece toda la vida de la app y retiene mensajes viejos.
    subagentAnchorRef.current.clear()
    const limit = Math.max(INITIAL_PAGE_LIMIT, messageLimit)

    const raw = await api.loadMessages(config, sessionID, directory, limit)
    if (requestID !== loadSelectedRequestRef.current) return
    const msg = dataMode === "full" || dataMode === "saver" ? raw : raw.map((m) => stripNonEssential(m, dataMode))
    // Defensivo: un item null/corrupto del server no debe tumbar el render
    // (msg.map(m => m.info.id) con m undefined = TypeError).
    const safe = msg.filter((m): m is MessageEnvelope => !!m && !!m.info?.id)
    // Eco sin bytes: reinyectar los dataURL locales en el mensaje confirmado
    // (el server puede podarlos por tamaño). Sin esto la imagen "aparece y se
    // borra": el optimista se elimina por conteo y el eco queda sin src.
    localImagesRef.current = rehydrateImages(safe, localImagesRef.current, sessionID)
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
          // ...pero NO los de texto ya cubiertos por el server: los parts
          // streameados usan IDs sintetizados (msg:text[:N]) que nunca
          // coinciden con los persistidos (prt_*), y sin este filtro el
          // texto final se renderiza dos veces ("hola\n\nhola").
          const remoteText = updated.parts
            .filter((p) => p.type === "text" || p.type === "compaction" || p.type === "reasoning" || p.type === "thinking" || p.type === undefined)
            .map((p) => p.text ?? "")
            .join("\n\n")
          const extraLocal = m.parts.filter((p) => {
            if (remoteIDs.has(p.id)) return false
            const t = (p.text ?? "").trim()
            if (t && (p.type === "text" || p.type === "compaction" || p.type === "reasoning" || p.type === "thinking" || p.type === undefined) && remoteText.includes(t)) return false
            // Traza (solo lectura, no cambia conducta): part local de texto RETENIDO
            // cuyo inicio sí aparece en el texto del server. Ese solapamiento sin
            // contención total es la firma del bug de mensajes repetidos por merge
            // (server + streameado). Deja el partID para decidir el fix con evidencia.
            if (t.length >= 60 && remoteText.includes(t.slice(0, 80))) {
              console.error("[chat:merge] part local retenido con solapamiento", { partID: p.id, len: t.length, preview: t.slice(0, 80) })
            }
            return true
          })
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
        const t = messageText(m).trim()
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
        const t = messageText(m).trim()
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
        // Solo apagar si hay un assistant NUEVO: si el id coincide con el
        // capturado al enviar, el completed es viejo (poll entre turnos) y el
        // agente puede seguir trabajando → no robar el botón stop.
        if (last.info.id !== awaitingBaselineIDRef.current) {
          setAwaitingAssistantReply(false)
        }
      }
    }
  }, [config, dataMode, messageLimit])

  // Dedupe de fetch en vuelo por sesión: el poll, el settle y la reconciliación
  // de status pueden pedir el mismo historial a la vez; en sesiones grandes el
  // payload es de varios MB y recargarlo en paralelo satura.
  const loadingSessionsRef = useRef<Set<string>>(new Set())
  const loadSelected = useCallback(async (sessionID: string, directory: string) => {
    if (loadingSessionsRef.current.has(sessionID)) return
    loadingSessionsRef.current.add(sessionID)
    try {
      await loadSelectedInner(sessionID, directory)
    } finally {
      loadingSessionsRef.current.delete(sessionID)
    }
  }, [loadSelectedInner])

  const removeOptimistic = useCallback((id: string) => {
    setOptimisticUserMessages((current) => current.filter((m) => m.info.id !== id))
  }, [])

  useEffect(() => {
    optimisticIDsRef.current = new Set(optimisticUserMessages.map((m) => m.info.id))
    optimisticTextsRef.current = new Set(optimisticUserMessages.map(messageText).map((t) => t.trim()).filter(Boolean))
    // Bytes locales de imágenes para rehidratar el eco del server (que puede
    // podar los dataURL): se reconstruye del estado — si el optimista sigue
    // pendiente, sus bytes siguen disponibles para el próximo fetch.
    localImagesRef.current = collectLocalImages(optimisticUserMessages)
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
    restoreComposer = false,
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
      const text = messageText(targetMessage) || ""
      if (restoreComposer && text) setComposer(text)

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
      awaitingBaselineIDRef.current = lastSigRef.current.assistantLastID
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
    awaitingBaselineIDRef.current = lastSigRef.current.assistantLastID
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

  const updateSend = useMessageSend({
    config,
    composer,
    assistantResponseSignature,
    removeOptimistic,
    undoMessage,
    redoMessage,
    compactSession,
    setComposer,
    setOptimisticUserMessages,
    setIsSending,
    isSendingRef,
    optimisticIDsRef,
    optimisticTextsRef,
    awaitingBaselineIDRef,
    completionShouldPlayRef,
    setAwaitingAssistantReply,
    lastSigRef,
  })

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
    getAwaitingBaselineID: () => awaitingBaselineIDRef.current,
    clearSession, preloadMessages, loadSelected, send: updateSend, abortSession,
    undoMessage, redoMessage, compactSession, sendShell: sendShellCallback,
    applyDelta, applyPart
  }
}
