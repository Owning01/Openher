export const IS_DESKTOP = typeof window !== "undefined" && !!(window as any).__OPENHER_DESKTOP__

export const BROWSER_HOME = "https://www.google.com"
export const BROWSER_BOOKMARKS_KEY = "opencode.browser.bookmarks"
export const BROWSER_HISTORY_KEY = "opencode.browser.history"
export const BROWSER_TABS_KEY = "opencode.browser.tabs"
export const BROWSER_ACTIVE_KEY = "opencode.browser.activeTabId"
export const BROWSER_SHOW_BOOKMARKS_KEY = "opencode.browser.showBookmarks"
export const BROWSER_MINIMAL_KEY = "opencode.browser.minimal"
export const BROWSER_ZOOM_KEY = "opencode.browser.zoom"
export const BROWSER_HOME_KEY = "opencode.browser.home"

export const ZONE_ICONS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"]

export type DeviceMode = "responsive" | "mobile" | "tablet" | "desktop"

export const DEVICE_WIDTHS: Record<DeviceMode, string | null> = {
  responsive: null,
  mobile: "375px",
  tablet: "768px",
  desktop: "1280px",
}

export const COMMON_PORTS = [
  { port: "5173", label: ":5173 (Vite)" },
  { port: "3000", label: ":3000 (React/Next)" },
  { port: "8080", label: ":8080 (Http)" },
  { port: "8000", label: ":8000 (Python/API)" },
  { port: "4173", label: ":4173 (Preview)" },
]
