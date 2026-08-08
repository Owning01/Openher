import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const useConfig = readFileSync(new URL('./hooks/useConfig.ts', import.meta.url), 'utf8')
const settingsPanel = readFileSync(new URL('./components/SettingsPanel.tsx', import.meta.url), 'utf8')
const i18n = readFileSync(new URL('./i18n.ts', import.meta.url), 'utf8')

const testConnection = useConfig.match(/const testConnection = useCallback[\s\S]*?}, \[draftConfig\]\)/)
assert.ok(testConnection, 'testConnection function should be present')
assert.equal(testConnection[0].includes('setView'), false, 'Test Connection must not navigate away from settings')
assert.equal(testConnection[0].includes('setConfig'), false, 'Test Connection must not save/apply draft settings')
assert.equal(testConnection[0].includes('localStorage.setItem'), false, 'Test Connection must not persist draft settings')

const saveConfig = useConfig.match(/const saveConfig = useCallback[\s\S]*?}, \[draftConfig\]\)/)
assert.ok(saveConfig, 'saveConfig function should be present')
assert.equal(saveConfig[0].includes('setView'), false, 'Save must leave success notice visible on settings page')

assert.equal(settingsPanel.includes("t('settings.draftHint')"), true, 'SettingsPanel should use useT() for translation')
assert.equal(i18n.includes("'settings.testedNotSaved'"), true, 'Test success should explicitly say it did not save')
assert.equal(useConfig.includes('function canTestConfig'), true, 'canTestConfig should be a standalone function')

assert.equal(settingsPanel.includes('disabled={testingConnection || !canTestDraft || testAlreadyPassedForDraft}'), true, 'Test button should be disabled when fields are missing, testing is active, or the unchanged draft already passed')
assert.equal(settingsPanel.includes('settings-test-btn'), true, 'Test button should live in the settings header (top of config)')
assert.equal(settingsPanel.includes('settings.savedButton'), false, 'Manual Save button should be removed (auto-save only)')
assert.equal(settingsPanel.includes("t('settings.draftHint')"), true, 'Settings should explain ready-to-test and unsaved/saved state')
assert.equal(i18n.includes("'settings.testNeedsFields'"), true, 'Settings must translate the disabled test reason')
assert.equal(i18n.includes("'settings.unsavedChanges'"), true, 'Settings must translate unsaved-change guidance')

// OpenCode v2 Pair service (BETA): QR scan + paste to add a server profile.
assert.equal(settingsPanel.includes('<PairModal'), true, 'Settings should render the PairModal for QR pairing')
assert.equal(settingsPanel.includes('onAddPairServer(name, config)'), true, 'PairModal save must create a server profile')
assert.equal(settingsPanel.includes('settings.pairScanQr'), true, 'Settings should expose the Scan QR button')
assert.equal(settingsPanel.includes('isPairProfile(profile)'), true, 'Saved profiles must render the BETA v2 badge for pair kind')
assert.equal(i18n.includes("'settings.pairTitle'"), true, 'Pair section needs a translated title')
assert.equal(i18n.includes("'settings.pairParse'"), true, 'Pair modal needs a translated parse action')
assert.equal(i18n.includes("'settings.pairSave'"), true, 'Pair modal needs a translated save action')

const pairUtil = readFileSync(new URL('./utils/pair.ts', import.meta.url), 'utf8')
assert.ok(pairUtil.includes('export function parsePairPayload'), 'QR payload parser should be exported')
assert.ok(pairUtil.includes('export type PairInfo'), 'QR payload parser should expose the PairInfo type')
assert.ok(pairUtil.includes('username ?? obj.user'), 'QR parser should accept user/username JSON keys')

const pairModal = readFileSync(new URL('./components/PairModal.tsx', import.meta.url), 'utf8')
assert.ok(pairModal.includes('from "jsqr"'), 'PairModal should use jsQR for QR decoding')
assert.ok(pairModal.includes('getUserMedia'), 'PairModal should use the camera for live scanning')
assert.ok(pairModal.includes('parsePairPayload'), 'PairModal should parse the scanned/pasted payload')

console.log('settings regression tests passed')
