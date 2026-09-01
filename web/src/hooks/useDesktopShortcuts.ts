import { useEffect } from "react"
import { matchesShortcut, type ShortcutItem } from "../shortcuts"
import type { DesktopLayout, ViewType } from "../types"

export interface UseDesktopShortcutsOptions {
  isDesktop: boolean
  view: ViewType
  shortcuts: ShortcutItem[]
  activePanel: number
  tabStacks: Record<number, string[]> | undefined
  desktopLayout: DesktopLayout
  maximizedPanel: number | null
  switchTab: (panel: number, index: number) => void
  closePanel: (panel: number) => void
  splitPanel: (panel: number, direction: "right" | "bottom") => void
  toggleMaximize: (panel: number) => void
  setMaximizedPanel: (panel: number | null) => void
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  handleOpenNewSession: () => void
  setDesktopLayout: (updater: (prev: DesktopLayout) => DesktopLayout) => void
  setShowTerminal?: React.Dispatch<React.SetStateAction<boolean>>
  setActivePanel: (panel: number) => void
  onAddTerminal?: (panel: number) => void
}

export function useDesktopShortcuts({
  isDesktop,
  view,
  shortcuts,
  activePanel,
  tabStacks,
  desktopLayout,
  maximizedPanel,
  switchTab,
  closePanel,
  splitPanel,
  toggleMaximize,
  setMaximizedPanel,
  setSidebarCollapsed,
  handleOpenNewSession,
  setDesktopLayout,
  setShowTerminal: _setShowTerminal,
  setActivePanel,
  onAddTerminal,
}: UseDesktopShortcutsOptions) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isDesktop || (view !== "sessions" && view !== "detail") || !(e.ctrlKey || e.metaKey)) return
      const target = e.target as HTMLElement | null
      if (target && typeof target.closest === "function" && target.closest(".browser-shell")) return
      if (document.body.dataset.opencodeBrowserFocused === "true") return

      // 1. Tab switching
      const nextTabSc = shortcuts.find((s: ShortcutItem) => s.id === "switch_tab_next" && s.enabled)
      const prevTabSc = shortcuts.find((s: ShortcutItem) => s.id === "switch_tab_prev" && s.enabled)

      if (nextTabSc && matchesShortcut(e, nextTabSc.keys)) {
        e.preventDefault()
        e.stopPropagation()
        const stack = tabStacks?.[activePanel]
        if (stack && stack.length > 1) {
          const currentId = desktopLayout.sessions[activePanel]
          const currentIdx = currentId ? stack.indexOf(currentId) : 0
          const nextIdx = (currentIdx + 1) % stack.length
          switchTab(activePanel, nextIdx)
        }
        return
      }

      if (prevTabSc && matchesShortcut(e, prevTabSc.keys)) {
        e.preventDefault()
        e.stopPropagation()
        const stack = tabStacks?.[activePanel]
        if (stack && stack.length > 1) {
          const currentId = desktopLayout.sessions[activePanel]
          const currentIdx = currentId ? stack.indexOf(currentId) : 0
          const prevIdx = (currentIdx - 1 + stack.length) % stack.length
          switchTab(activePanel, prevIdx)
        }
        return
      }

      const isEditableTarget = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable

      // 2. Close split (permitido incluso en inputs para salir rapido)
      const closeSc = shortcuts.find((s: ShortcutItem) => s.id === "close_split" && s.enabled)
      if (closeSc && matchesShortcut(e, closeSc.keys)) {
        e.preventDefault()
        e.stopPropagation()
        if (maximizedPanel !== null) { setMaximizedPanel(null); return }
        if (desktopLayout.cols > 1 || desktopLayout.rows > 1 || desktopLayout.sessions.some((s: string | null) => s !== null)) {
          closePanel(activePanel)
        }
        return
      }

      // Nota: split/maximize/sidebar/new_session/new_terminal deben funcionar incluso con el Composer enfocado.
      // Solo bloqueamos atajos que colisionan con edicion si el target es input y el atajo es de una sola letra sin Ctrl+Shift.
      // Por eso NO hacemos "if (isEditableTarget) return" global.

      // 3. Split right
      const splitRightSc = shortcuts.find((s: ShortcutItem) => s.id === "split_right" && s.enabled)
      if (splitRightSc && matchesShortcut(e, splitRightSc.keys)) {
        e.preventDefault()
        splitPanel(activePanel, "right")
        return
      }

      // 4. Split bottom
      const splitBottomSc = shortcuts.find((s: ShortcutItem) => s.id === "split_bottom" && s.enabled)
      if (splitBottomSc && matchesShortcut(e, splitBottomSc.keys)) {
        e.preventDefault()
        splitPanel(activePanel, "bottom")
        return
      }

      // 5. Maximize / restore
      const maxSc = shortcuts.find((s: ShortcutItem) => s.id === "maximize_panel" && s.enabled)
      if (maxSc && matchesShortcut(e, maxSc.keys)) {
        e.preventDefault()
        if (desktopLayout.sessions[activePanel]) toggleMaximize(activePanel)
        return
      }

      // 6. Toggle sidebar
      const sidebarSc = shortcuts.find((s: ShortcutItem) => s.id === "toggle_sidebar" && s.enabled)
      if (sidebarSc && matchesShortcut(e, sidebarSc.keys)) {
        e.preventDefault()
        setSidebarCollapsed((v) => !v)
        return
      }

      // 7. New session
      const newSessSc = shortcuts.find((s: ShortcutItem) => s.id === "new_session" && s.enabled)
      if (newSessSc && matchesShortcut(e, newSessSc.keys)) {
        e.preventDefault()
        handleOpenNewSession()
        return
      }

      const newTermSc = shortcuts.find((s: ShortcutItem) => s.id === "new_terminal" && s.enabled)
      if (newTermSc && matchesShortcut(e, newTermSc.keys)) {
        e.preventDefault()
        e.stopPropagation()
        if (onAddTerminal) onAddTerminal(activePanel)
        else {
          try { window.dispatchEvent(new CustomEvent("opencode:new-terminal", { detail: { panel: activePanel } })) } catch {}
        }
        return
      }
      // Alias universal: Ctrl+T (sin Shift) para terminal en desktop — muchos esperan Ctrl+T, no Ctrl+Shift+Ñ
      if (!isEditableTarget || e.ctrlKey || e.metaKey) {
        const aliasT = e.ctrlKey || e.metaKey
        if (aliasT && !e.altKey && e.key.toLowerCase() === "t" && !e.shiftKey) {
          const sc = shortcuts.find((s) => s.id === "new_terminal")
          if (sc && sc.enabled) {
            // Evitar colision con Ctrl+T del navegador solo en desktop-app (wry); en browser dev no lo interceptamos si hay input
            if (isDesktop && (view === "sessions" || view === "detail")) {
              e.preventDefault()
              e.stopPropagation()
              if (onAddTerminal) onAddTerminal(activePanel)
              else try { window.dispatchEvent(new CustomEvent("opencode:new-terminal", { detail: { panel: activePanel } })) } catch {}
              return
            }
          }
        }
      }

      const k = e.key.toLowerCase()
      if (!e.shiftKey && /^[1-9]$/.test(k)) {
        const idx = Number(k) - 1
        if (idx < desktopLayout.cols * desktopLayout.rows) { e.preventDefault(); setActivePanel(idx) }
        return
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [
    isDesktop,
    view,
    shortcuts,
    activePanel,
    tabStacks,
    desktopLayout,
    maximizedPanel,
    switchTab,
    closePanel,
    splitPanel,
    toggleMaximize,
    setMaximizedPanel,
    setSidebarCollapsed,
    handleOpenNewSession,
    setDesktopLayout,
    setActivePanel,
    onAddTerminal,
  ])
}
