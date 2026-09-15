import type { FileDiff } from "../file/model.ts"

export type TokenUsage = {
  total?: number
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

export type MessageTokens = {
  total?: number
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

export type MessageEnvelope = {
  info: {
    id: string
    role: string
    sessionID: string
    time: {
      created: number
      completed?: number
    }
    agent?: string
    parentID?: string
    modelID?: string
    providerID?: string
    mode?: string
    finish?: string
    summary?: { diffs?: FileDiff[] }
    error?: { name: string; message?: string; ref?: string }
    tokens?: {
      total?: number
      input: number
      output: number
      reasoning: number
      cache: { read: number; write: number }
    }
    cost?: number
    /** Marca de origen (ej. {from: "otro-agente", kind: "agent"}): la pone
     * quien envía vía inbox/API. Si trae `from`, el globo se pinta distinto. */
    metadata?: Record<string, unknown>
  }
  parts: Array<{
    id: string
    type: string
    sessionID?: string
    text?: string
    data?: string
    url?: string
    mimeType?: string
    mime?: string
    filename?: string
    callID?: string
    tool?: string
    state?: {
      status?: string
      input?: unknown
      output?: unknown
      error?: unknown
      duration?: number
      metadata?: Record<string, unknown>
    }
    time?: { created?: number; completed?: number; start?: number; end?: number }
  }>
}

export type ThinkingPart = {
  id: string
  text: string
  time?: { start?: number; end?: number }
}

export type RenderedToolPart = {
  id: string
  type: string
  text?: string
  callID?: string
  tool?: string
  state?: {
    status?: string
    input?: unknown
    output?: unknown
    error?: unknown
    duration?: number
    title?: string
    metadata?: Record<string, unknown>
  }
}

/**
 * Orden real de los parts renderizables de un mensaje (texto/tool
 * intercalados). Sin esto, MessageBubble aplana a `text` + `toolParts` y
 * pierde el orden: un tool entre dos textos se dibuja antes que todo.
 */
export type RenderedSegment =
  | { kind: "text"; id: string; text: string }
  | { kind: "tool"; id: string; tool: RenderedToolPart }

export type RenderedMessage = {
  info: MessageEnvelope["info"]
  parts: MessageEnvelope["parts"]
  text: string
  hasCompaction: boolean
  thinkingParts: ThinkingPart[]
  toolParts: RenderedToolPart[]
  /** Orden de parts (texto/tool). Si falta, usar text+toolParts (compat). */
  segments?: RenderedSegment[]
  summaryDiffs?: FileDiff[]
  dataMode?: string
  turnMode?: string
  tokens?: MessageTokens
  cost?: number
  /** Aviso largo del server (catálogo Code Mode): se renderiza colapsado. */
  isToolCatalog?: boolean
}

/** Resumen de archivos cambiados en un turno (prompt user + respuestas). */
export type TurnChanges = {
  id: string
  /** Primeros ~80 chars del prompt que abrió el turno. */
  label: string
  files: FileDiff[]
}

export type StreamingPart = {
  messageID: string
  partID: string
  text: string
  field: string
}

export type CachedMessages = {
  sessionID: string
  messages: MessageEnvelope[]
  cachedAt: number
}
