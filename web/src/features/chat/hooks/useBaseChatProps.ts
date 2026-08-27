import { useMemo } from "react"
import type { ChatViewProps } from "../../../components/ChatView"
import type { SessionView, ServerConfig, ConnectionState, ModelOption, FileDiff } from "../../../types"

export type UseBaseChatPropsParams = {
  selectedSession: SessionView | null
  composer: string
  handleComposerChange: (val: string) => void
  localRevertID: string | null
  renderedMessages: any[]
  todos: any[]
  todosExpanded: boolean
  setTodosExpanded: React.Dispatch<React.SetStateAction<boolean>>
  isSending: boolean
  isWorking?: boolean
  awaitingAssistantReply: boolean
  loadingSessionID: string | null
  selectedID: string | null
  messageScrollSignature: string
  view: any
  dataMode: any
  renamingSessionID: string | null
  renameValue: string
  commands: any[]
  activeAgent: any
  activeAgentID: string
  activeModelOption: any
  activeModelVariants: any[]
  selectedVariant: string | null
  changeVariant: (variant: string | null) => void
  getModelForSession: (sessionID?: string | null) => any
  modelOptions: ModelOption[]
  changeModel: (key: string, variant?: string | null, sessionID?: string) => void
  filteredVariantGroups: any
  primaryAgentOptions: any[]
  agentOptions: any[]
  changeAgent: (id: string, dir?: string) => void
  projectName: string | null
  startRename: (s: SessionView) => void
  setRenameValue: (val: string) => void
  renameSession: (...args: any[]) => Promise<any>
  cancelRename: () => void
  handleSend: (imgs?: any, opts?: any, text?: string) => Promise<any>
  handleAbort: () => Promise<void>
  goBack: () => void
  setActiveDetailSheet: (sheet: any) => void
  recentSessions: SessionView[]
  sessions: SessionView[]
  handleOpenSession: (id: string, dir: string) => Promise<void>
  readingMode: boolean
  setReadingMode: React.Dispatch<React.SetStateAction<boolean>>
  handleExportChat: () => void
  handleExportMarkdown: () => Promise<void>
  handleSnapshot: () => void
  handleOpenFile: (file: string) => void
  navigate: (view: any) => void
  setShowThemePicker: (show: boolean) => void
  config: ServerConfig
  connectionState: ConnectionState
  queueAction: (action: any) => void
  shellExecute: (cmd: string, sid?: string, dir?: string) => any
  flags: any
  toggleFlag: (key: any) => void
  setFlag: (key: any, val: boolean) => void
  diffFiles: FileDiff[]
  handleOpenADEDiff: (diffs?: FileDiff[], file?: string) => void
  projectDashboard: any
  streamState: any
  compacting: boolean
  pendingQuestions: any[]
  permissionRequest: any
  handleQuestionReply: (reqId: string, answers: string[][]) => Promise<void>
  handleQuestionReject: (reqId: string) => Promise<void>
  handlePermissionApprove: (reqId: string) => Promise<void>
  handlePermissionReject: (reqId: string) => Promise<void>
  handleDismissQuestion: () => void
  handleDismissPermission: () => void
  handleRevertToMessage: (id: string) => Promise<void>
  handleEditMessage: (id: string, text: string) => Promise<void>
  handleUndo: () => void
  handleRedo: () => void
  handleCompact: () => Promise<void>
  handleCreateSession: (dir?: string) => Promise<void>
  fb: any
  setShowTerminal: (show: boolean) => void
  setShowMCPBrowser: (show: boolean) => void
  setDesktopCfg: (cfg: any) => void
  loadDesktopConfig: () => any
  setShowRemoteDesktop: (show: boolean) => void
  chatSettings: any
  promptSnippets: any[]
  handleRegenerate: () => Promise<void>
  handleInsertPrompt: (text: string) => void
  handleSendPrompt: (text: string) => Promise<void>
  setChatSetting: (key: any, val: any) => void
  resetChatSettings: () => void
  vs: any
}

