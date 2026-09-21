// Helpers de forma/rol de mensaje (U9): un solo criterio para "es user /
// assistant" y para leer el rol, en vez de repetir `info.role === ...` por el
// árbol. Tipos estructurales: sirven tanto para `MessageEnvelope` como para
// `RenderedMessage` y para los sobres crudos del SSE.
//
// U9 (onda 3): también centraliza la construcción del mensaje user optimista
// (`buildUserMessage`, compartido por `parseCommand.buildOptimisticMessage` y
// `stores/outboxStore.buildOutboxMessage`) y la lectura del texto visible
// (`messageText`, compartido por `parseCommand.envelopeText` y `useMessages.extractText`).
import type { MessageEnvelope } from "../types"

export type MessageLike = { info?: { role?: string } | null } | null | undefined

/** Rol del mensaje (`"user"`, `"assistant"`, `"system"`, ...), o `undefined`. */
export function messageRole(message: MessageLike): string | undefined {
  return message?.info?.role
}

/** `true` si el mensaje es del usuario. */
export function isUserMessage(message: MessageLike): boolean {
  return message?.info?.role === "user"
}

/** `true` si el mensaje es del asistente. */
export function isAssistantMessage(message: MessageLike): boolean {
  return message?.info?.role === "assistant"
}

export type MessageTextLike = { parts?: Array<{ text?: string; type?: string }> | null } | null | undefined

// ---------------------------------------------------------------------------
// Resultado de subagente (U-synthetic): el server lo inyecta como mensaje
// `synthetic` con `metadata.source === "subagent"` y el texto envuelto en
// `<subagent ...>...</subagent>`. Sin trato propio se pintaba como tarjeta
// neutra con los tags crudos visibles, indistinguible de un mensaje propio.
// ---------------------------------------------------------------------------

export type SubagentTag = {
  sessionID?: string
  state?: string
  description?: string
}

export type SubagentResultInfo = {
  /** Agente del subagente (`metadata.agent`, ej. "worker"). */
  agent?: string
  /** Sesión hija (para abrirla con onViewSubagents). */
  childID?: string
  /** Atributos de la etiqueta `<subagent ...>`. */
  tag: SubagentTag
}

type SubagentLike = {
  info?: { role?: string; metadata?: Record<string, unknown> | null } | null
  parts?: Array<{ text?: string; type?: string }> | null
} | null | undefined

function tagAttr(tag: string, name: string): string | undefined {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i"))
  return m?.[1] || undefined
}

/** Atributos de la etiqueta `<subagent ...>` de apertura, o null si no hay. */
export function parseSubagentTag(text: string): SubagentTag | null {
  const m = (text ?? "").match(/<subagent(\s[^>]*)?>/i)
  if (!m) return null
  const open = m[0]
  return {
    sessionID: tagAttr(open, "sessionID"),
    state: tagAttr(open, "state"),
    description: tagAttr(open, "description"),
  }
}

/** Quita todas las marcas `<subagent ...>` / `</subagent>` dejando el contenido. */
export function stripSubagentWrapper(text: string): string {
  const t = text ?? ""
  if (!/<\/?subagent(\s[^>]*)?>/i.test(t)) return t
  return t
    .replace(/<subagent(\s[^>]*)?>/gi, "")
    .replace(/<\/subagent>/gi, "")
    .trim()
}

/**
 * `true` si el mensaje es el reporte de un subagente (nunca un mensaje del
 * usuario): marca del server (`metadata.source`) o rol `synthetic` con la
 * etiqueta. Un user/assistant que MENCIONE `<subagent>` no matchea.
 */
export function isSubagentResultMessage(message: SubagentLike): boolean {
  // Blindaje: un mensaje del usuario jamás es reporte, venga con la marca
  // que venga (la invariante no depende solo del server).
  if (!message || message.info?.role === "user") return false
  const meta = message.info?.metadata
  if (meta && (meta as Record<string, unknown>).source === "subagent") return true
  if (message.info?.role !== "synthetic") return false
  return (message.parts ?? []).some((p) => !!p?.text && /<subagent(\s[^>]*)?>/i.test(p.text))
}

/** Info para la tarjeta de resultado; null si no es reporte de subagente. */
export function getSubagentResultInfo(message: SubagentLike): SubagentResultInfo | null {
  if (!isSubagentResultMessage(message)) return null
  const meta = (message?.info?.metadata ?? {}) as Record<string, unknown>
  const joined = (message?.parts ?? []).map((p) => p?.text ?? "").join("\n")
  const tag = parseSubagentTag(joined) ?? {}
  const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined)
  return {
    agent: str(meta.agent),
    childID: str(meta.childID) ?? str(meta.childSessionID) ?? tag.sessionID,
    tag,
  }
}
/**
 * Texto visible de un mensaje: concatena los parts de texto/compaction con
 * `"\n\n"` y recorta. Un solo cuerpo para `extractText` (useMessages) y
 * `envelopeText` (parseCommand).
 */
export function messageText(message: MessageTextLike): string {
  const blocks: string[] = []
  for (const part of message?.parts ?? []) {
    if (!part?.text) continue
    if (part.type === "text" || part.type === "compaction") blocks.push(part.text)
  }
  return blocks.join("\n\n").trim()
}

export type UserMessageImage = { base64: string; mime: string; name?: string }

/**
 * Constructor único del mensaje user local (optimista del envío y de la cola
 * outbox). IDs derivados del id del mensaje para que sean únicos y estables.
 */
export function buildUserMessage(params: {
  id: string
  sessionID: string
  text: string
  images?: UserMessageImage[]
  createdAt?: number
}): MessageEnvelope {
  const parts: MessageEnvelope["parts"] = params.text
    ? [{ id: `${params.id}-part`, type: "text", text: params.text }]
    : []
  params.images?.forEach((img, n) => {
    parts.push({ id: `${params.id}-img-${n}`, type: "image", data: img.base64, mimeType: img.mime })
  })
  return {
    info: { id: params.id, role: "user", sessionID: params.sessionID, time: { created: params.createdAt ?? Date.now() } },
    parts,
  }
}
