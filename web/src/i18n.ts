export type LanguageCode = 'en' | 'es' | 'it' | 'zh-TW'

type TranslationKey =
  | 'app.title'
  | 'app.exitTitle'
  | 'app.exitMessage'
  | 'app.exitOk'
  | 'app.exitCancel'
  | 'nav.settings'
  | 'nav.sessions'
  | 'nav.detail'
  | 'nav.help'
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
  | 'sessions.summary'
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
  | 'sessions.emptyTitle'
  | 'sessions.emptyHint'
  | 'sessions.noFileChanges'
  | 'sessions.updated'
  | 'sessions.open'
  | 'sessions.delete'
  | 'sessions.activeLabel'
  | 'sessions.recentLabel'
  | 'detail.backToSessions'
  | 'detail.selectSession'
  | 'detail.loading'
  | 'detail.emptyTitle'
  | 'detail.emptyHint'
  | 'detail.composerPlaceholder'
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
  | 'detail.modelSearchPlaceholder'
  | 'detail.modelSearchEmpty'
  | 'detail.modelDefault'
  | 'detail.modelProvider'
  | 'detail.modelContext'
  | 'detail.modelToolsYes'
  | 'detail.modelToolsNo'
  | 'detail.modelVariant'
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
  | 'settings.mode'
  | 'voice.input'
  | 'voice.listening'
  | 'settings.navBarPosition'
  | 'settings.navBarBottom'
  | 'settings.navBarHeader'

