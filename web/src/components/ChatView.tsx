import { memo, useState, useMemo, useRef, useEffect, useCallback, useDeferredValue } from "react"
import { createPortal } from "react-dom"
import { PencilIcon, ArrowLeftIcon, UndoIcon, RedoIcon, CompressIcon, FolderIcon, SettingsIcon, SearchIcon, TerminalIcon, GlobeIcon, MenuDotsIcon, LayersIcon, ForkIcon, CloseIcon, ShareIcon, PaintIcon, StatsIcon, LoadingIcon } from "../Icons"
import { useT } from "../i18n-context"
import { MessageList } from "./MessageList"
import { Composer } from "./Composer"
import { PromptPresetSheet } from "./PromptPresetSheet"
import { ThinkingLevels } from "./ThinkingLevels"
import { InlineRename } from "./InlineRename"
import { SubagentFooter } from "./SubagentFooter"
import { SkillBrowser } from "./SkillBrowser"
import { ContextMenu } from "./ContextMenu"
import { DiffViewer } from "./DiffViewer"
import { GitToolbar } from "./GitToolbar"
import { AutoQuestionPrompt } from "./AutoQuestionPrompt"
import { PermissionPrompt } from "./PermissionPrompt"
import { ChatCustomizerModal } from "./ChatCustomizerModal"

import { useOutsideClick } from "../hooks/useOutsideClick"
import { useDevServer } from "../hooks/useDevServer"
import { formatCompact, formatCost } from "../utils"
import type { SessionView, RenderedMessage, TodoItem, AgentOption, ModelOption, DataMode, CommandInfo,
  ServerConfig, FeatureFlags, ProjectDashboard, DiffFile, FileDiff, Question, PermissionRequest, PromptSnippet, ChatSettings, TokenUsage } from "../types"

export type ChatViewProps = {
  selectedSession: SessionView | null
  messages: RenderedMessage[]
  pendingIndex?: number
  todos: TodoItem[]
  todosExpanded: boolean
  composer: string
  isWorking: boolean
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
  primaryAgentOptions: AgentOption[]
  allAgentOptions?: AgentOption[]
  onChangeAgent: (id: string) => void
  projectName: string | null
  onStartRename: (session: SessionView) => void
  onRenameChange: (value: string) => void
  onRenameConfirm: (id: string, title: string, dir: string) => void
  onRenameCancel: () => void
  onComposerChange: (value: string) => void
  onSend: (images?: any[], options?: { translate?: boolean }) => void | boolean | Promise<boolean | void>
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
  onOpenSession: (id: string, dir: string) => void
  readingMode: boolean
  onToggleReadingMode: () => void
  onExportChat: () => void
  onExportMarkdown?: () => void
  onSnapshot: () => void
  onEditFile?: (file: string) => void
  onOpenFileBrowser?: () => void
  fileBrowserPath?: string
  agents?: AgentOption[]
  config?: ServerConfig
  onOpenSettings?: () => void
  onOpenSessionStats?: () => void
  onShellSend?: (command: string) => void
  onThemeCommand?: () => void
  flags: FeatureFlags
  onToggleFlag: (key: keyof FeatureFlags) => void
  onSetFlag: <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => void
  diffFiles: DiffFile[]
  projectDashboard: ProjectDashboard | null
  pendingQuestions?: Question[]
  permissionRequest?: PermissionRequest | null
  onQuestionReply?: (requestID: string, answers: string[][]) => void
  onQuestionReject?: (requestID: string) => void
  onPermissionApprove?: (requestID: string) => void
  onPermissionReject?: (requestID: string) => void
  onDismissQuestion?: () => void
  onDismissPermission?: () => void
  onForkSession?: () => void
  onOpenTerminal?: () => void
  onOpenMCPBrowser?: () => void
  onOpenRemoteDesktop?: () => void
  showTodoButton?: boolean
  compacting?: boolean
  snippets?: PromptSnippet[]
  charLimit?: number
  compactTools?: boolean
  thinkingDefault?: "auto" | "expanded" | "collapsed"
  onRegenerate?: () => void
  onInsertPrompt?: (text: string) => void
  onSendPrompt?: (text: string) => void
  chatSettings?: ChatSettings
  onChatSettingChange?: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  onResetChatSettings?: () => void
  onOpenADEDiff?: (diffs?: FileDiff[], file?: string) => void
  onOpenBrowser?: (url: string) => void
}

