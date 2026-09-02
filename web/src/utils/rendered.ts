import type { MessageEnvelope, RenderedMessage, DataMode, FileDiff } from "../types"
import { isImagePart } from "../utils.ts"

const toolPartTypes = new Set(["tool_use", "tool_result", "tool", "execution", "terminal", "code_execution", "tool_call"])

export type RenderedCacheEntry = {
  src: MessageEnvelope
  rendered: RenderedMessage
  diffs?: FileDiff[]
  turnMode?: string
  dataMode?: DataMode
}

export type RenderedCache = Map<string, RenderedCacheEntry>

// Computa el array de mensajes renderizables a partir de los mensajes crudos.
// Caché por id de mensaje fuente: los deltas SSE solo cambian UN mensaje (nueva
// referencia inmutable); el resto conserva su referencia → se reusa su
// RenderedMessage y las bubbles memoizadas NO re-renderizan por deltas.
// Se invalida si cambió la fuente, el diff del turno, el turnMode o el modo.
export function computeRenderedMessages(
  all: MessageEnvelope[],
  dataMode: DataMode | undefined,
  cache: RenderedCache
): { out: RenderedMessage[]; cache: RenderedCache } {
  const out: RenderedMessage[] = []
  const seenIds = new Set<string>()
  let pendingDiffs: FileDiff[] | undefined
  let lastAssistantId: string | null = null
  const diffForMessage = new Map<string, FileDiff[]>()
  const turnModeForUser = new Map<string, string>()
  let lastUserID: string | null = null
  for (const message of all) {
    if (seenIds.has(message.info.id)) continue
    seenIds.add(message.info.id)
    // El server puede poner diffs tanto en el user (summary del turno) como directamente en el assistant (v2)
    const ownDiffs = message.info.summary?.diffs
    if (message.info.role === "user") {
      pendingDiffs = ownDiffs
      lastAssistantId = null
      lastUserID = message.info.id
    } else {
      // Prioriza diffs propios del assistant si existen, sino usa los pending del user previo (compat v1)
      const diffsToAttach = (ownDiffs && ownDiffs.length > 0) ? ownDiffs : pendingDiffs
      if (diffsToAttach && diffsToAttach.length > 0) {
        if (lastAssistantId) diffForMessage.delete(lastAssistantId)
        diffForMessage.set(message.info.id, diffsToAttach)
        lastAssistantId = message.info.id
      }
      if (lastUserID && message.info.mode && !turnModeForUser.has(lastUserID)) {
        turnModeForUser.set(lastUserID, message.info.mode)
      }
    }
  }
  const nextCache = new Map<string, RenderedCacheEntry>()
  const renderedIds = new Set<string>()
  for (const message of all) {
    // Dedupe propio de este loop: `all` puede traer un id repetido (optimista
    // que el fetch ya confirmó) — nunca dos bubbles iguales.
    if (renderedIds.has(message.info.id)) continue
    renderedIds.add(message.info.id)
    const diffs = diffForMessage.get(message.info.id)
    const turnMode = message.info.mode ?? (message.info.role === "user" ? turnModeForUser.get(message.info.id) : undefined)
    const cached = cache.get(message.info.id)
    if (cached && cached.src === message && cached.diffs === diffs && cached.turnMode === turnMode && cached.dataMode === dataMode) {
      out.push(cached.rendered)
      nextCache.set(message.info.id, cached)
      continue
    }
    let text = ""
    let hasCompaction = false
    const thinkingParts: Array<{ id: string; text: string; time?: { start?: number; end?: number } }> = []
    const toolParts: Array<{ id: string; type: string; sessionID?: string; text?: string; callID?: string; tool?: string; state?: MessageEnvelope["parts"][number]["state"] }> = []
    const textBlocks: string[] = []
    for (const part of message.parts) {
      if (part.type === "tool" || toolPartTypes.has(part.type)) {
        const isTaskCard = part.tool === "task" || part.tool === "subagent" ||
          (part.state && typeof part.state === "object" && (((part.state as any).input?.subagent_type || (part.state as any).input?.prompt)))
        // Si el tool part pertenece a una sesión hija (subagente) y no es la tarjeta principal del task,
        // no se inyecta en el flujo de herramientas del padre.
        if (part.sessionID && part.sessionID !== message.info.sessionID && !isTaskCard) {
          continue
        }
        toolParts.push({
          id: part.id,
          type: part.type,
          sessionID: part.sessionID,
          text: part.text,
          callID: part.callID,
          tool: part.tool,
          state: part.state,
        })
        continue
      }
      const t = part.text
      if (t) {
        if (part.type === "text" || part.type === "compaction") {
          textBlocks.push(t)
          if (part.type === "compaction") hasCompaction = true
        } else if (part.type === "reasoning" || part.type === "thinking") {
          thinkingParts.push({ id: part.id, text: t, time: part.time })
        }
      }
    }
    text = textBlocks.join("\n\n").trim()
    // Filtro: no renderizar notificaciones internas del sistema (pty tool)
    if (text.includes("<pty_exited>") || text.includes("Use pty_read to check")) continue
    const hasImages = message.parts.some((p) => isImagePart(p as any))
    if (text || thinkingParts.length > 0 || toolParts.length > 0 || hasImages || message.info.error) {
      const rendered: RenderedMessage = { ...message, text, hasCompaction, thinkingParts, toolParts, tokens: message.info.tokens, cost: message.info.cost, summaryDiffs: diffs, dataMode, turnMode }
      out.push(rendered)
      nextCache.set(message.info.id, { src: message, rendered, diffs, turnMode, dataMode })
    }
  }
  // Cache acotado: si la lista creció/encogió mucho (cambio de sesión), se
  // descarta todo y se reconstruye en el próximo cálculo.
  if (nextCache.size > out.length * 3) nextCache.clear()
  return { out, cache: nextCache }
}
