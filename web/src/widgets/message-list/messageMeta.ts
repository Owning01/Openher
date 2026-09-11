import { useMemo } from "react"
import type { RenderedMessage, SessionView } from "../../types"

export function useMessageMeta(messages: RenderedMessage[], revertID?: string | null) {
  const footerInfoMap = useMemo(() => {
    const map = new Map<string, boolean>()
    let lastAssistantId: string | null = null
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.info.role === "assistant" && m.info.time.completed) {
        lastAssistantId = m.info.id
        break
      }
    }
    let prev: { modelID?: string; mode?: string; agent?: string } | null = null
    for (const msg of messages) {
      if (msg.info.role !== "assistant") continue
      const changed =
        prev !== null &&
        (prev.modelID !== msg.info.modelID ||
          prev.mode !== msg.info.mode ||
          prev.agent !== msg.info.agent)
      map.set(msg.info.id, msg.info.id === lastAssistantId || changed)
      prev = { modelID: msg.info.modelID, mode: msg.info.mode, agent: msg.info.agent }
    }
    return map
  }, [messages])

  const prevUserTsMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const msg of messages) {
      if (msg.info.role === "user") map.set(msg.info.id, msg.info.time.created)
    }
    return map
  }, [messages])

  const revertIndex = useMemo(() => {
    if (!revertID) return -1
    return messages.findIndex((m) => m.info.id === revertID)
  }, [messages, revertID])

  const revertObj: SessionView["revert"] | undefined = useMemo(
    () => (revertID ? { messageID: revertID } : undefined),
    [revertID],
  )

  return { footerInfoMap, prevUserTsMap, revertIndex, revertObj }
}
