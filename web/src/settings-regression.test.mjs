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
assert.equal(settingsPanel.includes('disabled={testingConnection || !hasDraftChanges}'), true, 'Save should be disabled when there are no draft changes')
assert.equal(settingsPanel.includes('connection-help'), true, 'Settings should explain ready-to-test and unsaved/saved state')
assert.equal(i18n.includes("'settings.testNeedsFields'"), true, 'Settings must translate the disabled test reason')
assert.equal(i18n.includes("'settings.unsavedChanges'"), true, 'Settings must translate unsaved-change guidance')

console.log('settings regression tests passed')
