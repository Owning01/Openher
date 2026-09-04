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
