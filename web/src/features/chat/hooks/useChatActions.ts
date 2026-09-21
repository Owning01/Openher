import { useCallback } from "react"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import { api } from "../../../api"
import type { SessionView, ServerConfig, ConnectionState, ModelOption } from "../../../types"
import { holdSharedOutbox, resumeSharedOutbox } from "../../../hooks/useMessages"
import { keepMessagesThrough } from "../domain/message-order"
import { openPromptHistory } from "../../../utils/promptHistory"
import { useSessionChatFlow } from "./useSessionChatController"

export type UseChatActionsParams = {
  selectedSession: SessionView | null
  config: ServerConfig
  connectionState: ConnectionState
  activeModel: ModelOption | null
  activeAgentID: string
  commands: any[]
  composerRef: React.RefObject<string>
  setComposer: (val: string) => void
  setRuntimeError: (err: string | null) => void
  queueAction: (action: any) => void
  stopGenerationRef: React.MutableRefObject<boolean>
  localRevertID: string | null
  setLocalRevertID: (id: string | null) => void
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
  setSessions: React.Dispatch<React.SetStateAction<SessionView[]>>
  send: (...args: any[]) => Promise<any>
  refreshSessions: (indicator?: boolean) => Promise<void>
  loadSelected: (id: string, dir: string) => Promise<void>
  setCommands: (cmds: any) => void
  vs: any
  navigate: (view: any) => void
  setHelpPage: (p: any) => void
  setShowThemePicker: (show: boolean) => void
  setShowConnectSheet: (show: boolean) => void
  /** Abre el selector de carpeta para crear sesión (idealmente en `directory`). */
  onNewSession: (directory?: string) => void
  renderedMessages: any[]
  awaitingAssistantReply: boolean
  setAwaitingAssistantReply: (b: boolean) => void
  // Cola visible: el dueño es useMessages; aquí solo se encola/acciona.
  outbox: Array<{ id: string; sessionID: string; text: string; images?: Array<{ base64: string; mime: string; name?: string }>; createdAt: number }>
  enqueueOutbox: (sessionID: string, text: string, images?: Array<{ base64: string; mime: string; name?: string }>) => unknown
  removeOutbox: (id: string) => void
  completionShouldPlayRef: React.MutableRefObject<boolean>
  abortSession: (sid: string, dir: string) => Promise<void>
  settleSession: (sid: string, dir: string) => Promise<void>
  undoMessage: (...args: any[]) => void
  redoMessage: (...args: any[]) => void
  compactSession: (...args: any[]) => Promise<void>
  setCompacting: (compacting: boolean, sid?: string) => void
  /** Cierra localmente las preguntas pendientes de la sesión al abortar. */
  dismissSessionQuestions?: (sessionID?: string) => void
}

/**
 * C3: el movil ya no reimplementa send/stop/revert/edit/undo/redo/compact ni
 * outboxActions. Delega en `useSessionChatFlow` (el UNICO flujo, compartido con
 * `useSessionChatController` del desktop) y solo agrega lo propio del movil:
 * export, snapshot, regenerate, prompts y el ruteo de comandos locales.
 */
