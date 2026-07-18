import { useState, useCallback, useMemo, useRef } from "react"
import type { ServerConfig, MessageEnvelope, ModelSelection, TodoItem, DiffFile, ProjectDashboard, RenderedMessage, SessionView } from "../types"
import { api } from "../api"

let idCounter = 0
function uniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${++idCounter}`
}

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

function toFileStatusList(input: unknown[] | Record<string, unknown>): Array<{ path: string; [key: string]: unknown }> {
  if (Array.isArray(input)) return input as Array<{ path: string; [key: string]: unknown }>
  return Object.entries(input).map(([path, value]) => ({ path, ...(value as object) }))
}

export function useMessages(config: ServerConfig) {
  const [messages, setMessages] = useState<MessageEnvelope[]>([])
  const [optimisticUserMessages, setOptimisticUserMessages] = useState<MessageEnvelope[]>([])
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([])
  const [projectDashboard, setProjectDashboard] = useState<ProjectDashboard | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [composer, setComposer] = useState("")
  const [awaitingAssistantReply, setAwaitingAssistantReply] = useState(false)
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [todosExpanded, setTodosExpanded] = useState(false)
  const [activeDetailSheet, setActiveDetailSheet] = useState<null | "ai" | "details">(null)

  const loadSelectedRequestRef = useRef(0)
  const awaitingAssistantBaselineRef = useRef("")
  const completionShouldPlayRef = useRef(false)

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

  const totalDiffAdditions = diffFiles.reduce((sum, file) => sum + file.additions, 0)
  const totalDiffDeletions = diffFiles.reduce((sum, file) => sum + file.deletions, 0)

  const clearSession = useCallback(() => {
    setMessages([])
    setOptimisticUserMessages([])
    setTodos([])
    setDiffFiles([])
    setProjectDashboard(null)
    setDashboardError(null)
    setAwaitingAssistantReply(false)
    setRuntimeError(null)
    setActiveDetailSheet(null)
  }, [])

  const loadSelected = useCallback(async (sessionID: string, directory: string) => {
    const requestID = ++loadSelectedRequestRef.current

    // 1. Messages first — render ASAP
    const msg = await api.loadMessages(config, sessionID, directory)
    if (requestID !== loadSelectedRequestRef.current) return
    setMessages(msg)
    setOptimisticUserMessages([])

    // 2. Todo + diff + dashboard in background
    api.loadTodo(config, sessionID, directory).then((t) => {
      if (requestID !== loadSelectedRequestRef.current) return
      setTodos(t)
    }).catch(() => undefined)

    api.loadDiff(config, sessionID, directory).then((d) => {
      if (requestID !== loadSelectedRequestRef.current) return
      setDiffFiles(d)
    }).catch(() => undefined)

    loadProjectDashboard(directory).catch(() => undefined)
  }, [config])

  const loadProjectDashboard = useCallback(async (directory: string) => {
    setDashboardError(null)
    try {
      const [project, vcs, fileStatus] = await Promise.all([
        api.loadProjectCurrent(config, directory).catch(() => null),
        api.loadVcs(config, directory).catch(() => null),
        api.loadFileStatus(config, directory).catch(() => [] as unknown[])
      ])
      setProjectDashboard({
        project: project as ProjectDashboard["project"],
        vcs: vcs as ProjectDashboard["vcs"],
        files: toFileStatusList(fileStatus as unknown[] | Record<string, unknown>)
      })
    } catch (err) {
      setDashboardError((err as Error).message)
    }
  }, [config])

  const send = useCallback(async (
    selectedSession: SessionView,
    activeModel: ModelSelection | undefined,
    activeAgentID: string,
    commands: { name: string }[],
    onRefreshSessions: () => Promise<void>,
    onLoadSelected: () => Promise<void>,
    onSetCommands: (cmds: { name: string }[]) => void,
    onSetRuntimeError: (err: string | null) => void
  ) => {
    const text = composer.trim()
    if (!text || !selectedSession) return

    const now = Date.now()
    const optimisticMessage: MessageEnvelope = {
      info: { id: uniqueId("optimistic"), role: "user", sessionID: selectedSession.id, time: { created: now } },
      parts: [{ id: uniqueId("optimistic-part"), type: "text", text }]
    }

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
        setOptimisticUserMessages((current) => current.filter((m) => m.info.id !== optimisticMessage.info.id))
        await onRefreshSessions()
      } catch (err) {
        completionShouldPlayRef.current = false
        setAwaitingAssistantReply(false)
        setOptimisticUserMessages((current) => current.filter((m) => m.info.id !== optimisticMessage.info.id))
        setComposer((current) => current || text)
        onSetRuntimeError((err as Error).message)
      }
    }

    if (text.startsWith("/")) {
      const normalized = text.slice(1)
      const command = normalized.split(" ")[0]?.trim() ?? ""
      const args = normalized.slice(command.length).trim()
      const localCommand = command.toLowerCase()

      if (["help", "commands", "skills"].includes(localCommand)) {
        setComposer("")
        return "help"
      }

      if (localCommand === "status") {
        setComposer("")
        const status = [
          `Session: ${selectedSession.title} (${selectedSession.status})`,
          `Directory: ${selectedSession.directory}`,
        ].join("\n")
        const assistantMsg: MessageEnvelope = {
          info: { id: uniqueId("local-assistant"), role: "assistant", sessionID: selectedSession.id, time: { created: now, completed: now } },
          parts: [{ id: uniqueId("local-assistant-part"), type: "text", text: status }]
        }
        setOptimisticUserMessages((current) => [...current, optimisticMessage, assistantMsg])
        return
      }

      let availableCommands = commands
      if (availableCommands.length === 0) {
        try {
          availableCommands = await api.listCommands(config)
          onSetCommands(availableCommands)
        } catch (err) {
          onSetRuntimeError(`Cannot load server commands: ${(err as Error).message}`)
          return
        }
      }

      if (!availableCommands.some((item) => item.name === command)) {
        const available = availableCommands.map((item) => `/${item.name}`).join(", ")
        onSetRuntimeError(`Command not found: "/${command}". Available commands: ${available}`)
        return
      }

      await doSend(
        () => api.sendCommand(config, selectedSession.id, command, args, selectedSession.directory, activeModel, activeAgentID),
        () => onLoadSelected()
      )
      return
    }

    await doSend(
      () => api.sendPrompt(config, selectedSession.id, text, selectedSession.directory, activeModel, activeAgentID),
      () => onLoadSelected()
    )
  }, [composer, config, assistantResponseSignature])

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
    todos, setTodos, diffFiles, setDiffFiles, projectDashboard, setProjectDashboard,
    dashboardError, setDashboardError, composer, setComposer,
    awaitingAssistantReply, setAwaitingAssistantReply,
    runtimeError, setRuntimeError, todosExpanded, setTodosExpanded,
    activeDetailSheet, setActiveDetailSheet,
    renderedMessages, messageScrollSignature, assistantResponseSignature,
    totalDiffAdditions, totalDiffDeletions,
    loadSelectedRequestRef, awaitingAssistantBaselineRef, completionShouldPlayRef,
    clearSession, loadSelected, loadProjectDashboard, send, abortSession
  }
}
