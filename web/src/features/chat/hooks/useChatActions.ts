import { useCallback, useMemo } from "react"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import { api } from "../../../api"
import type { SessionView, ServerConfig, ConnectionState, ModelOption } from "../../../types"
import { formatSelectionForPrompt } from "../../../hooks/useVisualSelection"
import { keepMessagesBefore, keepMessagesThrough } from "../domain/message-order"
import { isSessionActive } from "../../../utils"
import { openPromptHistory } from "../../../utils/promptHistory"

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
    outbox,
    enqueueOutbox,
    removeOutbox,
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
        const isDesktop = typeof window !== "undefined" && (window as any).__OPENCODE_DESKTOP__
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
      text?: string,
      force?: boolean
    ) => {
      if (!selectedSession) return
      if (awaitingAssistantReply || isSessionActive(selectedSession)) {
        if (!force) {
          // Ocupado: a la cola visible en vez de rechazar.
          const composerText = text ?? composerRef.current
          if (!composerText.trim() && (!images || images.length === 0)) return false
          recordPrompt(composerText)
          enqueueOutbox(selectedSession.id, composerText, images)
          setComposer("")
          composerRef.current = ""
          if (vs.hasSelection) {
            vs.clear()
            vs.clearAnnotations()
          }
          return true
        }
      }
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
        // Limpiar selección visual incluso en offline para evitar contexto stale
        if (vs.hasSelection) {
          vs.clear()
          vs.clearAnnotations()
        }
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
      let prevMessagesSnapshot: any[] | null = null
      if (revertMsgId) {
        // Snapshot para rollback si el envío falla
        // Nota: necesitamos capturar el array actual de mensajes; como setMessages es async,
        // guardamos referencia al snapshot previo via closure de renderedMessages no es suficiente.
        // El rollback se hará via loadSelected si falla, pero mantenemos snapshot para UI inmediata.
        prevMessagesSnapshot = null // se restaurará via loadSelected en caso de fallo
        const sid = selectedSession.id
        setMessages((prev: any[]) => {
          prevMessagesSnapshot = prev
          return keepMessagesBefore(prev, sid, revertMsgId)
        })
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
      if (result === false) {
        // Rollback de pruning y restaurar composer original si hubo traducción
        if (prevMessagesSnapshot) setMessages(prevMessagesSnapshot)
        else if (revertMsgId) {
          // Fallback: recargar desde servidor para restaurar vista previa al revert
          loadSelected(selectedSession.id, selectedSession.directory).catch(() => {})
        }
        if (originalText) setComposer(originalText)
        // Reset del busy optimista: sin esto la sesión queda clavada en busy
        // y todo envío posterior se bloquea con composer.busy
        setSessions((prev) =>
          prev.map((s) => (s.id === selectedSession.id ? { ...s, status: "idle" as const } : s))
        )
      }
      // Limpiar selección visual siempre para evitar contexto stale duplicado en reintentos
      if (hadVisualSelection) {
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
      if (result === "history" || result === "timeline") openPromptHistory()
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
      enqueueOutbox,
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
    completionShouldPlayRef.current = true
    await compactSession(
      selectedSession.id,
      selectedSession.directory,
      activeModel.providerID,
      activeModel.modelID,
      refreshSessions,
      () => loadSelected(selectedSession.id, selectedSession.directory)
    )
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

  // Acciones de la cola visible por id de mensaje pendiente.
  const outboxActions = useMemo(() => {
    const map: Record<string, { onDelete: () => void; onEdit: () => void; onSendNow: () => void }> = {}
    for (const o of outbox ?? []) {
      if (!selectedSession || o.sessionID !== selectedSession.id) continue
      map[o.id] = {
        onDelete: () => removeOutbox(o.id),
        onEdit: () => {
          setComposer(o.text)
          composerRef.current = o.text
          removeOutbox(o.id)
        },
        onSendNow: () => {
          removeOutbox(o.id)
          void handleSend(o.images, undefined, o.text, true).then((res) => {
            if (res === false) enqueueOutbox(o.sessionID, o.text, o.images)
          })
        },
      }
    }
    return map
  }, [outbox, selectedSession, removeOutbox, setComposer, composerRef, handleSend, enqueueOutbox])

  return {
    buildMarkdown,
    handleExportChat,
    getExportDefaultPath,
    exportMarkdownTo,
    handleExportMarkdown: () => {
      const p = getExportDefaultPath()
      if (p) void exportMarkdownTo(p)
    },
    handleSnapshot,
    handleSend,
    outboxActions,
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
