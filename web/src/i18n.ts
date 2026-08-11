export type LanguageCode = 'en' | 'es' | 'it' | 'zh-TW'

type TranslationKey =
  | 'app.title'
  | 'app.exitTitle'
  | 'app.exitMessage'
  | 'app.exitOk'
  | 'app.exitCancel'
  | 'error.title'
  | 'error.close'
  | 'nav.settings'
  | 'nav.sessions'
  | 'nav.detail'
  | 'nav.help'
  | 'nav.stats'
  | 'nav.lightMode'
  | 'nav.darkMode'
  | 'composer.inputLabel'
  | 'composer.send'
  | 'composer.stop'
  | 'settings.serverStats'
  | 'stats.title'
  | 'stats.refresh'
  | 'stats.loading'
  | 'stats.error'
  | 'stats.empty'
  | 'stats.metaLine'
  | 'stats.filterSince'
  | 'stats.filterUntil'
  | 'stats.filterModel'
  | 'stats.apply'
  | 'stats.port'
  | 'stats.portHint'
  | 'stats.cost'
  | 'stats.estCost'
  | 'stats.mostExpensive'
  | 'stats.mostTokens'
  | 'stats.avgInput'
  | 'stats.costPerDay'
  | 'stats.costPerModel'
  | 'stats.prices'
  | 'stats.tabOverview'
  | 'stats.tabModel'
  | 'stats.tabProject'
  | 'stats.tabDay'
  | 'stats.tabMonth'
  | 'stats.tabSessions'
  | 'stats.tabLimits'
  | 'stats.setupTitle'
  | 'stats.setupHint'
  | 'stats.setupCopy'
  | 'stats.setupCopied'
  | 'menu.title'
  | 'menu.settingsDescription'
  | 'menu.sessionsDescription'
  | 'menu.detailDescription'
  | 'menu.helpDescription'
  | 'settings.title'
  | 'settings.host'
  | 'settings.hostPlaceholder'
  | 'settings.port'
  | 'settings.username'
  | 'settings.password'
  | 'settings.passwordPlaceholder'
  | 'settings.save'
  | 'settings.saving'
  | 'settings.test'
  | 'settings.testing'
  | 'settings.testingConnection'
  | 'settings.saved'
  | 'settings.savedNotTested'
  | 'settings.connectedSaved'
  | 'settings.connectionFailed'
  | 'settings.connectedTo'
  | 'settings.language'
  | 'settings.theme'
  | 'settings.themeScheduled'
  | 'settings.themeSystem'
  | 'settings.themeLight'
  | 'settings.themeDark'
  | 'settings.draftHint'
  | 'settings.testedNotSaved'
  | 'settings.savedButton'
  | 'settings.sectionServer'
  | 'settings.sectionServers'
  | 'settings.sectionServersDesc'
  | 'settings.serverActive'
  | 'settings.serverApplied'
  | 'settings.serverNamePlaceholder'
  | 'settings.serverName'
  | 'settings.editServer'
  | 'settings.saveAndApply'
  | 'settings.serverRemove'
  | 'settings.serverAdd'
  | 'settings.serverAddAndConnect'
  | 'settings.serverConnectedTo'
  | 'settings.serverNoActive'
  | 'settings.serverUntitled'
  | 'settings.serverNotConfigured'
  | 'settings.serverUse'
  | 'settings.pairTitle'
  | 'settings.pairDesc'
  | 'settings.pairScanQr'
  | 'settings.pairPaste'
  | 'settings.pairPasteHint'
  | 'settings.pairParse'
  | 'settings.pairParsed'
  | 'settings.pairParseError'
  | 'settings.pairCameraUnavailable'
  | 'settings.pairSave'
  | 'settings.pairNamePlaceholder'
  | 'settings.pairKind'
  | 'settings.apiVersion'
  | 'settings.apiVersionDesc'
  | 'settings.apiVersionAuto'
  | 'settings.apiVersionV1'
  | 'settings.apiVersionV2'
  | 'settings.sectionPreferences'
  | 'settings.dataModeTitle'
  | 'settings.dataModeDesc'
  | 'settings.modeFullDesc'
  | 'settings.modeSaver'
  | 'settings.modeSaverDesc'
  | 'settings.modeUltra'
  | 'settings.modeUltraDesc'
  | 'settings.modeMiser'
  | 'settings.modeMiserDesc'
  | 'settings.visualTheme'
  | 'settings.switchTheme'
  | 'detail.copySelection'
  | 'settings.testOk'
  | 'settings.testNeedsFields'
  | 'settings.testAlreadyPassed'
  | 'settings.readyToTest'
  | 'settings.unsavedChanges'
  | 'settings.noUnsavedChanges'
  | 'settings.defaultModel'
  | 'settings.selectModel'
  | 'settings.stats'
  | 'settings.statsPrompts'
  | 'settings.statsSessions'
  | 'settings.statsTokens'
  | 'settings.resetStats'
  | 'connection.connecting'
  | 'connection.loadingSessions'
  | 'connection.refreshing'
  | 'connection.reconnecting'
  | 'connection.connected'
  | 'connection.offline'
  | 'sessions.loadingTitle'
  | 'sessions.loadingHint'
  | 'sessions.offlineHint'
  | 'sessions.title'
  | 'sessions.new'
  | 'sessions.creating'
  | 'sessions.refresh'
  | 'sessions.projectDirectoryLabel'
  | 'sessions.projectDirectoryPlaceholder'
  | 'sessions.projectDirectoryActive'
  | 'sessions.projectDirectoryDefault'
  | 'sessions.newSessionTitle'
  | 'sessions.useServerDefault'
  | 'sessions.useThisFolder'
  | 'sessions.parentFolder'
  | 'sessions.folderPickerLoading'
  | 'sessions.folderPickerEmpty'
  | 'sessions.projectDirectoryInvalid'
  | 'sessions.searchPlaceholder'
  | 'sessions.newHere'
  | 'sessions.selectOne'
  | 'sessions.emptyTitle'
  | 'sessions.emptyHint'
  | 'sessions.noFileChanges'
  | 'sessions.updated'
  | 'sessions.open'
  | 'sessions.delete'
  | 'sessions.activeLabel'
  | 'sessions.recentLabel'
  | 'layout.single'
  | 'layout.twoCol'
  | 'layout.twoRow'
  | 'layout.threeCol'
  | 'layout.grid2x2'
  | 'panel.splitRight'
  | 'panel.splitBottom'
  | 'panel.close'
  | 'panel.maximize'
  | 'panel.restore'
  | 'panel.busy'
  | 'desktop.collapseSidebar'
  | 'desktop.expandSidebar'
  | 'desktop.resizeSidebar'
  | 'chat.scrollToBottom'
  | 'shortcuts.desktop'
  | 'shortcuts.panelFocus'
  | 'shortcuts.closeSplit'
  | 'shortcuts.splitRight'
  | 'shortcuts.splitBottom'
  | 'shortcuts.maximize'
  | 'shortcuts.toggleSidebar'
  | 'shortcuts.newSession'
  | 'shortcuts.shortcut'
  | 'shortcuts.action'
  | 'detail.backToSessions'
  | 'detail.selectSession'
  | 'detail.loading'
  | 'detail.emptyTitle'
  | 'detail.emptyHint'
  | 'detail.waiting'
  | 'detail.send'
  | 'detail.abort'
  | 'detail.jumpToLatest'
  | 'detail.you'
  | 'detail.opencode'
  | 'detail.projectDashboardLabel'
  | 'detail.projectLabel'
  | 'detail.vcsLabel'
  | 'detail.loadingProject'
  | 'detail.unavailable'
  | 'detail.aheadBehind'
  | 'detail.fileStatusLabel'
  | 'detail.fileStatusSource'
  | 'detail.dashboardError'
  | 'detail.changedFilesTitle'
  | 'detail.changedFilesHint'
  | 'detail.filesCount'
  | 'detail.miniDiffAria'
  | 'detail.linesAddedDeleted'
  | 'detail.modelPanelLabel'
  | 'detail.aiTitle'
  | 'detail.refreshAi'
  | 'detail.agentTitle'
  | 'detail.agentSelectLabel'
  | 'detail.agentLoading'
  | 'detail.agentLoadError'
  | 'detail.agentMode'
  | 'detail.modelTitle'
  | 'detail.modelHint'
  | 'detail.refreshModels'
  | 'detail.modelSelectLabel'
  | 'detail.thought'
  | 'detail.thinking'
  | 'detail.modelSearchPlaceholder'
  | 'detail.modelSearchEmpty'
  | 'detail.modelDefault'
  | 'detail.modelRecent'
  | 'detail.thought'
  | 'detail.modelAll'
  | 'detail.modelProvider'
  | 'detail.modelContext'
  | 'detail.modelToolsYes'
  | 'detail.modelToolsNo'
  | 'detail.modelVariant'
  | 'detail.thinkingLevel'
  | 'detail.thinkingNone'
  | 'detail.thinkingHigh'
  | 'detail.thinkingMedium'
  | 'detail.thinkingLow'
  | 'detail.changeModel'
  | 'detail.noThinkingLevels'
  | 'detail.modelLoading'
  | 'detail.modelLoadError'
  | 'detail.contextStripLabel'
  | 'detail.aiChip'
  | 'detail.filesChip'
  | 'detail.detailsChip'
  | 'detail.sessionDetailsTitle'
  | 'detail.sessionDetailsHint'
  | 'detail.closeSheet'
  | 'todo.title'
  | 'todo.hide'
  | 'todo.show'
  | 'todo.more'
  | 'diff.filesModified'
  | 'toolpart.wrote'
  | 'toolpart.edited'
  | 'toolpart.patched'
  | 'toolpart.subagent'
  | 'toolpart.viewSubagent'
  | 'session.deleteTitle'
  | 'session.deleteBodyPrefix'
  | 'session.cancel'
  | 'session.deleteConfirm'
  | 'session.renameTitle'
  | 'session.renamePlaceholder'
  | 'session.renameConfirm'
  | 'help.title'
  | 'help.overview'
  | 'help.server'
  | 'help.network'
  | 'help.troubleshooting'
  | 'help.commands'
  | 'help.overview.content'
  | 'help.server.content'
  | 'help.network.content'
  | 'help.troubleshooting.content'
  | 'help.commands.content'
  | 'help.commands.serverTab'
  | 'help.commands.skillsTab'
  | 'help.commands.empty'
  | 'help.commands.emptyConnected'
  | 'detail.exportChat'
  | 'detail.snapshot'
  | 'detail.readingModeOn'
  | 'detail.readingModeOff'
  | 'detail.undo'
  | 'detail.redo'
  | 'detail.redoShort'
  | 'detail.compact'
  | 'detail.reverted'
  | 'detail.revertToHere'
  | 'settings.mode'
  | 'voice.input'
  | 'voice.listening'
  | 'voice.permissionDenied'
  | 'voice.unavailable'
  | 'desktop.title'
  | 'desktop.fullScreen'
  | 'desktop.monitor'
  | 'desktop.source'
  | 'desktop.connecting'
  | 'desktop.error'
  | 'desktop.data'
  | 'desktop.dragMode'
  | 'desktop.fit'
  | 'desktop.zoomIn'
  | 'desktop.zoomOut'
  | 'desktop.quality'
  | 'desktop.preset_low'
  | 'desktop.preset_med'
  | 'desktop.preset_high'
  | 'desktop.keyboard'
  | 'desktop.kbPlaceholder'
  | 'desktop.cancel'
  | 'desktop.retry'
  | 'desktop.oneToOne'
  | 'desktop.scrollMode'
  | 'desktop.mouse'
  | 'desktop.mouse_left'
  | 'desktop.mouse_right'
  | 'desktop.mouse_middle'
  | 'desktop.dpad'
  | 'desktop.rotateHint'
  | 'desktop.consentTitle'
  | 'desktop.consentBody'
  | 'desktop.consentContinue'
  | 'desktop.consentCancel'
  | 'desktop.disconnect'
  | 'desktop.statsToggle'
  | 'desktop.statsHide'
  | 'desktop.statsShow'
  | 'desktop.settings'
  | 'session.remoteDesktop'
  | 'settings.desktopTitle'
  | 'settings.desktopHint'
  | 'settings.desktopTest'
  | 'settings.desktopTestOk'
  | 'settings.desktopTestFail'
  | 'settings.desktopSaved'
  | 'settings.desktopMissing'
  | 'settings.navBarPosition'
  | 'settings.navBarBottom'
  | 'settings.navBarHeader'
  | 'settings.blockedModels'
  | 'settings.blockedModelsHint'
  | 'settings.featureFlags'
  | 'settings.featureFlagsDesc'
  | 'settings.fileBrowser'
  | 'settings.fileBrowserDesc'
  | 'settings.inlineDiff'
  | 'settings.inlineDiffDesc'
  | 'settings.contextMenu'
  | 'settings.contextMenuDesc'
  | 'settings.planBreakdown'
  | 'settings.planBreakdownDesc'
  | 'settings.gitOps'
  | 'settings.gitOpsDesc'
  | 'settings.mcpConfig'
  | 'settings.mcpConfigDesc'
  | 'settings.sessionArchive'
  | 'settings.sessionArchiveDesc'
  | 'settings.streamingFull'
  | 'settings.streamingFullDesc'
  | 'detail.contextMenu.copy'
  | 'detail.contextMenu.revert'
  | 'detail.contextMenu.fork'
  | 'detail.queuedTitle'
  | 'detail.queuedEmpty'
  | 'detail.queuedSend'
  | 'detail.queuedRemove'
  | 'detail.queuedBadge'
  | 'detail.git.stage'
  | 'detail.git.unstage'
  | 'detail.git.commit'
  | 'detail.git.commitMessage'
  | 'detail.git.noChanges'
  | 'detail.archive'
  | 'detail.unarchive'
  | 'detail.showArchived'
  | 'detail.plan.tasks'
  | 'detail.plan.pending'
  | 'detail.plan.pendingCount'
  | 'detail.plan.completed'
  | 'detail.diff.viewFile'
  | 'detail.diff.noChanges'
  | 'settings.blockedModelsSearch'
  | 'settings.blockedCount'
  | 'settings.blockedShowAll'
  | 'settings.blockedHideAll'
  | 'settings.providers'
  | 'settings.providersDesc'
  | 'settings.connect'
  | 'settings.disconnect'
  | 'settings.connected'
  | 'settings.notConnected'
  | 'settings.connecting'
  | 'settings.connectSuccess'
  | 'settings.connectError'
  | 'settings.apiKey'
  | 'settings.apiKeyPlaceholder'
  | 'settings.noProviders'
  | 'settings.showEmpty'
  | 'settings.hideEmpty'
  | 'settings.cancel'
  | 'settings.offlineCache'
  | 'settings.offlineCacheDesc'
  | 'settings.questionAuto'
  | 'settings.questionAutoDesc'
  | 'settings.permissionUI'
  | 'settings.permissionUIDesc'
  | 'settings.permissionRequest'
  | 'settings.permissionAllow'
  | 'settings.permissionDeny'
  | 'settings.questionPrompt'
  | 'settings.questionPlaceholder'
  | 'settings.questionSend'
  | 'settings.questionSkip'
  | 'session.fork'
  | 'session.restore'
  | 'session.archiveView'
  | 'session.more'
  | 'session.searchMessages'
  | 'session.archived'
  | 'session.themeCreator'
  | 'session.compact'
  | 'session.tokenStats'
  | 'session.exportMd'
  | 'session.files'
  | 'session.skills'
  | 'session.terminal'
  | 'session.reboot'
  | 'session.rebootConfirm'
  | 'session.rebootAction'
  | 'session.rebootCancel'
  | 'session.mcpBrowser'
  | 'session.shortcuts'
  | 'session.pendingCount'
  | 'session.realtime'
  | 'session.reconnecting'
  | 'session.removeImage'
  | 'session.rename'
  | 'session.undo'
  | 'session.redo'
  | 'session.browseFiles'
  | 'session.mcpResources'
  | 'sessions.count'
  | 'sessions.recentDismiss'
  | 'common.yes'
  | 'common.no'
  | 'favorites.label'
  | 'favorites.add'
  | 'favorites.remove'
  | 'session.statusBusy'
  | 'session.statusRetry'
  | 'archived.empty'
  | 'archived.restore'
  | 'archived.open'
  | 'terminal.placeholder'
  | 'skills.searchPlaceholder'
  | 'skills.loading'
  | 'skills.empty'
  | 'subagent.parent'
  | 'themeCreator.name'
  | 'themeCreator.copyJson'
  | 'themeCreator.preview'
  | 'common.apply'
  | 'themePicker.current'
  | 'themePicker.searchPlaceholder'
  | 'themePicker.noMatch'
  | 'mcpBrowser.loading'
  | 'notification.completionTitle'
  | 'notification.completionBody'
  | 'notification.questionTitle'
  | 'notification.questionBody'
  | 'notification.errorBody'
  | 'mcpBrowser.title'
  | 'mcpBrowser.empty'
  | 'mcpBrowser.search'
  | 'fileEditor.title'
  | 'fileEditor.save'
  | 'fileEditor.saving'
  | 'fileEditor.readOnly'
  | 'fileEditor.loading'
  | 'fileEditor.noChanges'
  | 'terminal.title'
  | 'terminal.clear'
  | 'terminal.input'
  | 'terminal.welcome'
  | 'shortcuts.title'
  | 'favorites.manage'
  | 'favorites.saveOrder'
  | 'favorites.empty'
  | 'offlineQueue.pending'
  | 'themeCreator.title'
  | 'settings.chatCustomization'
  | 'settings.chatCustomizationDesc'
  | 'settings.chatFontSize'
  | 'settings.chatSpacing'
  | 'settings.chatSpacingCompact'
  | 'settings.chatSpacingNormal'
  | 'settings.chatSpacingComfortable'
  | 'settings.chatShowThinking'
  | 'settings.chatShowTools'
  | 'settings.chatShowTime'
  | 'settings.chatShowTodo'
  | 'settings.chatShowModelInfo'
  | 'settings.chatShowDiffs'
  | 'settings.chatShowSubagents'
  | 'settings.chatShowCompaction'
  | 'settings.chatShowImages'
  | 'settings.chatBubbleRadius'
  | 'settings.chatMaxWidth'
  | 'settings.chatWidthNormal'
  | 'settings.chatWidthWide'
  | 'settings.chatWidthFull'
  | 'settings.chatFontFamily'
  | 'settings.chatFontSystem'
  | 'settings.chatFontSerif'
  | 'settings.chatFontMono'
  | 'settings.chatPreviewUser'
  | 'settings.chatPreviewAssistant'
  | 'settings.chatCompactTools'
  | 'settings.chatCompletionSound'
  | 'settings.chatBg'
  | 'settings.chatBgDefault'
  | 'settings.chatBgIndigo'
  | 'settings.chatBgAmber'
  | 'settings.chatBgGreen'
  | 'settings.chatBgSolid'
  | 'settings.chatUserBubble'
  | 'settings.chatAccent'
  | 'settings.chatResetColor'
  | 'settings.chatCharLimit'
  | 'settings.chatCharLimitOff'
  | 'settings.snippets'
  | 'settings.snippetsDesc'
  | 'settings.snippetsEmpty'
  | 'settings.snippetName'
  | 'settings.snippetText'
  | 'settings.snippetAdd'
  | 'settings.snippetRemove'
  | 'composer.snippets'
  | 'common.cancel'
  | 'chat.moreActions'
  | 'chat.copyText'
  | 'chat.regenerate'
  | 'image.editorTitle'
  | 'image.crop'
  | 'image.draw'
  | 'image.undo'
  | 'image.apply'
  | 'image.close'
  | 'image.brushColor'
  | 'image.brushSize'
  | 'sessions.select'
  | 'sessions.cancelSelect'
  | 'sessions.selectedCount'
  | 'sessions.deleteSelected'
  | 'sessions.deleteManyConfirm'
  | 'settings.testAgain'
  | 'settings.testAgainTitle'
  | 'chat.prompts'
  | 'chat.insertPrompt'
  | 'chat.sendPrompt'
  | 'prompts.explain'
  | 'prompts.explainText'
  | 'prompts.review'
  | 'prompts.reviewText'
  | 'prompts.bugs'
  | 'prompts.bugsText'
  | 'prompts.tests'
  | 'prompts.testsText'
  | 'prompts.optimize'
  | 'prompts.optimizeText'
  | 'prompts.refactor'
  | 'prompts.refactorText'
  | 'prompts.docs'
  | 'prompts.docsText'
  | 'prompts.commit'
  | 'prompts.commitText'
  | 'prompts.debug'
  | 'prompts.debugText'
  | 'prompts.explainSimple'
  | 'prompts.explainSimpleText'
  | 'prompts.summarize'
  | 'prompts.summarizeText'
  | 'prompts.security'
  | 'prompts.securityText'
  | 'settings.enabled'
  | 'settings.disabled'
  | 'settings.chatReset'
  | 'settings.extras'
  | 'settings.extrasDesc'
  | 'extras.shutdownHost'
  | 'extras.shutdownHostDesc'
  | 'extras.shutdownConfirmTitle'
  | 'extras.shutdownConfirmBody'
  | 'extras.shutdownConfirm'
  | 'extras.shutdownCancel'
  | 'extras.shutdownSent'
  | 'extras.shutdownFailed'
  | 'extras.shutdownNoSession'
  | 'extras.restartHost'
  | 'extras.restartHostDesc'
  | 'extras.restartConfirmTitle'
  | 'extras.restartConfirmBody'
  | 'extras.restartConfirm'
  | 'extras.restartCancel'
  | 'extras.restartSent'
  | 'extras.restartFailed'
  | 'extras.github'
  | 'extras.dataUsage'
  | 'settings.serverApplyAndSave'
  | 'settings.serverSaveOnly'
  | 'favorites.manageDesc'
  | 'session.archivedDesc'
  | 'session.shortcutsDesc'
  | 'session.queueToggle'
  | 'session.queueToggleOn'
  | 'session.queueToggleOff'
  | 'dataUsage.title'
  | 'dataUsage.day'
  | 'dataUsage.week'
  | 'dataUsage.month'
  | 'dataUsage.up'
  | 'dataUsage.down'
  | 'dataUsage.total'
  | 'dataUsage.reset'
  | 'dataUsage.mobile'
  | 'dataUsage.wifi'

