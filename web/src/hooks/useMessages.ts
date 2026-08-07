import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import type { ServerConfig, DataMode, MessageEnvelope, ModelSelection, RenderedMessage, SessionView, QueuedPrompt } from "../types"
import { api } from "../api"
import { parseCommand, resolveCommand, buildOptimisticMessage, buildStatusMessage } from "../utils/parseCommand"

const toolPartTypes = new Set(["tool_use", "tool_result", "tool", "execution", "terminal", "code_execution", "tool_call"])

// Tools de archivos y de terminal: se conservan en modos ahorro para mostrar
// los cambios (+N/−M) y los comandos ejecutados (bash/terminal); el diff
// completo vive en el resumen final.
const fileToolNames = new Set(["write", "edit", "apply_patch", "patch"])
const shellToolNames = new Set(["bash", "execute", "terminal", "shell", "pwsh", "cmd"])

const COMPOSER_STORAGE_KEY = "opencode.remote.composer"

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
  const keep = (p: MessageEnvelope["parts"][number]) =>
    !toolPartTypes.has(p.type) || (typeof p.tool === "string" && (fileToolNames.has(p.tool) || shellToolNames.has(p.tool)))
  const filtered = msg.parts.filter(keep)
  return filtered.length === msg.parts.length ? msg : { ...msg, parts: filtered }
}

