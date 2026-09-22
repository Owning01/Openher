import { memo, useState, useMemo, useRef, useEffect, useCallback, useDeferredValue } from "react"
import { createPortal } from "react-dom"
import { CopyIcon, HistoryIcon } from "../Icons"
import { useT } from "../i18n-context"
import { MessageList } from "./MessageList"
import { FilePathProvider } from "./FilePathButton"
import { Composer } from "./Composer"
import { PromptPresetSheet } from "./PromptPresetSheet"
export { ThinkingLevels } from "./ThinkingLevels"
import { ChatHeader } from "./ChatHeader"
import { MessageSearchBar } from "./MessageSearchBar"
import { TodoPanel } from "./TodoPanel"
import { SubagentFooter } from "./SubagentFooter"
import { ContextMenu } from "./ContextMenu"
import { DiffViewer } from "./DiffViewer"
import { GitToolbar } from "./GitToolbar"
import { AutoQuestionPrompt } from "./AutoQuestionPrompt"
import { PermissionPrompt } from "./PermissionPrompt"
import { ChatCustomizerModal } from "./ChatCustomizerModal"
import { ChatTerminalDock } from "./ChatTerminalDock"
import { PromptHistoryPanel, usePromptHistoryLayout } from "./PromptHistoryPanel"
import { ChatNotesPanel } from "./ChatNotesPanel"
import { PROMPT_HISTORY_OPEN_EVENT, extractUserPrompts } from "../utils/promptHistory"
import { SelectionBar } from "./SelectionBar"
import { ExportMarkdownDialog } from "./ExportMarkdownDialog"
import type { VisualSelection } from "../hooks/useVisualSelection"
import { setQuestionFloatingMode } from "../utils/questionStore"
import { useSelectionCopy } from "../hooks/useSelectionCopy"
import { usePendingQuestions } from "../hooks/usePendingQuestions"
import { useContextDisplay } from "../hooks/useContextDisplay"

import { killTerminalPty } from "../utils/terminalStore"
import { groupTurnDiffs } from "../utils/rendered"
import type { SessionView, RenderedMessage, AgentOption, ModelOption, DataMode, CommandInfo,
  ServerConfig, FeatureFlags, ProjectDashboard, DiffFile, FileDiff, Question, PermissionRequest, ChatSettings } from "../types"
type TodoItem = any

