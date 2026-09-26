import { useMemo } from "react"
import { formatCompact } from "../utils"
import type { RenderedMessage, ModelOption, SessionView, TokenUsage } from "../types"

// Contador compacto de contexto (tokens + % del límite) del chat. Vive en el
// HEADER (no en el composer) y sin precio: el precio de la sesión no se muestra.
export function useContextDisplay(
  messages: RenderedMessage[],
  activeModelOption: ModelOption | null,
  selectedSession: SessionView | null,
) {
  return useMemo(() => {
    // Buscar tokens del último mensaje con datos o usar los tokens acumulados de la sesión
    let lastMsgTokens: RenderedMessage["tokens"] | TokenUsage | undefined

    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.tokens && ((m.tokens.input ?? 0) + (m.tokens.output ?? 0) + (m.tokens.reasoning ?? 0) > 0)) {
        lastMsgTokens = m.tokens
        break
      }
    }

    if (!lastMsgTokens && selectedSession?.tokens) {
      lastMsgTokens = selectedSession.tokens
    }

    let total = 0
    if (lastMsgTokens) {
      total = (lastMsgTokens.input ?? 0) + (lastMsgTokens.output ?? 0) +
        (lastMsgTokens.reasoning ?? 0) + (lastMsgTokens.cache?.read ?? 0) + (lastMsgTokens.cache?.write ?? 0)
    }

    if (total <= 0) {
      // Estimar tokens acumulados de los mensajes si la tarea está en curso
      let sumChars = 0
      for (const m of messages) {
        sumChars += m.text ? m.text.length : 0
      }
      if (sumChars > 0) {
        total = Math.round(sumChars / 4)
      }
    }

    const cost = selectedSession?.cost ?? 0
    if (total <= 0) return null

    const limit = activeModelOption?.contextLimit
    const pct = limit && limit > 0 && total > 0 ? Math.round((total / limit) * 100) : null
    // Solo tokens: el precio de la sesión ya no se muestra (pedido 25-sep) y el
    // contador vive en el header del chat, no en el composer.
    const label = formatCompact(total) + (pct !== null ? ` (${pct}%)` : "")
    return { total, pct, limit, cost, label }
  }, [messages, activeModelOption?.contextLimit, selectedSession?.tokens, selectedSession?.cost])
}