// Partial: los idiomas pueden omitir keys — createTranslator cae al EN
// (translations[lang][key] ?? translations.en[key] ?? key).
const translations: Record<LanguageCode, Partial<Record<TranslationKey, string>>> = {
  en: {
    'app.title': 'OpenCode Mobile',
    'app.exitTitle': 'Close app?',
    'app.exitMessage': 'Are you sure you want to exit?',
    'app.exitOk': 'Close',
    'app.exitCancel': 'Cancel',
    'error.title': 'Error',
    'error.close': 'Close',
    'nav.settings': 'Settings',
    'nav.sessions': 'Sessions',
    'nav.detail': 'Detail',
    'nav.help': 'Help',
    'nav.lightMode': 'Switch to light mode',
    'nav.darkMode': 'Switch to dark mode',
    'composer.inputLabel': 'Message OpenCode',
    'composer.send': 'Send',
    'composer.stop': 'Stop',
    'menu.title': 'Menu',
    'menu.settingsDescription': 'Configure server connection',
    'menu.sessionsDescription': 'Manage your sessions',
    'menu.detailDescription': 'Chat with OpenCode',
    'menu.helpDescription': 'Documentation & support',
    'settings.title': 'Server Configuration',
    'settings.host': 'Host Address',
    'settings.hostPlaceholder': '192.168.1.100, localhost, or https://example.com',
    'settings.port': 'Port',
    'settings.username': 'Username',
    'settings.password': 'Password',
    'settings.passwordPlaceholder': 'Optional; leave blank for unsecured local server',
    'settings.save': 'Save Configuration',
    'settings.saving': 'Saving...',
    'settings.test': 'Test Connection',
    'settings.testing': 'Testing...',
    'settings.testingConnection': 'Testing connection...',
      'settings.saved': 'Configuration saved. It will be used for Sessions.',
      'settings.savedNotTested': 'Test the connection before using it.',
    'settings.connectedSaved': 'Connected to OpenCode {version}. Configuration saved.',
    'settings.draftHint': 'Changes are saved automatically. Test checks the fields below without changing page.',
    'settings.testedNotSaved': 'Connection OK: OpenCode {version}. Nothing was saved yet.',
      'settings.savedButton': 'Saved',
      'settings.sectionServer': 'Server',
      'settings.sectionServers': 'Saved servers',
      'settings.sectionServersDesc': 'Connect to different computers. Each profile is one machine (direct HTTP over LAN or Tailscale).',
      'settings.serverActive': 'Active',
      'settings.serverApplied': 'Server applied',
      'settings.serverNamePlaceholder': 'Profile name (e.g. Work PC)',
      'settings.serverName': 'Name',
      'settings.editServer': 'Edit saved server',
      'settings.saveAndApply': 'Save and apply',
      'settings.serverRemove': 'Remove server',
      'settings.serverAdd': 'Add server',
      'settings.serverAddAndConnect': 'Add & connect',
      'settings.serverConnectedTo': 'Connected to',
      'settings.serverNoActive': 'No server connected',
      'settings.serverUntitled': 'Untitled',
      'settings.serverNotConfigured': 'Not configured',
      'settings.serverUse': 'Use',
      'settings.pairTitle': 'OpenCode v2 Pair (BETA)',
      'settings.pairDesc': 'Scan the QR code shown by `opencode service pair` (beta) to connect automatically.',
      'settings.pairScanQr': 'Scan QR code',
      'settings.pairPaste': 'Or paste the payload',
      'settings.pairPasteHint': 'Paste the QR content (URL + credentials) here',
      'settings.pairParse': 'Parse',
      'settings.pairParsed': 'Pairing data detected. Save it as a server.',
      'settings.pairParseError': 'Could not read pairing data. Check the QR content.',
      'settings.pairCameraUnavailable': 'Camera not available. Paste the payload below instead.',
      'settings.pairSave': 'Save as server',
      'settings.pairNamePlaceholder': 'Profile name (e.g. v2 beta PC)',
      'settings.pairKind': 'BETA v2',
      'settings.apiVersion': 'API version',
      'settings.apiVersionDesc': 'Server API dialect. Auto detects v1 vs v2 (beta) on connect.',
      'settings.apiVersionAuto': 'Auto (detect)',
      'settings.apiVersionV1': 'v1 (classic)',
      'settings.apiVersionV2': 'v2 (beta)',
      'settings.sectionPreferences': 'Preferences',
      'settings.dataModeTitle': 'Data mode',
      'settings.dataModeDesc': 'Controls network polling frequency and automatic data loading.',
      'settings.modeFullDesc': '3.5s · ~35 KB/min · SSE + audio · full data',
      'settings.modeSaver': 'Balance',
      'settings.modeSaverDesc': '15s · ~10 KB/min · full payload · with audio',
      'settings.modeUltra': 'Reduced',
      'settings.modeUltraDesc': '30s · ~3.6 KB/min · no audio · essential data',
      'settings.modeMiser': 'Minimum',
      'settings.modeMiserDesc': '60s · ~1.8 KB/min · text only · no notifications',
      'settings.visualTheme': 'Visual theme',
      'settings.switchTheme': 'Switch theme',
      'detail.copySelection': 'Copy selection',
    'settings.testOk': 'Test OK',
    'settings.testNeedsFields': 'Enter host, port, and username to test.',
    'settings.testAlreadyPassed': 'This draft already passed the connection test.',
    'settings.readyToTest': 'Ready to test these fields.',
    'settings.unsavedChanges': 'Unsaved changes: tap Save to use them in Sessions.',
    'settings.noUnsavedChanges': 'Saved settings are active.',
    'settings.defaultModel': 'Default model',
    'settings.selectModel': 'Select a model',
    'settings.stats': 'Usage stats',
    'settings.statsPrompts': 'Prompts',
    'settings.statsSessions': 'Sessions',
    'settings.statsTokens': 'Tokens',
    'settings.resetStats': 'Reset stats',
    'settings.mode': 'Mode',
    'voice.input': 'Voice input',
    'voice.listening': 'Listening...',
    'voice.permissionDenied': 'Microphone permission denied — enable it in system settings',
    'voice.unavailable': 'Speech recognition is not available on this device',
    'desktop.title': 'Remote desktop',
    'desktop.fullScreen': 'Full screen',
    'desktop.monitor': 'Monitor',
    'desktop.source': 'Source',
    'desktop.connecting': 'Connecting…',
    'desktop.error': 'Connection failed',
    'desktop.data': 'Data',
    'desktop.dragMode': 'Drag',
    'desktop.fit': 'Fit',
    'desktop.zoomIn': 'Zoom in',
    'desktop.zoomOut': 'Zoom out',
    'desktop.quality': 'Quality',
    'desktop.preset_low': 'Low',
    'desktop.preset_med': 'Medium',
    'desktop.preset_high': 'High',
    'desktop.keyboard': 'Keyboard',
    'desktop.kbPlaceholder': 'Type on the remote PC…',
    'desktop.cancel': 'Cancel',
    'desktop.retry': 'Retry',
    'desktop.oneToOne': '1:1',
    'desktop.scrollMode': 'Scroll',
    'desktop.mouse': 'Mouse',
    'desktop.mouse_left': 'L',
    'desktop.mouse_right': 'R',
    'desktop.mouse_middle': 'M',
    'desktop.dpad': 'Arrows',
    'desktop.rotateHint': 'Rotate the phone for a wider view',
    'desktop.consentTitle': 'You are on mobile data',
    'desktop.consentBody': 'Streaming can use ~1-2 MB/min while the screen changes. Continue in Low quality?',
    'desktop.consentContinue': 'Continue (Low)',
    'desktop.consentCancel': 'Cancel',
    'desktop.disconnect': 'Disconnect',
    'desktop.statsToggle': 'Stats',
    'desktop.statsHide': 'Hide stats',
    'desktop.statsShow': 'Show stats',
    'desktop.settings': 'Settings',
    'session.remoteDesktop': 'Remote desktop',
    'settings.desktopTitle': 'Remote desktop',
    'settings.desktopHint': 'OpenCode Desktop Agent on the PC (desktop-agent, port 5901). Same auth as the server.',
    'settings.desktopTest': 'Test connection',
    'settings.desktopTestOk': 'Desktop agent reachable',
    'settings.desktopTestFail': 'Cannot reach desktop agent',
    'settings.desktopSaved': 'Remote desktop saved',
    'settings.desktopMissing': 'Set the desktop agent host/port to use remote desktop',
    'settings.navBarPosition': 'Navigation bar',
    'settings.navBarBottom': 'Bottom',
    'settings.navBarHeader': 'Header',
    'settings.blockedModels': 'Blocked models',
    'settings.blockedModelsHint': 'Blocked models are hidden from the model picker.',
    'settings.blockedModelsSearch': 'Filter models...',
    'settings.blockedCount': '{blocked}/{total} hidden',
    'settings.blockedShowAll': 'Show all',
    'settings.blockedHideAll': 'Hide all',
    'settings.providers': 'AI Providers',
    'settings.providersDesc': 'Connect or disconnect AI providers',
    'settings.connect': 'Connect',
    'settings.disconnect': 'Disconnect',
    'settings.connected': 'Connected',
    'settings.notConnected': 'Not connected',
    'settings.connecting': 'Connecting...',
    'settings.connectSuccess': 'Connected successfully',
    'settings.connectError': 'Connection failed',
    'settings.apiKey': 'API Key',
    'settings.apiKeyPlaceholder': 'Enter your API key',
    'settings.noProviders': 'No providers available. Connect to a server first.',
    'settings.showEmpty': 'Show empty providers',
    'settings.hideEmpty': 'Hide empty providers',
    'settings.cancel': 'Cancel',
    'settings.offlineCache': 'Offline cache',
    'settings.offlineCacheDesc': 'Cache sessions and messages offline in IndexedDB',
    'settings.questionAuto': 'Auto-show questions',
    'settings.questionAutoDesc': 'Automatically show question prompts from the AI',
    'settings.permissionUI': 'Permission requests',
    'settings.permissionUIDesc': 'Show permission request dialogs for tool access',
    'settings.permissionRequest': 'Permission Request',
    'settings.permissionAllow': 'Allow',
    'settings.permissionDeny': 'Deny',
    'settings.questionPrompt': 'AI Question',
    'settings.questionPlaceholder': 'Type your answer...',
    'settings.questionSend': 'Send',
    'settings.questionSkip': 'Skip',
'settings.featureFlags': 'Additional features',
'settings.featureFlagsDesc': 'Enable or disable additional features',
    'settings.fileBrowser': 'File browser',
    'settings.fileBrowserDesc': 'Browse project files from the chat',
    'settings.inlineDiff': 'Inline diff',
    'settings.inlineDiffDesc': 'View detailed file changes',
    'settings.contextMenu': 'Context menu',
    'settings.contextMenuDesc': 'Menu on long press (copy, revert)',
    'settings.planBreakdown': 'Plan breakdown',
    'settings.planBreakdownDesc': 'Show structured Plan agent tasks',
    'settings.gitOps': 'Git operations',
    'settings.gitOpsDesc': 'Stage/Commit buttons from the chat',
    'settings.mcpConfig': 'MCP configuration',
    'settings.mcpConfigDesc': 'List and configure MCP servers',
    'settings.sessionArchive': 'Archive sessions',
    'settings.sessionArchiveDesc': 'Hide archived sessions from the list',
    'settings.streamingFull': 'Fast streaming (Full mode)',
    'settings.streamingFullDesc': 'Poll every 1s while the assistant replies',
    'detail.contextMenu.copy': 'Copy message',
    'detail.contextMenu.revert': 'Revert here',
    'detail.contextMenu.fork': 'Fork session',
    'detail.queuedTitle': 'Queued prompts',
    'detail.queuedEmpty': 'No queued prompts',
    'detail.queuedSend': 'Send now',
    'detail.queuedRemove': 'Remove',
    'detail.queuedBadge': 'queued',
    'detail.git.stage': 'Stage',
    'detail.git.unstage': 'Unstage',
    'detail.git.commit': 'Commit',
    'detail.git.commitMessage': 'Commit message',
    'detail.git.noChanges': 'No changes',
    'detail.archive': 'Archive',
    'detail.unarchive': 'Unarchive',
    'detail.showArchived': 'Show archived',
    'detail.plan.tasks': 'Plan tasks',
    'detail.plan.pending': 'Pending',
    'detail.plan.pendingCount': '{count} pending',
    'detail.plan.completed': 'Completed',
    'detail.diff.viewFile': 'View changes',
    'detail.diff.noChanges': 'No changes in this file',
    'connection.connecting': 'Connecting to OpenCode...',
    'connection.loadingSessions': 'Connecting and loading sessions...',
    'connection.refreshing': 'Refreshing sessions...',
    'connection.reconnecting': 'Connection is slow; retrying quietly...',
    'connection.connected': 'Connected',
    'connection.offline': 'OpenCode is not reachable',
    'settings.connectionFailed': 'Connection failed: {message}',
    'settings.connectedTo': 'Connected to OpenCode v{version}',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.themeSystem': 'System',
    'settings.themeScheduled': 'Scheduled (day/night)',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'sessions.title': 'Sessions',
    'sessions.new': 'New Session',
    'sessions.creating': 'Creating...',
    'sessions.refresh': 'Refresh',
    'sessions.projectDirectoryLabel': 'Selected folder',
    'sessions.projectDirectoryPlaceholder': '/home/you/project or C:\\Projects\\App',
    'sessions.projectDirectoryActive': 'New sessions use {directory}.',
    'sessions.projectDirectoryDefault': 'Choose the folder for this new session, or use the server default directory.',
    'sessions.newSessionTitle': 'New session folder',
    'sessions.useServerDefault': 'Use server default',
    'sessions.useThisFolder': 'Create here',
    'sessions.parentFolder': 'Parent folder',
    'sessions.folderPickerLoading': 'Loading folders...',
    'sessions.folderPickerEmpty': 'No folders here.',
    'sessions.projectDirectoryInvalid': '{directory} is not an OpenCode project folder. Pick a project/worktree folder, or use the server default.',
    'sessions.searchPlaceholder': 'Search sessions by title or directory...',
    'layout.single': 'Single panel',
    'layout.twoCol': 'Two columns',
    'layout.twoRow': 'Two rows',
    'layout.threeCol': 'Three columns',
    'layout.grid2x2': '2×2 grid',
    'panel.splitRight': 'Split right',
    'panel.splitBottom': 'Split bottom',
    'panel.close': 'Close panel',
    'panel.maximize': 'Maximize panel',
    'panel.restore': 'Restore panel',
    'panel.busy': 'Working…',
    'desktop.collapseSidebar': 'Collapse sidebar',
    'desktop.expandSidebar': 'Expand sidebar',
    'desktop.resizeSidebar': 'Resize sidebar',
    'chat.scrollToBottom': 'Scroll to bottom',
    'shortcuts.desktop': 'Desktop',
    'shortcuts.panelFocus': 'Focus panel',
    'shortcuts.closeSplit': 'Close split',
    'shortcuts.splitRight': 'Split right',
    'shortcuts.splitBottom': 'Split bottom',
    'shortcuts.maximize': 'Maximize / restore panel',
    'shortcuts.toggleSidebar': 'Toggle sidebar',
    'shortcuts.newSession': 'New session',
    'shortcuts.shortcut': 'Shortcut',
    'shortcuts.action': 'Action',
    'sessions.emptyTitle': 'No sessions found',
    'sessions.emptyHint': 'Create a new session to get started',
    'sessions.newHere': 'New session here',
  'sessions.selectOne': 'Select a session to start',
    'sessions.loadingTitle': 'Connecting to OpenCode',
    'sessions.loadingHint': 'Loading sessions. This can take a few seconds on mobile or after the server wakes up.',
    'sessions.offlineHint': 'OpenCode is not reachable yet. Check Settings or try Refresh.',
    'sessions.noFileChanges': 'No file changes',
    'sessions.updated': 'Updated {time}',
    'sessions.open': 'Open',
    'sessions.delete': 'Delete',
    'sessions.activeLabel': 'Active',
    'sessions.recentLabel': 'Recent',
    'detail.backToSessions': '← Sessions',
    'detail.selectSession': 'Select a session',
    'detail.loading': 'Loading session...',
    'detail.emptyTitle': 'No messages yet',
    'detail.emptyHint': 'Start a conversation below',
    'detail.waiting': 'Waiting...',
    'detail.send': 'Send',
    'detail.abort': 'Abort',
    'detail.jumpToLatest': 'Go to latest',
    'detail.you': '👤 You',
    'detail.opencode': 'OpenCode',
    'detail.projectDashboardLabel': 'Project and VCS dashboard',
    'detail.projectLabel': 'Project',
    'detail.vcsLabel': 'VCS',
    'detail.loadingProject': 'Loading...',
    'detail.unavailable': 'Unavailable',
    'detail.aheadBehind': '{ahead} ahead · {behind} behind',
    'detail.fileStatusLabel': 'Changed files',
    'detail.fileStatusSource': 'From /file/status',
    'detail.dashboardError': 'Error: {message}',
    'detail.changedFilesTitle': 'Changed files',
    'detail.changedFilesHint': 'Tap a file to see the mini diff.',
    'detail.filesCount': '{count} files',
    'detail.miniDiffAria': 'Changed files mini diff',
    'detail.linesAddedDeleted': '+{additions} lines · -{deletions} lines',
    'detail.modelPanelLabel': 'AI model picker',
    'detail.aiTitle': 'AI agent and model',
    'detail.refreshAi': 'Refresh AI options',
    'detail.agentTitle': 'Agent',
    'detail.agentSelectLabel': 'Agent for next prompt',
    'detail.agentLoading': 'Loading configured agents...',
    'detail.agentLoadError': 'Cannot load agents: {message}',
    'detail.agentMode': 'Mode: {mode}',
    'detail.modelTitle': 'AI model',
    'detail.modelHint': 'Applies to the next prompt and to new sessions. Current running replies keep their original model.',
    'detail.refreshModels': 'Refresh models',
    'detail.modelSelectLabel': 'Model for next prompt',
    'detail.modelSearchPlaceholder': 'Search models by name or provider...',
    'detail.modelSearchEmpty': 'No models match your search.',
    'detail.modelDefault': 'default',
    'detail.modelRecent': 'Recent',
    'detail.thought': 'Thought',
  'detail.thinking': 'Thinking…',
    'detail.modelAll': 'All models',
    'detail.modelProvider': 'Provider: {provider}',
    'detail.modelContext': 'Context {context} · output {output}',
    'detail.modelToolsYes': 'Tools enabled',
    'detail.modelToolsNo': 'No tools',
    'detail.modelVariant': 'Variant: {variant}',
    'detail.thinkingLevel': 'Thinking level',
    'detail.thinkingNone': 'None',
    'detail.thinkingHigh': 'High',
    'detail.thinkingMedium': 'Medium',
    'detail.thinkingLow': 'Low',
    'detail.changeModel': 'Change model…',
    'detail.noThinkingLevels': 'No thinking levels for this model',
    'detail.modelLoading': 'Loading configured models...',
    'detail.modelLoadError': 'Cannot load models: {message}',
    'detail.contextStripLabel': 'Session context shortcuts',
    'detail.aiChip': 'AI',
    'detail.filesChip': 'Files',
    'detail.detailsChip': 'Details',
    'detail.sessionDetailsTitle': 'Session details',
    'detail.sessionDetailsHint': 'Advanced project, VCS, file and model information.',
    'detail.closeSheet': 'Close',
    'detail.exportChat': 'Export chat',
    'detail.snapshot': 'Snapshot',
    'detail.readingModeOn': 'Reading',
    'detail.readingModeOff': 'Chat',
    'detail.undo': 'Undo last message',
    'detail.redo': 'Restore all reverted messages',
    'detail.redoShort': 'Restore messages',
    'detail.compact': 'Compact session',
    'detail.reverted': '⏪ Session reverted.',
    'detail.revertToHere': 'Revert session to this message',
    'todo.title': 'Todo Items',
    'todo.hide': 'Hide',
    'todo.show': 'Show',
    'todo.more': '... and {count} more',
    'diff.filesModified': '{count} files modified',
    'toolpart.wrote': 'wrote',
    'toolpart.edited': 'edited',
    'toolpart.patched': 'patched',
    'toolpart.subagent': 'Subagent',
    'toolpart.viewSubagent': 'View subagent',
    'session.deleteTitle': 'Delete session?',
    'session.deleteBodyPrefix': 'This will permanently delete',
    'session.cancel': 'Cancel',
    'session.deleteConfirm': 'Delete session',
    'session.renameTitle': 'Rename session',
    'session.renamePlaceholder': 'Enter new name...',
    'session.renameConfirm': 'Rename',
    'help.title': 'Help & Documentation',
    'help.overview': 'Overview',
    'help.server': 'Server',
    'help.network': 'Network',
    'help.troubleshooting': 'Troubleshooting',
    'help.commands': 'Commands',
    'help.overview.content': '<b>Configure Server:</b> Use Settings to enter host, port, username and password|'
      + '<b>Test Connection:</b> Press Test to validate server connectivity|'
      + '<b>Save Settings:</b> Press Save to apply configuration and start polling|'
      + '<b>Browse Sessions:</b> View and manage sessions from the Sessions tab|'
      + '<b>Interact:</b> Open a session and chat in the Detail view|'
      + '<b>Quick Input:</b> Press Enter to send, Shift+Enter for new lines|'
      + '<b>Slash Commands:</b> Text starting with / is sent as a command',
    'help.server.content': '<b>Starting the OpenCode Server</b>|'
      + 'Start OpenCode server with Basic Authentication enabled:|'
      + '||<b>macOS / Linux (bash/zsh)</b>|'
      + '<code>OPENCODE_SERVER_USERNAME=opencode OPENCODE_SERVER_PASSWORD=your-password npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>|'
      + '||<b>Windows PowerShell</b>|'
      + '<code>$env:OPENCODE_SERVER_USERNAME="opencode"; $env:OPENCODE_SERVER_PASSWORD="your-password"; npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>|'
      + '||<b>Windows Command Prompt</b>|'
      + '<code>set OPENCODE_SERVER_USERNAME=opencode&amp; set OPENCODE_SERVER_PASSWORD=your-password&amp; npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>',
    'help.network.content': '<b>LAN Mode (Recommended)</b> Use your PC local IP address for devices on the same network|'
      + 'Example: 192.168.1.61|'
      + '||<b>WAN Mode (Advanced)</b>|'
      + 'Configure NAT/port forwarding on your router|'
      + 'Set up a VPN for secure remote access|'
      + 'Use a reverse proxy with TLS/HTTPS|'
      + '||<b>Security Requirements</b>|'
      + 'Open TCP port 4096 in OS firewall|'
      + 'Configure router/NAT port forwarding|'
      + 'Use strong authentication passwords|'
      + 'Prefer TLS/HTTPS for external access|'
      + 'Restrict source IPs when possible|'
      + 'Never expose without authentication',
    'help.troubleshooting.content': '<b>Connection Diagnostics</b>|'
      + '1. Verify Server: Check if OpenCode is listening on port 4096|'
      + '2. Test Locally: Check health endpoint from the same machine|'
      + '3. Test Network: Check health endpoint from your phone browser|'
      + '4. Check Firewall: Ensure port 4096 is open in OS firewall|'
      + '||<b>Health Check Commands</b>|'
      + '<code>curl -u opencode:your-password http://127.0.0.1:4096/global/health</code>|'
      + '<code>curl -u opencode:your-password http://YOUR_PC_IP:4096/global/health</code>|'
      + '||<b>Common Issues</b>|'
      + 'CORS Errors: Add --cors flags to server|'
      + 'Connection Timeout: Check firewall settings|'
      + 'Auth Failures: Verify username/password',
    'help.commands.content': 'Local mobile commands are handled by the app. Server commands are loaded from OpenCode.',
    'help.commands.serverTab': 'Server Commands',
    'help.commands.skillsTab': 'Skills',
    'help.commands.empty': 'No {type} available',
    'help.commands.emptyConnected': 'Connect to a server to see available commands and skills',
    'session.fork': 'Fork',
    'session.more': 'More',
    'session.searchMessages': 'Search Messages',
    'session.archived': 'Archived',
    'session.themeCreator': 'Theme Creator',
    'session.compact': 'Compact',
    'session.tokenStats': 'Token Stats',
    'session.exportMd': 'Export .md',
    'session.files': 'Files',
    'session.skills': 'Skills',
    'session.terminal': 'Terminal',
    'session.reboot': 'Reboot PC',
    'session.rebootConfirm': 'The PC will restart in 10 seconds. Continue?',
    'session.rebootAction': 'Restart now',
    'session.rebootCancel': 'Cancel',
    'session.mcpBrowser': 'MCP Browser',
    'session.shortcuts': 'Shortcuts',
    'session.pendingCount': '{count} pending',
    'session.realtime': 'Real-time',
    'session.reconnecting': 'Reconnecting...',
    'session.removeImage': 'Remove',
    'session.rename': 'Rename',
    'session.undo': 'Undo',
    'session.redo': 'Redo',
    'session.browseFiles': 'Browse Files',
    'session.mcpResources': 'MCP Resources',
    'sessions.count': '{count} sessions',
    'sessions.recentDismiss': 'Remove from recent?',
    'common.yes': 'Yes',
    'common.no': 'No',
    'favorites.label': 'Favorites',
    'favorites.add': 'Add to favorites',
    'favorites.remove': 'Remove from favorites',
    'session.statusBusy': 'Busy',
    'session.statusRetry': 'Retry',
    'archived.empty': 'No archived sessions',
    'archived.restore': 'Restore',
    'archived.open': 'Open',
    'terminal.placeholder': 'Type a command to run in the project shell',
    'skills.searchPlaceholder': 'Search skills...',
    'skills.loading': 'Loading...',
    'skills.empty': 'No skills found',
    'subagent.parent': 'Parent',
    'themeCreator.name': 'Theme name',
    'themeCreator.copyJson': 'Copy JSON',
    'themeCreator.preview': 'Preview',
    'common.apply': 'Apply',
    'themePicker.current': 'current',
    'themePicker.searchPlaceholder': 'Search themes...',
    'themePicker.noMatch': 'No themes match "{query}"',
    'mcpBrowser.loading': 'Loading...',
    'session.restore': 'Restore',
    'session.archiveView': 'Archived sessions',
    'notification.completionTitle': 'OpenCode Complete',
    'notification.completionBody': 'Assistant finished replying',
    'notification.questionTitle': 'Question from AI',
    'notification.questionBody': 'The AI has a question for you',
    'notification.errorBody': 'An error occurred',
    'mcpBrowser.title': 'MCP Resources',
    'mcpBrowser.empty': 'No MCP resources available',
    'mcpBrowser.search': 'Search resources...',
    'fileEditor.title': 'File Editor',
    'fileEditor.save': 'Save',
  'fileEditor.saving': 'Saving...',
  'fileEditor.readOnly': 'Read only',
  'fileEditor.loading': 'Loading file...',
    'fileEditor.noChanges': 'No changes',
    'terminal.title': 'Terminal',
    'terminal.clear': 'Clear',
    'terminal.input': 'Enter shell command',
    'terminal.welcome': 'Type a command to run in the project shell',
    'shortcuts.title': 'Keyboard Shortcuts',
    'favorites.manage': 'Manage Favorites',
    'favorites.saveOrder': 'Save Order',
    'favorites.empty': 'No favorites yet',
    'offlineQueue.pending': 'Pending actions in queue',
    'themeCreator.title': 'Theme Creator',
    'settings.chatCustomization': 'Chat customization',
    'settings.chatCustomizationDesc': 'Customize what you see in the chat',
    'settings.chatFontSize': 'Font size',
    'settings.chatSpacing': 'Spacing',
    'settings.chatSpacingCompact': 'Compact',
    'settings.chatSpacingNormal': 'Normal',
    'settings.chatSpacingComfortable': 'Comfortable',
    'settings.chatShowThinking': 'Show reasoning',
    'settings.chatShowTools': 'Show tools',
    'settings.chatShowTime': 'Show timestamps',
    'settings.chatShowTodo': 'Todo button',
    'settings.chatShowModelInfo': 'Show model info',
    'settings.chatShowDiffs': 'Show file diffs',
    'settings.chatShowSubagents': 'Show subagent hint',
    'settings.chatShowCompaction': 'Show compaction checkpoint',
    'settings.chatShowImages': 'Show images',
    'settings.chatBubbleRadius': 'Bubble radius',
    'settings.chatMaxWidth': 'Message width',
    'settings.chatWidthNormal': 'Normal',
    'settings.chatWidthWide': 'Wide',
    'settings.chatWidthFull': 'Full',
    'settings.chatFontFamily': 'Font',
    'settings.chatFontSystem': 'System',
    'settings.chatFontSerif': 'Serif',
    'settings.chatFontMono': 'Monospace',
    'settings.chatPreviewUser': 'Your message with this font size',
    'settings.chatPreviewAssistant': 'Assistant reply example showing how the text looks',
    'settings.chatCompactTools': 'Compact tools (one line)',
    'settings.chatCompletionSound': 'Completion sound',
    'settings.chatBg': 'Chat background',
    'settings.chatBgDefault': 'Default',
    'settings.chatBgIndigo': 'Indigo',
    'settings.chatBgAmber': 'Amber',
    'settings.chatBgGreen': 'Green',
    'settings.chatBgSolid': 'Solid',
    'settings.chatUserBubble': 'Your bubble color',
    'settings.chatAccent': 'Accent color',
    'settings.chatResetColor': 'Reset to theme',
    'settings.chatCharLimit': 'Prompt char limit',
    'settings.chatCharLimitOff': 'Off',
    'settings.snippets': 'Prompt snippets',
    'settings.snippetsDesc': 'Reusable prompt templates, available from the composer',
    'settings.snippetsEmpty': 'No snippets yet — add your first one above.',
    'settings.snippetName': 'Name',
    'settings.snippetText': 'Prompt text',
    'settings.snippetAdd': 'Add snippet',
    'settings.snippetRemove': 'Remove snippet',
    'composer.snippets': 'Insert snippet',
    'common.cancel': 'Cancel',
    'chat.moreActions': 'Message actions',
    'chat.copyText': 'Copy text',
    'chat.regenerate': 'Regenerate reply',
    'image.editorTitle': 'Edit image',
    'image.crop': 'Crop',
    'image.draw': 'Draw',
    'image.undo': 'Undo',
    'image.apply': 'Apply',
    'image.close': 'Close',
    'image.brushColor': 'Brush color',
    'image.brushSize': 'Brush size',
    'sessions.select': 'Select sessions',
    'sessions.cancelSelect': 'Cancel',
    'sessions.selectedCount': '{count} selected',
    'sessions.deleteSelected': 'Delete',
    'sessions.deleteManyConfirm': 'Delete {count} sessions? This cannot be undone.',
    'settings.testAgain': 'Test again',
    'settings.testAgainTitle': 'Connection already verified — test again',
    'chat.prompts': 'Prompts',
    'chat.insertPrompt': 'Insert in composer',
    'chat.sendPrompt': 'Send now',
    'prompts.explain': 'Explain code',
    'prompts.explainText': 'Act as a senior software engineer.\n\nExplain the code below (paste it or point to a file):\n<code>\n[PASTE CODE HERE]\n</code>\n\nCover:\n1. What it does (purpose, inputs, outputs)\n2. How it works (key functions, data flow, important logic)\n3. Potential issues (bugs, edge cases, maintainability)\n\nFormat: short sections with headings. Use file:line references where possible.',
    'prompts.review': 'Code review',
    'prompts.reviewText': 'Act as a senior code reviewer.\n\nReview the recent changes in this project (git diff). For each finding:\n- Severity (critical/major/minor/nit)\n- File and line\n- Why it matters\n- Concrete fix\n\nPrioritize correctness and security first. Be concise — only real issues.',
    'prompts.bugs': 'Find bugs',
    'prompts.bugsText': 'Act as a debugging expert.\n\nAnalyze this code (paste it or point to a file):\n<code>\n[PASTE CODE HERE]\n</code>\n\nFind:\n1. Logic bugs and race conditions\n2. Edge cases that crash or corrupt state\n3. Resource leaks (memory, sockets, listeners)\n\nFor each: file:line, trigger scenario, expected vs actual, fix suggestion.',
    'prompts.tests': 'Write tests',
    'prompts.testsText': 'Act as a test engineer.\n\nWrite tests for the code in this file using the project test conventions.\n\nCover:\n1. Happy path (main flow)\n2. Edge cases (empty, null, limits)\n3. Error paths\n\nOutput the test file complete and runnable, with a short comment per test case describing the scenario.',
    'prompts.optimize': 'Optimize performance',
    'prompts.optimizeText': 'Act as a performance engineer.\n\nProfile and analyze this code (paste it or point to a file):\n<code>\n[PASTE CODE HERE]\n</code>\n\nFind:\n1. Time complexity issues (hidden O(n²), N+1 queries)\n2. Allocations in hot loops\n3. Render/bundle issues (if frontend)\n\nFor each: impact estimate, where it happens, concrete fix. Keep behavior identical.',
    'prompts.refactor': 'Refactor',
    'prompts.refactorText': 'Act as a senior architect.\n\nRefactor this code (paste it or point to a file):\n<code>\n[PASTE CODE HERE]\n</code>\n\nRules:\n- Follow SRP and DRY\n- Do NOT change behavior or public API\n- Prefer small, safe steps\n\nOutput: the refactored code plus a brief list of what changed and why.',
    'prompts.docs': 'Document',
    'prompts.docsText': 'Act as a technical writer.\n\nDocument this file (paste it or point to a file):\n<code>\n[PASTE CODE HERE]\n</code>\n\nInclude:\n1. What the module/file does (2-3 sentences)\n2. Main functions/classes with one-line descriptions\n3. Usage example\n4. Gotchas (dependencies, side effects)\n\nKeep it short and practical — no fluff.',
    'prompts.commit': 'Commit message',
    'prompts.commitText': 'Act as a git expert.\n\nReview the current changes (git status / git diff --stat) and write a commit message.\n\nFollow conventional commits: type(scope): short summary\n- type: feat|fix|refactor|docs|test|chore|perf\n- Scope optional but useful\n- Body: why (not what) in 2-4 bullets\n\nOutput only the final message, ready to paste.',
    'prompts.debug': 'Debug error',
    'prompts.debugText': 'Act as a debugging expert.\n\nI have this error:\n<error>\n[PASTE THE ERROR HERE]\n</error>\n\nContext (fill in):\n- What I was doing: \n- Expected: \n- Actual: \n\nSteps:\n1. Explain the root cause with the relevant code path\n2. Propose a fix (minimal change)\n3. Suggest how to verify it',
    'prompts.explainSimple': 'Explain simply',
    'prompts.explainSimpleText': 'Explain this code as if to a junior developer (paste it or point to a file):\n<code>\n[PASTE CODE HERE]\n</code>\n\nUse analogies and plain language.\n\nStructure:\n1. One-paragraph summary in simple words\n2. Line-by-line walkthrough of the important parts\n3. 2-3 things that could go wrong\n\nNo jargon without explaining it first.',
    'prompts.summarize': 'Summarize conversation',
    'prompts.summarizeText': 'Summarize this conversation.\n\nStructure:\n1. Goal — what was being done\n2. Actions — what was implemented/changed (files, decisions)\n3. Results — what works and what is pending\n4. Next steps — recommended follow-ups\n\nKeep it under 150 words. Bullet points only.',
    'prompts.security': 'Security review',
    'prompts.securityText': 'Act as a security auditor.\n\nReview this code (paste it or point to a file):\n<code>\n[PASTE CODE HERE]\n</code>\n\nCheck for:\n1. Secrets/credentials in code or logs\n2. Injection (SQL, command, XSS, prompt injection)\n3. Unsafe input handling and auth/authorization gaps\n\nFor each finding: severity, file:line, exploitation scenario, fix. Ignore theoretical issues with no real path.',
    'settings.enabled': 'On',
    'settings.disabled': 'Off',
    'settings.chatReset': 'Reset to defaults',
    'settings.extras': 'Extras',
    'settings.extrasDesc': 'Additional tools',
    'extras.shutdownHost': 'Shut down host computer',
    'extras.shutdownHostDesc': 'Sends a shutdown command to the computer running the OpenCode server',
    'extras.shutdownConfirmTitle': 'Shut down host?',
    'extras.shutdownConfirmBody': 'The computer running the OpenCode server will be turned off. This action cannot be undone.',
    'extras.shutdownConfirm': 'Shut down',
    'extras.shutdownCancel': 'Cancel',
    'extras.shutdownSent': 'Shutdown command sent',
    'extras.shutdownFailed': 'Shutdown command failed: {error}',
    'extras.shutdownNoSession': 'You need an active session to shut down the host',
'extras.restartHost': 'Restart host computer',
'extras.restartHostDesc': 'Restarts the computer running the OpenCode server',
'extras.restartConfirmTitle': 'Restart host?',
'extras.restartConfirmBody': 'The computer running the OpenCode server will restart in 10 seconds. This action cannot be undone.',
'extras.restartConfirm': 'Restart now',
'extras.restartCancel': 'Cancel',
'extras.restartSent': 'Restart command sent',
'extras.restartFailed': 'Restart command failed: {error}',
    'extras.github': 'Project GitHub',
    'extras.dataUsage': 'Data usage',
    'settings.serverApplyAndSave': 'Use & save',
    'settings.serverSaveOnly': 'Save only',
    'favorites.manageDesc': 'Reorder favorite sessions',
    'session.archivedDesc': 'View archived sessions',
    'session.shortcutsDesc': 'Keyboard shortcuts reference',
    'session.queueToggle': 'Queue',
    'session.queueToggleOn': 'Queue enabled - messages send automatically when the assistant finishes',
    'session.queueToggleOff': 'Queue disabled',
    'dataUsage.title': 'Data usage',
    'dataUsage.day': 'Day',
    'dataUsage.week': 'Week',
    'dataUsage.month': 'Month',
    'dataUsage.up': 'Up',
    'dataUsage.down': 'Down',
    'dataUsage.total': 'Total',
    'dataUsage.reset': 'Reset counter',
    'dataUsage.mobile': 'Mobile',
    'dataUsage.wifi': 'WiFi',
    'nav.stats': 'Stats',
    'settings.serverStats': 'Server stats',
    'stats.title': 'Statistics',
    'stats.refresh': 'Refresh',
    'stats.loading': 'Reading database...',
    'stats.error': 'Error',
    'stats.empty': 'No data (is the opencode-stats server running?)',
    'stats.metaLine': '{sessions} sessions · {models} models · {since} → {until} · avg cost {avg}/session · DB: {db}',
    'stats.filterSince': 'Since',
    'stats.filterUntil': 'Until',
    'stats.filterModel': 'Model',
    'stats.apply': 'Apply',
    'stats.port': 'Stats port',
    'stats.portHint': 'Port of the opencode-stats server on the PC (default 8765)',
    'stats.cost': 'Total cost',
    'stats.estCost': 'est.',
    'stats.mostExpensive': 'Most expensive session',
    'stats.mostTokens': 'Session with most tokens',
    'stats.avgInput': 'Avg input per session',
    'stats.costPerDay': 'Cost per day',
    'stats.costPerModel': 'Cost per model',
    'stats.prices': 'Prices per 1M tokens (USD)',
    'stats.tabOverview': 'Overview',
    'stats.tabModel': 'By model',
    'stats.tabProject': 'By project',
    'stats.tabDay': 'By day',
    'stats.tabMonth': 'By month',
    'stats.tabSessions': 'Sessions',
    'stats.tabLimits': 'Limits & prices',
    'stats.setupTitle': 'Activate on your PC',
    'stats.setupHint': 'Double-click start-stats.bat (or run this command) on the computer that runs opencode. It opens firewall port 8765 automatically.',
    'stats.setupCopy': 'Copy command',
    'stats.setupCopied': 'Copied!'
  },
  es: {
    'app.title': 'OpenCode Remoto',
    'app.exitTitle': '¿Cerrar app?',
    'app.exitMessage': '¿Seguro que quieres salir?',
    'app.exitOk': 'Cerrar',
    'app.exitCancel': 'Cancelar',
    'error.title': 'Error',
    'error.close': 'Cerrar',
    'nav.settings': 'Configuración',
    'nav.sessions': 'Sesiones',
    'nav.detail': 'Detalle',
    'nav.help': 'Ayuda',
    'nav.lightMode': 'Cambiar a modo claro',
    'nav.darkMode': 'Cambiar a modo oscuro',
    'composer.inputLabel': 'Mensaje para OpenCode',
    'composer.send': 'Enviar',
    'composer.stop': 'Detener',
    'menu.title': 'Menú',
    'menu.settingsDescription': 'Configurar conexión al servidor',
    'menu.sessionsDescription': 'Gestionar tus sesiones',
    'menu.detailDescription': 'Chatear con OpenCode',
    'menu.helpDescription': 'Documentación y soporte',
    'settings.title': 'Configuración del servidor',
    'settings.host': 'Dirección del host',
    'settings.hostPlaceholder': '192.168.1.100, localhost o https://example.com',
    'settings.port': 'Puerto',
    'settings.username': 'Usuario',
    'settings.password': 'Contraseña',
    'settings.passwordPlaceholder': 'Opcional; dejar vacío para servidor local sin protección',
    'settings.save': 'Guardar configuración',
    'settings.saving': 'Guardando...',
    'settings.test': 'Testear conexión',
    'settings.testing': 'Probando...',
    'settings.testingConnection': 'Probando conexión...',
      'settings.saved': 'Configuración guardada. Se usará en las Sesiones.',
      'settings.savedNotTested': 'Probá la conexión antes de usarla.',
    'settings.connectedSaved': 'Conectado a OpenCode {version}. Configuración guardada.',
    'settings.draftHint': 'Los cambios se guardan automáticamente. La prueba verifica los campos sin cambiar de página.',
    'settings.testedNotSaved': 'Conexión OK: OpenCode {version}. Aún no se guardó nada.',
      'settings.savedButton': 'Guardado',
      'settings.sectionServer': 'Servidor',
      'settings.sectionServers': 'Servidores guardados',
      'settings.sectionServersDesc': 'Conectate a distintas computadoras. Cada perfil es una máquina (HTTP por LAN o Tailscale).',
      'settings.serverActive': 'Activo',
      'settings.serverApplied': 'Servidor aplicado',
      'settings.serverNamePlaceholder': 'Nombre del perfil (ej. PC trabajo)',
      'settings.serverName': 'Nombre',
      'settings.editServer': 'Editar servidor guardado',
      'settings.saveAndApply': 'Guardar y aplicar',
      'settings.serverRemove': 'Quitar servidor',
      'settings.serverAdd': 'Agregar servidor',
      'settings.serverAddAndConnect': 'Agregar y conectar',
      'settings.serverConnectedTo': 'Conectado a',
      'settings.serverNoActive': 'Sin servidor conectado',
      'settings.serverUntitled': 'Sin nombre',
      'settings.serverNotConfigured': 'Sin configurar',
      'settings.serverUse': 'Usar',
      'settings.pairTitle': 'OpenCode v2 Pair (BETA)',
      'settings.pairDesc': 'Escaneá el QR que muestra `opencode service pair` (beta) para conectar automáticamente.',
      'settings.pairScanQr': 'Escanear QR',
      'settings.pairPaste': 'O pegar el payload',
      'settings.pairPasteHint': 'Pegá aquí el contenido del QR (URL + credenciales)',
      'settings.pairParse': 'Analizar',
      'settings.pairParsed': 'Datos de pairing detectados. Guardalos como servidor.',
      'settings.pairParseError': 'No se pudieron leer los datos de pairing. Revisá el contenido del QR.',
      'settings.pairCameraUnavailable': 'Cámara no disponible. Pegá el payload abajo.',
      'settings.pairSave': 'Guardar como servidor',
      'settings.pairNamePlaceholder': 'Nombre del perfil (ej. PC beta v2)',
      'settings.pairKind': 'BETA v2',
      'settings.apiVersion': 'Versión de API',
      'settings.apiVersionDesc': 'Dialecto de la API del server. Auto detecta v1 vs v2 (beta) al conectar.',
      'settings.apiVersionAuto': 'Auto (detectar)',
      'settings.apiVersionV1': 'v1 (clásica)',
      'settings.apiVersionV2': 'v2 (beta)',
      'settings.sectionPreferences': 'Preferencias',
      'settings.dataModeTitle': 'Modo de datos',
      'settings.dataModeDesc': 'Controla la frecuencia de consulta de red y la carga automática de datos.',
      'settings.modeFullDesc': '3.5s · ~35 KB/min · SSE + audio · datos completos',
      'settings.modeSaver': 'Equilibrio',
      'settings.modeSaverDesc': '15s · ~10 KB/min · payload completo · con audio',
      'settings.modeUltra': 'Reducido',
      'settings.modeUltraDesc': '30s · ~3.6 KB/min · sin audio · datos esenciales',
      'settings.modeMiser': 'Mínimo',
      'settings.modeMiserDesc': '60s · ~1.8 KB/min · solo texto · sin notificaciones',
      'settings.visualTheme': 'Tema visual',
      'settings.switchTheme': 'Cambiar tema',
      'detail.copySelection': 'Copiar selección',
    'settings.testOk': 'Prueba OK',
    'settings.testNeedsFields': 'Ingresa host, puerto y usuario para probar.',
    'settings.testAlreadyPassed': 'Este borrador ya pasó la prueba de conexión.',
    'settings.readyToTest': 'Listo para probar estos campos.',
    'settings.unsavedChanges': 'Cambios sin guardar: pulsa Guardar para usarlos en Sesiones.',
    'settings.noUnsavedChanges': 'La configuración guardada está activa.',
    'settings.defaultModel': 'Modelo predeterminado',
    'settings.selectModel': 'Seleccionar modelo',
    'settings.stats': 'Estadísticas de uso',
    'settings.statsPrompts': 'Prompts',
    'settings.statsSessions': 'Sesiones',
    'settings.statsTokens': 'Tokens',
    'settings.resetStats': 'Reiniciar estadísticas',
    'settings.mode': 'Modo',
    'voice.input': 'Entrada por voz',
    'voice.listening': 'Escuchando...',
    'voice.permissionDenied': 'Permiso de micrófono denegado — actívalo en los ajustes del sistema',
    'voice.unavailable': 'El reconocimiento de voz no está disponible en este dispositivo',
    'desktop.title': 'Escritorio remoto',
    'desktop.fullScreen': 'Pantalla completa',
    'desktop.monitor': 'Monitor',
    'desktop.source': 'Fuente',
    'desktop.connecting': 'Conectando…',
    'desktop.error': 'Fallo de conexión',
    'desktop.data': 'Datos',
    'desktop.dragMode': 'Arrastrar',
    'desktop.fit': 'Ajustar',
    'desktop.zoomIn': 'Acercar',
    'desktop.zoomOut': 'Alejar',
    'desktop.quality': 'Calidad',
    'desktop.preset_low': 'Baja',
    'desktop.preset_med': 'Media',
    'desktop.preset_high': 'Alta',
    'desktop.keyboard': 'Teclado',
    'desktop.kbPlaceholder': 'Escribí en la PC remota…',
    'desktop.cancel': 'Cancelar',
    'desktop.retry': 'Reintentar',
    'desktop.oneToOne': '1:1',
    'desktop.scrollMode': 'Scroll',
    'desktop.mouse': 'Mouse',
    'desktop.mouse_left': 'I',
    'desktop.mouse_right': 'D',
    'desktop.mouse_middle': 'M',
    'desktop.dpad': 'Flechas',
    'desktop.rotateHint': 'Girá el teléfono para una vista más amplia',
    'desktop.consentTitle': 'Estás en datos móviles',
    'desktop.consentBody': 'El stream puede consumir ~1-2 MB/min mientras la pantalla cambia. ¿Continuar en calidad Baja?',
    'desktop.consentContinue': 'Continuar (Baja)',
    'desktop.consentCancel': 'Cancelar',
    'desktop.disconnect': 'Desconectar',
    'desktop.statsToggle': 'Datos',
    'desktop.statsHide': 'Ocultar datos',
    'desktop.statsShow': 'Mostrar datos',
    'desktop.settings': 'Configuración',
    'session.remoteDesktop': 'Escritorio remoto',
    'settings.desktopTitle': 'Escritorio remoto',
    'settings.desktopHint': 'OpenCode Desktop Agent en la PC (desktop-agent, puerto 5901). Misma auth que el server.',
    'settings.desktopTest': 'Probar conexión',
    'settings.desktopTestOk': 'Agente de escritorio accesible',
    'settings.desktopTestFail': 'No se pudo acceder al agente de escritorio',
    'settings.desktopSaved': 'Escritorio remoto guardado',
    'settings.desktopMissing': 'Configurá host/puerto del agente de escritorio para usar escritorio remoto',
    'settings.navBarPosition': 'Barra de navegación',
    'settings.navBarBottom': 'Abajo',
    'settings.navBarHeader': 'Arriba',
    'settings.blockedModels': 'Modelos bloqueados',
    'settings.blockedModelsHint': 'Los modelos bloqueados se ocultan del selector.',
    'settings.blockedModelsSearch': 'Filtrar modelos...',
    'settings.blockedCount': '{blocked}/{total} ocultos',
    'settings.blockedShowAll': 'Mostrar todos',
    'settings.blockedHideAll': 'Ocultar todos',
    'settings.providers': 'Proveedores de IA',
    'settings.providersDesc': 'Conecta o desconecta proveedores de IA',
    'settings.connect': 'Conectar',
    'settings.disconnect': 'Desconectar',
    'settings.connected': 'Conectado',
    'settings.notConnected': 'No conectado',
    'settings.connecting': 'Conectando...',
    'settings.connectSuccess': 'Conectado exitosamente',
    'settings.connectError': 'Error de conexión',
    'settings.apiKey': 'API Key',
    'settings.apiKeyPlaceholder': 'Ingresa tu API key',
    'settings.noProviders': 'No hay proveedores disponibles. Conéctate a un servidor primero.',
    'settings.showEmpty': 'Mostrar proveedores vacíos',
    'settings.hideEmpty': 'Ocultar proveedores vacíos',
    'settings.cancel': 'Cancelar',
    'settings.offlineCache': 'Caché offline',
    'settings.offlineCacheDesc': 'Guardar sesiones y mensajes offline en IndexedDB',
    'settings.questionAuto': 'Auto-mostrar preguntas',
    'settings.questionAutoDesc': 'Mostrar automáticamente preguntas de la IA',
    'settings.permissionUI': 'Solicitudes de permiso',
    'settings.permissionUIDesc': 'Mostrar diálogos de permiso para acceso a herramientas',
    'settings.permissionRequest': 'Solicitud de permiso',
    'settings.permissionAllow': 'Permitir',
    'settings.permissionDeny': 'Denegar',
    'settings.questionPrompt': 'Pregunta de la IA',
    'settings.questionPlaceholder': 'Escribe tu respuesta...',
    'settings.questionSend': 'Enviar',
    'settings.questionSkip': 'Saltar',
'settings.featureFlags': 'Funciones adicionales',
'settings.featureFlagsDesc': 'Activa o desactiva funciones adicionales',
    'settings.fileBrowser': 'Explorador de archivos',
    'settings.fileBrowserDesc': 'Navegar archivos del proyecto desde el chat',
    'settings.inlineDiff': 'Diff inline',
    'settings.inlineDiffDesc': 'Ver cambios de archivo detallados',
    'settings.contextMenu': 'Menú contextual',
    'settings.contextMenuDesc': 'Menú al presionar mensajes (copiar, revertir)',
    'settings.planBreakdown': 'Desglose de plan',
    'settings.planBreakdownDesc': 'Mostrar tareas estructuradas del agente Plan',
    'settings.gitOps': 'Operaciones Git',
    'settings.gitOpsDesc': 'Botones Stage/Commit desde el chat',
    'settings.mcpConfig': 'Configuración MCP',
    'settings.mcpConfigDesc': 'Listar y configurar servidores MCP',
    'settings.sessionArchive': 'Archivar sesiones',
    'settings.sessionArchiveDesc': 'Ocultar sesiones archivadas de la lista',
    'settings.streamingFull': 'Streaming rápido (modo Full)',
    'settings.streamingFullDesc': 'Polling cada 1s mientras el asistente responde',
    'detail.contextMenu.copy': 'Copiar mensaje',
    'detail.contextMenu.revert': 'Revertir aquí',
    'detail.contextMenu.fork': 'Bifurcar sesión',
    'detail.queuedTitle': 'Mensajes en cola',
    'detail.queuedEmpty': 'Sin mensajes en cola',
    'detail.queuedSend': 'Enviar ahora',
    'detail.queuedRemove': 'Eliminar',
    'detail.queuedBadge': 'en cola',
    'detail.git.stage': 'Stage',
    'detail.git.unstage': 'Unstage',
    'detail.git.commit': 'Commit',
    'detail.git.commitMessage': 'Mensaje del commit',
    'detail.git.noChanges': 'Sin cambios',
    'detail.archive': 'Archivar',
    'detail.unarchive': 'Desarchivar',
    'detail.showArchived': 'Mostrar archivados',
    'detail.plan.tasks': 'Tareas del plan',
    'detail.plan.pending': 'Pendientes',
    'detail.plan.pendingCount': '{count} pendientes',
    'detail.plan.completed': 'Completadas',
    'detail.diff.viewFile': 'Ver cambios',
    'detail.diff.noChanges': 'Sin cambios en este archivo',
    'connection.connecting': 'Conectando a OpenCode...',
    'connection.loadingSessions': 'Conectando y cargando sesiones...',
    'connection.refreshing': 'Actualizando sesiones...',
    'connection.reconnecting': 'Conexión lenta; reintentando en segundo plano...',
    'connection.connected': 'Conectado',
    'connection.offline': 'OpenCode no está accesible',
    'settings.connectionFailed': 'Conexión fallida: {message}',
    'settings.connectedTo': 'Conectado a Opencode v{version}',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.themeSystem': 'Sistema',
    'settings.themeScheduled': 'Programado (día/noche)',
    'settings.themeLight': 'Claro',
    'settings.themeDark': 'Oscuro',
    'sessions.title': 'Sesiones',
    'sessions.new': 'Nueva sesión',
    'sessions.creating': 'Creando...',
    'sessions.refresh': 'Actualizar',
    'sessions.projectDirectoryLabel': 'Carpeta seleccionada',
    'sessions.projectDirectoryPlaceholder': '/home/usuario/proyecto o C:\\Proyectos\\App',
    'sessions.projectDirectoryActive': 'Las nuevas sesiones usarán {directory}.',
    'sessions.projectDirectoryDefault': 'Elige la carpeta para esta nueva sesión, o usa la carpeta por defecto del servidor.',
    'sessions.newSessionTitle': 'Carpeta de nueva sesión',
    'sessions.useServerDefault': 'Usar defecto del servidor',
    'sessions.useThisFolder': 'Crear aquí',
    'sessions.parentFolder': 'Carpeta superior',
    'sessions.folderPickerLoading': 'Cargando carpetas...',
    'sessions.folderPickerEmpty': 'No hay carpetas aquí.',
    'sessions.projectDirectoryInvalid': '{directory} no es una carpeta de proyecto OpenCode. Elige una carpeta de proyecto/worktree, o usa el valor por defecto del servidor.',
    'sessions.searchPlaceholder': 'Buscar sesiones por título o carpeta...',
    'layout.single': 'Panel único',
    'layout.twoCol': 'Dos columnas',
    'layout.twoRow': 'Dos filas',
    'layout.threeCol': 'Tres columnas',
    'layout.grid2x2': 'Cuadrícula 2×2',
    'panel.splitRight': 'Dividir a la derecha',
    'panel.splitBottom': 'Dividir hacia abajo',
    'panel.close': 'Cerrar panel',
    'panel.maximize': 'Maximizar panel',
    'panel.restore': 'Restaurar panel',
    'panel.busy': 'Trabajando…',
    'desktop.collapseSidebar': 'Contraer barra lateral',
    'desktop.expandSidebar': 'Expandir barra lateral',
    'desktop.resizeSidebar': 'Redimensionar barra lateral',
    'chat.scrollToBottom': 'Ir al final',
    'shortcuts.desktop': 'Escritorio',
    'shortcuts.panelFocus': 'Enfocar panel',
    'shortcuts.closeSplit': 'Cerrar división',
    'shortcuts.splitRight': 'Dividir a la derecha',
    'shortcuts.splitBottom': 'Dividir hacia abajo',
    'shortcuts.maximize': 'Maximizar / restaurar panel',
    'shortcuts.toggleSidebar': 'Alternar barra lateral',
    'shortcuts.newSession': 'Nueva sesión',
    'shortcuts.shortcut': 'Atajo',
    'shortcuts.action': 'Acción',
    'sessions.emptyTitle': 'No se encontraron sesiones',
    'sessions.emptyHint': 'Crea una nueva sesión para empezar',
    'sessions.newHere': 'Nueva sesión aquí',
  'sessions.selectOne': 'Seleccioná una sesión para empezar',
    'sessions.loadingTitle': 'Conectando a OpenCode',
    'sessions.loadingHint': 'Cargando sesiones. Puede tomar unos segundos en móvil o después de que el servidor se active.',
    'sessions.offlineHint': 'OpenCode aún no está accesible. Revisa Configuración o pulsa Actualizar.',
    'sessions.noFileChanges': 'Sin cambios en archivos',
    'sessions.updated': 'Actualizada {time}',
    'sessions.open': 'Abrir',
    'sessions.delete': 'Eliminar',
    'sessions.activeLabel': 'Activas',
    'sessions.recentLabel': 'Recientes',
    'detail.backToSessions': '← Sesiones',
    'detail.selectSession': 'Selecciona una sesión',
    'detail.loading': 'Cargando sesión...',
    'detail.emptyTitle': 'Aún no hay mensajes',
    'detail.emptyHint': 'Inicia una conversación abajo',
    'detail.waiting': 'Esperando...',
    'detail.send': 'Enviar',
    'detail.abort': 'Abortar',
    'detail.jumpToLatest': 'Ir al final',
    'detail.you': '👤 Tú',
    'detail.opencode': 'OpenCode',
    'detail.projectDashboardLabel': 'Panel de proyecto y VCS',
    'detail.projectLabel': 'Proyecto',
    'detail.vcsLabel': 'VCS',
    'detail.loadingProject': 'Cargando...',
    'detail.unavailable': 'No disponible',
    'detail.aheadBehind': '{ahead} adelante · {behind} atrás',
    'detail.fileStatusLabel': 'Archivos modificados',
    'detail.fileStatusSource': 'De /file/status',
    'detail.dashboardError': 'Error: {message}',
    'detail.changedFilesTitle': 'Archivos modificados',
    'detail.changedFilesHint': 'Toca un archivo para ver el diff.',
    'detail.filesCount': '{count} archivos',
    'detail.miniDiffAria': 'Mini diff de archivos modificados',
    'detail.linesAddedDeleted': '+{additions} líneas · -{deletions} líneas',
    'detail.modelPanelLabel': 'Selector de modelo AI',
    'detail.aiTitle': 'Agente y modelo AI',
    'detail.refreshAi': 'Actualizar opciones AI',
    'detail.agentTitle': 'Agente',
    'detail.agentSelectLabel': 'Agente para el próximo prompt',
    'detail.agentLoading': 'Cargando agentes configurados...',
    'detail.agentLoadError': 'No se pueden cargar los agentes: {message}',
    'detail.agentMode': 'Modo: {mode}',
    'detail.modelTitle': 'Modelo AI',
    'detail.modelHint': 'Se aplica al próximo prompt y a nuevas sesiones. Las respuestas en curso conservan su modelo original.',
    'detail.refreshModels': 'Actualizar modelos',
    'detail.modelSelectLabel': 'Modelo para el próximo prompt',
    'detail.modelSearchPlaceholder': 'Buscar modelos por nombre o proveedor...',
    'detail.modelSearchEmpty': 'Ningún modelo coincide con la búsqueda.',
    'detail.modelDefault': 'defecto',
    'detail.modelRecent': 'Recientes',
    'detail.thought': 'Thinking',
  'detail.thinking': 'Pensando…',
    'detail.modelAll': 'Todos los modelos',
    'detail.modelProvider': 'Proveedor: {provider}',
    'detail.thinkingLevel': 'Nivel de pensamiento',
    'detail.thinkingNone': 'Ninguno',
    'detail.thinkingHigh': 'Alto',
    'detail.thinkingMedium': 'Medio',
    'detail.thinkingLow': 'Bajo',
    'detail.changeModel': 'Cambiar modelo…',
    'detail.noThinkingLevels': 'Este modelo no tiene niveles de pensamiento',
    'detail.modelContext': 'Contexto {context} · salida {output}',
    'detail.modelToolsYes': 'Herramientas activadas',
    'detail.modelToolsNo': 'Sin herramientas',
    'detail.modelVariant': 'Variante: {variant}',
    'detail.modelLoading': 'Cargando modelos configurados...',
    'detail.modelLoadError': 'No se pueden cargar los modelos: {message}',
    'detail.contextStripLabel': 'Atajos de contexto de sesión',
    'detail.aiChip': 'AI',
    'detail.filesChip': 'Archivos',
    'detail.detailsChip': 'Detalles',
    'detail.sessionDetailsTitle': 'Detalles de la sesión',
    'detail.sessionDetailsHint': 'Información avanzada del proyecto, VCS, archivos y modelo.',
    'detail.closeSheet': 'Cerrar',
    'detail.exportChat': 'Exportar chat',
    'detail.snapshot': 'Instantánea',
    'detail.readingModeOn': 'Lectura',
    'detail.readingModeOff': 'Chat',
    'detail.undo': 'Deshacer último mensaje',
    'detail.redo': 'Restaurar todos los mensajes revertidos',
    'detail.redoShort': 'Restaurar mensajes',
    'detail.compact': 'Compactar sesión',
    'detail.reverted': '⏪ Sesión revertida.',
    'detail.revertToHere': 'Revertir sesión hasta este mensaje',
    'todo.title': 'Tareas pendientes',
    'todo.hide': 'Ocultar',
    'todo.show': 'Mostrar',
    'todo.more': '... y {count} más',
    'diff.filesModified': '{count} archivos modificados',
    'toolpart.wrote': 'escribió',
    'toolpart.edited': 'editó',
    'toolpart.patched': 'parcheó',
    'toolpart.subagent': 'Subagente',
    'toolpart.viewSubagent': 'Ver subagente',
    'session.deleteTitle': '¿Eliminar sesión?',
    'session.deleteBodyPrefix': 'Esto eliminará permanentemente',
    'session.cancel': 'Cancelar',
    'session.deleteConfirm': 'Eliminar sesión',
    'session.renameTitle': 'Renombrar sesión',
    'session.renamePlaceholder': 'Ingresa nuevo nombre...',
    'session.renameConfirm': 'Renombrar',
    'help.title': 'Ayuda y documentación',
    'help.overview': 'Descripción general',
    'help.server': 'Servidor',
    'help.network': 'Red',
    'help.troubleshooting': 'Solución de problemas',
    'help.commands': 'Comandos',
    'help.overview.content': '<b>Configurar Servidor:</b> Usa Configuración para ingresar host, puerto, usuario y contraseña|'
      + '<b>Probar Conexión:</b> Presiona Probar para validar la conectividad|'
      + '<b>Guardar Configuración:</b> Presiona Guardar para aplicar y comenzar|'
      + '<b>Explorar Sesiones:</b> Ve y gestiona sesiones desde la pestaña Sesiones|'
      + '<b>Interactuar:</b> Abre una sesión y chatea en la vista Detalle|'
      + '<b>Entrada Rápida:</b> Enter para enviar, Shift+Enter para nueva línea|'
      + '<b>Comandos Slash:</b> Texto que empieza con / se envía como comando',
    'help.server.content': '<b>Iniciar el Servidor OpenCode</b>|'
      + 'Inicia OpenCode con autenticación Basic Auth:|'
      + '||<b>macOS / Linux (bash/zsh)</b>|'
      + '<code>OPENCODE_SERVER_USERNAME=opencode OPENCODE_SERVER_PASSWORD=tu-clave npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>|'
      + '||<b>Windows PowerShell</b>|'
      + '<code>$env:OPENCODE_SERVER_USERNAME="opencode"; $env:OPENCODE_SERVER_PASSWORD="tu-clave"; npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>|'
      + '||<b>Windows CMD</b>|'
      + '<code>set OPENCODE_SERVER_USERNAME=opencode&amp; set OPENCODE_SERVER_PASSWORD=tu-clave&amp; npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>',
    'help.network.content': '<b>Modo LAN (Recomendado)</b> Usa la IP local de tu PC para dispositivos en la misma red|'
      + 'Ejemplo: 192.168.1.61|'
      + '||<b>Modo WAN (Avanzado)</b>|'
      + 'Configura NAT/reenvío de puertos en tu router|'
      + 'Configura una VPN para acceso remoto seguro|'
      + 'Usa un proxy inverso con TLS/HTTPS|'
      + '||<b>Requisitos de Seguridad</b>|'
      + 'Abrir puerto TCP 4096 en el firewall del SO|'
      + 'Configurar reenvío de puertos en el router|'
      + 'Usar contraseñas de autenticación fuertes|'
      + 'Preferir TLS/HTTPS para acceso externo|'
      + 'Restringir IPs de origen cuando sea posible|'
      + 'Nunca exponer sin autenticación',
    'help.troubleshooting.content': '<b>Diagnóstico de Conexión</b>|'
      + '1. Verificar Servidor: Comprueba que OpenCode escuche en el puerto 4096|'
      + '2. Probar Local: Verifica el health endpoint desde la misma máquina|'
      + '3. Probar Red: Verifica el health endpoint desde el navegador del celular|'
      + '4. Verificar Firewall: Asegura que el puerto 4096 esté abierto|'
      + '||<b>Comandos de Verificación</b>|'
      + '<code>curl -u opencode:tu-clave http://127.0.0.1:4096/global/health</code>|'
      + '<code>curl -u opencode:tu-clave http://IP_DE_TU_PC:4096/global/health</code>|'
      + '||<b>Problemas Comunes</b>|'
      + 'Errores CORS: Agrega flags --cors al servidor|'
      + 'Timeouts: Revisa la configuración del firewall|'
      + 'Fallos de Auth: Verifica usuario/contraseña',
    'help.commands.content': 'Los comandos locales son manejados por la app. Los comandos del servidor se cargan desde OpenCode.',
    'help.commands.serverTab': 'Comandos del Servidor',
    'help.commands.skillsTab': 'Skills',
    'help.commands.empty': 'No hay {type} disponibles',
    'help.commands.emptyConnected': 'Conéctate a un servidor para ver los comandos y skills disponibles',
    'session.fork': 'Bifurcar',
    'session.more': 'Más',
    'session.searchMessages': 'Buscar mensajes',
    'session.archived': 'Archivadas',
    'session.themeCreator': 'Creador de temas',
    'session.compact': 'Compactar',
    'session.tokenStats': 'Estadísticas de tokens',
    'session.exportMd': 'Exportar .md',
    'session.files': 'Archivos',
    'session.skills': 'Habilidades',
    'session.terminal': 'Terminal',
    'session.reboot': 'Reiniciar PC',
    'session.rebootConfirm': 'La PC se reiniciará en 10 segundos. ¿Continuar?',
    'session.rebootAction': 'Reiniciar ahora',
    'session.rebootCancel': 'Cancelar',
    'session.mcpBrowser': 'Explorador MCP',
    'session.shortcuts': 'Atajos',
    'session.pendingCount': '{count} pendientes',
    'session.realtime': 'Tiempo real',
    'session.reconnecting': 'Reconectando...',
    'session.removeImage': 'Quitar',
    'session.rename': 'Renombrar',
    'session.undo': 'Deshacer',
    'session.redo': 'Rehacer',
    'session.browseFiles': 'Explorar archivos',
    'session.mcpResources': 'Recursos MCP',
    'sessions.count': '{count} sesiones',
    'sessions.recentDismiss': '¿Quitar de recientes?',
    'common.yes': 'Sí',
    'common.no': 'No',
    'favorites.label': 'Favoritos',
    'favorites.add': 'Añadir a favoritos',
    'favorites.remove': 'Quitar de favoritos',
    'session.statusBusy': 'Ocupado',
    'session.statusRetry': 'Reintento',
    'archived.empty': 'No hay sesiones archivadas',
    'archived.restore': 'Restaurar',
    'archived.open': 'Abrir',
    'terminal.placeholder': 'Escribe un comando para ejecutar en el shell del proyecto',
    'skills.searchPlaceholder': 'Buscar habilidades...',
    'skills.loading': 'Cargando...',
    'skills.empty': 'No se encontraron habilidades',
    'subagent.parent': 'Padre',
    'themeCreator.name': 'Nombre del tema',
    'themeCreator.copyJson': 'Copiar JSON',
    'themeCreator.preview': 'Vista previa',
    'common.apply': 'Aplicar',
    'themePicker.current': 'actual',
    'themePicker.searchPlaceholder': 'Buscar temas...',
    'themePicker.noMatch': 'Ningún tema coincide con "{query}"',
    'mcpBrowser.loading': 'Cargando...',
    'session.restore': 'Restaurar',
    'session.archiveView': 'Sesiones archivadas',
    'notification.completionTitle': 'OpenCode Completado',
    'notification.completionBody': 'El asistente terminó de responder',
    'notification.questionTitle': 'Pregunta del AI',
    'notification.questionBody': 'El AI tiene una pregunta para ti',
    'notification.errorBody': 'Ocurrió un error',
    'mcpBrowser.title': 'Recursos MCP',
    'mcpBrowser.empty': 'No hay recursos MCP disponibles',
    'mcpBrowser.search': 'Buscar recursos...',
    'fileEditor.title': 'Editor de Archivos',
    'fileEditor.save': 'Guardar',
  'fileEditor.saving': 'Guardando...',
  'fileEditor.readOnly': 'Solo lectura',
  'fileEditor.loading': 'Cargando archivo...',
    'fileEditor.noChanges': 'Sin cambios',
    'terminal.title': 'Terminal',
    'terminal.clear': 'Limpiar',
    'terminal.input': 'Ingresa comando shell',
    'terminal.welcome': 'Escribe un comando para ejecutar en el shell del proyecto',
    'shortcuts.title': 'Atajos de Teclado',
    'favorites.manage': 'Gestionar Favoritos',
    'favorites.saveOrder': 'Guardar Orden',
    'favorites.empty': 'Sin favoritos aún',
    'offlineQueue.pending': 'Acciones pendientes en cola',
    'settings.chatCustomization': 'Personalización del chat',
    'settings.chatCustomizationDesc': 'Personalizá lo que se ve en el chat',
    'settings.chatFontSize': 'Tamaño de letra',
    'settings.chatSpacing': 'Espaciado',
    'settings.chatSpacingCompact': 'Compacto',
    'settings.chatSpacingNormal': 'Normal',
    'settings.chatSpacingComfortable': 'Cómodo',
    'settings.chatShowThinking': 'Mostrar razonamiento',
    'settings.chatShowTools': 'Mostrar herramientas (tools)',
    'settings.chatShowTime': 'Mostrar hora',
    'settings.chatShowTodo': 'Botón de tareas',
    'settings.chatShowModelInfo': 'Mostrar info del modelo',
    'settings.chatShowDiffs': 'Mostrar diffs de archivos',
    'settings.chatShowSubagents': 'Mostrar hint de subagentes',
    'settings.chatShowCompaction': 'Mostrar checkpoint de compactación',
    'settings.chatShowImages': 'Mostrar imágenes',
    'settings.chatBubbleRadius': 'Radio de burbujas',
    'settings.chatMaxWidth': 'Ancho del mensaje',
    'settings.chatWidthNormal': 'Normal',
    'settings.chatWidthWide': 'Ancho',
    'settings.chatWidthFull': 'Completo',
    'settings.chatFontFamily': 'Tipografía',
    'settings.chatFontSystem': 'Sistema',
    'settings.chatFontSerif': 'Serif',
    'settings.chatFontMono': 'Monoespaciada',
    'settings.chatPreviewUser': 'Tu mensaje con este tamaño de letra',
    'settings.chatPreviewAssistant': 'Respuesta de ejemplo del asistente para ver cómo se ve el texto',
    'settings.chatCompactTools': 'Tools compactos (una línea)',
    'settings.chatCompletionSound': 'Sonido al completar',
    'settings.chatBg': 'Fondo del chat',
    'settings.chatBgDefault': 'Predeterminado',
    'settings.chatBgIndigo': 'Índigo',
    'settings.chatBgAmber': 'Ámbar',
    'settings.chatBgGreen': 'Verde',
    'settings.chatBgSolid': 'Sólido',
    'settings.chatUserBubble': 'Color de tu burbuja',
    'settings.chatAccent': 'Color de acento',
    'settings.chatResetColor': 'Restaurar tema',
    'settings.chatCharLimit': 'Límite de caracteres',
    'settings.chatCharLimitOff': 'Sin límite',
    'settings.snippets': 'Snippets de prompts',
    'settings.snippetsDesc': 'Plantillas de prompts reutilizables, disponibles desde el composer',
    'settings.snippetsEmpty': 'Todavía no hay snippets — agregá el primero arriba.',
    'settings.snippetName': 'Nombre',
    'settings.snippetText': 'Texto del prompt',
    'settings.snippetAdd': 'Agregar snippet',
    'settings.snippetRemove': 'Eliminar snippet',
    'composer.snippets': 'Insertar snippet',
    'common.cancel': 'Cancelar',
    'chat.moreActions': 'Acciones del mensaje',
    'chat.copyText': 'Copiar texto',
    'chat.regenerate': 'Regenerar respuesta',
    'image.editorTitle': 'Editar imagen',
    'image.crop': 'Recortar',
    'image.draw': 'Dibujar',
    'image.undo': 'Deshacer',
    'image.apply': 'Aplicar',
    'image.close': 'Cerrar',
    'image.brushColor': 'Color del pincel',
    'image.brushSize': 'Grosor del pincel',
    'sessions.select': 'Seleccionar sesiones',
    'sessions.cancelSelect': 'Cancelar',
    'sessions.selectedCount': '{count} seleccionadas',
    'sessions.deleteSelected': 'Borrar',
    'sessions.deleteManyConfirm': '¿Borrar {count} sesiones? Esta acción no se puede deshacer.',
    'settings.testAgain': 'Probar de nuevo',
    'settings.testAgainTitle': 'Conexión ya verificada — probar de nuevo',
    'chat.prompts': 'Prompts',
    'chat.insertPrompt': 'Insertar en el composer',
    'chat.sendPrompt': 'Enviar ahora',
    'prompts.explain': 'Explicar código',
    'prompts.explainText': 'Actuá como un ingeniero senior.\n\nExplicá el código de abajo (pegálo o señalá un archivo):\n<code>\n[PEGÁ EL CÓDIGO ACÁ]\n</code>\n\nCubrí:\n1. Qué hace (propósito, entradas, salidas)\n2. Cómo funciona (funciones clave, flujo de datos, lógica importante)\n3. Problemas potenciales (bugs, edge cases, mantenibilidad)\n\nFormato: secciones cortas con encabezados. Usá referencias archivo:línea cuando sea posible.',
    'prompts.review': 'Revisar cambios',
    'prompts.reviewText': 'Actuá como un revisor senior.\n\nRevisá los cambios recientes de este proyecto (git diff). Por cada hallazgo:\n- Severidad (crítico/mayor/menor/nit)\n- Archivo y línea\n- Por qué importa\n- Fix concreto\n\nPriorizá primero corrección y seguridad. Sé conciso — solo problemas reales.',
    'prompts.bugs': 'Buscar bugs',
    'prompts.bugsText': 'Actuá como un experto en debugging.\n\nAnalizá este código (pegálo o señalá un archivo):\n<code>\n[PEGÁ EL CÓDIGO ACÁ]\n</code>\n\nBuscá:\n1. Bugs de lógica y condiciones de carrera\n2. Edge cases que crashean o corrompen estado\n3. Fugas de recursos (memoria, sockets, listeners)\n\nPor cada uno: archivo:línea, escenario que lo dispara, esperado vs actual, sugerencia de fix.',
    'prompts.tests': 'Escribir tests',
    'prompts.testsText': 'Actuá como ingeniero de tests.\n\nEscribí tests para el código de este archivo usando las convenciones de tests del proyecto.\n\nCubrí:\n1. Happy path (flujo principal)\n2. Edge cases (vacío, null, límites)\n3. Caminos de error\n\nSalida: el archivo de test completo y ejecutable, con un comentario corto por caso describiendo el escenario.',
    'prompts.optimize': 'Optimizar rendimiento',
    'prompts.optimizeText': 'Actuá como ingeniero de performance.\n\nAnalizá este código (pegálo o señalá un archivo):\n<code>\n[PEGÁ EL CÓDIGO ACÁ]\n</code>\n\nBuscá:\n1. Problemas de complejidad temporal (O(n²) oculto, consultas N+1)\n2. Allocaciones en loops calientes\n3. Problemas de render/bundle (si es frontend)\n\nPor cada uno: estimación de impacto, dónde ocurre, fix concreto. Mantené el comportamiento idéntico.',
    'prompts.refactor': 'Refactorizar',
    'prompts.refactorText': 'Actuá como arquitecto senior.\n\nRefactorizá este código (pegálo o señalá un archivo):\n<code>\n[PEGÁ EL CÓDIGO ACÁ]\n</code>\n\nReglas:\n- Seguí SRP y DRY\n- NO cambies el comportamiento ni la API pública\n- Preferí pasos chicos y seguros\n\nSalida: el código refactorizado + una lista breve de qué cambió y por qué.',
    'prompts.docs': 'Documentar',
    'prompts.docsText': 'Actuá como escritor técnico.\n\nDocumentá este archivo (pegálo o señalá un archivo):\n<code>\n[PEGÁ EL CÓDIGO ACÁ]\n</code>\n\nIncluí:\n1. Qué hace el módulo/archivo (2-3 oraciones)\n2. Funciones/clases principales con descripción de una línea\n3. Ejemplo de uso\n4. Trampas (dependencias, efectos secundarios)\n\nMantenelo corto y práctico — sin relleno.',
    'prompts.commit': 'Mensaje de commit',
    'prompts.commitText': 'Actuá como experto en git.\n\nRevisá los cambios actuales (git status / git diff --stat) y escribí un mensaje de commit.\n\nSeguí conventional commits: tipo(scope): resumen corto\n- tipo: feat|fix|refactor|docs|test|chore|perf\n- Scope opcional pero útil\n- Cuerpo: por qué (no qué) en 2-4 bullets\n\nSalida: solo el mensaje final, listo para pegar.',
    'prompts.debug': 'Debug de error',
    'prompts.debugText': 'Actuá como experto en debugging.\n\nTengo este error:\n<error>\n[PEGÁ EL ERROR ACÁ]\n</error>\n\nContexto (completá):\n- Qué estaba haciendo: \n- Esperado: \n- Actual: \n\nPasos:\n1. Explicá la causa raíz con el camino de código relevante\n2. Proponé un fix (cambio mínimo)\n3. Sugerí cómo verificarlo',
    'prompts.explainSimple': 'Explicar simple',
    'prompts.explainSimpleText': 'Explicá este código como a un dev junior (pegálo o señalá un archivo):\n<code>\n[PEGÁ EL CÓDIGO ACÁ]\n</code>\n\nUsá analogías y lenguaje simple.\n\nEstructura:\n1. Resumen de un párrafo en palabras simples\n2. Recorrido línea por línea de las partes importantes\n3. 2-3 cosas que podrían salir mal\n\nSin jerga sin explicarla antes.',
    'prompts.summarize': 'Resumir conversación',
    'prompts.summarizeText': 'Resumí esta conversación.\n\nEstructura:\n1. Objetivo — qué se estaba haciendo\n2. Acciones — qué se implementó/cambió (archivos, decisiones)\n3. Resultados — qué funciona y qué queda pendiente\n4. Próximos pasos — seguimientos recomendados\n\nMantenelo en menos de 150 palabras. Solo bullets.',
    'prompts.security': 'Revisión de seguridad',
    'prompts.securityText': 'Actuá como auditor de seguridad.\n\nRevisá este código (pegálo o señalá un archivo):\n<code>\n[PEGÁ EL CÓDIGO ACÁ]\n</code>\n\nVerificá:\n1. Secrets/credenciales en código o logs\n2. Inyección (SQL, comandos, XSS, prompt injection)\n3. Manejo inseguro de input y huecos de auth/autorización\n\nPor cada hallazgo: severidad, archivo:línea, escenario de explotación, fix. Ignorá problemas teóricos sin camino real.',
    'settings.enabled': 'Activado',
    'settings.disabled': 'Desactivado',
    'settings.chatReset': 'Restaurar valores por defecto',
    'settings.extras': 'Extras',
    'settings.extrasDesc': 'Herramientas adicionales',
    'extras.shutdownHost': 'Apagar computadora huesped',
    'extras.shutdownHostDesc': 'Envía un comando de apagado a la computadora que ejecuta el servidor OpenCode',
    'extras.shutdownConfirmTitle': '¿Apagar la computadora huesped?',
    'extras.shutdownConfirmBody': 'La computadora que ejecuta el servidor OpenCode se apagará. Esta acción no se puede deshacer.',
    'extras.shutdownConfirm': 'Apagar',
    'extras.shutdownCancel': 'Cancelar',
    'extras.shutdownSent': 'Comando de apagado enviado',
    'extras.shutdownFailed': 'Error al enviar el comando de apagado: {error}',
    'extras.shutdownNoSession': 'Necesitás una sesión activa para apagar la computadora',
'extras.restartHost': 'Reiniciar computadora huesped',
'extras.restartHostDesc': 'Reinicia la computadora que ejecuta el servidor OpenCode',
'extras.restartConfirmTitle': '¿Reiniciar la computadora huesped?',
'extras.restartConfirmBody': 'La computadora que ejecuta el servidor OpenCode se reiniciará en 10 segundos. Esta acción no se puede deshacer.',
'extras.restartConfirm': 'Reiniciar ahora',
'extras.restartCancel': 'Cancelar',
'extras.restartSent': 'Comando de reinicio enviado',
'extras.restartFailed': 'Error al enviar el comando de reinicio: {error}',
    'extras.github': 'Ir al GitHub del proyecto',
    'extras.dataUsage': 'Consumo de datos',
    'settings.serverApplyAndSave': 'Usar y guardar',
    'settings.serverSaveOnly': 'Solo guardar',
    'favorites.manageDesc': 'Reordenar sesiones favoritas',
    'session.archivedDesc': 'Ver sesiones archivadas',
    'session.shortcutsDesc': 'Referencia de atajos de teclado',
    'session.queueToggle': 'Cola',
    'session.queueToggleOn': 'Cola activada - los mensajes se envían automáticamente cuando el asistente termina',
    'session.queueToggleOff': 'Cola desactivada',
    'dataUsage.title': 'Consumo de datos',
    'dataUsage.day': 'Día',
    'dataUsage.week': 'Semana',
    'dataUsage.month': 'Mes',
    'dataUsage.up': 'Subida',
    'dataUsage.down': 'Descarga',
    'dataUsage.total': 'Total',
    'dataUsage.reset': 'Reiniciar contador',
    'dataUsage.mobile': 'Móvil',
    'dataUsage.wifi': 'WiFi',
    'themeCreator.title': 'Creador de Temas',
    'nav.stats': 'Estadísticas',
    'settings.serverStats': 'Estadísticas del servidor',
    'stats.title': 'Estadísticas',
    'stats.refresh': 'Actualizar',
    'stats.loading': 'Leyendo base de datos...',
    'stats.error': 'Error',
    'stats.empty': 'Sin datos (¿el servidor opencode-stats está corriendo?)',
    'stats.metaLine': '{sessions} sesiones · {models} modelos · {since} → {until} · costo medio {avg}/sesión · DB: {db}',
    'stats.filterSince': 'Desde',
    'stats.filterUntil': 'Hasta',
    'stats.filterModel': 'Modelo',
    'stats.apply': 'Aplicar',
    'stats.port': 'Puerto de estadísticas',
    'stats.portHint': 'Puerto del servidor opencode-stats en la PC (default 8765)',
    'stats.cost': 'Costo total',
    'stats.estCost': 'est.',
    'stats.mostExpensive': 'Sesión más cara',
    'stats.mostTokens': 'Sesión con más tokens',
    'stats.avgInput': 'Input medio por sesión',
    'stats.costPerDay': 'Costo por día',
    'stats.costPerModel': 'Costo por modelo',
    'stats.prices': 'Precios por 1M tokens (USD)',
    'stats.tabOverview': 'Resumen',
    'stats.tabModel': 'Por modelo',
    'stats.tabProject': 'Por proyecto',
    'stats.tabDay': 'Por día',
    'stats.tabMonth': 'Por mes',
    'stats.tabSessions': 'Sesiones',
    'stats.tabLimits': 'Límites y precios',
    'stats.setupTitle': 'Activá en tu PC',
    'stats.setupHint': 'Doble clic en start-stats.bat (o ejecutá este comando) en la computadora donde corre opencode. Abre el puerto 8765 del firewall automáticamente.',
    'stats.setupCopy': 'Copiar comando',
    'stats.setupCopied': '¡Copiado!'
  },
  it: {
    'app.title': 'OpenCode Mobile',
    'app.exitTitle': 'Chiudere app?',
    'app.exitMessage': 'Sei sicuro di voler uscire?',
    'app.exitOk': 'Chiudi',
    'app.exitCancel': 'Annulla',
    'error.title': 'Errore',
    'error.close': 'Chiudi',
    'nav.settings': 'Impostazioni',
    'nav.sessions': 'Sessioni',
    'nav.detail': 'Dettaglio',
    'nav.help': 'Aiuto',
    'nav.lightMode': 'Passa alla modalità chiara',
    'nav.darkMode': 'Passa alla modalità scura',
    'composer.inputLabel': 'Messaggio per OpenCode',
    'composer.send': 'Invia',
    'composer.stop': 'Ferma',
    'menu.title': 'Menu',
    'menu.settingsDescription': 'Configura connessione server',
    'menu.sessionsDescription': 'Gestisci le sessioni',
    'menu.detailDescription': 'Chatta con OpenCode',
    'menu.helpDescription': 'Documentazione e supporto',
    'settings.title': 'Configurazione server',
    'settings.host': 'Indirizzo host',
    'settings.hostPlaceholder': '192.168.1.100, localhost o https://example.com',
    'settings.port': 'Porta',
    'settings.username': 'Username',
    'settings.password': 'Password',
    'settings.passwordPlaceholder': 'Opzionale; lascia vuoto per server locale non protetto',
    'settings.save': 'Salva configurazione',
    'settings.saving': 'Salvataggio...',
    'settings.test': 'Test connessione',
    'settings.testing': 'Test...',
    'settings.testingConnection': 'Test connessione...',
      'settings.saved': 'Configurazione salvata. Verrà usata nelle Sessioni.',
      'settings.savedNotTested': 'Prova la connessione prima di usarla.',
    'settings.connectedSaved': 'Connesso a OpenCode {version}. Configurazione salvata.',
    'settings.draftHint': 'Le modifiche vengono salvate automaticamente. Test controlla i campi qui sotto senza cambiare pagina.',
    'settings.testedNotSaved': 'Connessione OK: OpenCode {version}. Non è stato ancora salvato nulla.',
      'settings.savedButton': 'Salvato',
      'settings.sectionServer': 'Server',
      'settings.sectionServers': 'Server salvati',
      'settings.sectionServersDesc': 'Connettiti a computer diversi. Ogni profilo è una macchina (HTTP via LAN o Tailscale).',
      'settings.serverActive': 'Attivo',
      'settings.serverApplied': 'Server applicato',
      'settings.serverNamePlaceholder': 'Nome profilo (es. PC lavoro)',
      'settings.serverName': 'Nome',
      'settings.editServer': 'Modifica server salvato',
      'settings.saveAndApply': 'Salva e applica',
      'settings.serverRemove': 'Rimuovi server',
      'settings.serverAdd': 'Aggiungi server',
      'settings.serverAddAndConnect': 'Aggiungi e connetti',
      'settings.serverConnectedTo': 'Connesso a',
      'settings.serverNoActive': 'Nessun server connesso',
      'settings.serverUntitled': 'Senza nome',
      'settings.serverNotConfigured': 'Non configurato',
      'settings.serverUse': 'Usa',
      'settings.pairTitle': 'OpenCode v2 Pair (BETA)',
      'settings.pairDesc': 'Scansiona il QR mostrato da `opencode service pair` (beta) per connetterti automaticamente.',
      'settings.pairScanQr': 'Scansiona QR',
      'settings.pairPaste': 'Oppure incolla il payload',
      'settings.pairPasteHint': 'Incolla qui il contenuto del QR (URL + credenziali)',
      'settings.pairParse': 'Analizza',
      'settings.pairParsed': 'Dati di pairing rilevati. Salvali come server.',
      'settings.pairParseError': 'Impossibile leggere i dati di pairing. Controlla il contenuto del QR.',
      'settings.pairCameraUnavailable': 'Fotocamera non disponibile. Incolla il payload qui sotto.',
      'settings.pairSave': 'Salva come server',
      'settings.pairNamePlaceholder': 'Nome profilo (es. PC beta v2)',
      'settings.pairKind': 'BETA v2',
      'settings.apiVersion': 'Versione API',
      'settings.apiVersionDesc': 'Dialetto API del server. Auto rileva v1 vs v2 (beta) alla connessione.',
      'settings.apiVersionAuto': 'Auto (rileva)',
      'settings.apiVersionV1': 'v1 (classica)',
      'settings.apiVersionV2': 'v2 (beta)',
      'settings.sectionPreferences': 'Preferenze',
      'settings.dataModeTitle': 'Modalità dati',
      'settings.dataModeDesc': 'Controlla la frequenza di polling di rete e il caricamento automatico dei dati.',
      'settings.modeFullDesc': '3.5s · ~35 KB/min · SSE + audio · dati completi',
      'settings.modeSaver': 'Bilanciato',
      'settings.modeSaverDesc': '15s · ~10 KB/min · payload completo · con audio',
      'settings.modeUltra': 'Ridotto',
      'settings.modeUltraDesc': '30s · ~3.6 KB/min · senza audio · dati essenziali',
      'settings.modeMiser': 'Minimo',
      'settings.modeMiserDesc': '60s · ~1.8 KB/min · solo testo · senza notifiche',
      'settings.visualTheme': 'Tema visivo',
      'settings.switchTheme': 'Cambia tema',
      'detail.copySelection': 'Copia selezione',
    'settings.testOk': 'Test OK',
    'settings.testNeedsFields': 'Inserisci host, porta e username per fare il test.',
    'settings.testAlreadyPassed': 'Questa bozza ha già superato il test connessione.',
    'settings.readyToTest': 'Campi pronti per il test.',
    'settings.unsavedChanges': 'Modifiche non salvate: tocca Salva per usarle nelle Sessioni.',
    'settings.noUnsavedChanges': 'Le impostazioni salvate sono attive.',
    'settings.defaultModel': 'Modello predefinito',
    'settings.selectModel': 'Seleziona un modello',
    'settings.stats': 'Statistiche di utilizzo',
    'settings.statsPrompts': 'Prompt',
    'settings.statsSessions': 'Sessioni',
    'settings.statsTokens': 'Token',
    'settings.resetStats': 'Reimposta statistiche',
    'settings.mode': 'Modalità',
    'voice.input': 'Input vocale',
    'voice.listening': 'Ascolto...',
    'voice.permissionDenied': 'Permesso microfono negato — attivalo nelle impostazioni di sistema',
    'voice.unavailable': 'Il riconoscimento vocale non è disponibile su questo dispositivo',
    'desktop.title': 'Desktop remoto',
    'desktop.fullScreen': 'Schermo intero',
    'desktop.monitor': 'Monitor',
    'desktop.source': 'Sorgente',
    'desktop.connecting': 'Connessione…',
    'desktop.error': 'Connessione fallita',
    'desktop.data': 'Dati',
    'desktop.dragMode': 'Trascina',
    'desktop.fit': 'Adatta',
    'desktop.zoomIn': 'Ingrandisci',
    'desktop.zoomOut': 'Rimpicciolisci',
    'desktop.quality': 'Qualità',
    'desktop.preset_low': 'Bassa',
    'desktop.preset_med': 'Media',
    'desktop.preset_high': 'Alta',
    'desktop.keyboard': 'Tastiera',
    'desktop.kbPlaceholder': 'Scrivi sul PC remoto…',
    'desktop.cancel': 'Annulla',
    'desktop.retry': 'Riprova',
    'desktop.oneToOne': '1:1',
    'desktop.scrollMode': 'Scroll',
    'desktop.mouse': 'Mouse',
    'desktop.mouse_left': 'S',
    'desktop.mouse_right': 'D',
    'desktop.mouse_middle': 'M',
    'desktop.dpad': 'Frecce',
    'desktop.rotateHint': 'Ruota il telefono per una vista più ampia',
    'desktop.consentTitle': 'Sei in dati mobili',
    'desktop.consentBody': 'Lo streaming può consumare ~1-2 MB/min mentre lo schermo cambia. Continuare in qualità Bassa?',
    'desktop.consentContinue': 'Continua (Bassa)',
    'desktop.consentCancel': 'Annulla',
    'desktop.disconnect': 'Disconnetti',
    'desktop.statsToggle': 'Dati',
    'desktop.statsHide': 'Nascondi dati',
    'desktop.statsShow': 'Mostra dati',
    'desktop.settings': 'Impostazioni',
    'session.remoteDesktop': 'Desktop remoto',
    'settings.desktopTitle': 'Desktop remoto',
    'settings.desktopHint': 'OpenCode Desktop Agent sul PC (desktop-agent, porta 5901). Stessa auth del server.',
    'settings.desktopTest': 'Test connessione',
    'settings.desktopTestOk': 'Agente desktop raggiungibile',
    'settings.desktopTestFail': 'Impossibile raggiungere l\'agente desktop',
    'settings.desktopSaved': 'Desktop remoto salvato',
    'settings.desktopMissing': 'Configura host/porta dell\'agente desktop per usare il desktop remoto',
    'settings.navBarPosition': 'Barra di navigazione',
    'settings.navBarBottom': 'In basso',
    'settings.navBarHeader': 'In alto',
    'settings.blockedModels': 'Modelli bloccati',
    'settings.blockedModelsHint': 'I modelli bloccati sono nascosti dal selettore.',
    'settings.blockedModelsSearch': 'Filtra modelli...',
    'settings.blockedCount': '{blocked}/{total} nascosti',
    'settings.blockedShowAll': 'Mostra tutti',
    'settings.blockedHideAll': 'Nascondi tutti',
    'settings.providers': 'Provider IA',
    'settings.providersDesc': 'Connetti o disconnetti provider IA',
    'settings.connect': 'Connetti',
    'settings.disconnect': 'Disconnetti',
    'settings.connected': 'Connesso',
    'settings.notConnected': 'Non connesso',
    'settings.connecting': 'Connessione...',
    'settings.connectSuccess': 'Connesso con successo',
    'settings.connectError': 'Errore di connessione',
    'settings.apiKey': 'Chiave API',
    'settings.apiKeyPlaceholder': 'Inserisci la tua chiave API',
    'settings.noProviders': 'Nessun provider disponibile. Connettiti prima a un server.',
    'settings.showEmpty': 'Mostra provider vuoti',
    'settings.hideEmpty': 'Nascondi provider vuoti',
    'settings.cancel': 'Annulla',
    'settings.offlineCache': 'Cache offline',
    'settings.offlineCacheDesc': 'Salva sessioni e messaggi offline in IndexedDB',
    'settings.questionAuto': 'Mostra domande automaticamente',
    'settings.questionAutoDesc': 'Mostra automaticamente le domande dell\'IA',
    'settings.permissionUI': 'Richiesta permessi',
    'settings.permissionUIDesc': 'Mostra finestre di permesso per accesso strumenti',
    'settings.permissionRequest': 'Richiesta di permesso',
    'settings.permissionAllow': 'Consenti',
    'settings.permissionDeny': 'Nega',
    'settings.questionPrompt': 'Domanda IA',
    'settings.questionPlaceholder': 'Scrivi la tua risposta...',
    'settings.questionSend': 'Invia',
    'settings.questionSkip': 'Salta',
'settings.featureFlags': 'Funzionalità aggiuntive',
'settings.featureFlagsDesc': 'Attiva o disattiva funzionalità aggiuntive',
    'settings.fileBrowser': 'Esplora file',
    'settings.fileBrowserDesc': 'Naviga i file del progetto dalla chat',
    'settings.inlineDiff': 'Diff inline',
    'settings.inlineDiffDesc': 'Vedi modifiche dettagliate ai file',
    'settings.contextMenu': 'Menu contestuale',
    'settings.contextMenuDesc': 'Menu alla pressione dei messaggi (copia, ripristina)',
    'settings.planBreakdown': 'Suddivisione piano',
    'settings.planBreakdownDesc': 'Mostra attività strutturate dell\'agente Plan',
    'settings.gitOps': 'Operazioni Git',
    'settings.gitOpsDesc': 'Pulsanti Stage/Commit dalla chat',
    'settings.mcpConfig': 'Configurazione MCP',
    'settings.mcpConfigDesc': 'Elenca e configura server MCP',
    'settings.sessionArchive': 'Archivia sessioni',
    'settings.sessionArchiveDesc': 'Nascondi sessioni archiviate dall\'elenco',
    'settings.streamingFull': 'Streaming veloce (modalità Full)',
    'settings.streamingFullDesc': 'Polling ogni 1s mentre l\'assistente risponde',
    'detail.contextMenu.copy': 'Copia messaggio',
    'detail.contextMenu.revert': 'Ripristina qui',
    'detail.contextMenu.fork': 'Duplica sessione',
    'detail.queuedTitle': 'Prompt in coda',
    'detail.queuedEmpty': 'Nessun prompt in coda',
    'detail.queuedSend': 'Invia ora',
    'detail.queuedRemove': 'Rimuovi',
    'detail.queuedBadge': 'in coda',
    'detail.git.stage': 'Stage',
    'detail.git.unstage': 'Unstage',
    'detail.git.commit': 'Commit',
    'detail.git.commitMessage': 'Messaggio commit',
    'detail.git.noChanges': 'Nessuna modifica',
    'detail.archive': 'Archivia',
    'detail.unarchive': 'Disarchivia',
    'detail.showArchived': 'Mostra archiviati',
    'detail.plan.tasks': 'Attività del piano',
    'detail.plan.pending': 'In sospeso',
    'detail.plan.pendingCount': '{count} in sospeso',
    'detail.plan.completed': 'Completate',
    'detail.diff.viewFile': 'Vedi modifiche',
    'detail.diff.noChanges': 'Nessuna modifica in questo file',
    'connection.connecting': 'Connessione a OpenCode...',
    'connection.loadingSessions': 'Connessione e caricamento sessioni...',
    'connection.refreshing': 'Aggiornamento sessioni...',
    'connection.reconnecting': 'Connessione lenta; riprovo in silenzio...',
    'connection.connected': 'Connesso',
    'connection.offline': 'OpenCode non è raggiungibile',
    'settings.connectionFailed': 'Connessione fallita: {message}',
    'settings.connectedTo': 'Connesso a OpenCode v{version}',
    'settings.language': 'Lingua',
    'settings.theme': 'Tema',
    'settings.themeSystem': 'Sistema',
    'settings.themeScheduled': 'Programmato (giorno/notte)',
    'settings.themeLight': 'Chiaro',
    'settings.themeDark': 'Scuro',
    'sessions.title': 'Sessioni',
    'sessions.new': 'Nuova sessione',
    'sessions.creating': 'Creazione...',
    'sessions.refresh': 'Aggiorna',
    'sessions.projectDirectoryLabel': 'Cartella selezionata',
    'sessions.projectDirectoryPlaceholder': '/home/utente/progetto o C:\\Projects\\App',
    'sessions.projectDirectoryActive': 'La nuova sessione userà {directory}.',
    'sessions.projectDirectoryDefault': 'Scegli la cartella per questa nuova sessione, oppure usa la directory predefinita del server.',
    'sessions.newSessionTitle': 'Cartella nuova sessione',
    'sessions.useServerDefault': 'Usa default server',
    'sessions.useThisFolder': 'Crea qui',
    'sessions.parentFolder': 'Cartella superiore',
    'sessions.folderPickerLoading': 'Caricamento cartelle...',
    'sessions.folderPickerEmpty': 'Nessuna cartella qui.',
    'sessions.projectDirectoryInvalid': '{directory} non è una cartella progetto OpenCode. Scegli una cartella progetto/worktree oppure usa il default del server.',
    'sessions.searchPlaceholder': 'Cerca sessioni per titolo o cartella...',
    'layout.single': 'Pannello singolo',
    'layout.twoCol': 'Due colonne',
    'layout.twoRow': 'Due righe',
    'layout.threeCol': 'Tre colonne',
    'layout.grid2x2': 'Griglia 2×2',
    'panel.splitRight': 'Dividi a destra',
    'panel.splitBottom': 'Dividi in basso',
    'panel.close': 'Chiudi pannello',
    'panel.maximize': 'Massimizza pannello',
    'panel.restore': 'Ripristina pannello',
    'panel.busy': 'In lavorazione…',
    'desktop.collapseSidebar': 'Comprimi barra laterale',
    'desktop.expandSidebar': 'Espandi barra laterale',
    'desktop.resizeSidebar': 'Ridimensiona barra laterale',
    'chat.scrollToBottom': 'Vai in fondo',
    'shortcuts.desktop': 'Desktop',
    'shortcuts.panelFocus': 'Metti a fuoco pannello',
    'shortcuts.closeSplit': 'Chiudi diviso',
    'shortcuts.splitRight': 'Dividi a destra',
    'shortcuts.splitBottom': 'Dividi in basso',
    'shortcuts.maximize': 'Massimizza / ripristina pannello',
    'shortcuts.toggleSidebar': 'Attiva/disattiva barra laterale',
    'shortcuts.newSession': 'Nuova sessione',
    'shortcuts.shortcut': 'Scorciatoia',
    'shortcuts.action': 'Azione',
    'sessions.emptyTitle': 'Nessuna sessione trovata',
    'sessions.emptyHint': 'Crea una nuova sessione per iniziare',
    'sessions.newHere': 'Nuova sessione qui',
  'sessions.selectOne': 'Seleziona una sessione per iniziare',
    'sessions.loadingTitle': 'Connessione a OpenCode',
    'sessions.loadingHint': 'Carico le sessioni. Su mobile o dopo il risveglio del server può volerci qualche secondo.',
    'sessions.offlineHint': 'OpenCode non è ancora raggiungibile. Controlla Impostazioni o riprova con Aggiorna.',
    'sessions.noFileChanges': 'Nessuna modifica ai file',
    'sessions.updated': 'Aggiornata {time}',
    'sessions.open': 'Apri',
    'sessions.delete': 'Elimina',
    'sessions.activeLabel': 'Attive',
    'sessions.recentLabel': 'Recenti',
    'detail.backToSessions': '← Sessioni',
    'detail.selectSession': 'Seleziona una sessione',
    'detail.loading': 'Caricamento sessione...',
    'detail.emptyTitle': 'Ancora nessun messaggio',
    'detail.emptyHint': 'Inizia una conversazione qui sotto',
    'detail.waiting': 'Attesa...',
    'detail.send': 'Invia',
    'detail.abort': 'Interrompi',
    'detail.jumpToLatest': 'Vai alla fine',
    'detail.you': '👤 Tu',
    'detail.opencode': 'OpenCode',
    'detail.projectDashboardLabel': 'Dashboard progetto e VCS',
    'detail.projectLabel': 'Progetto',
    'detail.vcsLabel': 'VCS',
    'detail.loadingProject': 'Caricamento...',
    'detail.unavailable': 'Non disponibile',
    'detail.aheadBehind': '{ahead} avanti · {behind} indietro',
    'detail.fileStatusLabel': 'File modificati',
    'detail.fileStatusSource': 'Da /file/status',
    'detail.dashboardError': 'Errore: {message}',
    'detail.changedFilesTitle': 'File modificati',
    'detail.changedFilesHint': 'Tocca un file per vedere il mini diff.',
    'detail.filesCount': '{count} file',
    'detail.miniDiffAria': 'Mini diff dei file modificati',
    'detail.linesAddedDeleted': '+{additions} righe · -{deletions} righe',
    'detail.modelPanelLabel': 'Selettore modello AI',
    'detail.aiTitle': 'Agente e modello AI',
    'detail.refreshAi': 'Aggiorna opzioni AI',
    'detail.agentTitle': 'Agente',
    'detail.agentSelectLabel': 'Agente per il prossimo prompt',
    'detail.agentLoading': 'Caricamento agenti configurati...',
    'detail.agentLoadError': 'Impossibile caricare gli agenti: {message}',
    'detail.agentMode': 'Modalità: {mode}',
    'detail.modelTitle': 'Modello AI',
    'detail.modelHint': 'Si applica al prossimo prompt e alle nuove sessioni. Le risposte già in corso restano sul modello originale.',
    'detail.refreshModels': 'Aggiorna modelli',
    'detail.modelSelectLabel': 'Modello per il prossimo prompt',
    'detail.modelSearchPlaceholder': 'Cerca modelli per nome o provider...',
    'detail.modelSearchEmpty': 'Nessun modello corrisponde alla ricerca.',
    'detail.modelDefault': 'default',
    'detail.modelRecent': 'Recenti',
    'detail.thinkingLevel': 'Livello di ragionamento',
    'detail.thinkingNone': 'Nessuno',
    'detail.thinkingHigh': 'Alto',
    'detail.thinkingMedium': 'Medio',
    'detail.thinkingLow': 'Basso',
    'detail.changeModel': 'Cambia modello…',
    'detail.noThinkingLevels': 'Nessun livello di ragionamento per questo modello',
    'detail.thought': 'Ragionamento',
  'detail.thinking': 'Pensando…',
    'detail.modelAll': 'Tutti i modelli',
    'detail.modelProvider': 'Provider: {provider}',
    'detail.modelContext': 'Contesto {context} · output {output}',
    'detail.modelToolsYes': 'Tool abilitati',
    'detail.modelToolsNo': 'Nessun tool',
    'detail.modelVariant': 'Variante: {variant}',
    'detail.modelLoading': 'Caricamento modelli configurati...',
    'detail.modelLoadError': 'Impossibile caricare i modelli: {message}',
    'detail.contextStripLabel': 'Scorciatoie contesto sessione',
    'detail.aiChip': 'AI',
    'detail.filesChip': 'File',
    'detail.detailsChip': 'Dettagli',
    'detail.sessionDetailsTitle': 'Dettagli sessione',
    'detail.sessionDetailsHint': 'Informazioni avanzate su progetto, VCS, file e modello.',
    'detail.closeSheet': 'Chiudi',
    'detail.exportChat': 'Esporta chat',
    'detail.snapshot': 'Istantanea',
    'detail.readingModeOn': 'Lettura',
    'detail.readingModeOff': 'Chat',
    'detail.undo': 'Annulla ultimo messaggio',
    'detail.redo': 'Ripristina tutti i messaggi annullati',
    'detail.redoShort': 'Ripristina messaggi',
    'detail.compact': 'Compatta sessione',
    'detail.reverted': '⏪ Sessione annullata.',
    'detail.revertToHere': 'Annulla sessione fino a questo messaggio',
    'todo.title': 'Todo',
    'todo.hide': 'Nascondi',
    'todo.show': 'Mostra',
    'todo.more': '... e altri {count}',
    'diff.filesModified': '{count} file modificati',
    'toolpart.wrote': 'scritto',
    'toolpart.edited': 'modificato',
    'toolpart.patched': 'patch applicata',
    'session.deleteTitle': 'Eliminare la sessione?',
    'session.deleteBodyPrefix': 'Questo eliminerà definitivamente',
    'session.cancel': 'Annulla',
    'session.deleteConfirm': 'Elimina sessione',
    'session.renameTitle': 'Rinomina sessione',
    'session.renamePlaceholder': 'Inserisci nuovo nome...',
    'session.renameConfirm': 'Rinomina',
    'help.title': 'Aiuto e documentazione',
    'help.overview': 'Panoramica',
    'help.server': 'Server',
    'help.network': 'Rete',
    'help.troubleshooting': 'Risoluzione problemi',
    'help.commands': 'Comandi',
    'help.overview.content': '<b>Configura Server:</b> Usa Impostazioni per inserire host, porta, username e password|<b>Test Connessione:</b> Premi Test per verificare la connettività|<b>Salva Impostazioni:</b> Premi Salva per applicare e iniziare|<b>Esplora Sessioni:</b> Visualizza e gestisci le sessioni dalla scheda Sessioni|<b>Interagisci:</b> Apri una sessione e chatta nella vista Dettaglio|<b>Input Rapido:</b> Enter per inviare, Shift+Enter per nuova riga|<b>Comandi Slash:</b> Il testo che inizia con / viene inviato come comando',
    'help.server.content': '<b>Avviare il Server OpenCode</b>|Avvia OpenCode con autenticazione Basic Auth:||<b>macOS / Linux (bash/zsh)</b>|<code>OPENCODE_SERVER_USERNAME=opencode OPENCODE_SERVER_PASSWORD=tua-password npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>||<b>Windows PowerShell</b>|<code>$env:OPENCODE_SERVER_USERNAME="opencode"; $env:OPENCODE_SERVER_PASSWORD="tua-password"; npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>||<b>Windows CMD</b>|<code>set OPENCODE_SERVER_USERNAME=opencode&amp; set OPENCODE_SERVER_PASSWORD=tua-password&amp; npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>',
    'help.network.content': '<b>Modalità LAN (Consigliata)</b> Usa l\'IP locale del tuo PC per dispositivi sulla stessa rete|Esempio: 192.168.1.61||<b>Modalità WAN (Avanzata)</b>|Configura NAT/port forwarding sul router|Configura una VPN per accesso remoto sicuro|Usa un proxy inverso con TLS/HTTPS||<b>Requisiti di Sicurezza</b>|Apri porta TCP 4096 nel firewall del SO|Configura il port forwarding del router|Usa password forti per l\'autenticazione|Preferisci TLS/HTTPS per accesso esterno|Limita gli IP sorgente quando possibile|Non esporre mai senza autenticazione',
    'help.troubleshooting.content': '<b>Diagnostica Connessione</b>|1. Verifica Server: Controlla che OpenCode ascolti sulla porta 4096|2. Test Locale: Verifica l\'endpoint health dalla stessa macchina|3. Test Rete: Verifica l\'endpoint health dal browser del telefono|4. Verifica Firewall: Assicurati che la porta 4096 sia aperta||<b>Comandi di Verifica</b>|<code>curl -u opencode:tua-password http://127.0.0.1:4096/global/health</code>|<code>curl -u opencode:tua-password http://IP_TUO_PC:4096/global/health</code>||<b>Problemi Comuni</b>|Errori CORS: Aggiungi flag --cors al server|Timeout: Controlla le impostazioni del firewall|Errori di Auth: Verifica username/password',
    'help.commands.content': 'I comandi locali sono gestiti dall\'app. I comandi del server vengono caricati da OpenCode.',
    'help.commands.serverTab': 'Comandi del Server',
    'help.commands.skillsTab': 'Skills',
    'help.commands.empty': 'Nessun {type} disponibile',
    'help.commands.emptyConnected': 'Connettiti a un server per vedere comandi e skills disponibili',
    'session.fork': 'Deriva',
    'session.more': 'Altro',
    'session.searchMessages': 'Cerca messaggi',
    'session.archived': 'Archiviate',
    'session.themeCreator': 'Creatore temi',
    'session.compact': 'Compatta',
    'session.tokenStats': 'Statistiche token',
    'session.exportMd': 'Esporta .md',
    'session.files': 'File',
    'session.skills': 'Competenze',
    'session.terminal': 'Terminale',
    'session.reboot': 'Riavvia il PC',
    'session.rebootConfirm': 'Il PC si riavvierà tra 10 secondi. Continuare?',
    'session.rebootAction': 'Riavvia ora',
    'session.rebootCancel': 'Annulla',
    'session.mcpBrowser': 'Browser MCP',
    'session.shortcuts': 'Scorciatoie',
    'session.pendingCount': '{count} in attesa',
    'session.realtime': 'In tempo reale',
    'session.reconnecting': 'Riconnessione...',
    'session.removeImage': 'Rimuovi',
    'session.rename': 'Rinomina',
    'session.undo': 'Annulla',
    'session.redo': 'Ripeti',
    'session.browseFiles': 'Sfoglia file',
    'session.mcpResources': 'Risorse MCP',
    'sessions.count': '{count} sessioni',
    'sessions.recentDismiss': 'Rimuovere dai recenti?',
    'common.yes': 'Sì',
    'common.no': 'No',
    'favorites.label': 'Preferiti',
    'favorites.add': 'Aggiungi ai preferiti',
    'favorites.remove': 'Rimuovi dai preferiti',
    'session.statusBusy': 'Occupato',
    'session.statusRetry': 'Riprova',
    'archived.empty': 'Nessuna sessione archiviata',
    'archived.restore': 'Ripristina',
    'archived.open': 'Apri',
    'terminal.placeholder': 'Scrivi un comando da eseguire nella shell del progetto',
    'skills.searchPlaceholder': 'Cerca competenze...',
    'skills.loading': 'Caricamento...',
    'skills.empty': 'Nessuna competenza trovata',
    'subagent.parent': 'Genitore',
    'themeCreator.name': 'Nome tema',
    'themeCreator.copyJson': 'Copia JSON',
    'themeCreator.preview': 'Anteprima',
    'common.apply': 'Applica',
    'themePicker.current': 'corrente',
    'themePicker.searchPlaceholder': 'Cerca temi...',
    'themePicker.noMatch': 'Nessun tema corrisponde a "{query}"',
    'mcpBrowser.loading': 'Caricamento...',
    'session.restore': 'Ripristina',
    'session.archiveView': 'Sessioni archiviate',
    'notification.completionTitle': 'OpenCode Completato',
    'notification.completionBody': "L'assistente ha finito di rispondere",
    'notification.questionTitle': 'Domanda dall\'AI',
    'notification.questionBody': "L'AI ha una domanda per te",
    'notification.errorBody': "Si è verificato un errore",
    'mcpBrowser.title': 'Risorse MCP',
    'mcpBrowser.empty': 'Nessuna risorsa MCP disponibile',
    'mcpBrowser.search': 'Cerca risorse...',
    'fileEditor.title': 'Editor File',
    'fileEditor.save': 'Salva',
  'fileEditor.saving': 'Salvataggio...',
  'fileEditor.readOnly': 'Sola lettura',
  'fileEditor.loading': 'Caricamento file...',
    'fileEditor.noChanges': 'Nessuna modifica',
    'terminal.title': 'Terminale',
    'terminal.clear': 'Pulisci',
    'terminal.input': 'Inserisci comando shell',
    'terminal.welcome': 'Digita un comando da eseguire nella shell del progetto',
    'shortcuts.title': 'Scorciatoie da Tastiera',
    'favorites.manage': 'Gestisci Preferiti',
    'favorites.saveOrder': 'Salva Ordine',
    'favorites.empty': 'Ancora nessun preferito',
    'offlineQueue.pending': 'Azioni in coda',
    'settings.chatCustomization': 'Personalizzazione chat',
    'settings.chatCustomizationDesc': 'Personalizza cosa vedi nella chat',
    'settings.chatFontSize': 'Dimensione carattere',
    'settings.chatSpacing': 'Spaziatura',
    'settings.chatSpacingCompact': 'Compatta',
    'settings.chatSpacingNormal': 'Normale',
    'settings.chatSpacingComfortable': 'Comoda',
    'settings.chatShowThinking': 'Mostra ragionamento',
    'settings.chatShowTools': 'Mostra strumenti (tools)',
    'settings.chatShowTime': 'Mostra ora',
    'settings.chatShowTodo': 'Pulsante attività',
    'settings.enabled': 'Attivo',
    'settings.disabled': 'Disattivo',
    'settings.chatReset': 'Ripristina valori predefiniti',
    'settings.extras': 'Extra',
    'settings.extrasDesc': 'Strumenti aggiuntivi',
    'extras.shutdownHost': 'Spegni computer host',
    'extras.shutdownHostDesc': 'Invia un comando di spegnimento al computer che esegue il server OpenCode',
    'extras.shutdownConfirmTitle': 'Spegnere il computer host?',
    'extras.shutdownConfirmBody': 'Il computer che esegue il server OpenCode verrà spento. Questa azione non può essere annullata.',
    'extras.shutdownConfirm': 'Spegni',
    'extras.shutdownCancel': 'Annulla',
    'extras.shutdownSent': 'Comando di spegnimento inviato',
    'extras.shutdownFailed': 'Invio del comando di spegnimento fallito: {error}',
    'extras.shutdownNoSession': 'Serve una sessione attiva per spegnere il computer host',
'extras.restartHost': 'Riavvia computer host',
'extras.restartHostDesc': 'Riavvia il computer che esegue il server OpenCode',
'extras.restartConfirmTitle': 'Riavviare il computer host?',
'extras.restartConfirmBody': 'Il computer che esegue il server OpenCode si riavvierà tra 10 secondi. Questa azione non può essere annullata.',
'extras.restartConfirm': 'Riavvia ora',
'extras.restartCancel': 'Annulla',
'extras.restartSent': 'Comando di riavvio inviato',
'extras.restartFailed': 'Invio del comando di riavvio fallito: {error}',
    'extras.github': 'GitHub del progetto',
    'extras.dataUsage': 'Consumo dati',
    'settings.serverApplyAndSave': 'Usa e salva',
    'settings.serverSaveOnly': 'Solo salva',
    'favorites.manageDesc': 'Riordina sessioni preferite',
    'session.archivedDesc': 'Visualizza sessioni archiviate',
    'session.shortcutsDesc': 'Riferimento scorciatoie da tastiera',
    'session.queueToggle': 'Coda',
    'session.queueToggleOn': 'Coda attiva - i messaggi si inviano automaticamente quando l\'assistente finisce',
    'session.queueToggleOff': 'Coda disattivata',
    'dataUsage.title': 'Consumo dati',
    'dataUsage.day': 'Giorno',
    'dataUsage.week': 'Settimana',
    'dataUsage.month': 'Mese',
    'dataUsage.up': 'Invio',
    'dataUsage.down': 'Download',
    'dataUsage.total': 'Totale',
    'dataUsage.reset': 'Azzera contatore',
    'dataUsage.mobile': 'Mobile',
    'dataUsage.wifi': 'WiFi',
    'themeCreator.title': 'Creatore di Temi',
    'nav.stats': 'Statistiche',
    'settings.serverStats': 'Statistiche del server',
    'stats.title': 'Statistiche',
    'stats.refresh': 'Aggiorna',
    'stats.loading': 'Lettura database...',
    'stats.error': 'Errore',
    'stats.empty': 'Nessun dato (il server opencode-stats è in esecuzione?)',
    'stats.metaLine': '{sessions} sessioni · {models} modelli · {since} → {until} · costo medio {avg}/sessione · DB: {db}',
    'stats.filterSince': 'Da',
    'stats.filterUntil': 'A',
    'stats.filterModel': 'Modello',
    'stats.apply': 'Applica',
    'stats.port': 'Porta statistiche',
    'stats.portHint': 'Porta del server opencode-stats sul PC (default 8765)',
    'stats.cost': 'Costo totale',
    'stats.estCost': 'est.',
    'stats.mostExpensive': 'Sessione più costosa',
    'stats.mostTokens': 'Sessione con più token',
    'stats.avgInput': 'Input medio per sessione',
    'stats.costPerDay': 'Costo per giorno',
    'stats.costPerModel': 'Costo per modello',
    'stats.prices': 'Prezzi per 1M token (USD)',
    'stats.tabOverview': 'Riepilogo',
    'stats.tabModel': 'Per modello',
    'stats.tabProject': 'Per progetto',
    'stats.tabDay': 'Per giorno',
    'stats.tabMonth': 'Per mese',
    'stats.tabSessions': 'Sessioni',
    'stats.tabLimits': 'Limiti e prezzi',
    'stats.setupTitle': 'Attiva sul tuo PC',
    'stats.setupHint': 'Fai doppio clic su start-stats.bat (o esegui questo comando) sul computer dove gira opencode. Apre automaticamente la porta 8765 del firewall.',
    'stats.setupCopy': 'Copia comando',
    'stats.setupCopied': 'Copiato!'
  },
  'zh-TW': {
    'app.title': 'OpenCode 遠端',
    'app.exitTitle': '關閉應用程式？',
    'app.exitMessage': '確定要退出嗎？',
    'app.exitOk': '關閉',
    'app.exitCancel': '取消',
    'error.title': '錯誤',
    'error.close': '關閉',
    'nav.settings': '設定',
    'nav.sessions': '工作階段',
    'nav.detail': '詳細',
    'nav.help': '說明',
    'nav.lightMode': '切換至淺色模式',
    'nav.darkMode': '切換至深色模式',
    'composer.inputLabel': '傳送訊息給 OpenCode',
    'composer.send': '傳送',
    'composer.stop': '停止',
    'menu.title': '選單',
    'menu.settingsDescription': '設定伺服器連線',
    'menu.sessionsDescription': '管理工作階段',
    'menu.detailDescription': '與 OpenCode 對話',
    'menu.helpDescription': '文件與支援',
    'settings.title': '伺服器設定',
    'settings.host': '主機位址',
    'settings.hostPlaceholder': '192.168.1.100、localhost 或 https://example.com',
    'settings.port': '連接埠',
    'settings.username': '使用者名稱',
    'settings.password': '密碼',
    'settings.passwordPlaceholder': '選填；未受保護的本機伺服器可留空',
    'settings.save': '儲存設定',
    'settings.saving': '儲存中...',
    'settings.test': '測試連線',
    'settings.testing': '測試中...',
    'settings.testingConnection': '正在測試連線...',
      'settings.saved': '設定已儲存，將用於工作階段。',
      'settings.savedNotTested': '使用前請先測試連線。',
    'settings.connectedSaved': '已連線至 OpenCode {version}。設定已儲存。',
    'settings.draftHint': '變更會自動儲存。測試只檢查下方欄位，不會切換頁面。',
    'settings.testedNotSaved': '連線正常：OpenCode {version}。尚未儲存任何變更。',
      'settings.savedButton': '已儲存',
      'settings.sectionServer': '伺服器',
      'settings.sectionServers': '已儲存伺服器',
      'settings.sectionServersDesc': '連接不同的電腦。每個設定檔代表一台機器（透過 LAN 或 Tailscale 的 HTTP）。',
      'settings.serverActive': '使用中',
      'settings.serverApplied': '已套用伺服器',
      'settings.serverNamePlaceholder': '設定檔名稱（例如：工作電腦）',
      'settings.serverName': '名稱',
      'settings.editServer': '編輯已儲存的伺服器',
      'settings.saveAndApply': '儲存並套用',
      'settings.serverRemove': '移除伺服器',
      'settings.serverAdd': '新增伺服器',
      'settings.serverAddAndConnect': '新增並連線',
      'settings.serverConnectedTo': '已連線至',
      'settings.serverNoActive': '尚未連線至伺服器',
      'settings.serverUntitled': '未命名',
      'settings.serverNotConfigured': '尚未設定',
      'settings.serverUse': '使用',
      'settings.pairTitle': 'OpenCode v2 Pair（BETA）',
      'settings.pairDesc': '掃描 `opencode service pair`（beta）顯示的 QR 碼，自動連接。',
      'settings.pairScanQr': '掃描 QR 碼',
      'settings.pairPaste': '或貼上 payload',
      'settings.pairPasteHint': '在此貼上 QR 內容（URL + 憑證）',
      'settings.pairParse': '解析',
      'settings.pairParsed': '已偵測到配對資料。儲存為伺服器。',
      'settings.pairParseError': '無法讀取配對資料。請檢查 QR 內容。',
      'settings.pairCameraUnavailable': '無法使用相機。請改為在下方貼上 payload。',
      'settings.pairSave': '儲存為伺服器',
      'settings.pairNamePlaceholder': '設定檔名稱（例如 v2 beta PC）',
      'settings.pairKind': 'BETA v2',
      'settings.apiVersion': 'API 版本',
      'settings.apiVersionDesc': '伺服器 API 方言。連線時自動偵測 v1 或 v2（beta）。',
      'settings.apiVersionAuto': '自動（偵測）',
      'settings.apiVersionV1': 'v1（傳統）',
      'settings.apiVersionV2': 'v2（beta）',
      'settings.sectionPreferences': '偏好設定',
      'settings.dataModeTitle': '資料模式',
      'settings.dataModeDesc': '控制網路輪詢頻率和自動資料載入。',
      'settings.modeFullDesc': '3.5s · ~35 KB/min · SSE + 音訊 · 完整資料',
      'settings.modeSaver': '平衡',
      'settings.modeSaverDesc': '15s · ~10 KB/min · 完整負載 · 含音訊',
      'settings.modeUltra': '精簡',
      'settings.modeUltraDesc': '30s · ~3.6 KB/min · 無音訊 · 必要資料',
      'settings.modeMiser': '最低',
      'settings.modeMiserDesc': '60s · ~1.8 KB/min · 僅文字 · 無通知',
      'settings.visualTheme': '視覺主題',
      'settings.switchTheme': '切換主題',
      'detail.copySelection': '複製選取內容',
    'settings.testOk': '測試正常',
    'settings.testNeedsFields': '請輸入主機、連接埠與使用者名稱以測試。',
    'settings.testAlreadyPassed': '此草稿已通過連線測試。',
    'settings.readyToTest': '欄位已可測試。',
    'settings.unsavedChanges': '有未儲存變更：點選儲存後才會用於工作階段。',
    'settings.noUnsavedChanges': '已儲存的設定正在使用中。',
    'settings.defaultModel': '預設模型',
    'settings.selectModel': '選擇模型',
    'settings.stats': '使用統計',
    'settings.statsPrompts': '提示次數',
    'settings.statsSessions': '工作階段',
    'settings.statsTokens': 'Token 數',
    'settings.resetStats': '重設統計',
    'settings.mode': '模式',
    'voice.input': '語音輸入',
    'voice.listening': '聆聽中...',
    'voice.permissionDenied': '麥克風權限遭拒絕 — 請在系統設定中啟用',
    'voice.unavailable': '此裝置不支援語音辨識',
    'desktop.title': '遠端桌面',
    'desktop.fullScreen': '全螢幕',
    'desktop.monitor': '顯示器',
    'desktop.source': '來源',
    'desktop.connecting': '連線中…',
    'desktop.error': '連線失敗',
    'desktop.data': '資料',
    'desktop.dragMode': '拖曳',
    'desktop.fit': '適應',
    'desktop.zoomIn': '放大',
    'desktop.zoomOut': '縮小',
    'desktop.quality': '畫質',
    'desktop.preset_low': '低',
    'desktop.preset_med': '中',
    'desktop.preset_high': '高',
    'desktop.keyboard': '鍵盤',
    'desktop.kbPlaceholder': '在遠端電腦輸入…',
    'desktop.cancel': '取消',
    'desktop.retry': '重試',
    'desktop.oneToOne': '1:1',
    'desktop.scrollMode': '捲動',
    'desktop.mouse': '滑鼠',
    'desktop.mouse_left': '左',
    'desktop.mouse_right': '右',
    'desktop.mouse_middle': '中',
    'desktop.dpad': '方向鍵',
    'desktop.rotateHint': '旋轉手機以獲得更大視野',
    'desktop.consentTitle': '你正在使用行動數據',
    'desktop.consentBody': '畫面變化時串流約消耗 1-2 MB/分鐘。是否以低畫質繼續？',
    'desktop.consentContinue': '繼續（低）',
    'desktop.consentCancel': '取消',
    'desktop.disconnect': '中斷連線',
    'desktop.statsToggle': '數據',
    'desktop.statsHide': '隱藏數據',
    'desktop.statsShow': '顯示數據',
    'desktop.settings': '設定',
    'session.remoteDesktop': '遠端桌面',
    'settings.desktopTitle': '遠端桌面',
    'settings.desktopHint': 'PC 上的 OpenCode Desktop Agent（desktop-agent，連接埠 5901）。與伺服器相同的認證。',
    'settings.desktopTest': '測試連線',
    'settings.desktopTestOk': '可連線到桌面代理',
    'settings.desktopTestFail': '無法連線到桌面代理',
    'settings.desktopSaved': '遠端桌面已儲存',
    'settings.desktopMissing': '請設定桌面代理的 host/port 以使用遠端桌面',
    'settings.navBarPosition': '導航欄位置',
    'settings.navBarBottom': '底部',
    'settings.navBarHeader': '頂部',
    'settings.blockedModels': '已封鎖的模型',
    'settings.blockedModelsHint': '已封鎖的模型將從選擇器中隱藏。',
    'settings.blockedModelsSearch': '篩選模型...',
    'settings.blockedCount': '隱藏 {blocked}/{total}',
    'settings.blockedShowAll': '顯示全部',
    'settings.blockedHideAll': '隱藏全部',
    'settings.providers': 'AI 提供商',
    'settings.providersDesc': '連接或斷開 AI 提供商',
    'settings.connect': '連接',
    'settings.disconnect': '斷開',
    'settings.connected': '已連接',
    'settings.notConnected': '未連接',
    'settings.connecting': '連接中...',
    'settings.connectSuccess': '連接成功',
    'settings.connectError': '連接失敗',
    'settings.apiKey': 'API 密鑰',
    'settings.apiKeyPlaceholder': '輸入您的 API 密鑰',
    'settings.noProviders': '暫無提供商。請先連接到服務器。',
    'settings.showEmpty': '顯示空提供商',
    'settings.hideEmpty': '隱藏空提供商',
    'settings.cancel': '取消',
    'settings.offlineCache': '離線緩存',
    'settings.offlineCacheDesc': '在 IndexedDB 中離線緩存會話和消息',
    'settings.questionAuto': '自動顯示問題',
    'settings.questionAutoDesc': '自動顯示 AI 的提問',
    'settings.permissionUI': '權限請求',
    'settings.permissionUIDesc': '顯示工具訪問權限請求對話框',
    'settings.permissionRequest': '權限請求',
    'settings.permissionAllow': '允許',
    'settings.permissionDeny': '拒絕',
    'settings.questionPrompt': 'AI 提問',
    'settings.questionPlaceholder': '輸入你的回答...',
    'settings.questionSend': '發送',
    'settings.questionSkip': '跳過',
'settings.featureFlags': '附加功能',
'settings.featureFlagsDesc': '啟用或停用附加功能',
    'settings.fileBrowser': '檔案瀏覽器',
    'settings.fileBrowserDesc': '從聊天中瀏覽專案檔案',
    'settings.inlineDiff': '內聯 Diff',
    'settings.inlineDiffDesc': '檢視詳細的檔案變更',
    'settings.contextMenu': '上下文選單',
    'settings.contextMenuDesc': '長按訊息選單（複製、還原）',
    'settings.planBreakdown': '計畫分解',
    'settings.planBreakdownDesc': '顯示 Plan 代理的結構化任務',
    'settings.gitOps': 'Git 操作',
    'settings.gitOpsDesc': '從聊天中進行 Stage/Commit',
    'settings.mcpConfig': 'MCP 設定',
    'settings.mcpConfigDesc': '列出並設定 MCP 伺服器',
    'settings.sessionArchive': '歸檔工作階段',
    'settings.sessionArchiveDesc': '從清單中隱藏已歸檔的工作階段',
    'settings.streamingFull': '快速串流（Full 模式）',
    'settings.streamingFullDesc': '助理回覆時每秒輪詢',
    'detail.contextMenu.copy': '複製訊息',
    'detail.contextMenu.revert': '還原至此',
    'detail.contextMenu.fork': '分叉工作階段',
    'detail.queuedTitle': '佇列提示',
    'detail.queuedEmpty': '無佇列提示',
    'detail.queuedSend': '立即發送',
    'detail.queuedRemove': '刪除',
    'detail.queuedBadge': '佇列中',
    'detail.git.stage': 'Stage',
    'detail.git.unstage': 'Unstage',
    'detail.git.commit': 'Commit',
    'detail.git.commitMessage': 'Commit 訊息',
    'detail.git.noChanges': '無變更',
    'detail.archive': '歸檔',
    'detail.unarchive': '取消歸檔',
    'detail.showArchived': '顯示已歸檔',
    'detail.plan.tasks': '計畫任務',
    'detail.plan.pending': '待處理',
    'detail.plan.pendingCount': '{count} 待處理',
    'detail.plan.completed': '已完成',
    'detail.diff.viewFile': '檢視變更',
    'detail.diff.noChanges': '此檔案無變更',
    'connection.connecting': '正在連線到 OpenCode...',
    'connection.loadingSessions': '正在連線並載入工作階段...',
    'connection.refreshing': '正在重新整理工作階段...',
    'connection.reconnecting': '連線較慢；正在安靜重試...',
    'connection.connected': '已連線',
    'connection.offline': '無法連線到 OpenCode',
    'settings.connectionFailed': '連線失敗：{message}',
    'settings.connectedTo': '已連線至 OpenCode v{version}',
    'settings.language': '語言',
    'settings.theme': '主題',
    'settings.themeSystem': '跟隨系統',
    'settings.themeScheduled': '定時切換（日/夜）',
    'settings.themeLight': '淺色',
    'settings.themeDark': '深色',
    'sessions.title': '工作階段',
    'sessions.new': '新增工作階段',
    'sessions.creating': '建立中...',
    'sessions.refresh': '重新整理',
    'sessions.projectDirectoryLabel': '已選資料夾',
    'sessions.projectDirectoryPlaceholder': '/home/you/project 或 C:\\Projects\\App',
    'sessions.projectDirectoryActive': '新工作階段會使用 {directory}。',
    'sessions.projectDirectoryDefault': '為這個新工作階段選擇資料夾，或使用伺服器預設目錄。',
    'sessions.newSessionTitle': '新工作階段資料夾',
    'sessions.useServerDefault': '使用伺服器預設',
    'sessions.useThisFolder': '在這裡建立',
    'sessions.parentFolder': '上一層資料夾',
    'sessions.folderPickerLoading': '正在載入資料夾...',
    'sessions.folderPickerEmpty': '這裡沒有資料夾。',
    'sessions.projectDirectoryInvalid': '{directory} 不是 OpenCode 專案資料夾。請選擇專案/worktree 資料夾，或使用伺服器預設。',
    'sessions.searchPlaceholder': '依標題或目錄搜尋工作階段...',
    'layout.single': '單一面板',
    'layout.twoCol': '兩欄',
    'layout.twoRow': '兩列',
    'layout.threeCol': '三欄',
    'layout.grid2x2': '2×2 網格',
    'panel.splitRight': '向右分割',
    'panel.splitBottom': '向下分割',
    'panel.close': '關閉面板',
    'panel.maximize': '最大化面板',
    'panel.restore': '還原面板',
    'panel.busy': '處理中…',
    'desktop.collapseSidebar': '收合側邊欄',
    'desktop.expandSidebar': '展開側邊欄',
    'desktop.resizeSidebar': '調整側邊欄大小',
    'chat.scrollToBottom': '捲動至底部',
    'shortcuts.desktop': '桌面',
    'shortcuts.panelFocus': '聚焦面板',
    'shortcuts.closeSplit': '關閉分割',
    'shortcuts.splitRight': '向右分割',
    'shortcuts.splitBottom': '向下分割',
    'shortcuts.maximize': '最大化／還原面板',
    'shortcuts.toggleSidebar': '切換側邊欄',
    'shortcuts.newSession': '新增工作階段',
    'shortcuts.shortcut': '捷徑',
    'shortcuts.action': '操作',
    'sessions.emptyTitle': '找不到工作階段',
    'sessions.emptyHint': '建立新的工作階段以開始',
    'sessions.newHere': '在此建立新工作階段',
  'sessions.selectOne': '選擇一個工作階段以開始',
    'sessions.loadingTitle': '正在連線到 OpenCode',
    'sessions.loadingHint': '正在載入工作階段。行動裝置或伺服器剛喚醒時可能需要幾秒。',
    'sessions.offlineHint': '尚無法連線到 OpenCode。請檢查設定或重新整理。',
    'sessions.noFileChanges': '沒有檔案變更',
    'sessions.updated': '更新於 {time}',
    'sessions.open': '開啟',
    'sessions.delete': '刪除',
    'sessions.activeLabel': '進行中',
    'sessions.recentLabel': '最近',
    'detail.backToSessions': '← 工作階段',
    'detail.selectSession': '選擇工作階段',
    'detail.loading': '載入工作階段...',
    'detail.emptyTitle': '尚無訊息',
    'detail.emptyHint': '在下方開始對話',
    'detail.waiting': '等待中...',
    'detail.send': '傳送',
    'detail.abort': '中止',
    'detail.jumpToLatest': '前往最新',
    'detail.you': '👤 你',
    'detail.opencode': 'OpenCode',
    'detail.projectDashboardLabel': '專案與 VCS 儀表板',
    'detail.projectLabel': '專案',
    'detail.vcsLabel': 'VCS',
    'detail.loadingProject': '載入中...',
    'detail.unavailable': '無法取得',
    'detail.aheadBehind': '超前 {ahead} · 落後 {behind}',
    'detail.fileStatusLabel': '已變更檔案',
    'detail.fileStatusSource': '來自 /file/status',
    'detail.dashboardError': '錯誤：{message}',
    'detail.changedFilesTitle': '已變更檔案',
    'detail.changedFilesHint': '點選檔案查看迷你 diff。',
    'detail.filesCount': '{count} 個檔案',
    'detail.miniDiffAria': '已變更檔案迷你 diff',
    'detail.linesAddedDeleted': '+{additions} 行 · -{deletions} 行',
    'detail.modelPanelLabel': 'AI 模型選擇器',
    'detail.aiTitle': 'AI 代理與模型',
    'detail.refreshAi': '重新整理 AI 選項',
    'detail.agentTitle': '代理',
    'detail.agentSelectLabel': '下一個提示的代理',
    'detail.agentLoading': '正在載入已設定代理...',
    'detail.agentLoadError': '無法載入代理：{message}',
    'detail.agentMode': '模式：{mode}',
    'detail.modelTitle': 'AI 模型',
    'detail.modelHint': '套用到下一個提示與新工作階段。進行中的回覆仍使用原本模型。',
    'detail.refreshModels': '重新整理模型',
    'detail.modelSelectLabel': '下一個提示的模型',
    'detail.modelSearchPlaceholder': '依名稱或提供者搜尋模型...',
    'detail.modelSearchEmpty': '沒有符合搜尋的模型。',
    'detail.modelDefault': '預設',
    'detail.modelRecent': '最近使用',
    'detail.thinkingLevel': '思考等級',
    'detail.thinkingNone': '無',
    'detail.thinkingHigh': '高',
    'detail.thinkingMedium': '中',
    'detail.thinkingLow': '低',
    'detail.changeModel': '更換模型…',
    'detail.noThinkingLevels': '此模型沒有思考等級',
    'detail.thought': '思考',
  'detail.thinking': '思考中…',
    'detail.modelAll': '所有模型',
    'detail.modelProvider': '提供者：{provider}',
    'detail.modelContext': '上下文 {context} · 輸出 {output}',
    'detail.modelToolsYes': '已啟用工具',
    'detail.modelToolsNo': '無工具',
    'detail.modelVariant': '變體：{variant}',
    'detail.modelLoading': '正在載入已設定模型...',
    'detail.modelLoadError': '無法載入模型：{message}',
    'detail.contextStripLabel': '工作階段情境捷徑',
    'detail.aiChip': 'AI',
    'detail.filesChip': '檔案',
    'detail.detailsChip': '詳細資訊',
    'detail.sessionDetailsTitle': '工作階段詳細資訊',
    'detail.sessionDetailsHint': '專案、VCS、檔案與模型的進階資訊。',
    'detail.closeSheet': '關閉',
    'detail.exportChat': '匯出對話',
    'detail.snapshot': '快照',
    'detail.readingModeOn': '閱讀模式',
    'detail.readingModeOff': '聊天',
    'detail.undo': '復原上一個訊息',
    'detail.redo': '恢復所有已復原的訊息',
    'detail.redoShort': '恢復訊息',
    'detail.compact': '壓縮會話',
    'detail.reverted': '⏪ 會話已復原。',
    'detail.revertToHere': '將會話復原到此訊息',
    'todo.title': '待辦事項',
    'todo.hide': '隱藏',
    'todo.show': '顯示',
    'todo.more': '... 還有 {count} 項',
    'diff.filesModified': '{count} 個檔案已修改',
    'toolpart.wrote': '已寫入',
    'toolpart.edited': '已編輯',
    'toolpart.patched': '已套用補丁',
    'session.deleteTitle': '刪除工作階段？',
    'session.deleteBodyPrefix': '這會永久刪除',
    'session.cancel': '取消',
    'session.deleteConfirm': '刪除工作階段',
    'session.renameTitle': '重新命名工作階段',
    'session.renamePlaceholder': '輸入新名稱...',
    'session.renameConfirm': '重新命名',
    'help.title': '說明與文件',
    'help.overview': '總覽',
    'help.server': '伺服器',
    'help.network': '網路',
    'help.troubleshooting': '疑難排解',
    'help.commands': '命令',
    'help.overview.content': '<b>設定伺服器：</b>使用設定頁面輸入主機、連接埠、使用者名稱與密碼|<b>測試連線：</b>按「測試」驗證伺服器連線|<b>儲存設定：</b>按「儲存」套用設定並開始輪詢|<b>瀏覽工作階段：</b>在工作階段頁籤中檢視與管理工作階段|<b>互動：</b>開啟工作階段，在詳細檢視中聊天|<b>快速輸入：</b>按 Enter 傳送，Shift+Enter 換行|<b>斜線命令：</b>以 / 開頭的文字會作為命令傳送',
    'help.server.content': '<b>啟動 OpenCode 伺服器</b>|使用 Basic Auth 啟動 OpenCode 伺服器：||<b>macOS / Linux (bash/zsh)</b>|<code>OPENCODE_SERVER_USERNAME=opencode OPENCODE_SERVER_PASSWORD=your-password npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>||<b>Windows PowerShell</b>|<code>$env:OPENCODE_SERVER_USERNAME="opencode"; $env:OPENCODE_SERVER_PASSWORD="your-password"; npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>||<b>Windows 命令提示字元</b>|<code>set OPENCODE_SERVER_USERNAME=opencode&amp; set OPENCODE_SERVER_PASSWORD=your-password&amp; npx -y opencode-ai serve --hostname 0.0.0.0 --port 4096</code>',
    'help.network.content': '<b>LAN 模式（建議）</b>使用電腦的區域網路 IP 位址，讓同一網路上的裝置連線|範例：192.168.1.61||<b>WAN 模式（進階）</b>|在路由器上設定 NAT/連接埠轉發|設定 VPN 以安全遠端存取|使用帶有 TLS/HTTPS 的反向代理||<b>安全要求</b>|在作業系統防火牆中開啟 TCP 連接埠 4096|設定路由器 NAT/連接埠轉發|使用強密碼進行認證|外部存取建議使用 TLS/HTTPS|盡可能限制來源 IP|切勿在未認證狀態下暴露',
    'help.troubleshooting.content': '<b>連線診斷</b>|1. 確認伺服器：檢查 OpenCode 是否在連接埠 4096 上監聽|2. 本機測試：從同一台機器確認健康端點|3. 網路測試：從手機瀏覽器確認健康端點|4. 檢查防火牆：確保連接埠 4096 已開啟||<b>健康檢查命令</b>|<code>curl -u opencode:your-password http://127.0.0.1:4096/global/health</code>|<code>curl -u opencode:your-password http://YOUR_PC_IP:4096/global/health</code>||<b>常見問題</b>|CORS 錯誤：為伺服器加入 --cors 旗標|連線逾時：檢查防火牆設定|認證失敗：確認使用者名稱/密碼',
    'help.commands.content': '本機行動端命令由應用程式處理。伺服器命令從 OpenCode 載入。',
    'help.commands.serverTab': '伺服器命令',
    'help.commands.skillsTab': '技能',
    'help.commands.empty': '沒有可用的 {type}',
    'help.commands.emptyConnected': '連線至伺服器以查看可用的命令與技能',
    'session.fork': '分岔',
    'session.more': '更多',
    'session.searchMessages': '搜尋訊息',
    'session.archived': '已封存',
    'session.themeCreator': '主題建立器',
    'session.compact': '壓縮',
    'session.tokenStats': 'Token 統計',
    'session.exportMd': '匯出 .md',
    'session.files': '檔案',
    'session.skills': '技能',
    'session.terminal': '終端機',
    'session.reboot': '重新啟動電腦',
    'session.rebootConfirm': '電腦將在 10 秒後重新啟動。繼續？',
    'session.rebootAction': '立即重新啟動',
    'session.rebootCancel': '取消',
    'session.mcpBrowser': 'MCP 瀏覽器',
    'session.shortcuts': '快捷鍵',
    'session.pendingCount': '{count} 待處理',
    'session.realtime': '即時',
    'session.reconnecting': '重新連線中...',
    'session.removeImage': '移除',
    'session.rename': '重新命名',
    'session.undo': '復原',
    'session.redo': '重做',
    'session.browseFiles': '瀏覽檔案',
    'session.mcpResources': 'MCP 資源',
    'sessions.count': '{count} 個對話',
    'sessions.recentDismiss': '從最近移除？',
    'common.yes': '是',
    'common.no': '否',
    'favorites.label': '最愛',
    'favorites.add': '加入最愛',
    'favorites.remove': '從最愛移除',
    'session.statusBusy': '忙碌中',
    'session.statusRetry': '重試',
    'archived.empty': '沒有已封存的對話',
    'archived.restore': '恢復',
    'archived.open': '開啟',
    'terminal.placeholder': '輸入要在專案 shell 中執行的指令',
    'skills.searchPlaceholder': '搜尋技能...',
    'skills.loading': '載入中...',
    'skills.empty': '找不到技能',
    'subagent.parent': '父層',
    'themeCreator.name': '主題名稱',
    'themeCreator.copyJson': '複製 JSON',
    'themeCreator.preview': '預覽',
    'common.apply': '套用',
    'themePicker.current': '目前',
    'themePicker.searchPlaceholder': '搜尋主題...',
    'themePicker.noMatch': '沒有符合 "{query}" 的主題',
    'mcpBrowser.loading': '載入中...',
    'session.restore': '還原',
    'session.archiveView': '已封存的工作階段',
    'notification.completionTitle': 'OpenCode 完成',
    'notification.completionBody': '助手已完成回覆',
    'notification.questionTitle': 'AI 有問題',
    'notification.questionBody': 'AI 有一個問題想問你',
    'notification.errorBody': '發生錯誤',
    'mcpBrowser.title': 'MCP 資源',
    'mcpBrowser.empty': '沒有可用的 MCP 資源',
    'mcpBrowser.search': '搜尋資源...',
    'fileEditor.title': '檔案編輯器',
    'fileEditor.save': '儲存',
  'fileEditor.saving': '儲存中...',
  'fileEditor.readOnly': '唯讀',
  'fileEditor.loading': '載入檔案中...',
    'fileEditor.noChanges': '無變更',
    'terminal.title': '終端機',
    'terminal.clear': '清除',
    'terminal.input': '輸入 shell 指令',
    'terminal.welcome': '輸入要在專案 shell 中執行的指令',
    'shortcuts.title': '鍵盤快捷鍵',
    'favorites.manage': '管理最愛',
    'favorites.saveOrder': '儲存順序',
    'favorites.empty': '尚無最愛',
    'offlineQueue.pending': '佇列中有待處理的動作',
    'settings.chatCustomization': '聊天自訂',
    'settings.chatCustomizationDesc': '自訂聊天中顯示的內容',
    'settings.chatFontSize': '字體大小',
    'settings.chatSpacing': '間距',
    'settings.chatSpacingCompact': '緊湊',
    'settings.chatSpacingNormal': '標準',
    'settings.chatSpacingComfortable': '寬鬆',
    'settings.chatShowThinking': '顯示推理',
    'settings.chatShowTools': '顯示工具 (tools)',
    'settings.chatShowTime': '顯示時間',
    'settings.chatShowTodo': '任務按鈕',
    'settings.enabled': '啟用',
    'settings.disabled': '停用',
    'settings.chatReset': '恢復預設值',
    'settings.extras': '其他功能',
    'settings.extrasDesc': '其他工具',
    'extras.shutdownHost': '關閉主機電腦',
    'extras.shutdownHostDesc': '向執行 OpenCode 伺服器的電腦發送關機指令',
    'extras.shutdownConfirmTitle': '關閉主機電腦？',
    'extras.shutdownConfirmBody': '執行 OpenCode 伺服器的電腦將被關閉。此操作無法復原。',
    'extras.shutdownConfirm': '關機',
    'extras.shutdownCancel': '取消',
    'extras.shutdownSent': '已發送關機指令',
    'extras.shutdownFailed': '發送關機指令失敗：{error}',
    'extras.shutdownNoSession': '需要一個有效的工作階段才能關閉主機',
'extras.restartHost': '重新啟動主機電腦',
'extras.restartHostDesc': '重新啟動執行 OpenCode 伺服器的電腦',
'extras.restartConfirmTitle': '重新啟動主機電腦？',
'extras.restartConfirmBody': '執行 OpenCode 伺服器的電腦將在 10 秒後重新啟動。此操作無法復原。',
'extras.restartConfirm': '立即重新啟動',
'extras.restartCancel': '取消',
'extras.restartSent': '已發送重新啟動指令',
'extras.restartFailed': '發送重新啟動指令失敗：{error}',
    'extras.github': '專案 GitHub',
    'extras.dataUsage': '資料使用量',
    'settings.serverApplyAndSave': '使用並儲存',
    'settings.serverSaveOnly': '僅儲存',
    'favorites.manageDesc': '重新排序最愛工作階段',
    'session.archivedDesc': '檢視已封存的工作階段',
    'session.shortcutsDesc': '鍵盤快捷鍵參考',
    'session.queueToggle': '佇列',
    'session.queueToggleOn': '佇列已啟用 - 助理完成後自動傳送訊息',
    'session.queueToggleOff': '佇列已停用',
    'dataUsage.title': '資料使用量',
    'dataUsage.day': '日',
    'dataUsage.week': '週',
    'dataUsage.month': '月',
    'dataUsage.up': '上傳',
    'dataUsage.down': '下載',
    'dataUsage.total': '總計',
    'dataUsage.reset': '重設計數器',
    'dataUsage.mobile': '行動網路',
    'dataUsage.wifi': 'WiFi',
    'themeCreator.title': '主題建立器',
    'nav.stats': '統計',
    'settings.serverStats': '伺服器統計',
    'stats.title': '統計資料',
    'stats.refresh': '重新整理',
    'stats.loading': '讀取資料庫...',
    'stats.error': '錯誤',
    'stats.empty': '沒有資料（opencode-stats 伺服器有在執行嗎？）',
    'stats.metaLine': '{sessions} 個工作階段 · {models} 個模型 · {since} → {until} · 平均成本 {avg}/工作階段 · DB: {db}',
    'stats.filterSince': '從',
    'stats.filterUntil': '至',
    'stats.filterModel': '模型',
    'stats.apply': '套用',
    'stats.port': '統計連接埠',
    'stats.portHint': 'PC 上 opencode-stats 伺服器的連接埠（預設 8765）',
    'stats.cost': '總成本',
    'stats.estCost': '估',
    'stats.mostExpensive': '最貴的工作階段',
    'stats.mostTokens': 'Token 最多的工作階段',
    'stats.avgInput': '每工作階段平均輸入',
    'stats.costPerDay': '每日成本',
    'stats.costPerModel': '各模型成本',
    'stats.prices': '每 1M token 價格（USD）',
    'stats.tabOverview': '摘要',
    'stats.tabModel': '依模型',
    'stats.tabProject': '依專案',
    'stats.tabDay': '依天',
    'stats.tabMonth': '依月',
    'stats.tabSessions': '工作階段',
    'stats.tabLimits': '限制與價格',
    'stats.setupTitle': '在您的 PC 上啟用',
    'stats.setupHint': '在執行 opencode 的電腦上雙擊 start-stats.bat（或執行此命令）。會自動開啟防火牆的 8765 連接埠。',
    'stats.setupCopy': '複製命令',
    'stats.setupCopied': '已複製！'
  }
}

export const languageOptions: Array<{ code: LanguageCode; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'zh-TW', label: '繁體中文' }
]

export function normalizeLanguage(value: string | null | undefined): LanguageCode {
  if (value === 'es' || value?.toLowerCase().startsWith('es')) return 'es'
  if (value === 'it' || value?.toLowerCase().startsWith('it')) return 'it'
  if (value === 'zh-TW' || value?.toLowerCase().startsWith('zh')) return 'zh-TW'
  return 'en'
}

export function createTranslator(language: LanguageCode) {
  return (key: string, params: Record<string, string | number> = {}) => {
    const template = translations[language][key as TranslationKey] ?? translations.en[key as TranslationKey] ?? key
    return Object.entries(params).reduce(
      (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
      template
    )
  }
}
