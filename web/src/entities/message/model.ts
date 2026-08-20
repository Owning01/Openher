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
    error?: { name: string; message?: string }
    tokens?: {
      total?: number
      input: number
      output: number
      reasoning: number
      cache: { read: number; write: number }
    }
    cost?: number
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

export type RenderedMessage = {
  info: MessageEnvelope["info"]
  parts: MessageEnvelope["parts"]
  text: string
  hasCompaction: boolean
  thinkingParts: ThinkingPart[]
  toolParts: Array<{
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
  }>
  summaryDiffs?: FileDiff[]
  dataMode?: string
  turnMode?: string
  tokens?: MessageTokens
  cost?: number
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
