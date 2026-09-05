import { Suspense, memo, lazy } from "react"
import { BottomSheet } from "./BottomSheet"
import { ConfirmModal } from "./ConfirmModal"
import { ShortcutsModal } from "./ShortcutsModal"
import { OpenCodeHubModal } from "./OpenCodeHubModal"
import { ErrorModal } from "./ErrorModal"
import { PluginSlot } from "../plugins"
import type { ServerConfig, SessionView, AgentOption, ModelOption, DataMode } from "../types"
import type { VariantGroup } from "../hooks/useAI"
import type { ShellType, ShellLine } from "../hooks/useShell"

function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((err) => {
      const hasReloaded = sessionStorage.getItem("opencode_chunk_reloaded")
      if (!hasReloaded && String(err).includes("dynamically imported module")) {
        sessionStorage.setItem("opencode_chunk_reloaded", "1")
        window.location.reload()
      }
      throw err
    }),
  )
}

const ThemePicker = lazyRetry(() => import("./ThemePicker").then((m) => ({ default: m.ThemePicker })))
const ThemeCreator = lazyRetry(() => import("./ThemeCreator").then((m) => ({ default: m.ThemeCreator })))
const ConnectProviderSheet = lazyRetry(() => import("./ConnectProviderSheet").then((m) => ({ default: m.ConnectProviderSheet })))
const MCPBrowser = lazyRetry(() => import("./MCPBrowser").then((m) => ({ default: m.MCPBrowser })))
const ArchivedList = lazyRetry(() => import("./ArchivedList").then((m) => ({ default: m.ArchivedList })))
const FileEditor = lazyRetry(() => import("./FileEditor").then((m) => ({ default: m.FileEditor })))
const FileBrowser = lazyRetry(() => import("./FileBrowser").then((m) => ({ default: m.FileBrowser })))
const TerminalView = lazyRetry(() => import("./TerminalView").then((m) => ({ default: m.TerminalView })))
const RemoteDesktop = lazyRetry(() => import("./RemoteDesktop").then((m) => ({ default: m.RemoteDesktop })))
const FavoritesManager = lazyRetry(() => import("./FavoritesManager").then((m) => ({ default: m.FavoritesManager })))

export interface AppModalsProps {
  activeDetailSheet: "ai" | "details" | null
  onCloseDetailSheet: () => void
  modelOptions: ModelOption[]
  modelLoadError: string | null
  activeModelOption: ModelOption | null
  filteredVariantGroups: { recentModels: ModelOption[]; groups: Map<string, VariantGroup> }
  modelQuery: string
  isWorking: boolean
  changeModel: (key: string, variant?: string | null) => void
  setModelQuery: (q: string) => void
  selectedVariant: string | null
  formatLimit: (value?: number) => string
  projectName: string | null
  projectPath: string | null
  vcsBranch: string | null
  projectDashboard: { vcs?: { ahead?: number; behind?: number } | null } | null
  diffFiles: Array<{ file: string; additions: number; deletions: number }>
  totalDiffAdditions: number
  totalDiffDeletions: number
  dashboardError: string | null
  config: ServerConfig | null
  loadModels: (directory?: string) => Promise<void>
  selectedSession: SessionView | null

  sessionToDelete: SessionView | null
  onConfirmDeleteSession: (id: string) => void
  onCancelDeleteSession: () => void

  showThemePicker: boolean
  onCloseThemePicker: () => void

  showThemeCreator: boolean
  onCloseThemeCreator: () => void

  showConnectSheet: boolean
  onCloseConnectSheet: () => void
  connectProvider: (pid: string, key: string) => Promise<boolean>
  disconnectProvider: (pid: string) => Promise<void>
  addCustomProvider: (providerID: string, name: string, baseURL: string, models: string[]) => Promise<boolean>

  showMCPBrowser: boolean
  onCloseMCPBrowser: () => void

  showArchivedView: boolean
  onCloseArchivedView: () => void
  sessions: SessionView[]
  onRestoreArchivedSession: (id: string) => void
  onOpenSession: (id: string, dir: string) => void

  fileEditorPath: string | null
  onCloseFileEditor: () => void
  currentActiveSession: SessionView | null
  activeSessionDir: string

