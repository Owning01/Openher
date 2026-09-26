import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cssBundle } from './css-bundle.mjs'
import { buildDesktopNarrowCss, DESKTOP_NARROW_URL } from './genDesktopCss.mjs'

// styles.css solo ve los @import propios. Los estilos que entra por import de
// componente (chat-pin.css, chat-menu.css, imagegen.css, debate.css,
// team.css, canvas.css, flowchart.css) NO entran por ahi y en el bundle de
// Vite caen DESPUES de styles.css, asi que una asercion que los ignore puede
// pasar mientras se shippea CSS que nunca se vio.
const COMPONENT_CSS = [
  'styles/chat-pin.css',
  'styles/chat-menu.css',
  'styles/imagegen.css',
  'styles/debate.css',
  'styles/team.css',
  'styles/canvas.css',
  'styles/flowchart.css',
]

const sessionList = readFileSync(new URL('./components/SessionList.tsx', import.meta.url), 'utf8')
const sessionToolbar = readFileSync(new URL('./components/SessionToolbar.tsx', import.meta.url), 'utf8')
const msgList = readFileSync(new URL('./components/MessageList.tsx', import.meta.url), 'utf8')
const msgBubble = readFileSync(new URL('./components/MessageBubble.tsx', import.meta.url), 'utf8')
const composer = readFileSync(new URL('./components/Composer.tsx', import.meta.url), 'utf8')
const sessionCard = readFileSync(new URL('./components/SessionCard.tsx', import.meta.url), 'utf8')
const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')
const controller = readFileSync(new URL('./app/useAppController.ts', import.meta.url), 'utf8')
const baseChatPropsSource = readFileSync(new URL('./features/chat/hooks/useBaseChatProps.ts', import.meta.url), 'utf8')
const hostActions = readFileSync(new URL('./features/host-actions/hooks/useHostActions.ts', import.meta.url), 'utf8')
const lifecycle = readFileSync(new URL('./features/app-lifecycle/hooks/useAppLifecycle.ts', import.meta.url), 'utf8')
const api = [readFileSync(new URL('./api.ts', import.meta.url), 'utf8'), ...["health","sessions","messages","prompt","providers","config","fs","mcp","questions","permissions","versionDispatch","index"].map((f) => readFileSync(new URL(`./api/${f}.ts`, import.meta.url), 'utf8')), ...["client","version","mappers","opencodeClient"].map((f) => readFileSync(new URL(`./shared/api/${f}.ts`, import.meta.url), 'utf8'))].map((s) => s.replace(/const ([A-Za-z_$][\w$]*) = (async )?\(/g, '$1(')).join('\n')
const useMessages = ["hooks/useMessages.ts","hooks/useMessageSend.ts","hooks/useStreamPatch.ts","stores/outboxStore.ts","stores/translationOriginals.ts","utils/messageShape.ts","utils/parseCommand.ts"].map((f) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).join('\n')
const useAI = readFileSync(new URL('./hooks/useAI.ts', import.meta.url), 'utf8')
const useSessions = ["hooks/useSessions.ts","entities/session/sessionsPlan.ts","entities/session/model.ts"].map((f) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).join('\n')
const useConfig = readFileSync(new URL('./hooks/useConfig.ts', import.meta.url), 'utf8')
const icons = readFileSync(new URL('./Icons.tsx', import.meta.url), 'utf8')
const styles = [cssBundle(), ...COMPONENT_CSS.map((f) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8'))].join('\n')

// Desktop (wry) a cualquier ancho: desktop-narrow.css reproyecta el layout
// desktop de layout.css a html[data-desktop="true"]; es generado, y si
// layout.css cambió sin regenerar, esto falla.
const desktopNarrow = readFileSync(DESKTOP_NARROW_URL, 'utf8')
assert.equal(
  desktopNarrow.replace(/\r\n/g, '\n'),
  buildDesktopNarrowCss(),
  'desktop-narrow.css desincronizado: correr "node scripts/gen-desktop-css.mjs"'
)
assert.ok(
  /html\[data-desktop="true"\] \.app-desktop-activity \{[\s\S]*?flex-direction: column/.test(desktopNarrow),
  'desktop angosto: el rail de actividades debe conservar su columna'
)
assert.ok(
  /html\[data-desktop="true"\] \.desktop-cell \{[\s\S]*?display: flex/.test(desktopNarrow),
  'desktop angosto: las celdas del grid deben conservar su layout de escritorio'
)
assert.ok(
  /html\[data-desktop="true"\] \.app-desktop-sidebar \{[\s\S]*?flex-direction: column/.test(desktopNarrow),
  'desktop angosto: la sidebar debe conservar su columna (header/body apilados)'
)
assert.ok(
  /html\[data-frameless="true"\]\[data-desktop="true"\] \.app-shell \{[\s\S]*?height: calc\(100dvh - 38px\)/.test(desktopNarrow),
  'desktop angosto: el shell frameless no debe desbordar por la titlebar de 38px'
)

const refreshButton = sessionToolbar.match(/<button onClick=\{handleRefresh\}[\s\S]*?<\/button>/)
assert.ok(refreshButton, 'sessions refresh button should call refreshSessionsWithIndicator')
assert.ok(refreshButton[0].includes('RefreshIcon'), 'idle sessions refresh button should render a RefreshIcon')
assert.ok(refreshButton[0].includes('refreshing ? null'), 'refresh button should show no icon during an active manual refresh (spinners retirados por pedido)')
assert.ok(!refreshButton[0].includes('LoadingIcon'), 'refresh button must not render a spinner')
assert.ok(sessionToolbar.includes('setRefreshFeedback(ok ? "ok" : "fail")'), 'refresh button should show ok/fail feedback based on the refresh result')
assert.ok(sessionToolbar.includes('onRefresh: () => Promise<boolean>'), 'refresh should resolve whether it succeeded')

assert.ok(useMessages.includes('messageScrollSignature'), 'conversation auto-scroll should react to message content changes, not only message count')
assert.ok(msgList.includes('scrollToBottom("auto")'), 'auto-scroll should re-anchor the conversation at the bottom on new messages')
assert.ok(composer.includes('behavior: "smooth"'), 'focusing the composer should scroll to the bottom')
assert.ok(msgList.includes('messagesEndRef'), 'auto-scroll should target a bottom sentinel marker')
assert.ok(msgList.includes('bottomTarget('), 'auto-scroll should anchor at the end of the MESSAGES (bottomTarget), not at the end of the scroll area (cola vacía)')
assert.ok(msgList.includes('bottomDistance('), 'distance-to-bottom must ignore the empty tail (bottomDistance)')
assert.ok(msgList.includes('Sentinela SIEMPRE presente'), 'bottom sentinel must render in every branch (empty/loading included) so the scroll has a defined end')
assert.ok(msgList.includes('scrollIntoView'), 'auto-scroll should scroll the sentinel into view as a fallback')
assert.ok(composer.includes('composerRef'), 'auto-scroll should know the sticky composer height so the latest message is not hidden behind input controls')
assert.ok(composer.includes('scrollTo') || msgList.includes('scrollTo'), 'auto-scroll should set container scrollTop')
assert.ok(/\.messages[\s\S]*?padding-bottom:\s*(var\(--space-2\)|env\(safe-area-inset-bottom\))/.test(styles), 'messages pane should reserve bottom space')
assert.ok(/\.messages-end[\s\S]*?scroll-margin-bottom:\s*var\(--space-2\)/.test(styles), 'bottom sentinel should keep the latest output above the sticky composer')
assert.ok(
  /\.messages::after\s*\{[\s\S]*?height:\s*var\(--chat-tail/.test(styles),
  'chat should always be scrollable: the empty tail is measured (--chat-tail) so max scroll stops with the last user message on screen'
)
assert.ok(
  /--chat-tail/.test(msgList) && /MIN_COLA/.test(msgList),
  'the tail size must be computed against the last user message, not hardcoded to a full screen (that blanked the chat)'
)

// Loader de sesión en actividad: solo en accesos rápidos (favoritos/recientes).
// (Los asserts de la definición de `Bars` viven al final, junto a los de spinners.)
assert.ok(!sessionList.includes('quick-access-busy'), 'the activity bars belong to QuickAccessCard, not to the project session list')
assert.ok(
  /\.messages \.message\.user:not\(\.outbox-queued\)\s*\{[^}]*max-height:\s*100px[^}]*overflow-y:\s*auto/.test(styles),
  'user bubble must always cap its height at 100px with internal scroll (outbox draft excluded)'
)
assert.ok((composer + msgList).includes('requestAnimationFrame'), 'auto-scroll should use requestAnimationFrame')
assert.ok(sessionCard.includes('session-card'), 'session card should have card class')
assert.ok(app.includes('typing-bubble') || msgList.includes('typing-bubble'), 'detail view should render a temporary typing bubble while waiting for OpenCode output')
assert.ok(!msgList.includes('GridSpinner'), 'typing bubble should not render a spinner (spinners retirados por pedido)')
assert.ok(useMessages.includes('awaitingAssistantReply'), 'typing bubble should stay visible after the send request returns and until a new assistant message arrives')
assert.ok(useMessages.includes('assistantResponseSignature'), 'typing bubble should be replaced by the next assistant response')
assert.ok(useMessages.includes('optimisticUserMessages'), 'sent user messages should render immediately before the network round trip returns')
assert.ok(useMessages.includes('createOptimisticUserMessage') || useMessages.includes('optimisticMessage'), 'send flow should create an optimistic user message envelope')
assert.ok((app + controller).includes('isWorking = awaitingAssistantReply || isSessionRunning'), 'working state should track assistant reply and session status for typing bubble')
assert.ok(composer.includes('isWorking') && composer.includes('onAbort'), 'composer should show abort button when working')
assert.ok(composer.includes('handleSendWithImages') && !composer.includes('onClick={isWorking ? onAbort : onSend}'), 'send button should always be available for multiple prompts')
assert.ok(useMessages.includes('completionShouldPlayRef.current = true'), 'completion sound should be armed when a real assistant reply is expected')
const completionAudio = readFileSync(new URL('./hooks/useCompletionAudio.ts', import.meta.url), 'utf8')
assert.ok(completionAudio.includes('wasAwaitingRef.current && !awaitingAssistantReply'), 'completion sound should play only when assistant waiting ends, not when the user bubble renders')
assert.ok(completionAudio.includes('completionShouldPlayRef.current'), 'completion sound armed flag should be checked')
assert.ok(useMessages.includes('loadSelectedRequestRef'), 'session message refreshes should ignore stale overlapping polling responses')
assert.ok(useMessages.includes('if (requestID !== loadSelectedRequestRef.current) return'), 'older loadSelected requests must not overwrite newer assistant output')
assert.ok(useMessages.includes('setMessages((prev)'), 'message refresh should merge server data with existing, dedup by id')
assert.ok(composer.includes('SendIcon'), 'composer send button should use the clear paper-plane SendIcon')
assert.ok(composer.includes('StopCircleIcon'), 'composer waiting button should use a clear stop-task icon')
assert.match(icons, /export const StopCircleIcon/, 'StopCircleIcon should exist in the shared SVG icon set')
assert.ok(api.includes('loadDiff(config: ServerConfig, sessionID: string, directory?: string)'), 'detail view should load /session/:id/diff for changed-file details')
const sheetFile = readFileSync(new URL('./components/BottomSheet.tsx', import.meta.url), 'utf8')
assert.ok(sheetFile.includes('diffFiles.length > 0'), 'changed-file panel should be hidden when there are no changed files')
assert.ok(sheetFile.includes('activeSheet === "details"'), 'VCS and file status should be consolidated into the details bottom sheet')
assert.ok(sheetFile.includes('diffFiles.length > 0 ?'), 'details sheet should summarize changed files when diff data exists')
const sidecar = readFileSync(new URL('./hooks/useSessionSidecar.ts', import.meta.url), 'utf8')
assert.ok(sidecar.includes('api.loadProjectCurrent(config, directory)'), 'project dashboard should use /project/current')
assert.ok(sidecar.includes('api.loadVcs(config, directory)'), 'project dashboard should use /vcs')
assert.ok(sidecar.includes('api.loadFileStatus(config, directory)'), 'project dashboard should use /file/status')
assert.ok(/\.project-dashboard[\s\S]*?grid-template-columns:\s*repeat\(3/.test(styles), 'project dashboard should render as compact cards on wide screens')
assert.ok(/@media \(max-width: 780px\)[\s\S]*?\.project-dashboard[\s\S]*?grid-template-columns:\s*1fr/.test(styles), 'project dashboard should stack on mobile')
assert.ok(app.includes('connectionState'), 'sessions view should track connection state separately from one-off runtime errors')
assert.ok(useSessions.includes('backgroundFailureCountRef.current += 1'), 'background refresh should count failures before showing persistent offline errors')
assert.ok(useSessions.includes('backgroundFailureCountRef') && useSessions.includes('current = 0'), 'transient failures should reset counter on success')
assert.ok(sessionList.includes('connection-pending'), 'initial slow connection should show an explicit loading state instead of an empty sessions list')

assert.ok(app.includes('showNewSessionPicker'), 'New Session should open a per-session folder picker instead of applying one global folder')
assert.ok(api.includes('listFiles(config: ServerConfig, path: string, directory?: string)'), 'API should expose OpenCode /file for directory browsing')
const folderPicker = readFileSync(new URL('./components/FolderPicker.tsx', import.meta.url), 'utf8')
const folderPickerHook = readFileSync(new URL('./hooks/useFolderPicker.ts', import.meta.url), 'utf8')
assert.ok(folderPicker.includes("t('sessions.newSessionTitle')"), 'folder picker should be localized')
assert.ok(folderPickerHook.includes('CURSOR_STORAGE_KEY'), 'last new-session folder should persist separately from connection settings')
assert.ok(folderPickerHook.includes('export function dirParent'), 'folder picker should navigate absolute paths up through drive roots')
assert.ok(folderPickerHook.includes('api.loadPath(config)'), 'folder picker should start from the server directory when nothing is saved')
assert.ok(folderPickerHook.includes('api.listFiles(config, "", dir || undefined)'), 'folder picker should list the root of any absolute directory via ?directory=')
assert.ok(folderPicker.includes('onBrowse(item.absolute)'), 'folder picker should jump into folders by their absolute path')
assert.ok(app.includes('api.createSession(config, "Mobile session", activeModel, directory)') || useSessions.includes('api.createSession(config, "Mobile session"'), 'new sessions should pass only the picked directory to OpenCode')
assert.ok(app.includes('isProjectDirectory(pathInfo)') || useSessions.includes('isProjectDirectory(pathInfo)'), 'new session creation should reject folders that OpenCode resolves to the global project')
assert.ok(useSessions.includes('.some((s) => s.id === created.id)'), 'newly created sessions should be inserted before any refresh')
assert.ok(useSessions.includes('const refreshSessions = useCallback'), 'session refresh should accept a newly created session to preserve across stale React state')
assert.ok(api.includes('createSession(config: ServerConfig, title?: string, model?: ModelSelection, directory?: string)'), 'createSession API should accept a directory')
assert.ok(api.includes('withDirectory("/session", directory)'), 'new session creation should append ?directory= when set')
assert.ok(api.includes('loadTodo(config: ServerConfig, sessionID: string, directory?: string)'), 'todo requests should be directory-aware')
assert.ok(api.includes('loadDiff(config: ServerConfig, sessionID: string, directory?: string)'), 'diff requests should be directory-aware')
assert.ok(api.includes('abort(config: ServerConfig, sessionID: string, directory?: string)'), 'abort requests should be directory-aware')
assert.ok(api.includes('listGlobalSessions(config: ServerConfig, limit?: number)'), 'sessions view should use global session discovery when available')
assert.ok(api.includes('x-next-cursor'), 'global session discovery should page through all experimental session results')
assert.ok(useSessions.includes('api.listGlobalSessions(config).catch(() => api.listSessions(config)'), 'sessions loaded via global discovery with fallback')
assert.ok(useSessions.includes('api.loadLatestMessage') === false, 'latest-message N+1 removed for speed')
assert.ok(useSessions.includes('session.time.updated'), 'sessions use time.updated for ordering')

const themeVariant = readFileSync(new URL('./context/themeVariant.tsx', import.meta.url), 'utf8')
assert.ok(themeVariant.includes('localStorage.getItem(STORAGE_KEY)'), 'theme preference should persist separately from server settings')
assert.ok(styles.includes(':root[data-theme="dark"]'), 'dark mode should override design tokens through CSS variables')

const markdownRenderer = readFileSync(new URL('./components/Markdown.tsx', import.meta.url), 'utf8')
assert.ok(markdownRenderer.includes('ReactMarkdown'), 'messages should use a maintained Markdown renderer')
assert.ok(markdownRenderer.includes('remarkGfm'), 'messages should support GitHub-flavored Markdown')
assert.ok(/\.message-content pre[\s\S]*?overflow-x:\s*auto/.test(styles), 'fenced code blocks should render as scrollable blocks')

assert.match(icons, /export const RefreshIcon/, 'RefreshIcon should exist for idle refresh UI')

// Sesiones de acceso rápido con scroll y sin topes artificiales
assert.ok(!sessionList.includes('favoriteSessions.slice(0, 5)'), 'favorites should not be hard-capped at 5')
assert.ok(!sessionList.includes('recentFiltered.slice(0, 5)'), 'recent sessions should not be hard-capped at 5')
assert.ok(styles.includes('.quick-access-list') && styles.includes('overflow-y: auto'), 'quick access list should be scrollable')

// Spinners retirados por pedido (ver LOADING-STATES.md): las sesiones busy no
// llevan indicador giratorio y el chat de carga tampoco. El único indicador de
// actividad es el loader de BARRAS, y solo en favoritos/recientes.
const quickAccess = readFileSync(new URL('./components/QuickAccessCard.tsx', import.meta.url), 'utf8')
assert.ok(!quickAccess.includes('GridSpinner'), 'busy sessions must not render a spinner')
assert.ok(!quickAccess.includes('pill ${session.status}'), 'busy/retry should not share a single pill class')
assert.ok(!styles.includes('pixel-spinner') && !styles.includes('.composer-cost') && !styles.includes('.stream-dot'), 'removed spinners and chat cost label should not reappear')
assert.ok(!styles.includes('image-rendering: pixelated'), 'pixelated image rendering on the spinner should not reappear')
assert.ok(!msgList.includes('GridSpinner'), 'session loading state should not show a spinner')
// 25-sep (2do cambio): la fila de metadatos vuelve a ser hermana DEBAJO de la caja
// de texto y los botones (adjuntar / enviar / micro) van DENTRO de la caja. El
// composer no gasta una línea por fusionar, pero tampoco apila los botones abajo.
assert.ok(!composer.includes('composer-ring') && !composer.includes('composer-dots'), 'composer must not render the animated dots')
assert.ok(!styles.includes('composer-bounce') && !styles.includes('composer-dots'), 'the bounce keyframes and dots styles must be gone from the CSS')
assert.ok(
  /<ComposerBar[\s\S]*?<\/div>/.test(composer) && composer.indexOf('<ComposerBar') > composer.indexOf('className={`composer-input-wrap'),
  'the metadata row must be rendered after the input wrap (a sibling row under the text box)'
)
{
  // Estructural: <ComposerBar> tiene que caer despues del </div> que cierra el wrap.
  const wrapAt = composer.indexOf('className={`composer-input-wrap')
  const wrapEnd = composer.indexOf('</div>', wrapAt)
  assert.ok(wrapAt > 0 && composer.indexOf('<ComposerBar') > wrapEnd, 'the metadata row must be a sibling of the input wrap, not a child of it')
}
assert.ok(
  /\.composer-inline-btn\s*\{[^}]*position:\s*absolute[^}]*top:\s*50%[^}]*transform:\s*translateY\(-50%\)/.test(styles),
  'composer buttons must live inside the text box (absolute, vertically centered) in desktop and mobile'
)
assert.ok(
  /\.composer-input-wrap textarea\s*\{[^}]*padding:\s*0\.5rem 2\.6rem/.test(styles),
  'the textarea must reserve the lateral space of the in-box buttons'
)
assert.ok(
  /\.composer-input-wrap\.is-working\.has-mic textarea\s*\{[^}]*padding-right:\s*9\.2rem/.test(styles),
  'while working with mic, the textarea must clear the third button (stop)'
)
// Lote 25-sep "Working": resumen por componente, sin barra/ícono, shimmer de
// anim-lab, rutas en color hueso, subagentes fuera de la caja y el mensaje
// <subagent>…</subagent> acoplado con scroll.
assert.ok(
  msgBubble.includes('splitActivityByComponent') && msgBubble.includes('turn-components') && msgBubble.includes('turn-component-summary'),
  'the working box must group its activity per component with its own summary'
)
assert.ok(
  msgBubble.includes('subagent-rows') && !/\.tool-parts[\s\S]{0,400}isTaskToolPart/.test(msgBubble),
  'subagent cards must be rendered outside the working box (subagent-rows)'
)
assert.ok(
  !/icon=\{activity\.working \? <ToolIcon/.test(msgBubble),
  'the working title must not carry a tool icon'
)
assert.ok(
  msgBubble.includes('ShimmerText') && styles.includes('@keyframes shimmer-text-wave') && styles.includes('.shimmer-char'),
  'the working title must shimmer while the turn runs (anim-lab ldg-text-shimmer-wave port)'
)
// El crédito del puerto va en el CÓDIGO fuente: el bundle de `cssBundle()` viene
// sin comentarios, así que hay que leer los archivos.
assert.ok(
  readFileSync(new URL('./styles/chat.css', import.meta.url), 'utf8').includes('ldg-text-shimmer-wave')
    && readFileSync(new URL('./components/ShimmerText.tsx', import.meta.url), 'utf8').includes('ldg-text-shimmer-wave')
    && readFileSync(new URL('./components/ShimmerText.tsx', import.meta.url), 'utf8').includes('MIT'),
  'the shimmer port must credit anim-lab / loading-ui (MIT) in the source'
)
assert.ok(
  !/\.activity-box::before/.test(styles),
  'the left color bar of the working box must not come back'
)
assert.ok(
  /\.activity-box-working \.collapsible-title\s*\{|color: var\(--muted\)/.test(styles),
  'working must use the same color as the tools'
)
assert.ok(
  /\.tool-target-text\s*\{[^}]*text-bone/.test(styles),
  'tool targets (paths/commands) must use the muted bone color, not full --text'
)
assert.ok(
  /\.subagent-attached\s*\{[^}]*max-height:\s*500px[^}]*overflow-y:\s*auto/.test(styles),
  'a <subagent> message must be an attached block with max-height 500px and internal scroll'
)
assert.ok(
  msgBubble.includes('userSubagentBlock') && /<subagent>\(\[\\s\\S\]\*\)<\\\/subagent>/.test(msgBubble),
  'the <subagent>…</subagent> wrapper must be detected and stripped'
)
assert.ok(
  /\.overflow-group-body\s*\{[^}]*margin-right:\s*10px[^}]*border-right:/.test(styles),
  'the items inside the tools group must be indented to the right'
)
assert.ok(styles.includes('--safe-bottom') && !/\.composer-bar\s*\{[^}]*safe-bottom/.test(styles), 'the bottom safe-area inset belongs to .composer only (it used to be applied twice)')
// El reemplazo del spinner retirado son las barras de actividad, solo en
// favoritos/recientes y solo para `busy` (retry conserva su pill).
assert.ok(quickAccess.includes('session.status === "busy" && <Bars'), 'only busy sessions get the activity bars (idle/retry keep no mark)')
assert.ok(
  /session\.status !== "busy" && \(\s*<span className="quick-access-time"/.test(quickAccess),
  'the activity bars replace the timestamp: never both (they compete for the same width)'
)
assert.ok(quickAccess.includes('<Bars label={t(\'session.statusBusy\')}'), 'activity bars should reuse the existing translated status label')
assert.ok(
  /\.quick-access-busy\s*\{[\s\S]*?width:\s*13px/.test(styles) && /\.quick-access-busy-bar\s*\{[\s\S]*?min-width:\s*2px/.test(styles),
  'activity bars need an explicit loader width: percentage widths collapse to 0px in a flex row without one'
)
assert.ok(
  /@keyframes quick-access-busy-wave/.test(styles) && /prefers-reduced-motion[^}]*\.quick-access-busy-bar\s*\{[^}]*animation:\s*none/.test(styles),
  'activity bars must animate and go static under prefers-reduced-motion'
)
assert.ok(msgList.includes('aria-hidden="true"'), 'loading text should not duplicate the live region')

// Mensaje optimista: confirmación por reintento + orden estable por time.created
assert.ok(useMessages.includes('optimisticIDsRef'), 'send flow should track optimistic ids in a ref for async confirmation')
assert.ok(useMessages.includes('optimisticTextsRef'), 'send flow should track optimistic texts to recognize the SSE echo')
assert.ok(useMessages.includes('part.type === "text"'), 'SSE echo must be a text part to be matched as a user message')
assert.ok(useMessages.includes('await then().catch'), 'optimistic confirmation should fetch once after POST (TUI-like, sin poll)')
assert.ok(useMessages.includes('merged.sort((a, b) => (a.info.time.created'), 'message merge should sort by time.created so confirmed user messages land in position')

// Touch: hit targets táctiles (WCAG 2.5.8); excepción: composer compacto (36px) por pedido
assert.ok(styles.includes('@media (pointer: coarse), (max-width: 780px)'), 'touch targets should scale up on coarse pointers')
assert.ok(/@media \(pointer: coarse\), \(max-width: 780px\)[\s\S]*?min-width: 44px[\s\S]*?min-height: 44px/.test(styles), 'btn-icon should be at least 44px on touch')
assert.ok(/\.composer-bar-btn\s*\{[^}]*min-height:\s*3[06]px/.test(styles), 'composer send/stop buttons stay compact (30-36px) by explicit request')
// Los botones van DENTRO de la caja, así que el textarea SÍ reserva el hueco
// lateral (25-sep). Lo que no puede pasar es el padding viejo que aprovisionaba
// el stop+mic de otra época.
assert.ok(/\.composer-input-wrap textarea\s*\{[^}]*padding:\s*0\.5rem 2\.6rem/.test(styles), 'composer textarea should reserve the lateral space of the in-box buttons')
assert.ok(!/\.composer-input-wrap[^{]*textarea[^{]*\{[^}]*4\.4rem/.test(styles), 'no dead 4.4rem padding rule should come back')
assert.ok(!/\.composer-bar\s*\{[^}]*padding-left:\s*3\.1rem/.test(styles), 'the metadata row no longer clears the buttons (they are inside the box, not beside the row)')

// A11y: labels localizados en composer y nav
assert.ok(composer.includes("aria-label={t('composer.inputLabel')}"), 'composer textarea should have a localized aria-label')
assert.ok(composer.includes("title={t('composer.send')}"), 'composer send button should use a localized title')
const navBar = readFileSync(new URL('./components/NavBar.tsx', import.meta.url), 'utf8')
assert.ok(navBar.includes("t('nav.lightMode')") && navBar.includes("t('nav.darkMode')"), 'theme toggle should use localized labels')

// Móvil: la barra inferior flotante se retiró por pedido; el "+" de nueva
// sesión vive en el toolbar (solo icono, circular, color del tema, animado) y
// en nativo ≥781px (tablet/landscape del APK) se conserva el layout móvil.
assert.ok(!navBar.includes('bottomNavItems') && !styles.includes('.bottom-nav'), 'mobile must not render or style a floating bottom nav')
assert.ok(sessionToolbar.includes('<PlusIcon size={18} />') && !sessionToolbar.includes('btn-new-session-text'), 'new-session button must render only the "+" icon')
assert.ok(/\.btn-new-session\s*\{[^}]*border-radius:\s*var\(--radius-full\)/.test(styles), 'new-session button should be circular')
assert.ok(styles.includes('@keyframes new-session-shine'), 'new-session button should keep its idle animation')
assert.ok(styles.includes('html[data-desktop="false"] .app-shell'), 'native wide (APK ≥781) must keep the mobile layout')

// Memo de props del chat: sin objetos literales por render
assert.ok((app + controller + baseChatPropsSource).includes('const baseChatProps') && (app + controller + baseChatPropsSource).includes('useMemo'), 'chat props should be memoized to avoid cascading re-renders')

// Menú de niveles de pensamiento en el toggle del modelo del header
const chatView = readFileSync(new URL('./components/ChatView.tsx', import.meta.url), 'utf8')
const modelUtils = readFileSync(new URL('./utils/model-utils.ts', import.meta.url), 'utf8')
assert.ok(chatView.includes('ThinkingLevels'), 'model toggle should open a menu with thinking levels')
assert.ok(chatView.includes('onChangeVariant'), 'model toggle menu should switch the thinking level directly')
assert.ok(chatView.includes("t('detail.changeModel')"), 'model toggle menu should offer changing the model')
assert.ok(useAI.includes('activeModelVariants'), 'active model variants should come from useAI')
assert.ok(useAI.includes('variantsOf(modelOptions, activeModelOption)'), 'active model variants must be computed over the full model list (recent models included)')
assert.ok(useAI.includes('activeModelOption?.variant'), 'active model variant should derive from the resolved option, not stale state')
assert.ok(!app.includes('variantGroups.groups.get(modelKey(activeModelOption))'), 'active model variants must not come from variantGroups (excludes recent models)')
assert.ok(modelUtils.includes('export function variantsOf') && modelUtils.includes('export function groupModels'), 'model variants should be computed by shared helpers (DRY)')
const settingsPanel = readFileSync(new URL('./components/SettingsPanel.tsx', import.meta.url), 'utf8')
assert.ok(settingsPanel.includes('variantsOf(modelOptions, selected)'), 'settings should reuse the shared variants helper')
const bottomSheet = readFileSync(new URL('./components/BottomSheet.tsx', import.meta.url), 'utf8')
assert.ok(bottomSheet.includes('groupModels(options)'), 'model sheet should reuse the shared grouping helper')
assert.ok(bottomSheet.includes('push(group.base, ...group.variants)'), 'model sheet should render variants so thinking levels can be picked')
assert.ok(styles.includes('.header-model-menu'), 'model toggle menu should have its own styles')

// Botón Reiniciar PC (Extras de Settings) con confirmación
assert.ok(settingsPanel.includes("t('extras.restartHost')") && settingsPanel.includes('RefreshIcon'), 'settings extras should offer a restart action')
assert.ok(settingsPanel.includes('onRestartHost'), 'settings restart should call the host restart handler')
assert.ok((app + hostActions).includes('handleRestartHost') && (app + hostActions).includes("shutdown /r /t 10"), 'host restart should run through the server shell with a delay')
assert.ok((app + hostActions).includes("shutdown /s /t 0"), 'host shutdown should still run through the server shell')

// Envío: una falla de confirmación/refresh NO debe parecer una falla de envío
assert.ok(useMessages.includes('let ok = false'), 'send flow should track whether the POST itself succeeded')
assert.ok(useMessages.includes('ok = true'), 'send flow should mark success only after the POST resolves')
assert.ok(useMessages.includes('if (ok)'), 'confirmation loop should only run after a successful POST')
assert.ok(useMessages.includes('return ok'), 'send flow should return the POST success boolean')
assert.ok(useMessages.includes('removeOptimistic(optimisticMessage.info.id)'), 'optimistic message should be rolled back when the send truly failed')
assert.ok(!chatView.includes('shutdown /r'), 'chat overflow should not duplicate the host restart (it lives in Settings extras)')

// Menú "⋯" del chat (25-sep): grupo tools primero, raíz fija, sin huérfanas.
const chatHeader = readFileSync(new URL('./components/ChatHeader.tsx', import.meta.url), 'utf8')
const chatOverflow = readFileSync(new URL('./components/ChatOverflowMenu.tsx', import.meta.url), 'utf8')
const chatMenuCss = readFileSync(new URL('./styles/chat-menu.css', import.meta.url), 'utf8')
const mcpBrowser = readFileSync(new URL('./components/MCPBrowser.tsx', import.meta.url), 'utf8')
const hubModal = readFileSync(new URL('./components/OpenCodeHubModal.tsx', import.meta.url), 'utf8')
assert.ok(chatHeader.includes('groups={toolGroups}'), 'chat header should render the overflow menu with the tools group')
assert.ok(chatOverflow.includes('overflow-group-head') && chatOverflow.includes('aria-expanded'), 'overflow menu should render groups as an accordion with aria-expanded')
assert.ok(chatOverflow.includes('data-keep-open'), 'group toggle must not close the menu')
assert.ok(chatOverflow.includes('className="overflow-item"'), 'group children must keep the .overflow-item contract inside .dropdown-menu')
assert.ok(chatHeader.includes("tag: t('chat.viewTag')"), 'view items (MCP, OpenCode Config) should carry the view tag')
assert.ok(chatHeader.includes('separatorBefore: true'), 'settings should be separated from the root items')
// Toda acción cuyo botón de `leading` está oculto en móvil (responsive.css,
// ≤780px) tiene que estar en el ⋯: en el celu el menú es la única entrada.
assert.ok(
  styles.includes('.detail-header-actions .chat-term-btn') && styles.includes('.detail-header-actions .chat-notes-btn'),
  'mobile hides the leading buttons, so the ⋯ menu is the only entry point there'
)
for (const id of ['terminal', 'customize', 'export', 'fork', 'prompts']) {
  assert.ok(chatHeader.includes(`id: "${id}"`), `action ${id} must be reachable from the ⋯ menu (on mobile too)`)
}
assert.ok(!chatHeader.includes('id: "reading"'), 'reading mode is not in the ⋯ menu (user decision 25-sep)')
assert.ok(
  /id: "terminal"[\s\S]*?onSelect: onToggleChatTerm/.test(chatHeader),
  'the menu Terminal item must use the same handler as its header button (toggle the chat dock)'
)
assert.ok(chatMenuCss.includes('.overflow-group-chevron') && chatMenuCss.includes('rotate(90deg)'), 'group chevron should rotate when expanded')
assert.ok(!chatMenuCss.includes('!important'), 'chat menu css must not use !important')
// La vista de MCP queda como estaba: sin sección de skills (decisión del
// usuario 25-sep: "déjala como estaba antes de los cambios").
assert.ok(!mcpBrowser.includes('SkillsList') && !mcpBrowser.includes('shell.opencode'), 'MCP view stays as it was: no skills section inside it')
assert.ok(!hubModal.includes('SkillsList'), 'the skills list goes back to living inside the Hub tab')
assert.ok(hubModal.includes('filteredSkills'), 'the Hub keeps its own skills listing')

// Cola de prompts ELIMINADA por completo: el envío es directo y el server
// gestiona la concurrencia (encolar en la app causaba mensajes perdidos).
const featureFlags = readFileSync(new URL('./hooks/useFeatureFlags.ts', import.meta.url), 'utf8')
assert.ok(!featureFlags.includes('promptQueue'), 'prompt queue should be removed entirely')
assert.ok(!useMessages.includes('queuedPrompts'), 'useMessages should not hold queued prompts')
assert.ok(!useMessages.includes('queuePrompt'), 'useMessages should not expose queuePrompt')
assert.ok(!chatView.includes('queuedPrompts'), 'ChatView should not render a queued prompt badge or panel')

// Modo híbrido v1/v2: el server opencode v2 (beta) usa /api + { data } y el
// v1 rutas raíz. Auto-detección en health + toggle forzado en Settings.
const apiSource = [readFileSync(new URL('./api.ts', import.meta.url), 'utf8'), ...["health","sessions","messages","prompt","providers","config","fs","mcp","questions","permissions","versionDispatch","index"].map((f) => readFileSync(new URL(`./api/${f}.ts`, import.meta.url), 'utf8')), ...["client","version","mappers","opencodeClient"].map((f) => readFileSync(new URL(`./shared/api/${f}.ts`, import.meta.url), 'utf8'))].map((s) => s.replace(/const ([A-Za-z_$][\w$]*) = (async )?\(/g, '$1(')).join('\n')
assert.ok(apiSource.includes('resolveApiVersion'), 'API should resolve v1 vs v2 dialect')
assert.ok(apiSource.includes('rememberApiVersion'), 'API should cache the detected version per server')
assert.ok(apiSource.includes('unwrapData'), 'v2 responses wrapped in { data } should be unwrapped')
assert.ok(apiSource.includes('toMessageEnvelopeV1'), 'v2 messages should be mapped to v1 envelopes')
assert.ok(apiSource.includes('toSessionV1'), 'v2 sessions should be mapped to v1 sessions')
const useSSESource = readFileSync(new URL('./hooks/useSSE.ts', import.meta.url), 'utf8')
assert.ok(useSSESource.includes('api/event'), 'SSE on v2 should connect to /api/event (the v2 server exposes it)')
assert.ok(useSSESource.includes('resolveApiVersion'), 'SSE should use sync resolveApiVersion to avoid blocking the connect() on a health probe')
assert.ok(settingsPanel.includes('settings.apiVersion'), 'Settings should expose the API version selector')
assert.ok(useConfig.includes('apiVersion: "auto"'), 'default config should auto-detect API version')

// Polling: el fetch de mensajes NUNCA se saltea por tener SSE vivo. Si el
// stream pierde un evento sin replay (túnel móvil, revert), el poll es la
// única recuperación; antes el chat quedaba congelado hasta salir y volver.
assert.ok(!lifecycle.includes('shouldPull && !sseLive'), 'message fetch must not be gated by a live SSE stream')
assert.ok(lifecycle.includes('if (shouldPull)'), 'lifecycle poll should pull messages whenever the server reports changes')
const sessionPanel = readFileSync(new URL('./components/SessionChatPanel.tsx', import.meta.url), 'utf8')
assert.ok(sessionPanel.includes('if (updatedAdvanced || stale)'), 'desktop panel poll should refetch even while the stream is active')

// Learning responsive: en <=430px el SVG del roadmap se reemplaza por una
// lista táctil (targets 44px) y los diagramas de lección/lightbox dejan de
// forzar scroll horizontal; el buscador del sidebar puede encogerse.
const learningCss = readFileSync(new URL('./styles/learning.css', import.meta.url), 'utf8')
const learningMobile430 = learningCss.match(/@media \(max-width: 430px\) \{([\s\S]*?)\n\}/)
assert.ok(learningMobile430, 'learning.css debe declarar un bloque móvil @media (max-width: 430px)')
assert.ok(/\.learning-roadmap-diagram \{ display: none; \}/.test(learningMobile430[1]), 'a <=430px el SVG del roadmap se oculta y deja lugar a la lista táctil')
assert.ok(/\.learning-roadmap-list \{ display: grid;/.test(learningMobile430[1]), 'a <=430px la lista táctil del roadmap se muestra como grid')
assert.ok(/\.learning-lesson-diagram \.learning-diagram-wrap svg \{ min-width: 0;/.test(learningMobile430[1]), 'a <=430px el SVG de la lección no debe forzar scroll horizontal')
assert.ok(/\.learning-brand-text \{ display: none; \}/.test(learningMobile430[1]), 'a <=430px el texto del topbar se oculta (queda el icono)')
assert.ok(learningCss.includes('.learning-roadmap-list'), 'learning.css debe definir .learning-roadmap-list (base oculta en desktop)')
assert.ok(/\.learning-search-input \{[\s\S]*?min-width: 0;/.test(learningCss), 'el buscador del sidebar debe poder encogerse (min-width: 0)')

// Auto-flush de la cola visible: NO debe re-encolar el item mientras la sesión
// está ocupada (cada render duplicaba el pendiente en bucle infinito) y debe
// forzar el envío del item que YA salió de la cola. El Stop explícito deja la
// cola en hold para que el abort no arranque otro turno al instante.
assert.ok(controller.includes('isSharedOutboxHeld(selectedSession.id)'), 'auto-flush debe saltear la cola en hold tras Stop')
assert.ok(controller.includes('if (isSessionActive(selectedSession)) return'), 'auto-flush no debe correr con la sesión ocupada')
assert.ok(controller.includes('handleSend(next.images, undefined, next.text, true)'), 'auto-flush debe forzar el envío (sin re-encolar)')
const chatActions = readFileSync(new URL('./features/chat/hooks/useChatActions.ts', import.meta.url), 'utf8')
assert.ok(chatActions.includes('holdSharedOutbox(selectedSession.id)'), 'el Stop (móvil) debe dejar la cola en hold')
assert.ok(chatActions.includes('resumeSharedOutbox'), 'el envío manual / Enviar ahora debe reanudar la cola')
assert.ok(sessionPanel.includes('handleSend(next.images, undefined, next.text, true)'), 'auto-flush del desktop debe forzar el envío')
assert.ok(sessionPanel.includes('holdSharedOutbox(session.id)'), 'el Stop (desktop) debe dejar la cola en hold')

console.log('ui regression tests passed')
