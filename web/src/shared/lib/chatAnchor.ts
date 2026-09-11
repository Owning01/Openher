const MEM_KEY = "openher.chatAnchor.v3"
const WINDOW_MS = 2 * 60 * 60 * 1000
const MAX_KEYS = 300

export type ChatAnchor = { kind: "bottom" } | { kind: "at"; messageId: string }

const mem = new Map<string, { anchor: ChatAnchor; ts: number }>()

function readStore(): Record<string, { anchor: ChatAnchor; ts: number }> {
  try {
    const raw = sessionStorage.getItem(MEM_KEY)
    if (!raw) return {}
    const p = JSON.parse(raw) as Record<string, { anchor: ChatAnchor; ts: number }>
    return p && typeof p === "object" ? p : {}
  } catch {
    return {}
  }
}

function flushStore() {
  try {
    const obj: Record<string, { anchor: ChatAnchor; ts: number }> = {}
    for (const [k, v] of mem) obj[k] = v
    sessionStorage.setItem(MEM_KEY, JSON.stringify(obj))
  } catch {
    /* storage privado: memoria solo */
  }
}

export function saveChatAnchor(sessionID: string | null, anchor: ChatAnchor) {
  if (!sessionID) return
  if (mem.size >= MAX_KEYS && !mem.has(sessionID)) {
    const oldest = mem.keys().next().value
    if (oldest !== undefined) mem.delete(oldest)
  }
  mem.set(sessionID, { anchor, ts: Date.now() })
}

export function flushChatAnchors() {
  flushStore()
}

export function loadChatAnchor(sessionID: string | null): ChatAnchor | null {
  if (!sessionID) return null
  const hit = mem.get(sessionID)
  if (hit && Date.now() - hit.ts < WINDOW_MS) return hit.anchor
  const stored = readStore()[sessionID]
  if (stored && Date.now() - stored.ts < WINDOW_MS) {
    mem.set(sessionID, stored)
    return stored.anchor
  }
  return null
}

export function resolveInitialIndex(
  messages: Array<{ info: { id: string } }>,
  sessionID: string | null,
): number | undefined {
  if (messages.length === 0) return undefined
  const saved = loadChatAnchor(sessionID)
  if (saved && saved.kind === "at") {
    const idx = messages.findIndex((m) => m.info.id === saved.messageId)
    if (idx >= 0) return idx
  }
  return messages.length - 1
}

export function __clearChatAnchors() {
  mem.clear()
  try {
    sessionStorage.removeItem(MEM_KEY)
  } catch {
    /* noop */
  }
}