const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  en: {
    'app.title': 'OpenCode Mobile',
    'app.exitTitle': 'Close app?',
    'app.exitMessage': 'Are you sure you want to exit?',
    'app.exitOk': 'Close',
    'app.exitCancel': 'Cancel',
    'nav.settings': 'Settings',
    'nav.sessions': 'Sessions',
    'nav.detail': 'Detail',
    'nav.help': 'Help',
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
    'settings.connectedSaved': 'Connected to OpenCode {version}. Configuration saved.',
    'settings.draftHint': 'Edits are drafts until you tap Save. Test checks the fields below without saving or changing page.',
    'settings.testedNotSaved': 'Connection OK: OpenCode {version}. Nothing was saved yet.',
    'settings.savedButton': 'Saved',
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
    'settings.navBarPosition': 'Navigation bar',
    'settings.navBarBottom': 'Bottom',
    'settings.navBarHeader': 'Header',
    'connection.connecting': 'Connecting to OpenCode...',
    'connection.loadingSessions': 'Connecting and loading sessions...',
    'connection.refreshing': 'Refreshing sessions...',
    'connection.reconnecting': 'Connection is slow; retrying quietly...',
    'connection.connected': 'Connected',
    'connection.offline': 'OpenCode is not reachable',
    'settings.connectionFailed': 'Connection failed: {message}',
    'settings.connectedTo': 'Connected to OpenCode {version}',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.themeSystem': 'System',
    'settings.themeScheduled': 'Scheduled (day/night)',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'sessions.title': 'Sessions',
    'sessions.summary': '{total} total · {active} active · {changed} changed',
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
    'sessions.emptyTitle': 'No sessions found',
    'sessions.emptyHint': 'Create a new session to get started',
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
    'detail.composerPlaceholder': 'Type a prompt or command (start with / for slash commands)...',
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
    'detail.modelProvider': 'Provider: {provider}',
    'detail.modelContext': 'Context {context} · output {output}',
    'detail.modelToolsYes': 'Tools enabled',
    'detail.modelToolsNo': 'No tools',
    'detail.modelVariant': 'Variant: {variant}',
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
    'todo.title': 'Todo Items',
    'todo.hide': 'Hide',
    'todo.show': 'Show',
    'todo.more': '... and {count} more',
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
    'help.commands.emptyConnected': 'Connect to a server to see available commands and skills'
  },
  es: {
    'app.title': 'OpenCode Remoto',
    'app.exitTitle': '¿Cerrar app?',
    'app.exitMessage': '¿Seguro que quieres salir?',
    'app.exitOk': 'Cerrar',
    'app.exitCancel': 'Cancelar',
    'nav.settings': 'Configuración',
    'nav.sessions': 'Sesiones',
    'nav.detail': 'Detalle',
    'nav.help': 'Ayuda',
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
    'settings.test': 'Probar conexión',
    'settings.testing': 'Probando...',
    'settings.testingConnection': 'Probando conexión...',
    'settings.saved': 'Configuración guardada. Se usará en las Sesiones.',
    'settings.connectedSaved': 'Conectado a OpenCode {version}. Configuración guardada.',
    'settings.draftHint': 'Los cambios son borradores hasta que pulses Guardar. La prueba verifica los campos sin guardar ni cambiar de página.',
    'settings.testedNotSaved': 'Conexión OK: OpenCode {version}. Aún no se guardó nada.',
    'settings.savedButton': 'Guardado',
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
    'settings.navBarPosition': 'Barra de navegación',
    'settings.navBarBottom': 'Abajo',
    'settings.navBarHeader': 'Arriba',
    'connection.connecting': 'Conectando a OpenCode...',
    'connection.loadingSessions': 'Conectando y cargando sesiones...',
    'connection.refreshing': 'Actualizando sesiones...',
    'connection.reconnecting': 'Conexión lenta; reintentando en segundo plano...',
    'connection.connected': 'Conectado',
    'connection.offline': 'OpenCode no está accesible',
    'settings.connectionFailed': 'Conexión fallida: {message}',
    'settings.connectedTo': 'Conectado a OpenCode {version}',
    'settings.language': 'Idioma',
    'settings.theme': 'Tema',
    'settings.themeSystem': 'Sistema',
    'settings.themeScheduled': 'Programado (día/noche)',
    'settings.themeLight': 'Claro',
    'settings.themeDark': 'Oscuro',
    'sessions.title': 'Sesiones',
    'sessions.summary': '{total} totales · {active} activas · {changed} con cambios',
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
    'sessions.emptyTitle': 'No se encontraron sesiones',
    'sessions.emptyHint': 'Crea una nueva sesión para empezar',
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
    'detail.composerPlaceholder': 'Escribe un prompt o comando (empieza con / para comandos slash)...',
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
    'detail.modelProvider': 'Proveedor: {provider}',
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
    'todo.title': 'Tareas pendientes',
    'todo.hide': 'Ocultar',
    'todo.show': 'Mostrar',
    'todo.more': '... y {count} más',
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
    'help.commands.emptyConnected': 'Conéctate a un servidor para ver los comandos y skills disponibles'
  },
  it: {
    'app.title': 'OpenCode Mobile',
    'app.exitTitle': 'Chiudere app?',
    'app.exitMessage': 'Sei sicuro di voler uscire?',
    'app.exitOk': 'Chiudi',
    'app.exitCancel': 'Annulla',
    'nav.settings': 'Impostazioni',
    'nav.sessions': 'Sessioni',
    'nav.detail': 'Dettaglio',
    'nav.help': 'Aiuto',
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
    'settings.connectedSaved': 'Connesso a OpenCode {version}. Configurazione salvata.',
    'settings.draftHint': 'Le modifiche restano in bozza finché tocchi Salva. Test controlla i campi qui sotto senza salvare né cambiare pagina.',
    'settings.testedNotSaved': 'Connessione OK: OpenCode {version}. Non è stato ancora salvato nulla.',
    'settings.savedButton': 'Salvato',
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
    'settings.navBarPosition': 'Barra di navigazione',
    'settings.navBarBottom': 'In basso',
    'settings.navBarHeader': 'In alto',
    'connection.connecting': 'Connessione a OpenCode...',
    'connection.loadingSessions': 'Connessione e caricamento sessioni...',
    'connection.refreshing': 'Aggiornamento sessioni...',
    'connection.reconnecting': 'Connessione lenta; riprovo in silenzio...',
    'connection.connected': 'Connesso',
    'connection.offline': 'OpenCode non è raggiungibile',
    'settings.connectionFailed': 'Connessione fallita: {message}',
    'settings.connectedTo': 'Connesso a OpenCode {version}',
    'settings.language': 'Lingua',
    'settings.theme': 'Tema',
    'settings.themeSystem': 'Sistema',
    'settings.themeScheduled': 'Programmato (giorno/notte)',
    'settings.themeLight': 'Chiaro',
    'settings.themeDark': 'Scuro',
    'sessions.title': 'Sessioni',
    'sessions.summary': '{total} totali · {active} attive · {changed} con modifiche',
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
    'sessions.emptyTitle': 'Nessuna sessione trovata',
    'sessions.emptyHint': 'Crea una nuova sessione per iniziare',
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
    'detail.composerPlaceholder': 'Scrivi un prompt o comando (inizia con / per gli slash command)...',
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
    'todo.title': 'Todo',
    'todo.hide': 'Nascondi',
    'todo.show': 'Mostra',
    'todo.more': '... e altri {count}',
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
    'help.commands.emptyConnected': 'Connettiti a un server per vedere comandi e skills disponibili'
  },
  'zh-TW': {
    'app.title': 'OpenCode 遠端',
    'app.exitTitle': '關閉應用程式？',
    'app.exitMessage': '確定要退出嗎？',
    'app.exitOk': '關閉',
    'app.exitCancel': '取消',
    'nav.settings': '設定',
    'nav.sessions': '工作階段',
    'nav.detail': '詳情',
    'nav.help': '說明',
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
    'settings.connectedSaved': '已連線至 OpenCode {version}。設定已儲存。',
    'settings.draftHint': '變更會保持草稿，直到點選儲存。測試只檢查下方欄位，不會儲存或切換頁面。',
    'settings.testedNotSaved': '連線正常：OpenCode {version}。尚未儲存任何變更。',
    'settings.savedButton': '已儲存',
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
    'settings.navBarPosition': '導航欄位置',
    'settings.navBarBottom': '底部',
    'settings.navBarHeader': '頂部',
    'connection.connecting': '正在連線到 OpenCode...',
    'connection.loadingSessions': '正在連線並載入工作階段...',
    'connection.refreshing': '正在重新整理工作階段...',
    'connection.reconnecting': '連線較慢；正在安靜重試...',
    'connection.connected': '已連線',
    'connection.offline': '無法連線到 OpenCode',
    'settings.connectionFailed': '連線失敗：{message}',
    'settings.connectedTo': '已連線至 OpenCode {version}',
    'settings.language': '語言',
    'settings.theme': '主題',
    'settings.themeSystem': '跟隨系統',
    'settings.themeScheduled': '定時切換（日/夜）',
    'settings.themeLight': '淺色',
    'settings.themeDark': '深色',
    'sessions.title': '工作階段',
    'sessions.summary': '{total} 總數 · {active} 進行中 · {changed} 有變更',
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
    'sessions.emptyTitle': '找不到工作階段',
    'sessions.emptyHint': '建立新的工作階段以開始',
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
    'detail.composerPlaceholder': '輸入提示或命令（以 / 開頭使用斜線命令）...',
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
    'todo.title': '待辦事項',
    'todo.hide': '隱藏',
    'todo.show': '顯示',
    'todo.more': '... 還有 {count} 項',
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
    'help.commands.emptyConnected': '連線至伺服器以查看可用的命令與技能'
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
