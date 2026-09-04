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

// Dominio para zoom por sitio (localhost con puerto cuenta como sitio propio).
export function domainOf(url: string): string {
  try {
    const u = new URL(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url) ? url : `https://${url}`)
    return (u.hostname + (u.port ? `:${u.port}` : "")).toLowerCase()
  } catch {
    return ""
  }
}

export const BROWSER_ZOOM_MAP_KEY = "opencode.browser.zoomMap"
const MAX_ZOOM_SITES = 100

// Zoom recordado por dominio + fallback global. Puro y testeado.
export function zoomForDomain(
  map: Record<string, number> | null | undefined,
  url: string,
  fallback: number
): number {
  const d = domainOf(url)
  const v = d ? map?.[d] : undefined
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0.5, Math.min(2.5, v)) : fallback
}

export function withZoomForDomain(
  map: Record<string, number> | null | undefined,
  url: string,
  level: number
): Record<string, number> {
  const next: Record<string, number> = { ...(map ?? {}) }
  const d = domainOf(url)
  if (!d) return next
  next[d] = Math.max(0.5, Math.min(2.5, Math.round(level * 10) / 10))
  const keys = Object.keys(next)
  if (keys.length > MAX_ZOOM_SITES) {
    for (const k of keys.slice(0, keys.length - MAX_ZOOM_SITES)) delete next[k]
  }
  return next
}

// Contador de coincidencias para el findbar: reporta por IPC
// ({type:'find-count'}) porque /eval es fire-and-forget.
export function buildFindCountScript(query: string, caseSensitive: boolean): string {
  return `(function(){var __oc_q=${JSON.stringify(query)};var __oc_cs=${caseSensitive ? "true" : "false"};try{var __oc_t=(document.body?document.body.innerText:"")||"";var __oc_n=0;if(__oc_q){if(!__oc_cs){__oc_t=__oc_t.toLowerCase();__oc_q=__oc_q.toLowerCase()}var __oc_i=-1;while((__oc_i=__oc_t.indexOf(__oc_q,__oc_i+1))>=0){__oc_n++;if(__oc_n>9999)break}}var __oc_r=JSON.stringify({type:"find-count",value:__oc_n});if(window.chrome&&window.chrome.webview){window.chrome.webview.postMessage(__oc_r)}}catch(e){}})()`
}

export function parseFindCount(raw: unknown): number | null {
  let o: any = raw
  if (typeof o === "string") {
    try { o = JSON.parse(o) } catch { return null }
  }
  if (!o || typeof o !== "object" || o.type !== "find-count") return null
  const v = Math.floor(Number((o as any).value))
  return Number.isFinite(v) && v >= 0 ? v : null
}
