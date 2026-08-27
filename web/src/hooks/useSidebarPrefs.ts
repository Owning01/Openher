import { useCallback, useEffect, useState } from "react"

export type SidebarPosition = "left" | "right" | "top"

export interface SidebarPrefs {
  /** Lado del shell donde vive el rail de actividades. */
  position: SidebarPosition
  /** Ids de botones del rail ocultos por el usuario. */
  hidden: string[]
}

const KEY = "opencode.sidebar.prefs"
const EVT = "opencode:sidebar-prefs-change"

/** Botones personalizables del rail de actividades (orden de aparición). */
export const SIDEBAR_ITEM_IDS = [
  "sessions", "explorer", "terminal", "stats", "browser", "kanban",
  "quickchat", "scm", "design", "learning", "settings",
] as const
export type SidebarItemId = (typeof SIDEBAR_ITEM_IDS)[number]

function readPrefs(): SidebarPrefs {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SidebarPrefs>
      const position: SidebarPosition =
        parsed.position === "right" || parsed.position === "top" ? parsed.position : "left"
      const hidden = Array.isArray(parsed.hidden)
        ? parsed.hidden.filter((x): x is string => typeof x === "string")
        : []
      return { position, hidden }
    }
  } catch {}
  return { position: "left", hidden: [] }
}

function writePrefs(p: SidebarPrefs): void {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {}
  try { window.dispatchEvent(new Event(EVT)) } catch {}
}

/**
 * Preferencias del rail de escritorio: posición (izquierda/derecha/arriba)
 * y qué botones ver. Persistido en localStorage; sincronizado entre
 * Ajustes y App vía evento + storage.
 */
export function useSidebarPrefs(): {
  prefs: SidebarPrefs
  setPosition: (p: SidebarPosition) => void
  toggleItem: (id: string) => void
} {
  const [prefs, setPrefs] = useState<SidebarPrefs>(readPrefs)

  useEffect(() => {
    const sync = (): void => setPrefs(readPrefs())
    window.addEventListener("storage", sync)
    window.addEventListener(EVT, sync as EventListener)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener(EVT, sync as EventListener)
    }
  }, [])

  const setPosition = useCallback((position: SidebarPosition) => {
    setPrefs((prev) => {
      const next = { ...prev, position }
      writePrefs(next)
      return next
    })
  }, [])

  const toggleItem = useCallback((id: string) => {
    setPrefs((prev) => {
      const hidden = prev.hidden.includes(id)
        ? prev.hidden.filter((h) => h !== id)
        : [...prev.hidden, id]
      // No permitir ocultar todos los botones: queda al menos uno.
      if (hidden.length >= SIDEBAR_ITEM_IDS.length) return prev
      const next = { ...prev, hidden }
      writePrefs(next)
      return next
    })
  }, [])

  return { prefs, setPosition, toggleItem }
}
