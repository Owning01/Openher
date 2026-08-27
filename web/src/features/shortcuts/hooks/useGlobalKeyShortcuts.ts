import { useEffect } from "react"
import { matchesShortcut, type ShortcutItem } from "../../../shortcuts"

export type UseGlobalKeyShortcutsParams = {
  vs: any
  shortcuts: ShortcutItem[]
  setShowShortcuts: (show: boolean) => void
}

export function useGlobalKeyShortcuts({
  vs,
  shortcuts,
  setShowShortcuts,
}: UseGlobalKeyShortcutsParams) {
  // Atajo global Ctrl+Shift+C (o Cmd+Shift+C) para modo selección; Esc limpia
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey
      if (isMod && e.shiftKey && e.key.toLowerCase() === "c" && !e.altKey) {
        e.preventDefault()
        vs.toggleInspect()
      } else if (e.key === "Escape" && vs.hasSelection) {
        if (!vs.inspectMode) {
          const hasModal = document.querySelector(".modal, .modal-dropdown")
          if (!hasModal) {
            vs.clear()
          }
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [vs])

  // Global ? key for shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const showSc = shortcuts.find((s) => s.id === "show_shortcuts" && s.enabled)
      if (
        showSc &&
        matchesShortcut(e, showSc.keys) &&
        !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
      ) {
        setShowShortcuts(true)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [shortcuts, setShowShortcuts])
}
