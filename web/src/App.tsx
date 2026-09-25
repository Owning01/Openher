import { useCallback, useState } from "react"
import { api } from "./api"
import { I18nProvider, normalizeLanguage, useT } from "./i18n-context"
import { languageOptions } from "./i18n"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { ChatView } from "./components/ChatView"
import type { LanguageCode } from "./i18n"
import { formatLimit } from "./utils"
import { STORAGE_KEYS } from "./constants"
import { ThemeVariantProvider } from "./context/themeVariant"
import { DialogProvider } from "./components/DialogProvider"
import { ToastProvider } from "./components/Toasts"
import { DesktopLayoutView } from "./widgets/desktop-layout/DesktopLayoutView"
import { MobileLayoutView } from "./pages/mobile-layout/MobileLayoutView"
import { AppModalsContainer } from "./app/AppModalsContainer"
import { AppUpdateBanner } from "./components/AppUpdateBanner"
import { SessionsViewContainer } from "./features/session/ui/SessionsViewContainer"
import { useAppController } from "./app/useAppController"
import { useToast } from "./components/Toasts"
import { useDesktopOpenDir } from "./hooks/useDesktopOpenDir"
import { DevbarHost } from "./features/devbar/DevbarHost"

function AppInner({ language, setLanguage }: { language: LanguageCode; setLanguage: (lang: LanguageCode) => void }) {
  const c = useAppController({ language, setLanguage })
  const { toast } = useToast()
  const t = useT()

  // "Abrir sesión en OpenHer aquí" (menú contextual de Windows): crea una
  // sesión de agente en la carpeta pedida y navega a ella.
  const handleDesktopOpenDir = useCallback(
    (dir: string) => {
      void c.handleCreateSession(dir).catch((err: unknown) => {
        const reason = err instanceof Error ? err.message : String(err)
        toast(`${t("desktop.openDirError")}: ${reason}`, "error")
      })
    },
    [c.handleCreateSession, t, toast]
  )
  useDesktopOpenDir(handleDesktopOpenDir)

  const sessionsView = (
    <SessionsViewContainer
      filteredProjects={c.filteredProjects}
      filteredProjectSessions={c.filteredProjectSessions}
      selectedProjectDir={c.selectedProjectDir}
      sessions={c.sessions}
      selectedID={c.selectedID}
      refreshingSessions={c.refreshingSessions}
      creatingSession={c.creatingSession}
      renamingSessionID={c.renamingSessionID}
      renameValue={c.renameValue}
      connectionState={c.connectionState}
      query={c.query}
      activeSessions={c.activeSessions}
      recentSessions={c.recentSessions}
      favorites={c.favorites}
      dataMode={c.dataMode}
      onSelectProject={c.setSelectedProjectDir}
      onQueryChange={c.setQuery}
      onRefresh={c.refreshSessionsWithIndicator}
      onNewSession={c.handleOpenNewSession}
      onOpen={c.handleOpenSession}
      onStartRename={c.startRename}
      onRenameChange={c.setRenameValue}
      /* dir de la CARD (3er arg): selectedSession?.directory era el dir del chat
         ABIERTO — renombrar otra sesión (cross-directory) fallaba en la API y,
         como setRenamingSessionID va tras el await, el input quedaba pegado. */
      onRenameConfirm={(id, title, dir) => c.renameSession(id, title, dir).then(() => true)}
      onRenameCancel={c.cancelRename}
      onDelete={c.setSessionToDelete}
      onToggleFavorite={c.toggleFavorite}
      onArchive={c.flags.sessionArchive ? (id) => {
        const s = c.sessions.find((x) => x.id === id)
        if (s) api.sendCommand(c.config, id, "/archive", "", s.directory).catch(() => {})
      } : undefined}
      onFork={(s) => c.handleCreateSession(s.directory)}
      onDismissRecent={c.dismissRecent}
      onNewSessionHere={(dir) => c.handleCreateSession(dir)}
      onOpenExplorer={c.handleOpenExplorer}
      onDragStartSession={c.handleSessionDragStart}
      onDeleteMany={c.handleDeleteMany}
      onArchiveMany={c.flags.sessionArchive ? c.handleArchiveMany : undefined}
      showNewSessionPicker={c.showNewSessionPicker}
      pickerDir={c.pickerDir}
      pickerItems={c.pickerItems}
      pickerLoading={c.pickerLoading}
      pickerError={c.pickerError}
      onBrowsePicker={c.browseNewSessionDirectory}
      onCreatePicker={async (dir) => {
        try {
          await c.handleCreateSession(dir)
        } catch (err) {
          c.setPickerError((err as Error).message)
        }
      }}
      onCreateDefaultPicker={async () => { await c.handleCreateSession("") }}
      onClosePicker={() => c.setShowNewSessionPicker(false)}
      onOpenSettings={() => c.handleNavigate("settings")}
    />
  )

  const detailView = (
    <ChatView
      {...c.baseChatProps}
      composer={c.composer}
      onComposerChange={c.handleComposerChange}
      onOpenBrowser={c.handleOpenBrowser}
    />
  )

  return (
    <>
      <AppUpdateBanner />
      <DevbarHost />
      {c.isDesktop ? (
        <DesktopLayoutView
          shellRef={c.shellRef}
          sidebarPrefs={c.sidebarPrefs}
          shellGridStyle={c.shellGridStyle}
          activity={c.activity}
          setActivity={c.setActivity}
          sidebarCollapsed={c.sidebarCollapsed}
          setSidebarCollapsed={c.setSidebarCollapsed}
          tabStacks={c.tabStacks ?? []}
          desktopLayout={c.desktopLayout}
          openBrowserAsTab={c.openBrowserAsTab}
          handleOpenKanban={c.handleOpenKanban}
          rightSidebarCollapsed={c.rightSidebarCollapsed}
          setRightSidebarCollapsed={c.setRightSidebarCollapsed}
          setShowPluginsModal={c.setShowPluginsModal}
          memInfo={c.memInfo}
          formatBytes={c.formatBytes}
          handleOpenLearning={c.handleOpenLearning}
          view={c.view}
          handleNavigate={c.handleNavigate}
          sessionsView={sessionsView}
          currentActiveSession={c.currentActiveSession}
          activeSessionDir={c.activeSessionDir}
          selectedSession={c.selectedSession}
          explorerCwd={c.fb.currentPath}
          setExplorerCwd={c.fb.open}
          startSidebarResize={c.startSidebarResize}
          startRightSidebarResize={c.startRightSidebarResize}
          maximizedPanel={c.maximizedPanel}
          setMaximizedPanel={c.setMaximizedPanel}
          sessions={c.sessions}
          busySessions={c.busySessions}
          config={c.config}
          dataMode={c.dataMode}
          connectionState={c.connectionState}
          baseChatProps={{ ...c.baseChatProps, composer: c.composer, onComposerChange: c.handleComposerChange }}
          fileEditorPath={c.fileEditorPath}
          setFileEditorPath={c.setFileEditorPath}
          modelOptions={c.modelOptions}
          providerList={c.providerList}
          vs={c.vs}
          onSetDesktopLayout={c.setDesktopLayout}
          setActivePanel={c.setActivePanel}
          activePanel={c.activePanel}
          onRemoveTab={c.removeTab}
          onMoveTab={c.moveTab}
          onTransferTab={c.transferTab}
          onAddTerminal={c.addTerminalToPanel}
          onCloseOthers={c.closeOthers}
          onCloseRight={c.closeRight}
          onCloseLeft={c.closeLeft}
          onCloseAll={c.closeAll}
          onClosePanel={c.closePanel}
          onDockSession={c.handleDockSession}
          onSettleSession={c.settleSession}
          onRefreshSessions={c.refreshSessions}
          onSetCommands={c.setCommands}
          onQueueAction={c.queueAction}
          onShellExecute={(cmd, sid, dir) => { c.shellExecute(cmd, sid || "", dir) }}
          onChangeAgent={c.changeAgent}
          onOpenInThisPanel={c.openInPanel}
          onSwapPanels={c.handleSwapPanels}
          onOpenFile={c.handleOpenFile}
          onOpenConnect={() => c.setShowConnectSheet(true)}
          onOpenSessionDir={c.openSessionInDir}
          onToggleInspectTool={c.handleToggleInspectTool}
          onBrowserVisualPick={c.handleBrowserVisualPick}
          onEnsureProjectSession={c.ensureStudioSession}
          onSwitchTab={c.switchTab}
          desktopDiffOpen={c.desktopDiffOpen}
          setDesktopDiffOpen={c.setDesktopDiffOpen}
          desktopDiffData={c.desktopDiffData}
          diffFiles={c.diffFiles}
          setDesktopDiffWidth={c.setDesktopDiffWidth}
          draftConfig={c.draftConfig}
          setDraftConfig={c.setDraftConfig}
          handleTest={c.handleTest}
          testingConnection={c.testingConnection}
          canTestDraft={c.canTestDraft}
          testAlreadyPassedForDraft={c.testAlreadyPassedForDraft}
          connectedVersion={c.connectedVersion}
          settingsNotice={c.settingsNotice}
          language={c.language}
          handleLanguageChange={c.handleLanguageChange}
          theme={c.theme}
          setTheme={c.setTheme}
          languageOptions={languageOptions}
          changeDataMode={c.changeDataMode}
          selectedModelKey={c.selectedModelKey}
          changeModel={c.changeModel}
          modelKey={c.modelKey}
          selectedVariant={c.selectedVariant}
          allPrimaryAgents={c.allPrimaryAgents}
          disabledAgents={c.disabledAgents}
          toggleAgentEnabled={c.toggleAgentEnabled}
          activeModelOption={c.activeModelOption}
          blockedModels={c.blockedModels}
          setShowThemePicker={c.setShowThemePicker}
          setShowThemeCreator={c.setShowThemeCreator}
          flags={c.flags}
          toggleFlag={c.toggleFlag}
          setFlag={c.setFlag}
          connectingProvider={c.connectingProvider}
          providerError={c.providerError}
          connectProvider={c.connectProvider}
          disconnectProvider={c.disconnectProvider}
          loadModels={c.loadModels}
          serverProfiles={c.serverProfiles}
          addProfile={c.addProfile}
          updateProfile={c.updateProfile}
          removeProfile={c.removeProfile}
          applyServerProfile={c.applyServerProfile}
          activeServerProfileID={c.activeServerProfileID}
          setActiveServerProfileID={c.setActiveServerProfileID}
          saveConfig={c.saveConfig}
          chatSettings={c.chatSettings}
          setChatSetting={c.setChatSetting}
          resetChatSettings={c.resetChatSettings}
          promptSnippets={c.promptSnippets}
          addSnippet={c.addSnippet}
          removeSnippet={c.removeSnippet}
          handleShutdownHost={c.handleShutdownHost}
          handleRestartHost={c.handleRestartHost}
          handleOpenGitHub={c.handleOpenGitHub}
          setShowFavoritesManager={c.setShowFavoritesManager}
          setShowArchivedView={c.setShowArchivedView}
          setShowShortcuts={c.setShowShortcuts}
          setShowOpenCodeHub={c.setShowOpenCodeHub}
        />
      ) : (
        <MobileLayoutView
          view={c.view}
          onNavigate={c.handleNavigate}
          onToggleLightMode={c.handleToggleLightMode}
          sessionsView={sessionsView}
          detailView={detailView}
          draftConfig={c.draftConfig}
          setDraftConfig={c.setDraftConfig}
          handleTest={c.handleTest}
          testingConnection={c.testingConnection}
          canTestDraft={c.canTestDraft}
          testAlreadyPassedForDraft={c.testAlreadyPassedForDraft}
          connectedVersion={c.connectedVersion}
          settingsNotice={c.settingsNotice}
          language={c.language}
          handleLanguageChange={c.handleLanguageChange}
          theme={c.theme}
          setTheme={c.setTheme}
          languageOptions={languageOptions}
          dataMode={c.dataMode}
          changeDataMode={c.changeDataMode}
          modelOptions={c.modelOptions}
          selectedModelKey={c.selectedModelKey}
          changeModel={c.changeModel}
          modelKey={c.modelKey}
          selectedVariant={c.selectedVariant}
          allPrimaryAgents={c.allPrimaryAgents}
          disabledAgents={c.disabledAgents}
          toggleAgentEnabled={c.toggleAgentEnabled}
          activeModelOption={c.activeModelOption}
          blockedModels={c.blockedModels}
          setShowThemePicker={c.setShowThemePicker}
          setShowThemeCreator={c.setShowThemeCreator}
          flags={c.flags}
          toggleFlag={c.toggleFlag}
          setFlag={c.setFlag}
          providerList={c.providerList}
          connectingProvider={c.connectingProvider}
          providerError={c.providerError}
          connectProvider={c.connectProvider}
          disconnectProvider={c.disconnectProvider}
          loadModels={c.loadModels}
          serverProfiles={c.serverProfiles}
          addProfile={c.addProfile}
          updateProfile={c.updateProfile}
          removeProfile={c.removeProfile}
          applyServerProfile={c.applyServerProfile}
          activeServerProfileID={c.activeServerProfileID}
          setActiveServerProfileID={c.setActiveServerProfileID}
          saveConfig={c.saveConfig}
          t={c.t}
          chatSettings={c.chatSettings}
          setChatSetting={c.setChatSetting}
          resetChatSettings={c.resetChatSettings}
          promptSnippets={c.promptSnippets}
          addSnippet={c.addSnippet}
          removeSnippet={c.removeSnippet}
          handleShutdownHost={c.handleShutdownHost}
          handleRestartHost={c.handleRestartHost}
          handleOpenGitHub={c.handleOpenGitHub}
          setShowFavoritesManager={c.setShowFavoritesManager}
          setShowArchivedView={c.setShowArchivedView}
          setShowShortcuts={c.setShowShortcuts}
          setShowOpenCodeHub={c.setShowOpenCodeHub}
          navStackLength={c.navStackRef.current.length}
          goBack={c.goBack}
          helpPage={c.helpPage}
          setHelpPage={c.setHelpPage}
          commands={c.commands}
          commandFilter={c.commandFilter}
          setCommandFilter={c.setCommandFilter}
          config={c.config}
          activeSessionDir={c.selectedSession?.directory ?? c.activeSessionDir}
        />
      )}

      <AppModalsContainer
        activeDetailSheet={c.activeDetailSheet}
        setActiveDetailSheet={c.setActiveDetailSheet}
        modelOptions={c.modelOptions}
        modelLoadError={c.modelLoadError}
        activeModelOption={c.activeModelOption}
        filteredVariantGroups={c.filteredVariantGroups}
        modelQuery={c.modelQuery}
        isWorking={c.baseChatProps.isWorking ?? false}
        changeModel={c.changeModel}
        setModelQuery={c.setModelQuery}
        selectedVariant={c.selectedVariant}
        formatLimit={formatLimit}
        projectName={c.projectName}
        projectPath={c.projectPath}
        vcsBranch={c.vcsBranch}
        projectDashboard={c.projectDashboard}
        diffFiles={c.diffFiles}
        totalDiffAdditions={c.totalDiffAdditions}
        totalDiffDeletions={c.totalDiffDeletions}
        dashboardError={c.dashboardError}
        config={c.config}
        loadModels={c.loadModels}
        selectedSession={c.selectedSession}
        sessionToDelete={c.sessionToDelete}
        setSessionToDelete={c.setSessionToDelete}
        deleteSession={c.deleteSession}
        showThemePicker={c.showThemePicker}
        setShowThemePicker={c.setShowThemePicker}
        showThemeCreator={c.showThemeCreator}
        setShowThemeCreator={c.setShowThemeCreator}
        showConnectSheet={c.showConnectSheet}
        setShowConnectSheet={c.setShowConnectSheet}
        connectProvider={c.connectProvider}
        disconnectProvider={c.disconnectProvider}
        addCustomProvider={c.addCustomProvider}
        removeProviderCredential={c.removeCredential}
        activateProviderCredential={c.activateCredential}
        showMCPBrowser={c.showMCPBrowser}
        setShowMCPBrowser={c.setShowMCPBrowser}
        showArchivedView={c.showArchivedView}
        setShowArchivedView={c.setShowArchivedView}
        sessions={c.sessions}
        handleOpenSession={c.handleOpenSession}
        fileEditorPath={c.fileEditorPath}
        setFileEditorPath={c.setFileEditorPath}
        currentActiveSession={c.currentActiveSession}
        activeSessionDir={c.activeSessionDir}
        fb={c.fb}
        isDesktop={c.isDesktop}
        shellExecute={(cmd, sid, dir) => { c.shellExecute(cmd, sid || "", dir) }}
        dataMode={c.dataMode}
        onNavigateSettings={() => c.handleNavigate("settings")}
        showShortcuts={c.showShortcuts}
        setShowShortcuts={c.setShowShortcuts}
        showFavoritesManager={c.showFavoritesManager}
        setShowFavoritesManager={c.setShowFavoritesManager}
        favorites={c.favorites}
        showOpenCodeHub={c.showOpenCodeHub}
        setShowOpenCodeHub={c.setShowOpenCodeHub}
        agentOptions={c.agentOptions}
        activeAgentID={c.activeAgentID}
        changeAgent={c.changeAgent}
        runtimeError={c.runtimeError}
        setRuntimeError={c.setRuntimeError}
        showPluginsModal={c.showPluginsModal}
        setShowPluginsModal={c.setShowPluginsModal}
        openExternalProject={c.openExternalProject}
        openPluginAsTab={c.openPluginAsTab}
      />
    </>
  )
}

export default function App() {
  const [language, setLanguage] = useState<LanguageCode>(() =>
    normalizeLanguage(localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'es')
  )
  return (
    <I18nProvider language={language}>
      <ThemeVariantProvider>
        <ErrorBoundary>
          <DialogProvider>
            <ToastProvider>
              <AppInner language={language} setLanguage={setLanguage} />
            </ToastProvider>
          </DialogProvider>
        </ErrorBoundary>
      </ThemeVariantProvider>
    </I18nProvider>
  )
}
