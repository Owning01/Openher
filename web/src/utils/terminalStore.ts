import { shell } from "../shell"

export type TerminalTabInfo = { id: string; title: string; shell: string }
export type TerminalPersist = { tabs: Array<TerminalTabInfo>; activeId: string; splitId?: string | null }

export const terminalStore = new Map<string, TerminalPersist>()

const MAX_PERSISTED_PTYS = 8
export const terminalPtyStore = new Map<string, { ptyId: string; wsPort: number }>()

export function rememberTerminalPty(tabId: string, entry: { ptyId: string; wsPort: number }) {
  terminalPtyStore.delete(tabId)
  terminalPtyStore.set(tabId, entry)
  while (terminalPtyStore.size > MAX_PERSISTED_PTYS) {
    const oldest = terminalPtyStore.keys().next().value as string | undefined
    if (!oldest) break
    const victim = terminalPtyStore.get(oldest)
    terminalPtyStore.delete(oldest)
    if (victim) shell.pty.kill(victim.ptyId).catch(() => {})
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
