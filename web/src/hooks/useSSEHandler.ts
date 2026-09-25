import { useCallback, useEffect, useRef } from "react"
import type { SSEEvent } from "../types"
import type { MessageEnvelope } from "../types"
import { pluginBus } from "../plugins/bus"
import { normalizeAssistantError } from "../shared/errors/assistantError"
import { isTaskToolPart } from "../utils/toolName"
import { isAssistantMessage } from "../utils/messageShape"

// Diagnóstico del streaming de reasoning: inactivo por defecto (spam por
// delta). Activación: localStorage.setItem("opencode.debug.sse", "1").
const SSE_DIAG = typeof localStorage !== "undefined" && localStorage.getItem("opencode.debug.sse") === "1"

/** ID de mensaje/part del dialecto v2: solo strings no vacíos valen. */
function asID(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined
}

/** Payload del evento: v2 lo anida en `data`; v1 lo trae en la raíz de properties. */
function payloadOf(p: Record<string, unknown>): Record<string, unknown> {
  return (p.data && typeof p.data === "object" ? p.data : p) as Record<string, unknown>
}

type SSEHandlerDeps = {
  sessionID: string | null | undefined
  directory: string | undefined
  loadSelected: (sessionID: string, directory: string) => Promise<unknown> | void
  applyDelta: (sessionID: string, messageID: string, partID: string, text: string, replace?: boolean, partType?: string) => void
  applyPart: (sessionID: string, messageID: string, part: { id: string; type?: string; text?: string; tool?: string; callID?: string; state?: unknown; time?: { start?: number; end?: number } }) => void
  setAwaitingAssistantReply: (v: boolean) => void
  setRuntimeError: (e: string | null) => void
  awaitingRef: () => boolean
  /** ID del último assistant ANTES del envío: solo un assistant con OTRO id es la respuesta esperada. */
  awaitingBaselineIDRef?: () => string
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
  const coalesceMapRef = useRef<Map<string, { sessionID: string; messageID: string; partID: string; text: string; replace: boolean; partType: string; seq: number }>>(new Map())
  const coalesceFrameRef = useRef<number | null>(null)
  // Secuencia monotónica de deltas: el re-arme de abajo solo vale para deltas
  // POSTERIORES al último cierre de turno de la sesión visible (las ramas de
  // cierre sellan `settledSeqRef`, apaguen o no `awaiting`). Los que ya estaban
  // encolados son del turno que acaba de terminar. Sin esto, cuando el cierre
  // y los últimos deltas llegan en el mismo chunk SSE (habitual), el flush del
  // frame siguiente re-encendía el Stop para un turno terminado y nada lo
  // apagaba hasta el cure del poll (15-20 s) → "sigue trabajando".
  const deltaSeqRef = useRef(0)
  const settledSeqRef = useRef(0)
  const flushCoalesce = useCallback(() => {
    coalesceFrameRef.current = null
    const toFlush = [...coalesceMapRef.current.values()]
    coalesceMapRef.current.clear()
    // Re-arme: si llegan deltas en vivo POSTERIORES al cierre de la sesión
    // visible sin awaiting (turno solapado o turno iniciado en otro cliente),
    // el turno está vivo → el botón Stop debe mostrarse. Solo deltas de
    // contenido (tokens fluyendo AHORA), nunca eventos de cierre ni
    // compaction; los checks de idle del poll apagan si el server ya terminó.
    if (!deps.awaitingRef() && toFlush.some((v) => v.sessionID === deps.sessionID && v.partType !== "compaction" && v.seq > settledSeqRef.current)) {
      if (SSE_DIAG) console.info("[SSE:diag] re-arme awaiting por deltas posteriores al cierre")
      deps.setAwaitingAssistantReply(true)
    }
    for (const v of toFlush) deps.applyDelta(v.sessionID, v.messageID, v.partID, v.text, v.replace, v.partType)
  }, [deps])
  const enqueueDelta = useCallback((sessionID: string, messageID: string, partID: string, text: string, replace: boolean, partType: string) => {
    const key = `${sessionID}:${messageID}:${partID}:${partType}`
    const existing = coalesceMapRef.current.get(key)
    if (existing && !replace) {
      existing.text += text
      // El entry pasa a tener un delta posterior al cierre: cuenta como vivo.
      existing.seq = ++deltaSeqRef.current
    } else {
      coalesceMapRef.current.set(key, { sessionID, messageID, partID, text, replace, partType, seq: ++deltaSeqRef.current })
    }
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
      settledSeqRef.current = deltaSeqRef.current
      deps.setAwaitingAssistantReply(false)
      return
    }

    // Reemitir eventos hacia el bus de plugins. Precedencia de atribución
    // (debate Fase 2): no pisar el origen del evento con la sesión visible;
    // el fallback a deps.sessionID mantiene heartbeat/status viejos.
    const _d = payloadOf(p)
    pluginBus.emit(type, {
      ...p,
      sessionID: (p.sessionID as string | undefined) ?? (_d.sessionID as string | undefined) ?? (_d.originSessionID as string | undefined) ?? deps.sessionID,
      directory: (p.directory as string | undefined) ?? (_d.directory as string | undefined) ?? deps.directory,
    })
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
      // del padre (Map partID→messageID en useMessages). Criterio único
      // (toolName.isTaskToolPart): task/subagent, subagent_type o metadata.
      const isSubagentToolPart = (part?.type === "tool" || part?.type === "tool_use") &&
        sessionID !== deps.sessionID && isTaskToolPart(part as unknown as Parameters<typeof isTaskToolPart>[0])
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
      const d = payloadOf(p)
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

    if (type === "session.next.compaction.delta" || type === "session.next.compaction.ended" || type === "session.compaction.ended") {
      const d = payloadOf(p)
      const sessionID = (d.sessionID ?? p.sessionID) as string | undefined
      const messageID = (d.messageID ?? p.messageID) as string | undefined
      // session.compaction.ended trae sessionID en data (sin messageID).
      if (sessionID && sessionID === deps.sessionID && (messageID || type === "session.compaction.ended")) {
        if (type === "session.next.compaction.delta" && messageID) {
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

    // Dialecto v2 vigente (server 2.x): session.text.* / session.reasoning.* /
    // session.tool.input.delta / session.execution.*. El server YA NO emite
    // message.part.delta ni message.updated (verificado contra 2.0.3: un turno
    // completo no trae ninguno) — sin estas ramas no hay streaming en vivo ni
    // cierre de turno por SSE. El sobre llega como envelope {type, data} y `p`
    // es el envelope (el parser pone todo en properties); `d` es el payload.
    // Formas oficiales (@opencode-ai/protocol): text.delta =
    // {assistantMessageID, ordinal, delta, sessionID}; execution.* =
    // {sessionID} (+ error en failed, reason en interrupted).
    if (
      type === "session.text.delta" || type === "session.text.started" || type === "session.text.ended" ||
      type === "session.reasoning.delta" || type === "session.reasoning.started" || type === "session.reasoning.ended" ||
      type === "session.tool.input.delta"
    ) {
      const d = payloadOf(p)
      const sessionID = (d.sessionID ?? p.sessionID) as string | undefined
      if (!sessionID || sessionID !== deps.sessionID) return
      const reasoning = type.startsWith("session.reasoning")
      const isToolInput = type === "session.tool.input.delta"
      const messageID = asID(d.assistantMessageID ?? d.messageID ?? p.assistantMessageID ?? p.messageID)
      if (!messageID) return
      // `.started` solo anuncia: el shell del mensaje se crea con el primer
      // delta (applyDelta), igual que antes — evita burbujas vacías.
      // `.ended` no cierra el turno (pueden seguir tools): solo los deltas pintan.
      if (type.endsWith(".started") || type.endsWith(".ended")) return
      const ordinal = d.ordinal
      const defaultPartID = `${messageID}:${isToolInput ? "tool" : reasoning ? "reasoning" : "text"}${typeof ordinal === "number" ? `:${ordinal}` : ""}`
      const partID = asID(d.partID ?? d.textID ?? d.reasoningID ?? d.id) ?? defaultPartID
      const text = (d.delta ?? d.text ?? p.delta ?? p.text ?? "") as string
      if (partID && typeof text === "string" && text) {
        enqueueDelta(sessionID, messageID, partID, text, false, isToolInput ? "tool" : reasoning ? "reasoning" : "text")
      }
      return
    }

    if (
      type === "session.execution.started" || type === "session.execution.succeeded" ||
      type === "session.execution.failed" || type === "session.execution.interrupted"
    ) {
      const d = payloadOf(p)
      const sessionID = (d.sessionID ?? p.sessionID) as string | undefined
      if (!sessionID || sessionID !== deps.sessionID) return
      if (type === "session.execution.started") return
      if (type === "session.execution.failed") {
        const err = d.error as { message?: unknown; type?: unknown } | undefined
        const msg = typeof err?.message === "string" && err.message ? err.message : undefined
        if (msg) deps.setRuntimeError(msg)
        else {
          const norm = normalizeAssistantError(d.error ?? p.error)
          if (norm?.message) deps.setRuntimeError(norm.message)
        }
      }
      // Cierre de turno: solo el turno en curso apaga el spinner (un evento
      // tardío no debe robar el stop del turno siguiente; el dedupe por id
      // del transporte ya frena duplicados). Sin awaiting igual se reconcilia
      // el historial (turno iniciado desde otro cliente).
      // El turno terminó para la sesión visible: sellar SIEMPRE (aunque
      // `awaiting` ya esté en false por un cure externo del poll), así los
      // deltas encolados antes del cierre no lo re-encienden.
      settledSeqRef.current = deltaSeqRef.current
      if (deps.awaitingRef()) {
        deps.setAwaitingAssistantReply(false)
        deps.onSettled(sessionID, deps.directory ?? "")
      } else {
        deps.loadSelected(sessionID, deps.directory ?? "")
      }
      return
    }

    if (type === "session.next.step.failed" || type === "session.next.retried") {
      // v2 anida el payload en `data`; filtrar por sesión si el evento la trae.
      const d = payloadOf(p)
      const sessionID = (d.sessionID ?? p.sessionID) as string | undefined
      if (sessionID && sessionID !== deps.sessionID) return
      // `retried` sigue trabajando: nunca apaga (antes dejaba al agente sin
      // botón stop hasta el próximo envío). El fin real lo marcan
      // session.error/idle o message.updated completed.
      if (type === "session.next.retried") return
      settledSeqRef.current = deltaSeqRef.current
      deps.setAwaitingAssistantReply(false)
      return
    }

    if (type === "message.updated") {
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
          if (isAssistantMessage(rawMsg) && (rawMsg?.info?.time?.completed || rawMsg?.info?.finish)) {
            // Solo el assistant NUEVO cierra el turno: un `message.updated` de
            // un assistant viejo (p. ej. el reemitido tras un revert) no debe
            // apagar el spinner ni disparar el settled del turno en curso.
            const baselineID = deps.awaitingBaselineIDRef?.() ?? ""
            if (updatedMessageID && updatedMessageID !== baselineID) {
              // Sella aunque `awaiting` ya esté en false (cure externo): los
              // deltas encolados antes del cierre no deben re-encender el Stop.
              settledSeqRef.current = deltaSeqRef.current
              if (deps.awaitingRef()) {
                deps.setAwaitingAssistantReply(false)
                deps.onSettled(sessionID, deps.directory ?? "")
              }
            }
          }
        }
      }
      return
    }

    if (type === "session.status") {
      const d = payloadOf(p)
      const sessionID = (d.sessionID ?? p.sessionID) as string | undefined
      const rawStatus = (d.status ?? p.status) as unknown
      const statusType = typeof rawStatus === "string"
        ? rawStatus
        : (rawStatus as { type?: string } | undefined)?.type
      const targetSessionID = sessionID ?? deps.sessionID
      if (targetSessionID && targetSessionID === deps.sessionID && statusType === "idle") {
        settledSeqRef.current = deltaSeqRef.current
        deps.setAwaitingAssistantReply(false)
        deps.onSettled(targetSessionID, deps.directory ?? "")
      }
      return
    }

    if (type === "session.idle") {
      const d = payloadOf(p)
      const sessionID = (d.sessionID ?? p.sessionID) as string | undefined
      const targetSessionID = sessionID ?? deps.sessionID
      if (targetSessionID && targetSessionID === deps.sessionID) {
        settledSeqRef.current = deltaSeqRef.current
        deps.setAwaitingAssistantReply(false)
        deps.onSettled(targetSessionID, deps.directory ?? "")
      }
      return
    }

    if (type === "session.error") {
      // Solo mostrar errores de la sesión visible: un error de otra sesión del
      // mismo directorio no debe aparecer como error de este chat.
      const d = payloadOf(p)
      const sessionID = (d.sessionID ?? p.sessionID) as string | undefined
      if (sessionID && sessionID !== deps.sessionID) return
      // El server manda { error: { name, data: { message, ref? } } }; además
      // algunos emisores mandan message/text plano. Normalizar ambos.
      const norm = normalizeAssistantError(d.error ?? p.error)
      const plain = (d.message ?? d.text ?? p.message ?? p.text) as string | undefined
      const msg = norm?.message || plain || norm?.name
      if (msg) deps.setRuntimeError(msg)
      settledSeqRef.current = deltaSeqRef.current
      deps.setAwaitingAssistantReply(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps.sessionID, deps.directory])
}

export type { MessageEnvelope }
