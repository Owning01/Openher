export type ShortcutCategory = "tabs" | "splits" | "general" | "terminal"

export type ShortcutItem = {
  id: string
  keys: string
  label: string
  category: ShortcutCategory
  enabled: boolean
  isDefault?: boolean
}

export const DEFAULT_SHORTCUTS: ShortcutItem[] = [
  {
    id: "switch_tab_next",
    keys: "Ctrl + Tab",
    label: "Siguiente pestaña en columna activa",
    category: "tabs",
    enabled: true,
    isDefault: true,
  },
  {
    id: "switch_tab_prev",
    keys: "Ctrl + Shift + Tab",
    label: "Pestaña anterior en columna activa",
    category: "tabs",
    enabled: true,
    isDefault: true,
  },
  {
    id: "close_split",
    keys: "Ctrl + W",
    label: "Cerrar panel / split activo",
    category: "splits",
    enabled: true,
    isDefault: true,
  },
  {
    id: "split_right",
    keys: "Ctrl + Shift + S",
    label: "Dividir a la derecha",
    category: "splits",
    enabled: true,
    isDefault: true,
  },
  {
    id: "split_bottom",
    keys: "Ctrl + Shift + V",
    label: "Dividir abajo",
    category: "splits",
    enabled: true,
    isDefault: true,
  },
  {
    id: "maximize_panel",
    keys: "Ctrl + M",
    label: "Maximizar / restaurar panel",
    category: "splits",
    enabled: true,
    isDefault: true,
  },
  {
    id: "toggle_sidebar",
    keys: "Ctrl + B",
    label: "Mostrar / ocultar barra lateral",
    category: "general",
    enabled: true,
    isDefault: true,
  },
  {
    id: "new_session",
    keys: "Ctrl + N",
    label: "Nueva sesión",
    category: "general",
    enabled: true,
    isDefault: true,
  },
  {
    id: "show_shortcuts",
    keys: "?",
    label: "Mostrar atajos de teclado",
    category: "general",
    enabled: true,
    isDefault: true,
  },
  {
    id: "new_terminal",
    keys: "Ctrl + Shift + Ñ",
    label: "Nueva terminal en panel activo",
    category: "terminal",
    enabled: true,
    isDefault: true,
  },
]

const STORAGE_KEY = "opencode.shortcuts.custom"

export function loadShortcutsConfig(): ShortcutItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SHORTCUTS
    const parsed: ShortcutItem[] = JSON.parse(raw)
    // Merge with defaults to ensure newly added actions are present
    const map = new Map<string, ShortcutItem>()
    DEFAULT_SHORTCUTS.forEach((d) => map.set(d.id, { ...d }))
    parsed.forEach((p) => {
      if (map.has(p.id)) {
        map.set(p.id, { ...map.get(p.id)!, ...p })
      } else {
        map.set(p.id, p)
      }
    })
    return Array.from(map.values())
  } catch {
    return DEFAULT_SHORTCUTS
  }
}

export function saveShortcutsConfig(shortcuts: ShortcutItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts))
    window.dispatchEvent(new CustomEvent("opencode-shortcuts-changed", { detail: shortcuts }))
  } catch {
    /* ignore */
  }
}

export function matchesShortcut(e: KeyboardEvent, shortcutKeys: string): boolean {
  if (!shortcutKeys) return false
  const parts = shortcutKeys
    .split("+")
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean)

  const reqCtrl = parts.includes("ctrl") || parts.includes("control") || parts.includes("cmd")
  const reqShift = parts.includes("shift")
  const reqAlt = parts.includes("alt")
  const reqMeta = parts.includes("meta") || parts.includes("win")

  const hasCtrl = e.ctrlKey || e.metaKey
  const hasShift = e.shiftKey
  const hasAlt = e.altKey
  const hasMeta = e.metaKey

  if (reqCtrl && !hasCtrl) return false
  if (!reqCtrl && hasCtrl) return false
  if (reqShift && !hasShift) return false
  if (!reqShift && hasShift) return false
  if (reqAlt && !hasAlt) return false
  if (!reqAlt && hasAlt) return false
  if (reqMeta && !hasMeta) return false

  // Main key
  const mainKeys = parts.filter((p) => !["ctrl", "control", "cmd", "shift", "alt", "meta", "win"].includes(p))
  if (mainKeys.length === 0) return false
  const targetKey = mainKeys[0]

  const eventKey = e.key.toLowerCase()
  const eventCode = e.code.toLowerCase()

  if (targetKey === "tab") {
    return eventKey === "tab" || eventCode === "tab"
  }
  if (targetKey === "?") {
    return eventKey === "?" || (e.shiftKey && eventKey === "/")
  }
  if (targetKey === "escape" || targetKey === "esc") {
    return eventKey === "escape"
  }
  if (targetKey === "enter") {
    return eventKey === "enter"
  }

  return eventKey === targetKey || eventCode === `key${targetKey}` || eventCode === `digit${targetKey}`
}
