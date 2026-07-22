import { memo, useState, useMemo, useRef, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { PencilIcon, ArrowLeftIcon, UndoIcon, RedoIcon, CompressIcon, FolderIcon, StatsIcon, SettingsIcon } from "../Icons"
import { useT } from "../i18n-context"
import { MessageList } from "./MessageList"
import { Composer } from "./Composer"
import { InlineRename } from "./InlineRename"
import { ErrorNotice } from "./ErrorNotice"
import { SubagentFooter } from "./SubagentFooter"
import { ToolStatus } from "./ToolStatus"
import { SkillBrowser } from "./SkillBrowser"
import { ContextMenu } from "./ContextMenu"
import { DiffViewer } from "./DiffViewer"
import { GitToolbar } from "./GitToolbar"
import { AutoQuestionPrompt } from "./AutoQuestionPrompt"
import { PermissionPrompt } from "./PermissionPrompt"

import { api } from "../api"
import type { SessionView, RenderedMessage, TodoItem, AgentOption, ModelOption, DataMode, CommandInfo, ServerConfig, FeatureFlags, ProjectDashboard, DiffFile, StreamState, Question, PermissionRequest } from "../types"

type ChatViewProps = {
  selectedSession: SessionView | null
  messages: RenderedMessage[]
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
  toolMessage: Array<{ id: string; type: string; text?: string }> | null
  runtimeError: string | null
  renamingSessionID: string | null
  renameValue: string
  showModelChip: boolean
  commands: CommandInfo[]
  activeAgent: AgentOption | null
  activeAgentID: string
  activeModelOption: ModelOption | null
  primaryAgentOptions: AgentOption[]
  onChangeAgent: (id: string) => void
  projectName: string | null
  onStartRename: (session: SessionView) => void
  onRenameChange: (value: string) => void
  onRenameConfirm: (id: string, title: string, dir: string) => void
  onRenameCancel: () => void
  onComposerChange: (value: string) => void
  onSend: (images?: any[]) => void | Promise<void>
  onAbort: () => void
  onUndo?: () => void
  onRedo?: () => void
  onCompact?: () => void
  onRevertToMessage?: (messageID: string) => void
  onTodosToggle: () => void
  onBackToSessions: () => void
  onSheetOpen: (sheet: "ai" | "details") => void
  recentSessions: SessionView[]
  activeSessions: SessionView[]
  onOpenSession: (id: string, dir: string) => void
  readingMode: boolean
  onToggleReadingMode: () => void
  onExportChat: () => void
  onSnapshot: () => void
  onOpenFileBrowser?: () => void
  fileBrowserPath?: string
  agents?: AgentOption[]
  config?: ServerConfig
  onOpenSettings?: () => void
  onToggleTokenStats?: () => void
  onShellSend?: (command: string) => void
  onThemeCommand?: () => void
  flags: FeatureFlags
  onToggleFlag: (key: keyof FeatureFlags) => void
  onSetFlag: <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => void
  diffFiles: DiffFile[]
  projectDashboard: ProjectDashboard | null
  streamState?: StreamState
  pendingQuestions?: Question[]
  permissionRequest?: PermissionRequest | null
  onQuestionReply?: (requestID: string, answers: string[][]) => void
  onQuestionReject?: (requestID: string) => void
  onPermissionApprove?: (requestID: string) => void
  onPermissionReject?: (requestID: string) => void
  onDismissQuestion?: () => void
  onDismissPermission?: () => void
}

export const ChatView = memo(function ChatView({
  selectedSession, messages, composer, isWorking,
  showTypingBubble, loadingSessionID, selectedID, messageScrollSignature, view,
  dataMode, toolMessage,
  runtimeError, renamingSessionID, renameValue,
  activeModelOption, activeAgentID, primaryAgentOptions, onChangeAgent,
  onStartRename, onRenameChange, onRenameConfirm, onRenameCancel,
  commands, onComposerChange, onSend, onAbort, onUndo, onRedo, onCompact, onRevertToMessage, onBackToSessions,
  onSheetOpen, readingMode, onOpenFileBrowser, fileBrowserPath: _fileBrowserPath,
  agents, config, activeSessions, onOpenSession, onOpenSettings, onToggleTokenStats, onShellSend, onThemeCommand,
  flags, onToggleFlag: _onToggleFlag, onSetFlag: _onSetFlag, diffFiles, projectDashboard,
  streamState, pendingQuestions, permissionRequest,
  onQuestionReply, onQuestionReject, onPermissionApprove, onPermissionReject,
  onDismissQuestion, onDismissPermission
}: ChatViewProps) {
  const t = useT()
  const [messageQuery, setMessageQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [showOverflow, setShowOverflow] = useState(false)
  const [showSkills, setShowSkills] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; messageID: string } | null>(null)
  const overflowRef = useRef<HTMLDivElement | null>(null)

  const handleViewSubagents = useCallback(() => {
    const subagentSession = activeSessions.find((s) => s.parentID === selectedSession?.id)
    if (subagentSession) onOpenSession(subagentSession.id, subagentSession.directory)
  }, [activeSessions, selectedSession?.id, onOpenSession])

  useEffect(() => {
    if (!config) return
    const id = setInterval(() => {
      api.listPendingQuestions(config, selectedSession?.directory).then((q) => setPendingCount(q.length)).catch(() => {})
    }, 15000)
    return () => clearInterval(id)
  }, [config, selectedSession?.directory])

  useEffect(() => {
    if (!showOverflow) return
    function handleClick(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showOverflow])

  const filteredMessages = useMemo(() => {
    if (!messageQuery.trim()) return messages
    const q = messageQuery.toLowerCase()
    return messages.filter((m) => m.text.toLowerCase().includes(q))
  }, [messages, messageQuery])

  const contextDisplay = useMemo(() => {
    // Use the LAST assistant message's tokens (per-exchange, like the TUI does)
    let lastMsgTokens: RenderedMessage["tokens"]
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.info.role === "assistant" && m.tokens) { lastMsgTokens = m.tokens; break }
    }
    if (!lastMsgTokens) return null
    const total = (lastMsgTokens.input ?? 0) + (lastMsgTokens.output ?? 0) +
      (lastMsgTokens.reasoning ?? 0) + (lastMsgTokens.cache?.read ?? 0) + (lastMsgTokens.cache?.write ?? 0)
    if (total <= 0) return null
    const limit = activeModelOption?.contextLimit
    const pct = limit && limit > 0 ? Math.round((total / limit) * 100) : null
    const cost = selectedSession?.cost ?? 0
    const label = formatTuiNum(total) + (pct !== null ? ` (${pct}%)` : "")
    return { total, pct, limit, cost, label: cost > 0 ? `${label} · ${formatCost(cost)}` : label }
  }, [messages, activeModelOption?.contextLimit, selectedSession?.cost])

  function formatTuiNum(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }
  function formatCost(c: number): string {
    return c < 0.01 ? `$${c.toFixed(6)}` : `$${c.toFixed(4)}`
  }

  return (
    <main className="panel detail fade-in">
      <div className="header-row detail-header">
        <h2>
          {selectedSession ? (
            <div className="detail-title-row">
              <button className="btn-icon btn-ghost back-btn" onClick={onBackToSessions} aria-label="Volver" title="Volver a sesiones">
                <ArrowLeftIcon size={20} />
              </button>
              <img src="./img/opencode-logo-dark.jpg" alt="OpenCode" className="app-icon header-logo" style={{ width: 22, height: 22, borderRadius: 4, objectFit: "cover" }} />
              {renamingSessionID === selectedSession.id ? (
                <InlineRename value={renameValue} original={selectedSession.title}
                  onChange={onRenameChange}
                  onConfirm={() => onRenameConfirm(selectedSession.id, renameValue, selectedSession.directory)}
                  onCancel={onRenameCancel}
                  placeholder={t('session.renamePlaceholder')} />
              ) : (
                <span className="detail-title-text">{selectedSession.title}</span>
              )}
            </div>
          ) : (
            t('detail.selectSession')
          )}
        </h2>
        {selectedSession && (
          <div className="detail-header-actions">
            {pendingCount > 0 && <span className="pending-badge" title={`${pendingCount} pending`}>{pendingCount}</span>}
              {streamState && streamState !== "polling" && (
                <span className={`stream-indicator ${streamState}`} title={streamState === "streaming" ? "Real-time" : "Reconnecting..."}>
                  <span className="stream-dot" />
                </span>
              )}
            {onOpenSettings && (
              <button
                className="btn-icon btn-secondary compact"
                onClick={onOpenSettings}
                title={t('nav.settings') || "Settings"}>
                <SettingsIcon size={16} />
              </button>
            )}
            <div className="overflow-wrap header-overflow" ref={overflowRef} style={{ position: "relative", flexShrink: 0 }}>
              <button className="btn-icon btn-secondary compact"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowOverflow((v) => !v)
                }}
                title="More actions"
                aria-pressed={showOverflow}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
                </svg>
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
                      <PencilIcon size={14} /> Rename
                    </button>
                  )}
                  <button className="overflow-item" onClick={() => { setShowOverflow(false); setShowSearch((v) => !v) }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    Search Messages
                  </button>
                  <button className="overflow-item" disabled={isWorking} onClick={() => { setShowOverflow(false); onUndo?.() }}>
                    <UndoIcon size={14} /> Undo
                  </button>
                  {selectedSession?.revert && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onRedo?.() }}>
                      <RedoIcon size={14} /> Redo
                    </button>
                  )}
                  <button className="overflow-item" disabled={isWorking} onClick={() => { setShowOverflow(false); onCompact?.() }}>
                    <CompressIcon size={14} /> Compact
                  </button>
                  <button className="overflow-item" onClick={() => { setShowOverflow(false); onToggleTokenStats?.() }}>
                    <StatsIcon size={14} /> Token Stats
                  </button>
                  {flags.fileBrowser && onOpenFileBrowser && (
                    <button className="overflow-item" onClick={() => { setShowOverflow(false); onOpenFileBrowser() }}>
                      <FolderIcon size={14} /> Browse Files
                    </button>
                  )}
                  <button className="overflow-item" onClick={() => { setShowOverflow(false); setShowSkills(true) }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                    Skills
                  </button>
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
            onChange={(e) => setMessageQuery(e.target.value)}
            placeholder={t('sessions.searchPlaceholder')}
            autoFocus
          />
          {messageQuery && (
            <span className="message-search-count">
              {filteredMessages.length}/{messages.length}
            </span>
          )}
        </div>
      )}

      <div className="messages-wrap">
        <MessageList
          messages={filteredMessages}
          loadingSessionID={loadingSessionID}
          selectedID={selectedID}
          showTypingBubble={showTypingBubble}
          isWorking={isWorking}
          messageScrollSignature={messageScrollSignature}
          view={view}
          revert={selectedSession?.revert}
          onRevertToMessage={onRevertToMessage}
          agents={agents}
          config={config}
          directory={selectedSession?.directory}
          onViewSubagents={handleViewSubagents}
          onContextMenu={flags.contextMenu ? (x, y, messageID) => setContextMenu({ x, y, messageID }) : undefined}
        />
      </div>

      {isWorking && toolMessage && (
        <div className="live-tools">
          {toolMessage.filter((p) => p.type === "tool_use").map((tp) => (
            <ToolStatus key={tp.id} part={tp} />
          ))}
        </div>
      )}

      {dataMode === "ultra" && selectedSession && toolMessage && toolMessage.length > 0 && (
        <div className="blocker-notice">
          <span className="pill busy">ULTRA</span>
          {t('detail.ultraNotice')}
        </div>
      )}

      {selectedSession?.parentID && (
        <SubagentFooter session={selectedSession} onGoBack={onBackToSessions} />
      )}

      {flags.inlineDiff && selectedSession && diffFiles.length > 0 && (
        <DiffViewer files={diffFiles} config={config} sessionID={selectedSession.id} directory={selectedSession.directory} />
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

      {selectedSession && !readingMode && (
        <Composer
          value={composer}
          commands={commands}
          onChange={onComposerChange}
          onSend={onSend}
          onAbort={onAbort}
          disabled={!selectedSession}
          isWorking={isWorking}
          placeholder={t('detail.composerPlaceholder')}
          activeAgentID={activeAgentID}
          primaryAgentOptions={primaryAgentOptions}
          onChangeAgent={onChangeAgent}
          activeModelOption={activeModelOption}
          onSheetOpen={onSheetOpen}
          contextLabel={contextDisplay?.label || null}
          onShellSend={onShellSend}
          config={config}
          directory={selectedSession?.directory}
          onThemeCommand={onThemeCommand}
        />
      )}

      <ErrorNotice message={runtimeError} />

      {showSkills && config && createPortal(
        <SkillBrowser
          config={config}
          onClose={() => setShowSkills(false)}
          onSelect={(name) => onComposerChange(`/skill ${name} `)}
        />,
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
