import { useCallback, useEffect, useRef } from "react"
import type { SSEEvent } from "../types"
import type { MessageEnvelope } from "../types"

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
}

// Maneja los eventos SSE de una sesión. Compartido entre la vista mobile
// (AppInner) y cada panel de sesión del escritorio (SessionChatPanel).
export function useSSEHandler(deps: SSEHandlerDeps): (event: SSEEvent) => void {
  const partTypeCacheRef = useRef<Map<string, string>>(new Map())
  useEffect(() => {
    partTypeCacheRef.current.clear()
  }, [deps.sessionID])

  return useCallback((event: SSEEvent) => {
    const p = event.properties as Record<string, unknown>
    const type = event.type
    if (type === "server.connected" || type === "server.heartbeat") return

    if (type === "message.part.updated") {
      const part = p.part as { id?: string; type?: string; messageID?: string; sessionID?: string; text?: string } | undefined
      if (part?.id && part.type) partTypeCacheRef.current.set(part.id, part.type)
      // El server a veces pone messageID/sessionID dentro de part (no en la raíz
      // de properties) — es el caso del tool `task` (subagente). Fallback a part.*
      const sessionID = (p.sessionID as string | undefined) ?? part?.sessionID
      const messageID = (p.messageID as string | undefined) ?? part?.messageID
      if (sessionID && messageID && part?.id && sessionID === deps.sessionID) {
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
      if (sessionID && messageID && partID && text && sessionID === deps.sessionID) {
        deps.applyDelta(sessionID, messageID, partID, text, !hasDelta, partType)
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
        deps.applyDelta(sessionID, assistantMessageID, partID, text, !hasDelta, partType)
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
          if (text) deps.applyDelta(sessionID, messageID, messageID, text, true, "compaction")
        } else {
          deps.loadSelected(sessionID, deps.directory ?? "")
        }
      }
      return
    }

    if (type === "session.next.step.failed" || type === "session.next.retried") {
      deps.setAwaitingAssistantReply(false)
      return
    }

    if (type === "message.updated" || type === "message.part.updated") {
      if (type === "message.updated") {
        const sessionID = p.sessionID as string | undefined
        if (sessionID && sessionID === deps.sessionID) {
          const rawMsg = p.message as { info?: { time?: { completed?: number } } } | undefined
          if (rawMsg?.info?.time?.completed && deps.awaitingRef()) {
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
        deps.loadSelected(sessionID, deps.directory ?? "")
        deps.onSettled(sessionID, deps.directory ?? "")
      }
      return
    }

    if (type === "session.idle") {
      const sessionID = p.sessionID as string | undefined
      if (sessionID && sessionID === deps.sessionID) {
        deps.setAwaitingAssistantReply(false)
        deps.loadSelected(sessionID, deps.directory ?? "")
        deps.onSettled(sessionID, deps.directory ?? "")
      }
      return
    }

    if (type === "session.error") {
      const msg = (p.message ?? p.text ?? "") as string
      if (msg) deps.setRuntimeError(msg)
      deps.setAwaitingAssistantReply(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps.sessionID, deps.directory])
}

export type { MessageEnvelope }
