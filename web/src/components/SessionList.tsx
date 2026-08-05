import { memo, useRef, useLayoutEffect, useState, useCallback } from "react"
import { LoadingIcon, FolderIcon, PlusIcon, ChevronIcon } from "../Icons"
import { useT } from "../i18n-context"
import { SessionCard } from "./SessionCard"
import { ConnectionNotices } from "./ConnectionNotices"
import { SessionToolbar } from "./SessionToolbar"
import { QuickAccessCard } from "./QuickAccessCard"
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
  favorites: Set<string>
  dataMode: DataMode
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
  onOpenSettings?: () => void
  onExportChat?: (session: SessionView) => void
  onSnapshot?: (session: SessionView) => void
  onArchive?: (id: string) => void
  onFork?: (session: SessionView) => void
  onDismissRecent?: (id: string) => void
  onNewSessionHere?: (directory: string) => void
}

export const SessionList = memo(function SessionList({
  projects, projectSessions, selectedProjectDir,
  sessions, selectedID, refreshingSessions, creatingSession,
  renamingSessionID, renameValue,
  connectionState, query,
  activeSessions, recentSessions, favorites,
  dataMode,
  onSelectProject, onQueryChange, onRefresh, onNewSession,
  onOpen, onStartRename, onRenameChange, onRenameConfirm, onRenameCancel, onDelete,
  onToggleFavorite, onOpenSettings, onExportChat, onSnapshot, onArchive, onFork,
  onDismissRecent, onNewSessionHere
}: SessionListProps) {
  const t = useT()
  const containerRef = useRef<HTMLDivElement>(null)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState(true)

  const [confirmingDismissId, setConfirmingDismissId] = useState<string | null>(null)

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    // Normaliza el estado guardado: exactamente un panel abierto (recientes
    // por defecto), el resto cerrado. Ignora estados viejos/corruptos.
    try {
      const raw = JSON.parse(localStorage.getItem("opencode.collapsedSections") || "{}") as Record<string, boolean>
      const all = { favorites: true, active: true, recent: true, ...raw }
      const openCount = Object.values(all).filter((v) => !v).length
      if (openCount > 1) return { favorites: true, active: true, recent: false }
      return all
    } catch {
      return { favorites: true, active: true, recent: false }
    }
  })
  const toggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => {
      // Accordion: toggle del tocado; el resto siempre queda cerrado.
      const next: Record<string, boolean> = { favorites: true, active: true, recent: true }
      next[key] = !prev[key]
      try {
        localStorage.setItem("opencode.collapsedSections", JSON.stringify(next))
      } catch { /* ignore */ }
      return next
    })
  }, [])

  const toggleProject = useCallback((dir: string) => {
    setExpandedProject((prev) => prev === dir ? null : dir)
  }, [])

  const prevProjectDir = useRef(selectedProjectDir)
  useLayoutEffect(() => {
    if (selectedProjectDir && prevProjectDir.current !== selectedProjectDir) {
      window.scrollTo(0, 0)
    }
    prevProjectDir.current = selectedProjectDir
  }, [selectedProjectDir])

  const notices = <ConnectionNotices connectionState={connectionState} />

  const sessionCards = projectSessions.length === 0 ? (
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
        onToggleFavorite={onToggleFavorite}
        onExportChat={onExportChat} onSnapshot={onSnapshot} onArchive={onArchive} onFork={onFork} />
    ))
  )

  if (selectedProjectDir) {
    return (
      <section ref={containerRef} className="panel sessions fade-in">
        <div className="section-heading">
          <div>
            <h2>{selectedProjectDir}</h2>
            <p className="subtle">
              <button className="btn-link" onClick={() => onSelectProject(null)}>← {t('sessions.title')}</button>
              <span style={{ marginLeft: 'var(--space-3)' }}>{t('sessions.count', { count: projectSessions.length })}</span>
            </p>
          </div>
          <div className="section-actions">
            {onNewSessionHere && (
              <button className="btn-icon btn-primary compact" onClick={() => onNewSessionHere(selectedProjectDir!)} title={t('sessions.newHere') || "New session here"}>
                <PlusIcon size={16} />
              </button>
            )}
            <SessionToolbar refreshing={refreshingSessions} creating={creatingSession}
              onRefresh={onRefresh} onNewSession={onNewSession} onOpenSettings={onOpenSettings}
              dataMode={dataMode} />
          </div>
        </div>
        <div className="toolbar">
<input name="sessionSearch" placeholder={t('sessions.searchPlaceholder')} value={query}
onChange={(e) => onQueryChange(e.target.value)} className="search" />
        </div>
        {notices}
        <div className="session-list">{sessionCards}</div>
      </section>
    )
  }

  return (
    <section ref={containerRef} className="panel sessions fade-in home-view">
      <div className="home-bg" aria-hidden="true">
        <img src="./img/opencode-wordmark-dark.png" alt="" className="home-wordmark" />
      </div>
      <SessionToolbar refreshing={refreshingSessions} creating={creatingSession}
        onRefresh={onRefresh} onNewSession={onNewSession} onOpenSettings={onOpenSettings}
        dataMode={dataMode} />
      <div className="toolbar">
        <input name="sessionSearch" placeholder={t('sessions.searchPlaceholder')} value={query}
          onChange={(e) => onQueryChange(e.target.value)} className="search" />
      </div>
      {notices}

      {!selectedProjectDir && !query.trim() && (favorites.size > 0 || activeSessions.length > 0 || recentSessions.length > 0) && (
        <div className="quick-access">
          <div className="quick-access-tabs" role="tablist" aria-label="Acceso rápido">
            {favorites.size > 0 && sessions.some((s) => favorites.has(s.id)) && (
              <button type="button" className={`quick-access-tab${!collapsedSections.favorites ? " open" : ""}`}
                onClick={() => toggleSection("favorites")} aria-expanded={!collapsedSections.favorites}
                aria-controls="quick-favorites" role="tab">
                {t('favorites.label')}
                <ChevronIcon size={10} className="quick-access-chevron" />
              </button>
            )}
            {activeSessions.length > 0 && (
              <button type="button" className={`quick-access-tab${!collapsedSections.active ? " open" : ""}`}
                onClick={() => toggleSection("active")} aria-expanded={!collapsedSections.active}
                aria-controls="quick-active" role="tab">
                {t('sessions.activeLabel')}
                <span className="quick-access-count">{activeSessions.length}</span>
                <ChevronIcon size={10} className="quick-access-chevron" />
              </button>
            )}
            {recentSessions.length > 0 && (
              <button type="button" className={`quick-access-tab${!collapsedSections.recent ? " open" : ""}`}
                onClick={() => toggleSection("recent")} aria-expanded={!collapsedSections.recent}
                aria-controls="quick-recent" role="tab">
                {t('sessions.recentLabel')}
                <ChevronIcon size={10} className="quick-access-chevron" />
              </button>
            )}
          </div>
          {favorites.size > 0 && !collapsedSections.favorites && (() => {
            const favoriteSessions = sessions.filter((s) => favorites.has(s.id))
            if (favoriteSessions.length === 0) return null
            return (
              <div className="quick-access-list" id="quick-favorites" role="tabpanel">
                {favoriteSessions.slice(0, 5).map((session) => (
                  <QuickAccessCard key={session.id} session={session} isFavorite
                    onOpen={onOpen} onToggleFavorite={onToggleFavorite} />
                ))}
              </div>
            )
          })()}
          {!collapsedSections.active && (
            <div className="quick-access-list" id="quick-active" role="tabpanel">
              {activeSessions.map((session) => (
                <QuickAccessCard key={session.id} session={session}
                  isFavorite={favorites.has(session.id)}
                  onOpen={onOpen} onToggleFavorite={onToggleFavorite} />
              ))}
            </div>
          )}
          {!collapsedSections.recent && (
            <div className="quick-access-list" id="quick-recent" role="tabpanel">
              {recentSessions.filter((s) => !activeSessions.some((a) => a.id === s.id)).slice(0, 5).map((session) => (
                confirmingDismissId === session.id ? (
                  <div key={session.id} className="quick-access-card confirming-dismiss" onClick={() => onOpen(session.id, session.directory)} role="button" tabIndex={0}>
                    <div className="dismiss-confirm" onClick={(e) => e.stopPropagation()}>
                      <span>{t('sessions.recentDismiss')}</span>
                      <div className="dismiss-confirm-actions">
                        <button className="btn-danger compact" onClick={(e) => { e.stopPropagation(); setConfirmingDismissId(null); onDismissRecent?.(session.id) }}>{t('common.yes')}</button>
                        <button className="btn-secondary compact" onClick={(e) => { e.stopPropagation(); setConfirmingDismissId(null) }}>{t('common.no')}</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <QuickAccessCard key={session.id} session={session}
                    isFavorite={favorites.has(session.id)}
                    onOpen={onOpen} onToggleFavorite={onToggleFavorite}
                    onDismiss={(id) => setConfirmingDismissId(id)} />
                )
              ))}
            </div>
          )}
        </div>
      )}

      <div className="section-divider" />

      <div className="list-mode-toggle">
        <button type="button" className={`list-mode-pill${listOpen ? " active" : ""}`}
          onClick={() => setListOpen((v) => !v)} aria-pressed={listOpen}>
          <FolderIcon size={14} />
          {t('sessions.title')}
          <ChevronIcon size={12} className={`quick-access-chevron${listOpen ? "" : " collapsed"}`} />
        </button>
      </div>

      {listOpen && (
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
          projects.map(([dir, projectSessionsList]) => {
            const isExpanded = expandedProject === dir
            return (
              <div key={dir} className="project-card-wrap fade-in">
                <article className={`project-card${isExpanded ? " expanded" : ""}`} role="button" tabIndex={0}
                  onClick={() => toggleProject(dir)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleProject(dir) } }}>
                  <div className="project-card-header">
                    <div className="project-title-group">
                      <strong className="project-path">{dir}</strong>
                    </div>
                    <span className="project-count">
                      {t('sessions.count', { count: projectSessionsList.length })}
                      <span className="project-chevron">{isExpanded ? "▲" : "▼"}</span>
                    </span>
                  </div>
                </article>
                {isExpanded && (
                  <div className="project-sessions-inline">
                    {projectSessionsList.map((session) => (
                      <SessionCard key={session.id} session={session} isSelected={selectedID === session.id}
                        isRenaming={renamingSessionID === session.id} renameValue={renameValue}
                        isFavorite={favorites.has(session.id)}
                        onOpen={onOpen} onStartRename={onStartRename} onRenameChange={onRenameChange}
                        onRenameConfirm={onRenameConfirm} onRenameCancel={onRenameCancel} onDelete={onDelete}
                        onToggleFavorite={onToggleFavorite}
                        onExportChat={onExportChat} onSnapshot={onSnapshot} onArchive={onArchive} onFork={onFork} />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      )}
    </section>
  )
})