  fb: {
    isOpen: boolean
    currentPath: string
    items: any[]
    loading: boolean
    error: string | null
    close: () => void
    navigateTo: (path: string) => void
    goUp: () => void
  }
  onOpenFileEditor: (path: string) => void

  showTerminal: boolean
  isDesktop: boolean
  terminalDocked: boolean
  shellLines: ShellLine[]
  shellRunning: boolean
  terminalShell: ShellType
  setTerminalShell: (s: ShellType) => void
  shellExecute: (cmd: string, sid?: string, dir?: string) => void
  shellClear: () => void
  onCloseTerminal: () => void
  shellHistory: string[]
  setTerminalDocked: (docked: boolean) => void

  showRemoteDesktop: boolean
  onCloseRemoteDesktop: () => void
  desktopCfg: any
  dataMode: DataMode
  onNavigateSettings: () => void

  showShortcuts: boolean
  onCloseShortcuts: () => void

  showFavoritesManager: boolean
  onCloseFavoritesManager: () => void
  favorites: Set<string>

  showOpenCodeHub: boolean
  onCloseOpenCodeHub: () => void
  agentOptions: AgentOption[]
  activeAgentID: string
  changeAgent: (id: string, dir?: string) => void

  runtimeError: string | null
  onCloseRuntimeError: () => void
}

