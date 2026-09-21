import { IS_DESKTOP } from "./constants"

export function toEmbeddableUrl(url: string): string {
  try {
    let raw = url.trim()
    if (!/^https?:\/\//i.test(raw)) {
      raw = `https://${raw}`
    }
    const u = new URL(raw)
    const host = u.hostname.toLowerCase()

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      if (u.pathname.startsWith("/embed/")) return url
      const v = u.searchParams.get("v")
      if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1`
      if (host.includes("youtu.be")) {
        const id = u.pathname.replace(/^\//, "")
        if (id) return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`
      }
      const q = u.searchParams.get("search_query") || u.searchParams.get("q")
      if (q) return `https://piped.video/results?search_query=${encodeURIComponent(q)}`
      if (host.includes("music.youtube.com")) {
        return "https://piped.video/trending"
      }
      return "https://piped.video"
    }

    // Google se sirve directo (via proxy/sub-WebView) para búsqueda real — no redirigir a DDG
  } catch {}
  return url
}

export function getFrameSrc(url: string, forceProxy = false): string {
  if (!url || url === "about:blank") return "about:blank"
  if (!forceProxy && /^(http:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i.test(url)) {
    return url
  }
  const embed = toEmbeddableUrl(url)
  if (embed !== url) return embed
  try {
    if (typeof window !== "undefined" && window.location.hostname === "127.0.0.1") {
      return `/shell/proxy?url=${encodeURIComponent(url)}`
    }
    if (IS_DESKTOP) return url
    return `/shell/proxy?url=${encodeURIComponent(url)}`
  } catch {
    return url
  }
}

export function isProbablyUrl(raw: string): boolean {
  const s = raw.trim()
  if (!s) return false
  if (/^\d{2,5}$/.test(s)) return true
  if (/^https?:\/\//i.test(s)) return true
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/.*)?$/i.test(s)) return true
  if (s.includes(" ")) return false
  // scheme:// (about:blank, chrome://, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) return true
  // dominio con TLD real: github.com, google.com/search, ejemplo.com:8080
  if (/^[a-zA-Z0-9.-]+\.[a-z]{2,}($|\/|:|\?|#).*/i.test(s)) return true
  // host:port numérico (192.168.1.1:3000, myhost:8080)
  if (/^[a-zA-Z0-9.-]+:\d{2,5}(\/.*)?$/.test(s)) return true
  return false
}

export function formatDisplayTitle(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return `localhost${parsed.port ? `:${parsed.port}` : ""}${parsed.pathname !== "/" ? parsed.pathname : ""}`
    }
    const path = parsed.pathname.replace(/^\//, "")
    return path ? `${parsed.hostname}/${path.slice(0, 20)}` : parsed.hostname
  } catch {
    return url.replace(/^https?:\/\//, "").slice(0, 25) || "Nueva pestaña"
  }
}

export function normalizeUrl(raw: string, homeUrl: string): string {
  let u = raw.trim()
  if (!u) return homeUrl
  if (/^\d{2,5}$/.test(u)) {
    return `http://localhost:${u}`
  }
  // Omnibox tipo Chrome: sin puntos/espacios → búsqueda en Google
  if (!isProbablyUrl(u)) {
    return `https://www.google.com/search?q=${encodeURIComponent(u)}`
  }
  if (!/^https?:\/\//i.test(u)) {
    if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/.*)?$/i.test(u)) {
      return `http://${u}`
    }
    return `https://${u}`
  }
  return u
}