export const ChatView = memo(function ChatView({
  selectedSession, messages, pendingIndex, composer, isWorking,
  showTypingBubble, loadingSessionID, selectedID, messageScrollSignature, view,
  dataMode: _dataMode,
  renamingSessionID, renameValue,
  activeModelOption, activeAgentID, primaryAgentOptions, allAgentOptions, onChangeAgent,
  activeModelVariants, selectedVariant, onChangeVariant,
  onStartRename, onRenameChange, onRenameConfirm, onRenameCancel,
  commands, onComposerChange, onSend, onAbort, onUndo, onRedo, onCompact, onRevertToMessage, onEditMessage, onBackToSessions,
  onSheetOpen, readingMode, onOpenFileBrowser, fileBrowserPath: _fileBrowserPath,
  agents, config, sessions, onOpenSession, onOpenSettings, onOpenSessionStats, onShellSend, onThemeCommand,
  onOpenRemoteDesktop, onOpenBrowser,
  flags, onToggleFlag: _onToggleFlag, diffFiles, projectDashboard,
  pendingQuestions, permissionRequest,
  onQuestionReply, onQuestionReject, onPermissionApprove, onPermissionReject,
  onDismissQuestion, onDismissPermission, onForkSession, onOpenTerminal, onOpenMCPBrowser,
  todos, todosExpanded, onTodosToggle, showTodoButton,
  compacting, revertID,
  onExportMarkdown, onEditFile,
  snippets, charLimit, compactTools, thinkingDefault, onRegenerate, onInsertPrompt, onSendPrompt,
  chatSettings, onChatSettingChange, onResetChatSettings, onOpenADEDiff
}: ChatViewProps) {
  const t = useT()
  const [messageQuery, setMessageQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [searchPos, setSearchPos] = useState(0)
  const [showOverflow, setShowOverflow] = useState(false)
  const [showModelMenu, setShowModelMenu] = useState(false)
  const modelMenuRef = useRef<HTMLDivElement | null>(null)
  const modelToggleRef = useRef<HTMLButtonElement | null>(null)
  // Modal centrado: solo se cierra con X o ESC (no con click outside).
  useEffect(() => {
    if (!showModelMenu) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowModelMenu(false)
        modelToggleRef.current?.focus()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [showModelMenu])
  const [showSkills, setShowSkills] = useState(false)
  const [showPrompts, setShowPrompts] = useState(false)
  const [showChatCustomizer, setShowChatCustomizer] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageID: string } | null>(null)
  // Estable: evita que cada render del padre cree un nuevo function ref
  // y anule el memo de todas las MessageBubble.
  const handleContextMenu = useCallback((x: number, y: number, messageID: string) => {
    setContextMenu({ x, y, messageID })
  }, [])
  const [selectionCopy, setSelectionCopy] = useState<{ x: number; y: number; text: string } | null>(null)
  const messagesWrapRef = useRef<HTMLDivElement | null>(null)
  const devServer = useDevServer(selectedSession?.directory)

  // Copiar selección: aparece solo cuando hay texto seleccionado dentro del chat;
  // cualquier scroll lo oculta.
  useEffect(() => {
    const update = () => {
      const sel = window.getSelection()
      const wrap = messagesWrapRef.current
      if (!sel || sel.isCollapsed || !wrap || !sel.anchorNode || !wrap.contains(sel.anchorNode)) {
        setSelectionCopy(null)
        return
      }
      const text = sel.toString().trim()
      if (!text) {
        setSelectionCopy(null)
        return
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect()
      if (rect.width === 0 && rect.height === 0) {
        setSelectionCopy(null)
        return
      }
      const vw = window.innerWidth
      const btnW = 140
      const x = Math.min(Math.max(rect.left + rect.width / 2 - btnW / 2, 8), vw - btnW - 8)
      const y = rect.top - 42
      setSelectionCopy({ x, y, text })
    }
    const hide = () => setSelectionCopy(null)
    document.addEventListener("selectionchange", update)
    document.addEventListener("scroll", hide, true)
    return () => {
      document.removeEventListener("selectionchange", update)
      document.removeEventListener("scroll", hide, true)
    }
  }, [])
  const overflowRef = useRef<HTMLDivElement | null>(null)
  const handleViewSubagents = useCallback((subagentID?: string) => {
    const parent = selectedSession?.id
    // La sesión del subagente puede ya no estar "active" (terminó): buscar en
    // TODAS las sesiones, con fallback al primer hijo del directorio.
    const subagentSession = subagentID
      ? sessions.find((s) => s.id === subagentID) ?? sessions.find((s) => s.parentID === parent)
      : sessions.find((s) => s.parentID === parent)
    if (subagentSession) onOpenSession(subagentSession.id, subagentSession.directory)
  }, [sessions, selectedSession?.id, onOpenSession])

  useOutsideClick(overflowRef, () => setShowOverflow(false), showOverflow)
  // El badge de preguntas pendientes usa el poll de App.tsx (pendingQuestions
  // llega por prop) — sin intervalo duplicado aquí.
  useEffect(() => {
    setPendingCount(pendingQuestions?.length ?? 0)
  }, [pendingQuestions])

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

  const contextDisplay = useMemo(() => {
    // Buscar tokens del último mensaje con datos o usar los tokens acumulados de la sesión
    let lastMsgTokens: RenderedMessage["tokens"] | TokenUsage | undefined
    let lastTps = ""

    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.tokens && ((m.tokens.input ?? 0) + (m.tokens.output ?? 0) + (m.tokens.reasoning ?? 0) > 0)) {
        if (!lastMsgTokens) lastMsgTokens = m.tokens
      }
      if (!lastTps && m.info.role === "assistant" && m.info.time.completed && m.info.time.created) {
        const start = m.info.time.created
        const end = m.info.time.completed
        let out = (m.tokens?.output ?? 0) + (m.tokens?.reasoning ?? 0)
        if (out <= 0 && m.text) out = Math.round(m.text.length / 4)
        if (out > 0 && end > start) {
          const genDurationMs = end - start
          if (genDurationMs >= 500) {
            const tps = (out / genDurationMs) * 1000
            if (tps >= 1 && tps <= 300) lastTps = `${tps.toFixed(1)} tok/s`
          }
        }
      }
    }

    if (!lastMsgTokens && selectedSession?.tokens) {
      lastMsgTokens = selectedSession.tokens
    }

    let total = 0
    if (lastMsgTokens) {
      total = (lastMsgTokens.input ?? 0) + (lastMsgTokens.output ?? 0) +
        (lastMsgTokens.reasoning ?? 0) + (lastMsgTokens.cache?.read ?? 0) + (lastMsgTokens.cache?.write ?? 0)
    }

    if (total <= 0) {
      // Estimar tokens acumulados de los mensajes si la tarea está en curso
      let sumChars = 0
      for (const m of messages) {
        sumChars += m.text ? m.text.length : 0
      }
      if (sumChars > 0) {
        total = Math.round(sumChars / 4)
      }
    }

    const cost = selectedSession?.cost ?? 0
    if (total <= 0 && cost <= 0 && !lastTps) return null

    const limit = activeModelOption?.contextLimit
    const pct = limit && limit > 0 && total > 0 ? Math.round((total / limit) * 100) : null
    let label = total > 0 ? (formatCompact(total) + (pct !== null ? ` (${pct}%)` : "")) : ""
    if (lastTps) label = label ? `${label} · ⚡ ${lastTps}` : `⚡ ${lastTps}`
    if (cost > 0) label = label ? `${label} · ${formatCost(cost)}` : (label ? `${label} · $0.00` : "")
    return { total, pct, limit, cost, lastTps, label }
  }, [messages, activeModelOption?.contextLimit, selectedSession?.tokens, selectedSession?.cost])

  return (
    <main className="panel detail fade-in">
      <div className="header-row detail-header">
        <h2>
          {selectedSession ? (
            <div className="detail-title-row">
              <button className="btn-icon btn-ghost back-btn" onClick={onBackToSessions} aria-label={t('detail.backToSessions')} title={t('detail.backToSessions')}>
                <ArrowLeftIcon size={20} />
              </button>
              {renamingSessionID === selectedSession.id && (
                <InlineRename value={renameValue} original={selectedSession.title}
                  onChange={onRenameChange}
                  onConfirm={() => onRenameConfirm(selectedSession.id, renameValue, selectedSession.directory)}
                  onCancel={onRenameCancel}
                  placeholder={t('session.renamePlaceholder')} />
              )}
            </div>
          ) : (
            t('detail.selectSession')
          )}
        </h2>
        {selectedSession && (
          <div className="detail-header-actions">
            {pendingCount > 0 && <span className="pending-badge" title={t('session.pendingCount', { count: pendingCount })}>{pendingCount}</span>}
            {activeModelOption && (
              <div className="header-model-wrap" ref={modelMenuRef} style={{ position: "relative", flexShrink: 0 }}>
                <button
                  ref={modelToggleRef}
                  type="button"
                  className="header-model-toggle"
                  onClick={(e) => { e.stopPropagation(); setShowModelMenu((v) => !v) }}
                  aria-expanded={showModelMenu}
                  aria-haspopup="true"
                  aria-controls="header-model-menu"
                  title={`${activeModelOption.modelName ?? t('detail.modelLoading')}${activeModelOption.variant ? ` · ${t('detail.modelVariant', { variant: activeModelOption.variant })}` : ""}`}>
                  <span className="header-model-name">
                    {activeModelOption.modelName ?? t('detail.modelLoading')}
                    {activeModelOption.variant ? <span className="header-model-variant"> · {activeModelOption.variant}</span> : ""}
                  </span>
                </button>
                {showModelMenu && createPortal(
                  <div className="model-modal-overlay">
                    <div className="model-modal" ref={modelMenuRef}>
                      <div className="model-modal-header">
                        <div className="model-modal-title">
                          <strong>{activeModelOption.modelName ?? t('detail.modelLoading')}</strong>
                          {activeModelOption.providerName && <small>{activeModelOption.providerName}</small>}
                        </div>
                        <button type="button" className="model-modal-close" onClick={() => { setShowModelMenu(false); modelToggleRef.current?.focus() }} aria-label="Close">
                          <CloseIcon />
                        </button>
                      </div>
                      {activeModelVariants.length > 0 ? (
                        <ThinkingLevels
                          base={activeModelOption}
                          variants={activeModelVariants}
                          activeVariant={selectedVariant}
                          onChange={(_key, variant) => {
                            const next = variant ?? null
                            if (next !== selectedVariant) onChangeVariant(next)
                            setShowModelMenu(false)
                            modelToggleRef.current?.focus()
                          }} />
                      ) : (
                        <span className="hmm-none">{t('detail.noThinkingLevels')}</span>
                      )}
                      <button type="button" className="hmm-change"
                        onClick={() => { setShowModelMenu(false); modelToggleRef.current?.focus(); onSheetOpen("ai") }}>
                        {t('detail.changeModel')}
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            )}
            {devServer.hasDevServer && (
              <button
                type="button"
                className={`header-dev-server-btn${devServer.status === "running" ? " running" : devServer.status === "starting" ? " starting" : ""}`}
                onClick={async (e) => {
                  e.stopPropagation()
                  try {
                    const url = await devServer.startDevServer()
                    if (onOpenBrowser) {
                      onOpenBrowser(url)
                    } else {
                      window.open(url, "_blank")
                    }
                  } catch (err) {
                    console.error("Error starting dev server:", err)
                  }
                }}
                title={
                  devServer.status === "running"
                    ? `Dev server corriendo en ${devServer.serverUrl} (Clic para abrir pestaña de navegador)`
                    : devServer.status === "starting"
                    ? "Iniciando dev server..."
                    : `Ejecutar "${devServer.devCommand}" y abrir vista previa web`
                }
              >
                {devServer.status === "starting" ? (
                  <>
                    <LoadingIcon size={12} />
                    <span>Iniciando...</span>
                  </>
                ) : devServer.status === "running" ? (
                  <>
                    <span style={{ color: "#22c55e", fontSize: "0.8rem" }}>●</span>
                    <span>{devServer.serverUrl ? devServer.serverUrl.replace(/^https?:\/\//, "") : "Web"}</span>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: "0.75rem" }}>▶</span>
                    <span>{devServer.devCommand || "Run Web"}</span>
                  </>
                )}
              </button>
            )}
            {diffFiles && diffFiles.length > 0 && onOpenADEDiff && (
              <button
                type="button"
                className="btn-secondary compact header-diff-pill"
                onClick={() => onOpenADEDiff()}
                title="Abrir panel de diffs"
              >
                <span className="diff-pill-dot">●</span>
                <span>Diffs ({diffFiles.length})</span>
              </button>
            )}
            <div className="overflow-wrap header-overflow" ref={overflowRef} style={{ position: "relative", flexShrink: 0 }}>
              {chatSettings && onChatSettingChange && (
                <button className="btn-icon compact chat-customize-btn"
                  onClick={(e) => { e.stopPropagation(); setShowChatCustomizer(true) }}
                  title={t('detail.customizeChat')}
                  aria-label={t('detail.customizeChat')}>
                  <PaintIcon size={14} />
                </button>
              )}
              <button className="btn-icon compact"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowOverflow((v) => !v)
                }}
                title={t('session.more')}
                aria-expanded={showOverflow}>
                <MenuDotsIcon size={14} />
              </button>
              {showOverflow && (
                <div
                  className="overflow-dropdown fade-in"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    right: 0,
                    left: "auto",
                    zIndex: 99999,
                    display: "flex",
                    flexDirection: "column",
                    width: 170,
                    background: "var(--surface-strong, #1a1a20)",
                    border: "1px solid var(--border-strong, #444)",
                    borderRadius: "var(--radius-md, 8px)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                    padding: 4,
                    gap: 2
                  }}>
                  {renamingSessionID !== selectedSession.id && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onStartRename(selectedSession) }}>
                      <PencilIcon size={14} /> {t('session.rename')}
                    </button>
                  )}
                  {onOpenSettings && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onOpenSettings() }}>
                      <SettingsIcon size={14} /> {t('nav.settings')}
                    </button>
                  )}
                  {onOpenSessionStats && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onOpenSessionStats() }}>
                      <StatsIcon size={14} /> {t('shell.kindSessionStats')}
                    </button>
                  )}
                  <button className="overflow-item" onClick={() => { setShowOverflow(false); setShowSearch((v) => !v) }}>
                    <SearchIcon size={14} />
                    {t('session.searchMessages')}
                  </button>
                  <button className="overflow-item" disabled={isWorking} onClick={() => { setShowOverflow(false); onUndo?.() }}>
                    <UndoIcon size={14} /> {t('session.undo')}
                  </button>
                  {selectedSession?.revert && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onRedo?.() }}>
                      <RedoIcon size={14} /> {t('session.redo')}
                    </button>
                  )}
                  <button className="overflow-item" disabled={isWorking} onClick={() => { setShowOverflow(false); onCompact?.() }}>
                    <CompressIcon size={14} /> {t('session.compact')}
                  </button>
                  {onExportMarkdown && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onExportMarkdown() }}>
                      <ShareIcon size={14} /> {t('session.exportMd')}
                    </button>
                  )}
                  {flags.fileBrowser && onOpenFileBrowser && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onOpenFileBrowser() }}>
                      <FolderIcon size={14} /> {t('session.browseFiles')}
                    </button>
                  )}
                  <button className="overflow-item" onClick={() => { setShowOverflow(false); setShowSkills(true) }}>
                    <LayersIcon size={14} />
                    {t('session.skills')}
                  </button>
                  {onOpenTerminal && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onOpenTerminal() }}>
                      <TerminalIcon size={14} />
                      {t('session.terminal')}
                    </button>
                  )}
                  {onOpenRemoteDesktop && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onOpenRemoteDesktop() }}>
                      <GlobeIcon size={14} />
                      {t('session.remoteDesktop')}
                    </button>
                  )}
                  {onOpenMCPBrowser && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onOpenMCPBrowser() }}>
                      <GlobeIcon size={14} />
                      {t('session.mcpResources')}
                    </button>
                  )}
                  {onInsertPrompt && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); setShowPrompts(true) }}>
                      <span style={{ fontSize: 13 }}>⚡</span>
                      {t('chat.prompts')}
                    </button>
                  )}
                  {onForkSession && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onForkSession() }}>
                      <ForkIcon size={14} />
                      {t('session.fork')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {selectedSession?.revert && (
        <div className="revert-dock">
          <span className="revert-dock-label">{t('detail.reverted')}</span>
          <button className="btn-link" onClick={onRedo}>{t('detail.redoShort')}</button>
        </div>
      )}

      {showSearch && (
        <div className="message-search-bar">
          <input
            type="search"
            value={messageQuery}
            onChange={(e) => { setMessageQuery(e.target.value); setSearchPos(0) }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                gotoMatch(e.shiftKey ? -1 : 1)
              }
            }}
            placeholder={t('sessions.searchPlaceholder')}
            autoFocus
          />
          {messageQuery && (
            <>
              <span className="message-search-count">
                {searchMatches.length > 0 ? `${searchIndex + 1}/${searchMatches.length}` : "0/0"}
              </span>
              <button className="btn-icon btn-ghost compact" onClick={() => gotoMatch(-1)} aria-label="Anterior" title="Anterior (Shift+Enter)">
                ↑
              </button>
              <button className="btn-icon btn-ghost compact" onClick={() => gotoMatch(1)} aria-label="Siguiente" title="Siguiente (Enter)">
                ↓
              </button>
            </>
          )}
        </div>
      )}

      <div className="messages-wrap" ref={messagesWrapRef}>
        <MessageList
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
          onContextMenu={flags.contextMenu ? handleContextMenu : undefined}
          showTodoButton={showTodoButton ?? false}
          onToggleTodos={onTodosToggle}
          todosOpen={todosExpanded}
          highlight={deferredQuery.trim() || undefined}
          scrollToMessageID={scrollToMessageID}
          compactTools={compactTools}
          thinkingDefault={thinkingDefault}
          onRegenerate={onRegenerate}
          onOpenADEDiff={onOpenADEDiff}
        />
      </div>

      {selectedSession?.parentID && (
        <SubagentFooter session={selectedSession} onGoBack={onBackToSessions} />
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
            { id: "copy", label: t('detail.contextMenu.copy'), onAction: () => navigator.clipboard.writeText(
              messages.find(m => m.info.id === contextMenu.messageID)?.text ?? ""
            )},
            { id: "revert", label: t('detail.contextMenu.revert'), onAction: () => onRevertToMessage?.(contextMenu.messageID) },
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

      {todos.length > 0 && (
        <div className={`todo-panel${todosExpanded ? " open" : ""}`}>
          <div className="todo-panel-header">
            <span className="todo-panel-title">{t('todo.title')}</span>
            <button className="btn-icon btn-secondary compact" onClick={onTodosToggle} aria-label="Cerrar">
              <CloseIcon size={12} />
            </button>
          </div>
          <div className="todo-panel-body">
            {todos.map((todo) => (
              <div key={todo.id} className={`todo-item ${todo.status}`}>
                <span className={`todo-priority priority-${todo.priority}`} />
                <span className="todo-text">{todo.content}</span>
                <span className={`todo-status-badge ${todo.status}`}>{todo.status}</span>
              </div>
            ))}
          </div>
        </div>
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
          activeAgentID={activeAgentID}
          primaryAgentOptions={primaryAgentOptions}
          allAgentOptions={allAgentOptions}
          onChangeAgent={onChangeAgent}
          contextLabel={contextDisplay?.label || null}
          onShellSend={onShellSend}
          config={config}
          directory={selectedSession?.directory}
          onThemeCommand={onThemeCommand}
          snippets={snippets ?? []}
          charLimit={charLimit ?? 0}
        />
      )}

      {showSkills && config && createPortal(
        <SkillBrowser
          config={config}
          onClose={() => setShowSkills(false)}
          onSelect={(name) => onComposerChange(`/skill ${name} `)}
        />,
        document.body
      )}

      {showPrompts && createPortal(
        <PromptPresetSheet
          onInsert={(text) => { onInsertPrompt?.(text); setShowPrompts(false) }}
          onSend={(text) => { onSendPrompt?.(text); setShowPrompts(false) }}
          onClose={() => setShowPrompts(false)} />,
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

      {flags.questionAuto && pendingQuestions && pendingQuestions.length > 0 && onQuestionReply && onDismissQuestion && (
        <AutoQuestionPrompt
          question={pendingQuestions[0]}
          onReply={onQuestionReply}
          onReject={onQuestionReject ?? (() => {})}
          onDismiss={onDismissQuestion}
        />
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
