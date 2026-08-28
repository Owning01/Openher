import { memo, useState, useRef, useCallback, useEffect } from "react"
import { RefreshIcon, MonitorIcon, LoadingIcon, CloseIcon, FolderIcon, GlobeIcon, SearchIcon, FileIcon, PaintIcon } from "../Icons"
import { useOutsideClick } from "../hooks/useOutsideClick"
import { shell } from "../shell"
import { BrowserVisualOverlay, type BrowserPickedElement } from "./BrowserVisualOverlay"
import type { VisualSelection, VisualAnnotation } from "../hooks/useVisualSelection"
import {
  buildOverlayScript, badgeScript, removeBadgeScript, clearBadgesScript,
  cleanupOverlayScript, applyStyleScript, unbindScript, setToolScript,
  type InspectTool,
} from "./browserOverlayScript"

const IS_DESKTOP = typeof window !== "undefined" && !!(window as any).__OPENCODE_DESKTOP__
export const BROWSER_HOME = "https://www.google.com"
const BROWSER_BOOKMARKS_KEY = "opencode.browser.bookmarks"
const BROWSER_HISTORY_KEY = "opencode.browser.history"
const BROWSER_TABS_KEY = "opencode.browser.tabs"
const BROWSER_ACTIVE_KEY = "opencode.browser.activeTabId"

const ZONE_ICONS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨"]


const STYLE_FIELDS: Array<{ prop: string; label: string; kind: "color" | "number" | "select"; options?: string[]; unit?: string }> = [
  { prop: "color", label: "Texto", kind: "color" },
  { prop: "background-color", label: "Fondo", kind: "color" },
  { prop: "font-size", label: "Fuente", kind: "number", unit: "px" },
  { prop: "font-weight", label: "Grosor", kind: "select", options: ["", "normal", "bold", "300", "400", "500", "600", "700", "800"] },
  { prop: "text-align", label: "Alineación", kind: "select", options: ["", "left", "center", "right"] },
  { prop: "padding", label: "Padding", kind: "number", unit: "px" },
  { prop: "border-radius", label: "Radio", kind: "number", unit: "px" },
]

function toEmbeddableUrl(url: string): string {
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

function getFrameSrc(url: string, forceProxy = false): string {
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

function isProbablyUrl(raw: string): boolean {
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

export type BrowserBookmark = { url: string; title: string; addedAt: number }
function loadBookmarks(): BrowserBookmark[] {
  try {
    const raw = localStorage.getItem(BROWSER_BOOKMARKS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x: any) => x && typeof x.url === "string") : []
  } catch { return [] }
}
function saveBookmarks(items: BrowserBookmark[]) {
  try { localStorage.setItem(BROWSER_BOOKMARKS_KEY, JSON.stringify(items.slice(0, 100))) } catch {}
}
function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(BROWSER_HISTORY_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((x: any) => typeof x === "string").slice(0, 80) : []
  } catch { return [] }
}
function pushHistory(url: string) {
  if (!url || url === "about:blank") return
  try {
    const list = loadHistory().filter((u) => u !== url)
    list.unshift(url)
    localStorage.setItem(BROWSER_HISTORY_KEY, JSON.stringify(list.slice(0, 80)))
  } catch {}
}

type DeviceMode = "responsive" | "mobile" | "tablet" | "desktop"

const DEVICE_WIDTHS: Record<DeviceMode, string | null> = {
  responsive: null,
  mobile: "375px",
  tablet: "768px",
  desktop: "1280px",
}

const COMMON_PORTS = [
  { port: "5173", label: ":5173 (Vite)" },
  { port: "3000", label: ":3000 (React/Next)" },
  { port: "8080", label: ":8080 (Http)" },
  { port: "8000", label: ":8000 (Python/API)" },
  { port: "4173", label: ":4173 (Preview)" },
  { port: "8765", label: ":8765 (Stats)" },
]

export type BrowserTabItem = {
  id: string
  url: string
  title: string
  history: string[]
  historyIdx: number
}

function getFavicon(url: string) {
  const u = url.toLowerCase()
  if (u.includes("github.com")) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    )
  }
  if (u.includes("youtube.com") || u.includes("youtu.be")) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--danger)">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    )
  }
  if (u.includes("gemini.google.com") || u.includes("google.")) {
    return <span style={{ color: "var(--primary)", display: "inline-flex" }}><SearchIcon size={14} /></span>
  }
  if (u.includes("localhost") || u.includes("127.0.0.1") || u.includes("0.0.0.0")) {
    return <MonitorIcon size={14} />
  }
  return <GlobeIcon size={14} />
}