export function useBaseChatProps(params: UseBaseChatPropsParams): ChatViewProps {
  const {
    selectedSession,
    composer,
    handleComposerChange,
    localRevertID,
    renderedMessages,
    todos,
    todosExpanded,
    setTodosExpanded,
    isSending,
    awaitingAssistantReply,
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
    handleSend,
    handleAbort,
    goBack,
    setActiveDetailSheet,
    recentSessions,
    sessions,
    handleOpenSession,
    readingMode,
    setReadingMode,
    handleExportChat,
    handleExportMarkdown,
    handleSnapshot,
    handleOpenFile,
    navigate,
    setShowThemePicker,
    config,
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
    handleDismissPermission,
    handleRevertToMessage,
    handleEditMessage,
    handleUndo,
    handleRedo,
    handleCompact,
    handleCreateSession,
    fb,
    setShowTerminal,
    setShowMCPBrowser,
    setDesktopCfg,
    loadDesktopConfig,
    setShowRemoteDesktop,
    chatSettings,
    promptSnippets,
    handleRegenerate,
    handleInsertPrompt,
    handleSendPrompt,
    setChatSetting,
    resetChatSettings,
    vs,
  } = params

  return useMemo<ChatViewProps>(
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
      isWorking: isSending || awaitingAssistantReply,
      showTypingBubble: false,
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
      onChangeAgent: (id) => changeAgent(id, selectedSession?.directory),
      projectName: projectName ?? null,
      onStartRename: startRename,
      onRenameChange: setRenameValue,
      onRenameConfirm: (id) =>
        renameSession(id, renameValue, selectedSession?.directory ?? "").then(() => true),
      onRenameCancel: cancelRename,
      onSend: (imgs, opts, text) => handleSend(imgs, opts, text),
      onAbort: handleAbort,
      onTodosToggle: () => setTodosExpanded((v) => !v),
      onBackToSessions: goBack,
      onSheetOpen: setActiveDetailSheet,
      recentSessions,
      sessions,
      onOpenSession: handleOpenSession,
      readingMode,
      onToggleReadingMode: () => setReadingMode((v) => !v),
      onExportChat: handleExportChat,
      onExportMarkdown: handleExportMarkdown,
      onSnapshot: handleSnapshot,
      onEditFile: (file) => handleOpenFile(file),
      onOpenSettings: () => navigate("settings"),
      onThemeCommand: () => setShowThemePicker(true),
      config,
      agents: agentOptions,
      onShellSend: (cmd) => {
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
      onDismissPermission: handleDismissPermission,
      onRevertToMessage: handleRevertToMessage,
      onEditMessage: handleEditMessage,
      onUndo: handleUndo,
      onRedo: handleRedo,
      onCompact: handleCompact,
      onForkSession: () => selectedSession && handleCreateSession(selectedSession.directory),
      onOpenFileBrowser: () => selectedSession && fb.open(),
      fileBrowserPath: fb.currentPath,
      onOpenTerminal: () => setShowTerminal(true),
      onOpenMCPBrowser: () => setShowMCPBrowser(true),
      onOpenRemoteDesktop: () => {
        setDesktopCfg(loadDesktopConfig())
        setShowRemoteDesktop(true)
      },
      showTodoButton: chatSettings.showTodoButton,
      snippets: promptSnippets,
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
    }),
    [
      selectedSession,
      localRevertID,
      renderedMessages,
      todos,
      todosExpanded,
      isSending,
      awaitingAssistantReply,
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
      primaryAgentOptions,
      changeAgent,
      projectName,
      startRename,
      setRenameValue,
      renameSession,
      cancelRename,
      handleSend,
      handleAbort,
      setTodosExpanded,
      goBack,
      setActiveDetailSheet,
      recentSessions,
      sessions,
      handleOpenSession,
      readingMode,
      setReadingMode,
      handleExportChat,
      handleExportMarkdown,
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
      handleDismissPermission,
      handleRevertToMessage,
      handleEditMessage,
      handleUndo,
      handleRedo,
      handleCompact,
      handleCreateSession,
      fb,
      setShowTerminal,
      setShowMCPBrowser,
      setShowRemoteDesktop,
      chatSettings,
      setChatSetting,
      resetChatSettings,
      promptSnippets,
      handleRegenerate,
      handleInsertPrompt,
      handleSendPrompt,
      vs.selection,
      vs.clear,
      getModelForSession,
      modelOptions,
      changeModel,
      filteredVariantGroups,
      composer,
      handleComposerChange,
      setDesktopCfg,
      loadDesktopConfig,
    ]
  )
}
