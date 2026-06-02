import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')
const icons = readFileSync(new URL('./Icons.tsx', import.meta.url), 'utf8')
const styles = readFileSync(new URL('./styles.css', import.meta.url), 'utf8')

const refreshButton = app.match(/<button onClick=\{refreshSessionsWithIndicator\}[\s\S]*?\{t\('sessions\.refresh'\)\}[\s\S]*?<\/button>/)
assert.ok(refreshButton, 'sessions refresh button should call refreshSessionsWithIndicator')
assert.ok(refreshButton[0].includes('RefreshIcon'), 'idle sessions refresh button should render a non-spinning RefreshIcon')
assert.ok(refreshButton[0].includes('refreshingSessions ? <LoadingIcon'), 'refresh button should spin only during an active manual refresh')

assert.ok(app.includes('messageScrollSignature'), 'conversation auto-scroll should react to message content changes, not only message count')
assert.ok(app.includes('scrollMessagesToBottom("auto")'), 'auto-scroll should re-anchor the conversation at the bottom on new messages')
assert.ok(app.includes('scrollMessagesToBottom("smooth")'), 'focusing the composer should scroll to the bottom')
assert.ok(app.includes('messagesEndRef'), 'auto-scroll should target a bottom sentinel marker')
assert.ok(app.includes('scrollTo({ top: container.scrollHeight'), 'auto-scroll should set the messages container scrollTop to its max scrollHeight')
assert.ok(app.includes('scrollIntoView'), 'auto-scroll should scroll the sentinel into view as a fallback')
assert.ok(app.includes('composerRef'), 'auto-scroll should know the sticky composer height so the latest message is not hidden behind input controls')
assert.ok(app.includes('syncChatBottomClearance'), 'detail view should update chat bottom clearance from the rendered composer size')
assert.ok(app.includes('scrollBy({ top: coveredByComposer'), 'page-level auto-scroll should compensate when the sentinel is covered by the sticky composer')
assert.ok(/\.messages[\s\S]*?padding-bottom:\s*var\(--chat-bottom-clearance/.test(styles), 'messages pane should reserve bottom space for the sticky composer')
assert.ok(/\.messages-end[\s\S]*?scroll-margin-bottom:\s*var\(--chat-bottom-clearance/.test(styles), 'bottom sentinel should keep the latest output above the sticky composer')
assert.ok(/requestAnimationFrame\(\(\) => \{[\s\S]*?requestAnimationFrame\(\(\) => \{/.test(app), 'auto-scroll should wait for the next two frames so freshly rendered content is laid out before scrolling')
assert.ok(app.includes('sessionsScrollYRef'), 'session list scroll position should be saved before navigating to a session')
assert.ok(app.includes('typing-bubble'), 'detail view should render a temporary typing bubble while waiting for OpenCode output')
assert.ok(app.includes('typing-dot'), 'typing bubble should show animated dots')
assert.ok(app.includes('awaitingAssistantReply'), 'typing bubble should stay visible after the send request returns and until a new assistant message arrives')
assert.ok(app.includes('assistantResponseSignature'), 'typing bubble should be replaced by the next assistant response')

assert.match(icons, /export const RefreshIcon/, 'RefreshIcon should exist for idle refresh UI')

console.log('ui regression tests passed')
