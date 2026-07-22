import { useState, useCallback, useMemo, useRef } from "react"
import type { ServerConfig, DataMode, MessageEnvelope, ModelSelection, RenderedMessage, SessionView } from "../types"
import { api } from "../api"
import { parseCommand, resolveCommand, buildOptimisticMessage, buildStatusMessage } from "../utils/parseCommand"

const toolPartTypes = new Set(["tool_use", "tool_result", "tool", "execution", "terminal", "code_execution", "tool_call"])

function extractText(msg: MessageEnvelope): string {
  const blocks: string[] = []
  for (const part of msg.parts) {
    if (!part.text) continue
    if (part.type === "text" || part.type === "compaction") {
      blocks.push(part.text)
    }
  }
  return blocks.join("\n\n").trim()
}

export function assistantPayloadLength(items: MessageEnvelope[]): number {
  return items
    .filter((message) => message.info.role !== "user")
    .reduce((sum, message) => sum + extractText(message).length, 0)
}

function stripNonEssential(msg: MessageEnvelope, dataMode?: DataMode): MessageEnvelope {
  if (dataMode === "full" || dataMode === "saver") return msg
  const filtered = msg.parts.filter((p) => !toolPartTypes.has(p.type))
  return filtered.length === msg.parts.length ? msg : { ...msg, parts: filtered }
}