export const AppModals = memo(function AppModals(props: AppModalsProps) {
  const {
    activeDetailSheet, onCloseDetailSheet, modelOptions, modelLoadError, activeModelOption,
    filteredVariantGroups, modelQuery, isWorking, changeModel, setModelQuery, selectedVariant,
    formatLimit, projectName, projectPath, vcsBranch, projectDashboard, diffFiles,
    totalDiffAdditions, totalDiffDeletions, dashboardError, config, loadModels, selectedSession,
    sessionToDelete, onConfirmDeleteSession, onCancelDeleteSession,
    showThemePicker, onCloseThemePicker, showThemeCreator, onCloseThemeCreator,
    showConnectSheet, onCloseConnectSheet, connectProvider, disconnectProvider, addCustomProvider,
    showMCPBrowser, onCloseMCPBrowser,
    showArchivedView, onCloseArchivedView, sessions, onRestoreArchivedSession, onOpenSession,
    fileEditorPath, onCloseFileEditor, currentActiveSession, activeSessionDir,
    fb, onOpenFileEditor,
    showTerminal, isDesktop, terminalDocked, shellLines, shellRunning, terminalShell,
    setTerminalShell, shellExecute, shellClear, onCloseTerminal, shellHistory, setTerminalDocked,
    showRemoteDesktop, onCloseRemoteDesktop, desktopCfg, dataMode, onNavigateSettings,
    showShortcuts, onCloseShortcuts,
    showFavoritesManager, onCloseFavoritesManager, favorites,
    showOpenCodeHub, onCloseOpenCodeHub, agentOptions, activeAgentID, changeAgent,
    runtimeError, onCloseRuntimeError,
  } = props

  return (
    <>
      <BottomSheet
        activeSheet={activeDetailSheet}
        onClose={onCloseDetailSheet}
        modelOptions={modelOptions}
        modelLoadError={modelLoadError}
        activeModelOption={activeModelOption}
        variantGroups={filteredVariantGroups}
        modelQuery={modelQuery}
        isWorking={isWorking}
        onChangeModel={(key, variant) => changeModel(key, variant)}
        onModelQueryChange={setModelQuery}
        selectedVariant={selectedVariant}
        formatLimit={formatLimit}
        projectName={projectName}
        projectPath={projectPath}
        vcsBranch={vcsBranch}
        projectDashboard={projectDashboard}
        diffFiles={diffFiles}
        totalDiffAdditions={totalDiffAdditions}
        totalDiffDeletions={totalDiffDeletions}
        dashboardError={dashboardError}
        config={config ?? undefined}
        onVariantsChanged={() => loadModels(selectedSession?.directory).catch(() => undefined)}
      />

      {sessionToDelete && (
        <ConfirmModal
          session={sessionToDelete}
          onConfirm={onConfirmDeleteSession}
          onCancel={onCancelDeleteSession}
        />
      )}

      {showThemePicker && (
        <Suspense fallback={null}>
          <ThemePicker onClose={onCloseThemePicker} />
        </Suspense>
      )}

      {showConnectSheet && config && (
        <Suspense fallback={null}>
          <ConnectProviderSheet
            config={config}
            onClose={onCloseConnectSheet}
            onConnect={connectProvider}
            onDisconnect={disconnectProvider}
            onAddCustom={addCustomProvider}
            onConnected={() => loadModels().catch(() => undefined)}
          />
        </Suspense>
      )}

      {showMCPBrowser && config && (
        <Suspense fallback={null}>
          <MCPBrowser config={config} directory={currentActiveSession?.directory ?? activeSessionDir} onClose={onCloseMCPBrowser} />
        </Suspense>
      )}

      {showArchivedView && (
        <Suspense fallback={null}>
          <ArchivedList
            sessions={sessions.filter((s) => s.status === "archived")}
            onRestore={onRestoreArchivedSession}
            onOpen={(id, dir) => {
              onCloseArchivedView()
              onOpenSession(id, dir)
            }}
            onClose={onCloseArchivedView}
          />
        </Suspense>
      )}

      {fileEditorPath && config && (
        <Suspense fallback={null}>
          <FileEditor
            config={config}
            path={fileEditorPath}
            directory={currentActiveSession?.directory || activeSessionDir || selectedSession?.directory}
            onClose={onCloseFileEditor}
          />
        </Suspense>
      )}

      {fb.isOpen && (
        <Suspense fallback={null}>
          <FileBrowser
            config={config ?? undefined}
            directory={currentActiveSession?.directory || activeSessionDir || selectedSession?.directory}
            currentPath={fb.currentPath}
            items={fb.items}
            loading={fb.loading}
            error={fb.error}
            onClose={fb.close}
            onNavigate={fb.navigateTo}
            onGoUp={fb.goUp}
            onOpenFile={onOpenFileEditor}
          />
        </Suspense>
      )}

      {showTerminal && (!isDesktop || !terminalDocked) && (
        <Suspense fallback={null}>
          <TerminalView
            lines={shellLines}
            running={shellRunning}
            sessionID={currentActiveSession?.id || selectedSession?.id || ""}
            directory={activeSessionDir || selectedSession?.directory || ""}
            shell={terminalShell}
            onShellChange={setTerminalShell}
            onExecute={(cmd) => shellExecute(cmd, currentActiveSession?.id || selectedSession?.id || "", activeSessionDir || selectedSession?.directory || "")}
            onClear={shellClear}
            onClose={onCloseTerminal}
            history={shellHistory}
            isDocked={false}
            onToggleDock={() => setTerminalDocked(true)}
          />
        </Suspense>
      )}

      {showRemoteDesktop && (
        <Suspense fallback={null}>
          <RemoteDesktop
            config={desktopCfg}
            dataMode={dataMode}
            onClose={onCloseRemoteDesktop}
            onOpenSettings={onNavigateSettings}
          />
        </Suspense>
      )}

      {showShortcuts && (
        <ShortcutsModal onClose={onCloseShortcuts} desktop={isDesktop} />
      )}

      <Suspense fallback={null}>
        {showThemeCreator && <ThemeCreator onClose={onCloseThemeCreator} />}
      </Suspense>

      <Suspense fallback={null}>
        {showFavoritesManager && (
          <FavoritesManager
            favorites={sessions.filter((s) => favorites.has(s.id))}
            onReorder={(ids) => {
              try {
                localStorage.setItem("openher.favoritesOrder", JSON.stringify(ids))
              } catch {}
            }}
            onClose={onCloseFavoritesManager}
          />
        )}
      </Suspense>

      <OpenCodeHubModal
        isOpen={showOpenCodeHub}
        onClose={onCloseOpenCodeHub}
        agents={agentOptions}
        activeAgentID={activeAgentID}
        onSelectAgent={(id) => changeAgent(id, selectedSession?.directory)}
        serverConfig={config ?? undefined}
      />

      {runtimeError && (
        <ErrorModal message={runtimeError} onClose={onCloseRuntimeError} />
      )}

      <PluginSlot id="shell.overlay" />
    </>
  )
})
