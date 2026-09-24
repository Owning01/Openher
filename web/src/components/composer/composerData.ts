import type { CommandInfo } from "../../types"

export const LOCAL_SLASH_COMMANDS: CommandInfo[] = [
  { name: "new", description: "New session in this project", source: "command" },
  { name: "help", description: "Show help and available commands", source: "command" },
  { name: "status", description: "Show current session status", source: "command" },
  { name: "undo", description: "Undo last message", source: "command" },
  { name: "redo", description: "Redo last undone message", source: "command" },
  { name: "compact", description: "Compact/compress conversation history", source: "command" },
  { name: "summarize", description: "Compact/compress conversation history (alias)", source: "command" },
  { name: "rename", description: "Rename current session: /rename <title>", source: "command" },
  { name: "export", description: "Export conversation to Markdown", source: "command" },
  { name: "themes", description: "List available themes", source: "command" },
  { name: "history", description: "Show prompt history panel", source: "command" },
  { name: "timeline", description: "Show prompt timeline panel", source: "command" },
  { name: "connect", description: "Connect providers (API keys, OpenAI-compatible)", source: "command" },
]

const HISTORY_BASE_KEY = "opencode.remote.promptHistory"
export const MAX_HISTORY = 50

// Historial POR SESIÓN (igual que el draft): con key global las flechas
// ↑/↓ mostraban prompts de todas las sesiones mezclados.
function historyKey(sessionID?: string): string {
  return sessionID ? `${HISTORY_BASE_KEY}.${sessionID}` : HISTORY_BASE_KEY
}

export function loadHistory(sessionID?: string): string[] {
  try {
    const raw = localStorage.getItem(historyKey(sessionID))
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

export function saveHistory(sessionID: string | undefined, h: string[]) {
  try { localStorage.setItem(historyKey(sessionID), JSON.stringify(h)) } catch { }
}
