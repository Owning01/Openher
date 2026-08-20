/**
 * Chat domain service — lógica pura testeable extraída de `hooks/useMessages.ts`.
 *
 * Solo funciones puras (sin React, sin fetch). Re-exporta helpers de
 * validación y los operadores de merge/dedupe que el hook usaba inline.
 */
import type { MessageEnvelope } from "../../../entities/message/model"
import type { DataMode } from "../../../entities/config/model"
import { isImagePart, countImageParts } from "../../../utils"

// Re-export canónico: los consumidores del dominio importan desde aquí
export { isImagePart, countImageParts }

// ---------------------------------------------------------------------------
// extractText — texto plano de un MessageEnvelope
// ---------------------------------------------------------------------------

export function extractText(msg: MessageEnvelope): string {
  const blocks: string[] = []
  for (const part of msg.parts) {
    if (!part.text) continue
    if (part.type === "text" || part.type === "compaction") blocks.push(part.text)
  }
  return blocks.join("\n\n").trim()
}

// ---------------------------------------------------------------------------
// buildSignature — firma barata para detectar cambios de lista
// Alias buildMessageSignature por compatibilidad con useMessages
// ---------------------------------------------------------------------------

export function buildSignature(messages: MessageEnvelope[]): string {
  return messages.map((m) => `${m.info.id}:${extractText(m).length}`).join("|")
}

export const buildMessageSignature = buildSignature

// ---------------------------------------------------------------------------
// shouldFilterMessage — filtro de mensajes internos (pty, etc.)
// ---------------------------------------------------------------------------

export function shouldFilterMessage(msg: MessageEnvelope): boolean {
  const text = extractText(msg)
  if (text.includes("<pty_exited>") || text.includes("Use pty_read to check")) return true
  return false
}

// ---------------------------------------------------------------------------
// stripNonEssential — recorte por DataMode (conserva file/shell tools)
// ---------------------------------------------------------------------------

const toolPartTypes = new Set(["tool_use", "tool_result", "tool", "execution", "terminal", "code_execution", "tool_call"])
const fileToolNames = new Set(["write", "edit", "apply_patch", "patch"])
const shellToolNames = new Set(["bash", "execute", "terminal", "shell", "pwsh", "cmd"])

export function stripNonEssential(msg: MessageEnvelope, dataMode?: DataMode): MessageEnvelope {
  if (dataMode === "full" || dataMode === "saver") return msg
  const keep = (p: MessageEnvelope["parts"][number]) =>
    !toolPartTypes.has(p.type) || (typeof p.tool === "string" && (fileToolNames.has(p.tool) || shellToolNames.has(p.tool)))
  const filtered = msg.parts.filter(keep)
  return filtered.length === msg.parts.length ? msg : { ...msg, parts: filtered }
}

// ---------------------------------------------------------------------------
// mergeMessages — merge por id preservando parts locales (misma sesión)
// ---------------------------------------------------------------------------

/**
 * Funde `safe` (respuesta del server) sobre `prev` sin perder parts
 * locales streameados que el fetch acotado no incluye.
 * - Descarta mensajes de otras sesiones.
 * - Conserva parts locales cuyo id no está en `updated`.
 * - Retorna `prev` si no hubo cambios (referential equality).
 */
export function mergeMessages(
  prev: MessageEnvelope[],
  safe: MessageEnvelope[],
  sessionID: string,
): MessageEnvelope[] {
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
      const remoteIDs = new Set(updated.parts.map((p) => p.id))
      const extraLocal = m.parts.filter((p) => !remoteIDs.has(p.id))
      const parts =
        extraLocal.length > 0
          ? [...updated.parts, ...extraLocal].sort((a, b) => {
              if (!a.id || !b.id) return 0
              return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
            })
          : updated.parts
      merged.push({ ...updated, parts })
      msgMap.delete(m.info.id)
      if (updated.info.time.completed !== m.info.time.completed || updated.info.role !== m.info.role) changed = true
    } else {
      merged.push(m)
    }
  }

  for (const m of msgMap.values()) {
    if (seen.has(m.info.id)) continue
    seen.add(m.info.id)
    merged.push(m)
    changed = true
  }

  if (!changed) return prev
  merged.sort((a, b) => (a.info.time.created ?? 0) - (b.info.time.created ?? 0))
  return merged
}

// ---------------------------------------------------------------------------
// dedupeOptimistic — filtra optimistas ya confirmados por el server
// ---------------------------------------------------------------------------

export function dedupeOptimistic(
  pending: MessageEnvelope[],
  serverMessages: MessageEnvelope[],
  sessionID: string,
): MessageEnvelope[] {
  if (pending.length === 0) return pending
  const sessionPending = pending.filter((m) => m.info.sessionID === sessionID)
  if (sessionPending.length === 0) return pending

  const confirmedUsers = serverMessages.filter((m) => m.info.role === "user")
  const confirmedIDs = new Set(confirmedUsers.map((m) => m.info.id))
  const confirmedTexts = new Set(confirmedUsers.map((m) => extractText(m).trim()).filter(Boolean))

  const confirmedImageCounts = new Map<string, number>()
  for (const m of confirmedUsers) {
    const imgCount = countImageParts(m.parts)
    if (imgCount > 0) confirmedImageCounts.set(`${m.info.sessionID}:${extractText(m).trim()}`, imgCount)
  }

  const removeIDs = new Set<string>(confirmedIDs)
  const matchedTexts = new Set<string>()

  for (const m of sessionPending) {
    if (confirmedIDs.has(m.info.id)) continue
    const t = extractText(m).trim()
    if (t && confirmedTexts.has(t) && !matchedTexts.has(t)) {
      matchedTexts.add(t)
      removeIDs.add(m.info.id)
    } else if (!t) {
      const optImgCount = m.parts.filter((p) => isImagePart(p)).length
      const key = `${m.info.sessionID}:`
      const serverImgCount = confirmedImageCounts.get(key)
      if (serverImgCount !== undefined && serverImgCount === optImgCount) {
        removeIDs.add(m.info.id)
        confirmedImageCounts.delete(key)
      }
    }
  }

  const next = pending.filter((m) => m.info.sessionID !== sessionID || !removeIDs.has(m.info.id))
  return next.length === pending.length ? pending : next
}

// ---------------------------------------------------------------------------
// filterOptimisticForRender — compara textos para el mem de renderedMessages
// ---------------------------------------------------------------------------

export function filterOptimisticForRender(
  messages: MessageEnvelope[],
  optimistic: MessageEnvelope[],
): MessageEnvelope[] {
  if (optimistic.length === 0) return messages
  const existingUserTexts = new Set(
    messages.filter((m) => m.info.role === "user").map((m) => `${m.info.sessionID}:${extractText(m).trim()}`),
  )
  const existingImageCounts = new Map<string, number>()
  for (const m of messages.filter((m) => m.info.role === "user")) {
    const imgCount = countImageParts(m.parts)
    if (imgCount > 0) existingImageCounts.set(m.info.sessionID, (existingImageCounts.get(m.info.sessionID) ?? 0) + imgCount)
  }
  const pending = optimistic.filter((opt) => {
    const key = `${opt.info.sessionID}:${extractText(opt).trim()}`
    if (existingUserTexts.has(key)) { existingUserTexts.delete(key); return false }
    if (!extractText(opt).trim()) {
      const optImgCount = opt.parts.filter((p) => isImagePart(p)).length
      if (optImgCount > 0 && existingImageCounts.has(opt.info.sessionID)) return false
    }
    return true
  })
  return pending.length === 0 ? messages : [...messages, ...pending]
}
