import type { MessageEnvelope } from "../../../entities/message/model"
import type { IMessageCache } from "../application/ports"

export function createMessageCacheAdapter(): IMessageCache {
  const mem = new Map<string, MessageEnvelope[]>()
  const MAX = 50
  return {
    get: async (sessionID: string) => {
      const hit = mem.get(sessionID) ?? null
      if (hit) {
        mem.delete(sessionID)
        mem.set(sessionID, hit)
      }
      return hit
    },
    set: async (sessionID: string, messages: MessageEnvelope[]) => {
      mem.set(sessionID, messages)
      if (mem.size > MAX) {
        const first = mem.keys().next().value as string | undefined
        if (first) mem.delete(first)
      }
    },
    clear: async (sessionID: string) => {
      mem.delete(sessionID)
    },
  }
}

export function createPersistentCacheAdapter(prefix = "opencode.chat.cache"): IMessageCache {
  return {
    get: async (sessionID: string) => {
      try {
        const raw = localStorage.getItem(`${prefix}:${sessionID}`)
        if (!raw) return null
        const parsed = JSON.parse(raw) as MessageEnvelope[]
        return Array.isArray(parsed) ? parsed : null
      } catch { return null }
    },
    set: async (sessionID: string, messages: MessageEnvelope[]) => {
      try { localStorage.setItem(`${prefix}:${sessionID}`, JSON.stringify(messages)) } catch {}
    },
    clear: async (sessionID: string) => {
      try { localStorage.removeItem(`${prefix}:${sessionID}`) } catch {}
    },
  }
}
