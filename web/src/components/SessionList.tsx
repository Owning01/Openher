import { memo, useRef, useLayoutEffect } from "react"
import { RefreshIcon, PlusIcon, LoadingIcon, FolderIcon, ChatIcon } from "../Icons"
import { useT } from "../i18n-context"
import { SessionCard } from "./SessionCard"
import { formatTime, isSessionActive, hasFileChanges } from "../utils"
import type { SessionView, ConnectionState, DataMode } from "../types"

type SessionListProps = {
  projects: Array<[string, SessionView[]]>
  projectSessions: SessionView[]
  selectedProjectDir: string | null
  sessions: SessionView[]
  selectedID: string | null
  refreshingSessions: boolean
  creatingSession: boolean
  renamingSessionID: string | null
  renameValue: string
  connectionState: ConnectionState
  query: string
  activeSessions: SessionView[]
  recentSessions: SessionView[]
  runtimeError: string | null
  favorites: Set<string>
  dataMode: DataMode
  onDataModeChange: (mode: DataMode) => void
  onSelectProject: (dir: string | null) => void
  onQueryChange: (query: string) => void
  onRefresh: () => void
  onNewSession: () => void
  onOpen: (id: string, dir: string) => void
  onStartRename: (session: SessionView) => void
  onRenameChange: (value: string) => void
  onRenameConfirm: (id: string, title: string, dir: string) => void
  onRenameCancel: () => void
  onDelete: (session: SessionView) => void
  onToggleFavorite: (id: string) => void
}

