import { useCallback, useEffect, useRef } from "react"
import type { Dispatch, SetStateAction } from "react"
import type { MessageEnvelope } from "../types"
import { messageText } from "../utils/messageShape"

// Onda 3 / B2: batching de deltas SSE (rAF) + applyDelta/applyPart, extraídos
// tal cual desde hooks/useMessages.ts. La conducta es idéntica: mismo
// coalescing por frame, mismo guard de sesión cargada, misma materialización
// de parts, mismo drenado síncrono al desmontar. Todo lo que era estado del
// hook se recibe por dependencias estables (refs/setters de React).

type Patcher = (prev: MessageEnvelope[]) => MessageEnvelope[]
type SubagentAnchor = { sessionID: string; messageID: string }

export type StreamPatchDeps = {
  setMessages: Dispatch<SetStateAction<MessageEnvelope[]>>
  loadedSessionIDRef: { current: string | null }
  optimisticTextsRef: { current: Set<string> }
  setOptimisticUserMessages: Dispatch<SetStateAction<MessageEnvelope[]>>
  subagentAnchorRef: { current: Map<string, SubagentAnchor> }
}

export type MessagePartInput = {
  id: string
  type?: string
  text?: string
  tool?: string
  callID?: string
  state?: unknown
  time?: { start?: number; end?: number }
}

export function useStreamPatch({
  setMessages,
  loadedSessionIDRef,
  optimisticTextsRef,
  setOptimisticUserMessages,
  subagentAnchorRef,
}: StreamPatchDeps) {
  // ---- Batch de deltas SSE por frame ----
  // Cada `message.part.delta` llega por separado y hoy disparaba un
  // setMessages (y un re-render de la lista) por delta. El server puede
  // emitir decenas de deltas/segundo; se encolan y se aplican con UN solo
  // setMessages por requestAnimationFrame (máx. 60 renders/s, agrupando el
  // trabajo). Al desmontar se drena lo pendiente de forma síncrona para no
  // perder el último tramo del stream.
  const messageBatchRef = useRef<Array<{ sid: string | null; patch: Patcher }>>([])
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
  }, [loadedSessionIDRef, setMessages])

  const queueMessageUpdate = useCallback((patch: Patcher, sid: string | null = null, immediate = false) => {
    // Minimizado/oculto: rAF congelado + Virtuoso sin layout. Acumular sin
    // pintar; al volver se drena en un solo frame antes de re-anclar.
    const hidden = typeof document !== "undefined" && document.hidden
    if (immediate && !hidden) {
      setMessages((prev) => {
        const loaded = loadedSessionIDRef.current
        if (sid && loaded && sid !== loaded) return prev
        return patch(prev)
      })
      return
    }
    messageBatchRef.current.push({ sid, patch })
    if (!hidden && batchFrameRef.current === null && batchMountedRef.current) {
      batchFrameRef.current = requestAnimationFrame(flushMessageBatch)
    }
  }, [flushMessageBatch, loadedSessionIDRef, setMessages])

  useEffect(() => {
    batchMountedRef.current = true
    const onVis = () => {
      if (!document.hidden && messageBatchRef.current.length > 0 && batchFrameRef.current === null) {
        batchFrameRef.current = requestAnimationFrame(flushMessageBatch)
      }
    }
    document.addEventListener("visibilitychange", onVis)
    return () => {
      document.removeEventListener("visibilitychange", onVis)
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
  }, [flushMessageBatch, loadedSessionIDRef, setMessages])

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
            const idx = current.findIndex((opt) => opt.info.sessionID === sessionID && messageText(opt).trim() === text.trim())
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
  }, [loadedSessionIDRef, optimisticTextsRef, queueMessageUpdate, setOptimisticUserMessages])

  // Materializa un part emitido por `message.part.updated`: crea el mensaje/part
  // con el tipo correcto antes de que lleguen los deltas.
  const applyPart = useCallback((sessionID: string, messageID: string, part: MessagePartInput) => {
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
  }, [loadedSessionIDRef, optimisticTextsRef, queueMessageUpdate, subagentAnchorRef])

  return { applyDelta, applyPart }
}
