import { useMemo } from "react"
import type { ChatViewProps } from "../../../components/ChatView"
import { isSessionActive } from "../../../utils"
import { loadDesktopConfig } from "../../../desktop"
import type { ConnectionRuntime } from "../../../app/runtime/useConnectionRuntime"
import type { ChatRuntime, ChatActionsRuntime } from "../../../app/runtime/useChatRuntime"
import type { WorkspaceRuntime } from "../../../app/runtime/useWorkspaceRuntime"

/**
 * Arma las props de `ChatView` a partir de los slices del controlador
 * (`conn`, `chat`, `ws`, `act`). Antes enumeraba ~100 props una por una contra
 * `useAppController`; ahora consume los slices directamente y el memo se parte
 * en tres bloques (sesion/header, runtime/acciones, settings/vs) para que un
 * cambio en un dominio no invalide los otros dos.
 */
export type UseBaseChatPropsParams = {
  conn: ConnectionRuntime
  chat: ChatRuntime
  ws: WorkspaceRuntime
  act: ChatActionsRuntime
  isWorking: boolean
}

export function useBaseChatProps({
  conn,
  chat,
  ws,
  act,
  isWorking,
}: UseBaseChatPropsParams): ChatViewProps {
  const {
    selectedSession,
    loadingSessionID,
    selectedID,
    view,
    renamingSessionID,
    renameValue,
    setRenameValue,
    projectName,
    startRename,
    renameSession,
    cancelRename,
    goBack,
    recentSessions,
    sessions,
    handleOpenSession,
    readingMode,
    setReadingMode,
    handleOpenFile,
    navigate,
    setShowThemePicker,
    handleCreateSession,
    handleOpenNewSession,
    fb,
    setShowMCPBrowser,
    setShowOpenCodeHub,
    setDesktopCfg,
    setShowRemoteDesktop,
    shellExecute,
  } = ws

  const {
    composer,
    handleComposerChange,
    localRevertID,
    renderedMessages,
    todos,
    todosExpanded,
    setTodosExpanded,
    isSending,
    awaitingAssistantReply,
    messageScrollSignature,
    commands,
    setActiveDetailSheet,
    diffFiles,
    projectDashboard,
    compacting,
    chatSettings,
    setChatSetting,
    resetChatSettings,
    vs,
  } = chat

  const {
    dataMode,
    activeAgent,
    activeAgentID,
    changeVariant,
    getModelForSession,
    modelOptions,
    changeModel,
    filteredVariantGroups,
    primaryAgentOptions,
    agentOptions,
    changeAgent,
    config,
    connectionState,
    queueAction,
    flags,
    toggleFlag,
    setFlag,
  } = conn

  const {
    activeModelOption,
    activeModelVariants,
    selectedVariant,
    streamState,
    handleExportChat,
    getExportDefaultPath,
    exportMarkdownTo,
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
    outboxActions,
    handleOpenADEDiff,
    pendingQuestions,
    permissionRequest,
    handleQuestionReply,
    handleQuestionReject,
    handlePermissionApprove,
    handlePermissionReject,
    handleDismissQuestion,
    clearDismissedQuestions,
    handleDismissPermission,
  } = act

  // El caller ya calcula isWorking = awaiting || sesión busy en el server;
  // isSending cubre la ventana del POST. Antes se ignoraba el param y el chat
  // no mostraba estado activo cuando la sesión venía trabajando de otro lado
  // (o tras un resume): parecía "parado" aunque llegaran mensajes.
  const working = Boolean(isSending || isWorking || awaitingAssistantReply)

  // Sesiones con estado activo (busy/retry) en el server. El chat lo usa para
  // saber si un subagente en background sigue vivo: su tool part queda
  // "completed" al delegar, pero la SESIÓN HIJA es quien reporta el estado
  // (mismo criterio que la TUI: background running mientras no esté idle).
  const busySessionIds = useMemo(
    () => new Set(sessions.filter((s) => isSessionActive(s)).map((s) => s.id)),
    [sessions]
  )

  // Bloque 1: identidad de la sesión, header, modelo/agentes y rename.
  const sessionProps = useMemo(
    () => ({
      session: selectedSession,
      selectedSession,
      composer,
      onComposerChange: handleComposerChange,
      localRevertID,
      messages: renderedMessages,
      visibleMessages: renderedMessages,
      todos,
      todosExpanded,
      isWorking: working,
      showTypingBubble: working,
      loadingSessionID,
      selectedID,
      messageScrollSignature,
      view,
      dataMode,
      renamingSessionID,
      renameValue,
      commands,
      activeAgent,
      activeAgentID,
      activeModelOption,
      activeModelVariants,
      selectedVariant,
      onChangeVariant: changeVariant,
      getModelForSession,
      modelOptions,
      onChangeModel: (key: string, variant?: string | null, sessionID?: string) =>
        changeModel(key, variant, sessionID ?? selectedSession?.id),
      variantGroups: filteredVariantGroups,
      primaryAgentOptions,
      allAgentOptions: agentOptions,
      onChangeAgent: (id: string) => changeAgent(id, selectedSession?.directory),
      projectName: projectName ?? null,
      onStartRename: startRename,
      onRenameChange: setRenameValue,
      onRenameConfirm: (id: string) =>
        renameSession(id, renameValue, selectedSession?.directory ?? "").then(() => true),
      onRenameCancel: cancelRename,
    }),
    [
      selectedSession,
      composer,
      handleComposerChange,
      localRevertID,
      renderedMessages,
      todos,
      todosExpanded,
      working,
      loadingSessionID,
      selectedID,
      messageScrollSignature,
      view,
      dataMode,
      renamingSessionID,
      renameValue,
      commands,
      activeAgent,
      activeAgentID,
      activeModelOption,
      activeModelVariants,
      selectedVariant,
      changeVariant,
      getModelForSession,
      modelOptions,
      changeModel,
      filteredVariantGroups,
      primaryAgentOptions,
      agentOptions,
      changeAgent,
      projectName,
      startRename,
      setRenameValue,
      renameSession,
      cancelRename,
    ]
  )

  // Bloque 2: acciones de sesión, layout, shell, flags, sidecar y preguntas.
  const runtimeProps = useMemo(
    () => ({
      onSend: (imgs?: any[], opts?: any, text?: string) => handleSend(imgs, opts, text),
      onAbort: handleAbort,
      onTodosToggle: () => setTodosExpanded((v: boolean) => !v),
      onBackToSessions: goBack,
      onSheetOpen: setActiveDetailSheet,
      recentSessions,
      sessions,
      busySessionIds,
      onOpenSession: handleOpenSession,
      readingMode,
      onToggleReadingMode: () => setReadingMode((v: boolean) => !v),
      onExportChat: handleExportChat,
      exportDefaultPath: getExportDefaultPath(),
      onExportMarkdownTo: exportMarkdownTo,
      onSnapshot: handleSnapshot,
      onEditFile: (file: string) => handleOpenFile(file),
      onOpenSettings: () => navigate("settings"),
      onThemeCommand: () => setShowThemePicker(true),
      config,
      agents: agentOptions,
      onShellSend: (cmd: string) => {
        if (selectedSession) {
          if (connectionState === "offline") {
            queueAction({
              type: "shell",
              sessionID: selectedSession.id,
              directory: selectedSession.directory,
              payload: cmd,
            })
          } else {
            shellExecute(cmd, selectedSession.id, selectedSession.directory)
          }
        }
      },
      flags,
      onToggleFlag: toggleFlag,
      onSetFlag: setFlag,
      diffFiles: diffFiles as any,
      onOpenADEDiff: handleOpenADEDiff,
      projectDashboard,
      streamState,
      compacting,
      pendingQuestions,
      permissionRequest,
      onQuestionReply: handleQuestionReply,
      onQuestionReject: handleQuestionReject,
      onPermissionApprove: handlePermissionApprove,
      onPermissionReject: handlePermissionReject,
      onDismissQuestion: handleDismissQuestion,
      onReopenQuestions: clearDismissedQuestions,
      onDismissPermission: handleDismissPermission,
      onRevertToMessage: handleRevertToMessage,
      onEditMessage: handleEditMessage,
      onUndo: handleUndo,
      onRedo: handleRedo,
      onCompact: handleCompact,
      onForkSession: () => selectedSession && handleCreateSession(selectedSession.directory),
      onOpenNewSession: handleOpenNewSession,
      onOpenFileBrowser: () => selectedSession && fb.open(),
      fileBrowserPath: fb.currentPath,
      onOpenTerminal: () => { try { window.dispatchEvent(new CustomEvent("opencode:new-terminal")) } catch {} },
      onOpenMCPBrowser: () => setShowMCPBrowser(true),
      onOpenOpenCodeHub: () => setShowOpenCodeHub(true),
      onOpenRemoteDesktop: () => {
        setDesktopCfg(loadDesktopConfig())
        setShowRemoteDesktop(true)
      },
    }),
    [
      selectedSession,
      handleSend,
      handleAbort,
      setTodosExpanded,
      goBack,
      setActiveDetailSheet,
      recentSessions,
      sessions,
      busySessionIds,
      handleOpenSession,
      readingMode,
      setReadingMode,
      handleExportChat,
      getExportDefaultPath,
      exportMarkdownTo,
      handleSnapshot,
      handleOpenFile,
      navigate,
      setShowThemePicker,
      config,
      agentOptions,
      connectionState,
      queueAction,
      shellExecute,
      flags,
      toggleFlag,
      setFlag,
      diffFiles,
      handleOpenADEDiff,
      projectDashboard,
      streamState,
      compacting,
      pendingQuestions,
      permissionRequest,
      handleQuestionReply,
      handleQuestionReject,
      handlePermissionApprove,
      handlePermissionReject,
      handleDismissQuestion,
      clearDismissedQuestions,
      handleDismissPermission,
      handleRevertToMessage,
      handleEditMessage,
      handleUndo,
      handleRedo,
      handleCompact,
      handleCreateSession,
      handleOpenNewSession,
      fb,
      setShowMCPBrowser,
      setShowOpenCodeHub,
      setDesktopCfg,
      setShowRemoteDesktop,
    ]
  )

  // Bloque 3: ajustes de chat, acciones de prompt y selección visual.
  const settingsProps = useMemo(
    () => ({
      showTodoButton: chatSettings.showTodoButton,
      charLimit: chatSettings.composerCharLimit,
      compactTools: chatSettings.compactTools,
      minimalistMode: chatSettings.minimalistMode,
      thinkingDefault: chatSettings.thinkingDefault,
      onRegenerate: handleRegenerate,
      onInsertPrompt: handleInsertPrompt,
      onSendPrompt: handleSendPrompt,
      chatSettings,
      onChatSettingChange: setChatSetting,
      onResetChatSettings: resetChatSettings,
      visualSelection: vs.selection,
      onClearVisualSelection: vs.clear,
      onFocusVisualFile: (path: string) => handleOpenFile(path),
      outboxActions,
    }),
    [
      chatSettings,
      handleRegenerate,
      handleInsertPrompt,
      handleSendPrompt,
      setChatSetting,
      resetChatSettings,
      vs.selection,
      vs.clear,
      handleOpenFile,
      outboxActions,
    ]
  )

  return useMemo<ChatViewProps>(
    () => ({ ...sessionProps, ...runtimeProps, ...settingsProps }),
    [sessionProps, runtimeProps, settingsProps]
  )
}