export function useChatActions(params: UseChatActionsParams) {
  const {
    selectedSession,
    config,
    connectionState,
    activeModel,
    activeAgentID,
    commands,
    composerRef,
    setComposer,
    setRuntimeError,
    queueAction,
    stopGenerationRef,
    localRevertID,
    setLocalRevertID,
    setMessages,
    setSessions,
    send,
    refreshSessions,
    loadSelected,
    setCommands,
    vs,
    navigate,
    setHelpPage,
    setShowThemePicker,
    setShowConnectSheet,
    onNewSession,
    renderedMessages,
    awaitingAssistantReply,
    setAwaitingAssistantReply,
    outbox,
    enqueueOutbox,
    removeOutbox,
    completionShouldPlayRef,
    abortSession,
    settleSession,
    undoMessage,
    redoMessage,
    compactSession,
    setCompacting: _setCompacting,
    dismissSessionQuestions,
  } = params

  const buildMarkdown = useCallback(() => {
    if (!selectedSession || renderedMessages.length === 0) return ""
    const header = `# ${selectedSession.title}\n\n`
    const body = renderedMessages
      .map((m) => {
        const role = m.info.role === "user" ? "**User**" : "**Assistant**"
        const text = m.parts
          ?.map((p: any) => (p.type === "text" ? p.text : ""))
          .filter(Boolean)
          .join("\n\n") || m.text || ""
        return `### ${role}\n\n${text}`
      })
      .join("\n\n---\n\n")
    return header + body
  }, [selectedSession, renderedMessages])

  const handleExportChat = useCallback(() => {
    const full = buildMarkdown()
    if (!full) return
    navigator.clipboard
      .writeText(full)
      .then(() => {
        setRuntimeError(null)
      })
      .catch(() => {
        const ta = document.createElement("textarea")
        ta.value = full
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      })
  }, [buildMarkdown, setRuntimeError])

  const getExportDefaultPath = useCallback(() => {
    if (!selectedSession) return null
    const filename = `${(selectedSession.title ?? "chat").replace(/[^\w\-]+/g, "_")}.md`
    const dir = selectedSession.directory || ""
    if (!dir) return filename
    const sep = dir.includes("\\") ? "\\" : "/"
    return `${dir.replace(/[\\/]+$/, "")}${sep}${filename}`
  }, [selectedSession])

  const exportMarkdownTo = useCallback(
    async (targetPath: string): Promise<boolean> => {
      const full = buildMarkdown()
      if (!full) return false
      try {
        if (Capacitor.isNativePlatform()) {
          const filename = targetPath.split(/[\\/]/).pop() || "chat.md"
          const saved = await Filesystem.writeFile({
            path: filename,
            data: full,
            directory: Directory.Cache,
          })
          await Share.share({ title: filename, url: saved.uri })
          return true
        }
        // En desktop vía shell / save-file o fallback download web
        const isDesktop = typeof window !== "undefined" && (window as any).__OPENHER_DESKTOP__
        if (isDesktop && (window as any).desktopApi?.writeFile) {
          await (window as any).desktopApi.writeFile(targetPath, full)
          return true
        }
        const blob = new Blob([full], { type: "text/markdown;charset=utf-8" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = targetPath.split(/[\\/]/).pop() || "chat.md"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 2000)
        return true
      } catch (err) {
        setRuntimeError((err as Error).message)
        return false
      }
    },
    [buildMarkdown, setRuntimeError]
  )

  const handleExportMarkdown = useCallback(() => {
    const p = getExportDefaultPath()
    if (p) void exportMarkdownTo(p)
  }, [getExportDefaultPath, exportMarkdownTo])

  const handleSnapshot = useCallback(() => {
    if (!selectedSession) return
    const snapshot = {
      id: selectedSession.id,
      title: selectedSession.title,
      directory: selectedSession.directory,
      time: Date.now(),
      messages: renderedMessages.length,
    }
    try {
      const key = `opencode.snapshot.${selectedSession.id}`
      localStorage.setItem(key, JSON.stringify(snapshot))
      setRuntimeError(null)
    } catch {}
  }, [selectedSession, renderedMessages, setRuntimeError])

  // UNICO flujo de chat (compartido con useSessionChatController).
  const flow = useSessionChatFlow({
    variant: "mobile",
    session: selectedSession,
    config,
    connectionState,
    activeModel,
    activeAgentID,
    commands,
    composerRef,
    setComposer,
    setRuntimeError,
    stopGenerationRef,
    localRevertID,
    setLocalRevertID,
    messages: [],
    setMessages,
    renderedMessages,
    outbox: outbox ?? [],
    enqueueOutbox,
    removeOutbox,
    send,
    abortSession,
    awaitingAssistantReply,
    setAwaitingAssistantReply,
    completionShouldPlayRef,
    visualHasSelection: Boolean(vs?.hasSelection),
    visualPromptContext: vs?.promptContext,
    clearVisualSelection: () => {
      vs?.clear()
      vs?.clearAnnotations()
    },
    resumeOutbox: resumeSharedOutbox,
    holdOutbox: () => {
      if (selectedSession) holdSharedOutbox(selectedSession.id)
    },
    queueAction,
    onCommandResult: (result, directory) => {
      if (result === "help") {
        setHelpPage("commands")
        navigate("help")
      } else if (result === "themes") {
        navigate("settings")
        setShowThemePicker(true)
      } else if (result === "connect") setShowConnectSheet(true)
      else if (result === "newSession") onNewSession(directory)
      else if (result === "history" || result === "timeline") openPromptHistory()
      else if (result === "export") handleExportMarkdown()
    },
    onAfterAbort: () => {
      if (selectedSession) return settleSession(selectedSession.id, selectedSession.directory)
      return undefined
    },
    markSessionBusy: (sid) =>
      setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, status: "busy" } : s))),
    markSessionIdle: (sid) =>
      setSessions((prev) => prev.map((s) => (s.id === sid ? { ...s, status: "idle" as const } : s))),
    patchSession: (patch) => {
      if (!selectedSession) return
      setSessions((prev) =>
        prev.map((s) => (s.id === selectedSession.id ? { ...s, ...patch } : s))
      )
    },
    refreshSessions: () => refreshSessions(),
    loadSelected,
    setCommands,
    dismissSessionQuestions,
    undoMessage,
    redoMessage,
    compactSession,
  })

  const handleSend = flow.handleSend

  const handleRegenerate = useCallback(async () => {
    if (!selectedSession) return
    const revertMsgId = localRevertID ?? selectedSession?.revert?.messageID
    if (revertMsgId) {
      const sid = selectedSession.id
      setMessages((prev) => keepMessagesThrough(prev, sid, revertMsgId))
      setLocalRevertID(null)
    }
    const targetIndex = revertMsgId ? renderedMessages.findIndex((m) => m.info.id === revertMsgId) : -1
    const visible = targetIndex >= 0 ? renderedMessages.slice(0, targetIndex + 1) : renderedMessages
    const lastUser = [...visible].reverse().find((m) => m.info.role === "user")
    if (!lastUser?.text) return
    if (lastUser.parts.some((p: any) => p.type === "image")) return
    if (connectionState === "offline") {
      await handleSend(undefined, undefined, lastUser.text)
      return
    }
    if (awaitingAssistantReply) {
      completionShouldPlayRef.current = false
      await api.abort(config, selectedSession.id, selectedSession.directory).catch(() => undefined)
    }
    setAwaitingAssistantReply(false)
    await send(
      selectedSession,
      activeModel,
      activeAgentID,
      commands,
      () => refreshSessions(),
      () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
      setCommands,
      setRuntimeError,
      undefined,
      lastUser.text,
      setLocalRevertID
    )
  }, [
    selectedSession,
    renderedMessages,
    localRevertID,
    awaitingAssistantReply,
    config,
    send,
    activeModel,
    activeAgentID,
    commands,
    refreshSessions,
    loadSelected,
    setCommands,
    setRuntimeError,
    setMessages,
    setLocalRevertID,
    completionShouldPlayRef,
    setAwaitingAssistantReply,
    connectionState,
    handleSend,
  ])

  const handleInsertPrompt = useCallback(
    (text: string) => {
      setComposer(text)
      navigate("detail")
    },
    [setComposer, navigate]
  )

  const handleSendPrompt = useCallback(
    async (text: string) => {
      if (!selectedSession || !text.trim()) return
      if (awaitingAssistantReply) {
        completionShouldPlayRef.current = false
        await api.abort(config, selectedSession.id, selectedSession.directory).catch(() => undefined)
      }
      stopGenerationRef.current = false
      setAwaitingAssistantReply(false)
      await send(
        selectedSession,
        activeModel,
        activeAgentID,
        commands,
        () => refreshSessions(),
        () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
        setCommands,
        setRuntimeError,
        undefined,
        text,
        setLocalRevertID
      )
    },
    [
      selectedSession,
      awaitingAssistantReply,
      config,
      send,
      activeModel,
      activeAgentID,
      commands,
      refreshSessions,
      loadSelected,
      setCommands,
      setRuntimeError,
      setLocalRevertID,
      completionShouldPlayRef,
      setAwaitingAssistantReply,
      stopGenerationRef,
    ]
  )

  return {
    buildMarkdown,
    handleExportChat,
    getExportDefaultPath,
    exportMarkdownTo,
    handleExportMarkdown,
    handleSnapshot,
    handleSend,
    outboxActions: flow.outboxActions,
    handleRegenerate,
    handleInsertPrompt,
    handleSendPrompt,
    handleAbort: flow.handleAbort,
    stopping: flow.stopping,
    handleRevertToMessage: flow.handleRevertToMessage,
    handleEditMessage: flow.handleEditMessage,
    handleUndo: flow.handleUndo,
    handleRedo: flow.handleRedo,
    handleCompact: flow.handleCompact,
  }
}