export function useMessages(config: ServerConfig, dataMode?: DataMode) {
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
    const all = [...messages, ...optimisticUserMessages]
    const out: RenderedMessage[] = []
    for (const message of all) {
      let text = ""
      let hasCompaction = false
      const thinkingParts: Array<{ id: string; text: string }> = []
      const toolParts: Array<{ id: string; type: string; text?: string }> = []
      const textBlocks: string[] = []
      for (const part of message.parts) {
        const t = part.text
        if (t) {
          if (part.type === "text" || part.type === "compaction") {
            textBlocks.push(t)
            if (part.type === "compaction") hasCompaction = true
          } else if (part.type === "reasoning" || part.type === "thinking") {
            thinkingParts.push({ id: part.id, text: t })
          } else if (toolPartTypes.has(part.type)) {
            toolParts.push({ id: part.id, type: part.type, text: t })
          }
        }
      }
      text = textBlocks.join("\n\n").trim()
      if (text || toolParts.length > 0) {
        out.push({ ...message, text, hasCompaction, thinkingParts, toolParts, tokens: message.info.tokens, cost: message.info.cost })
      }
    }
    return out
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

  const toolMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.info.role === "assistant") {
        const toolParts = m.parts.filter((p) => toolPartTypes.has(p.type) && p.text)
        if (toolParts.length > 0) return toolParts
      }
    }
    return null
  }, [messages])

  const clearSession = useCallback(() => {
    setMessages([])
    setOptimisticUserMessages([])
    setAwaitingAssistantReply(false)
    setRuntimeError(null)
  }, [])

  const loadSelected = useCallback(async (sessionID: string, directory: string) => {
    const requestID = ++loadSelectedRequestRef.current
    const since = lastMessageTsRef.current.get(sessionID) || 0

    const raw = await api.loadMessages(config, sessionID, directory, since)
    if (requestID !== loadSelectedRequestRef.current) return
    const msg = dataMode === "full" || dataMode === "saver" ? raw : raw.map((m) => stripNonEssential(m, dataMode))

    setMessages((prev) => {
      const stableTs = Math.max(
        ...msg.map((m) => m.info.time.created || 0), 0)
      if (stableTs > 0) lastMessageTsRef.current.set(sessionID, stableTs)

      if (since === 0) {
        const other = prev.filter((m) => m.info.sessionID !== sessionID)
        return [...other, ...msg]
      }

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
          if (updated.info.time.completed !== m.info.time.completed) changed = true
        } else {
          merged.push(m)
        }
      }
      for (const m of msgMap.values()) {
        merged.push(m)
        changed = true
      }
      if (!changed) return prev

      return merged.slice(-500)
    })

    if (since === 0) {
      setOptimisticUserMessages([])
    } else {
      setOptimisticUserMessages((current) => current.filter((m) => !msg.some((n) => n.info.id === m.info.id)))
    }
  }, [config, dataMode])

  const removeOptimistic = useCallback((id: string) => {
    setOptimisticUserMessages((current) => current.filter((m) => m.info.id !== id))
  }, [])

  const abortSession = useCallback(async (sessionID: string, directory: string) => {
    try {
      await api.abort(config, sessionID, directory)
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
    completionShouldPlayRef.current = false
    setAwaitingAssistantReply(false)
  }, [config])

  const undoMessage = useCallback(async (
    sessionID: string,
    directory: string,
    revert: { messageID: string } | undefined,
    onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
  ) => {
    const userMessages = messages.filter((m) => m.info.role === "user")
    const target = userMessages.length > 0
      ? revert
        ? userMessages.filter((m) => m.info.id < revert.messageID).pop()
        : userMessages.pop()
      : undefined
    if (!target) {
      setRuntimeError("No messages to undo")
      return
    }
    try {
      if (awaitingAssistantReply || messages.some((m) => m.info.role !== "user" && !m.info.time.completed)) {
        await api.abort(config, sessionID, directory)
      }
      await api.revert(config, sessionID, target.info.id, directory)
      await onLoadSelected()
      await onRefreshSessions()
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [config, messages, awaitingAssistantReply])

  const redoMessage = useCallback(async (
    sessionID: string,
    directory: string,
    onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
  ) => {
    try {
      await api.unrevert(config, sessionID, directory)
      await onLoadSelected()
      await onRefreshSessions()
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [config])

  const sendShellCallback = useCallback(async (sessionID: string, directory: string) => {
    const text = composer.trim()
    if (!text || !sessionID) return
    try {
      setComposer("")
      setAwaitingAssistantReply(true)
      await api.sendShell(config, sessionID, text, directory)
    } catch (err) {
      setAwaitingAssistantReply(false)
      setRuntimeError((err as Error).message)
    }
  }, [config, composer])

  const compactSession = useCallback(async (
    sessionID: string,
    directory: string,
    providerID: string,
    modelID: string,
    onRefreshSessions: () => Promise<void>,
    _onLoadSelected: () => Promise<void>,
  ) => {
    try {
      const ok = await api.summarize(config, sessionID, providerID, modelID, directory, false)
      if (!ok) { setRuntimeError("Compact returned false from server"); return }
      await new Promise((r) => setTimeout(r, 500))
      lastMessageTsRef.current.delete(sessionID)
      await loadSelected(sessionID, directory)
      await onRefreshSessions()
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [config, loadSelected])

  const applyDelta = useCallback((sessionID: string, messageID: string, partID: string, text: string, replace = false) => {
    setMessages((prev) => {
      const existing = prev.find((m) => m.info.sessionID === sessionID && m.info.id === messageID)
      if (!existing) {
        return [...prev, {
          info: {
            id: messageID,
            role: "assistant",
            sessionID,
            time: { created: Date.now() },
          },
          parts: [{ id: partID, type: "text", text }]
        }]
      }
      let changed = false
      const next = prev.map((m) => {
        if (m.info.sessionID !== sessionID || m.info.id !== messageID) return m
        const nextParts = m.parts.map((p) => {
          if (p.id !== partID) return p
          if (replace) {
            if (p.text === text) return p
            changed = true
            return { ...p, text }
          }
          if (p.text?.endsWith(text)) return p
          changed = true
          return { ...p, text: (p.text ?? "") + text }
        })
        if (!nextParts.some((p) => p.id === partID)) {
          changed = true
          return { ...m, parts: [...nextParts, { id: partID, type: "text", text }] }
        }
        return { ...m, parts: nextParts }
      })
      return changed ? next : prev
    })
  }, [])

  const updateSend = useCallback(async (
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
    if (parsed?.type === "undo") {
      setComposer("")
      await undoMessage(selectedSession.id, selectedSession.directory, selectedSession.revert, onRefreshSessions, onLoadSelected)
      return
    }
    if (parsed?.type === "redo") {
      setComposer("")
      await redoMessage(selectedSession.id, selectedSession.directory, onRefreshSessions, onLoadSelected)
      return
    }
    if (parsed?.type === "compact") {
      setComposer("")
      if (activeModel) {
        setAwaitingAssistantReply(true)
        completionShouldPlayRef.current = true
        try {
          await compactSession(selectedSession.id, selectedSession.directory, activeModel.providerID, activeModel.modelID, onRefreshSessions, onLoadSelected)
        } finally {
          setAwaitingAssistantReply(false)
        }
      } else {
        onSetRuntimeError("Select a model first to use /compact")
      }
      return
    }
    if (parsed?.type === "themes") {
      setComposer("")
      return "themes"
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
  }, [composer, config, assistantResponseSignature, removeOptimistic, undoMessage, redoMessage, compactSession])

  return {
    messages, setMessages, optimisticUserMessages,
    composer, setComposer,
    awaitingAssistantReply, setAwaitingAssistantReply,
    runtimeError, setRuntimeError,
    renderedMessages, messageScrollSignature, assistantResponseSignature,
    toolMessage, completionShouldPlayRef,
    clearSession, loadSelected, send: updateSend, abortSession,
    undoMessage, redoMessage, compactSession, sendShell: sendShellCallback,
    applyDelta
  }
}
