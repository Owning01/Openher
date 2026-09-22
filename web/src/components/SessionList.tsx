import { memo, useRef, useState, useCallback, useEffect, useMemo, Fragment, type ReactElement } from "react"
import { LoadingIcon, FolderIcon, PlusIcon, ChevronIcon, ArchiveIcon, TrashIcon, ChatIcon, StarIcon, PencilIcon, CopyIcon, MonitorIcon } from "../Icons"
import { useT } from "../i18n-context"
import { SessionCard } from "./SessionCard"
import { ConnectionNotices } from "./ConnectionNotices"
import { SessionToolbar } from "./SessionToolbar"
import { QuickAccessCard } from "./QuickAccessCard"
import { ContextMenu } from "./ContextMenu"
import { shell } from "../shell"
import { useDialog } from "./DialogProvider"
import { coupleSessionRows, type SessionRow } from "../utils/sessionTree"
import type { SessionView, ConnectionState, DataMode } from "../types"

// localStorage propio (no entra en STORAGE_KEYS: su test pinea el set de 19
// claves y repuntarlo necesita OK explícito del humano).
const COUPLE_SUBSESSIONS_KEY = "openher.coupleSubsessions"

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
  activeSessions: _activeSessions, recentSessions, favorites,
  dataMode,
  onSelectProject, onQueryChange, onRefresh, onNewSession,
  onOpen, onStartRename, onRenameChange, onRenameConfirm, onRenameCancel, onDelete,
  onToggleFavorite, onOpenSettings, onExportChat, onSnapshot, onArchive, onFork,
  onDismissRecent, onNewSessionHere, onOpenExplorer, onDragStartSession, onDeleteMany, onArchiveMany
}: SessionListProps) {
  const t = useT()
  void _activeSessions
  const { confirm } = useDialog()
  const containerRef = useRef<HTMLDivElement>(null)
  // Varias carpetas desplegadas a la vez (Set de dirs): antes un solo
  // string|null obligaba a ver las sesiones de un único proyecto cada vez.
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
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
  // Subagentes en la vista de proyecto: solo se ocultan cuando su padre TAMBIÉN
  // está listado (ya se ven agrupados bajo él en la tarjeta del proyecto). Los
  // huérfanos (padre borrado o ausente) SÍ se muestran ahí: el `!s.parentID` a
  // secas los borraba de TODAS las vistas y un proyecto solo-subagentes
  // desaparecía entero.
  const sessionIds = useMemo(() => new Set(sessions.map((s) => s.id)), [sessions])
  const isListedChild = useCallback(
    (s: SessionView) => !!s.parentID && sessionIds.has(s.parentID),
    [sessionIds]
  )

  // Pedido explícito: Recientes lista SOLO sesiones principales (sin parentID),
  // ni hijas con padre vivo ni huérfanas. El orden lo trae recentSessions:
  // `updated` (fecha de uso) descendente, ya ordenado en useWorkspaceRuntime.
  const recentMains = useMemo(
    () => recentSessions.filter((s) => !s.parentID),
    [recentSessions]
  )

  const favoriteSessions = useMemo(
    () => sessions.filter((s) => favorites.has(s.id) && !isListedChild(s)),
    [sessions, favorites, isListedChild]
  )

  // "Acoplar subsesiones": con el toggle activo, las hijas se muestran
  // debajo de SU sesión en Favoritos. Recientes nunca las lista (solo
  // sesiones principales, por pedido explícito). Apagado por defecto =
  // conducta histórica intacta; el estado queda en el almacenamiento local
  // del WebView.
  const [coupledSubs, setCoupledSubs] = useState(() => {
    try {
      return localStorage.getItem(COUPLE_SUBSESSIONS_KEY) === "1"
    } catch {
      return false
    }
  })
  const toggleCoupledSubs = useCallback(() => setCoupledSubs((prev) => !prev), [])
  useEffect(() => {
    try {
      localStorage.setItem(COUPLE_SUBSESSIONS_KEY, coupledSubs ? "1" : "0")
    } catch {
      /* storage bloqueado: el estado sigue en memoria */
    }
  }, [coupledSubs])

  // El toggle solo actúa sobre el acceso rápido: fuera de ahí (vista de
  // proyecto o búsqueda activa) el botón se oculta en vez de prometer algo
  // que no hace.
  const quickAccessVisible = !selectedProjectDir && !query.trim()
  const couplingProps = quickAccessVisible
    ? { coupling: coupledSubs, onToggleCoupling: toggleCoupledSubs }
    : {}

  // Recientes: solo principales, con el toggle de acople en cualquier estado.
  const recentRows = useMemo<SessionRow<SessionView>[]>(() =>
    recentMains.map((session) => ({ session, isChild: false })),
    [recentMains]
  )

  const favoriteRows = useMemo<SessionRow<SessionView>[]>(
    () =>
      coupledSubs
        ? coupleSessionRows(sessions.filter((s) => favorites.has(s.id)), sessionIds)
        : favoriteSessions.map((session) => ({ session, isChild: false })),
    [coupledSubs, sessions, favorites, favoriteSessions, sessionIds]
  )

  // La fila hija va dentro del wrap de árbol (línea + sangría) para leerse
  // acoplada a su padre; la fila normal se queda como está.
  const wrapQuickRow = (row: SessionRow<SessionView>, card: ReactElement): ReactElement =>
    row.isChild ? (
      <div key={row.session.id} className="session-child-wrap" style={{ paddingLeft: "16px" }}>
        {card}
      </div>
    ) : (
      <Fragment key={row.session.id}>{card}</Fragment>
    )

  // Proyectos: listas completas (padres + hijos). renderSessionCards agrupa
  // los hijos bajo su padre y muestra los huérfanos; el filtro anterior los
  // eliminaba aquí y el grupo solo-subagentes caía por `length > 0`.
  const visibleProjects = projects

  const visibleProjectSessions = projectSessions

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem("opencode.collapsedSections") || "{}") as Record<string, boolean>
      const all = { favorites: true, recent: true, ...raw } as Record<string, boolean>
      if ("active" in all) delete (all as any).active
      const openCount = Object.values(all).filter((v) => !v).length
      if (openCount === 0) return { favorites: true, recent: false }
      if (openCount > 1) return { favorites: true, recent: false }
      return all
    } catch {
      return { favorites: true, recent: false }
    }
  })

  const toggleSection = useCallback((key: string) => {
    setCollapsedSections((prev) => {
      const next: Record<string, boolean> = { favorites: true, recent: true }
      next[key] = !prev[key]
      try {
        localStorage.setItem("opencode.collapsedSections", JSON.stringify(next))
      } catch { /* ignore */ }
      return next
    })
  }, [])

  const toggleProject = useCallback((dir: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev)
      if (next.has(dir)) next.delete(dir)
      else next.add(dir)
      return next
    })
  }, [])

  // Rename estilo Windows: el campo in-place vive dentro de la tarjeta, así
  // que al entrar en rename la tarjeta debe estar visible: se expande su
  // proyecto (y su padre si es un subagente colapsado) y su sección rápida.
  useEffect(() => {
    if (!renamingSessionID) return
    for (const [dir, list] of projects) {
      if (list.some((s) => s.id === renamingSessionID)) {
        setExpandedProjects((prev) => (prev.has(dir) ? prev : new Set(prev).add(dir)))
        break
      }
    }
    const renaming = sessions.find((s) => s.id === renamingSessionID)
    if (renaming?.parentID) {
      const pid = renaming.parentID
      setCollapsedParents((prev) => {
        if (!prev.has(pid)) return prev
        const next = new Set(prev)
        next.delete(pid)
        return next
      })
    }
    if (favorites.has(renamingSessionID)) {
      setCollapsedSections((prev) => (prev.favorites ? { ...prev, favorites: false } : prev))
    }
    if (recentMains.some((s) => s.id === renamingSessionID)) {
      setCollapsedSections((prev) => (prev.recent ? { ...prev, recent: false } : prev))
    }
  }, [renamingSessionID, projects, sessions, favorites, recentSessions])

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
          icon: <ChatIcon size={15} />,
          onAction: () => {
            onOpen(sessionContextMenu.session.id, sessionContextMenu.session.directory)
          }
        },
        {
          id: "toggle-fav",
          label: favorites.has(sessionContextMenu.session.id)
            ? t('favorites.remove')
            : t('favorites.add'),
          icon: <StarIcon size={15} />,
          onAction: () => {
            onToggleFavorite(sessionContextMenu.session.id)
          }
        },
        {
          id: "rename",
          label: t('session.rename') || "Renombrar sesión",
          icon: <PencilIcon size={15} />,
          onAction: () => {
            onStartRename(sessionContextMenu.session)
          }
        },
        ...(onArchive ? [{
          id: "archive",
          label: t('detail.archive') || "Archivar sesión",
          icon: <ArchiveIcon size={15} />,
          dividerBefore: true,
          onAction: () => {
            onArchive(sessionContextMenu.session.id)
          }
        }] : []),
        {
          id: "delete",
          label: t('session.delete') || "Eliminar sesión",
          icon: <TrashIcon size={15} />,
          danger: true,
          dividerBefore: !onArchive,
          onAction: () => {
            onDelete(sessionContextMenu.session)
          }
        },
        {
          id: "copy-id",
          label: "Copiar ID",
          icon: <CopyIcon size={15} />,
          dividerBefore: true,
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
          icon: <PlusIcon size={15} />,
          onAction: () => {
            onNewSessionHere?.(projectContextMenu.dir)
          }
        },
        ...(onOpenExplorer ? [{
          id: "view-explorer",
          label: t('project.viewExplorer'),
          icon: <FolderIcon size={15} />,
          onAction: () => {
            onOpenExplorer(projectContextMenu.dir)
          }
        }] : []),
        {
          id: "reveal-explorer",
          label: t('project.revealExplorer'),
          icon: <MonitorIcon size={15} />,
          onAction: () => {
            shell.fs.reveal(projectContextMenu.dir).catch(() => {})
          }
        },
        {
          id: "toggle-favorites",
          label: projectContextMenu.sessions.length > 0 && projectContextMenu.sessions.every((s) => favorites.has(s.id))
            ? t('favorites.remove')
            : t('favorites.add'),
          icon: <StarIcon size={15} />,
          dividerBefore: true,
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
          icon: <CopyIcon size={15} />,
          dividerBefore: true,
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
    const ids = new Set(list.map((s) => s.id))

    list.forEach((s) => {
      if (s.parentID) {
        if (ids.has(s.parentID)) {
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

  const getProjectDisplay = (dir: string) => {
    const clean = dir.replace(/[/\\]+$/, "")
    const parts = clean.split(/[/\\]/)
    const name = parts[parts.length - 1] || clean
    const parent = parts.slice(0, -1).join("/")
    return { name, parent }
  }

  if (selectedProjectDir) {
    const { name: projName, parent: projParent } = getProjectDisplay(selectedProjectDir)
    return (
      <section ref={containerRef} className="panel sessions fade-in">
        <div className="section-heading project-view-heading">
          <div className="project-heading-info">
            <div className="project-heading-nav" onContextMenu={(e) => handleProjectContextMenu(e, selectedProjectDir, visibleProjectSessions)}>
              <button type="button" className="btn-link project-back-btn" onClick={() => onSelectProject(null)}>
                ← {t('sessions.title')}
              </button>
              <div className="project-heading-titles">
                <h2 className="project-heading-name">{projName}</h2>
                {projParent && <span className="project-heading-path">{projParent}</span>}
              </div>
            </div>
            <p className="subtle project-heading-count">
              <span>{t('sessions.count', { count: visibleProjectSessions.length })}</span>
            </p>
          </div>
          <div className="section-actions">
            {onNewSessionHere && (
              <button type="button" className="btn-icon btn-primary compact" onClick={() => onNewSessionHere(selectedProjectDir!)} title={t('sessions.newHere') || "New session here"} aria-label={t('sessions.newHere') || "New session here"}>
                <PlusIcon size={16} />
              </button>
            )}
            <SessionToolbar refreshing={refreshingSessions} creating={creatingSession}
              onRefresh={onRefresh} onNewSession={onNewSession} onOpenSettings={onOpenSettings}
              dataMode={dataMode} onSearchToggle={() => setSearchOpen((v) => !v)} searchOpen={searchOpen}
              selecting={selectMode} onToggleSelect={toggleSelectMode}
              {...couplingProps} />
          </div>
        </div>
        <div className={`toolbar${searchOpen || query.trim() ? " search-open" : ""}`}>
          <input name="sessionSearch" placeholder={t('sessions.searchPlaceholder')} value={query}
            onChange={(e) => onQueryChange(e.target.value)} className="search" />
        </div>
        {notices}
        {selectionBar}
        <div className="session-list">{renderSessionCards(visibleProjectSessions)}</div>
        {sessionContextMenuElement}
        {projectContextMenuElement}
      </section>
    )
  }

  return (
    <section ref={containerRef} className="panel sessions fade-in home-view">
      <div className="home-bg" aria-hidden="true">
        <img src="./img/openher-lockup.png" alt="" className="home-wordmark" />
      </div>
      <SessionToolbar refreshing={refreshingSessions} creating={creatingSession}
        onRefresh={onRefresh} onNewSession={onNewSession} onOpenSettings={onOpenSettings}
        dataMode={dataMode} onSearchToggle={() => setSearchOpen((v) => !v)} searchOpen={searchOpen}
        selecting={selectMode} onToggleSelect={toggleSelectMode}
        {...couplingProps} />
      <div className={`toolbar${searchOpen || query.trim() ? " search-open" : ""}`}>
        <input name="sessionSearch" placeholder={t('sessions.searchPlaceholder')} value={query}
          onChange={(e) => onQueryChange(e.target.value)} className="search" />
      </div>
      {notices}
      {selectionBar}

      {!selectedProjectDir && !query.trim() && (favoriteRows.length > 0 || recentRows.length > 0) && (
        <div className="quick-access">
          <div className="quick-access-tabs" role="tablist" aria-label="Acceso rápido">
            {favoriteRows.length > 0 && (
              <button type="button" className={`quick-access-tab${!collapsedSections.favorites ? " open" : ""}`}
                onClick={() => toggleSection("favorites")} aria-expanded={!collapsedSections.favorites}
                aria-controls="quick-favorites" role="tab" title={t('favorites.label')}>
                <span className="quick-access-tab-label">{t('favorites.label')}</span>
                <ChevronIcon size={10} className="quick-access-chevron" />
              </button>
            )}
            {recentRows.length > 0 && (
              <button type="button" className={`quick-access-tab${!collapsedSections.recent ? " open" : ""}`}
                onClick={() => toggleSection("recent")} aria-expanded={!collapsedSections.recent}
                aria-controls="quick-recent" role="tab" title={t('sessions.recentLabel')}>
                <span className="quick-access-tab-label">{t('sessions.recentLabel')}</span>
                <ChevronIcon size={10} className="quick-access-chevron" />
              </button>
            )}
          </div>
          {favorites.size > 0 && !collapsedSections.favorites && favoriteRows.length > 0 && (
            <div className="quick-access-list" id="quick-favorites" role="tabpanel">
              {favoriteRows.map((row) => wrapQuickRow(row, (
                <QuickAccessCard session={row.session} isFavorite
                  onOpen={onOpen} onToggleFavorite={onToggleFavorite}
                  onDragStartSession={onDragStartSession}
                  onContextMenu={handleSessionContextMenu}
                  isRenaming={renamingSessionID === row.session.id}
                  renameValue={renameValue}
                  onStartRename={onStartRename}
                  onRenameChange={onRenameChange}
                  onRenameConfirm={onRenameConfirm}
                  onRenameCancel={onRenameCancel} />
              )))}
            </div>
          )}
          {!collapsedSections.recent && (
            <div className="quick-access-list" id="quick-recent" role="tabpanel">
              {recentRows.map((row) => wrapQuickRow(row, (
                confirmingDismissId === row.session.id ? (
                  <div className="quick-access-card confirming-dismiss" onClick={() => onOpen(row.session.id, row.session.directory)} role="button" tabIndex={0}>
                    <div className="dismiss-confirm" onClick={(e) => e.stopPropagation()}>
                      <span>{t('sessions.recentDismiss')}</span>
                      <div className="dismiss-confirm-actions">
                        <button type="button" className="btn-danger compact" onClick={(e) => { e.stopPropagation(); setConfirmingDismissId(null); onDismissRecent?.(row.session.id) }}>{t('common.yes')}</button>
                        <button type="button" className="btn-secondary compact" onClick={(e) => { e.stopPropagation(); setConfirmingDismissId(null) }}>{t('common.no')}</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <QuickAccessCard session={row.session}
                    isFavorite={favorites.has(row.session.id)}
                    onOpen={onOpen} onToggleFavorite={onToggleFavorite}
                    onDismiss={(id) => setConfirmingDismissId(id)}
                    onDragStartSession={onDragStartSession}
                    onContextMenu={handleSessionContextMenu}
                    isRenaming={renamingSessionID === row.session.id}
                    renameValue={renameValue}
                    onStartRename={onStartRename}
                    onRenameChange={onRenameChange}
                    onRenameConfirm={onRenameConfirm}
                    onRenameCancel={onRenameCancel} />
                )
              )))}
            </div>
          )}
        </div>
      )}

      <div className="session-list">
        {visibleProjects.length === 0 && ['connecting', 'reconnecting'].includes(connectionState) ? (
          <div className="empty-state connection-pending">
            <LoadingIcon size={40} className="icon-empty-state" />
            <p>{t('sessions.loadingTitle')}</p>
            <p className="subtle">{t('sessions.loadingHint')}</p>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="empty-state">
            <FolderIcon size={48} className="icon-empty-state" />
            <p>{t('sessions.emptyTitle')}</p>
            <p className="subtle">{connectionState === "offline" ? t('sessions.offlineHint') : t('sessions.emptyHint')}</p>
          </div>
        ) : (
          visibleProjects.map(([dir, projectSessionsList]) => {
            const isExpanded = expandedProjects.has(dir)
            const { name: projName, parent: projParent } = getProjectDisplay(dir)
            return (
              <div key={dir} className="project-card-wrap fade-in">
                <article className={`project-card${isExpanded ? " expanded" : ""}`} role="button" tabIndex={0}
                  onClick={() => toggleProject(dir)}
                  onContextMenu={(e) => handleProjectContextMenu(e, dir, projectSessionsList)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleProject(dir) } }}>
                  <div className="project-card-header">
                    <div className="project-title-group">
                      <span className={`project-expand-icon${isExpanded ? " expanded" : ""}`} aria-hidden="true">
                        <ChevronIcon size={12} />
                      </span>
                      <FolderIcon size={14} className="project-folder-icon" />
                      <div className="project-names">
                        <strong className="project-name">{projName}</strong>
                        {projParent && <span className="project-parent-path">{projParent}</span>}
                      </div>
                    </div>
                    <div className="project-meta-actions" onClick={(e) => e.stopPropagation()}>
                      <span className="project-count-badge" title={`${projectSessionsList.length} sesiones`}>
                        {projectSessionsList.length}
                      </span>
                      {onNewSessionHere && (
                        <button
                          type="button"
                          className="btn-icon pcf-hbtn project-quick-btn"
                          title={t('project.newSession')}
                          aria-label={t('project.newSession')}
                          onClick={(e) => {
                            e.stopPropagation()
                            onNewSessionHere(dir)
                          }}
                        >
                          <PlusIcon size={12} />
                        </button>
                      )}
                    </div>
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

      {sessionContextMenuElement}
      {projectContextMenuElement}
    </section>
  )
})
