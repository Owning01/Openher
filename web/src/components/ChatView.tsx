import { memo, useCallback } from "react"
import { ChatIcon, PencilIcon, SaveIcon, CloseIcon, FolderIcon } from "../Icons"
import { useT } from "../i18n-context"
import { MessageList } from "./MessageList"
import { Composer } from "./Composer"
import { TodoBox } from "./TodoBox"

import type { SessionView, RenderedMessage, TodoItem, AgentOption, ModelOption } from "../types"

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
  // Rename
  onStartRename: (session: SessionView) => void
  onRenameChange: (value: string) => void
  onRenameConfirm: (id: string, title: string, dir: string) => void
  onRenameCancel: () => void
  // Messages
  onComposerChange: (value: string) => void
  onSend: () => void
  onAbort: () => void
  // Todos
  onTodosToggle: () => void
  // Navigation
  onBackToSessions: () => void
  // Sheet
  onSheetOpen: (sheet: "ai" | "details") => void
  // Recent sessions
  recentSessions: SessionView[]
  activeSessions: SessionView[]
  onOpenSession: (id: string, dir: string) => void
}

export const ChatView = memo(function ChatView({
  selectedSession, messages, todos, todosExpanded, composer, isWorking,
  showTypingBubble, loadingSessionID, selectedID, messageScrollSignature, view,
  runtimeError, renamingSessionID, renameValue,
  showModelChip, activeModelOption, activeAgentID, primaryAgentOptions, onChangeAgent,
  projectName,
  onStartRename, onRenameChange, onRenameConfirm, onRenameCancel,
  onComposerChange, onSend, onAbort, onTodosToggle,
  onBackToSessions, onSheetOpen,
  recentSessions, activeSessions, onOpenSession
}: ChatViewProps) {
  const t = useT()

  const handleBack = useCallback(() => {
    onBackToSessions()
    requestAnimationFrame(() => document.querySelector<HTMLElement>(".session-card.active")?.scrollIntoView({ block: "center" }))
  }, [onBackToSessions])

  return (
    <main className="panel detail fade-in">
      <div className="detail-topbar">
        <button className="btn-secondary" onClick={handleBack}>{t('detail.backToSessions')}</button>
        {selectedSession && <span className={`pill ${selectedSession.status}`}>{selectedSession.status}</span>}
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
          <button type="button" className="context-chip" onClick={() => onSheetOpen("ai")}>
            <span>{t('detail.aiChip')}</span>
            <strong>{activeModelOption?.modelName ?? t('detail.modelLoading')}</strong>
          </button>
          <button type="button" className="context-chip ghost" onClick={() => onSheetOpen("details")}>
            <span>{t('detail.detailsChip')}</span>
            <strong>{projectName || t('detail.projectLabel')}</strong>
          </button>
        </section>
      )}

      {selectedSession && (
        <TodoBox todos={todos} expanded={todosExpanded} onToggle={onTodosToggle} />
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

      {selectedSession && (
        <Composer
          value={composer}
          onChange={onComposerChange}
          onSend={onSend}
          onAbort={onAbort}
          disabled={!selectedSession || isWorking}
          isWorking={isWorking}
          placeholder={t('detail.composerPlaceholder')}
          activeAgentID={activeAgentID}
          primaryAgentOptions={primaryAgentOptions}
          onChangeAgent={onChangeAgent}
        />
      )}

      {runtimeError && <div className="error fade-in">✗ {runtimeError}</div>}
    </main>
  )
})
