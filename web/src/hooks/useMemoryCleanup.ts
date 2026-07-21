import { useEffect } from "react"
import type { MessageEnvelope } from "../types"

export function useMemoryCleanup(
  selectedSessionId: string | null,
  setMessages: (fn: (prev: MessageEnvelope[]) => MessageEnvelope[]) => void
) {
  useEffect(() => {
    if (!selectedSessionId) return
    const id = setInterval(() => {
      const cutoff = Date.now() - 5 * 60 * 1000
      setMessages((prev) => {
        const relevant = prev.filter((m) => m.info.sessionID === selectedSessionId)
        if (relevant.length === 0) return prev
        const stale = prev.filter((m) => {
          if (m.info.sessionID === selectedSessionId) return true
          return (m.info.time.created || 0) > cutoff
        })
        return stale.length === prev.length ? prev : stale
      })
    }, 60000)
    return () => clearInterval(id)
  }, [selectedSessionId, setMessages])
}
