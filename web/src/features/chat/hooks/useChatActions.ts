import { useCallback } from "react"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import { api } from "../../../api"
import type { SessionView, ServerConfig, ConnectionState, ModelOption } from "../../../types"
import { formatSelectionForPrompt } from "../../../hooks/useVisualSelection"
import { keepMessagesThrough } from "../domain/message-order"

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
  recordPrompt: (text: string) => void
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
  renderedMessages: any[]
  awaitingAssistantReply: boolean
  setAwaitingAssistantReply: (b: boolean) => void
  completionShouldPlayRef: React.MutableRefObject<boolean>
  abortSession: (sid: string, dir: string) => Promise<void>
  settleSession: (sid: string, dir: string) => Promise<void>
  undoMessage: (...args: any[]) => void
  redoMessage: (...args: any[]) => void
  compactSession: (...args: any[]) => Promise<void>
  setCompacting: (compacting: boolean, sid?: string) => void
}

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
    recordPrompt,
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
    renderedMessages,
    awaitingAssistantReply,
    setAwaitingAssistantReply,
    completionShouldPlayRef,
    abortSession,
    settleSession,
    undoMessage,
    redoMessage,
    compactSession,
    setCompacting,
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

  const handleExportMarkdown = useCallback(async () => {
    const full = buildMarkdown()
    if (!full) return
    const filename = `${(selectedSession?.title ?? "chat").replace(/[^\w\-]+/g, "_")}.md`
    if (Capacitor.isNativePlatform()) {
      try {
        const saved = await Filesystem.writeFile({
          path: filename,
          data: full,
          directory: Directory.Cache,
        })
        await Share.share({ title: filename, url: saved.uri })
        return
      } catch {}
    }
    const blob = new Blob([full], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 2000)
  }, [buildMarkdown, selectedSession?.title])

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

  const handleSend = useCallback(
    async (
      images?: Array<{ base64: string; mime: string }>,
      options?: { translate?: boolean },
      text?: string
    ) => {
      if (!selectedSession) return
      const composerText = text ?? composerRef.current
      if (connectionState === "offline") {
        const queuedText = vs.hasSelection && vs.promptContext
          ? formatSelectionForPrompt(composerText, vs.promptContext)
          : composerText
        queueAction({
          type: "prompt",
          sessionID: selectedSession.id,
          directory: selectedSession.directory,
          payload: queuedText,
          model: activeModel ? { providerID: activeModel.providerID, modelID: activeModel.modelID, variant: activeModel.variant } : undefined,
          agentID: activeAgentID || undefined,
          images,
          options,
        })
        setComposer("")
        setRuntimeError("Prompt queued - will send when connection is restored")
        return
      }
      let textToSend = composerText
      let originalText: string | null = null
      if (options?.translate && composerText.trim()) {
        try {
          const { translateToEnglish } = await import("../../../utils/translate")
          const translated = await translateToEnglish(composerText)
          if (translated !== composerText) {
            originalText = composerText
            textToSend = translated
            setComposer(translated)
          }
        } catch (err) {
          setRuntimeError(`Translation failed: ${(err as Error).message}`)
          return false
        }
      }
      const hadVisualSelection = vs.hasSelection && !!vs.promptContext
      if (hadVisualSelection) {
        textToSend = formatSelectionForPrompt(textToSend, vs.promptContext)
      }
      recordPrompt(textToSend)
      stopGenerationRef.current = false
      const revertMsgId = localRevertID ?? selectedSession?.revert?.messageID
      if (revertMsgId) {
        const sid = selectedSession.id
        setMessages((prev) => keepMessagesThrough(prev, sid, revertMsgId))
      }
      setLocalRevertID(null)
      setSessions((prev) =>
        prev.map((s) => (s.id === selectedSession.id ? { ...s, status: "busy" } : s))
      )
      const result = await send(
        selectedSession,
        activeModel,
        activeAgentID,
        commands,
        () => refreshSessions(),
        () => loadSelected(selectedSession.id, selectedSession.directory).then(() => undefined),
        setCommands,
        setRuntimeError,
        images,
        textToSend,
        setLocalRevertID,
        originalText ?? undefined
      )
      if (hadVisualSelection && result !== false) {
        vs.clear()
        vs.clearAnnotations()
      }
      if (result === "help") {
        setHelpPage("commands")
        navigate("help")
      }
      if (result === "themes") {
        navigate("settings")
        setShowThemePicker(true)
      }
      if (result === "connect") setShowConnectSheet(true)
      return typeof result === "boolean" ? result : true
    },
    [
      selectedSession,
      activeModel,
      activeAgentID,
      commands,
      send,
      refreshSessions,
      loadSelected,
      setSessions,
      connectionState,
      queueAction,
      setRuntimeError,
      setComposer,
      localRevertID,
      setMessages,
      navigate,
      setHelpPage,
      setShowThemePicker,
      setShowConnectSheet,
      vs.hasSelection,
      vs.promptContext,
      vs.clear,
      recordPrompt,
      stopGenerationRef,
      setLocalRevertID,
      setCommands,
      composerRef,
    ]
  )

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
    ]
  )

  const handleAbort = useCallback(async () => {
    if (!selectedSession) return
    stopGenerationRef.current = true
    setAwaitingAssistantReply(false)
    completionShouldPlayRef.current = false
    setSessions((prev) =>
      prev.map((s) => (s.id === selectedSession.id ? { ...s, status: "idle" as const } : s))
    )
    setMessages((prev) => {
      return prev.map((m) => {
        if (
          m.info.sessionID === selectedSession.id &&
          m.info.role === "assistant" &&
          !m.info.time.completed
        ) {
          return { ...m, info: { ...m.info, time: { ...m.info.time, completed: Date.now() } } }
        }
        return m
      })
    })
    const sid = selectedSession.id
    const dir = selectedSession.directory
    await abortSession(sid, dir).catch(() => {})
    await settleSession(sid, dir).catch(() => undefined)
    setTimeout(() => {
      stopGenerationRef.current = false
    }, 2000)
  }, [
    selectedSession,
    abortSession,
    loadSelected,
    settleSession,
    setAwaitingAssistantReply,
    setSessions,
    setMessages,
    stopGenerationRef,
    completionShouldPlayRef,
  ])

  const handleRevertToMessage = useCallback(
    async (messageID: string) => {
      if (!selectedSession) return
      try {
        if (awaitingAssistantReply) {
          await api.abort(config, selectedSession.id, selectedSession.directory).catch(() => {})
        }
        const target = renderedMessages.find((m) => m.info.id === messageID)
        const sid = selectedSession.id
        setLocalRevertID(messageID)
        await api.revert(config, sid, messageID, selectedSession.directory)
        await loadSelected(sid, selectedSession.directory).catch(() => {})
        await refreshSessions().catch(() => {})
        if (target?.text) setComposer(target.text)
      } catch (err) {
        setLocalRevertID(null)
        setRuntimeError((err as Error).message)
        await loadSelected(selectedSession.id, selectedSession.directory).catch(() => {})
      }
    },
    [
      selectedSession,
      config,
      awaitingAssistantReply,
      loadSelected,
      renderedMessages,
      refreshSessions,
      setLocalRevertID,
      setComposer,
      setRuntimeError,
    ]
  )

  const handleEditMessage = useCallback(
    async (messageID: string, text: string) => {
      if (!selectedSession) return
      try {
        if (awaitingAssistantReply) {
          await api.abort(config, selectedSession.id, selectedSession.directory).catch(() => {})
        }
        const sid = selectedSession.id
        setLocalRevertID(messageID)
        await api.revert(config, sid, messageID, selectedSession.directory)
        await loadSelected(sid, selectedSession.directory).catch(() => {})
        await refreshSessions().catch(() => {})
        setComposer(text)
      } catch (err) {
        setLocalRevertID(null)
        setRuntimeError((err as Error).message)
        await loadSelected(selectedSession.id, selectedSession.directory).catch(() => {})
      }
    },
    [
      selectedSession,
      config,
      awaitingAssistantReply,
      loadSelected,
      refreshSessions,
      setLocalRevertID,
      setComposer,
      setRuntimeError,
    ]
  )

  const handleUndo = useCallback(() => {
    if (!selectedSession) return
    const patchSession = (patch: Record<string, unknown>) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === selectedSession.id ? { ...s, ...patch } : s))
      )
    }
    undoMessage(
      selectedSession.id,
      selectedSession.directory,
      selectedSession.revert,
      refreshSessions,
      () => loadSelected(selectedSession.id, selectedSession.directory),
      patchSession,
      setLocalRevertID
    )
  }, [selectedSession, undoMessage, refreshSessions, loadSelected, setSessions, setLocalRevertID])

  const handleRedo = useCallback(() => {
    if (!selectedSession) return
    const patchSession = (patch: Record<string, unknown>) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === selectedSession.id ? { ...s, ...patch } : s))
      )
    }
    redoMessage(
      selectedSession.id,
      selectedSession.directory,
      selectedSession.revert,
      refreshSessions,
      () => loadSelected(selectedSession.id, selectedSession.directory),
      patchSession,
      setLocalRevertID
    )
  }, [selectedSession, redoMessage, refreshSessions, loadSelected, setSessions, setLocalRevertID])

  const handleCompact = useCallback(async () => {
    if (!selectedSession || !activeModel) return
    setCompacting(true, selectedSession.id)
    setAwaitingAssistantReply(true)
    completionShouldPlayRef.current = true
    try {
      await compactSession(
        selectedSession.id,
        selectedSession.directory,
        activeModel.providerID,
        activeModel.modelID,
        refreshSessions,
        () => loadSelected(selectedSession.id, selectedSession.directory)
      )
    } finally {
      setCompacting(false, selectedSession.id)
      setAwaitingAssistantReply(false)
    }
  }, [
    selectedSession,
    activeModel,
    compactSession,
    refreshSessions,
    loadSelected,
    setCompacting,
    setAwaitingAssistantReply,
    completionShouldPlayRef,
  ])

  return {
    buildMarkdown,
    handleExportChat,
    handleExportMarkdown,
    handleSnapshot,
    handleSend,
    handleRegenerate,
    handleInsertPrompt,
    handleSendPrompt,
    handleAbort,
    handleRevertToMessage,
    handleEditMessage,
    handleUndo,
    handleRedo,
    handleCompact,
  }
}
