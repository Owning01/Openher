import React, { Suspense, memo } from "react"
import type { ViewType, ServerConfig, FeatureFlags, ChatSettings, AgentOption, PromptSnippet, ServerProfile, ProviderInfo } from "../../types"
import type { LanguageCode } from "../../i18n"
import { NavBar } from "../../components/NavBar"
import { SessionsPage } from "../sessions/SessionsPage"
import { DetailPage } from "../detail/DetailPage"
import { SettingsPanel } from "../../components/SettingsPanel"
import { lazyRetry } from "../../utils/lazyRetry"

const HelpPage = lazyRetry(() => import("../../components/HelpPage").then((m) => ({ default: m.HelpPage })))
const QuickChatPanel = lazyRetry(() => import("../../components/QuickChatPanel").then((m) => ({ default: m.QuickChatPanel })))
const LearningPage = lazyRetry(() => import("../../features/learning/LearningPage").then((m) => ({ default: m.default })))
const PCFilesPanel = lazyRetry(() => import("../../features/pc-files/PCFilesPanel").then((m) => ({ default: m.PCFilesPanel })))

export type MobileLayoutViewProps = {
  view: ViewType
  onNavigate: (view: ViewType) => void
  onToggleLightMode: () => void
  sessionsView: React.ReactNode
  detailView: React.ReactNode
  // Settings Panel props
  draftConfig: ServerConfig
  setDraftConfig: (cfg: ServerConfig) => void
  handleTest: () => void
  testingConnection: boolean
  canTestDraft: boolean
  testAlreadyPassedForDraft: boolean
  connectedVersion: string | null
  settingsNotice: any
  language: LanguageCode
  handleLanguageChange: (lang: LanguageCode) => void
  theme: string
  setTheme: (theme: any) => void
  languageOptions: Array<{ code: LanguageCode; label: string }>
  dataMode: any
  changeDataMode: (mode: any) => void
  modelOptions: any[]
  selectedModelKey: string | null
  changeModel: (key: string, variant?: string | null) => void
  modelKey: (m: any) => string
  selectedVariant: string | null
  allPrimaryAgents: AgentOption[]
  disabledAgents: Record<string, boolean>
  toggleAgentEnabled: (agentId: string) => void
  stats: any
  resetStats: () => void
  activeModelOption: any
  blockedModels: any
  setShowThemePicker: (s: boolean) => void
  setShowThemeCreator: (s: boolean) => void
  flags: FeatureFlags
  toggleFlag: (flag: keyof FeatureFlags) => void
  setFlag: <K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) => void
  providerList: ProviderInfo[]
  connectingProvider: string | null
  providerError: string | null
  connectProvider: (pid: string, key: string) => Promise<boolean>
  disconnectProvider: (pid: string) => Promise<void>
  loadModels: () => Promise<void>
  serverProfiles: ServerProfile[]
  addProfile: (name: string, p: any) => any
  updateProfile: (id: string, p: any) => void
  removeProfile: (id: string) => void
  applyServerProfile: (p: any) => void
  activeServerProfileID: string | null
  setActiveServerProfileID: (id: string | null) => void
  saveConfig: (t: any) => void
  t: (k: string) => string
  chatSettings: ChatSettings
  setChatSetting: <K extends keyof ChatSettings>(key: K, value: ChatSettings[K]) => void
  resetChatSettings: () => void
  promptSnippets: PromptSnippet[]
  addSnippet: (name: string, text: string) => void
  removeSnippet: (id: string) => void
  handleShutdownHost: () => void
  handleRestartHost: () => void
  handleOpenGitHub: () => void
  setShowFavoritesManager: (s: boolean) => void
  setShowArchivedView: (s: boolean) => void
  setShowShortcuts: (s: boolean) => void
  setShowOpenCodeHub: (s: boolean) => void
  navStackLength: number
  goBack: () => void
  // Help Page props
  helpPage: any
  setHelpPage: (p: any) => void
  commands: any[]
  commandFilter: any
  setCommandFilter: (f: any) => void
  // QuickChat props
  quickChatKeys: { cerebras: string; groq: string; go: string; custom: string; customUrl: string }
  config: any
}

