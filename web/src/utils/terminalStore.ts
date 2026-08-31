import { shell } from "../shell"

export type TerminalTabInfo = { id: string; title: string; shell: string }
export type TerminalPersist = { tabs: Array<TerminalTabInfo>; activeId: string; splitId?: string | null }

export const terminalStore = new Map<string, TerminalPersist>()

const MAX_PERSISTED_PTYS = 8
export const terminalPtyStore = new Map<string, { ptyId: string; wsPort: number }>()

// Flag en memoria para auto-opencode2 (evita carrera sessionStorage vs mount)
let _pendingAutoOpencode2 = false
export function setPendingAutoOpencode2(v: boolean) { _pendingAutoOpencode2 = v; try { if (v) sessionStorage.setItem("opencode.auto_opencode2.pending", "1"); else sessionStorage.removeItem("opencode.auto_opencode2.pending") } catch {} }
export function consumePendingAutoOpencode2(): boolean {
  if (_pendingAutoOpencode2) { _pendingAutoOpencode2 = false; try { sessionStorage.removeItem("opencode.auto_opencode2.pending") } catch {} return true }
  try { if (sessionStorage.getItem("opencode.auto_opencode2.pending") === "1") { sessionStorage.removeItem("opencode.auto_opencode2.pending"); return true } } catch {}
  return false
}
export function hasPendingAutoOpencode2(): boolean {
  if (_pendingAutoOpencode2) return true
  try { return sessionStorage.getItem("opencode.auto_opencode2.pending") === "1" } catch { return false }
}

export const TERMINAL_FONT_MIN = 9
export const TERMINAL_FONT_MAX = 28
export const TERMINAL_FONT_DEFAULT = 13
const TERMINAL_FONT_PREFIX = "opencode.terminal.fontSize."

export function getTerminalFontSize(tabId: string): number {
  try {
    const raw = localStorage.getItem(TERMINAL_FONT_PREFIX + tabId)
    const v = raw ? parseInt(raw, 10) : NaN
    if (Number.isFinite(v) && v >= TERMINAL_FONT_MIN && v <= TERMINAL_FONT_MAX) return v
  } catch {}
  return TERMINAL_FONT_DEFAULT
}

export function setTerminalFontSize(tabId: string, size: number) {
  const next = Math.max(TERMINAL_FONT_MIN, Math.min(TERMINAL_FONT_MAX, Math.round(size)))
  try { localStorage.setItem(TERMINAL_FONT_PREFIX + tabId, String(next)) } catch {}
  // Notificar a todas las instancias montadas
  try { window.dispatchEvent(new CustomEvent("terminal:zoom", { detail: { tabId, size: next } })) } catch {}
  return next
}

export function adjustTerminalFontSize(tabId: string, delta: number): number {
  return setTerminalFontSize(tabId, getTerminalFontSize(tabId) + delta)
}

export function rememberTerminalPty(tabId: string, entry: { ptyId: string; wsPort: number }) {
  terminalPtyStore.delete(tabId)
  terminalPtyStore.set(tabId, entry)
  while (terminalPtyStore.size > MAX_PERSISTED_PTYS) {
    const oldest = terminalPtyStore.keys().next().value as string | undefined
    if (!oldest) break
    const victim = terminalPtyStore.get(oldest)
    terminalPtyStore.delete(oldest)
    if (victim) {
      shell.pty.kill(victim.ptyId).catch(() => {})
      // limpiar tab huérfana que referenciaba el pty evictado
      for (const [panelId, persist] of terminalStore.entries()) {
        const has = persist.tabs.some(t => t.id === oldest)
        if (has) {
          const filtered = persist.tabs.filter(t => t.id !== oldest)
          if (filtered.length === 0) terminalStore.delete(panelId)
          else terminalStore.set(panelId, { ...persist, tabs: filtered, activeId: persist.activeId === oldest ? filtered[0].id : persist.activeId, splitId: persist.splitId === oldest ? null : persist.splitId })
        }
      }
    }
  }
}

export function killTerminalPty(tabId: string) {
  const entry = terminalPtyStore.get(tabId)
  if (entry) {
    shell.pty.kill(entry.ptyId).catch(() => {})
    terminalPtyStore.delete(tabId)
  }
}

export function transferTerminalTab(sourcePanelId: string | undefined, tabId: string, destPanelId: string): number {
  if (sourcePanelId && terminalStore.has(sourcePanelId)) {
    const source = terminalStore.get(sourcePanelId)!
    const movingTab = source.tabs.find((t) => t.id === tabId)
    const remainingTabs = source.tabs.filter((t) => t.id !== tabId)
    if (remainingTabs.length > 0) {
      terminalStore.set(sourcePanelId, {
        tabs: remainingTabs,
        activeId: source.activeId === tabId ? remainingTabs[0].id : source.activeId,
        splitId: source.splitId === tabId ? null : source.splitId,
      })
    } else {
      terminalStore.delete(sourcePanelId)
    }
    if (movingTab) {
      const dest = terminalStore.get(destPanelId) ?? { tabs: [], activeId: tabId }
      dest.tabs = [...dest.tabs.filter((t) => t.id !== tabId), movingTab]
      dest.activeId = tabId
      terminalStore.set(destPanelId, dest)
    }
    window.dispatchEvent(new CustomEvent("terminal:tabs-updated", { detail: { sourcePanelId, destPanelId } }))
    return remainingTabs.length
  }
  return 0
}
