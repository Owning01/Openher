import { memo, useState, useRef, useCallback, useEffect } from "react"
import { useScheduled } from "../hooks/useScheduled"
import { MaximizeIcon, CloseIcon, FolderIcon, GlobeIcon, LoadingIcon, FileIcon, PaintIcon, SearchIcon } from "../Icons"
import { useOutsideClick } from "../hooks/useOutsideClick"
import { shell } from "../shell"
import { BrowserVisualOverlay, type BrowserPickedElement } from "./BrowserVisualOverlay"
import { LedSwitch } from "./LedSwitch"
import type { VisualSelection, VisualAnnotation } from "../hooks/useVisualSelection"
import {
  buildOverlayScript, badgeScript, removeBadgeScript, clearBadgesScript,
  cleanupOverlayScript, applyStyleScript, unbindScript, setToolScript,
  type InspectTool,
} from "./browserOverlayScript"
import { buildPipScript } from "./browserPipScript"
import { buildWheelScript } from "./browserWheelScript"
import { extractUrlFromDataTransfer, setUrlDragData } from "../utils/urlDrag"
import { parseShortcutEvent, parseZoomLevel, parseFindCount, shouldAdoptExternalUrl, BROWSER_ZOOM_MAP_KEY, domainOf, zoomForDomain, withZoomForDomain, type PageShortcutAction } from "./browserSync"
import {
  BROWSER_HOME, BROWSER_MINIMAL_KEY, BROWSER_ZOOM_KEY, DEVICE_WIDTHS, IS_DESKTOP, ZONE_ICONS,
  type DeviceMode,
} from "../features/browser/constants"
import { getFavicon } from "../features/browser/favicon"
import { getFrameSrc, isProbablyUrl } from "../features/browser/url"
import { useBrowserTabs } from "../features/browser/useBrowserTabs"
import { useBookmarks } from "../features/browser/useBookmarks"
import { useBrowserFind } from "../features/browser/useBrowserFind"
import { BrowserToolbar } from "../features/browser/BrowserToolbar"

export { BROWSER_HOME }
export type { BrowserBookmark, BrowserTabItem } from "../features/browser/types"

const STYLE_FIELDS: Array<{ prop: string; label: string; kind: "color" | "number" | "select"; options?: string[]; unit?: string }> = [
  { prop: "color", label: "Texto", kind: "color" },
  { prop: "background-color", label: "Fondo", kind: "color" },
  { prop: "font-size", label: "Fuente", kind: "number", unit: "px" },
  { prop: "font-weight", label: "Grosor", kind: "select", options: ["", "normal", "bold", "300", "400", "500", "600", "700", "800"] },
  { prop: "text-align", label: "Alineación", kind: "select", options: ["", "left", "center", "right"] },
  { prop: "padding", label: "Padding", kind: "number", unit: "px" },
  { prop: "border-radius", label: "Radio", kind: "number", unit: "px" },
]