export const MobileLayoutView = memo(function MobileLayoutView(props: MobileLayoutViewProps) {
  const {
    view,
    onNavigate,
    onToggleLightMode,
    sessionsView,
    detailView,
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
    dataMode,
    changeDataMode,
    modelOptions,
    selectedModelKey,
    changeModel,
    modelKey,
    selectedVariant,
    allPrimaryAgents,
    disabledAgents,
    toggleAgentEnabled,
    stats,
    resetStats,
    activeModelOption,
    blockedModels,
    setShowThemePicker,
    setShowThemeCreator,
    flags,
    toggleFlag,
    setFlag,
    providerList,
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
    t,
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
    navStackLength,
    goBack,
    helpPage,
    setHelpPage,
    commands,
    commandFilter,
    setCommandFilter,
    quickChatKeys,
    config,
  } = props

  return (
    <div className="app-shell" data-navbar="header">
      {view !== "detail" && (
        <NavBar variant="top" view={view} onNavigate={onNavigate} onToggleLightMode={onToggleLightMode} />
      )}

      <main className="app-mobile-content">
        {view === "sessions" && <SessionsPage>{sessionsView}</SessionsPage>}
        {view === "detail" && <DetailPage>{detailView}</DetailPage>}

        {view === "settings" && (
          <div className="settings-view">
            <SettingsPanel
              draftConfig={draftConfig}
              onChange={setDraftConfig}
              onTest={handleTest}
              testingConnection={testingConnection}
              canTestDraft={canTestDraft}
              testAlreadyPassedForDraft={testAlreadyPassedForDraft}
              connectedVersion={connectedVersion ?? ""}
              settingsNotice={settingsNotice}
              language={language}
              onLanguageChange={handleLanguageChange}
              theme={theme}
              onThemeChange={setTheme}
              languageOptions={languageOptions}
              dataMode={dataMode}
              onDataModeChange={changeDataMode}
              onNavigate={onNavigate}
              modelOptions={modelOptions}
              selectedModelKey={selectedModelKey ?? ""}
              onChangeModel={changeModel}
              modelKey={modelKey}
              selectedVariant={selectedVariant}
              allPrimaryAgents={allPrimaryAgents}
              disabledAgents={disabledAgents}
              onToggleAgentEnabled={toggleAgentEnabled}
              stats={stats}
              onResetStats={resetStats}
              activeModelOption={activeModelOption}
              blockedModels={blockedModels}
              onOpenThemePicker={() => setShowThemePicker(true)}
              onOpenThemeCreator={() => setShowThemeCreator(true)}
              flags={flags}
              onToggleFlag={toggleFlag}
              onSetFlag={setFlag}
              providers={providerList}
              connectingProvider={connectingProvider}
              providerError={providerError}
              onConnectProvider={(pid, key) => {
                connectProvider(pid, key).then((ok) => {
                  if (ok) loadModels().catch(() => undefined)
                })
              }}
              onDisconnectProvider={(pid) => {
                disconnectProvider(pid).then(() => loadModels().catch(() => undefined))
              }}
              serverProfiles={serverProfiles}
              onAddServerProfile={(name, _kind, cfg) => addProfile(name, { config: cfg })}
              onAddPairServer={(name, cfg) => {
                const profile = addProfile(name, { config: cfg, kind: "pair" })
                if (profile) {
                  setActiveServerProfileID(profile.id)
                  localStorage.setItem("opencode.mobile.activeServer", profile.id)
                  setDraftConfig(cfg)
                  saveConfig(t)
                }
              }}
              onRemoveServerProfile={(id) => {
                removeProfile(id)
                if (activeServerProfileID === id) {
                  setActiveServerProfileID(null)
                  localStorage.removeItem("opencode.mobile.activeServer")
                }
              }}
              onUpdateServerProfile={(id, name, cfg) => updateProfile(id, { name, config: cfg })}
              onApplyServerProfile={applyServerProfile}
              activeServerProfileID={activeServerProfileID}
              chatSettings={chatSettings}
              onChatSettingChange={setChatSetting}
              onResetChatSettings={resetChatSettings}
              snippets={promptSnippets}
              onAddSnippet={addSnippet}
              onRemoveSnippet={removeSnippet}
              onShutdownHost={handleShutdownHost}
              onRestartHost={handleRestartHost}
              onOpenGitHub={handleOpenGitHub}
              onOpenFavoritesManager={() => setShowFavoritesManager(true)}
              onOpenArchivedView={() => setShowArchivedView(true)}
              onOpenShortcuts={() => setShowShortcuts(true)}
              onOpenOpenCodeHub={() => setShowOpenCodeHub(true)}
              onClose={() => {
                if (navStackLength > 0) goBack()
                else onNavigate("sessions")
              }}
            />
          </div>
        )}

        {view === "help" && (
          <div className="help-view">
            <Suspense fallback={null}>
              <HelpPage
                helpPage={helpPage}
                onHelpPageChange={setHelpPage}
                commands={commands}
                commandFilter={commandFilter}
                onCommandFilterChange={setCommandFilter}
              />
            </Suspense>
          </div>
        )}

        {view === "quickchat" && (
          <div className="quickchat-view" style={{ height: "calc(100dvh - 56px)", display: "flex", flexDirection: "column" }}>
            <Suspense fallback={null}>
              <QuickChatPanel
                cerebrasKey={quickChatKeys.cerebras}
                groqKey={quickChatKeys.groq}
                goKey={quickChatKeys.go}
                customKey={quickChatKeys.custom}
                customUrl={quickChatKeys.customUrl}
                config={config}
                modelOptions={modelOptions}
                providers={providerList}
                onOpenSettings={() => onNavigate("settings")}
              />
            </Suspense>
          </div>
        )}

        {view === "learning" && (
          <div className="learning-view" style={{ height: "calc(100dvh - 56px)", display: "flex", flexDirection: "column" }}>
            <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando aprendizaje…</div>}>
              <LearningPage />
            </Suspense>
          </div>
        )}

        {view === "pcFiles" && (
          <div className="pcf-view" style={{ height: "calc(100dvh - 56px)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <Suspense fallback={<div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando archivos…</div>}>
              <PCFilesPanel />
            </Suspense>
          </div>
        )}
      </main>
    </div>
  )
})
