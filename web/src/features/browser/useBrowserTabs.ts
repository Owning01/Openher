import { useCallback, useEffect, useRef, useState } from "react"
import { BROWSER_ACTIVE_KEY, BROWSER_HOME, BROWSER_TABS_KEY } from "./constants"
import { BROWSER_STACK_PREFIX, loadBrowserStack, saveBrowserStack } from "../../components/browserSync"
import { extractUrlFromDataTransfer } from "../../utils/urlDrag"
import { formatDisplayTitle, normalizeUrl } from "./url"
import { pushHistory } from "./storage"
import type { BrowserTabItem } from "./types"

type NavAction = "back" | "forward"

type Args = {
  initialUrl: string
  hideTabBar: boolean
  persistKey?: string
  isDesktop: boolean
  nav: (url: string, action?: NavAction) => void
  onClose?: () => void
  // Resetea el chrome del host (loading/error/history/suggest) antes de navegar.
  onNavigateStart?: () => void
}

// Estado y mutadores de las pestañas del navegador: init desde localStorage,
// persistencia (tabbar interno o pila por bid desktop) y navegación atrás/adelante.
export function useBrowserTabs({
  initialUrl,
  hideTabBar,
  persistKey,
  isDesktop,
  nav,
  onClose,
  onNavigateStart,
}: Args) {
  const [tabs, setTabs] = useState<BrowserTabItem[]>(() => {
    const single = (url: string, history?: string[], historyIdx?: number): BrowserTabItem[] => [
      {
        id: "tab-1",
        url,
        title: formatDisplayTitle(url),
        history: history ?? [url],
        historyIdx: historyIdx ?? 0,
      },
    ]
    if (hideTabBar) {
      // Restaurar pila atrás/adelante si coincide con la URL del layout
      // (padre = fuente autoritativa; la pila solo suma historial).
      if (persistKey) {
        try {
          const snap = loadBrowserStack(localStorage, BROWSER_STACK_PREFIX + persistKey)
          if (snap && snap.url === initialUrl && snap.history.includes(initialUrl)) {
            return single(snap.url, snap.history, snap.historyIdx)
          }
        } catch {}
      }
      return single(initialUrl)
    }
    try {
      const raw = localStorage.getItem(BROWSER_TABS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as BrowserTabItem[]
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((t: any) => t && typeof t.url === "string" && typeof t.id === "string")) {
          return parsed
        }
      }
    } catch {}
    return single(initialUrl)
  })
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    if (hideTabBar) return "tab-1"
    try {
      const v = localStorage.getItem(BROWSER_ACTIVE_KEY)
      if (v) return v
    } catch {}
    return "tab-1"
  })
  const [inputUrl, setInputUrl] = useState(() => {
    if (hideTabBar) return initialUrl
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
  const [homeUrl] = useState<string>(() => {
    try { return localStorage.getItem("opencode.browser.home") || BROWSER_HOME } catch { return BROWSER_HOME }
  })

  // Refs vivas para los polls con [] (puente página→host, sync URL)
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs
  const activeTabIdRef = useRef(activeTabId)
  activeTabIdRef.current = activeTabId
  const prevInitialUrlRef = useRef(initialUrl)

  // Persistir tabs/sesión como Chrome (solo con tabbar interno visible)
  useEffect(() => {
    if (hideTabBar) return
    try { localStorage.setItem(BROWSER_TABS_KEY, JSON.stringify(tabs.slice(0, 20))) } catch {}
  }, [tabs, hideTabBar])
  // hideTabBar (desktop): la URL actual la guarda el padre (browserTabUrls);
  // aquí solo la pila atrás/adelante bajo la clave del bid.
  useEffect(() => {
    if (!hideTabBar || !persistKey) return
    try {
      const t = tabs[0]
      if (!t) return
      saveBrowserStack(localStorage, BROWSER_STACK_PREFIX + persistKey, {
        url: t.url,
        history: t.history,
        historyIdx: t.historyIdx,
      })
    } catch {}
  }, [tabs, hideTabBar, persistKey])
  useEffect(() => {
    if (hideTabBar) return
    try { localStorage.setItem(BROWSER_ACTIVE_KEY, activeTabId) } catch {}
  }, [activeTabId, hideTabBar])

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0]
  const currentSrc = activeTab?.url || "about:blank"

  // hideTabBar: navegador es un único viewport controlado por el TabBar externo.
  // Sincronizar solo cuando cambia initialUrl por switch de pestaña externa, no tras navegación interna (navigateTab).
  useEffect(() => {
    if (!hideTabBar) return
    if (!initialUrl) return
    if (prevInitialUrlRef.current === initialUrl) return
    prevInitialUrlRef.current = initialUrl
    setTabs([{ id: "tab-1", url: initialUrl, title: formatDisplayTitle(initialUrl), history: [initialUrl], historyIdx: 0 }])
    setActiveTabId("tab-1")
    setInputUrl(initialUrl)
  }, [initialUrl, hideTabBar])

  const bumpReload = useCallback(() => setReloadKey((k) => k + 1), [])

  const navigateTab = useCallback((newUrl: string) => {
    const norm = normalizeUrl(newUrl, homeUrl)
    setInputUrl(norm)
    onNavigateStart?.()
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
    if (isDesktop) {
      nav(norm)
    } else {
      bumpReload()
    }
  }, [activeTabId, homeUrl, isDesktop, nav, onNavigateStart, bumpReload])

  // Adopta navegaciones internas (links, redirects, SPA) al tab + omnibox.
  const commitExternalUrl = useCallback((u: string) => {
    pushHistory(u)
    const id = activeTabIdRef.current
    setTabs((prev) => prev.map((t) => {
      if (t.id !== id) return t
      const nextHist = t.history.slice(-49)
      if (nextHist[nextHist.length - 1] !== u) nextHist.push(u)
      return { ...t, url: u, title: formatDisplayTitle(u), history: nextHist, historyIdx: nextHist.length - 1 }
    }))
  }, [])

  const handleAddTab = useCallback((eOrUrl?: string | React.MouseEvent) => {
    const url = typeof eOrUrl === 'string' ? eOrUrl : undefined
    const newId = `tab-${Date.now().toString(36)}`
    const defaultUrl = url || homeUrl
    const newTab: BrowserTabItem = {
      id: newId,
      url: defaultUrl,
      title: formatDisplayTitle(defaultUrl),
      history: [defaultUrl],
      historyIdx: 0,
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(newId)
  }, [homeUrl])

  // Drop de URLs sobre la tabbar (Chrome -> app): vive aquí y no inline en
  // el JSX — el handler de una sola línea rompía el parseo TSX (TS2657 en
  // cascada). Lógica idéntica a la versión inline original.
  const handleTabBarDragOver = useCallback((e: React.DragEvent) => {
    const url = extractUrlFromDataTransfer(e.dataTransfer)
    if (url || e.dataTransfer.types.includes("application/x-opencode-browser-tab") || e.dataTransfer.types.includes("text/uri-list")) {
      e.preventDefault()
      e.dataTransfer.dropEffect = "copy"
    }
  }, [])

  const handleTabBarDrop = useCallback((e: React.DragEvent) => {
    const url = extractUrlFromDataTransfer(e.dataTransfer)
    if (!url) return
    e.preventDefault()
    e.stopPropagation()
    const bar = e.currentTarget as HTMLElement
    const tabsEls = Array.from(bar.querySelectorAll(".browser-tab"))
    let at = tabsEls.length
    for (let k = 0; k < tabsEls.length; k++) {
      const r = (tabsEls[k] as HTMLElement).getBoundingClientRect()
      if (e.clientX < r.left + r.width / 2) { at = k; break }
    }
    const newId = `tab-${Date.now().toString(36)}`
    const title = formatDisplayTitle(url)
    const nt = { id: newId, url, title, history: [url], historyIdx: 0 }
    setTabs((prev) => {
      const n = [...prev]
      n.splice(Math.min(at, n.length), 0, nt as any)
      return n
    })
    setActiveTabId(newId)
    setInputUrl(url)
    pushHistory(url)
  }, [])

  const closeTabById = useCallback((id: string) => {
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
  }, [tabs, activeTabId, onClose])

  const handleCloseTab = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    closeTabById(id)
  }, [closeTabById])

  const handleBack = () => {
    if (!activeTab || activeTab.historyIdx <= 0) return
    const prevIdx = activeTab.historyIdx - 1
    const prevUrl = activeTab.history[prevIdx]
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, url: prevUrl, historyIdx: prevIdx, title: formatDisplayTitle(prevUrl) } : t))
    )
    setInputUrl(prevUrl)
    if (isDesktop) {
      nav(prevUrl, "back")
    } else {
      bumpReload()
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
    if (isDesktop) {
      nav(nextUrl, "forward")
    } else {
      bumpReload()
    }
  }

  return {
    tabs,
    setTabs,
    activeTabId,
    setActiveTabId,
    inputUrl,
    setInputUrl,
    reloadKey,
    bumpReload,
    homeUrl,
    tabsRef,
    activeTabIdRef,
    activeTab,
    currentSrc,
    navigateTab,
    commitExternalUrl,
    handleAddTab,
    handleTabBarDragOver,
    handleTabBarDrop,
    closeTabById,
    handleCloseTab,
    handleBack,
    handleForward,
  }
}