function formatDisplayTitle(url: string): string {
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

export const BrowserPanel = memo(function BrowserPanel({
  initialUrl = BROWSER_HOME,
  onClose,
  visualSelection,
  inspectMode,
  onVisualPick,
  onToggleInspect,
  onClearVisual,
  annotations = [],
  onAnnotationComment,
  onRemoveAnnotation,
  onAnnotationStyle,
  onAnnotationStyleBefore,
  inspectTool = "picker",
  onToggleInspectTool,
}: {
  initialUrl?: string
  onClose?: () => void
  visualSelection?: VisualSelection | null
  inspectMode?: boolean
  onVisualPick?: (el: BrowserPickedElement) => void
  onToggleInspect?: () => void
  onClearVisual?: () => void
  annotations?: VisualAnnotation[]
  onAnnotationComment?: (id: string, text: string) => void
  onRemoveAnnotation?: (id: string) => void
  onAnnotationStyle?: (id: string, draft: Record<string, string>) => void
  onAnnotationStyleBefore?: (id: string, before: Record<string, string | null>) => void
  inspectTool?: InspectTool
  onToggleInspectTool?: (tool: InspectTool) => void
}) {
  const [tabs, setTabs] = useState<BrowserTabItem[]>(() => {
    try {
      const raw = localStorage.getItem(BROWSER_TABS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as BrowserTabItem[]
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((t: any) => t && typeof t.url === "string" && typeof t.id === "string")) {
          return parsed
        }
      }
    } catch {}
    return [
      {
        id: "tab-1",
        url: initialUrl,
        title: formatDisplayTitle(initialUrl),
        history: [initialUrl],
        historyIdx: 0,
      },
    ]
  })
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    try {
      const v = localStorage.getItem(BROWSER_ACTIVE_KEY)
      if (v) return v
    } catch {}
    return "tab-1"
  })
  const [inputUrl, setInputUrl] = useState(() => {
    try {
      const raw = localStorage.getItem(BROWSER_TABS_KEY)
      const aid = localStorage.getItem(BROWSER_ACTIVE_KEY)
      if (raw && aid) {
        const parsed = JSON.parse(raw) as BrowserTabItem[]
        const found = Array.isArray(parsed) ? parsed.find((t: any) => t.id === aid) : null
        if (found?.url) return found.url
      }
    } catch {}
    return initialUrl
  })
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("responsive")
  const [showTuneDropdown, setShowTuneDropdown] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [browserFailed, setBrowserFailed] = useState(false)
  const [expandedStyleId, setExpandedStyleId] = useState<string | null>(null)
  const [findOpen, setFindOpen] = useState(false)
  const [findQuery, setFindQuery] = useState("")
  const [findCase, setFindCase] = useState(false)
  const [bookmarks, setBookmarks] = useState<BrowserBookmark[]>(() => loadBookmarks())
  const [showBookmarks, setShowBookmarks] = useState(() => {
    try { return localStorage.getItem("opencode.browser.showBookmarks") !== "0" } catch { return true }
  })
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    try {
      const v = parseFloat(localStorage.getItem("opencode.browser.zoom") || "1")
      return Number.isFinite(v) && v > 0 ? Math.max(0.5, Math.min(2.5, v)) : 1
    } catch { return 1 }
  })
  const [homeUrl] = useState<string>(() => {
    try { return localStorage.getItem("opencode.browser.home") || BROWSER_HOME } catch { return BROWSER_HOME }
  })
  const [projectBanner, setProjectBanner] = useState<{
    directory: string
    entrypoint: string
    htmlFiles: string[]
    hasPackageJson: boolean
    scripts: Record<string, string>
  } | null>(null)
  // Chrome-like omnibox suggestions
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggestIdx, setSuggestIdx] = useState(-1)
  void suggestions; void setSuggestions; void suggestIdx; void setSuggestIdx

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const nativeReady = useRef(false)

  // Persistir tabs/sesión como Chrome (sobrevive a cerrar pestaña/panel/app)
  useEffect(() => {
    try { localStorage.setItem(BROWSER_TABS_KEY, JSON.stringify(tabs.slice(0, 20))) } catch {}
  }, [tabs])
  useEffect(() => {
    try { localStorage.setItem(BROWSER_ACTIVE_KEY, activeTabId) } catch {}
  }, [activeTabId])

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  useOutsideClick(dropdownRef, () => setShowTuneDropdown(false), showTuneDropdown)
  const histRef = useRef<HTMLDivElement | null>(null)
  useOutsideClick(histRef, () => { setShowHistory(false); setSuggestions([]); setSuggestIdx(-1) }, showHistory || suggestions.length > 0)

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]
  const currentSrc = activeTab?.url || "about:blank"
  const isSecure = /^https:/i.test(currentSrc)
  const isBookmarked = bookmarks.some((b) => b.url === currentSrc)

  useEffect(() => {
    if (activeTab) {
      setInputUrl(activeTab.url)
      setHasError(false)
    }
  }, [activeTabId, activeTab])

  // Watchdog de carga: asegura que el spinner desaparezca tras timeout
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(t)
  }, [currentSrc, reloadKey])

  // Sugerencias Chrome-like: debounced fetch a suggestqueries.google.com via proxy same-origin (evita CORS)
  useEffect(() => {
    const q = inputUrl.trim()
    if (!q || isProbablyUrl(q) || q.length < 2 || q.startsWith("http")) {
      setSuggestions([])
      setSuggestIdx(-1)
      return
    }
    const t = setTimeout(async () => {
      try {
        const suggestUrl = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}`
        const proxyUrl = `/shell/proxy?url=${encodeURIComponent(suggestUrl)}`
        const res = await fetch(proxyUrl, { headers: { Accept: "application/json" } })
        if (!res.ok) return
        const data = await res.json()
        const list: string[] = Array.isArray(data) && Array.isArray(data[1]) ? data[1].slice(0, 6) : []
        setSuggestions(list.filter((s) => typeof s === "string" && s.trim()))
        setSuggestIdx(-1)
      } catch {
        setSuggestions([])
      }
    }, 180)
    return () => clearTimeout(t)
  }, [inputUrl])

  const normalizeUrl = (raw: string): string => {
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

  // --- Native Sub-WebView (desktop only) ---
  useEffect(() => {
    if (!IS_DESKTOP || !viewportRef.current) return
    const el = viewportRef.current

    // getBoundingClientRect() da coordenadas viewport-relative (equivalentes
    // a position:fixed del sub-WebView2). contentRect.x/y son relativos al
    // elemento y quedan desfasados si el panel se mueve (resize ventana/split).
    const syncBounds = () => {
      const rect = el.getBoundingClientRect()
      shell.browser.setBounds({
        x: rect.left,
        y: rect.top,
        w: rect.width,
        h: rect.height,
      }).catch(() => {})
    }

    // Open native sub-WebView with initial URL at the viewport bounds
    const rect = el.getBoundingClientRect()
    const bounds = { x: rect.left, y: rect.top, w: rect.width, h: rect.height }
    shell.browser.open(currentSrc, bounds).then(() => {
      nativeReady.current = true
      setBrowserFailed(false)
    }).catch(() => {
      // Fallback a iframe vía proxy si el sub-WebView no pudo crearse
      // (mismatch de args, WebView2 no disponible, etc.)
      nativeReady.current = false
      setBrowserFailed(true)
      setHasError(false)
    })

    // CRÍTICO: el child HWND de Win32 tiene prioridad de hit-testing sobre el
    // DOM del host — si queda visible fuera de pantalla / tras cambio de tab,
    // traga TODOS los clicks (X incluida) y tapa la sidebar. Ocultarlo a nivel
    // Win32 apenas deja de intersectar.
    let ioVisibility = true
    const io = new IntersectionObserver((entries) => {
      const visible = entries.some((e) => e.isIntersecting && e.intersectionRatio > 0.01)
      if (visible !== ioVisibility) {
        ioVisibility = visible
        shell.browser.setVisibility(visible).catch(() => {})
      }
    }, { threshold: [0, 0.01, 0.5] })
    io.observe(el)

    // ResizeObserver: sync bounds en tiempo real (debounced)
    let debounceTimer: ReturnType<typeof setTimeout> | null = null
    const ro = new ResizeObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(syncBounds, 50)
    })
    ro.observe(el)

    // Ciclo de vida de la ventana principal: al hacer resize/mover, el panel
    // cambia de posición aunque su size no cambie — ResizeObserver no lo
    // detecta, así que escuchamos window resize + scroll.
    window.addEventListener("resize", syncBounds)
    window.addEventListener("scroll", syncBounds, true)

    // visibilitychange: ocultar el sub-WebView cuando la pestaña del browser
    // no está activa (ahorra RAM ~3 MB con MemoryUsageLevel::Low)
    const handleVis = () => {
      if (document.visibilityState === "hidden") {
        shell.browser.setVisibility(false).catch(() => {})
      } else {
        shell.browser.setVisibility(true).catch(() => {})
        requestAnimationFrame(syncBounds)
      }
    }
    document.addEventListener("visibilitychange", handleVis)

    return () => {
      io.disconnect()
      ro.disconnect()
      window.removeEventListener("resize", syncBounds)
      window.removeEventListener("scroll", syncBounds, true)
      document.removeEventListener("visibilitychange", handleVis)
      if (debounceTimer) clearTimeout(debounceTimer)
      // Mantener WebView vivo para que cookies/sesión Google persistan entre tabs
      // Solo ocultar (MemoryUsageLevel::Low ~3MB), no destruir. close() solo en onClose explícito.
      shell.browser.setVisibility(false).catch(() => {})
      nativeReady.current = false
    }
  }, []) // Solo oculta, no destruye sesión

  // Navigate native WebView when URL changes
  useEffect(() => {
    if (!IS_DESKTOP || !nativeReady.current || browserFailed) return
    shell.browser.navigate(currentSrc).catch(() => {
      setBrowserFailed(true)
    })
  }, [currentSrc, browserFailed])

  // Modo selección en desktop: el overlay se INYECTA dentro del sub-WebView
  // nativo vía eval (sin recargar ni ocultar la página — cero pérdida de estado).
  // Los picks vuelven por HTTP (/shell/browser/pick) y el host los drena aquí.
  const cbRef = useRef({ onVisualPick, onRemoveAnnotation, onToggleInspect, onAnnotationStyleBefore })
  cbRef.current = { onVisualPick, onRemoveAnnotation, onToggleInspect, onAnnotationStyleBefore }
  const inspectRef = useRef(!!inspectMode)
  inspectRef.current = !!inspectMode
  const toolRef = useRef<InspectTool>(inspectTool)
  toolRef.current = inspectTool

  useEffect(() => {
    if (!IS_DESKTOP) return
    let stopped = false
    let lastInject = 0
    const apiBase = window.location.origin
    const tick = async () => {
      if (stopped) return
      try {
        const now = Date.now()
        // Re-inyectar periódicamente mientras inspeccionamos: el script es
        // idempotente (self-guard) y sobrevive navegaciones/recargas de la página.
        if (inspectRef.current && now - lastInject > 2200) {
          lastInject = now
          await shell.browser.eval(buildOverlayScript(apiBase, toolRef.current))
        }
        const r = await shell.browser.drainPicks()
        for (const p of r?.picks ?? []) {
          if (p?.type === "remove" && p.id) {
            cbRef.current.onRemoveAnnotation?.(String(p.id))
          } else if (p?.type === "escape") {
            if (inspectRef.current) cbRef.current.onToggleInspect?.()
          } else if (p?.type === "style-snapshot" && p.id) {
            cbRef.current.onAnnotationStyleBefore?.(String(p.id), p.before ?? {})
          } else if (p?.type === "pick") {
            cbRef.current.onVisualPick?.(p as BrowserPickedElement)
          }
        }
      } catch {}
      if (!stopped) {
        // Polling adaptativo: rápido solo mientras inspeccionamos (picks en vivo);
        // con anotaciones, medio segundo basta para escuchar removes de badges;
        // idle total, 2.5s. Evita un HTTP GET cada 350ms para siempre.
        const delay = inspectRef.current ? 350 : annRef.current.length > 0 ? 900 : 2500
        setTimeout(tick, delay)
      }
    }
    tick()
    return () => { stopped = true }
  }, [])

  // Sincronizar herramienta picker/pod con el bridge inyectado
  useEffect(() => {
    if (!IS_DESKTOP || !inspectMode) return
    shell.browser.eval(setToolScript(inspectTool)).catch(() => {})
  }, [inspectMode, inspectTool])

  const handleStyleChange = useCallback((a: VisualAnnotation, prop: string, value: string) => {
    const next: Record<string, string> = { ...(a.styleDraft ?? {}) }
    if (value === "") delete next[prop]
    else next[prop] = value
    onAnnotationStyle?.(a.id, next)
    if (IS_DESKTOP) {
      const props: Record<string, string | null> = { [prop]: value === "" ? null : value }
      shell.browser.eval(applyStyleScript(a.id, props)).catch(() => {})
    }
  }, [onAnnotationStyle])

  // Reconciliar badges numerados con las anotaciones actuales (también re-los
  // crea si la página navegaron/recargaron).
  const annRef = useRef(annotations)
  annRef.current = annotations
  useEffect(() => {
    if (!IS_DESKTOP) return
    let cancelled = false
    ;(async () => {
      try {
        await shell.browser.eval(clearBadgesScript)
        for (let i = 0; i < annRef.current.length; i++) {
          if (cancelled) return
          const a = annRef.current[i]
          await shell.browser.eval(badgeScript(a.id, ZONE_ICONS[i] ?? String(i + 1), a.bx ?? a.boundingRect.x, a.by ?? a.boundingRect.y))
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [annotations])

  useEffect(() => {
    if (!IS_DESKTOP || !nativeReady.current) return
    if (!inspectMode) {
      shell.browser.eval(cleanupOverlayScript).catch(() => {})
    }
  }, [inspectMode])

  // Al desmontar el panel: limpiar overlay + badges del sub-WebView
  useEffect(() => {
    if (!IS_DESKTOP) return
    return () => {
      shell.browser.eval(cleanupOverlayScript).catch(() => {})
      shell.browser.eval(clearBadgesScript).catch(() => {})
    }
  }, [])

  // Badge individual eliminado desde el drawer → quitarlo del DOM también
  // (+ desbindear elemento y overrides CSS del bridge)
  const prevAnnIds = useRef<string[]>([])
  useEffect(() => {
    if (!IS_DESKTOP) return
    const ids = annotations.map((a) => a.id)
    for (const gone of prevAnnIds.current) {
      if (!ids.includes(gone)) {
        shell.browser.eval(removeBadgeScript(gone)).catch(() => {})
        shell.browser.eval(unbindScript(gone)).catch(() => {})
      }
    }
    prevAnnIds.current = ids
  }, [annotations])

  // Visibility: hide when component is not active (e.g. tab switch)
  // The parent handles this via the `active` prop — but for now we
  // keep it simple: the native view is always visible while mounted.

  const navigateTab = useCallback((newUrl: string) => {
    const norm = normalizeUrl(newUrl)
    setInputUrl(norm)
    setLoading(true)
    setHasError(false)
    setSuggestions([])
    setSuggestIdx(-1)
    setShowHistory(false)
    pushHistory(norm)

    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTabId) return t
        const nextHist = t.history.slice(0, t.historyIdx + 1)
        nextHist.push(norm)
        return {
          ...t,
          url: norm,
          title: formatDisplayTitle(norm),
          history: nextHist,
          historyIdx: nextHist.length - 1,
        }
      })
    )
    if (IS_DESKTOP) {
      shell.browser.navigate(norm).catch(() => {})
    } else {
      setReloadKey((k) => k + 1)
    }
  }, [activeTabId, homeUrl])

  const handleOpenProjectFolder = useCallback(async () => {
    try {
      const res = await shell.fs.pickFolder()
      if (res && res.ok && res.path) {
        setLoading(true)
        const serveRes = await shell.project.serve(res.path)
        if (serveRes.ok && serveRes.previewUrl) {
          setProjectBanner({
            directory: serveRes.directory,
            entrypoint: serveRes.entrypoint,
            htmlFiles: serveRes.htmlFiles || [],
            hasPackageJson: serveRes.hasPackageJson,
            scripts: serveRes.scripts || {},
          })
          navigateTab(serveRes.previewUrl)
          if (!inspectMode && onToggleInspectTool) {
            onToggleInspectTool("picker")
          }
        }
      }
    } catch (err) {
      console.error("Error al auto-servir proyecto:", err)
    } finally {
      setLoading(false)
    }
  }, [navigateTab, inspectMode, onToggleInspectTool])

  const handleAddTab = () => {
    const newId = `tab-${Date.now().toString(36)}`
    const defaultUrl = homeUrl
    const newTab: BrowserTabItem = {
      id: newId,
      url: defaultUrl,
      title: formatDisplayTitle(defaultUrl),
      history: [defaultUrl],
      historyIdx: 0,
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newId)
  }

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (tabs.length === 1) {
      if (onClose) onClose()
      return
    }
    const idx = tabs.findIndex((t) => t.id === id)
    const nextTabs = tabs.filter((t) => t.id !== id)
    setTabs(nextTabs)
    if (activeTabId === id) {
      const nextActive = nextTabs[Math.max(0, idx - 1)]
      if (nextActive) setActiveTabId(nextActive.id)
    }
  }

  const handleBack = () => {
    if (!activeTab || activeTab.historyIdx <= 0) return
    const prevIdx = activeTab.historyIdx - 1
    const prevUrl = activeTab.history[prevIdx]
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url: prevUrl, historyIdx: prevIdx, title: formatDisplayTitle(prevUrl) } : t))
    )
    setInputUrl(prevUrl)
    if (IS_DESKTOP) {
      shell.browser.navigate(prevUrl, "back").catch(() => {})
    } else {
      setReloadKey((k) => k + 1)
    }
  }

  const handleForward = () => {
    if (!activeTab || activeTab.historyIdx >= activeTab.history.length - 1) return
    const nextIdx = activeTab.historyIdx + 1
    const nextUrl = activeTab.history[nextIdx]
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url: nextUrl, historyIdx: nextIdx, title: formatDisplayTitle(nextUrl) } : t))
    )
    setInputUrl(nextUrl)
    if (IS_DESKTOP) {
      shell.browser.navigate(nextUrl, "forward").catch(() => {})
    } else {
      setReloadKey((k) => k + 1)
    }
  }

  const handleReload = () => {
    setLoading(true)
    setHasError(false)
    if (IS_DESKTOP && !browserFailed) {
      shell.browser.navigate(currentSrc, "reload").catch(() => {
        setBrowserFailed(true)
      })
    } else if (IS_DESKTOP && browserFailed) {
      // Reintentar crear el sub-WebView antes de fallback
      const el = viewportRef.current
      if (el) {
        const rect = el.getBoundingClientRect()
        shell.browser.open(currentSrc, { x: rect.left, y: rect.top, w: rect.width, h: rect.height }).then(() => {
          nativeReady.current = true
          setBrowserFailed(false)
        }).catch(() => {
          setReloadKey((k) => k + 1)
        })
      } else {
        setReloadKey((k) => k + 1)
      }
    } else {
      setReloadKey((k) => k + 1)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      if (suggestions.length > 0) {
        e.preventDefault()
        const next = Math.min(suggestIdx + 1, suggestions.length - 1)
        setSuggestIdx(next)
        setInputUrl(suggestions[next] ?? inputUrl)
        setShowHistory(true)
      }
      return
    }
    if (e.key === "ArrowUp") {
      if (suggestions.length > 0) {
        e.preventDefault()
        const next = Math.max(suggestIdx - 1, -1)
        setSuggestIdx(next)
        if (next >= 0) setInputUrl(suggestions[next] ?? inputUrl)
      }
      return
    }
    if (e.key === "Enter") {
      if (suggestIdx >= 0 && suggestions[suggestIdx]) {
        navigateTab(suggestions[suggestIdx]!)
      } else {
        navigateTab(inputUrl)
      }
      setShowHistory(false)
      setSuggestions([])
      setSuggestIdx(-1)
    } else if (e.key === "Escape") {
      setShowHistory(false)
      setSuggestions([])
      setSuggestIdx(-1)
    }
  }

  const handleHome = () => navigateTab(homeUrl)
  const handleOpenExternal = () => {
    if (activeTab?.url) {
      window.open(activeTab.url, "_blank", "noopener,noreferrer")
    }
  }
  const handleCopyUrl = async () => {
    try { await navigator.clipboard.writeText(currentSrc) } catch {}
  }
  const applyFind = useCallback((q: string, cs: boolean) => {
    if (!q) return
    const code = cs
      ? `window.find(${JSON.stringify(q)}, false, false, true, false, false, false)`
      : `window.find(${JSON.stringify(q)}, false, false, false, false, false, false)`
    if (IS_DESKTOP) shell.browser.eval(code).catch(() => {})
    else {
      try {
        const w = iframeRef.current?.contentWindow as any
        if (w?.find) w.find(q, false, false, !cs, false, false, false)
      } catch {}
    }
  }, [])
  const toggleBookmark = () => {
    const title = formatDisplayTitle(currentSrc)
    setBookmarks((prev) => {
      const exists = prev.some((b) => b.url === currentSrc)
      const next = exists ? prev.filter((b) => b.url !== currentSrc) : [{ url: currentSrc, title, addedAt: Date.now() }, ...prev].slice(0, 100)
      saveBookmarks(next)
      return next
    })
  }
  const applyZoom = (next: number) => {
    const v = Math.max(0.5, Math.min(2.5, Math.round(next * 10) / 10))
    setZoomLevel(v)
    try { localStorage.setItem("opencode.browser.zoom", String(v)) } catch {}
    const css = `document.documentElement.style.zoom='${v}'; document.body.style.zoom='${v}';`
    if (IS_DESKTOP) shell.browser.eval(css).catch(() => {})
    else {
      try {
        const doc = iframeRef.current?.contentDocument as any
        if (doc?.documentElement) {
          doc.documentElement.style.zoom = String(v)
          if (doc.body) doc.body.style.zoom = String(v)
        }
      } catch {}
    }
  }

  const targetWidth = DEVICE_WIDTHS[deviceMode]

  return (
    <div className="browser-shell">
      {/* 1. Chrome-like Tab Bar on Top (Preserves tabs styling) */}
      <div className="browser-tabbar">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              className={`browser-tab${isActive ? " active" : ""}`}
              onClick={() => setActiveTabId(tab.id)}
              title={tab.url}
            >
              <span className="browser-tab-icon">{getFavicon(tab.url)}</span>
              <span className="browser-tab-title">{tab.title}</span>
              <button
                type="button"
                className="browser-tab-close"
                onClick={(e) => handleCloseTab(e, tab.id)}
                title="Cerrar pestaña"
                aria-label="Cerrar pestaña"
              >
                ×
              </button>
            </div>
          )
        })}

        <button
          type="button"
          className="browser-tab-new"
          onClick={handleAddTab}
          title="Nueva pestaña"
          aria-label="Nueva pestaña"
        >
          +
        </button>
      </div>

      {/* 2. Navigation Toolbar — full chrome-like browser */}
      <div className="browser-toolbar">
        <div className="browser-nav-actions">
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleBack}
            disabled={!activeTab || activeTab.historyIdx <= 0}
            title="Atrás"
            aria-label="Atrás"
          >
            ←
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleForward}
            disabled={!activeTab || activeTab.historyIdx >= activeTab.history.length - 1}
            title="Adelante"
            aria-label="Adelante"
          >
            →
          </button>
          <button
            type="button"
            className="browser-nav-btn"
            onClick={handleReload}
            title="Recargar página"
            aria-label="Recargar"
          >
            <RefreshIcon size={14} />
          </button>
          <button type="button" className="browser-nav-btn" onClick={handleHome} title="Inicio (Google)" aria-label="Inicio">
            <span style={{ fontSize: 14 }}>⌂</span>
          </button>
          <button
            type="button"
            className="browser-open-project-btn"
            onClick={handleOpenProjectFolder}
            title="Abrir carpeta de proyecto para diseñar y auto-servir en OpenDesign"
            aria-label="Abrir proyecto para diseño"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              padding: "3px 8px",
              background: "var(--primary-soft)",
              border: "1px solid var(--primary-soft)",
              borderRadius: "6px",
              color: "var(--primary)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              marginLeft: "4px",
              whiteSpace: "nowrap",
            }}
          >
            <FolderIcon size={13} />
            <span>Abrir Proyecto Web</span>
          </button>
        </div>

        {/* 3. Address Bar — omnibox chrome-like con search, candado, fav, tabs */}
        <div className="browser-omnibox" ref={dropdownRef} style={{ flex: 1 }}>
          <button
            type="button"
            className={`browser-tune-btn${showTuneDropdown ? " active" : ""}`}
            onClick={() => setShowTuneDropdown((v) => !v)}
            title="Configuración de puertos y resolución"
            aria-label="Configuración"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>

          <span className={isSecure ? "browser-addr-lock" : "browser-addr-warn"} title={isSecure ? "Conexión segura (HTTPS)" : "No seguro (HTTP)"} style={{ display: "inline-flex", flexShrink: 0 }}>
            {isSecure ? "🔒" : "⚠"}
          </span>
          <div style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", alignItems: "center" }}>
            <input
              type="text"
              className="browser-omnibox-input"
              value={inputUrl}
              onChange={(e) => { setInputUrl(e.target.value); if (e.target.value.trim().length >= 1) setShowHistory(true) }}
              onFocus={() => { if (inputUrl.trim() === "" || inputUrl === homeUrl) setShowHistory(true); else if (loadHistory().length > 0) setShowHistory(true) }}
              onKeyDown={handleKeyDown}
              placeholder="Buscá en Google o escribí una URL"
            />
            {inputUrl && (
              <button type="button" onClick={() => setInputUrl("")} title="Borrar" aria-label="Borrar" style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: "0 4px" }}>×</button>
            )}
            {(showHistory || suggestions.length > 0) && (
              <div ref={histRef} className="browser-suggest-dropdown">
                {(() => {
                  const q = inputUrl.trim().toLowerCase()
                  const hist = loadHistory()
                  const filtered = q ? hist.filter((u) => u.toLowerCase().includes(q)).slice(0, 6) : hist.slice(0, 6)
                  const qTrim = inputUrl.trim()
                  const showSearch = qTrim && !isProbablyUrl(qTrim)
                  return (
                    <>
                      {showSearch && qTrim && (
                        <button type="button" className="browser-suggest-item" style={{ fontWeight: 600 }} onClick={() => { setShowHistory(false); setSuggestions([]); navigateTab(`https://www.google.com/search?q=${encodeURIComponent(qTrim)}`) }}>
                          <SearchIcon size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Buscar "{qTrim}" en Google</span>
                        </button>
                      )}
                      {suggestions.map((s, idx) => (
                        <button key={s} type="button" className={`browser-suggest-item${idx === suggestIdx ? " active" : ""}`} style={idx === suggestIdx ? { background: "var(--primary-soft)", color: "var(--primary)" } : undefined} onClick={() => { setShowHistory(false); setSuggestions([]); setSuggestIdx(-1); navigateTab(`https://www.google.com/search?q=${encodeURIComponent(s)}`) }}>
                          <SearchIcon size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s}</span>
                        </button>
                      ))}
                      {filtered.map((u) => (
                        <button key={u} type="button" className="browser-suggest-item" onClick={() => { setShowHistory(false); setSuggestions([]); navigateTab(u) }}>
                          <GlobeIcon size={13} /> <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u}</span>
                        </button>
                      ))}
                      {filtered.length === 0 && suggestions.length === 0 && !showSearch && (
                        <div style={{ padding: "8px 10px", color: "var(--muted)", fontSize: 12 }}>Sin historial. Escribí para buscar en Google.</div>
                      )}
                    </>
                  )
                })()}
              </div>
            )}
          </div>

          {loading && <LoadingIcon size={14} className="browser-loading-spinner" />}

          {/* Config Dropdown */}
          {showTuneDropdown && (
            <div className="browser-tune-dropdown">
              <div className="browser-tune-section">
                <div className="browser-tune-section-title">Puertos locales rápidos</div>
                <div className="browser-ports-grid">
                  {COMMON_PORTS.map((p) => {
                    const isActive = activeTab?.url.includes(`:${p.port}`)
                    return (
                      <button
                        key={p.port}
                        type="button"
                        className={`browser-port-btn${isActive ? " active" : ""}`}
                        onClick={() => {
                          navigateTab(`http://localhost:${p.port}`)
                          setShowTuneDropdown(false)
                        }}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="browser-tune-section">
                <div className="browser-tune-section-title">Modo de dispositivo</div>
                <div className="browser-device-grid">
                  <button
                    type="button"
                    className={`browser-device-btn${deviceMode === "responsive" ? " active" : ""}`}
                    onClick={() => { setDeviceMode("responsive"); setShowTuneDropdown(false) }}
                  >
                    <GlobeIcon size={12} /> 100%
                  </button>
                  <button
                    type="button"
                    className={`browser-device-btn${deviceMode === "mobile" ? " active" : ""}`}
                    onClick={() => { setDeviceMode("mobile"); setShowTuneDropdown(false) }}
                  >
                    <MonitorIcon size={12} /> 375px
                  </button>
                  <button
                    type="button"
                    className={`browser-device-btn${deviceMode === "tablet" ? " active" : ""}`}
                    onClick={() => { setDeviceMode("tablet"); setShowTuneDropdown(false) }}
                  >
                    <MonitorIcon size={12} /> 768px
                  </button>
                  <button
                    type="button"
                    className={`browser-device-btn${deviceMode === "desktop" ? " active" : ""}`}
                    onClick={() => { setDeviceMode("desktop"); setShowTuneDropdown(false) }}
                  >
                    <MonitorIcon size={12} /> 1280px
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="browser-omnibox-actions">
            <button type="button" className={`browser-tune-btn${isBookmarked ? " browser-star-on" : ""}`} onClick={toggleBookmark} title={isBookmarked ? "Quitar favorito" : "Agregar a favoritos"} aria-label="Favorito">
              <span style={{ fontSize: 14 }}>{isBookmarked ? "★" : "☆"}</span>
            </button>
            <button type="button" className="browser-tune-btn" onClick={handleCopyUrl} title="Copiar URL" aria-label="Copiar URL">
              <span style={{ fontSize: 12 }}>⧉</span>
            </button>
            <div className="browser-zoom-group" title="Zoom de página">
              <button type="button" className="browser-tune-btn" onClick={() => applyZoom(zoomLevel - 0.1)} aria-label="Alejar">−</button>
              <span style={{ fontSize: 11, minWidth: 34, textAlign: "center" }}>{Math.round(zoomLevel * 100)}%</span>
              <button type="button" className="browser-tune-btn" onClick={() => applyZoom(zoomLevel + 0.1)} aria-label="Acercar">+</button>
              <button type="button" className="browser-tune-btn" onClick={() => applyZoom(1)} aria-label="100%">↺</button>
            </div>
            <button type="button" className={`browser-tune-btn${findOpen ? " active" : ""}`} onClick={() => setFindOpen((v) => !v)} title="Buscar en la página (Ctrl+F)" aria-label="Buscar">
              <SearchIcon size={13} />
            </button>
            {onToggleInspect && (
              <button
                type="button"
                className={`browser-tune-btn${inspectMode && inspectTool === "picker" ? " active" : ""}`}
                onClick={() => onToggleInspectTool ? onToggleInspectTool("picker") : onToggleInspect()}
                title={inspectMode && inspectTool === "picker" ? "Salir selección (Esc)" : "Seleccionar elemento: clic (◈)"}
                aria-label="Seleccionar elemento"
                style={inspectMode && inspectTool === "picker" ? { color: "var(--primary)", background: "var(--primary-soft)" } : undefined}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>◈</span>
              </button>
            )}
            {onToggleInspectTool && (
              <button
                type="button"
                className={`browser-tune-btn${inspectMode && inspectTool === "pod" ? " active" : ""}`}
                onClick={() => onToggleInspectTool("pod")}
                title={inspectMode && inspectTool === "pod" ? "Salir selección (Esc)" : "Marcar área: arrastrá un trazo (⬚)"}
                aria-label="Marcar área"
                style={inspectMode && inspectTool === "pod" ? { color: "var(--warning)", background: "var(--warning-soft)" } : undefined}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>⬚</span>
              </button>
            )}
            {visualSelection && onClearVisual && (
              <button
                type="button"
                className="browser-tune-btn"
                onClick={onClearVisual}
                title="Quitar zona seleccionada"
                aria-label="Quitar zona"
              >
                ×
              </button>
            )}
            <button
              type="button"
              className="browser-tune-btn"
              onClick={handleOpenExternal}
              title="Abrir en navegador externo (Chrome/Edge)"
              aria-label="Abrir en navegador externo"
            >
              <MonitorIcon size={14} />
            </button>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            className="browser-nav-btn"
            onClick={onClose}
            title="Cerrar panel de navegador"
            aria-label="Cerrar"
          >
            <CloseIcon size={14} />
          </button>
        )}
      </div>
      {findOpen && (
        <div className="browser-findbar">
          <SearchIcon size={13} />
          <input
            autoFocus
            value={findQuery}
            onChange={(e) => setFindQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFind(findQuery, findCase)
              if (e.key === "Escape") setFindOpen(false)
            }}
            placeholder="Buscar en la página…"
          />
          <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
            <input type="checkbox" checked={findCase} onChange={(e) => setFindCase(e.target.checked)} /> Aa
          </label>
          <button type="button" className="btn-secondary compact" onClick={() => applyFind(findQuery, findCase)}>Buscar</button>
          <button type="button" className="browser-nav-btn" onClick={() => setFindOpen(false)} aria-label="Cerrar">×</button>
        </div>
      )}
      {showBookmarks && bookmarks.length > 0 && (
        <div className="browser-bookmarks-bar">
          {bookmarks.slice(0, 20).map((b) => (
            <button key={b.url} type="button" className="browser-bookmark" onClick={() => navigateTab(b.url)} title={b.url}>
              <GlobeIcon size={11} /> {b.title || b.url.slice(0, 36)}
            </button>
          ))}
          <button
            type="button"
            className="browser-nav-btn"
            style={{ marginLeft: "auto" }}
            onClick={() => {
              const v = !showBookmarks
              setShowBookmarks(v)
              try { localStorage.setItem("opencode.browser.showBookmarks", v ? "1" : "0") } catch {}
            }}
            title="Ocultar barra de favoritos"
            aria-label="Ocultar favoritos"
          >
            ×
          </button>
        </div>
      )}

      {/* Quick Project Bar */}
      {projectBanner && (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "4px 12px",
          background: "var(--surface-strong)",
          borderBottom: "1px solid var(--border)",
          fontSize: "12px",
          color: "var(--muted)",
          overflowX: "auto"
        }}>
          <span style={{ color: "var(--primary)", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}><FolderIcon size={12} /> {projectBanner.directory.split(/[\/\\]/).pop()}</span>
          {projectBanner.htmlFiles.length > 1 && (
            <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
              <span>Vistas:</span>
              {projectBanner.htmlFiles.map((file) => {
                const isActive = activeTab?.url.endsWith(file)
                return (
                  <button
                    key={file}
                    type="button"
                    onClick={() => {
                      const match = activeTab?.url.match(/\/shell\/preview\/([^/]+)/)
                      if (match) {
                        navigateTab(`http://127.0.0.1:4848/shell/preview/${match[1]}/${file}`)
                      }
                    }}
                    style={{
                      background: isActive ? "var(--primary)" : "var(--surface-strong)",
                      color: isActive ? "#fff" : "var(--text)",
                      border: "none",
                      borderRadius: "4px",
                      padding: "2px 6px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    {file}
                  </button>
                )
              })}
            </div>
          )}
          {projectBanner.hasPackageJson && (
            <span style={{ marginLeft: "auto", fontSize: "12px", color: "var(--muted)" }}>
              Node/Vite Project • Auto-servido
            </span>
          )}
        </div>
      )}
      {/* 4. Web Viewport + drawer de anotaciones */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div className="browser-viewport-container" ref={viewportRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
          {hasError ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text)", maxWidth: "460px", margin: "auto" }}>
              <div style={{ marginBottom: "12px", color: "var(--danger)", display: "inline-flex" }}><CloseIcon size={32} /></div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}>No se pudo conectar con la página</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "20px" }}>
                Si es un servidor local, verifica que el dev server esté ejecutándose (botón <strong>▶ Run Web</strong> en el chat). Si es un sitio web externo protegido, ábrelo en el navegador externo.
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <button type="button" className="btn-primary compact" onClick={handleReload}>
                  Reintentar
                </button>
                <button type="button" className="btn-secondary compact" onClick={handleOpenExternal}>
                  Abrir en Chrome / Edge
                </button>
              </div>
            </div>
          ) : IS_DESKTOP ? (
            browserFailed ? (
              /* Fallback: sub-WebView falló → iframe vía proxy (mismo que mobile) */
              <iframe
                key={`${reloadKey}-${inspectMode ? "inspect" : "view"}-fallback`}
                ref={iframeRef}
                src={getFrameSrc(currentSrc, !!inspectMode)}
                title="Vista previa web (fallback)"
                allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; microphone; camera"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false)
                  setHasError(true)
                }}
                className="browser-iframe-element"
                style={{
                  width: targetWidth || "100%",
                  boxShadow: targetWidth ? "0 4px 24px rgba(0,0,0,0.3)" : "none",
                }}
              />
            ) : null
          ) : (
            <>
              <iframe
                key={`${reloadKey}-${inspectMode ? "inspect" : "view"}`}
                ref={iframeRef}
                src={getFrameSrc(currentSrc, !!inspectMode)}
                title="Vista previa web"
                allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; microphone; camera"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setLoading(false)
                  setHasError(true)
                }}
                className="browser-iframe-element"
                style={{
                  width: targetWidth || "100%",
                  boxShadow: targetWidth ? "0 4px 24px rgba(0,0,0,0.3)" : "none",
                }}
              />
              {inspectMode && onVisualPick && (
                <BrowserVisualOverlay
                  iframeRef={iframeRef}
                  enabled={!!inspectMode}
                  url={currentSrc}
                  onPick={(el) => onVisualPick(el)}
                  onExit={() => onToggleInspect?.()}
                />
              )}
            </>
          )}
        </div>

        {(annotations.length > 0 || !!inspectMode) && (
          <div
            className="browser-annotations"
            style={{
              width: 240,
              flexShrink: 0,
              borderLeft: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              background: "var(--bg, var(--surface-strong))",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "8px 10px", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>ZONAS MARCADAS{annotations.length > 0 ? ` (${annotations.length})` : ""}</span>
              {annotations.length > 0 && (
                <button type="button" onClick={() => {
                  annotations.forEach((a) => onRemoveAnnotation?.(a.id))
                  if (IS_DESKTOP) {
                    shell.browser.eval(clearBadgesScript).catch(() => {})
                    annotations.forEach((a) => shell.browser.eval(unbindScript(a.id)).catch(() => {}))
                  }
                  onClearVisual?.()
                }} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12 }} title="Quitar todas">Quitar todo</button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
              {annotations.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, padding: "4px 2px" }}>
                  {inspectMode ? "Clic en cualquier elemento de la página para marcar una zona." : "Activá ◈ y hacé clic en elementos para marcar zonas."}
                </div>
              )}
              {annotations.map((a, i) => (
                <div key={a.id} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "6px 8px", fontSize: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ background: a.mode === "pod" ? "var(--warning)" : "var(--primary)", color: "#fff", borderRadius: 9, minWidth: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, padding: "0 4px" }}>{ZONE_ICONS[i] ?? i + 1}</span>
                    <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>&lt;{a.tag}&gt; {a.mode === "pod" ? `área · ${a.members?.length ?? 0} elems` : a.selector.slice(0, 26)}</span>
                    <button type="button" onClick={() => onRemoveAnnotation?.(a.id)} style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0, display: "inline-flex" }} aria-label="Quitar zona"><CloseIcon size={12} /></button>
                  </div>
                  {a.source?.file && (
                    <div style={{ color: "var(--success)", fontSize: 12, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "3px" }} title={`${a.source.file}${a.source.line != null ? `:${a.source.line}` : ""}`}>
                        <FileIcon size={12} /> {a.source.file.split(/[\\/]/).slice(-2).join("/")}{a.source.line != null ? `:${a.source.line}` : ""}
                    </div>
                  )}
                  <textarea
                    value={a.comment}
                    onChange={(e) => onAnnotationComment?.(a.id, e.target.value)}
                    placeholder="¿Qué cambiar acá? (lógica, error, estilo…)"
                    rows={2}
                    style={{ width: "100%", boxSizing: "border-box", background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 6, fontSize: 12, padding: "4px 6px", resize: "vertical" }}
                  />
                  {(() => {
                    const open = expandedStyleId === a.id
                    const draft = a.styleDraft ?? {}
                    const activeCount = Object.keys(draft).length
                    return (
                      <>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                          <button
                            type="button"
                            onClick={() => setExpandedStyleId(open ? null : a.id)}
                            style={{ background: "none", border: "none", color: open ? "var(--primary)" : "var(--muted)", cursor: "pointer", fontSize: 12, padding: 0, display: "inline-flex", alignItems: "center", gap: "4px" }}
                          >
                            <PaintIcon size={12} /> Ajustar estilo{activeCount > 0 ? ` (${activeCount})` : ""}
                          </button>
                          {activeCount > 0 && IS_DESKTOP && (
                            <button
                              type="button"
                              onClick={() => {
                                onAnnotationStyle?.(a.id, {})
                                if (IS_DESKTOP) shell.browser.eval(applyStyleScript(a.id, {})).catch(() => {})
                              }}
                              style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer", fontSize: 12, padding: 0 }}
                            >
                              ↺ reset
                            </button>
                          )}
                        </div>
                        {open && (
                          <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                            {STYLE_FIELDS.map((f) => (
                              <div key={f.prop} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                                <span style={{ width: 62, color: "var(--muted)", fontSize: 12, flexShrink: 0 }}>{f.label}</span>
                                {f.kind === "color" && (
                                  <>
                                    <input
                                      type="color"
                                      value={/^#[0-9a-fA-F]{6}$/.test(draft[f.prop] ?? "") ? draft[f.prop] : "#000000"}
                                      onChange={(e) => handleStyleChange(a, f.prop, e.target.value)}
                                      style={{ width: 26, height: 20, padding: 0, border: "1px solid var(--border)", background: "transparent", cursor: "pointer" }}
                                      aria-label={f.label}
                                    />
                                    <input
                                      type="text"
                                      value={draft[f.prop] ?? ""}
                                      placeholder="—"
                                      onChange={(e) => handleStyleChange(a, f.prop, e.target.value)}
                                      style={{ flex: 1, minWidth: 0, background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, padding: "2px 4px" }}
                                    />
                                  </>
                                )}
                                {f.kind === "number" && (
                                  <span style={{ display: "flex", alignItems: "center", gap: 2, flex: 1 }}>
                                    <input
                                      type="number"
                                      min={0}
                                      value={(draft[f.prop] ?? "").replace(/px$/, "")}
                                      placeholder="—"
                                      onChange={(e) => handleStyleChange(a, f.prop, e.target.value === "" ? "" : `${e.target.value}${f.unit ?? "px"}`)}
                                      style={{ width: 58, background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, padding: "2px 4px" }}
                                    />
                                    <span style={{ color: "var(--muted)", fontSize: 12 }}>{f.unit}</span>
                                  </span>
                                )}
                                {f.kind === "select" && (
                                  <select
                                    value={draft[f.prop] ?? ""}
                                    onChange={(e) => handleStyleChange(a, f.prop, e.target.value)}
                                    style={{ flex: 1, minWidth: 0, background: "transparent", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 4, fontSize: 12, padding: "2px 4px" }}
                                  >
                                    {(f.options ?? []).map((o) => <option key={o} value={o}>{o === "" ? "—" : o}</option>)}
                                  </select>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              ))}
            </div>
            {annotations.length > 0 && (
              <div style={{ padding: "8px 10px", borderTop: "1px solid var(--border)", fontSize: 12, color: "var(--muted)", lineHeight: 1.45 }}>
                Tu próximo mensaje del chat incluirá estas {annotations.length === 1 ? "zona" : `${annotations.length} zonas`} automáticamente.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
