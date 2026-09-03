import { useCallback, useEffect, useRef } from "react"
import type { SSEEvent } from "../types"
import type { MessageEnvelope } from "../types"
import { pluginBus } from "../plugins/bus"

// Diagnóstico del streaming de reasoning: inactivo por defecto (spam por
// delta). Activación: localStorage.setItem("opencode.debug.sse", "1").
const SSE_DIAG = typeof localStorage !== "undefined" && localStorage.getItem("opencode.debug.sse") === "1"

type SSEHandlerDeps = {
  sessionID: string | null | undefined
  directory: string | undefined
  loadSelected: (sessionID: string, directory: string) => Promise<unknown> | void
  applyDelta: (sessionID: string, messageID: string, partID: string, text: string, replace?: boolean, partType?: string) => void
  applyPart: (sessionID: string, messageID: string, part: { id: string; type?: string; text?: string; tool?: string; callID?: string; state?: unknown; time?: { start?: number; end?: number } }) => void
  setAwaitingAssistantReply: (v: boolean) => void
  setRuntimeError: (e: string | null) => void
  awaitingRef: () => boolean
  onSettled: (sessionID: string, directory: string) => void
  /** Limpia el bubble "Compacting" al llegar `compaction.ended` (corta el poll de 15s). Opcional por compat con callers viejos. */
  setCompacting?: (v: boolean, sessionID?: string) => void
}

