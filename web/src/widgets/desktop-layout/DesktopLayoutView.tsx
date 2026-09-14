import React, { memo } from "react"
import type { SessionView, ServerConfig, ConnectionState, DataMode, ViewType, ModelOption, ServerProfile, PromptSnippet, AgentOption, NoticeType, FeatureFlags, ChatSettings } from "../../types"
import type { ShellPanelKind } from "../../shell"
import type { ChatViewProps } from "../../components/ChatView"
import type { LanguageCode } from "../../i18n"
import { ActivityBar, type DesktopActivity } from "../activity-bar/ActivityBar"
import { DesktopSidebar } from "../sidebar/DesktopSidebar"
import { DesktopGrid } from "../desktop-grid/DesktopGrid"
import { ADEDiffPanel } from "../../components/ADEDiffPanel"
import { BrainIcon } from "../../Icons"
import { PluginSlot } from "../../plugins"
import { useT } from "../../i18n-context"
import { TitleBar } from "../titlebar/TitleBar"

const SettingsPanel = React.lazy(() => import("../../components/SettingsPanel").then((m) => ({ default: m.SettingsPanel })))
const StudioView = React.lazy(() => import("../../features/studio/StudioView").then((m) => ({ default: m.StudioView })))

export type DesktopLayoutViewProps = {
  shellRef: React.RefObject<HTMLDivElement | null>
  sidebarPrefs: { position: string; hidden: string[] }
  shellGridStyle?: React.CSSProperties
  activity: DesktopActivity
  setActivity: (act: any) => void
  sidebarCollapsed: boolean
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  tabStacks: string[][]
  desktopLayout: {
    cols: number
    rows: number
    colSizes: Array<number | null>
    rowSizes: Array<number | null>
    panelKinds: Array<ShellPanelKind | "editor">
    panelIds: string[]
    sessions: Array<string | null>
    browserTabUrls?: Record<string, string>
  }
  openBrowserAsTab: (url: string, targetPanel?: number) => void
  handleOpenKanban: () => void
  rightSidebarCollapsed: boolean
  setRightSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  setShowPluginsModal: (s: boolean) => void
  memInfo: any
  formatBytes: (bytes: number) => string
  handleOpenLearning: () => void
  view: ViewType
  handleNavigate: (v: ViewType) => void
  sessionsView: React.ReactNode
  currentActiveSession: SessionView | null
  activeSessionDir?: string
  selectedSession: SessionView | null
  explorerCwd?: string
  setExplorerCwd: (cwd: string | undefined) => void
  startSidebarResize: (e: React.PointerEvent<HTMLDivElement>) => void
  startRightSidebarResize: (e: React.PointerEvent<HTMLDivElement>) => void
  maximizedPanel: number | null
  setMaximizedPanel: (idx: number | null) => void
  sessions: SessionView[]
  busySessions: Set<string>
  config: ServerConfig | null
  dataMode: DataMode
  connectionState: ConnectionState
  baseChatProps: ChatViewProps
  fileEditorPath: string | null
  setFileEditorPath: (p: string | null) => void
  modelOptions: any[]
  providerList: any[]
  vs: any
  onSetDesktopLayout: React.Dispatch<React.SetStateAction<any>>
  setActivePanel: (idx: number) => void
  activePanel: number
  onRemoveTab: (panelIdx: number, tabIdx: number) => void
  onMoveTab: (panelIdx: number, from: number, to: number) => void
  onTransferTab: (fromPanel: number, fromIdx: number, toPanel: number, toIdx: number) => void
  onAddTerminal: (panelIdx: number) => void
  onCloseOthers: (panelIdx: number, keep: number) => void
  onCloseRight: (panelIdx: number, idx: number) => void
  onCloseLeft: (panelIdx: number, idx: number) => void
  onCloseAll: (panelIdx: number) => void
  onClosePanel: (panelIdx: number) => void
  onDockSession: (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => void
  onSettleSession: (id: string, dir: string) => Promise<void> | void
  onRefreshSessions: () => void
  onSetCommands: (cmds: any) => void
  onQueueAction: (action: any) => void
  onShellExecute: (cmd: string, sid?: string, dir?: string) => void
  onChangeAgent: (agentId: string) => void
  onOpenInThisPanel: (panelIdx: number, id: string) => void
  onSwapPanels: (a: number, b: number) => void
  onOpenFile: (file: string) => void
  onOpenConnect: () => void
  onOpenSessionDir: (dir: string) => void
  onToggleInspectTool: (tool: "picker" | "pod") => void
  onBrowserVisualPick: (url: string, el: any) => void
  onEnsureProjectSession: (directory: string) => Promise<SessionView | null>
  onSwitchTab: (panelIdx: number, tabIdx: number) => void
  desktopDiffOpen: boolean
  setDesktopDiffOpen: (o: boolean) => void
  desktopDiffData: any
  diffFiles: any[]
  setDesktopDiffWidth: (w: number) => void
  draftConfig?: ServerConfig
  setDraftConfig?: (c: ServerConfig) => void
  handleTest?: () => void
  testingConnection?: boolean
  canTestDraft?: boolean
  testAlreadyPassedForDraft?: boolean
  connectedVersion?: string
  settingsNotice?: { type: NoticeType; text: string } | null
  language?: LanguageCode
  handleLanguageChange?: (lang: LanguageCode) => void
  theme?: string
  setTheme?: (theme: "system" | "light" | "dark" | "scheduled") => void
  languageOptions?: Array<{ code: LanguageCode; label: string }>
  changeDataMode?: (mode: DataMode) => void
  selectedModelKey?: string | null
  changeModel?: (key: string, variant?: string | null) => void
  modelKey?: (model: { providerID: string; modelID: string; variant?: string }) => string
  selectedVariant?: string | null
  allPrimaryAgents?: AgentOption[]
  disabledAgents?: Record<string, boolean>
  toggleAgentEnabled?: (agentId: string) => void
  activeModelOption?: ModelOption | null
  blockedModels?: any
  setShowThemePicker?: (s: boolean) => void
  setShowThemeCreator?: (s: boolean) => void
  flags?: FeatureFlags
  toggleFlag?: (key: keyof FeatureFlags) => void
  setFlag?: <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => void
  connectingProvider?: string | null
  providerError?: string | null
  connectProvider?: (providerID: string, apiKey: string) => Promise<boolean>
  disconnectProvider?: (providerID: string) => Promise<any>
  loadModels?: (dir?: string) => Promise<any>
  serverProfiles?: ServerProfile[]
  addProfile?: (name: string, opts: { config: ServerConfig; kind?: "http" | "pair" }) => ServerProfile | null
  updateProfile?: (id: string, opts: { name: string; config: ServerConfig }) => void
  removeProfile?: (id: string) => void
  applyServerProfile?: (profile: ServerProfile) => void
  activeServerProfileID?: string | null
  setActiveServerProfileID?: (id: string | null) => void
  saveConfig?: (t: any) => void
  chatSettings?: ChatSettings
  setChatSetting?: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  resetChatSettings?: () => void
  promptSnippets?: PromptSnippet[]
  addSnippet?: (name: string, text: string) => void
  removeSnippet?: (id: string) => void
  handleShutdownHost?: () => void
  handleRestartHost?: () => void
  handleOpenGitHub?: () => void
  setShowFavoritesManager?: (s: boolean) => void
  setShowArchivedView?: (s: boolean) => void
  setShowShortcuts?: (s: boolean) => void
  setShowOpenCodeHub?: (s: boolean) => void
}

export const DesktopLayoutView = memo(function DesktopLayoutView(props: DesktopLayoutViewProps) {
  const t = useT()
  const {
    shellRef,
    sidebarPrefs,
    shellGridStyle,
    activity,
    setActivity,
    sidebarCollapsed,
    setSidebarCollapsed,
    tabStacks,
    desktopLayout,
    openBrowserAsTab,
    handleOpenKanban,
    rightSidebarCollapsed,
    setRightSidebarCollapsed,
    setShowPluginsModal,
    memInfo,
    formatBytes,
    handleOpenLearning,
    view,
    handleNavigate,
    sessionsView,
    currentActiveSession,
    activeSessionDir,
    selectedSession,
    explorerCwd,
    setExplorerCwd,
    startSidebarResize,
    startRightSidebarResize,
    maximizedPanel,
    setMaximizedPanel,
    sessions,
    busySessions,
    config,
    dataMode,
    connectionState,
    baseChatProps,
    fileEditorPath,
    setFileEditorPath,
    modelOptions,
    providerList,
    vs,
    onSetDesktopLayout,
    setActivePanel,
    activePanel,
    onRemoveTab,
    onMoveTab,
    onTransferTab,
    onAddTerminal,
    onCloseOthers,
    onCloseRight,
    onCloseLeft,
    onCloseAll,
    onClosePanel,
    onDockSession,
    onSettleSession,
    onRefreshSessions,
    onSetCommands,
    onQueueAction,
    onShellExecute,
    onChangeAgent,
    onOpenInThisPanel,
    onSwapPanels,
    onOpenFile,
    onOpenConnect,
    onOpenSessionDir,
    onToggleInspectTool,
    onBrowserVisualPick,
    onEnsureProjectSession,
    onSwitchTab,
    desktopDiffOpen,
    setDesktopDiffOpen,
    desktopDiffData,
    diffFiles,
    setDesktopDiffWidth,
    draftConfig,
    setDraftConfig,
    handleTest,
    testingConnection,
    canTestDraft,
    testAlreadyPassedForDraft,
    connectedVersion,
    settingsNotice,
    language,
    handleLanguageChange,
    theme,
    setTheme,
    languageOptions,
    changeDataMode,
    selectedModelKey,
    changeModel,
    modelKey,
    selectedVariant,
    allPrimaryAgents,
    disabledAgents,
    toggleAgentEnabled,
    activeModelOption,
    blockedModels,
    setShowThemePicker,
    setShowThemeCreator,
    flags,
    toggleFlag,
    setFlag,
    connectingProvider,
    providerError,
    connectProvider,
    disconnectProvider,
    loadModels,
    serverProfiles,
    addProfile,
    updateProfile,
    removeProfile,
    applyServerProfile,
    activeServerProfileID,
    setActiveServerProfileID,
    saveConfig,
    chatSettings,
    setChatSetting,
    resetChatSettings,
    promptSnippets,
    addSnippet,
    removeSnippet,
    handleShutdownHost,
    handleRestartHost,
    handleOpenGitHub,
    setShowFavoritesManager,
    setShowArchivedView,
    setShowShortcuts,
    setShowOpenCodeHub,
  } = props

  return (
    <>
      <TitleBar
        tabStacks={tabStacks}
        activePanel={activePanel}
        activeSessionId={desktopLayout.sessions[activePanel]}
        sessions={sessions}
        busySessions={busySessions}
        browserTabUrls={desktopLayout.browserTabUrls}
        isSplit={desktopLayout.cols * desktopLayout.rows > 1}
        onSwitchTab={onSwitchTab}
        onRemoveTab={onRemoveTab}
        onMoveTab={onMoveTab}
        onTransferTab={onTransferTab}
        onAddTerminal={onAddTerminal}
        onOpenBrowser={openBrowserAsTab}
        cols={desktopLayout.cols}
        colSizes={desktopLayout.colSizes}
        activeSessionIds={desktopLayout.sessions}
        maximizedPanel={maximizedPanel}
        setActivePanel={setActivePanel}
        onCloseOthers={onCloseOthers}
        onCloseRight={onCloseRight}
        onCloseLeft={onCloseLeft}
        onCloseAll={onCloseAll}
        onDockSession={onDockSession}
      />
      <div
        className="app-shell has-titlebar"
        data-desktop="true"
        data-navbar="header"
        ref={shellRef}
        data-sidebarpos={sidebarPrefs.position}
        data-sbhide={sidebarPrefs.hidden.length > 0 ? sidebarPrefs.hidden.join(" ") : undefined}
        style={shellGridStyle}
      >
      <ActivityBar
        activity={activity}
        setActivity={setActivity}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        tabStacks={tabStacks}
        desktopLayout={desktopLayout}
        openBrowserAsTab={openBrowserAsTab}
        handleOpenKanban={handleOpenKanban}
        setShowPluginsModal={setShowPluginsModal}
        memInfo={memInfo}
        formatBytes={formatBytes}
        handleOpenLearning={handleOpenLearning}
        view={view}
        handleNavigate={handleNavigate}
      />

      <DesktopSidebar
        activity={activity}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        sessionsView={sessionsView}
        currentActiveSession={currentActiveSession}
        activeSessionDir={activeSessionDir}
        selectedSession={selectedSession}
        explorerCwd={explorerCwd}
        sessions={sessions}
        setExplorerCwd={setExplorerCwd}
        startSidebarResize={startSidebarResize}
        onOpenFile={onOpenFile}
        onOpenBrowser={openBrowserAsTab}
      />

      <main className="app-desktop-content">
        {view === "studio" ? (
          <React.Suspense fallback={<div className="panel-loading" style={{ padding: 24, color: "var(--muted)" }}>{t("studio.loading")}</div>}>
            <StudioView
              config={config}
              dataMode={dataMode}
              connectionState={connectionState}
              busySessions={busySessions}
              baseChatProps={baseChatProps}
              vs={vs}
              onEnsureProjectSession={onEnsureProjectSession}
              onRefreshSessions={onRefreshSessions}
              onSetCommands={onSetCommands}
              onQueueAction={onQueueAction}
              onShellExecute={onShellExecute}
              onChangeAgent={onChangeAgent}
              onOpenInThisPanel={onOpenInThisPanel}
              onSwapPanels={onSwapPanels}
              onSettleSession={onSettleSession}
              onOpenFile={onOpenFile}
              onOpenConnect={onOpenConnect}
              onOpenBrowser={openBrowserAsTab}
              onToggleInspectTool={onToggleInspectTool}
              onBrowserVisualPick={onBrowserVisualPick}
            />
          </React.Suspense>
        ) : view === "settings" && draftConfig && setDraftConfig ? (
          <div className="settings-view" style={{ height: "100%", overflowY: "auto" }}>
            <React.Suspense fallback={<div className="panel-loading" style={{ padding: 24, color: "var(--muted)" }}>Cargando ajustes…</div>}>
              <SettingsPanel
                draftConfig={draftConfig}
                onChange={setDraftConfig}
                onTest={handleTest ?? (() => {})}
                testingConnection={testingConnection ?? false}
                canTestDraft={canTestDraft ?? false}
                testAlreadyPassedForDraft={testAlreadyPassedForDraft ?? false}
                connectedVersion={connectedVersion ?? ""}
                settingsNotice={settingsNotice ?? null}
                language={language ?? "es"}
                onLanguageChange={handleLanguageChange ?? (() => {})}
                theme={theme ?? "dark"}
                onThemeChange={setTheme ?? (() => {})}
                languageOptions={languageOptions ?? []}
                dataMode={dataMode}
                onDataModeChange={changeDataMode ?? (() => {})}
                onNavigate={handleNavigate}
                modelOptions={modelOptions}
                selectedModelKey={selectedModelKey ?? ""}
                onChangeModel={changeModel ?? (() => {})}
                modelKey={modelKey ?? (() => "")}
                selectedVariant={selectedVariant ?? null}
                allPrimaryAgents={allPrimaryAgents}
                disabledAgents={disabledAgents}
                onToggleAgentEnabled={toggleAgentEnabled}
                activeModelOption={activeModelOption ?? null}
                blockedModels={blockedModels}
                onOpenThemePicker={() => setShowThemePicker?.(true)}
                onOpenThemeCreator={() => setShowThemeCreator?.(true)}
                flags={flags ?? {} as any}
                onToggleFlag={toggleFlag ?? (() => {})}
                onSetFlag={setFlag ?? (() => {})}
                providers={providerList}
                connectingProvider={connectingProvider ?? null}
                providerError={providerError ?? null}
              onConnectProvider={(pid, key) => {
                connectProvider?.(pid, key).then((ok) => {
                  if (ok) loadModels?.().catch(() => undefined)
                })
              }}
              onDisconnectProvider={(pid) => {
                disconnectProvider?.(pid).then(() => loadModels?.().catch(() => undefined))
              }}
              serverProfiles={serverProfiles ?? []}
              onAddServerProfile={(name, _kind, cfg) => addProfile ? addProfile(name, { config: cfg }) : null}
              onAddPairServer={(name, cfg) => {
                const profile = addProfile ? addProfile(name, { config: cfg, kind: "pair" }) : null
                if (profile) {
                  setActiveServerProfileID?.(profile.id)
                  localStorage.setItem("openher.activeServer", profile.id)
                  setDraftConfig(cfg)
                  saveConfig?.(t)
                }
              }}
              onRemoveServerProfile={(id) => {
                removeProfile?.(id)
                if (activeServerProfileID === id) {
                  setActiveServerProfileID?.(null)
                  localStorage.removeItem("openher.activeServer")
                }
              }}
              onUpdateServerProfile={(id, name, cfg) => updateProfile?.(id, { name, config: cfg })}
              onApplyServerProfile={applyServerProfile ?? (() => {})}
              activeServerProfileID={activeServerProfileID ?? null}
              chatSettings={chatSettings ?? {} as any}
              onChatSettingChange={setChatSetting ?? (() => {})}
              onResetChatSettings={resetChatSettings ?? (() => {})}
              snippets={promptSnippets ?? []}
              onAddSnippet={addSnippet ?? (() => {})}
              onRemoveSnippet={removeSnippet ?? (() => {})}
              onShutdownHost={handleShutdownHost ?? (() => {})}
              onRestartHost={handleRestartHost ?? (() => {})}
              onOpenGitHub={handleOpenGitHub ?? (() => {})}
              onOpenFavoritesManager={() => setShowFavoritesManager?.(true)}
              onOpenArchivedView={() => setShowArchivedView?.(true)}
              onOpenShortcuts={() => setShowShortcuts?.(true)}
              onOpenOpenCodeHub={() => setShowOpenCodeHub?.(true)}
              onClose={() => handleNavigate(desktopLayout.sessions.some(Boolean) ? "detail" : "sessions")}
            />
            </React.Suspense>
          </div>
        ) : (
          <DesktopGrid
            desktopLayout={desktopLayout}
            tabStacks={tabStacks}
            activePanel={activePanel}
            maximizedPanel={maximizedPanel}
            sessions={sessions}
            busySessions={busySessions}
            config={config}
            dataMode={dataMode}
            connectionState={connectionState}
            baseChatProps={baseChatProps}
            explorerCwd={explorerCwd}
            activeSessionDir={activeSessionDir}
            selectedSessionDir={selectedSession?.directory}
            fileEditorPath={fileEditorPath}
            vs={vs}
            onSetDesktopLayout={onSetDesktopLayout}
            setActivePanel={setActivePanel}
            setMaximizedPanel={setMaximizedPanel}
            onRemoveTab={onRemoveTab}
            onMoveTab={onMoveTab}
            onTransferTab={onTransferTab}
            onAddTerminal={onAddTerminal}
            onClosePanel={onClosePanel}
            onDockSession={onDockSession}
            onSettleSession={onSettleSession}
            onRefreshSessions={onRefreshSessions}
            onSetCommands={onSetCommands}
            onQueueAction={onQueueAction}
            onShellExecute={onShellExecute}
            onChangeAgent={onChangeAgent}
            onOpenInThisPanel={onOpenInThisPanel}
            onSwapPanels={onSwapPanels}
            onOpenFile={onOpenFile}
            onOpenConnect={onOpenConnect}
            onOpenBrowser={openBrowserAsTab}
            onOpenSessionDir={onOpenSessionDir}
            onToggleInspectTool={onToggleInspectTool}
            onBrowserVisualPick={onBrowserVisualPick}
            onSwitchTab={onSwitchTab}
          />
        )}
      </main>

      <aside className={`app-desktop-sidebar app-desktop-sidebar--right${rightSidebarCollapsed ? " collapsed" : ""}`}>
        {rightSidebarCollapsed ? (
          <div className="desktop-sidebar-rail">
            <button
              type="button"
              className="btn-icon compact"
              title={t("settings.sidebar")}
              aria-label={t("settings.sidebar")}
              onClick={() => setRightSidebarCollapsed(false)}
            >
              <BrainIcon size={14} />
            </button>
          </div>
        ) : (
          <>
            <div className="desktop-sidebar-header">
              <span className="desktop-sidebar-title">{t("settings.sidebar")}</span>
              <span className="desktop-sidebar-actions">
                <button
                  type="button"
                  className="btn-icon compact"
                  title={t("desktop.collapseSidebar")}
                  aria-label={t("desktop.collapseSidebar")}
                  onClick={() => setRightSidebarCollapsed(true)}
                >
                  »
                </button>
              </span>
            </div>
            <div className="desktop-sidebar-body">
              <PluginSlot id="sidebar.right" />
            </div>
            <div
              className="desktop-sidebar-resizer desktop-sidebar-resizer--right"
              onPointerDown={startRightSidebarResize}
              title={t("desktop.resizeSidebar")}
            />
          </>
        )}
      </aside>

      {desktopDiffOpen && (
        <ADEDiffPanel
          diffs={
            desktopDiffData?.diffs ??
            (diffFiles.length > 0
              ? diffFiles.map((d: any) => ({ file: d.file, patch: "", additions: d.additions, deletions: d.deletions }))
              : [])
          }
          files={diffFiles}
          config={config ?? undefined}
          sessionID={selectedSession?.id}
          directory={selectedSession?.directory}
          initialFile={desktopDiffData?.selectedFile}
          onClose={() => setDesktopDiffOpen(false)}
          onEditFile={(file) => setFileEditorPath(file)}
          onResize={(w) => setDesktopDiffWidth(w)}
        />
      )}
    </div>
  </>
  )
})
