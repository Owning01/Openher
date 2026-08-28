import { memo, useRef, useState, useCallback, useMemo } from "react"
import { LoadingIcon, FolderIcon, PlusIcon, ChevronIcon, ArchiveIcon, TrashIcon } from "../Icons"
import { useT } from "../i18n-context"
import { SessionCard } from "./SessionCard"
import { ConnectionNotices } from "./ConnectionNotices"
import { SessionToolbar } from "./SessionToolbar"
import { QuickAccessCard } from "./QuickAccessCard"
import { ContextMenu } from "./ContextMenu"
import { ExportCacheButton } from "./ExportCacheButton"
import { shell } from "../shell"
import { useDialog } from "./DialogProvider"
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
  onRefresh: () => Promise<boolean>
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
  onOpenExplorer?: (directory: string) => void
  onDragStartSession?: (id: string, dir: string) => void
  onDeleteMany?: (ids: string[]) => void
  onArchiveMany?: (ids: string[]) => void
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
  onDismissRecent, onNewSessionHere, onOpenExplorer, onDragStartSession, onDeleteMany, onArchiveMany
}: SessionListProps) {
  const t = useT()
  const { confirm } = useDialog()
  const containerRef = useRef<HTMLDivElement>(null)
  const [expandedProject, setExpandedProject] = useState<string | null>(null)
  const [listOpen, setListOpen] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [projectContextMenu, setProjectContextMenu] = useState<{
    x: number
    y: number
    dir: string
    sessions: SessionView[]
  } | null>(null)

  const [confirmingDismissId, setConfirmingDismissId] = useState<string | null>(null)
  const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set())

  const recentFiltered = useMemo(
    () => recentSessions.filter((s) => !activeSessions.some((a) => a.id === s.id)),
    [recentSessions, activeSessions]
  )

  const favoriteSessions = useMemo(
    () => sessions.filter((s) => favorites.has(s.id)),
    [sessions, favorites]
  )

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    // Normaliza el estado guardado: exactamente un panel abierto (recientes
    // por defecto), el resto cerrado. Ignora estados viejos/corruptos.
    try {
      const raw = JSON.parse(localStorage.getItem("opencode.collapsedSections") || "{}") as Record<string, boolean>
      const all = { favorites: true, active: true, recent: true, ...raw }
      const openCount = Object.values(all).filter((v) => !v).length
      if (openCount === 0) return { favorites: true, active: true, recent: false }
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

  const toggleSelectMode = useCallback(() => {
    setSelectMode((v) => {
      if (v) setSelectedIds(new Set())
      return !v
    })
  }, [])

  const toggleCheck = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleDeleteMany = useCallback(async () => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    const ok = await confirm({ message: t('sessions.deleteManyConfirm', { count: ids.length }), confirmText: t('common.yes'), cancelText: t('common.cancel'), variant: "danger" })
    if (!ok) return
    onDeleteMany?.(ids)
    setSelectMode(false)
    setSelectedIds(new Set())
  }, [selectedIds, onDeleteMany, t, confirm])

  const handleArchiveMany = useCallback(() => {
    const ids = [...selectedIds]
    if (ids.length === 0) return
    onArchiveMany?.(ids)
    setSelectMode(false)
    setSelectedIds(new Set())
  }, [selectedIds, onArchiveMany])

  const selectionBar = selectMode && (
    <div className="session-selection-bar">
      <span className="session-selection-count">{t('sessions.selectedCount', { count: selectedIds.size })}</span>
      <div className="session-selection-actions">
        {onArchiveMany && (
          <button type="button" className="btn-secondary compact" onClick={handleArchiveMany}
            disabled={selectedIds.size === 0} title={t('detail.archive')}>
            <ArchiveIcon size={14} /> {t('detail.archive')}
          </button>
        )}
        {onDeleteMany && (
          <button type="button" className="btn-danger compact" onClick={handleDeleteMany}
            disabled={selectedIds.size === 0}>
            <TrashIcon size={14} /> {t('sessions.deleteSelected')}
          </button>
        )}
        <button type="button" className="btn-secondary compact" onClick={toggleSelectMode}>
          {t('sessions.cancelSelect')}
        </button>
      </div>
    </div>
  )

  const [sessionContextMenu, setSessionContextMenu] = useState<{
    x: number
    y: number
    session: SessionView
  } | null>(null)

  const notices = <ConnectionNotices connectionState={connectionState} />

  const handleSessionContextMenu = useCallback((e: React.MouseEvent, session: SessionView) => {
    e.preventDefault()
    e.stopPropagation()
    setSessionContextMenu({
      x: e.clientX,
      y: e.clientY,
      session,
    })
  }, [])

  const handleProjectContextMenu = useCallback((e: React.MouseEvent, dir: string, dirSessions: SessionView[]) => {
    e.preventDefault()
    e.stopPropagation()
    setProjectContextMenu({
      x: e.clientX,
      y: e.clientY,
      dir,
      sessions: dirSessions,
    })
  }, [])

  const sessionContextMenuElement = sessionContextMenu ? (
    <ContextMenu
      x={sessionContextMenu.x}
      y={sessionContextMenu.y}
      actions={[
        {
          id: "open",
          label: t('sessions.open') || "Abrir",
          onAction: () => {
            onOpen(sessionContextMenu.session.id, sessionContextMenu.session.directory)
          }
        },
        {
          id: "toggle-fav",
          label: favorites.has(sessionContextMenu.session.id)
            ? t('favorites.remove')
            : t('favorites.add'),
          onAction: () => {
            onToggleFavorite(sessionContextMenu.session.id)
          }
        },
        {
          id: "rename",
          label: t('session.rename') || "Renombrar sesión",
          onAction: () => {
            onStartRename(sessionContextMenu.session)
          }
        },
        ...(onArchive ? [{
          id: "archive",
          label: t('detail.archive') || "Archivar sesión",
          onAction: () => {
            onArchive(sessionContextMenu.session.id)
          }
        }] : []),
        {
          id: "delete",
          label: t('session.delete') || "Eliminar sesión",
          onAction: () => {
            onDelete(sessionContextMenu.session)
          }
        },
        {
          id: "copy-id",
          label: "Copiar ID",
          onAction: () => {
            navigator.clipboard?.writeText(sessionContextMenu.session.id).catch(() => {})
          }
        }
      ]}
      onClose={() => setSessionContextMenu(null)}
    />
  ) : null

  const projectContextMenuElement = projectContextMenu ? (
    <ContextMenu
      x={projectContextMenu.x}
      y={projectContextMenu.y}
      actions={[
        {
          id: "new-session",
          label: t('project.newSession'),
          onAction: () => {
            onNewSessionHere?.(projectContextMenu.dir)
          }
        },
        ...(onOpenExplorer ? [{
          id: "view-explorer",
          label: t('project.viewExplorer'),
          onAction: () => {
            onOpenExplorer(projectContextMenu.dir)
          }
        }] : []),
        {
          id: "reveal-explorer",
          label: t('project.revealExplorer'),
          onAction: () => {
            shell.fs.reveal(projectContextMenu.dir).catch(() => {})
          }
        },
        {
          id: "toggle-favorites",
          label: projectContextMenu.sessions.length > 0 && projectContextMenu.sessions.every((s) => favorites.has(s.id))
            ? t('favorites.remove')
            : t('favorites.add'),
          onAction: () => {
            if (projectContextMenu.sessions.length === 0) return
            const allFav = projectContextMenu.sessions.every((s) => favorites.has(s.id))
            if (allFav) {
              projectContextMenu.sessions.forEach((s) => {
                if (favorites.has(s.id)) onToggleFavorite(s.id)
              })
            } else {
              projectContextMenu.sessions.forEach((s) => {
                if (!favorites.has(s.id)) onToggleFavorite(s.id)
              })
            }
          }
        },
        {
          id: "copy-path",
          label: t('project.copyPath'),
          onAction: () => {
            navigator.clipboard?.writeText(projectContextMenu.dir).catch(() => {})
          }
        }
      ]}
      onClose={() => setProjectContextMenu(null)}
    />
  ) : null

  const renderSessionCards = useCallback((list: SessionView[]) => {
    if (list.length === 0) {
      return (
        <div className="empty-state">
          <FolderIcon size={48} className="icon-empty-state" />
          <p>{t('sessions.emptyTitle')}</p>
          <p className="subtle">{t('sessions.emptyHint')}</p>
        </div>
      )
    }

    const parents = list.filter((s) => !s.parentID)
    const childrenByParent = new Map<string, SessionView[]>()
    const orphanChildren: SessionView[] = []

    list.forEach((s) => {
      if (s.parentID) {
        if (list.some((p) => p.id === s.parentID)) {
          const arr = childrenByParent.get(s.parentID) ?? []
          arr.push(s)
          childrenByParent.set(s.parentID, arr)
        } else {
          orphanChildren.push(s)
        }
      }
    })

    const renderCard = (
      session: SessionView,
      isChild = false,
      parentOpts?: {
        hasChildren: boolean
        isCollapsed: boolean
        onToggleCollapse: () => void
        onOpenParent: () => void
      }
    ) => (
      <SessionCard
        key={session.id}
        session={session}
        isChild={isChild}
        isSelected={selectedID === session.id}
        isRenaming={renamingSessionID === session.id}
        renameValue={renameValue}
        isFavorite={favorites.has(session.id)}
        hasChildren={parentOpts?.hasChildren}
        isCollapsed={parentOpts?.isCollapsed}
        onToggleCollapse={parentOpts?.onToggleCollapse}
        onOpenParent={parentOpts?.onOpenParent}
        onOpen={onOpen}
        onStartRename={onStartRename}
        onRenameChange={onRenameChange}
        onRenameConfirm={onRenameConfirm}
        onRenameCancel={onRenameCancel}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        onExportChat={onExportChat}
        onSnapshot={onSnapshot}
        onArchive={onArchive}
        onFork={onFork}
        onDragStartSession={onDragStartSession}
        onContextMenu={handleSessionContextMenu}
        selectMode={selectMode}
        isChecked={selectedIds.has(session.id)}
        onToggleCheck={() => toggleCheck(session.id)}
      />
    )

    return (
      <div className="session-cards-hierarchical">
        {parents.map((parent) => {
          const children = childrenByParent.get(parent.id)
          const hasChildren = !!children && children.length > 0
          const isCollapsed = collapsedParents.has(parent.id)
          return (
            <div key={parent.id} className="session-group">
              {renderCard(parent, false, hasChildren ? {
                hasChildren,
                isCollapsed,
                onToggleCollapse: () => {
                  setCollapsedParents((prev) => {
                    const next = new Set(prev)
                    if (next.has(parent.id)) next.delete(parent.id)
                    else next.add(parent.id)
                    return next
                  })
                },
                onOpenParent: () => onOpen(parent.id, parent.directory)
              } : undefined)}
              {hasChildren && !isCollapsed && children.map((child) => (
                <div key={child.id} className="session-child-wrap" style={{ paddingLeft: "16px" }}>
                  {renderCard(child, true)}
                </div>
              ))}
            </div>
          )
        })}
        {orphanChildren.map((child) => (
          <div key={child.id} className="session-child-wrap" style={{ paddingLeft: "16px" }}>
            {renderCard(child, true)}
          </div>
        ))}
      </div>
    )
  }, [
    t, selectedID, renamingSessionID, renameValue, favorites, collapsedParents,
    onOpen, onStartRename, onRenameChange, onRenameConfirm, onRenameCancel,
    onDelete, onToggleFavorite, onExportChat, onSnapshot, onArchive, onFork,
    onDragStartSession, handleSessionContextMenu, selectMode, selectedIds, toggleCheck
  ])

  if (selectedProjectDir) {
    return (
      <section ref={containerRef} className="panel sessions fade-in">
        <div className="section-heading">
          <div>
            <h2 onContextMenu={(e) => handleProjectContextMenu(e, selectedProjectDir, projectSessions)}>{selectedProjectDir}</h2>
            <p className="subtle">
              <button className="btn-link" onClick={() => onSelectProject(null)}>← {t('sessions.title')}</button>
              <span style={{ marginLeft: 'var(--space-3)' }}>{t('sessions.count', { count: projectSessions.length })}</span>
            </p>
          </div>
          <div className="section-actions">
            {onNewSessionHere && (
              <button className="btn-icon btn-primary compact" onClick={() => onNewSessionHere(selectedProjectDir!)} title={t('sessions.newHere') || "New session here"} aria-label={t('sessions.newHere') || "New session here"}>
                <PlusIcon size={16} />
              </button>
            )}
            <SessionToolbar refreshing={refreshingSessions} creating={creatingSession}
              onRefresh={onRefresh} onNewSession={onNewSession} onOpenSettings={onOpenSettings}
              dataMode={dataMode} onSearchToggle={() => setSearchOpen((v) => !v)} searchOpen={searchOpen}
              selecting={selectMode} onToggleSelect={toggleSelectMode} />
          </div>
        </div>
        <div className={`toolbar${searchOpen ? " search-open" : ""}`}>
<input name="sessionSearch" placeholder={t('sessions.searchPlaceholder')} value={query}
onChange={(e) => onQueryChange(e.target.value)} className="search" />
        </div>
        {notices}
        {selectionBar}
        <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 4px" }}>
          <ExportCacheButton small />
        </div>
        <div className="session-list">{renderSessionCards(projectSessions)}</div>
        {sessionContextMenuElement}
        {projectContextMenuElement}
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
        dataMode={dataMode} onSearchToggle={() => setSearchOpen((v) => !v)} searchOpen={searchOpen}
        selecting={selectMode} onToggleSelect={toggleSelectMode} />
      <div className={`toolbar${searchOpen ? " search-open" : ""}`}>
        <input name="sessionSearch" placeholder={t('sessions.searchPlaceholder')} value={query}
          onChange={(e) => onQueryChange(e.target.value)} className="search" />
      </div>
      {notices}
      {selectionBar}
      <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 4px", gap: 8 }}>
        <ExportCacheButton />
      </div>

      {!selectedProjectDir && !query.trim() && (favorites.size > 0 || activeSessions.length > 0 || recentSessions.length > 0) && (
        <div className="quick-access">
          <div className="quick-access-tabs" role="tablist" aria-label="Acceso rápido">
            {favorites.size > 0 && sessions.some((s) => favorites.has(s.id)) && (
              <button type="button" className={`quick-access-tab${!collapsedSections.favorites ? " open" : ""}`}
                onClick={() => toggleSection("favorites")} aria-expanded={!collapsedSections.favorites}
                aria-controls="quick-favorites" role="tab" title={t('favorites.label')}>
                <span className="quick-access-tab-label">{t('favorites.label')}</span>
                <ChevronIcon size={10} className="quick-access-chevron" />
              </button>
            )}
            {activeSessions.length > 0 && (
              <button type="button" className={`quick-access-tab${!collapsedSections.active ? " open" : ""}`}
                onClick={() => toggleSection("active")} aria-expanded={!collapsedSections.active}
                aria-controls="quick-active" role="tab" title={t('sessions.activeLabel')}>
                <span className="quick-access-tab-label">{t('sessions.activeLabel')}</span>
                <span className="quick-access-count">{activeSessions.length}</span>
                <ChevronIcon size={10} className="quick-access-chevron" />
              </button>
            )}
            {recentSessions.length > 0 && (
              <button type="button" className={`quick-access-tab${!collapsedSections.recent ? " open" : ""}`}
                onClick={() => toggleSection("recent")} aria-expanded={!collapsedSections.recent}
                aria-controls="quick-recent" role="tab" title={t('sessions.recentLabel')}>
                <span className="quick-access-tab-label">{t('sessions.recentLabel')}</span>
                <ChevronIcon size={10} className="quick-access-chevron" />
              </button>
            )}
          </div>
          {favorites.size > 0 && !collapsedSections.favorites && favoriteSessions.length > 0 && (
            <div className="quick-access-list" id="quick-favorites" role="tabpanel">
              {favoriteSessions.map((session) => (
                <QuickAccessCard key={session.id} session={session} isFavorite
                  onOpen={onOpen} onToggleFavorite={onToggleFavorite}
                  onDragStartSession={onDragStartSession}
                  onContextMenu={handleSessionContextMenu} />
              ))}
            </div>
          )}
          {!collapsedSections.active && (
            <div className="quick-access-list" id="quick-active" role="tabpanel">
              {activeSessions.map((session) => (
                <QuickAccessCard key={session.id} session={session}
                  isFavorite={favorites.has(session.id)}
                  onOpen={onOpen} onToggleFavorite={onToggleFavorite}
                  onDragStartSession={onDragStartSession}
                  onContextMenu={handleSessionContextMenu} />
              ))}
            </div>
          )}
          {!collapsedSections.recent && (
            <div className="quick-access-list" id="quick-recent" role="tabpanel">
              {recentFiltered.map((session) => (
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
                    onDismiss={(id) => setConfirmingDismissId(id)}
                    onDragStartSession={onDragStartSession}
                    onContextMenu={handleSessionContextMenu} />
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
                  onContextMenu={(e) => handleProjectContextMenu(e, dir, projectSessionsList)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleProject(dir) } }}>
                  <div className="project-card-header">
                    <strong className="project-path">{dir}</strong>
                  </div>
                </article>
                {isExpanded && (
                  <div className="project-sessions-inline">
                    {renderSessionCards(projectSessionsList)}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      )}

      {sessionContextMenuElement}
      {projectContextMenuElement}
    </section>
  )
})
