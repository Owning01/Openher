import type { MessageEnvelope, RenderedMessage, RenderedSegment, DataMode, FileDiff, TurnChanges, ServerNoticeKind } from "../types.ts"
import { isImagePart } from "../utils.ts"
import { toolPartFileDiff } from "./toolFileDiff.ts"
import { isSubagentResultMessage, stripSubagentWrapper } from "./messageShape.ts"

const toolPartTypes = new Set(["tool_use", "tool_result", "tool", "execution", "terminal", "code_execution", "tool_call"])

const MAX_TOOL_OUTPUT_CHARS = 1500
const PRESERVE_TOOL_HEAD_CHARS = 800

/** Prefijo estable del aviso de catálogo que inyecta el server (system). */
export const TOOL_CATALOG_MARKER = "The Code Mode tool catalog"

export type { ServerNoticeKind } from "../types.ts"

/**
 * Clasifica un aviso del server (system/shell) para renderizarlo acoplado
 * en tarjeta colapsada en vez de volcar el texto crudo en el chat.
 * Solo roles system/shell: un user/assistant que mencione el marker jamás
 * se colapsa.
 */
export function classifyServerNotice(role: string | undefined, text: string): ServerNoticeKind | undefined {
  const t = (text ?? "").trim()
  if (!t) return undefined
  if (role === "shell") return "shell"
  if (role !== "system") return undefined
  if (t.includes(TOOL_CATALOG_MARKER)) return "codemode"
  if (t.includes("<skill>") || /new skills are available/i.test(t)) return "skills"
  return undefined
}

function pruneToolState(state: MessageEnvelope["parts"][number]["state"]): MessageEnvelope["parts"][number]["state"] {
  if (!state || typeof state !== "object") return state
  const s = state as Record<string, any>
  if (s.status !== "completed") return state

  let modified = false
  const pruned = { ...s }

  if (typeof s.output === "string" && s.output.length > MAX_TOOL_OUTPUT_CHARS) {
    const total = s.output.length
    pruned.output = s.output.slice(0, PRESERVE_TOOL_HEAD_CHARS) + `\n... [output pruned for RAM: ${total} chars]`
    modified = true
  }

  return modified ? pruned : state
}

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
    // Reporte de subagente: los parts de texto llegan envueltos en
    // `<subagent ...>...</subagent>` — se muestra el contenido limpio (la
    // tarjeta propia con el rótulo la dibuja MessageBubble).
    const subagentResult = isSubagentResultMessage(message)
    const cleanText = (t: string): string => (subagentResult ? stripSubagentWrapper(t) : t)
    const thinkingParts: Array<{ id: string; text: string; time?: { start?: number; end?: number } }> = []
    const toolParts: Array<{ id: string; type: string; sessionID?: string; text?: string; callID?: string; tool?: string; state?: MessageEnvelope["parts"][number]["state"] }> = []
    const textBlocks: string[] = []
    // Orden real de los parts para render intercalado (texto→tool→texto).
    // Los segmentos comparten las mismas referencias que toolParts/textBlocks.
    const segments: RenderedSegment[] = []
    for (const part of message.parts) {
      if (part.type === "tool" || toolPartTypes.has(part.type)) {
        const isTaskCard = part.tool === "task" || part.tool === "subagent" ||
          (part.state && typeof part.state === "object" && (((part.state as any).input?.subagent_type || (part.state as any).input?.prompt)))
        // Si el tool part pertenece a una sesión hija (subagente) y no es la tarjeta principal del task,
        // no se inyecta en el flujo de herramientas del padre.
        if (part.sessionID && part.sessionID !== message.info.sessionID && !isTaskCard) {
          continue
        }
        let toolText = part.text
        if (typeof toolText === "string" && toolText.length > MAX_TOOL_OUTPUT_CHARS) {
          toolText = toolText.slice(0, PRESERVE_TOOL_HEAD_CHARS) + `\n... [text pruned for RAM: ${toolText.length} chars]`
        }

        const tool = {
          id: part.id,
          type: part.type,
          sessionID: part.sessionID ?? message.info.sessionID,
          text: toolText,
          callID: part.callID,
          tool: part.tool,
          state: pruneToolState(part.state),
        }
        toolParts.push(tool)
        segments.push({ kind: "tool", id: part.id, tool })
        continue
      }
      const t = part.text
      if (t) {
        if (part.type === "text" || part.type === "compaction") {
          const c = cleanText(t)
          textBlocks.push(c)
          segments.push({ kind: "text", id: part.id, text: c })
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
      const noticeKind = classifyServerNotice(message.info.role, text)
      const rendered: RenderedMessage = { ...message, text, hasCompaction, thinkingParts, toolParts, segments, tokens: message.info.tokens, cost: message.info.cost, summaryDiffs: diffs, dataMode, turnMode, isToolCatalog: noticeKind === "codemode", noticeKind } as RenderedMessage
      out.push(rendered)
      nextCache.set(message.info.id, { src: message, rendered, diffs, turnMode, dataMode })
    }
  }
  // Cache acotado: si la lista creció/encogió mucho (cambio de sesión), se
  // descarta todo y se reconstruye en el próximo cálculo.
  if (nextCache.size > out.length * 3) nextCache.clear()
  return { out, cache: nextCache }
}

// Agrupa los diffs por turno (prompt user + respuestas siguientes).
// Fuente: summaryDiffs del server si vienen; si no (opencode v2 no los
// manda), se derivan de los tool parts de archivo del turno.
// Solo turnos con archivos; archivos repetidos se fusionan (suma stats,
// queda el último patch). Orden cronológico.
export function groupTurnDiffs(messages: RenderedMessage[]): TurnChanges[] {
  const turns: TurnChanges[] = []
  let current: TurnChanges | null = null
  const flush = () => {
    if (current && current.files.length > 0) turns.push(current)
    current = null
  }
  const merge = (target: TurnChanges, d: { file?: string; additions: number; deletions: number; patch?: string }) => {
    const key = d.file || ""
    const prev = target.files.find((f) => (f.file || "") === key)
    if (prev) {
      prev.additions = (prev.additions ?? 0) + (d.additions ?? 0)
      prev.deletions = (prev.deletions ?? 0) + (d.deletions ?? 0)
      if (d.patch) prev.patch = d.patch
    } else {
      target.files.push({ ...d })
    }
  }
  const ensureCurrent = (id: string) => {
    if (!current) current = { id, label: "", files: [] }
    return current
  }
  for (const m of messages) {
    if (m.info.role === "user" && m.text.trim()) {
      flush()
      const label = m.text.trim().split("\n")[0] ?? ""
      current = { id: m.info.id, label: label.length > 80 ? label.slice(0, 80) + "…" : label, files: [] }
    }
    const diffs = m.summaryDiffs
    if (diffs && diffs.length > 0) {
      const target = ensureCurrent(m.info.id)
      for (const d of diffs) merge(target, d)
      continue
    }
    if (!m.toolParts || m.toolParts.length === 0) continue
    const target = ensureCurrent(m.info.id)
    for (const tp of m.toolParts) {
      const fd = toolPartFileDiff({ tool: tp.tool, state: tp.state })
      if (fd) merge(target, fd)
    }
  }
  flush()
  return turns
}