export function useMessages(config: ServerConfig, dataMode?: DataMode, storageKey = COMPOSER_STORAGE_KEY) {
  const [messages, setMessages] = useState<MessageEnvelope[]>([])
  const [optimisticUserMessages, setOptimisticUserMessages] = useState<MessageEnvelope[]>([])
  const [composer, setComposer] = useState(() => localStorage.getItem(storageKey) ?? "")
  const [awaitingAssistantReply, setAwaitingAssistantReply] = useState(false)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [queuedPrompts, setQueuedPrompts] = useState<QueuedPrompt[]>([])
  const [compacting, setCompacting] = useState(false)

  const composerRef = useRef(composer)
  composerRef.current = composer
  useEffect(() => {
    const timer = setInterval(() => {
      const current = composerRef.current
      if (current) localStorage.setItem(storageKey, current)
      else localStorage.removeItem(storageKey)
    }, 2000)
    return () => clearInterval(timer)
  }, [storageKey])

  const loadSelectedRequestRef = useRef(0)
  const awaitingAssistantBaselineRef = useRef("")
  const completionShouldPlayRef = useRef(false)

  const renderedMessages: RenderedMessage[] = useMemo(() => {
    const all = [...messages, ...optimisticUserMessages]
    const out: RenderedMessage[] = []
    // Los diffs del turno (info.summary.diffs del user message) se muestran al
    // final del turno: en el ÚLTIMO mensaje assistant que le sigue.
    let pendingDiffs: import("../types").FileDiff[] | undefined
    let lastAssistantId: string | null = null
    const diffForMessage = new Map<string, import("../types").FileDiff[]>()
    // El user message no trae mode del server (solo el assistant): el modo del
    // turno (plan/build) se toma del primer assistant que le sigue.
    const turnModeForUser = new Map<string, string>()
    let lastUserID: string | null = null
    for (const message of all) {
      if (message.info.role === "user") {
        pendingDiffs = message.info.summary?.diffs
        lastAssistantId = null
        lastUserID = message.info.id
      } else {
        if (pendingDiffs && pendingDiffs.length > 0) {
          if (lastAssistantId) diffForMessage.delete(lastAssistantId)
          diffForMessage.set(message.info.id, pendingDiffs)
          lastAssistantId = message.info.id
        }
        if (lastUserID && message.info.mode && !turnModeForUser.has(lastUserID)) {
          turnModeForUser.set(lastUserID, message.info.mode)
        }
      }
    }
    for (const message of all) {
      let text = ""
      let hasCompaction = false
      const thinkingParts: Array<{ id: string; text: string; time?: { start?: number; end?: number } }> = []
      const toolParts: Array<{ id: string; type: string; text?: string; callID?: string; tool?: string; state?: MessageEnvelope["parts"][number]["state"] }> = []
      const textBlocks: string[] = []
      for (const part of message.parts) {
        if (part.type === "tool" || toolPartTypes.has(part.type)) {
          toolParts.push({
            id: part.id,
            type: part.type,
            text: part.text,
            callID: part.callID,
            tool: part.tool,
            state: part.state
          })
          continue
        }
        const t = part.text
        if (t) {
          if (part.type === "text" || part.type === "compaction") {
            textBlocks.push(t)
            if (part.type === "compaction") hasCompaction = true
          } else if (part.type === "reasoning" || part.type === "thinking") {
            thinkingParts.push({ id: part.id, text: t, time: part.time })
          }
        }
      }
      text = textBlocks.join("\n\n").trim()
      const hasImages = message.parts.some((p) => p.type === "image")
      if (text || toolParts.length > 0 || hasImages) {
        const turnMode = message.info.mode ?? (message.info.role === "user" ? turnModeForUser.get(message.info.id) : undefined)
        out.push({ ...message, text, hasCompaction, thinkingParts, toolParts, tokens: message.info.tokens, cost: message.info.cost, summaryDiffs: diffForMessage.get(message.info.id), dataMode, turnMode })
      }
    }
    return out
  }, [messages, optimisticUserMessages, dataMode])

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
        const toolParts = m.parts.filter((p) => p.type === "tool" || toolPartTypes.has(p.type))
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
    const limit = dataMode === "ultra" ? 30 : dataMode === "miser" ? 20 : 100

    const raw = await api.loadMessages(config, sessionID, directory, limit)
    if (requestID !== loadSelectedRequestRef.current) return
    const msg = dataMode === "full" || dataMode === "saver" ? raw : raw.map((m) => stripNonEssential(m, dataMode))

    setMessages((prev) => {
      // Merge por id: el historial local nunca se reemplaza ni se descarta por
      // una respuesta parcial o vacía — solo se agrega/actualiza lo nuevo.
      const other = prev.filter((m) => m.info.sessionID !== sessionID)
      const msgMap = new Map(msg.map((m) => [m.info.id, m]))
      const merged = [...other]
      let changed = false
      for (const m of prev) {
        if (m.info.sessionID !== sessionID) continue
        const updated = msgMap.get(m.info.id)
        if (updated) {
          // Merge de parts por id: los parts streamed localmente (tools, etc.)
          // que el fetch acotado no traiga se conservan — nunca se borran del chat.
          const remoteIDs = new Set(updated.parts.map((p) => p.id))
          const extraLocal = m.parts.filter((p) => !remoteIDs.has(p.id))
          const parts = extraLocal.length > 0 ? [...updated.parts, ...extraLocal] : updated.parts
          merged.push({ ...updated, parts })
          msgMap.delete(m.info.id)
          if (updated.info.time.completed !== m.info.time.completed || updated.info.role !== m.info.role) changed = true
        } else {
          merged.push(m)
        }
      }
      for (const m of msgMap.values()) {
        merged.push(m)
        changed = true
      }
      if (!changed) return prev

      // Orden por time.created: un mensaje de usuario confirmado por el server
      // (que llega en un fetch posterior) debe caer en su posición, no al final.
      merged.sort((a, b) => (a.info.time.created ?? 0) - (b.info.time.created ?? 0))
      return merged
    })

    setOptimisticUserMessages((current) => {
      const confirmedTexts = new Set(msg.filter((m) => m.info.role === "user").map(extractText))
      return current.filter((m) => m.info.sessionID !== sessionID || !confirmedTexts.has(extractText(m)))
    })
  }, [config, dataMode])

  const removeOptimistic = useCallback((id: string) => {
    setOptimisticUserMessages((current) => current.filter((m) => m.info.id !== id))
  }, [])

  // Sincroniza los ids optimistas en un ref para poder consultarlos desde
  // callbacks asíncronos (confirmación del envío). El texto del ÚLTIMO optimista
  // permite reconocer el echo del user message en el SSE (que llega con role
  // "assistant") sin arriesgar falsos positivos con respuestas del modelo.
  const optimisticIDsRef = useRef<Set<string>>(new Set())
  const latestOptimisticTextRef = useRef("")
  useEffect(() => {
    optimisticIDsRef.current = new Set(optimisticUserMessages.map((m) => m.info.id))
    const last = optimisticUserMessages[optimisticUserMessages.length - 1]
    latestOptimisticTextRef.current = last ? extractText(last).trim() : ""
  }, [optimisticUserMessages])

  const abortSession = useCallback(async (sessionID: string, directory: string) => {
    setAwaitingAssistantReply(false)
    try {
      await Promise.race([
        api.abort(config, sessionID, directory),
        new Promise((resolve) => setTimeout(resolve, 4000))
      ])
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
    completionShouldPlayRef.current = false
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
      await loadSelected(sessionID, directory)
      await onRefreshSessions()
    } catch (err) {
      setRuntimeError((err as Error).message)
    }
  }, [config, loadSelected])

  const applyDelta = useCallback((sessionID: string, messageID: string, partID: string, text: string, replace = false, partType = "text") => {
    setMessages((prev) => {
      const existing = prev.find((m) => m.info.sessionID === sessionID && m.info.id === messageID)
      if (!existing) {
        // El SSE etiqueta todo como "assistant"; si el texto coincide con el
        // último optimista pendiente es el user message confirmado: con role
        // "user" el bubble conserva su borde/fondo.
        const isUserText = partType === "text" && replace && latestOptimisticTextRef.current
          ? text.trim() === latestOptimisticTextRef.current
          : false
        return [...prev, {
          info: {
            id: messageID,
            role: isUserText ? "user" : "assistant",
            sessionID,
            time: { created: Date.now() },
          },
          parts: [{ id: partID, type: partType, text }]
        }]
      }
      let changed = false
      const next = prev.map((m) => {
        if (m.info.sessionID !== sessionID || m.info.id !== messageID) return m
        const nextParts = m.parts.map((p) => {
          if (p.id !== partID) return p
          // Nunca demotar un part ya tipado (reasoning/tool) a texto por un
          // delta sin tipo resuelto.
          const keepType = partType === "text" && p.type !== "text" ? p.type : partType
          if (replace) {
            if (p.text === text) return p
            changed = true
            return { ...p, text, type: keepType }
          }
          if (p.text?.endsWith(text)) return p
          changed = true
          return { ...p, text: (p.text ?? "") + text, type: keepType }
        })
        if (!nextParts.some((p) => p.id === partID)) {
          changed = true
          return { ...m, parts: [...nextParts, { id: partID, type: partType, text }] }
        }
        return { ...m, parts: nextParts }
      })
      return changed ? next : prev
    })
  }, [])

  // Materializa un part emitido por `message.part.updated`: crea el mensaje/part
  // con el tipo correcto antes de que lleguen los deltas.
  const applyPart = useCallback((sessionID: string, messageID: string, part: { id: string; type?: string; text?: string; tool?: string; callID?: string; state?: unknown; time?: { start?: number; end?: number } }) => {
    if (!part.id) return
    setMessages((prev) => {
      const existing = prev.find((m) => m.info.sessionID === sessionID && m.info.id === messageID)
      if (!existing) {
        const isUserText = part.type === "text" && part.text && latestOptimisticTextRef.current
          ? part.text.trim() === latestOptimisticTextRef.current
          : false
        return [...prev, {
          info: { id: messageID, role: isUserText ? "user" : "assistant", sessionID, time: { created: Date.now() } },
          parts: [{ id: part.id, type: part.type ?? "text", text: part.text ?? "", ...(part.tool ? { tool: part.tool } : {}), ...(part.callID ? { callID: part.callID } : {}), ...(part.state ? { state: part.state } : {}), ...(part.time ? { time: part.time } : {}) }]
        }]
      }
      let changed = false
      const next = prev.map((m) => {
        if (m.info.sessionID !== sessionID || m.info.id !== messageID) return m
        const hasPart = m.parts.some((p) => p.id === part.id)
        if (!hasPart) {
          changed = true
          return { ...m, parts: [...m.parts, { id: part.id, type: part.type ?? "text", text: part.text ?? "", ...(part.tool ? { tool: part.tool } : {}), ...(part.callID ? { callID: part.callID } : {}), ...(part.state ? { state: part.state } : {}), ...(part.time ? { time: part.time } : {}) }] }
        }
        const nextParts = m.parts.map((p) => {
          if (p.id !== part.id) return p
          const incoming = part.text ?? ""
          // Los tool parts (task/subagent) suelen llegar SIN texto: solo traen
          // state.status (running→completed) y tool. Mergear siempre esos campos.
          const newState = part.state && typeof part.state === "object" ? part.state : undefined
          const stateChanged = newState !== undefined && JSON.stringify(p.state ?? null) !== JSON.stringify(newState)
          const toolChanged = part.tool !== undefined && part.tool !== p.tool
          // El time (start/end) también cambia sin tocar texto: p.ej. el
          // reasoning final llega con time.end aunque el texto ya esté completo.
          const timeChanged = part.time !== undefined && JSON.stringify(p.time ?? null) !== JSON.stringify(part.time)
          if (!incoming && p.text && !stateChanged && !toolChanged && !timeChanged) return p
          if (p.text === incoming && (part.type ?? p.type) === p.type && !stateChanged && !toolChanged && !timeChanged) return p
          changed = true
          return {
            ...p,
            text: incoming || p.text,
            ...(part.type ? { type: part.type } : {}),
            ...(part.tool ? { tool: part.tool } : {}),
            ...(part.callID ? { callID: part.callID } : {}),
            ...(newState !== undefined ? { state: newState } : {}),
            ...(part.time ? { time: part.time } : {}),
          }
        })
        return { ...m, parts: nextParts }
      })
      return changed ? next : prev
    })
  }, [])

  const queuePrompt = useCallback((text: string, images?: Array<{ base64: string; mime: string }>) => {
    const qp: QueuedPrompt = {
      id: `queued-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      timestamp: Date.now(),
      images,
    }
    setQueuedPrompts((prev) => [...prev, qp])
  }, [])

  const removeQueued = useCallback((id: string) => {
    setQueuedPrompts((prev) => prev.filter((p) => p.id !== id))
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
    images?: Array<{ base64: string; mime: string }>,
    textOverride?: string,
  ) => {
    const text = (textOverride ?? composer).trim()
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
        // El server persiste el user message de forma asíncrona: loadSelected
        // (match por texto) confirma el optimista. Reintentar hasta que
        // desaparezca, para que el prompt no quede pegado al final del chat.
        const deadline = Date.now() + 10000
        while (optimisticIDsRef.current.has(optimisticMessage.info.id) && Date.now() < deadline) {
          await then()
          if (!optimisticIDsRef.current.has(optimisticMessage.info.id)) break
          await new Promise((r) => setTimeout(r, 700))
        }
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
        setCompacting(true)
        setAwaitingAssistantReply(true)
        completionShouldPlayRef.current = true
        try {
          await compactSession(selectedSession.id, selectedSession.directory, activeModel.providerID, activeModel.modelID, onRefreshSessions, onLoadSelected)
        } finally {
          setCompacting(false)
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
    queuedPrompts, setQueuedPrompts, queuePrompt, removeQueued,
    compacting, setCompacting,
    renderedMessages, messageScrollSignature, assistantResponseSignature,
    toolMessage, completionShouldPlayRef,
    clearSession, loadSelected, send: updateSend, abortSession,
    undoMessage, redoMessage, compactSession, sendShell: sendShellCallback,
    applyDelta, applyPart
  }
}
