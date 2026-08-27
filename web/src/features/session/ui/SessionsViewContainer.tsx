import { Suspense } from "react"
import { SessionList } from "../../../components/SessionList"
import { lazyRetry } from "../../../utils/lazyRetry"
import type { SessionView, ConnectionState, DataMode } from "../../../types"

const FolderPicker = lazyRetry(() =>
  import("../../../components/FolderPicker").then((m) => ({ default: m.FolderPicker }))
)

export type SessionsViewContainerProps = {
  filteredProjects: [string, SessionView[]][]
  filteredProjectSessions: SessionView[]
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
  onQueryChange: (q: string) => void
  onRefresh: () => Promise<boolean>
  onNewSession: () => void
  onOpen: (id: string, dir: string) => Promise<void>
  onStartRename: (s: SessionView) => void
  onRenameChange: (val: string) => void
  onRenameConfirm: (id: string) => Promise<boolean>
  onRenameCancel: () => void
  onDelete: (s: SessionView) => void
  onToggleFavorite: (id: string) => void
  onArchive?: (id: string) => void
  onFork: (s: SessionView) => void
  onDismissRecent: (id: string) => void
  onNewSessionHere: (dir: string) => void
  onOpenExplorer: () => void
  onDragStartSession: (id: string, dir: string) => void
  onDeleteMany: (ids: string[]) => Promise<void>
  onArchiveMany?: (ids: string[]) => Promise<void>
  showNewSessionPicker: boolean
  pickerDir: string
  pickerItems: any[]
  pickerLoading: boolean
  pickerError: string | null
  onBrowsePicker: (path: string) => Promise<void>
  onCreatePicker: (dir: string) => Promise<void>
  onCreateDefaultPicker: () => Promise<void>
  onClosePicker: () => void
}

export function SessionsViewContainer({
  filteredProjects,
  filteredProjectSessions,
  selectedProjectDir,
  sessions,
  selectedID,
  refreshingSessions,
  creatingSession,
  renamingSessionID,
  renameValue,
  connectionState,
  query,
  activeSessions,
  recentSessions,
  favorites,
  dataMode,
  onSelectProject,
  onQueryChange,
  onRefresh,
  onNewSession,
  onOpen,
  onStartRename,
  onRenameChange,
  onRenameConfirm,
  onRenameCancel,
  onDelete,
  onToggleFavorite,
  onArchive,
  onFork,
  onDismissRecent,
  onNewSessionHere,
  onOpenExplorer,
  onDragStartSession,
  onDeleteMany,
  onArchiveMany,
  showNewSessionPicker,
  pickerDir,
  pickerItems,
  pickerLoading,
  pickerError,
  onBrowsePicker,
  onCreatePicker,
  onCreateDefaultPicker,
  onClosePicker,
}: SessionsViewContainerProps) {
  return (
    <>
      <SessionList
        projects={filteredProjects}
        projectSessions={filteredProjectSessions}
        selectedProjectDir={selectedProjectDir}
        sessions={sessions}
        selectedID={selectedID}
        refreshingSessions={refreshingSessions}
        creatingSession={creatingSession}
        renamingSessionID={renamingSessionID}
        renameValue={renameValue}
        connectionState={connectionState}
        query={query}
        activeSessions={activeSessions}
        recentSessions={recentSessions}
        favorites={favorites}
        dataMode={dataMode}
        onSelectProject={onSelectProject}
        onQueryChange={onQueryChange}
        onRefresh={onRefresh}
        onNewSession={onNewSession}
        onOpen={onOpen}
        onStartRename={onStartRename}
        onRenameChange={onRenameChange}
        onRenameConfirm={onRenameConfirm}
        onRenameCancel={onRenameCancel}
        onDelete={onDelete}
        onToggleFavorite={onToggleFavorite}
        onArchive={onArchive}
        onFork={onFork}
        onDismissRecent={onDismissRecent}
        onNewSessionHere={onNewSessionHere}
        onOpenExplorer={onOpenExplorer}
        onDragStartSession={onDragStartSession}
        onDeleteMany={onDeleteMany}
        onArchiveMany={onArchiveMany}
      />
      {showNewSessionPicker && (
        <Suspense fallback={null}>
          <FolderPicker
            pickerDir={pickerDir}
            pickerItems={pickerItems}
            pickerLoading={pickerLoading}
            pickerError={pickerError}
            creatingSession={creatingSession}
            projects={sessions.map((s) => s.directory)}
            onBrowse={onBrowsePicker}
            onCreate={onCreatePicker}
            onCreateDefault={onCreateDefaultPicker}
            onClose={onClosePicker}
          />
        </Suspense>
      )}
    </>
  )
}
