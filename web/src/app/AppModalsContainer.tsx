import { memo } from "react"
import { AppModals } from "../components/AppModals"
import { PluginsModal } from "../components/PluginsModal"
import { api } from "../api"
import type { SessionView, ServerConfig, DataMode } from "../types"
import type { ShellType } from "../hooks/useShell"

export type AppModalsContainerProps = {
  activeDetailSheet: any
  setActiveDetailSheet: (s: any) => void
  modelOptions: any[]
  modelLoadError: any
  activeModelOption: any
  filteredVariantGroups: any
  modelQuery: string
  isWorking: boolean
  changeModel: (key: string, variant?: string | null, sessionId?: string) => void
  setModelQuery: (q: string) => void
  selectedVariant: string | null
  formatLimit: any
  projectName: string | null
  projectPath: string | null
  vcsBranch: string | null
  projectDashboard: any
  diffFiles: any[]
  totalDiffAdditions: number
  totalDiffDeletions: number
  dashboardError: any
  config: ServerConfig | null
  loadModels: (dir?: string) => Promise<void>
  selectedSession: SessionView | null
  sessionToDelete: SessionView | null
  setSessionToDelete: (s: SessionView | null) => void
  deleteSession: (id: string) => Promise<void>
  showThemePicker: boolean
  setShowThemePicker: (s: boolean) => void
  showThemeCreator: boolean
  setShowThemeCreator: (s: boolean) => void
  showConnectSheet: boolean
  setShowConnectSheet: (s: boolean) => void
  connectProvider: (pid: string, key: string) => Promise<boolean>
  disconnectProvider: (pid: string) => Promise<void>
  addCustomProvider: (providerID: string, name: string, baseURL: string, models: string[]) => Promise<boolean>
  showMCPBrowser: boolean
  setShowMCPBrowser: (s: boolean) => void
  showArchivedView: boolean
  setShowArchivedView: (s: boolean) => void
  sessions: SessionView[]
  handleOpenSession: (id: string, dir: string) => void
  fileEditorPath: string | null
  setFileEditorPath: (p: string | null) => void
  currentActiveSession: SessionView | null
  activeSessionDir?: string
  fb: any
  showTerminal: boolean
  isDesktop: boolean
  terminalDocked: boolean
  shellLines: any[]
  shellRunning: boolean
  terminalShell: ShellType
  setTerminalShell: (s: ShellType) => void
  shellExecute: (cmd: string, sid?: string, dir?: string) => void
  shellClear: () => void
  setShowTerminal: React.Dispatch<React.SetStateAction<boolean>>
  shellHistory: string[]
  setTerminalDocked: (d: boolean) => void
  showRemoteDesktop: boolean
  setShowRemoteDesktop: (s: boolean) => void
  desktopCfg: any
  dataMode: DataMode
  onNavigateSettings: () => void
  showShortcuts: boolean
  setShowShortcuts: (s: boolean) => void
  showFavoritesManager: boolean
  setShowFavoritesManager: (s: boolean) => void
  favorites: Set<string>
  showOpenCodeHub: boolean
  setShowOpenCodeHub: (s: boolean) => void
  agentOptions: any[]
  activeAgentID: string | null
  changeAgent: (id: string) => void
  runtimeError: string | null
  setRuntimeError: (e: string | null) => void
  showPluginsModal: boolean
  setShowPluginsModal: (s: boolean) => void
  openExternalProject: (name: string) => void
}

