import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import type { ServerConfig, MessageEnvelope, ModelSelection, RenderedMessage, SessionView } from "../types"
import { api } from "../api"
import { parseCommand, resolveCommand, buildOptimisticMessage, buildStatusMessage } from "../utils/parseCommand"

function extractText(msg: MessageEnvelope): string {
  return msg.parts
    .filter((part) => part.type === "text" && part.text)
    .filter((part) => part.type !== "thinking")
    .map((part) => part.text)
    .join("\n")
    .trim()
}

export function assistantPayloadLength(items: MessageEnvelope[]): number {
  return items
    .filter((message) => message.info.role !== "user")
    .reduce((sum, message) => sum + extractText(message).length, 0)
}

export function useMessages(config: ServerConfig) {
  const [messages, setMessages] = useState<MessageEnvelope[]>([])
  const [optimisticUserMessages, setOptimisticUserMessages] = useState<MessageEnvelope[]>([])
  const [composer, setComposer] = useState("")
  const [awaitingAssistantReply, setAwaitingAssistantReply] = useState(false)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)

  const loadSelectedRequestRef = useRef(0)
  const awaitingAssistantBaselineRef = useRef("")
  const completionShouldPlayRef = useRef(false)
  const lastMessageTsRef = useRef<Map<string, number>>(new Map())

  const renderedMessages: RenderedMessage[] = useMemo(() => {
    return [...messages, ...optimisticUserMessages]
      .map((message) => ({ ...message, text: extractText(message) }))
      .filter((message) => message.text)
  }, [messages, optimisticUserMessages])

  const messageScrollSignature = useMemo(() => {
    return renderedMessages.map((m) => `${m.info.id}:${m.text.length}`).join("|")
  }, [renderedMessages])

  const assistantResponseSignature = useMemo(() => {
    return renderedMessages
      .filter((m) => m.info.role !== "user")
      .map((m) => `${m.info.id}:${m.text.length}`)
      .join("|")
  }, [renderedMessages])

  const toolTypes = new Set(["tool_use", "tool_result", "tool", "execution", "terminal", "code_execution", "tool_call"])

  const toolMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.info.role === "assistant") {
        const toolParts = m.parts.filter((p) => toolTypes.has(p.type) && p.text)
        if (toolParts.length > 0) return toolParts
      }
    }
    return null
  }, [messages])

  useEffect(() => {
    if (!awaitingAssistantReply) return
    if (assistantResponseSignature && assistantResponseSignature !== awaitingAssistantBaselineRef.current) {
      setAwaitingAssistantReply(false)
    }
  }, [assistantResponseSignature, awaitingAssistantReply])

  const clearSession = useCallback(() => {
    setMessages([])
    setOptimisticUserMessages([])
    setAwaitingAssistantReply(false)
    setRuntimeError(null)
  }, [])

  const loadSelected = useCallback(async (sessionID: string, directory: string) => {
    const requestID = ++loadSelectedRequestRef.current
    const since = lastMessageTsRef.current.get(sessionID) || 0

    const msg = await api.loadMessages(config, sessionID, directory, since)
    if (requestID !== loadSelectedRequestRef.current) return

    setMessages((prev) => {
      const other = prev.filter((m) => m.info.sessionID !== sessionID)
      const msgMap = new Map(msg.map((m) => [m.info.id, m]))
      const merged = [...other]
      let changed = false
      for (const m of prev) {
        if (m.info.sessionID !== sessionID) continue
        const updated = msgMap.get(m.info.id)
        if (updated) {
          merged.push(updated)
          msgMap.delete(m.info.id)
          if (updated !== m) changed = true
        } else {
          merged.push(m)
        }
      }
      for (const m of msgMap.values()) {
        merged.push(m)
        changed = true
      }
      if (!changed) return prev

      const allTs = msg.map((m) => m.info.time.created || 0)
      const maxTs = Math.max(...allTs, 0)
      const hasIncomplete = msg.some((m) => m.info.role !== "user" && !m.info.time.completed)
      if (maxTs > 0 && !hasIncomplete) lastMessageTsRef.current.set(sessionID, maxTs)

      return merged.slice(-100)
    })

    if (since === 0) {
      setOptimisticUserMessages([])
    } else {
      setOptimisticUserMessages((current) => current.filter((m) => !msg.some((n) => n.info.id === m.info.id)))
    }
  }, [config])

  const removeOptimistic = useCallback((id: string) => {
    setOptimisticUserMessages((current) => current.filter((m) => m.info.id !== id))
  }, [])

  const send = useCallback(async (
    selectedSession: SessionView,
    activeModel: ModelSelection | undefined,
    activeAgentID: string,
    commands: { name: string }[],
    onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
    onSetCommands: (cmds: { name: string }[]) => void,
    onSetRuntimeError: (err: string | null) => void,
    images?: Array<{ base64: string; mime: string }>
  ) => {
    const text = composer.trim()
    if ((!text || !selectedSession) && (!images || images.length === 0)) return

    const optimisticMessage = buildOptimisticMessage(selectedSession, text, images)

    const doSend = async (
      sendFn: () => Promise<unknown>,
      then: () => Promise<void>
    ) => {
      setComposer("")
      setOptimisticUserMessages((current) => [...current, optimisticMessage])
      awaitingAssistantBaselineRef.current = assistantResponseSignature
      completionShouldPlayRef.current = true
      setAwaitingAssistantReply(true)
      onSetRuntimeError(null)
      try {
        await sendFn()
        await then()
        removeOptimistic(optimisticMessage.info.id)
        await onRefreshSessions()
      } catch (err) {
        completionShouldPlayRef.current = false
        setAwaitingAssistantReply(false)
        removeOptimistic(optimisticMessage.info.id)
        setComposer((current) => current || text)
        onSetRuntimeError((err as Error).message)
      }
    }

    const parsed = parseCommand(text)
    if (parsed?.type === "help") {
      setComposer("")
      return "help"
    }
    if (parsed?.type === "status") {
      setComposer("")
      setOptimisticUserMessages((current) => [...current, optimisticMessage, buildStatusMessage(selectedSession)])
      return
    }
    if (parsed?.type === "command") {
      const { isKnown } = await resolveCommand(config, parsed.command, commands, onSetCommands)
      if (!isKnown) {
        await doSend(
          () => api.sendPrompt(config, selectedSession.id, text.slice(1), selectedSession.directory, activeModel, activeAgentID),
          () => onLoadSelected()
        )
        return
      }
      await doSend(
        () => api.sendCommand(config, selectedSession.id, parsed.command, parsed.args, selectedSession.directory, activeModel, activeAgentID),
        () => onLoadSelected()
      )
      return
    }

    await doSend(
      () => api.sendPrompt(config, selectedSession.id, text, selectedSession.directory, activeModel, activeAgentID, images),
      () => onLoadSelected()
    )
  }, [composer, config, assistantResponseSignature, removeOptimistic])

  const abortSession = useCallback(async (sessionID: string, directory: string) => {
    try {
      await api.abort(config, sessionID, directory)
      completionShouldPlayRef.current = false
      setAwaitingAssistantReply(false)
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [config])

  return {
    messages, setMessages, optimisticUserMessages,
    composer, setComposer,
    awaitingAssistantReply, setAwaitingAssistantReply,
    runtimeError, setRuntimeError,
    renderedMessages, messageScrollSignature, assistantResponseSignature,
    toolMessage, completionShouldPlayRef,
    clearSession, loadSelected, send, abortSession
  }
}
