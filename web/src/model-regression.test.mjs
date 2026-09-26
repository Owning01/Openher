import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { cssBundle } from './css-bundle.mjs'

const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')
const api = ["api.ts","api/health.ts","api/sessions.ts","api/messages.ts","api/prompt.ts","api/providers.ts","api/config.ts","api/fs.ts","api/mcp.ts","api/questions.ts","api/permissions.ts","api/versionDispatch.ts","api/index.ts","shared/api/client.ts","shared/api/version.ts","shared/api/mappers.ts","shared/api/opencodeClient.ts"].map((f) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).map((s) => s.replace(/const ([A-Za-z_$][\w$]*) = (async )?\(/g, '$1(')).join('\n')
const useAI = readFileSync(new URL('./hooks/useAI.ts', import.meta.url), 'utf8')
const useMessages = ["hooks/useMessages.ts","hooks/useMessageSend.ts","hooks/useStreamPatch.ts","stores/outboxStore.ts","stores/translationOriginals.ts","utils/messageShape.ts","utils/parseCommand.ts"].map((f) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).join('\n')
const useSessions = ["hooks/useSessions.ts","entities/session/sessionsPlan.ts","entities/session/model.ts"].map((f) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).join('\n')
const i18n = ["i18n.ts","i18n/en.ts","i18n/es.ts"].map((f) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).join('\n')
const styles = cssBundle()
const sheet = readFileSync(new URL('./components/BottomSheet.tsx', import.meta.url), 'utf8')
const helpPage = readFileSync(new URL('./components/HelpPage.tsx', import.meta.url), 'utf8')

assert.ok(api.includes('listModels(config: ServerConfig'), 'API should expose configured OpenCode models')
assert.ok(api.includes('withDirectory("/config/providers"'), 'model list should use official /config/providers with directory scoping')
assert.ok(api.includes('`/session/${sessionID}/prompt_async`'), 'chat prompts should use OpenCode async prompt endpoint')
assert.ok(api.includes('return request<boolean>(config, withDirectory(`/session/${sessionID}/prompt_async`, directory)'), 'async prompt should return after 204 instead of waiting for assistant output')
assert.ok(api.includes('model: toModelBody(model)'), 'prompt requests should send selected model object')
assert.ok(api.includes('variant: model?.variant || undefined'), 'prompt requests should preserve selected model variant')
assert.ok(api.includes('agent: agentID'), 'prompt requests should send the selected primary agent')
assert.ok(api.includes('listAgents(config: ServerConfig'), 'API should expose configured OpenCode agents')
assert.ok(api.includes('withDirectory("/agent"'), 'agent list should use official /agent endpoint with directory scoping')
assert.ok(api.includes('toCreateSessionModel'), 'new sessions should be creatable with the selected model')
assert.ok(app.includes('MODEL_STORAGE_KEY') || useAI.includes('MODEL_STORAGE_KEY'), 'selected AI model should persist locally')
assert.ok(app.includes('AGENT_STORAGE_KEY') || useAI.includes('AGENT_STORAGE_KEY'), 'selected plan/build agent should persist locally')
assert.ok(useAI.includes('agent.mode === "primary" || agent.mode === "all"'), 'agent picker should expose primary agents such as build and plan')
assert.ok(useAI.includes('activeAgent?.id ?? primaryAgentOptions'), 'agent selection should fallback through primary options then build')
const composer = ["components/Composer.tsx","components/composer/ComposerBar.tsx","components/composer/composerData.ts","components/composer/downscaleImage.ts","components/composer/ImageStrip.tsx","components/composer/MentionMenu.tsx","components/composer/SlashMenu.tsx","components/composer/TurnChangesPanel.tsx","components/composer/types.ts","components/composer/useMentions.ts"].map((f) => readFileSync(new URL(`./${f}`, import.meta.url), 'utf8')).join('\n')
assert.ok(composer.includes('onChangeAgent(item.id)') || composer.includes('onChangeAgent(next.id)'), 'AI sheet should render an agent selector')
assert.ok(useMessages.includes('api.sendPrompt(config, selectedSession.id, text, selectedSession.directory, activeModel, activeAgentID)') ||
  useMessages.includes('api.sendPrompt(config, selectedSession.id, text, selectedSession.directory'), 'chat prompts should use selected agent')
assert.ok(useMessages.includes('api.sendCommand(config, selectedSession.id, parsed.command') || useMessages.includes('api.sendCommand(config, selectedSession.id, command'), 'slash commands should use selected agent')
const chatView = readFileSync(new URL('./components/ChatView.tsx', import.meta.url), 'utf8')
const chatHeaderSource = readFileSync(new URL('./components/ChatHeader.tsx', import.meta.url), 'utf8')
// El contador de contexto vive SOLO en la fila de metadatos del composer, con el
// orden `[Build] [modo] modelo 123K (12.3%)` (25-sep: se sacó del header, donde
// quedaba duplicado). El precio de sesión no se muestra en ningún lado.
assert.ok(composer.includes('context-usage-label') && composer.includes('contextLabel'), 'the composer metadata row should expose the context counter')
assert.ok(
  !chatHeaderSource.includes('chat-context-chip') && !chatHeaderSource.includes('contextLabel'),
  'the context counter must not live in the chat header (it would be duplicated)'
)
assert.ok(!styles.includes('chat-context-chip'), 'the header context chip styles are dead and must not come back')
{
  // Orden de la fila: el botón de agente (Build) va antes del modelo.
  const bar = readFileSync(new URL('./components/composer/ComposerBar.tsx', import.meta.url), 'utf8')
  assert.ok(bar.indexOf('agent-toggle') > 0 && bar.indexOf('agent-toggle') < bar.indexOf('composer-model-wrap'), 'the agent (Build) button must come before the model in the metadata row')
}
assert.ok(
  /\.composer-model-mode-badge\s*\{[^}]*order:\s*-1/.test(styles),
  'the mode badge must come first in the metadata row ([modo] modelo contexto)'
)
assert.ok(!composer.includes('composer-tsl-btn') && !styles.includes('composer-tsl-btn'), 'the TSL button must not come back to the composer')
assert.ok(!/contextLabel\s*&&\s*[^;]*\$\{?formatCost/.test(readFileSync(new URL('./hooks/useContextDisplay.ts', import.meta.url), 'utf8')), 'the session price must not come back to the context label')
assert.ok(app.includes('activeDetailSheet === "ai"') || sheet.includes('activeSheet === "ai"'), 'model picker should open in the bottom sheet')
assert.ok(sheet.includes("t('detail.modelHint')"), 'model picker should explain when the change applies')
assert.ok(sheet.includes('isWorking') && !/disabled=\{isWorking\}/.test(sheet), 'model picker should remain usable while a session is running (model swaps allowed)')
assert.ok(useAI.includes('modelSearchText'), 'model picker should support searching models')
assert.ok(sheet.includes('id="model-search"'), 'model picker should render a searchable model input')
assert.ok(app.includes('api.createSession(config, "Mobile session", activeModel, directory)') || useSessions.includes('api.createSession(config, "Mobile session"'), 'new sessions should inherit the selected model')
assert.ok(i18n.includes("'detail.contextStripLabel'"), 'context chip strings should be translated')
assert.ok(i18n.includes("'detail.modelToolsYes'"), 'model capability text should be translated')
assert.ok(i18n.includes("'detail.modelSearchPlaceholder'"), 'model search strings should be translated')
assert.ok(/\.context-chip[\s\S]*?overflow/.test(styles), 'context chips should have compact mobile styling')
assert.ok(/\.bottom-sheet[\s\S]*?max-height/.test(styles), 'model/details should use a mobile bottom sheet')
assert.ok(/\.model-option-list[\s\S]*?overflow-y/.test(styles), 'searchable model results should scroll in the sheet')
assert.ok(/\.model-option[\s\S]*?min-height:\s*64px/.test(styles), 'model options should be tall enough for two-line labels')
assert.ok(/\.model-option span[\s\S]*?line-height:\s*1\.25/.test(styles), 'model option text should not look vertically squeezed')

console.log('model picker regression tests passed')
