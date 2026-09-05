/**
 * Helpers para drag-and-drop de URLs entre Chrome y el browser del app.
 * Solo se arrastra la URL (text/uri-list + text/plain), nada de payload interno.
 */

function cleanUrl(raw: string): string | null {
  let s = raw.trim()
  if (!s) return null
  // Chrome puede mandar  "https://example.com\nTitle" o comentarios "#"
  if (s.startsWith("#")) return null
  // Si viene con título en segunda palabra, tomar primer token
  const firstLine = s.split(/\r?\n/)[0]?.trim() ?? ""
  const token = firstLine.split(/\s+/)[0]?.trim() ?? ""
  const candidate = token || firstLine || s
  let url = candidate.trim()
  if (url.startsWith("browser:")) url = url.slice(8).trim()
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return url // about:blank, etc. no usar como http
  // dominio suelto tipo example.com/path → https://
  if (/^[a-z0-9.-]+\.[a-z]{2,}($|\/|:|\?|#).*/i.test(url)) return `https://${url}`
  if (/^[a-z0-9.-]+:\d{2,5}(\/.*)?$/i.test(url)) return `http://${url}`
  return null
}

function extractUriList(raw: string): string | null {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  for (const l of lines) {
    if (l.startsWith("#")) continue
    const u = cleanUrl(l)
    if (u) return u
  }
  return null
}

export function extractUrlFromDataTransfer(dt: DataTransfer): string | null {
  const get = (type: string) => {
    try {
      return dt.getData(type)
    } catch {
      return ""
    }
  }
  // 1) interno del app
  let raw = get("application/x-opencode-browser-tab")
  if (raw) {
    const u = cleanUrl(raw)
    if (u) return u
  }
  // 2) estándar web (Chrome pone text/uri-list primero)
  raw = get("text/uri-list")
  if (raw) {
    const u = extractUriList(raw)
    if (u) return u
  }
  // 3) IE legacy
  raw = get("URL")
  if (raw) {
    const u = cleanUrl(raw)
    if (u) return u
  }
  // 4) Firefox
  raw = get("text/x-moz-url")
  if (raw) {
    // formato "url\ntitle"
    const first = raw.split("\n")[0]?.trim() ?? ""
    const u = cleanUrl(first)
    if (u) return u
  }
  // 5) texto plano (último, puede ser panel:0:browser:... que no es URL)
  raw = get("text/plain")
  if (raw) {
    // Si contiene newline, probar cada línea como URL (Chrome omnibox arrastra así)
    if (raw.includes("\n")) {
      const u = extractUriList(raw)
      if (u) return u
    }
    const u = cleanUrl(raw)
    if (u) return u
  }
  return null
}

export function isUrlDrag(dt: DataTransfer): boolean {
  const types = Array.from(dt.types as unknown as string[]).map((t) => t.toLowerCase())
  if (types.includes("text/uri-list") || types.includes("url") || types.includes("text/x-moz-url")) return true
  // text/plain puede ser URL o internal; lo verificamos leyendo
  if (types.includes("application/x-opencode-browser-tab")) return true
  if (types.includes("text/plain")) {
    try {
      const raw = dt.getData("text/plain")
      if (raw && cleanUrl(raw)) return true
    } catch {}
  }
  try {
    const raw = dt.getData("text/uri-list")
    if (raw && extractUriList(raw)) return true
  } catch {}
  return false
}

export function setUrlDragData(dt: DataTransfer, url: string) {
  const raw = url.trim()
  if (!raw) return
  const u = cleanUrl(raw) ?? raw
  // Interno del app (para que nuestras barras también lo lean sin parsear)
  try {
    dt.setData("application/x-opencode-browser-tab", u)
  } catch {}
  // Estándares que Chrome reconoce al soltar sobre su barra/ventana
  try {
    dt.setData("text/uri-list", u)
  } catch {}
  try {
    dt.setData("text/plain", u)
  } catch {}
  try {
    dt.setData("URL", u)
  } catch {}
  // Algunos navegadores leen text/x-moz-url
  try {
    dt.setData("text/x-moz-url", `${u}\n${u}`)
  } catch {}
}