export type ChatViewProps = {
  selectedSession: SessionView | null
  messages: RenderedMessage[]
  pendingIndex?: number
  todos: TodoItem[]
  todosExpanded: boolean
  composer: string
  isWorking: boolean
  isSending?: boolean
  showTypingBubble: boolean
  loadingSessionID: string | null
  selectedID: string | null
  messageScrollSignature: string
  view: string
  dataMode: DataMode
  renamingSessionID: string | null
  renameValue: string
  commands: CommandInfo[]
  activeAgent: AgentOption | null
  activeAgentID: string
  activeModelOption: ModelOption | null
  activeModelVariants: ModelOption[]
  selectedVariant: string | null
  onChangeVariant: (variant: string | null, sessionID?: string) => void
  getModelForSession?: (sessionID?: string | null) => { activeModelOption: ModelOption | null; activeModel?: { providerID: string; modelID: string; variant?: string }; activeModelVariants: ModelOption[]; selectedVariant: string | null }
  modelOptions?: ModelOption[]
  onChangeModel?: (key: string, variant?: string | null, sessionID?: string) => void
  variantGroups?: { recentModels: ModelOption[]; groups: Map<string, any> }
  primaryAgentOptions: AgentOption[]
  allAgentOptions?: AgentOption[]
  onChangeAgent: (id: string) => void
  projectName: string | null
  onStartRename: (session: SessionView) => void
  onRenameChange: (value: string) => void
  onRenameConfirm: (id: string, title: string, dir: string) => void
  onRenameCancel: () => void
  onComposerChange: (value: string) => void
  onSend: (images?: any[], options?: { translate?: boolean }, text?: string) => void | boolean | Promise<boolean | void>
  onAbort: () => void
  onUndo?: () => void
  onRedo?: () => void
  onCompact?: () => void
  onRevertToMessage?: (messageID: string) => void
  onEditMessage?: (messageID: string, text: string) => void
  revertID?: string | null
  onTodosToggle: () => void
  onBackToSessions: () => void
  onSheetOpen: (sheet: "ai" | "details") => void
  recentSessions: SessionView[]
  sessions: SessionView[]
  busySessionIds?: ReadonlySet<string>
  onOpenSession: (id: string, dir: string) => void
  readingMode: boolean
  onToggleReadingMode: () => void
  onExportChat: () => void
  exportDefaultPath?: string | null
  onExportMarkdownTo?: (path: string) => Promise<boolean>
  onSnapshot: () => void
  onEditFile?: (file: string) => void
  onOpenFileBrowser?: () => void
  fileBrowserPath?: string
  agents?: AgentOption[]
  config?: ServerConfig
  onOpenSettings?: () => void
  onShellSend?: (command: string) => void
  onThemeCommand?: () => void
  flags: FeatureFlags
  onToggleFlag: (key: keyof FeatureFlags) => void
  onSetFlag: <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => void
  diffFiles: DiffFile[]
  projectDashboard: ProjectDashboard | null
  pendingQuestions?: Question[]
  permissionRequest?: PermissionRequest | null
  onQuestionReply?: (requestID: string, answers: string[][]) => Promise<void> | void
  onQuestionReject?: (requestID: string) => Promise<void> | void
  onPermissionApprove?: (requestID: string) => void
  onPermissionReject?: (requestID: string) => void
  onDismissQuestion?: (requestID?: string) => void
  /** Reabrir preguntas dismissadas (click en el badge de pendientes). */
  onReopenQuestions?: () => void
  onDismissPermission?: () => void
  onForkSession?: () => void
  /** Abre el selector de carpeta para una sesión nueva (idealmente en `directory`). */
  onOpenNewSession?: (directory?: string) => void
  onOpenTerminal?: () => void
  onOpenMCPBrowser?: () => void
  onOpenRemoteDesktop?: () => void
  onOpenOpenCodeHub?: () => void
  showTodoButton?: boolean
  compacting?: boolean
  charLimit?: number
  compactTools?: boolean
  minimalistMode?: boolean
  thinkingDefault?: "auto" | "expanded" | "collapsed"
  onRegenerate?: () => void
  onInsertPrompt?: (text: string) => void
  onSendPrompt?: (text: string) => void
  chatSettings?: ChatSettings
  onChatSettingChange?: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  onResetChatSettings?: () => void
  onOpenADEDiff?: (diffs?: FileDiff[], file?: string) => void
  onOpenBrowser?: (url: string) => void
  visualSelection?: VisualSelection | null
  onClearVisualSelection?: () => void
  onFocusVisualFile?: (path: string) => void
  // Cola visible: acciones por id de mensaje pendiente (eliminar/editar/enviar).
  outboxActions?: Record<string, { onDelete: () => void; onEdit: () => void; onSendNow: () => void; disabled?: boolean; canAct?: () => boolean }>
}

