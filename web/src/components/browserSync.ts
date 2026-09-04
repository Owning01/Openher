// Helpers puros del puente página→host (testeables, sin React).

export type PageShortcutAction =
  | "reload" | "focus-url" | "find" | "new-tab" | "close-tab"
  | "bookmark" | "zoom-reset" | "zoom-in" | "zoom-out"
  | "back" | "forward" | "toggle-chrome"

// La página postea JSON por IPC ({type:'browser-shortcut', action}).
// Acepta el objeto o su forma ya serializada (la cola Rust guarda strings).
export function parseShortcutEvent(raw: unknown): PageShortcutAction | null {
  let o: any = raw
  if (typeof o === "string") {
    try { o = JSON.parse(o) } catch { return null }
  }
  if (!o || typeof o !== "object" || o.type !== "browser-shortcut" || typeof o.action !== "string") return null
  switch (o.action) {
    case "reload": case "focus-url": case "find": case "new-tab":
    case "close-tab": case "bookmark": case "zoom-reset": case "zoom-in":
    case "zoom-out": case "back": case "forward": case "toggle-chrome":
      return o.action
    default: return null
  }
}

// Nivel que la página reporta tras Ctrl+rueda ({type:'zoom-level', value}).
export function parseZoomLevel(raw: unknown): number | null {
  let o: any = raw
  if (typeof o === "string") {
    try { o = JSON.parse(o) } catch { return null }
  }
  if (!o || typeof o !== "object" || o.type !== "zoom-level") return null
  const v = Number((o as any).value)
  if (!Number.isFinite(v)) return null
  return Math.max(0.5, Math.min(2.5, Math.round(v * 10) / 10))
}

// Adopta la URL real del sub-WebView (links internos, redirects, SPA), salvo
// que esté vacía o el usuario esté editando el omnibox.
export function shouldAdoptExternalUrl(polled: string, current: string, typing: boolean): boolean {
  if (typing) return false
  if (!polled || polled === "about:blank") return false
  return polled !== current
}

// Prefijo de las pilas atrás/adelante por pestaña desktop (el layout solo
// guarda la URL actual por bid; el historial vive bajo este prefijo + bid).
export const BROWSER_STACK_PREFIX = "opencode.browser.stack."
const MAX_STACK_KEEP = 50

export type BrowserStackSnapshot = { url: string; history: string[]; historyIdx: number }

// Carga validada: null ante cualquier forma rara (quota, JSON roto, tipos).
export function loadBrowserStack(
  storage: Pick<Storage, "getItem"> | null | undefined,
  key: string
): BrowserStackSnapshot | null {
  try {
    if (!storage || !key) return null
    const raw = storage.getItem(key)
    if (!raw) return null
    const o = JSON.parse(raw) as Partial<BrowserStackSnapshot>
    if (!o || typeof o.url !== "string" || !Array.isArray(o.history)) return null
    const history = o.history.filter((x): x is string => typeof x === "string").slice(-MAX_STACK_KEEP)
    if (history.length === 0) return null
    const idx = Math.max(0, Math.min(Math.floor(Number(o.historyIdx)) || 0, history.length - 1))
    return { url: history[idx] ?? o.url, history, historyIdx: idx }
  } catch {
    return null
  }
}

export function saveBrowserStack(
  storage: Pick<Storage, "setItem" | "removeItem"> | null | undefined,
  key: string,
  snap: BrowserStackSnapshot | null
): void {
  try {
    if (!storage || !key) return
    if (!snap || snap.history.length === 0) {
      storage.removeItem(key)
      return
    }
    const history = snap.history.filter((x) => typeof x === "string").slice(-MAX_STACK_KEEP)
    if (history.length === 0) {
      storage.removeItem(key)
      return
    }
    const historyIdx = Math.max(0, Math.min(Math.floor(snap.historyIdx) || 0, history.length - 1))
    storage.setItem(key, JSON.stringify({ url: history[historyIdx], history, historyIdx }))
  } catch {}
}
