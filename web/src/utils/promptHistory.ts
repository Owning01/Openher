import type { RenderedMessage } from "../types"

// Historial de prompts: los prompts son los mensajes de rol "user" con texto
// de la sesión activa. Se derivan de `messages` (sin store nuevo) para que el
// panel y /history + /timeline siempre reflejen el chat real.

export const PROMPT_HISTORY_OPEN_EVENT = "openher:open-prompt-history"

export function openPromptHistory(): void {
  window.dispatchEvent(new CustomEvent(PROMPT_HISTORY_OPEN_EVENT))
}

export type PromptEntry = {
  id: string
  text: string
  created: number
  /** Nº cronológico del prompt dentro de la sesión (1-based). */
  n: number
}

export function extractUserPrompts(messages: RenderedMessage[], sessionID?: string): PromptEntry[] {
  const out: PromptEntry[] = []
  for (const m of messages) {
    if (m?.info?.role !== "user") continue
    // Defensa: si el array trae mensajes de otra sesión (races de transición),
    // el panel /history solo muestra los de la activa.
    if (sessionID && m.info.sessionID && m.info.sessionID !== sessionID) continue
    const text = (m.text ?? "").trim()
    if (!text) continue
    out.push({ id: m.info.id, text, created: m.info.time?.created ?? 0, n: out.length + 1 })
  }
  return out
}
