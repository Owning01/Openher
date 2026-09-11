/**
 * Prompt caching helpers — harness-style (Anthropic explicit + OpenAI automatic).
 *
 * Referencias verificadas:
 * - Anthropic: cache_control ephemeral en system/tools y en último bloque estable de messages (máx 4 breakpoints),
 *   TTL 5m por defecto, 1h opcional, mínimo 1024 tokens, prefix exacto.
 * - OpenAI: automático para >=1024 (GPT-5.6) / 2048 (otros) si prefix exacto, prompt_cache_key para routing.
 * - Meta: automático sin flag.
 *
 * Estrategia para QuickChat (sin tools):
 *  - system estable primero  → breakpoint 1 (cacheado)
 *  - historial -1 estable    → breakpoint 2 (si hay >=3 mensajes, el penúltimo se marca)
 *  - último user (con searchBlock variable) → sin cache, input_tokens puro
 *
 * Así: cached = system + historial viejo (90% ahorro), input = solo pregunta nueva + búsqueda.
 * No mandamos "todo el output": el historial previo va como cache_read, no como input_tokens.
 */

import type { QuickChatMessage } from "../providers/types"

export const QC_SYSTEM_PROMPT =
  "Sos asistente breve y directo. Respondé conciso, sin rodeos. Máximo 12 líneas salvo que te pidan profundidad."

export const QC_SYSTEM_PROMPT_RESEARCH =
  "Sos asistente de investigación. Cuando te dan contexto web, sintetizá con rigor, citá URLs cuando aporten, " +
  "generá: 1) Resumen ejecutivo (3-4 líneas), 2) Puntos clave (bullets), " +
  "3) Diagrama Mermaid si ayuda a visualizar (```mermaid), 4) Preguntas de estudio. Sé conciso pero completo."

// Estima tokens rápida ~4 chars/token (suficiente para decidir breakpoints y trimming)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function totalEstimatedTokens(messages: QuickChatMessage[]): number {
  return messages.reduce((n, m) => n + estimateTokens(m.content), 0)
}

// Anthropic wire types mínimos
export type AnthropicContentBlock = {
  type: "text"
  text: string
  cache_control?: { type: "ephemeral"; ttl?: string }
}

export type AnthropicSystemBlock = {
  type: "text"
  text: string
  cache_control?: { type: "ephemeral"; ttl?: string }
}

export type AnthropicMessage = {
  role: "user" | "assistant"
  content: AnthropicContentBlock[]
}

export type AnthropicPayload = {
  model: string
  max_tokens: number
  system: AnthropicSystemBlock[]
  messages: AnthropicMessage[]
  temperature?: number
  stream?: boolean
  // top-level automatic caching alternative (no usar junto con explicit en mismo bloque)
  // cache_control?: { type: "ephemeral" }
}

/**
 * Construye payload Anthropic con 2 breakpoints explícitos:
 *  - system[0] → cache_control
 *  - messages[stableIdx].content[0] → cache_control (penúltimo si hay >=2 turnos)
 * Último user queda sin marca para que el delta sea input_tokens.
 */
export function buildAnthropicPayload(
  messages: QuickChatMessage[],
  opts: {
    model: string
    systemPrompt?: string
    maxTokens?: number
    temperature?: number
    stream?: boolean
    ttl?: "5m" | "1h"
  },
): AnthropicPayload {
  const sysText = opts.systemPrompt ?? QC_SYSTEM_PROMPT
  const ttl = opts.ttl === "1h" ? "1h" : undefined
  const sys: AnthropicSystemBlock[] = [
    {
      type: "text",
      text: sysText,
      cache_control: { type: "ephemeral", ...(ttl ? { ttl } : {}) },
    },
  ]

  // Mensajes: convertir QuickChat -> Anthropic. system se excluye (ya va en system), solo user/assistant.
  const filtered = messages.filter((m) => m.role === "user" || m.role === "assistant")
  // Últimos 12 para no exceder contexto, pero el cache prefix crece con cada turno
  const windowed = filtered.slice(-12)

  let stableIdx = -1
  if (windowed.length >= 3) {
    // penúltimo mensaje estable (evita marcar el último que es la pregunta nueva)
    stableIdx = windowed.length - 2
  } else if (windowed.length === 2) {
    stableIdx = 0
  }

  const anthroMessages: AnthropicMessage[] = windowed.map((m, idx) => {
    const block: AnthropicContentBlock = {
      type: "text",
      text: m.content,
    }
    if (idx === stableIdx) {
      block.cache_control = { type: "ephemeral", ...(ttl ? { ttl } : {}) }
    }
    return {
      role: m.role as "user" | "assistant",
      content: [block],
    }
  })

  return {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 500,
    temperature: opts.temperature ?? 0.4,
    stream: opts.stream ?? false,
    system: sys,
    messages: anthroMessages,
  }
}

// OpenAI payload con prompt_cache_key estable para routing (mejora hit rate a alto volumen)
export type OpenAIMessage = { role: "system" | "user" | "assistant"; content: string }
export type OpenAIPayload = {
  model: string
  messages: OpenAIMessage[]
  temperature?: number
  max_tokens?: number
  max_completion_tokens?: number
  stream?: boolean
  prompt_cache_key?: string
  // GPT-5.6 explicit breakpoint (no lo usamos por defecto, automático es suficiente)
  // prompt_cache_options?: { mode: "explicit" }
}

export function buildOpenAIPayload(
  messages: QuickChatMessage[],
  opts: {
    model: string
    systemPrompt?: string
    temperature?: number
    maxTokens?: number
    stream?: boolean
    cacheKey?: string
  },
): OpenAIPayload {
  const sysText = opts.systemPrompt ?? QC_SYSTEM_PROMPT
  // OpenAI: system primero estable, luego historial en orden. No duplicar systems.
  const history = messages.filter((m) => m.role !== "system")
  // Ventana 8 como antes pero sin re-inyectar system variable
  const windowed = history.slice(-8)
  const msgs: OpenAIMessage[] = [{ role: "system", content: sysText }, ...windowed.map((m) => ({ role: m.role as any, content: m.content }))]

  // Clave estable: quickchat:provider:model — no por user/request (rompería cache)
  const cacheKey = opts.cacheKey ?? `quickchat:${opts.model}`

  return {
    model: opts.model,
    messages: msgs,
    temperature: opts.temperature ?? 0.4,
    // Compat: algunos providers usan max_tokens, otros max_completion_tokens. Mandamos ambos donde aplique (el server ignora el no esperado)
    max_tokens: opts.maxTokens ?? 500,
    max_completion_tokens: opts.maxTokens ?? 500,
    stream: opts.stream ?? false,
    prompt_cache_key: cacheKey,
  }
}

// Helper para decidir si vale la pena cachear (supera mínimo 1024 tokens)
export function isCacheWorthy(messages: QuickChatMessage[], systemPrompt?: string): boolean {
  const sys = systemPrompt ?? QC_SYSTEM_PROMPT
  const total = estimateTokens(sys) + totalEstimatedTokens(messages)
  return total >= 1024
}

// Para providers que soportan Anthropic, detectar por URL
export function isAnthropicUrl(url: string): boolean {
  return /anthropic\.com/i.test(url)
}