export const AppModalsContainer = memo(function AppModalsContainer(props: AppModalsContainerProps) {
  const {
    activeDetailSheet,
    setActiveDetailSheet,
    modelOptions,
    modelLoadError,
    activeModelOption,
    filteredVariantGroups,
    modelQuery,
    isWorking,
    changeModel,
    setModelQuery,
    selectedVariant,
    formatLimit,
    projectName,
    projectPath,
    vcsBranch,
    projectDashboard,
    diffFiles,
    totalDiffAdditions,
    totalDiffDeletions,
    dashboardError,
    config,
    loadModels,
    selectedSession,
    sessionToDelete,
    setSessionToDelete,
    deleteSession,
    showThemePicker,
    setShowThemePicker,
    showThemeCreator,
    setShowThemeCreator,
    showConnectSheet,
    setShowConnectSheet,
    connectProvider,
    disconnectProvider,
    addCustomProvider,
    showMCPBrowser,
    setShowMCPBrowser,
    showArchivedView,
    setShowArchivedView,
    sessions,
    handleOpenSession,
    fileEditorPath,
    setFileEditorPath,
    currentActiveSession,
    activeSessionDir,
    fb,
    showTerminal,
    isDesktop,
    terminalDocked,
    shellLines,
    shellRunning,
    terminalShell,
    setTerminalShell,
    shellExecute,
    shellClear,
    setShowTerminal,
    shellHistory,
    setTerminalDocked,
    showRemoteDesktop,
    setShowRemoteDesktop,
    desktopCfg,
    dataMode,
    onNavigateSettings,
    showShortcuts,
    setShowShortcuts,
    showFavoritesManager,
    setShowFavoritesManager,
    favorites,
    showOpenCodeHub,
    setShowOpenCodeHub,
    agentOptions,
    activeAgentID,
    changeAgent,
    runtimeError,
    setRuntimeError,
    showPluginsModal,
    setShowPluginsModal,
    openExternalProject,
  } = props

  return (
    <>
      <AppModals
        activeDetailSheet={activeDetailSheet}
        onCloseDetailSheet={() => setActiveDetailSheet(null)}
        modelOptions={modelOptions}
        modelLoadError={modelLoadError}
        activeModelOption={activeModelOption}
        filteredVariantGroups={filteredVariantGroups}
        modelQuery={modelQuery}
        isWorking={isWorking}
        changeModel={(key, variant) => changeModel(key, variant, selectedSession?.id)}
        setModelQuery={setModelQuery}
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
        config={config}
        loadModels={loadModels}
        selectedSession={selectedSession}
        sessionToDelete={sessionToDelete}
        onConfirmDeleteSession={(id) => {
          deleteSession(id).catch(() => undefined)
        }}
        onCancelDeleteSession={() => setSessionToDelete(null)}
        showThemePicker={showThemePicker}
        onCloseThemePicker={() => setShowThemePicker(false)}
        showThemeCreator={showThemeCreator}
        onCloseThemeCreator={() => setShowThemeCreator(false)}
        showConnectSheet={showConnectSheet}
        onCloseConnectSheet={() => setShowConnectSheet(false)}
        connectProvider={connectProvider}
        disconnectProvider={disconnectProvider}
        addCustomProvider={addCustomProvider}
        showMCPBrowser={showMCPBrowser}
        onCloseMCPBrowser={() => setShowMCPBrowser(false)}
        showArchivedView={showArchivedView}
        onCloseArchivedView={() => setShowArchivedView(false)}
        sessions={sessions}
        onRestoreArchivedSession={(id) => {
          const s = sessions.find((x) => x.id === id)
          if (s) api.sendCommand(config!, id, "/unarchive", "", s.directory).catch(() => {})
          setShowArchivedView(false)
        }}
        onOpenSession={(id, dir) => handleOpenSession(id, dir)}
        fileEditorPath={fileEditorPath}
        onCloseFileEditor={() => setFileEditorPath(null)}
        currentActiveSession={currentActiveSession}
        activeSessionDir={activeSessionDir ?? ""}
        fb={fb}
        onOpenFileEditor={(path) => setFileEditorPath(path)}
        showTerminal={showTerminal}
        isDesktop={isDesktop}
        terminalDocked={terminalDocked}
        shellLines={shellLines}
        shellRunning={shellRunning}
        terminalShell={terminalShell}
        setTerminalShell={setTerminalShell}
        shellExecute={(cmd, sid, dir) => {
          shellExecute(cmd, sid || "", dir)
        }}
        shellClear={shellClear}
        onCloseTerminal={() => setShowTerminal(false)}
        shellHistory={shellHistory}
        setTerminalDocked={setTerminalDocked}
        showRemoteDesktop={showRemoteDesktop}
        onCloseRemoteDesktop={() => setShowRemoteDesktop(false)}
        desktopCfg={desktopCfg}
        dataMode={dataMode}
        onNavigateSettings={onNavigateSettings}
        showShortcuts={showShortcuts}
        onCloseShortcuts={() => setShowShortcuts(false)}
        showFavoritesManager={showFavoritesManager}
        onCloseFavoritesManager={() => setShowFavoritesManager(false)}
        favorites={favorites}
        showOpenCodeHub={showOpenCodeHub}
        onCloseOpenCodeHub={() => setShowOpenCodeHub(false)}
        agentOptions={agentOptions}
        activeAgentID={activeAgentID ?? ""}
        changeAgent={changeAgent}
        runtimeError={runtimeError}
        onCloseRuntimeError={() => setRuntimeError(null)}
      />
      <PluginsModal open={showPluginsModal} onClose={() => setShowPluginsModal(false)} onOpenProject={openExternalProject} />
    </>
  )
})
