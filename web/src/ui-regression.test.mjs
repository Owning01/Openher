import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const app = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8')
const icons = readFileSync(new URL('./Icons.tsx', import.meta.url), 'utf8')

const refreshButton = app.match(/<button onClick=\{refreshSessionsWithIndicator\}[\s\S]*?\{t\('sessions\.refresh'\)\}[\s\S]*?<\/button>/)
assert.ok(refreshButton, 'sessions refresh button should call refreshSessionsWithIndicator')
assert.ok(refreshButton[0].includes('RefreshIcon'), 'idle sessions refresh button should render a non-spinning RefreshIcon')
assert.ok(refreshButton[0].includes('refreshingSessions ? <LoadingIcon'), 'refresh button should spin only during an active manual refresh')

assert.match(icons, /export const RefreshIcon/, 'RefreshIcon should exist for idle refresh UI')

console.log('ui regression tests passed')