export const ChatView = memo(function ChatView({
  selectedSession, messages, pendingIndex, composer, isWorking, isSending,
  showTypingBubble, loadingSessionID, selectedID, messageScrollSignature, view,
  dataMode: _dataMode,
  renamingSessionID, renameValue,
  activeModelOption, activeAgentID, primaryAgentOptions, allAgentOptions, onChangeAgent,
  activeModelVariants, selectedVariant, onChangeVariant,
  modelOptions, onChangeModel, variantGroups,
  onStartRename, onRenameChange, onRenameConfirm, onRenameCancel,
  commands, onComposerChange, onSend, onAbort, onUndo, onRedo, onCompact, onRevertToMessage, onEditMessage, onBackToSessions,
  onSheetOpen: _onSheetOpen, readingMode, onOpenFileBrowser, fileBrowserPath: _fileBrowserPath,
  agents, config, sessions, busySessionIds, onOpenSession, onOpenSettings, onShellSend, onThemeCommand,
  onOpenRemoteDesktop, onOpenBrowser: _onOpenBrowser, onOpenOpenCodeHub,
  onToggleReadingMode,
  flags, onToggleFlag: _onToggleFlag, diffFiles, projectDashboard,
  pendingQuestions, permissionRequest,
  onQuestionReply, onQuestionReject, onPermissionApprove, onPermissionReject,
  onDismissQuestion, onReopenQuestions, onDismissPermission, onForkSession, onOpenTerminal, onOpenMCPBrowser,
  todos, todosExpanded, onTodosToggle, showTodoButton,
  compacting, revertID,
  onExportMarkdownTo, exportDefaultPath, onEditFile,
  charLimit, compactTools, minimalistMode, thinkingDefault, onRegenerate, onInsertPrompt, onSendPrompt,
  chatSettings, onChatSettingChange, onResetChatSettings, onOpenADEDiff,
  visualSelection, onClearVisualSelection, onFocusVisualFile, outboxActions
}: ChatViewProps) {
  const t = useT()
  const turnChanges = useMemo(() => groupTurnDiffs(messages), [messages])
  const [messageQuery, setMessageQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [searchPos, setSearchPos] = useState(0)
  const [showPrompts, setShowPrompts] = useState(false)
  const [showChatCustomizer, setShowChatCustomizer] = useState(false)
  const [chatTermOpen, setChatTermOpen] = useState(false)
  const [chatTermGen, setChatTermGen] = useState(0)
  // Cambio de sesión: el dock se pliega (el PTY por sesión sobrevive en el store).
  useEffect(() => { setChatTermOpen(false) }, [selectedSession?.id])
  // El historial es por sesión: al cambiar se cierra; /history y /timeline
  // (más el botón del header) lo abren vía evento (patrón plugin:insert-text).
  useEffect(() => { setShowHistory(false) }, [selectedSession?.id])
  useEffect(() => {
    const open = () => setShowHistory(true)
    window.addEventListener(PROMPT_HISTORY_OPEN_EVENT, open)
    return () => window.removeEventListener(PROMPT_HISTORY_OPEN_EVENT, open)
  }, [])
  const chatTermId = selectedSession ? `chat-term-${selectedSession.id}-g${chatTermGen}` : null
  const handleKillChatTerm = useCallback(() => {
    if (chatTermId) killTerminalPty(chatTermId)
    setChatTermGen((g) => g + 1)
    setChatTermOpen(false)
  }, [chatTermId])
  const [showExport, setShowExport] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const historyLayout = usePromptHistoryLayout()
  const [exportBusy, setExportBusy] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageID: string } | null>(null)
  // Estable: evita que cada render del padre cree un nuevo function ref
  // y anule el memo de todas las MessageBubble.
  const handleContextMenu = useCallback((x: number, y: number, messageID: string) => {
    setContextMenu({ x, y, messageID })
  }, [])
  const messagesWrapRef = useRef<HTMLDivElement | null>(null)
  const { selectionCopy, setSelectionCopy } = useSelectionCopy(messagesWrapRef)
  // Mantener último modelo visible para evitar flicker cuando recarga
  const prevModelRef = useRef(activeModelOption)
  useEffect(() => { if (activeModelOption) prevModelRef.current = activeModelOption }, [activeModelOption])

  // Modo flotante compartido con ToolPart: con questionAuto ON el modal es la
  // única superficie interactiva y el prompt inline se vuelve chip compacto.
  useEffect(() => {
    setQuestionFloatingMode(!!flags.questionAuto)
  }, [flags.questionAuto])
  const displayModelOption = activeModelOption ?? prevModelRef.current

  // El buscador y el salto a prompt también son por sesión: sin reset, la
  // query vieja centra (con smooth) una coincidencia al azar del chat nuevo
  // y el jumpTarget stale expande la ventana sin motivo.
  useEffect(() => {
    setMessageQuery("")
    setSearchPos(0)
    setShowSearch(false)
    setJumpTarget(null)
    setContextMenu(null)
    setSelectionCopy(null)
  }, [selectedSession?.id, setSelectionCopy])

  const promptEntries = useMemo(() => extractUserPrompts(messages, selectedSession?.id), [messages, selectedSession?.id])
  // Salto a un prompt: publica el id objetivo (con nonce para repetir clics
  // sobre el mismo) y MessageList expande la ventana visible hasta incluirlo,
  // luego hace scroll + destello. Sin esto, los prompts anteriores a la
  // ventana (40 iniciales / 120 tope) no existían en el DOM y el salto moría
  // en `if (!el) return`, obligando a pulsar "Cargar anteriores" a mano.
  // No usa el prop scrollToMessageID para no pisar el buscador.
  const [jumpTarget, setJumpTarget] = useState<{ id: string; n: number } | null>(null)
  const jumpToPrompt = useCallback((id: string) => {
    setJumpTarget((prev) => ({ id, n: (prev?.n ?? 0) + 1 }))
  }, [])
  const handleViewSubagents = useCallback((subagentID?: string) => {
    const parent = selectedSession?.id
    // La sesión del subagente puede ya no estar "active" (terminó): buscar en
    // TODAS las sesiones, con fallback al primer hijo del directorio.
    const subagentSession = subagentID
      ? sessions.find((s) => s.id === subagentID) ?? sessions.find((s) => s.parentID === parent)
      : sessions.find((s) => s.parentID === parent)
    if (subagentSession) onOpenSession(subagentSession.id, subagentSession.directory)
  }, [sessions, selectedSession?.id, onOpenSession])
  // Volver al padre: abre la sesión padre en esta misma vista. Antes reusaba
  // onBackToSessions (volver a la lista), que en el panel desktop es un noop
  // y en móvil sacaba a la lista en vez de al padre.
  const handleGoToParent = useCallback(() => {
    const parentID = selectedSession?.parentID
    if (!parentID) return
    const parent = sessions.find((s) => s.id === parentID)
    if (parent) onOpenSession(parent.id, parent.directory)
    else onBackToSessions()
  }, [sessions, selectedSession?.parentID, onOpenSession, onBackToSessions])

  // El badge de preguntas pendientes usa el poll de App.tsx (pendingQuestions
  // llega por prop): derivado directo, sin intervalo duplicado aquí.
  const pendingCount = usePendingQuestions(pendingQuestions)

  // Buscador de mensajes: navegación entre coincidencias (no filtra la lista).
  const deferredQuery = useDeferredValue(messageQuery)
  const searchMatches = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    if (!q) return []
    return messages
      .map((m) => ({
        id: m.info.id,
        haystack: [
          m.text,
          ...(m.thinkingParts ?? []).map((p) => p.text ?? ""),
          ...(m.toolParts ?? []).map((p) => p.text ?? ""),
        ].join("\n").toLowerCase(),
      }))
      .filter((m) => m.haystack.includes(q))
      .map((m) => m.id)
  }, [messages, deferredQuery])

  const searchIndex = Math.min(searchPos, Math.max(searchMatches.length - 1, 0))
  const scrollToMessageID = searchMatches.length > 0 ? searchMatches[searchIndex] : null
  const gotoMatch = (dir: 1 | -1) => {
    if (searchMatches.length === 0) return
    const next = (searchIndex + dir + searchMatches.length) % searchMatches.length
    setSearchPos(next)
  }

  const effectiveRevertID = revertID ?? selectedSession?.revert?.messageID ?? null

  const revertObj = useMemo(() => {
    return effectiveRevertID ? { messageID: effectiveRevertID } : undefined
  }, [effectiveRevertID])

  const contextDisplay = useContextDisplay(messages, activeModelOption, selectedSession)

  return (
    <main className="panel detail fade-in">
      <span style={{ display: "none" }} aria-hidden="true">{t('detail.changeModel')}</span>

      <ChatHeader
        selectedSession={selectedSession}
        messages={messages}
        busySessionIds={busySessionIds}
        sessions={sessions}
        config={config}
        onViewSubagents={handleViewSubagents}
        renamingSessionID={renamingSessionID}
        renameValue={renameValue}
        onRenameChange={onRenameChange}
        onRenameConfirm={onRenameConfirm}
        onRenameCancel={onRenameCancel}
        onBackToSessions={onBackToSessions}
        pendingCount={pendingCount}
        onReopenQuestions={onReopenQuestions}
        diffFiles={diffFiles}
        onOpenADEDiff={onOpenADEDiff}
        canCustomizeChat={!!(chatSettings && onChatSettingChange)}
        onOpenChatCustomizer={() => setShowChatCustomizer(true)}
        chatTermOpen={chatTermOpen}
        onToggleChatTerm={() => setChatTermOpen((v) => !v)}
        showHistory={showHistory}
        onToggleHistory={() => setShowHistory((v) => !v)}
        showNotes={showNotes}
        onToggleNotes={() => setShowNotes((v) => !v)}
        isWorking={isWorking}
        onUndo={onUndo}
        onRedo={onRedo}
        onCompact={onCompact}
        onExportMarkdownTo={onExportMarkdownTo}
        onOpenExport={() => setShowExport(true)}
        onToggleSearch={() => setShowSearch((v) => !v)}
        flags={flags}
        onOpenFileBrowser={onOpenFileBrowser}
        onOpenOpenCodeHub={onOpenOpenCodeHub}
        readingMode={readingMode}
        onToggleReadingMode={onToggleReadingMode}
        onOpenTerminal={onOpenTerminal}
        onOpenRemoteDesktop={onOpenRemoteDesktop}
        onOpenMCPBrowser={onOpenMCPBrowser}
        onInsertPrompt={onInsertPrompt}
        onOpenPrompts={() => setShowPrompts(true)}
        onForkSession={onForkSession}
        onStartRename={onStartRename}
        onOpenSettings={onOpenSettings}
      />

      {selectedSession?.revert && (
        <div className="revert-dock">
          <span className="revert-dock-label">{t('detail.reverted')}</span>
          <button className="btn-link" onClick={onRedo}>{t('detail.redoShort')}</button>
        </div>
      )}

      {showSearch && (
        <MessageSearchBar
          query={messageQuery}
          onQueryChange={(value) => { setMessageQuery(value); setSearchPos(0) }}
          matchCount={searchMatches.length}
          index={searchIndex}
          onPrev={() => gotoMatch(-1)}
          onNext={() => gotoMatch(1)}
          placeholder={t('sessions.searchPlaceholder')}
        />
      )}

      <div className="chat-main-row">
        {showHistory && historyLayout.layout.placement === "left" && (
          <PromptHistoryPanel
            prompts={promptEntries}
            layout={historyLayout}
            onJump={jumpToPrompt}
            onClose={() => setShowHistory(false)}
          />
        )}
        <div className="messages-wrap" ref={messagesWrapRef}>
        <FilePathProvider onOpenFile={onEditFile} directory={selectedSession?.directory}>
        <MessageList
          key={selectedID ?? "empty"}
          messages={messages}
          pendingIndex={pendingIndex}
          loadingSessionID={loadingSessionID}
          selectedID={selectedID}
          showTypingBubble={showTypingBubble}
          compacting={compacting}
          isWorking={isWorking}
          messageScrollSignature={messageScrollSignature}
          view={view}
          revert={revertObj}
          onRevertToMessage={onRevertToMessage}
          onEditMessage={onEditMessage}
          agents={agents}
          config={config}
          directory={selectedSession?.directory}
          onViewSubagents={handleViewSubagents}
          busySessionIds={busySessionIds}
          onContextMenu={flags.contextMenu ? handleContextMenu : undefined}
          showTodoButton={showTodoButton ?? false}
          onToggleTodos={onTodosToggle}
          todosOpen={todosExpanded}
          highlight={deferredQuery.trim() || undefined}
          scrollToMessageID={scrollToMessageID}
          revealMessageID={jumpTarget?.id ?? null}
          revealNonce={jumpTarget?.n ?? 0}
          compactTools={compactTools}
          minimalistMode={minimalistMode}
          thinkingDefault={thinkingDefault}
          onRegenerate={onRegenerate}
          onOpenADEDiff={onOpenADEDiff}
          outboxActions={outboxActions}
        />
        </FilePathProvider>
        </div>
        {showHistory && historyLayout.layout.placement === "right" && (
          <PromptHistoryPanel
            prompts={promptEntries}
            layout={historyLayout}
            onJump={jumpToPrompt}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>

      {showHistory && historyLayout.layout.placement === "floating" && (
        <PromptHistoryPanel
          prompts={promptEntries}
          layout={historyLayout}
          onJump={jumpToPrompt}
          onClose={() => setShowHistory(false)}
        />
      )}

      {selectedSession?.parentID && (
        <SubagentFooter session={selectedSession} onGoBack={handleGoToParent} />
      )}

      {flags.inlineDiff && selectedSession && diffFiles.length > 0 && (
        <DiffViewer files={diffFiles} config={config} sessionID={selectedSession.id} directory={selectedSession.directory}
          onEditFile={onEditFile} />
      )}

      {flags.gitOps && projectDashboard?.vcs && (
        <GitToolbar
          vcs={projectDashboard.vcs}
          onStage={() => {}}
          onCommit={(msg) => { onComposerChange(`/git commit -m "${msg}"`) }}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={[
            { id: "copy", label: t('detail.contextMenu.copy'), icon: <CopyIcon size={15} />, onAction: () => navigator.clipboard.writeText(
              messages.find(m => m.info.id === contextMenu.messageID)?.text ?? ""
            )},
            { id: "revert", label: t('detail.contextMenu.revert'), icon: <HistoryIcon size={15} />, onAction: () => onRevertToMessage?.(contextMenu.messageID) },
          ]}
          onClose={() => setContextMenu(null)}
        />
      )}

      {selectionCopy && (
        <button
          className="selection-copy-btn"
          style={{ left: selectionCopy.x, top: selectionCopy.y }}
          onClick={() => {
            navigator.clipboard.writeText(selectionCopy.text).catch(() => {})
            setSelectionCopy(null)
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.4">
            <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
            <path d="M8.5 3.5V2.5a1 1 0 0 0-1-1h-5a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1h1" />
          </svg>
          {t('detail.copySelection')}
        </button>
      )}

      <TodoPanel todos={todos} expanded={todosExpanded} onToggle={onTodosToggle} />

      {visualSelection && onClearVisualSelection && (
        <div style={{ padding: "0 12px" }}>
          <SelectionBar selection={visualSelection} onClear={onClearVisualSelection} onFocusFile={onFocusVisualFile} />
        </div>
      )}

      {chatTermOpen && chatTermId && selectedSession && !readingMode && (
        <ChatTerminalDock
          tabId={chatTermId}
          cwd={selectedSession.directory}
          onHide={() => setChatTermOpen(false)}
          onKill={handleKillChatTerm}
        />
      )}

      {showNotes && selectedSession && !readingMode && (
        <ChatNotesPanel
          sessionID={selectedSession.id}
          onClose={() => setShowNotes(false)}
          onInsert={onInsertPrompt ? (text) => onInsertPrompt(text) : undefined}
        />
      )}

      {selectedSession && !readingMode && (
        <Composer
          value={composer}
          commands={commands}
          onChange={onComposerChange}
          onSend={onSend}
          onAbort={onAbort}
          disabled={!selectedSession}
          isWorking={isWorking}
          isSending={isSending}
          activeAgentID={activeAgentID}
          primaryAgentOptions={primaryAgentOptions}
          allAgentOptions={allAgentOptions}
          onChangeAgent={onChangeAgent}
          contextLabel={contextDisplay?.label || null}
          onShellSend={onShellSend}
          config={config}
          directory={selectedSession?.directory}
          onThemeCommand={onThemeCommand}
          charLimit={charLimit ?? 0}
          activeModelOption={displayModelOption}
          activeModelVariants={activeModelVariants}
          selectedVariant={selectedVariant}
          onChangeVariant={onChangeVariant}
          modelOptions={modelOptions}
          onChangeModel={onChangeModel}
          variantGroups={variantGroups as any}
          sessionID={selectedSession?.id}
          turnChanges={turnChanges}
        />
      )}

      {showPrompts && createPortal(
        <PromptPresetSheet
          onInsert={(text) => { onInsertPrompt?.(text); setShowPrompts(false) }}
          onSend={(text) => { onSendPrompt?.(text); setShowPrompts(false) }}
          onClose={() => setShowPrompts(false)} />,
        document.body
      )}

      {showExport && exportDefaultPath && onExportMarkdownTo && createPortal(
        <ExportMarkdownDialog
          defaultPath={exportDefaultPath}
          busy={exportBusy}
          onCancel={() => { if (!exportBusy) setShowExport(false) }}
          onConfirm={(path) => {
            setExportBusy(true)
            onExportMarkdownTo(path).then((ok) => {
              setExportBusy(false)
              // En fallo el error ya se reportó vía runtimeError: el diálogo
              // queda abierto para corregir la ruta y reintentar.
              if (ok) setShowExport(false)
            }).catch(() => setExportBusy(false))
          }}
        />,
        document.body
      )}

      {showChatCustomizer && chatSettings && onChatSettingChange && createPortal(
        <ChatCustomizerModal
          settings={chatSettings}
          onSettingChange={onChatSettingChange}
          onReset={onResetChatSettings ?? (() => {})}
          onClose={() => setShowChatCustomizer(false)} />,
        document.body
      )}

      {/* Pregunta flotante (portal a body: siempre fixed, no scrollea con el
          NOTA: ya NO exige isWorking. Cuando el agente pregunta, el turno queda
          idle esperando tu respuesta: antes el modal no se mostraba y el chat
          parecía colgado (había que dar Stop). pendingQuestions ya viene
          filtrado por dismissed/settled en useQuestions.
          chat). Es la ÚNICA superficie interactiva con questionAuto ON; el
          prompt inline queda como chip. Solo con la sesión trabajando: tras
          Stop/abort no reaparece (además se dismissan al abortar). */}
      {flags.questionAuto && pendingQuestions && pendingQuestions.length > 0 && onQuestionReply && onDismissQuestion && createPortal(
        <AutoQuestionPrompt
          question={pendingQuestions[0]}
          onReply={onQuestionReply}
          onReject={onQuestionReject ?? (() => {})}
          onDismiss={() => onDismissQuestion()}
        />,
        document.body,
      )}

      {flags.permissionUI && permissionRequest && onPermissionApprove && onDismissPermission && (
        <PermissionPrompt
          request={permissionRequest}
          onApprove={onPermissionApprove}
          onReject={onPermissionReject ?? (() => {})}
          onDismiss={onDismissPermission}
        />
      )}
    </main>
  )
})