// Maneja los eventos SSE de una sesión. Compartido entre la vista mobile
// (AppInner) y cada panel de sesión del escritorio (SessionChatPanel).
export function useSSEHandler(deps: SSEHandlerDeps): (event: SSEEvent) => void {
  const partTypeCacheRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    partTypeCacheRef.current.clear()
  }, [deps.sessionID])

  // Coalesce de deltas por frame (copiado de app/server-sdk.tsx FLUSH_FRAME_MS 16): concatena
  // deltas del mismo part para no crear N patches por frame.
  const coalesceMapRef = useRef<Map<string, { sessionID: string; messageID: string; partID: string; text: string; replace: boolean; partType: string }>>(new Map())
  const coalesceFrameRef = useRef<number | null>(null)
  const flushCoalesce = useCallback(() => {
    coalesceFrameRef.current = null
    const toFlush = [...coalesceMapRef.current.values()]
    coalesceMapRef.current.clear()
    for (const v of toFlush) deps.applyDelta(v.sessionID, v.messageID, v.partID, v.text, v.replace, v.partType)
  }, [deps])
  const enqueueDelta = useCallback((sessionID: string, messageID: string, partID: string, text: string, replace: boolean, partType: string) => {
    const key = `${sessionID}:${messageID}:${partID}:${partType}`
    const existing = coalesceMapRef.current.get(key)
    if (existing && !replace) existing.text += text
    else coalesceMapRef.current.set(key, { sessionID, messageID, partID, text, replace, partType })
    if (coalesceFrameRef.current === null) coalesceFrameRef.current = requestAnimationFrame(flushCoalesce)
  }, [flushCoalesce])
  useEffect(() => () => {
    if (coalesceFrameRef.current !== null) cancelAnimationFrame(coalesceFrameRef.current)
    coalesceMapRef.current.clear()
  }, [])

  return useCallback((event: SSEEvent) => {
    const p = event.properties as Record<string, unknown>
    const type = event.type
    if (type === "server.heartbeat") return
    if (type === "server.connected") {
      // Upstream server-sdk refresca sesiones al reconectar; aquí refrescamos la sesión visible.
      if (deps.sessionID && deps.directory) deps.onSettled(deps.sessionID, deps.directory)
      return
    }
    if (type === "server.instance.disposed") {
      deps.setRuntimeError("Server instance disposed — reconnect or reload")
      deps.setAwaitingAssistantReply(false)
      return
    }

    // Reemitir eventos hacia el bus de plugins
    pluginBus.emit(type, { ...p, sessionID: deps.sessionID, directory: deps.directory })
    pluginBus.emit("session.updated", { sessionID: deps.sessionID, directory: deps.directory, type })

    if (type === "message.part.updated") {
      const part = p.part as { id?: string; type?: string; messageID?: string; sessionID?: string; text?: string } | undefined
      if (SSE_DIAG && (part?.type === "reasoning" || part?.type === "thinking")) {
        console.info("[SSE:diag] part.updated reasoning", { partID: part.id, type: part.type, textLen: part.text?.length ?? 0 })
      }
      // El cache de tipos se alimenta SOLO con parts de la sesión visible (o sin
      // sessionID, para v1) — un part de otra sesión no debe tipar uno de esta.
      const partSessionID = (p.sessionID as string | undefined) ?? part?.sessionID
      if (part?.id && part.type && (!partSessionID || partSessionID === deps.sessionID)) {
        partTypeCacheRef.current.set(part.id, part.type)
        // Cache acotado: una sesión larga genera miles de partIDs y el tipo ya
        // materializado (applyPart) no necesita más deltas tipados. Al pasar
        // el tope se descarta el entry más viejo (el Map conserva inserción).
        if (partTypeCacheRef.current.size > 500) {
          const oldest = partTypeCacheRef.current.keys().next().value
          if (oldest !== undefined) partTypeCacheRef.current.delete(oldest)
        }
      }
      // El server a veces pone messageID/sessionID dentro de part (no en la raíz
      // de properties) — es el caso del tool `task` (subagente). Fallback a part.*
      const sessionID = (p.sessionID as string | undefined) ?? part?.sessionID
      const messageID = (p.messageID as string | undefined) ?? part?.messageID
      // Los tool parts del SUBAGENTE traen el sessionID de la sesión HIJA: su
      // tarjeta pertenece al chat del padre — applyPart los ancla al mensaje
      // del padre (Map partID→messageID en useMessages).
      const isSubagentToolPart = (part?.type === "tool" || part?.type === "tool_use") && sessionID !== deps.sessionID
      if (part?.id && sessionID && messageID && (sessionID === deps.sessionID || isSubagentToolPart)) {
        const fullPart = p.part as { id?: string; type?: string; text?: string; tool?: string; callID?: string; state?: unknown; time?: { start?: number; end?: number } } | undefined
        deps.applyPart(sessionID, messageID, {
          id: fullPart?.id ?? "",
          type: fullPart?.type,
          text: fullPart?.text,
          tool: fullPart?.tool,
          callID: fullPart?.callID,
          state: fullPart?.state,
          time: fullPart?.time,
        })
      }
      return
    }

    if (type === "message.part.delta") {
      const sessionID = p.sessionID as string | undefined
      const messageID = p.messageID as string | undefined
      const partID = p.partID as string | undefined
      const hasDelta = typeof p.delta === "string"
      const text = (hasDelta ? p.delta : p.text ?? "") as string
      const cachedType = partID ? partTypeCacheRef.current.get(partID) : undefined
      const partType = cachedType ?? (p.type ?? p.partType ?? "text") as string
      if (SSE_DIAG && (partType === "reasoning" || partType === "thinking" || !cachedType)) {
        console.info("[SSE:diag] part.delta", { partID, messageID, partType, cached: Boolean(cachedType), deltaLen: text.length })
      }
      if (sessionID && messageID && partID && text && sessionID === deps.sessionID) {
        enqueueDelta(sessionID, messageID, partID, text, !hasDelta, partType)
      }
      return
    }

    if (type === "session.next.text.delta" || type === "session.next.reasoning.delta" ||
        type === "session.next.text.ended" || type === "session.next.reasoning.ended" ||
        type === "session.next.tool.input.delta") {
      // v2 anida el payload en `data` ({sessionID, assistantMessageID, textID,
      // delta, ...}); v1 lo trae en la raíz de properties. Soportar ambos.
      const d = (p.data && typeof p.data === "object" ? p.data : p) as Record<string, unknown>
      const sessionID = (d.sessionID ?? p.sessionID) as string | undefined
      if (!sessionID || sessionID !== deps.sessionID) return
      const assistantMessageID = (d.assistantMessageID ?? p.assistantMessageID) as string | undefined
      const partID = (d.textID ?? d.reasoningID ?? d.callID ?? p.textID ?? p.reasoningID ?? p.callID) as string | undefined
      const partType = type.startsWith("session.next.reasoning") ? "reasoning"
        : type === "session.next.tool.input.delta" ? "tool"
        : "text"
      const hasDelta = typeof (d.delta ?? p.delta) === "string"
      const text = (hasDelta ? (d.delta ?? p.delta) : (d.text ?? p.text ?? "")) as string
      if (assistantMessageID && partID && text) {
        enqueueDelta(sessionID, assistantMessageID, partID, text, !hasDelta, partType)
      }
      return
    }

    if (type === "session.next.compaction.delta" || type === "session.next.compaction.ended") {
      const d = (p.data && typeof p.data === "object" ? p.data : p) as Record<string, unknown>
      const sessionID = (d.sessionID ?? p.sessionID) as string | undefined
      const messageID = (d.messageID ?? p.messageID) as string | undefined
      if (sessionID && messageID && sessionID === deps.sessionID) {
        if (type === "session.next.compaction.delta") {
          const text = (d.text ?? p.text) as string | undefined
          if (text) enqueueDelta(sessionID, messageID, messageID, text, true, "compaction")
        } else {
          // Limpia el Set por sesión: el poll de compactSession sale temprano
          // en vez de colgar 15s de spinner. Idempotente con su finally.
          deps.setCompacting?.(false, sessionID)
          deps.loadSelected(sessionID, deps.directory ?? "")
        }
      }
      return
    }

    if (type === "session.next.step.failed" || type === "session.next.retried") {
      // v2 anida el payload en `data`; filtrar por sesión si el evento la trae.
      const d = (p.data && typeof p.data === "object" ? p.data : p) as Record<string, unknown>
      const sessionID = (d.sessionID ?? p.sessionID) as string | undefined
      if (sessionID && sessionID !== deps.sessionID) return
      deps.setAwaitingAssistantReply(false)
      return
    }

    if (type === "message.updated" || type === "message.part.updated") {
      if (type === "message.updated") {
        const sessionID = p.sessionID as string | undefined
        if (sessionID && sessionID === deps.sessionID) {
          const rawMsg = p.message as { id?: string; info?: { id?: string; role?: string; finish?: string; time?: { completed?: number } }; parts?: Array<{ id?: string; type?: string; text?: string; tool?: string; callID?: string; state?: unknown; time?: { start?: number; end?: number } }>; content?: Array<{ id?: string; type?: string; text?: string; tool?: string; callID?: string; state?: unknown; time?: { start?: number; end?: number } }> } | undefined
          // Streaming del reasoning en vivo (v1): `message.part.delta` no trae
          // el type del part, así que los deltas de reasoning sin `part.updated`
          // previo caen como texto. El mensaje persistido SÍ trae los parts
          // tipados: al materializarlos acá, el part se re-tipea y el cache de
          // tipos alimenta los deltas siguientes → el texto del razonamiento
          // stream dentro del ThinkingBlock. Solo reasoning/thinking (el texto
          // del assistant ya stream por deltas; tool outputs no se copian).
          // Ojo: el server manda los parts en `content` (formato V2), no en
          // `parts` — soportar ambos.
          const rawParts = rawMsg?.content ?? rawMsg?.parts ?? []
          const updatedMessageID = (p.messageID as string | undefined) ?? rawMsg?.info?.id ?? rawMsg?.id
          if (rawParts.length > 0 && updatedMessageID) {
            for (const part of rawParts) {
              if (part?.id && (part.type === "reasoning" || part.type === "thinking")) {
                partTypeCacheRef.current.set(part.id, part.type)
                deps.applyPart(sessionID, updatedMessageID, {
                  id: part.id,
                  type: part.type,
                  text: part.text,
                  tool: part.tool,
                  callID: part.callID,
                  state: part.state,
                  time: part.time,
                })
              }
            }
          }
          if (rawMsg?.info?.role === "assistant" && (rawMsg?.info?.time?.completed || rawMsg?.info?.finish) && deps.awaitingRef()) {
            deps.setAwaitingAssistantReply(false)
            deps.onSettled(sessionID, deps.directory ?? "")
          }
        }
      }
      return
    }

    if (type === "session.status") {
      const sessionID = p.sessionID as string | undefined
      const rawStatus = p.status as unknown
      const statusType = typeof rawStatus === "string"
        ? rawStatus
        : (rawStatus as { type?: string } | undefined)?.type
      if (sessionID && sessionID === deps.sessionID && statusType === "idle") {
        deps.setAwaitingAssistantReply(false)
        deps.onSettled(sessionID, deps.directory ?? "")
      }
      return
    }

    if (type === "session.idle") {
      const sessionID = p.sessionID as string | undefined
      if (sessionID && sessionID === deps.sessionID) {
        deps.setAwaitingAssistantReply(false)
        deps.onSettled(sessionID, deps.directory ?? "")
      }
      return
    }

    if (type === "session.error") {
      // Solo mostrar errores de la sesión visible: un error de otra sesión del
      // mismo directorio no debe aparecer como error de este chat.
      const sessionID = p.sessionID as string | undefined
      if (sessionID && sessionID !== deps.sessionID) return
      const msg = (p.message ?? p.text ?? "") as string
      if (msg) deps.setRuntimeError(msg)
      deps.setAwaitingAssistantReply(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps.sessionID, deps.directory])
}

export type { MessageEnvelope }