export const SessionList = memo(function SessionList({
  projects, projectSessions, selectedProjectDir,
  sessions, selectedID, refreshingSessions, creatingSession,
  renamingSessionID, renameValue,
  connectionState, query,
  activeSessions, recentSessions, runtimeError, favorites,
  dataMode, onDataModeChange,
  onSelectProject, onQueryChange, onRefresh, onNewSession,
  onOpen, onStartRename, onRenameChange, onRenameConfirm, onRenameCancel, onDelete,
  onToggleFavorite
}: SessionListProps) {
  const t = useT()
  const containerRef = useRef<HTMLDivElement>(null)

  const prevProjectDir = useRef(selectedProjectDir)
  useLayoutEffect(() => {
    if (selectedProjectDir && prevProjectDir.current !== selectedProjectDir) {
      window.scrollTo(0, 0)
    }
    prevProjectDir.current = selectedProjectDir
  }, [selectedProjectDir])

  if (selectedProjectDir) {
    // Sessions for selected project
    return (
      <section ref={containerRef} className="panel sessions fade-in">
        <div className="section-heading">
          <div>
            <h2>{selectedProjectDir}</h2>
            <p className="subtle">
              <button className="btn-link" onClick={() => onSelectProject(null)}>← {t('sessions.title')}</button>
              <span style={{ marginLeft: 'var(--space-3)' }}>{projectSessions.length} sessions</span>
            </p>
          </div>
          <div className="inline-actions">
            <button onClick={onRefresh} className="btn-secondary" disabled={refreshingSessions}>
              {refreshingSessions ? <LoadingIcon size={18} /> : <RefreshIcon size={18} />}
              {t('sessions.refresh')}
            </button>
            <button onClick={onNewSession} className="btn-primary" disabled={creatingSession}>
              {creatingSession ? <LoadingIcon size={18} /> : <PlusIcon size={18} />}
              {creatingSession ? t('sessions.creating') : t('sessions.new')}
            </button>
          </div>
        </div>

        <div className="mode-switcher">
        <span className="mode-label">{t('settings.mode')}:</span>
          {(["full", "saver", "ultra", "miser"] as const).map((m) => (
            <button key={m} className={`mode-btn${dataMode === m ? " active" : ""}`}
              onClick={() => onDataModeChange(m)}
              aria-pressed={dataMode === m}>
              {m === "full" ? "Full" : m === "saver" ? "Saver" : m === "ultra" ? "ULTRA" : "Miser"}
            </button>
          ))}
        </div>

        <div className="toolbar">
          <input placeholder={t('sessions.searchPlaceholder')} value={query}
            onChange={(e) => onQueryChange(e.target.value)} className="search" />
        </div>

        {connectionState === "offline" && (
          <div className="notice error fade-in" style={{ marginBottom: 'var(--space-3)' }}>
            ✗ {t('connection.offline')}
          </div>
        )}
        {connectionState === "reconnecting" && (
          <div className="notice info fade-in" style={{ marginBottom: 'var(--space-3)' }}>
            ℹ {t('connection.reconnecting')}
          </div>
        )}

        <div className="session-list">
          {projectSessions.length === 0 ? (
            <div className="empty-state">
              <FolderIcon size={48} className="icon-empty-state" />
              <p>{t('sessions.emptyTitle')}</p>
              <p className="subtle">{t('sessions.emptyHint')}</p>
            </div>
          ) : (
            projectSessions.map((session) => (
              <SessionCard key={session.id} session={session} isSelected={selectedID === session.id}
                isRenaming={renamingSessionID === session.id} renameValue={renameValue}
                isFavorite={favorites.has(session.id)}
                onOpen={onOpen} onStartRename={onStartRename} onRenameChange={onRenameChange}
                onRenameConfirm={onRenameConfirm} onRenameCancel={onRenameCancel} onDelete={onDelete}
                onToggleFavorite={onToggleFavorite} />
            ))
          )}
        </div>

        {runtimeError && <div className="error fade-in">✗ {runtimeError}</div>}
      </section>
    )
  }

  // Projects list
  return (
    <section ref={containerRef} className="panel sessions fade-in">
      <div className="inline-actions">
        <button onClick={onRefresh} className="btn-secondary" disabled={refreshingSessions}>
          {refreshingSessions ? <LoadingIcon size={18} /> : <RefreshIcon size={18} />}
          {t('sessions.refresh')}
        </button>
        <button onClick={onNewSession} className="btn-primary" disabled={creatingSession}>
          {creatingSession ? <LoadingIcon size={18} /> : <PlusIcon size={18} />}
          {creatingSession ? t('sessions.creating') : t('sessions.new')}
        </button>
      </div>

      <div className="mode-switcher">
        <span className="mode-label">{t('settings.mode')}:</span>
        {(["full", "saver", "ultra", "miser"] as const).map((m) => (
          <button key={m} className={`mode-btn${dataMode === m ? " active" : ""}`}
            onClick={() => onDataModeChange(m)}
            aria-pressed={dataMode === m}>
            {m === "full" ? "Full" : m === "saver" ? "Saver" : m === "ultra" ? "ULTRA" : "Miser"}
          </button>
        ))}
      </div>

      <div className="toolbar">
        <input placeholder={t('sessions.searchPlaceholder')} value={query}
          onChange={(e) => onQueryChange(e.target.value)} className="search" />
      </div>
      <div className="sessions-summary-bar">
        {t('sessions.summary', { total: sessions.length, active: activeSessions.length, changed: sessions.filter((s) => hasFileChanges(s)).length })}
      </div>

      {connectionState === "offline" && (
        <div className="notice error fade-in" style={{ marginBottom: 'var(--space-3)' }}>
          ✗ {t('connection.offline')}
        </div>
      )}
      {connectionState === "reconnecting" && (
        <div className="notice info fade-in" style={{ marginBottom: 'var(--space-3)' }}>
          ℹ {t('connection.reconnecting')}
        </div>
      )}

      {!selectedProjectDir && !query.trim() && (activeSessions.length > 0 || recentSessions.length > 0) && (
        <div className="quick-access">
          {activeSessions.length > 0 && (
            <div className="quick-access-section">
              <h4 className="quick-access-label">{t('sessions.activeLabel')}</h4>
              <div className="quick-access-list">
                {activeSessions.map((session) => (
                  <button key={session.id} className="quick-access-card active" onClick={() => onOpen(session.id, session.directory)}>
                    <ChatIcon size={14} />
                    <span className="quick-access-title">{session.title}</span>
                    <span className="quick-access-time">{formatTime(session.updated)}</span>
                    <span className={`pill ${session.status}`}>{session.status}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {recentSessions.length > 0 && (
            <div className="quick-access-section">
              <h4 className="quick-access-label">{t('sessions.recentLabel')}</h4>
              <div className="quick-access-list">
                {recentSessions.filter((s) => !activeSessions.some((a) => a.id === s.id)).slice(0, 5).map((session) => (
                  <button key={session.id} className="quick-access-card" onClick={() => onOpen(session.id, session.directory)}>
                    <ChatIcon size={14} />
                    <span className="quick-access-title">{session.title}</span>
                    <span className="quick-access-time">{formatTime(session.updated)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="session-list">
        {projects.length === 0 && ['connecting', 'reconnecting'].includes(connectionState) ? (
          <div className="empty-state connection-pending">
            <LoadingIcon size={40} className="icon-empty-state" />
            <p>{t('sessions.loadingTitle')}</p>
            <p className="subtle">{t('sessions.loadingHint')}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <FolderIcon size={48} className="icon-empty-state" />
            <p>{t('sessions.emptyTitle')}</p>
            <p className="subtle">{connectionState === "offline" ? t('sessions.offlineHint') : t('sessions.emptyHint')}</p>
          </div>
        ) : (
          projects.map(([dir, projectSessionsList]) => (
            <article key={dir} className="project-card fade-in" role="button" tabIndex={0}
              onClick={() => onSelectProject(dir)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelectProject(dir) } }}>
              <div className="project-card-main">
                <strong className="project-path">{dir}</strong>
                <span className="project-count">{projectSessionsList.length} {projectSessionsList.length === 1 ? 'session' : 'sessions'}</span>
              </div>
              <div className="project-meta">
                <span className={`project-status ${projectSessionsList.some((s) => isSessionActive(s)) ? "busy" : "idle"}`}>
                  {projectSessionsList.filter((s) => isSessionActive(s)).length} active
                </span>
                <span className="project-changed">
                  {projectSessionsList.filter((s) => hasFileChanges(s)).length} changed
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      {runtimeError && <div className="error fade-in">✗ {runtimeError}</div>}
    </section>
  )
})