export const BrowserPanel = memo(function BrowserPanel({
  initialUrl = BROWSER_HOME,
  isActive = true,
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
  hideTabBar = false,
  onUrlChange,
  // Clave estable del tab desktop (bid): con hideTabBar persiste la pila
  // atrás/adelante en localStorage para que sobreviva reinicios.
  persistKey,
}: {
  initialUrl?: string
  isActive?: boolean
  onClose?: () => void
  hideTabBar?: boolean
  persistKey?: string
  onUrlChange?: (url: string) => void
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
  const [loading, setLoading] = useState(true)
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("responsive")
  const [showTuneDropdown, setShowTuneDropdown] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && navigator.onLine === false)
  // Preflight del fallback iframe: distingue "sitio caído" de "cargando"
  const [probe, setProbe] = useState<{ phase: "idle" | "checking" | "ok" | "fail"; status?: number }>({ phase: "idle" })
  const [embedEmpty, setEmbedEmpty] = useState(false)
  const [browserFailed, setBrowserFailed] = useState(false)
  const [expandedStyleId, setExpandedStyleId] = useState<string | null>(null)
  const [lastDownload, setLastDownload] = useState<{ url: string; path: string | null; ok: boolean } | null>(null)
  const [profile, setProfile] = useState<{ data_dir: string; webview_dir: string; downloads_dir: string } | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    try {
      const v = parseFloat(localStorage.getItem(BROWSER_ZOOM_KEY) || "1")
      return Number.isFinite(v) && v > 0 ? Math.max(0.5, Math.min(2.5, v)) : 1
    } catch { return 1 }
  })
  const zoomRef = useRef(zoomLevel)
  zoomRef.current = zoomLevel
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
  const [minimal, setMinimal] = useState(() => {
    try { return localStorage.getItem(BROWSER_MINIMAL_KEY) === "1" } catch { return false }
  })
  const [isFullscreen, setIsFullscreen] = useState(false)

  const viewportRef = useRef<HTMLDivElement | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const omniboxRef = useRef<HTMLInputElement | null>(null)
  const nativeReady = useRef(false)
  const onUrlChangeRef = useRef(onUrlChange)
  onUrlChangeRef.current = onUrlChange
  // Vista nativa del pool Rust ("" = única legacy): todas las llamadas van
  // con el bid para que cada pestaña conserve su WebView (sin recargas).
  const view = persistKey ?? ""
  const bOpen = (url: string, bounds: { x: number; y: number; w: number; h: number }) =>
    shell.browser.open(url, bounds, view)
  const bBounds = (b: { x: number; y: number; w: number; h: number }) => shell.browser.setBounds(b, view)
  const bVis = (v: boolean) => shell.browser.setVisibility(v, view)
  const bNav = useCallback((url: string, action?: "back" | "forward" | "reload") => shell.browser.navigate(url, action, view), [view])
  const bEval = (code: string) => shell.browser.eval(code, view)
  const bUrl = () => shell.browser.url(view)
  // Navegación "silenciosa" que consume el hook de tabs (mismo catch que antes).
  const navQuiet = useCallback((url: string, action?: "back" | "forward") => { bNav(url, action).catch(() => {}) }, [bNav])
  // Ancho de columna del modo dispositivo (null = responsive completo).
  // El hijo nativo también lo respeta: bounds centrados, no solo el iframe.
  const deviceWidthRef = useRef<number | null>(null)

  // Resetea el chrome del host antes de una navegación del omnibox.
  const resetOnNavigate = useCallback(() => {
    setLoading(true)
    setHasError(false)
    setSuggestions([])
    setSuggestIdx(-1)
    setShowHistory(false)
  }, [])

  const {
    tabs, activeTabId, setActiveTabId, inputUrl, setInputUrl, reloadKey, bumpReload, homeUrl,
    tabsRef, activeTabIdRef, activeTab, currentSrc,
    navigateTab, commitExternalUrl, handleAddTab, handleTabBarDragOver, handleTabBarDrop,
    closeTabById, handleCloseTab, handleBack, handleForward,
  } = useBrowserTabs({
    initialUrl,
    hideTabBar,
    persistKey,
    isDesktop: IS_DESKTOP,
    nav: navQuiet,
    onClose,
    onNavigateStart: resetOnNavigate,
  })

  const evalInPage = useCallback((code: string) => { bEval(code).catch(() => {}) }, [view])

  const { bookmarks, showBookmarks, setBookmarksVisible, isBookmarked, toggleBookmark } = useBookmarks(currentSrc)
  const {
    findOpen, setFindOpen, findQuery, setFindQuery, findCase, setFindCase,
    findTotal, setFindTotal, findInputRef, applyFind, openFind,
  } = useBrowserFind({ isDesktop: IS_DESKTOP, currentSrc, iframeRef, evalInPage })

  const isSecure = /^https:/i.test(currentSrc)

  const dropdownRef = useRef<HTMLDivElement | null>(null)
  useOutsideClick(dropdownRef, () => setShowTuneDropdown(false), showTuneDropdown)
  const histRef = useRef<HTMLDivElement | null>(null)
  useOutsideClick(histRef, () => { setShowHistory(false); setSuggestions([]); setSuggestIdx(-1) }, showHistory || suggestions.length > 0)

  useEffect(() => {
    // Solo resincronizar al cambiar de pestaña o al commitear una navegación:
    // onUrlChange es inline en el padre (nueva identidad cada render) y si va
    // en deps pisa lo que el usuario está escribiendo → URL "inmutable".
    if (activeTab) {
      setInputUrl(activeTab.url)
      setHasError(false)
      if (activeTab.url) {
        onUrlChangeRef.current?.(activeTab.url)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, activeTab?.url])

  // Encaja bounds lógicos en la columna del modo dispositivo (centrada).
  const fitBounds = useCallback((r: { left: number; top: number; width: number; height: number }) => {
    const tw = deviceWidthRef.current
    const w = tw ? Math.min(Math.round(r.width), tw) : Math.round(r.width)
    return { x: Math.round(r.left + (r.width - w) / 2), y: Math.round(r.top), w, h: Math.round(r.height) }
  }, [])

  useEffect(() => { try { localStorage.setItem(BROWSER_MINIMAL_KEY, minimal ? "1" : "0") } catch {} }, [minimal])

  // El sub-WebView nativo no propaga focus al DOM del host. Marcamos el panel
  // activo para que los shortcuts del navegador tengan prioridad sobre OpenHer.
  useEffect(() => {
    if (!IS_DESKTOP || !isActive) return
    document.body.dataset.opencodeBrowserFocused = "true"
    return () => {
      if (document.body.dataset.opencodeBrowserFocused === "true") {
        delete document.body.dataset.opencodeBrowserFocused
      }
    }
  }, [isActive])
  // F11 fullscreen, F12 inspect, Ctrl+wheel zoom
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "F11") {
        e.preventDefault()
        if (!viewportRef.current) return
        if (!document.fullscreenElement) viewportRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => setMinimal((v) => !v))
        else document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {})
      }
      if (e.key === "F12") {
        e.preventDefault()
        if (onToggleInspect) onToggleInspect()
        else if (onToggleInspectTool) onToggleInspectTool(inspectTool === "picker" ? "pod" : "picker")
      }
    }
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        const next = Math.max(0.5, Math.min(2.5, Math.round((zoomLevel + delta) * 10) / 10))
        if (next !== zoomLevel) {
          // inline apply to avoid stale closure
          const v = next
          try {
            localStorage.setItem(BROWSER_ZOOM_KEY, String(v))
            const d = domainOf(tabsRef.current.find((t) => t.id === activeTabIdRef.current)?.url ?? "")
            if (d) {
              let map: Record<string, number> = {}
              try { map = JSON.parse(localStorage.getItem(BROWSER_ZOOM_MAP_KEY) || "null") ?? {} } catch {}
              localStorage.setItem(BROWSER_ZOOM_MAP_KEY, JSON.stringify(withZoomForDomain(map, d, v)))
            }
          } catch {}
          if (IS_DESKTOP) bEval(zoomCodeFor(v)).catch(() => {})
          else {
            try {
              const doc = iframeRef.current?.contentDocument as any
              if (doc?.documentElement) { doc.documentElement.style.zoom = String(v); if (doc.body) doc.body.style.zoom = String(v) }
            } catch {}
          }
          setZoomLevel(v)
        }
      }
    }
    const el = viewportRef.current
    window.addEventListener("keydown", onKey)
    el?.addEventListener("wheel", onWheel as any, { passive: false } as any)
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", onFsChange)
    return () => { window.removeEventListener("keydown", onKey); el?.removeEventListener("wheel", onWheel as any); document.removeEventListener("fullscreenchange", onFsChange) }
  }, [zoomLevel, onToggleInspect, onToggleInspectTool, inspectTool])

  // Watchdog de carga: espera a sub-WebView history.back() real (3-5s) antes de ocultar spinner
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 4000)
    return () => clearTimeout(t)
  }, [currentSrc, reloadKey])

  // Sugerencias Chrome-like: debounced fetch con AbortSignal para evitar out-of-order
  const suggestCtrlRef = useRef<AbortController | null>(null)
  useEffect(() => {
    const q = inputUrl.trim()
    if (!q || isProbablyUrl(q) || q.length < 2 || q.startsWith("http")) {
      suggestCtrlRef.current?.abort()
      setSuggestions([])
      setSuggestIdx(-1)
      return
    }
    const t = setTimeout(async () => {
      suggestCtrlRef.current?.abort()
      const c = new AbortController()
      suggestCtrlRef.current = c
      try {
        const suggestUrl = `https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}`
        const proxyUrl = `/shell/proxy?url=${encodeURIComponent(suggestUrl)}`
        const res = await fetch(proxyUrl, { headers: { Accept: "application/json" }, signal: c.signal })
        if (c.signal.aborted) return
        if (!res.ok) return
        const data = await res.json()
        if (c.signal.aborted) return
        const list: string[] = Array.isArray(data) && Array.isArray(data[1]) ? data[1].slice(0, 6) : []
        setSuggestions(list.filter((s) => typeof s === "string" && s.trim()))
        setSuggestIdx(-1)
      } catch (e: any) {
        if (e?.name !== "AbortError") setSuggestions([])
      }
    }, 180)
    return () => clearTimeout(t)
  }, [inputUrl])

  // --- Native Sub-WebView (desktop only) — singleton guard + HiDPI + observabilidad
  useEffect(() => {
    if (!IS_DESKTOP || !viewportRef.current) return
    if (!isActive) {
      bVis(false).catch((e) => console.warn("[Browser] setVisibility false (inactive mount) failed", e))
      return
    }
    const el = viewportRef.current
    el.setAttribute("data-browser-mounted", "true")

    // Rust espera píxeles LÓGICOS (LogicalPosition/Size): getBoundingClientRect
    // ya viene en CSS px, NO multiplicar por dpr (antes ×dpr desplazaba y
    // agrandaba el hijo en pantallas 125%/150%: franja blanca + tapa la URL).
    const syncBounds = () => {
      bBounds(fitBounds(el.getBoundingClientRect()))
        .catch((e) => console.warn("[Browser] setBounds failed", e))
    }

    // Open native sub-WebView with initial URL at the viewport bounds
    const bounds = fitBounds(el.getBoundingClientRect())
    let cancelled = false
    const markReady = () => {
      if (cancelled) return
      nativeReady.current = true
      setBrowserFailed(false)
      injectWheel()
      // La página puede no tener documento aún: reintento tardío (self-guard)
      window.setTimeout(() => { if (!cancelled) injectWheel() }, 1500)
      requestAnimationFrame(syncBounds)
    }
    bOpen(currentSrc, bounds).then(markReady).catch((e) => {
      console.warn("[Browser] open failed url=" + currentSrc + ", reintentando…", e)
      // La primera creación del controller WebView2 suele tardar >900ms
      // (timeout del canal) aunque termina creándose: reintentar una vez
      // antes de caer al fallback iframe (que Google bloquea por X-Frame).
      setTimeout(() => {
        if (cancelled) return
        bOpen(currentSrc, bounds).then(markReady).catch((e2) => {
          if (cancelled) return
          console.warn("[Browser] open retry failed url=" + currentSrc, e2)
          nativeReady.current = false
          setBrowserFailed(true)
          setHasError(false)
        })
      }, 900)
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
        bVis(visible).catch((e) => console.warn("[Browser] setVisibility IO failed", e))
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
        bVis(false).catch((e) => console.warn("[Browser] visibility hidden failed", e))
      } else if (isActive) {
        bVis(true).catch((e) => console.warn("[Browser] visibility visible failed", e))
        requestAnimationFrame(syncBounds)
      }
    }
    document.addEventListener("visibilitychange", handleVis)
    const onDprChange = () => syncBounds()
    let dprQuery: MediaQueryList | null = null
    try {
      dprQuery = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
      dprQuery.addEventListener("change", onDprChange)
    } catch { dprQuery = null }

    return () => {
      cancelled = true
      io.disconnect()
      ro.disconnect()
      window.removeEventListener("resize", syncBounds)
      window.removeEventListener("scroll", syncBounds, true)
      document.removeEventListener("visibilitychange", handleVis)
      try { dprQuery?.removeEventListener("change", onDprChange) } catch {}
      if (debounceTimer) clearTimeout(debounceTimer)
      el.removeAttribute("data-browser-mounted")
      // Mantener la vista viva para que cookies/sesión persistan entre tabs.
      // Solo ocultar (MemoryUsageLevel::Low ~3MB), no destruir. close() solo
      // al podar el bid huérfano. Al mostrar otra vista, Rust estaciona esta.
      bVis(false).catch((e) => console.warn("[Browser] visibility false on unmount failed", e))
      nativeReady.current = false
    }
  }, [isActive]) // singleton + isActive guard

  // Navigate native WebView when URL changes (solo si activo y ready)
  useEffect(() => {
    if (!IS_DESKTOP || !nativeReady.current || browserFailed || !isActive) return
    bNav(currentSrc).catch((e) => {
      console.warn("[Browser] navigate failed url=" + currentSrc, e)
      setBrowserFailed(true)
    })
    // La navegación borra los inyectados: reponer forwarder (inmediato + tardío)
    injectWheel()
    const t = window.setTimeout(() => { if (nativeReady.current) injectWheel() }, 1200)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSrc, browserFailed, isActive])

  // Modo dispositivo en nativo: recentrar la columna (el iframe lo hace por
  // CSS; el hijo Win32 necesita bounds nuevos).
  useEffect(() => {
    if (!IS_DESKTOP || !nativeReady.current || browserFailed || !isActive) return
    const el = viewportRef.current
    if (!el) return
    bBounds(fitBounds(el.getBoundingClientRect()))
      .catch((e) => console.warn("[Browser] setBounds device failed", e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceMode])

  // Picture-in-Picture: clic en video (en vivo) o región (ventana flotante).
  // El clic ocurre DENTRO de la página, así hay gesto de usuario (requerido).
  const handlePip = useCallback(() => {
    const code = buildPipScript()
    if (IS_DESKTOP) {
      bEval(code).catch((e) => console.warn("[Browser] PiP inject failed", e))
      return
    }
    try {
      const doc = iframeRef.current?.contentDocument
      if (!doc || !doc.body) throw new Error("iframe sin documento accesible")
      const s = doc.createElement("script")
      s.textContent = code
      doc.body.appendChild(s)
      s.remove()
    } catch (e) {
      console.warn("[Browser] PiP no disponible en este iframe (cross-origin)", e)
    }
  }, [])

  // Detecta iframe que cargó vacío (embebido bloqueado del lado del sitio).
  // cross-origin al leer = navegó a un origen real → se asume cargado.
  const probeEmbedEmpty = useCallback(() => {
    window.setTimeout(() => {
      try {
        const doc = iframeRef.current?.contentDocument
        if (!doc || !(doc as any).body) return
        const txt = (((doc as any).body.innerText as string) || "").trim()
        if (txt.length < 20 && !doc.title) setEmbedEmpty(true)
      } catch {}
    }, 2000)
  }, [])

  // Inyecta el forwarder Ctrl+rueda (idempotente; la navegación lo borra).
  const injectWheel = useCallback(() => {
    if (!IS_DESKTOP) return
    try {
      bEval(buildWheelScript(window.location.origin)).catch(() => {})
    } catch {}
  }, [])

  // ---- puente página→host: atajos del init script + URL real + zoom ----
  type HostActions = {
    reload: () => void; focusUrl: () => void; find: () => void
    newTab: () => void; closeTab: () => void; bookmark: () => void
    zoomBy: (d: number) => void; zoomReset: () => void
    back: () => void; forward: () => void; toggleChrome: () => void
  }
  const actionsRef = useRef<HostActions | null>(null)
  const dispatchShortcut = useCallback((a: PageShortcutAction) => {
    const A = actionsRef.current
    if (!A) return
    switch (a) {
      case "reload": A.reload(); break
      case "focus-url": A.focusUrl(); break
      case "find": A.find(); break
      case "new-tab": A.newTab(); break
      case "close-tab": A.closeTab(); break
      case "bookmark": A.bookmark(); break
      case "zoom-reset": A.zoomReset(); break
      case "zoom-in": A.zoomBy(0.1); break
      case "zoom-out": A.zoomBy(-0.1); break
      case "back": A.back(); break
      case "forward": A.forward(); break
      case "toggle-chrome": A.toggleChrome(); break
    }
  }, [])

  // Consume la cola IPC del init script (antes nadie la drenaba: los atajos
  // dentro de la página morían). Poll corto solo con el panel activo.
  useEffect(() => {
    if (!IS_DESKTOP || !isActive) return
    let stopped = false
    const id = window.setInterval(async () => {
      if (stopped || document.visibilityState === "hidden") return
      try {
        const r = await shell.browser.shortcuts().catch(() => null)
        const list = (r as any)?.shortcuts
        if (!Array.isArray(list) || list.length === 0) return
        for (const raw of list) {
          const a = parseShortcutEvent(raw)
          if (a) { dispatchShortcut(a); continue }
          // Contador del findbar (buildFindCountScript): no es atajo.
          const fc = parseFindCount(raw)
          if (fc !== null) setFindTotal(fc)
        }
      } catch {}
    }, 350)
    return () => { stopped = true; window.clearInterval(id) }
  }, [isActive, dispatchShortcut])

  // Reloj central (Plan 3). Los guards (browserFailed, nativeReady) quedan
  // dentro del fn; el scheduler aporta pausa en hidden + anti-solapamiento.
  useScheduled(`browser-url:${isActive}:${browserFailed}`, 2000, async () => {
    if (!IS_DESKTOP || !isActive) return
    if (browserFailed) return
    if (!nativeReady.current) return
    try {
      const r = await bUrl().catch(() => null)
      const u = (r as any)?.url
      if (typeof u !== "string") return
      const typing = document.activeElement === omniboxRef.current
      const cur = tabsRef.current.find((t) => t.id === activeTabIdRef.current)?.url ?? ""
      if (!shouldAdoptExternalUrl(u, cur, typing)) return
      commitExternalUrl(u)
      if (!typing) setInputUrl(u)
    } catch {}
  }, { enabled: IS_DESKTOP && isActive })

  // Descargas completadas (data/downloads): aviso no bloqueante con la ruta.
  // Reloj central (Plan 3). El hideTimer de 9s sigue siendo timeout propio
  // (one-shot, no polling).
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current) }, [])
  useScheduled(`browser-downloads:${isActive}`, 4000, async () => {
    if (!IS_DESKTOP || !isActive) return
    try {
      const r = await shell.browser.downloads().catch(() => null)
      const items = (r as any)?.downloads
      if (!Array.isArray(items) || items.length === 0) return
      const last = items[items.length - 1]
      if (!last || typeof last.url !== "string") return
      setLastDownload({ url: last.url, path: typeof last.path === "string" ? last.path : null, ok: last.ok !== false })
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      hideTimerRef.current = setTimeout(() => setLastDownload(null), 9000)
    } catch {}
  }, { enabled: IS_DESKTOP && isActive })

  // Perfil portable (qué data/ usa este exe): lazy al abrir configuración.
  useEffect(() => {
    if (!IS_DESKTOP || !showTuneDropdown || profile) return
    shell.profile.get().then(setProfile).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTuneDropdown])

  // Offline real (antes se confundía con fallo del WebView) + reintento al volver.
  // reloadRef se asigna abajo, junto a actionsRef (handleReload se define después).
  const reloadRef = useRef<() => void>(() => {})
  useEffect(() => {
    const off = () => setOffline(true)
    const on = () => { setOffline(false); reloadRef.current() }
    window.addEventListener("offline", off)
    window.addEventListener("online", on)
    return () => { window.removeEventListener("offline", off); window.removeEventListener("online", on) }
  }, [])

  // Preflight del fallback: distingue HTTP upstream (proxy reenvía el status)
  // de "cargando". Solo para URLs que van por proxy (localhost va directo) y
  // orígenes http(s) (en APK el fetch relativo no resuelve).
  useEffect(() => {
    setEmbedEmpty(false)
    const httpOrigin = /^https?:/.test(window.location.protocol)
    if (offline || (!browserFailed && !hasError) || !httpOrigin) { setProbe({ phase: "idle" }); return }
    const src = getFrameSrc(currentSrc, false)
    if (!src.startsWith("/shell/proxy")) { setProbe({ phase: "ok" }); return }
    let cancelled = false
    setProbe({ phase: "checking" })
    ;(async () => {
      try {
        const res = await fetch(src)
        if (cancelled) return
        try { await res.body?.cancel() } catch {}
        setProbe(res.ok ? { phase: "ok" } : { phase: "fail", status: res.status })
      } catch {
        if (!cancelled) setProbe({ phase: "fail", status: 0 })
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browserFailed, hasError, currentSrc, offline])
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
          await bEval(buildOverlayScript(apiBase, toolRef.current))
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
          } else if (p?.type === "zoom-level") {
            // Ctrl+rueda aplicado en la página: sincronizar label/estado sin
            // re-evaluar (la página ya aplicó el zoom al instante).
            const v = parseZoomLevel(p)
            if (v !== null) {
              setZoomLevel(v)
              try { localStorage.setItem(BROWSER_ZOOM_KEY, String(v)) } catch {}
            }
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
    bEval(setToolScript(inspectTool)).catch(() => {})
  }, [inspectMode, inspectTool])

  const handleStyleChange = useCallback((a: VisualAnnotation, prop: string, value: string) => {
    const next: Record<string, string> = { ...(a.styleDraft ?? {}) }
    if (value === "") delete next[prop]
    else next[prop] = value
    onAnnotationStyle?.(a.id, next)
    if (IS_DESKTOP) {
      const props: Record<string, string | null> = { [prop]: value === "" ? null : value }
      bEval(applyStyleScript(a.id, props)).catch(() => {})
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
        await bEval(clearBadgesScript)
        for (let i = 0; i < annRef.current.length; i++) {
          if (cancelled) return
          const a = annRef.current[i]
          await bEval(badgeScript(a.id, ZONE_ICONS[i] ?? String(i + 1), a.bx ?? a.boundingRect.x, a.by ?? a.boundingRect.y))
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [annotations])

  useEffect(() => {
    if (!IS_DESKTOP || !nativeReady.current) return
    if (!inspectMode) {
      bEval(cleanupOverlayScript).catch(() => {})
    }
  }, [inspectMode])

  // Al desmontar el panel: limpiar overlay + badges del sub-WebView
  useEffect(() => {
    if (!IS_DESKTOP) return
    return () => {
      bEval(cleanupOverlayScript).catch(() => {})
      bEval(clearBadgesScript).catch(() => {})
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
        bEval(removeBadgeScript(gone)).catch(() => {})
        bEval(unbindScript(gone)).catch(() => {})
      }
    }
    prevAnnIds.current = ids
  }, [annotations])

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

  const handleReload = () => {
    setLoading(true)
    setHasError(false)
    if (IS_DESKTOP && !browserFailed) {
      bNav(currentSrc, "reload").catch(() => {
        setBrowserFailed(true)
      })
    } else if (IS_DESKTOP && browserFailed) {
      // Reintentar crear el sub-WebView antes de fallback
      const el = viewportRef.current
      if (el) {
        bOpen(currentSrc, fitBounds(el.getBoundingClientRect())).then(() => {
          nativeReady.current = true
          setBrowserFailed(false)
        }).catch(() => {
          bumpReload()
        })
      } else {
        bumpReload()
      }
    } else {
      bumpReload()
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
  // Zoom único: si la página tiene el forwarder (Ctrl+rueda), se usa su setter
  // (aplica + reporta nivel); si no, CSS directo (también válido por allowlist).
  const zoomCodeFor = (v: number) =>
    `(function(){var v=${JSON.stringify(v)};if(window.__oc_setZoom){window.__oc_setZoom(v)}else{try{document.documentElement.style.zoom=String(v);if(document.body)document.body.style.zoom=String(v)}catch(e){}}})()`
  const readZoomMap = (): Record<string, number> => {
    try {
      const o = JSON.parse(localStorage.getItem(BROWSER_ZOOM_MAP_KEY) || "null")
      return o && typeof o === "object" ? (o as Record<string, number>) : {}
    } catch { return {} }
  }
  const applyZoom = (next: number) => {
    const v = Math.max(0.5, Math.min(2.5, Math.round(next * 10) / 10))
    setZoomLevel(v)
    // Recordado por dominio (Chrome-like); el global queda como default.
    try {
      const d = domainOf(currentSrc)
      if (d) localStorage.setItem(BROWSER_ZOOM_MAP_KEY, JSON.stringify(withZoomForDomain(readZoomMap(), currentSrc, v)))
    } catch {}
    if (IS_DESKTOP) bEval(zoomCodeFor(v)).catch(() => {})
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

  // Al cambiar de sitio, adoptar su zoom recordado (sin tocar el default).
  const lastZoomDomain = useRef("")
  useEffect(() => {
    const d = domainOf(currentSrc)
    if (!d || d === lastZoomDomain.current) return
    lastZoomDomain.current = d
    const map = readZoomMap()
    if (map[d] === undefined) return
    const v = zoomForDomain(map, currentSrc, zoomRef.current)
    if (v === zoomRef.current) return
    setZoomLevel(v)
    if (!IS_DESKTOP) return
    const t = window.setTimeout(() => { bEval(zoomCodeFor(v)).catch(() => {}) }, 900)
    return () => window.clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSrc])

  // Atajos del navegador: se registran en capture para ganar al listener
  // global de OpenHer y solo viven mientras este BrowserPanel está montado.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const modifier = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()
      if (e.key === "F5" || (modifier && key === "r")) {
        e.preventDefault(); e.stopPropagation(); handleReload(); return
      }
      if (modifier && key === "l") {
        e.preventDefault(); e.stopPropagation(); omniboxRef.current?.focus(); omniboxRef.current?.select(); return
      }
      if (modifier && key === "f") {
        e.preventDefault(); e.stopPropagation(); openFind(); return
      }
      if (modifier && key === "t") {
        if (hideTabBar) return
        e.preventDefault(); e.stopPropagation(); handleAddTab(); return
      }
      if (modifier && key === "w") {
        if (hideTabBar) return
        e.preventDefault(); e.stopPropagation()
        if (activeTab) handleCloseTab(e as unknown as React.MouseEvent, activeTab.id)
        return
      }
      if (modifier && key === "d") {
        e.preventDefault(); e.stopPropagation(); toggleBookmark(); return
      }
      if (modifier && key === "0") {
        e.preventDefault(); e.stopPropagation(); applyZoom(1); return
      }
      if (modifier && (key === "+" || key === "=")) {
        e.preventDefault(); e.stopPropagation(); applyZoom(zoomLevel + 0.1); return
      }
      if (modifier && (key === "-" || key === "_")) {
        e.preventDefault(); e.stopPropagation(); applyZoom(zoomLevel - 0.1); return
      }
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault(); e.stopPropagation(); handleBack(); return
      }
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault(); e.stopPropagation(); handleForward(); return
      }
    }
    window.addEventListener("keydown", onKeyDown, true)
    return () => window.removeEventListener("keydown", onKeyDown, true)
  }, [activeTab, zoomLevel, handleBack, handleForward])

  const targetWidth = DEVICE_WIDTHS[deviceMode]
  deviceWidthRef.current = targetWidth ? parseInt(targetWidth, 10) || null : null
  // Acciones vivas para el puente página→host (el poll usa el ref, no deps)
  reloadRef.current = handleReload
  actionsRef.current = {
    reload: handleReload,
    focusUrl: () => { omniboxRef.current?.focus(); omniboxRef.current?.select() },
    find: openFind,
    newTab: () => { if (!hideTabBar) handleAddTab() },
    closeTab: () => { if (!hideTabBar && activeTab) closeTabById(activeTab.id) },
    bookmark: toggleBookmark,
    zoomBy: (d) => applyZoom(zoomRef.current + d),
    zoomReset: () => applyZoom(1),
    back: handleBack,
    forward: handleForward,
    toggleChrome: () => setMinimal((v) => !v),
  }

  return (
    <div
      className={`browser-shell${minimal ? " browser-minimal" : ""}${isFullscreen ? " browser-fullscreen" : ""}`}
      onFocusCapture={() => { document.body.dataset.opencodeBrowserFocused = "true" }}
      onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-opencode-tab-index")) return; if (extractUrlFromDataTransfer(e.dataTransfer)) { e.preventDefault(); e.dataTransfer.dropEffect = "copy" } }}
      onDrop={(e) => { if (e.dataTransfer.types.includes("application/x-opencode-tab-index")) return; const url = extractUrlFromDataTransfer(e.dataTransfer); if (!url) return; e.preventDefault(); e.stopPropagation(); navigateTab(url) }}
      style={minimal ? { height: "100%" } : undefined}
    >
      {/* Minimal toggle floating */}
      {minimal && (
        <button type="button" onClick={() => setMinimal(false)} title="Mostrar barra (F11)" aria-label="Mostrar barra" style={{ position: "absolute", top: 6, right: 8, zIndex: 5, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "4px 8px", fontSize: 11, color: "var(--muted)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}><MaximizeIcon size={12} /> Mostrar</button>
      )}
      {/* 1. Chrome-like Tab Bar on Top (pestañas nativas del navegador) */}
      {!minimal && !hideTabBar && (
      <div className="browser-tabbar" onDragOver={handleTabBarDragOver} onDrop={handleTabBarDrop}>
        {tabs.map((tab) => {
          const isActiveTab = tab.id === activeTabId
          return (
            <div
              key={tab.id}
              className={`browser-tab${isActiveTab ? " active" : ""}`}
              onClick={() => setActiveTabId(tab.id)}
              title={tab.url}
              draggable
              onDragStart={(e) => {
                setUrlDragData(e.dataTransfer, tab.url)
                // compat interno
                try { e.dataTransfer.setData("application/x-opencode-path", tab.url) } catch {}
                e.dataTransfer.effectAllowed = "copyMove"
              }}
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
                <CloseIcon size={10} />
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
      )}

      {/* 2+3. Navigation Toolbar + Address Bar */}
      {!minimal && (
        <BrowserToolbar
          activeTab={activeTab}
          nav={{
            back: handleBack,
            forward: handleForward,
            reload: handleReload,
            home: handleHome,
            openProject: handleOpenProjectFolder,
          }}
          omnibox={{
            value: inputUrl,
            setValue: setInputUrl,
            onKeyDown: handleKeyDown,
            homeUrl,
            isSecure,
            inputRef: omniboxRef,
          }}
          history={{
            containerRef: histRef,
            show: showHistory,
            setShow: setShowHistory,
            bookmarks,
            suggestions,
            suggestIdx,
            navigate: navigateTab,
            clearSuggestions: () => { setSuggestions([]); setSuggestIdx(-1) },
          }}
          tune={{
            open: showTuneDropdown,
            toggle: () => setShowTuneDropdown((v) => !v),
            close: () => setShowTuneDropdown(false),
            dropdownRef,
            deviceMode,
            setDeviceMode: (m) => { setDeviceMode(m); setShowTuneDropdown(false) },
            profile,
          }}
          zoom={{ level: zoomLevel, apply: applyZoom }}
          find={{ open: findOpen, toggle: () => setFindOpen((v) => !v) }}
          inspect={{
            mode: inspectMode,
            tool: inspectTool,
            onToggle: onToggleInspect,
            onToggleTool: onToggleInspectTool,
            visualSelection,
            onClearVisual,
          }}
          loading={loading}
          isBookmarked={isBookmarked}
          toggleBookmark={toggleBookmark}
          copyUrl={handleCopyUrl}
          pip={handlePip}
          minimal={minimal}
          toggleMinimal={() => setMinimal((v) => !v)}
          openExternal={handleOpenExternal}
          onClose={onClose}
        />
      )}
      {findOpen && (
        <div className="browser-findbar">
          <SearchIcon size={13} />
          <input
            ref={findInputRef}
            autoFocus
            value={findQuery}
            onChange={(e) => { setFindQuery(e.target.value); setFindTotal(null) }}
            onKeyDown={(e) => {
              if (e.key === "Enter") applyFind(findQuery, findCase)
              if (e.key === "Escape") setFindOpen(false)
            }}
            placeholder="Buscar en la página…"
          />
          <label style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)" }}>
            <LedSwitch label="Aa" checked={findCase} onChange={setFindCase} /> Aa
          </label>
          {findTotal !== null && (
            <span style={{ fontSize: 11, color: "var(--muted)", minWidth: 64 }} title="Coincidencias en la página">
              {findTotal === 0 ? "Sin resultados" : `${findTotal} resultado${findTotal === 1 ? "" : "s"}`}
            </span>
          )}
          <button type="button" className="btn-secondary compact" onClick={() => applyFind(findQuery, findCase)}>Buscar</button>
          <button type="button" className="browser-nav-btn" onClick={() => setFindOpen(false)} aria-label="Cerrar">×</button>
        </div>
      )}
      {!minimal && showBookmarks && bookmarks.length > 0 && (
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
            onClick={() => setBookmarksVisible(!showBookmarks)}
            title="Ocultar barra de favoritos"
            aria-label="Ocultar favoritos"
          >
            ×
          </button>
        </div>
      )}

      {/* Quick Project Bar */}
      {!minimal && projectBanner && (
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
                const isActiveFile = activeTab?.url.endsWith(file)
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
                      background: isActiveFile ? "var(--primary)" : "var(--surface-strong)",
                      color: isActiveFile ? "#fff" : "var(--text)",
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
          {/* Aviso de descarga completada (data/downloads) */}
          {lastDownload && (
            <div style={{ position: "absolute", right: 10, bottom: 10, zIndex: 6, maxWidth: 340, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "var(--text)", display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ color: lastDownload.ok ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>{lastDownload.ok ? "Descargado" : "Falló"}</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }} title={lastDownload.path ?? lastDownload.url}>
                {(lastDownload.path ?? lastDownload.url).split(/[\\/]/).pop()}
              </span>
              <button type="button" onClick={() => setLastDownload(null)} aria-label="Cerrar aviso" style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}>×</button>
            </div>
          )}
          {offline ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text)", maxWidth: "460px", margin: "auto" }}>
              <div style={{ marginBottom: "12px", color: "var(--warning)", display: "inline-flex" }}><CloseIcon size={32} /></div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}>Sin conexión</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "20px" }}>
                El equipo no tiene internet. Revisá la conexión: la página se recarga sola al volver.
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <button type="button" className="btn-primary compact" onClick={handleReload}>
                  Reintentar
                </button>
              </div>
            </div>
          ) : hasError ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text)", maxWidth: "460px", margin: "auto" }}>
              <div style={{ marginBottom: "12px", color: "var(--danger)", display: "inline-flex" }}><CloseIcon size={32} /></div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}>No se pudo conectar con la página</h3>
              <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "20px" }}>
                Si es un servidor local, verifica que el dev server esté ejecutándose (botón <strong>▶ Run Web</strong> en el chat). Si es un sitio web externo protegido, ábrelo en el navegador externo.
                {probe.phase === "fail" && (
                  <> Detalle: el sitio devolvió <strong>HTTP {probe.status || "?"}</strong>{probe.status === 502 ? " (no respondió a tiempo)" : ""}.</>
                )}
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
              probe.phase === "checking" ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--muted)", maxWidth: "460px", margin: "auto", fontSize: "0.85rem" }}>
                  <div style={{ marginBottom: "12px", display: "inline-flex" }}><LoadingIcon size={28} className="browser-loading-spinner" /></div>
                  <p>Verificando la página…</p>
                </div>
              ) : probe.phase === "fail" ? (
                <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text)", maxWidth: "460px", margin: "auto" }}>
                  <div style={{ marginBottom: "12px", color: "var(--danger)", display: "inline-flex" }}><CloseIcon size={32} /></div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "1.1rem" }}>El sitio no se dejó cargar</h3>
                  <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginBottom: "20px" }}>
                    Devolvió <strong>HTTP {probe.status || "?"}</strong>{probe.status === 502 ? " (no respondió a tiempo)" : ""}. Probá en el navegador externo.
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
              ) : (
              /* Fallback: sub-WebView falló → iframe vía proxy (mismo que mobile) */
              <>
                {embedEmpty && (
                  <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", zIndex: 6, display: "flex", alignItems: "center", gap: 8, background: "var(--surface-raised, var(--surface))", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 8px 6px 12px", fontSize: 12, color: "var(--text)", boxShadow: "0 4px 16px rgba(0,0,0,.25)", maxWidth: "92%" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>La página cargó vacía: puede bloquear el embebido.</span>
                    <button type="button" className="btn-secondary compact" onClick={handleOpenExternal}>Abrir externa</button>
                    <button type="button" className="browser-nav-btn" onClick={() => setEmbedEmpty(false)} aria-label="Descartar">×</button>
                  </div>
                )}
                <iframe
                  key={`${reloadKey}-${inspectMode ? "inspect" : "view"}-fallback`}
                  ref={iframeRef}
                  src={getFrameSrc(currentSrc, !!inspectMode)}
                  title="Vista previa web (fallback)"
                  allow="accelerometer; autoplay; clipboard-read; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; microphone; camera"
                  onLoad={() => { setLoading(false); probeEmbedEmpty() }}
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
              </>
              )
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
                    bEval(clearBadgesScript).catch(() => {})
                    annotations.forEach((a) => bEval(unbindScript(a.id)).catch(() => {}))
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
                                if (IS_DESKTOP) bEval(applyStyleScript(a.id, {})).catch(() => {})
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
