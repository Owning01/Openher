import { memo, useCallback, useMemo } from "react"
import { ChatIcon, PencilIcon, SaveIcon, CloseIcon, FolderIcon, ShareIcon } from "../Icons"
import { useT } from "../i18n-context"
import { MessageList } from "./MessageList"
import { Composer } from "./Composer"
import { TodoBox } from "./TodoBox"

import type { SessionView, RenderedMessage, TodoItem, AgentOption, ModelOption, DataMode } from "../types"

function formatK(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

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
  onSend: () => void
  onAbort: () => void
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
}

export const ChatView = memo(function ChatView({
  selectedSession, messages, todos, todosExpanded, composer, isWorking,
  showTypingBubble, loadingSessionID, selectedID, messageScrollSignature, view,
  dataMode, toolMessage,
  runtimeError, renamingSessionID, renameValue,
  showModelChip, activeModelOption, activeAgentID, primaryAgentOptions, onChangeAgent,
  projectName,
  onStartRename, onRenameChange, onRenameConfirm, onRenameCancel,
  onComposerChange, onSend, onAbort, onTodosToggle,
  onBackToSessions, onSheetOpen,
  recentSessions, activeSessions, onOpenSession,
  readingMode, onToggleReadingMode, onExportChat, onSnapshot
}: ChatViewProps) {
  const t = useT()

  const handleBack = useCallback(() => {
    onBackToSessions()
    requestAnimationFrame(() => document.querySelector<HTMLElement>(".session-card.active")?.scrollIntoView({ block: "center" }))
  }, [onBackToSessions])

  const contextInfo = useMemo(() => {
    if (!activeModelOption?.contextLimit) return null
    const totalChars = messages.reduce((sum, m) => sum + (m.text?.length || 0), 0)
    const estimatedTokens = Math.round(totalChars / 4)
    const limit = activeModelOption.contextLimit
    return { used: estimatedTokens, limit, pct: Math.min(100, Math.round((estimatedTokens / limit) * 100)) }
  }, [messages, activeModelOption])

  return (
    <main className="panel detail fade-in">
      <div className="detail-topbar">
        <button className="btn-secondary" onClick={handleBack}>{t('detail.backToSessions')}</button>
        <div className="detail-topbar-actions">
          <button className="btn-secondary compact" onClick={onExportChat} title={t('detail.exportChat') || "Export chat"}>
            <ShareIcon size={14} />
          </button>
          <button className="btn-secondary compact" onClick={onSnapshot} title={t('detail.snapshot') || "Snapshot"}>
            <SaveIcon size={14} />
          </button>
          {selectedSession && <span className={`pill ${selectedSession.status}`}>{selectedSession.status}</span>}
        </div>
      </div>

      <div className="header-row detail-header">
        <div>
          <h2>
            {selectedSession ? (
              <div className="detail-title-row">
                <ChatIcon size={24} className="icon-inline-heading" />
                {renamingSessionID === selectedSession.id ? (
                  <div className="rename-inline">
                    <input value={renameValue}
                      onChange={(e) => onRenameChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") { e.preventDefault(); onRenameConfirm(selectedSession.id, renameValue, selectedSession.directory) }
                        else if (e.key === "Escape") onRenameCancel()
                      }}
                      onBlur={() => {
                        if (renameValue === selectedSession.title || !renameValue.trim()) onRenameCancel()
                      }}
                      placeholder={t('session.renamePlaceholder')} className="rename-input" autoComplete="off" />
                    <button className="btn-primary compact" onClick={() => onRenameConfirm(selectedSession.id, renameValue, selectedSession.directory)}
                      onMouseDown={(e) => e.preventDefault()} title={t('session.renameConfirm')}>
                      <SaveIcon size={14} />
                    </button>
                    <button className="btn-secondary compact" onClick={onRenameCancel} title={t('session.cancel')}>
                      <CloseIcon size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    {selectedSession.title}
                    <button className="btn-icon btn-secondary compact" onClick={() => onStartRename(selectedSession)}
                      title={t('session.renameTitle')} style={{ marginLeft: 'var(--space-1)' }}>
                      <PencilIcon size={14} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              t('detail.selectSession')
            )}
          </h2>
          {selectedSession && (
            <p className="subtle">
              {selectedSession.directory}
            </p>
          )}
        </div>
      </div>

      {selectedSession && (activeSessions.length > 0 || recentSessions.length > 0) && (
        <div className="detail-session-switcher">
          {[...activeSessions, ...recentSessions]
            .filter((s, i, arr) => s.id !== selectedSession.id && arr.findIndex((x) => x.id === s.id) === i)
            .slice(0, 5).map((session) => (
              <button key={session.id} type="button"
                className={`session-switch-chip ${activeSessions.some((a) => a.id === session.id) ? "active" : ""}`}
                onClick={() => onOpenSession(session.id, session.directory)}>
                <FolderIcon size={12} />
                <span className="session-switch-title">{session.title}</span>
              </button>
            ))}
        </div>
      )}

      {selectedSession && showModelChip && (
        <section className="session-context-strip" aria-label={t('detail.contextStripLabel')}>
          <button type="button" className="context-chip ghost" onClick={() => onSheetOpen("details")}>
            <span>{t('detail.detailsChip')}</span>
            <strong>{projectName || t('detail.projectLabel')}</strong>
          </button>
          <button type="button" className={`context-chip ${readingMode ? "active" : "ghost"}`} onClick={onToggleReadingMode}>
            <span>{readingMode ? t('detail.readingModeOn') || "Reading" : t('detail.readingModeOff') || "Chat"}</span>
            <strong>{readingMode ? "📖" : "💬"}</strong>
          </button>
        </section>
      )}

      {selectedSession && (
        <TodoBox todos={todos} expanded={todosExpanded} onToggle={onTodosToggle} />
      )}

      {contextInfo && (
        <div className="context-bar" title={`~${contextInfo.used.toLocaleString()} tokens estimated / ${contextInfo.limit.toLocaleString()} limit`}>
          <div className="context-bar-track">
            <div className={`context-bar-fill ${contextInfo.pct > 85 ? "high" : contextInfo.pct > 60 ? "mid" : ""}`}
              style={{ width: `${contextInfo.pct}%` }} />
          </div>
          <span className="context-bar-label">{formatK(contextInfo.used)} / {formatK(contextInfo.limit)} tokens</span>
        </div>
      )}

      <div className="messages-wrap">
        <MessageList
          messages={messages}
          loadingSessionID={loadingSessionID}
          selectedID={selectedID}
          showTypingBubble={showTypingBubble}
          isWorking={isWorking}
          messageScrollSignature={messageScrollSignature}
          view={view}
        />
      </div>

      {/* Terminal/tool output — Full mode shows inline, Ultra shows blocker notice */}
      {selectedSession && toolMessage && toolMessage.length > 0 && (
        <>
          {dataMode === "full" ? (
            <div className="terminal-block">
              <div className="terminal-header">Terminal</div>
              <pre className="terminal-content">
                {toolMessage.map((p, i) => <code key={i}>{p.text}</code>)}
              </pre>
            </div>
          ) : dataMode === "ultra" ? (
            <div className="blocker-notice">
              <span className="pill busy">blocking</span>
              Process running — switch to Full mode to see output
            </div>
          ) : null}
        </>
      )}

      {selectedSession && !readingMode && (
        <Composer
          value={composer}
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
        />
      )}

      {runtimeError && <div className="error fade-in">✗ {runtimeError}</div>}
    </main>
  )
})
