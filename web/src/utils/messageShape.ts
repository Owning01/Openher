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

/** Forma mínima de un mensaje inyectado por el server (rol `synthetic`). */
type SyntheticLike = {
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
export function isSubagentResultMessage(message: SyntheticLike): boolean {
  // Blindaje: un mensaje del usuario jamás es reporte, venga con la marca
  // que venga (la invariante no depende solo del server).
  if (!message || message.info?.role === "user") return false
  const meta = message.info?.metadata
  if (meta && (meta as Record<string, unknown>).source === "subagent") return true
  if (message.info?.role !== "synthetic") return false
  return (message.parts ?? []).some((p) => !!p?.text && /<subagent(\s[^>]*)?>/i.test(p.text))
}

/** Info para la tarjeta de resultado; null si no es reporte de subagente. */
export function getSubagentResultInfo(message: SyntheticLike): SubagentResultInfo | null {
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
// ---------------------------------------------------------------------------
// Comando en SEGUNDO PLANO (U-shell): el server lo inyecta como mensaje
// `synthetic` con `metadata.source === "shell"` y el texto envuelto en
// `<shell id="..." state="..." command="...">salida</shell>`. Sin trato propio
// la etiqueta cruda se volcaba en el chat como texto suelto; acá se separa
// comando + salida para pintarlo como una herramienta más.
// ---------------------------------------------------------------------------

export type ShellTag = {
  id?: string
  state?: string
  command?: string
}

export type ShellResultInfo = {
  /** Id del shell en el server (`metadata.shellID`, o el de la etiqueta). */
  shellID?: string
  /** Job que lo originó (`metadata.jobID`), si vino. */
  jobID?: string
  /** `completed` | `error` | `cancelled` (lo que mande el server). */
  state?: string
  /** Comando ejecutado, tal cual lo mandó el server. */
  command?: string
  /** Salida cruda, sin la etiqueta que la envuelve. */
  output: string
  /** Código de salida, si el server lo informó. */
  exit?: number
  /** El server recortó la salida. */
  truncated?: boolean
}

// La etiqueta la genera el server: `id` y `state` primero, `command` último y
// con comillas y `>` adentro (redirecciones), así que el comando se toma hasta
// el `">` que cierra el tag y no con un matcheo ingenuo de `[^"]*`.
const SHELL_TAG_OPEN = /<shell\s+id="([^"]*)"\s+state="([^"]*)"\s+command="/i

function splitShellTag(text: string): { tag: ShellTag; output: string } | null {
  const t = text ?? ""
  const m = t.match(SHELL_TAG_OPEN)
  if (!m) {
    // Etiqueta sin `command` (o con otro orden): no perder id/state ni la salida.
    const loose = t.match(/<shell(\s[^>]*)?>/i)
    if (!loose) return null
    return {
      tag: { id: tagAttr(loose[0], "id"), state: tagAttr(loose[0], "state"), command: tagAttr(loose[0], "command") },
      output: t.slice(loose.index! + loose[0].length).replace(/<\/shell>\s*$/i, "").trim(),
    }
  }
  const afterOpen = m.index! + m[0].length
  const tagEnd = t.indexOf('">', afterOpen)
  const command = tagEnd === -1 ? t.slice(afterOpen) : t.slice(afterOpen, tagEnd)
  const body = tagEnd === -1 ? "" : t.slice(tagEnd + 2)
  return { tag: { id: m[1], state: m[2], command }, output: body.replace(/<\/shell>\s*$/i, "").trim() }
}

/** Atributos de la etiqueta `<shell ...>` de apertura, o null si no hay. */
export function parseShellTag(text: string): ShellTag | null {
  return splitShellTag(text)?.tag ?? null
}

/** Quita el envoltorio `<shell ...>...</shell>` dejando la salida. */
export function stripShellWrapper(text: string): string {
  return splitShellTag(text)?.output ?? text ?? ""
}

/**
 * `true` si el mensaje es la salida de un comando en segundo plano (nunca un
 * mensaje del usuario): marca del server (`metadata.source`) o rol `synthetic`
 * con la etiqueta. Un user/assistant que MENCIONE `<shell>` no matchea.
 */
export function isShellResultMessage(message: SyntheticLike): boolean {
  // Blindaje: un mensaje del usuario jamás es reporte, venga con la marca que
  // venga (la invariante no depende solo del server).
  if (!message || message.info?.role === "user") return false
  const meta = message.info?.metadata
  if (meta && (meta as Record<string, unknown>).source === "shell") return true
  if (message.info?.role !== "synthetic") return false
  return (message.parts ?? []).some((p) => !!p?.text && /<shell(\s[^>]*)?>/i.test(p.text))
}

/** Comando + salida del shell; null si el mensaje no es un resultado de shell. */
export function getShellResultInfo(message: SyntheticLike): ShellResultInfo | null {
  if (!isShellResultMessage(message)) return null
  const meta = (message?.info?.metadata ?? {}) as Record<string, unknown>
  const str = (v: unknown): string | undefined => (typeof v === "string" && v ? v : undefined)
  const joined = (message?.parts ?? []).map((p) => p?.text ?? "").join("\n")
  const split = splitShellTag(joined)
  return {
    shellID: str(meta.shellID) ?? str(meta.jobID) ?? split?.tag.id,
    jobID: str(meta.jobID),
    state: str(meta.state) ?? split?.tag.state,
    command: split?.tag.command || undefined,
    output: split?.output ?? joined.trim(),
    exit: typeof meta.exit === "number" ? meta.exit : undefined,
    truncated: meta.truncated === true ? true : undefined,
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

/**
 * ¿El server ya recibió este texto como mensaje user? Eco de entrega para el
 * catch de `useMessageSend`: en Android el POST del SDK puede fallar en el
 * cliente (preflight del WebView) DESPUÉS de que el server lo procesó — sin
 * esta verificación el optimista se borraba y el mensaje "se perdía" de la UI.
 * Reloj mixto (cliente vs server) → ventana amplia por defecto (10 min).
 */
export function findDeliveredEcho(
  messages: readonly MessageEnvelope[] | undefined | null,
  text: string,
  since: number,
): MessageEnvelope | null {
  const target = text.trim()
  if (!target || !messages?.length) return null
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (!isUserMessage(m)) continue
    if ((m.info.time?.created ?? 0) < since) continue
    if (messageText(m).trim() === target) return m
  }
  return null
}

/**
 * Filtra el historial para conservar únicamente los últimos N turnos del usuario
 * (por defecto 3), incluyendo todos los mensajes intermedios (asistente, herramientas,
 * diffs, subagentes, etc.) que hayan ocurrido a partir del N-ésimo mensaje de usuario hacia adelante.
 * Si hay N o menos mensajes de usuario, conserva todo el historial disponible.
 * Normaliza en orden cronológico (antiguos primero) para garantizar que, si el servidor o la caché
 * entregan el array en orden descendente (más nuevo primero), se seleccionen los turnos recientes reales.
 */
export function sliceLastUserTurns<T extends { info?: { role?: string; time?: { created?: number } } }>(
  messages: readonly T[] | undefined | null,
  userTurnsCount = 3,
): T[] {
  if (!messages || messages.length === 0) return []
  if (userTurnsCount <= 0) return [...messages]

  let normalized = [...messages]
  const hasTimestamps = messages.some((m) => (m?.info?.time?.created ?? 0) > 0)
  if (hasTimestamps) {
    let descCount = 0
    let ascCount = 0
    for (let i = 1; i < messages.length; i++) {
      const prev = messages[i - 1]?.info?.time?.created ?? 0
      const curr = messages[i]?.info?.time?.created ?? 0
      if (prev > 0 && curr > 0) {
        if (prev > curr) descCount++
        else if (curr > prev) ascCount++
      }
    }
    if (descCount > ascCount) {
      normalized.reverse()
    }
    normalized.sort((a, b) => (a?.info?.time?.created || 0) - (b?.info?.time?.created || 0))
  }

  const userIndices: number[] = []
  for (let i = 0; i < normalized.length; i++) {
    if (normalized[i]?.info?.role === "user") {
      userIndices.push(i)
    }
  }

  if (userIndices.length <= userTurnsCount) {
    return [...normalized]
  }

  const startIndex = userIndices[userIndices.length - userTurnsCount]
  return normalized.slice(startIndex)
}

