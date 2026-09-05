import React, { memo, useCallback, useEffect, useState, useRef } from "react"
import { useIsDesktop } from "../../hooks/useIsDesktop"
import { extractUrlFromDataTransfer, setUrlDragData } from "../../utils/urlDrag"
import { TabBar } from "../../components/TabBar"
import { WeatherChip } from "../../components/WeatherChip"
import {
  ChatIcon,
  TerminalIcon,
  GlobeIcon,
  FileIcon,
  CodeIcon,
  PlusIcon,
  CloseIcon,
} from "../../Icons"

export type TitleBarProps = {
  tabStacks?: string[][]
  activePanel?: number
  activeSessionId?: string | null
  sessions?: Array<{ id: string; title?: string; directory?: string }>
  busySessions?: Set<string>
  browserTabUrls?: Record<string, string>
  /** true si el grid está en split (cols*rows>1): los tabs de cada panel se
      pintan DENTRO del propio div.titlebar (un grupo por panel con divisor),
      nunca en sub-barras bajo la barra superior. */
  isSplit?: boolean
  cols?: number
  colSizes?: Array<number | null>
  /** Sesión visible por panel (desktopLayout.sessions) para el tab activo. */
  activeSessionIds?: Array<string | null>
  /** Si hay panel maximizado, el titlebar solo muestra sus tabs. */
  maximizedPanel?: number | null
  setActivePanel?: (idx: number) => void
  onCloseOthers?: (panelIdx: number, keep: number) => void
  onCloseRight?: (panelIdx: number, idx: number) => void
  onCloseLeft?: (panelIdx: number, idx: number) => void
  onCloseAll?: (panelIdx: number) => void
  onDockSession?: (index: number, dir: "left" | "right" | "top" | "bottom" | "center", specificId?: string) => void
  onMoveTab?: (panelIdx: number, from: number, to: number) => void
  onTransferTab?: (fromPanel: number, fromIdx: number, toPanel: number, toIdx: number) => void
  onSwitchTab?: (panelIdx: number, tabIdx: number) => void
  onRemoveTab?: (panelIdx: number, tabIdx: number) => void
  onAddTerminal?: (panelIdx: number) => void
  onOpenBrowser?: (url: string, panelIdx?: number) => void
}

function getTabInfo(
  sid: string,
  sessions?: Array<{ id: string; title?: string; directory?: string }>,
  browserTabUrls?: Record<string, string>
) {
  if (sid.startsWith("terminal")) {
    const ptyId = sid.replace(/^terminal[:\-]/, "")
    return {
      icon: <TerminalIcon size={13} />,
      title: `Terminal ${ptyId.slice(0, 4)}`,
    }
  }
  if (sid.startsWith("browser:")) {
    const url = browserTabUrls?.[sid] || "https://www.google.com"
    const uLower = url.toLowerCase()
    let icon = <GlobeIcon size={13} />
    if (uLower.includes("youtube.com") || uLower.includes("youtu.be")) {
      icon = (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--danger, #fb7185)">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    } else if (uLower.includes("github.com")) {
      icon = (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      )
    }
    try {
      const u = new URL(url)
      const host = u.hostname.replace(/^www\./, "")
      const path = u.pathname !== "/" ? u.pathname : ""
      const title = host ? `${host}${path.slice(0, 18)}` : "Navegador"
      return { icon, title }
    } catch {
      return { icon, title: url.replace(/^https?:\/\//, "").slice(0, 20) || "Navegador" }
    }
  }
  if (sid === "__kanban__") return { icon: <CodeIcon size={13} />, title: "Kanban" }
  if (sid === "__stats__") return { icon: <CodeIcon size={13} />, title: "Estadísticas" }
  if (sid === "__learning__" || sid === "__reports__") return { icon: <FileIcon size={13} />, title: "Aprendizaje" }
  if (sid === "__pcFiles__") return { icon: <FileIcon size={13} />, title: "Archivos PC" }
  if (sid === "__design__" || sid.startsWith("plugin:opendesign")) return { icon: <CodeIcon size={13} />, title: "Open Design" }
  if (sid === "__screenshots__" || sid.startsWith("plugin:screenshots")) return { icon: <FileIcon size={13} />, title: "Screenshots" }
  if (sid.startsWith("plugin:")) return { icon: <CodeIcon size={13} />, title: sid.replace("plugin:", "") }

  const found = sessions?.find((s) => s.id === sid)
  return {
    icon: <ChatIcon size={13} />,
    title: found?.title || sid.slice(0, 16) || "Sesión",
  }
}

/** Sesiones enriquecidas por panel para el TabBar embebido: los tabs de
    navegador/terminal no están en `sessions` y necesitan título (igual que
    hacen los paneles del grid). Los virtuales/plugin los etiqueta TabBar. */
function buildPanelSessions(
  stack: string[],
  sessions?: Array<{ id: string; title?: string; directory?: string }>,
  browserTabUrls?: Record<string, string>,
): Array<{ id: string; title?: string; directory: string }> {
  const list: Array<{ id: string; title?: string; directory: string }> = (sessions ?? []).map((s) => ({
    id: s.id, title: s.title, directory: s.directory ?? "",
  }))
  for (const bid of stack) {
    if (bid.startsWith("browser:") && !list.find((s) => s.id === bid)) {
      const u = browserTabUrls?.[bid] || ""
      try {
        list.push({ id: bid, title: new URL(u).hostname || "Navegador", directory: "" })
      } catch {
        list.push({ id: bid, title: u.slice(0, 20) || "Navegador", directory: "" })
      }
    }
    if (bid.startsWith("terminal") && !list.find((s) => s.id === bid)) {
      list.push({ id: bid, title: `Terminal ${bid.slice(9, 13)}`, directory: "" })
    }
  }
  return list
}

export const TitleBar = memo(function TitleBar({
  tabStacks,
  activePanel = 0,
  activeSessionId,
  sessions,
  busySessions,
  browserTabUrls,
  isSplit = false,
  cols = 1,
  colSizes,
  activeSessionIds,
  maximizedPanel = null,
  setActivePanel,
  onSwitchTab,
  onRemoveTab,
  onMoveTab,
  onTransferTab,
  onAddTerminal,
  onOpenBrowser,
  onCloseOthers,
  onCloseRight,
  onCloseLeft,
  onCloseAll,
  onDockSession,
}: TitleBarProps) {
  const isDesktop = useIsDesktop()
  const [isMax, setIsMax] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const tabsRef = useRef<HTMLDivElement | null>(null)

  const ctrlRef = useRef<AbortController | null>(null)
  const post = useCallback((path: string) => {
    fetch(path, { method: "POST" }).catch((e) => console.warn(`[TitleBar] POST ${path} failed`, e))
  }, [])

  const refresh = useCallback(async () => {
    ctrlRef.current?.abort()
    const c = new AbortController()
    ctrlRef.current = c
    try {
      const r = await fetch("/shell/window/state", { cache: "no-store", signal: c.signal })
      if (c.signal.aborted) return
      const j = await r.json()
      setIsMax(!!j.maximized)
    } catch (e: any) {
      if (e?.name === "AbortError") return
      console.warn("[TitleBar] refresh state failed", e)
    }
  }, [])

  useEffect(() => {
    if (!isDesktop) return
    document.documentElement.setAttribute("data-frameless", "true")
    document.documentElement.setAttribute("data-window-maximized", isMax ? "true" : "false")
    refresh()
    const id = window.setInterval(refresh, 1200)
    const onResize = () => refresh()
    window.addEventListener("resize", onResize)
    return () => {
      window.clearInterval(id)
      window.removeEventListener("resize", onResize)
      ctrlRef.current?.abort()
    }
  }, [refresh, isDesktop, isMax])

  useEffect(() => {
    if (!isDesktop) return
    document.documentElement.setAttribute("data-window-maximized", isMax ? "true" : "false")
  }, [isMax, isDesktop])

  const handleDrag = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      // Doble-click no debe iniciar drag (rompe el maximize por doble-click)
      if ((e as unknown as { detail?: number }).detail !== undefined && (e as unknown as { detail: number }).detail > 1) return
      if (
        (e.target as HTMLElement).closest(".win-btn") ||
        (e.target as HTMLElement).closest(".titlebar-tab") ||
        (e.target as HTMLElement).closest(".titlebar-add-btn") ||
        (e.target as HTMLElement).closest(".tab-bar")
      ) {
        return
      }
      post("/shell/window/drag")
    },
    [post]
  )

  const handleMax = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
      }
      const prev = isMax
      post("/shell/window/maximize")
      setIsMax((v) => !v)
      setTimeout(() => {
        refresh().catch(() => setIsMax(prev))
      }, 250)
    },
    [post, refresh, isMax]
  )

  if (!isDesktop) {
    return null
  }

  const currentStack = tabStacks?.[activePanel] || tabStacks?.[0] || []
  const activeTab = activeSessionId ?? currentStack[0]
  // Fuente única de verdad: los tabs viven en el propio div.titlebar.
  // Panel único → tira clásica; split → un grupo por panel con divisor,
  // con anchos proporcionales a las columnas del grid.
  const isSinglePanel = !isSplit && (tabStacks?.length ?? 1) <= 1
  const splitPanels = !isSinglePanel
    ? (maximizedPanel !== null && maximizedPanel !== undefined
        ? [maximizedPanel]
        : (tabStacks ?? []).map((_, i) => i))
    : []
  const flexFor = useCallback((panelIdx: number): number => {
    if (cols > 1) return colSizes?.[panelIdx % cols] ?? 1
    return 1
  }, [cols, colSizes])
  const handleAddFor = useCallback((panelIdx: number) => {
    const sid = activeSessionIds?.[panelIdx] ?? tabStacks?.[panelIdx]?.[0]
    const isBrowser = !!sid?.startsWith("browser:")
    if (isBrowser && onOpenBrowser) onOpenBrowser("https://www.google.com", panelIdx)
    else onAddTerminal?.(panelIdx)
  }, [activeSessionIds, tabStacks, onOpenBrowser, onAddTerminal])

  // Mismo protocolo DnD que TabBar: los tabs del header superior también se
  // arrastran (reorden interno + drop en paneles del grid para split).
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const id = currentStack[index]
    e.dataTransfer.setData("application/x-opencode-tab-index", String(index))
    e.dataTransfer.setData("application/x-opencode-tab-src", `${activePanel}|${index}`)
    let url: string | null = null
    if (id?.startsWith("browser:")) {
      url = browserTabUrls?.[id] ?? null
      if (!url && id.slice(8).includes("://")) url = id.slice(8)
    } else if (id && /^https?:\/\//.test(id)) {
      url = id
    }
    if (id) {
      const payload = `panel:${activePanel}:${id}`
      e.dataTransfer.setData("application/x-opencode-path", payload)
      if (url) {
        setUrlDragData(e.dataTransfer, url)
        e.dataTransfer.effectAllowed = "copyMove"
      } else {
        e.dataTransfer.setData("text/plain", payload)
        e.dataTransfer.effectAllowed = "move"
      }
    } else {
      e.dataTransfer.setData("text/plain", `tab:${index}`)
      e.dataTransfer.effectAllowed = "move"
    }
    setDragIdx(index)
  }, [currentStack, activePanel, browserTabUrls])

  // Índice de inserción según la posición X del cursor sobre la barra
  const getIndexFromX = useCallback((clientX: number): number => {
    const bar = tabsRef.current
    if (!bar) return currentStack.length
    const els = Array.from(bar.querySelectorAll<HTMLDivElement>('[role="tab"]'))
    for (let k = 0; k < els.length; k++) {
      const r = els[k]!.getBoundingClientRect()
      if (clientX < r.left + r.width / 2) return k
    }
    return els.length
  }, [currentStack.length])

  const readDragOrigin = useCallback((e: React.DragEvent): { panel: number; index: number } | null => {
    const idx = parseInt(e.dataTransfer.getData("application/x-opencode-tab-index"), 10)
    if (isNaN(idx)) return null
    const srcPanel = parseInt((e.dataTransfer.getData("application/x-opencode-tab-src") || "").split("|")[0] ?? "", 10)
    return { panel: isNaN(srcPanel) ? activePanel : srcPanel, index: idx }
  }, [activePanel])

  const clearDrag = useCallback(() => {
    setDragIdx(null)
    setDragOverIdx(null)
  }, [])

  const handleBarDragOver = useCallback((e: React.DragEvent) => {
    const types = Array.from(e.dataTransfer.types as unknown as string[])
    const isInternal = types.includes("application/x-opencode-tab-index")
    const hasUrlType = types.includes("application/x-opencode-browser-tab") || types.includes("text/uri-list") || types.includes("text/x-moz-url") || types.includes("url") || (!isInternal && types.includes("text/plain"))
    if (isInternal) {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = "move"
      setDragOverIdx(getIndexFromX(e.clientX))
      return
    }
    if (hasUrlType && onOpenBrowser) {
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = "copy"
    }
  }, [getIndexFromX, onOpenBrowser])

  const handleBarDrop = useCallback((e: React.DragEvent) => {
    const types = Array.from(e.dataTransfer.types as unknown as string[])
    const isInternal = types.includes("application/x-opencode-tab-index")
    if (!isInternal && onOpenBrowser) {
      const url = extractUrlFromDataTransfer(e.dataTransfer)
      if (url) {
        e.preventDefault()
        e.stopPropagation()
        clearDrag()
        // nuevo browser tab en el panel activo (openBrowserAsTab appendea; sin índice)
        onOpenBrowser(url, activePanel)
        return
      }
    }
    if (!isInternal) return
    e.preventDefault()
    e.stopPropagation()
    const origin = readDragOrigin(e)
    clearDrag()
    if (!origin) return
    const at = getIndexFromX(e.clientX)
    if (origin.panel === activePanel) {
      let to = at
      if (origin.index < to) to -= 1
      if (to !== origin.index && to >= 0) onMoveTab?.(activePanel, origin.index, to)
    } else {
      onTransferTab?.(origin.panel, origin.index, activePanel, at)
    }
  }, [readDragOrigin, clearDrag, getIndexFromX, activePanel, onMoveTab, onTransferTab, onOpenBrowser])

  return (
    <div
      className="titlebar"
      onMouseDown={handleDrag}
      onDoubleClick={handleMax}
      role="banner"
      aria-label="Window controls"
    >
      <div className="titlebar-brand" title="OpenHer Desktop">
        <span className="titlebar-brand-icon">
          <CodeIcon size={15} />
        </span>
      </div>

      {isSinglePanel && (
        <div
          className="titlebar-tabs"
          role="tablist"
          ref={tabsRef}          onDragOver={handleBarDragOver}
          onDrop={handleBarDrop}
          onDragLeave={(e) => {
            const rt = e.relatedTarget as Node | null
            if (!rt || !e.currentTarget.contains(rt)) setDragOverIdx(null)
          }}
        >
          {currentStack.map((sid, idx) => {
            const info = getTabInfo(sid, sessions, browserTabUrls)
            const isActive = sid === activeTab || (!activeTab && idx === 0)
            const isBusy = busySessions?.has(sid)

            return (
              <div
                key={`${sid}-${idx}`}
                className={`titlebar-tab${isActive ? " is-active" : ""}${dragIdx === idx ? " dragging" : ""}${dragOverIdx === idx ? " drag-over" : ""}`}
                role="tab"
                aria-selected={isActive}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragEnd={clearDrag}
                onClick={() => onSwitchTab?.(activePanel, idx)}
                title={info.title}
              >
                <span className="titlebar-tab-icon">{info.icon}</span>
                <span className="titlebar-tab-title">{info.title}</span>
                {isBusy && <span className="titlebar-tab-busy-dot" title="En ejecución" />}
                {currentStack.length > 1 && (
                  <button
                    type="button"
                    className="titlebar-tab-close"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveTab?.(activePanel, idx)
                    }}
                    title="Cerrar pestaña"
                    aria-label="Cerrar pestaña"
                  >
                    <CloseIcon size={11} />
                  </button>
                )}
              </div>
            )
          })}

          {(onAddTerminal || onOpenBrowser) && (
            <button
              type="button"
              className="titlebar-add-btn"
              onClick={() => {
                const sid = (tabStacks?.[activePanel] || [])[0] as string | undefined
                const isBrowser = !!sid?.startsWith("browser:")
                // también si el activeSessionId es browser
                const activeIsBrowser = !!(activeSessionId?.startsWith("browser:") || isBrowser)
                if (activeIsBrowser && onOpenBrowser) onOpenBrowser("https://www.google.com", activePanel)
                else onAddTerminal?.(activePanel)
              }}
              title="Nueva pestaña"
              aria-label="Nueva pestaña"
            >
              <PlusIcon size={14} />
            </button>
          )}
        </div>
      )}

      {!isSinglePanel && (
        <div className="titlebar-split" role="tablist" aria-label="Panel tabs">
          {splitPanels.map((pi, gi) => {
            const stack = tabStacks?.[pi] ?? []
            const sid = activeSessionIds?.[pi] ?? null
            return (
              <React.Fragment key={pi}>
                {gi > 0 && <div className="titlebar-split-divider" aria-hidden="true" />}
                <div
                  className="titlebar-panel-tabs"
                  data-active={pi === activePanel}
                  style={{ flexGrow: flexFor(pi), flexBasis: 0 }}
                  onPointerDown={() => { if (pi !== activePanel) setActivePanel?.(pi) }}
                >
                  <TabBar
                    tabs={stack}
                    activeIndex={Math.max(0, stack.indexOf(sid ?? ""))}
                    sessions={buildPanelSessions(stack, sessions, browserTabUrls)}
                    browserTabUrls={browserTabUrls}
                    busySessionIds={busySessions}
                    onSwitch={(idx) => onSwitchTab?.(pi, idx)}
                    onClose={(idx) => onRemoveTab?.(pi, idx)}
                    onAdd={() => handleAddFor(pi)}
                    onMoveTab={(from, to) => onMoveTab?.(pi, from, to)}
                    onTransferTab={(fp, fi, ti) => onTransferTab?.(fp, fi, pi, ti)}
                    panelIndex={pi}
                    onDropTerminal={() => onAddTerminal?.(pi)}
                    onDropTerminalTab={(raw) => onDockSession?.(pi, "center", raw)}
                    onDropUrl={(url) => onOpenBrowser?.(url, pi)}
                    onCloseOthers={(keep) => onCloseOthers?.(pi, keep)}
                    onCloseRight={(idx) => onCloseRight?.(pi, idx)}
                    onCloseLeft={(idx) => onCloseLeft?.(pi, idx)}
                    onCloseAll={() => onCloseAll?.(pi)}
                  />
                </div>
              </React.Fragment>
            )
          })}
        </div>
      )}

      <WeatherChip />
      <div className="win-controls" aria-label="Windows controls">
        <button
          type="button"
          className="win-btn win-btn-min"
          onClick={() => post("/shell/window/minimize")}
          onMouseDown={(e) => e.stopPropagation()}
          title="Minimizar"
          aria-label="Minimizar"
        >
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          className="win-btn win-btn-max"
          onClick={handleMax}
          onMouseDown={(e) => e.stopPropagation()}
          title={isMax ? "Restaurar" : "Maximizar"}
          aria-label={isMax ? "Restaurar" : "Maximizar"}
        >
          {isMax ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="2.5" y="0.5" width="7" height="7" />
              <rect x="0.5" y="2.5" width="7" height="7" fill="var(--titlebar-bg, #09090b)" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </button>
        <button
          type="button"
          className="win-btn win-btn-close"
          onClick={() => post("/shell/window/close")}
          onMouseDown={(e) => e.stopPropagation()}
          title="Cerrar"
          aria-label="Cerrar"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1.2">
            <line x1="1" y1="1" x2="9" y2="9" />
            <line x1="9" y1="1" x2="1" y2="9" />
          </svg>
        </button>
      </div>
    </div>
  )
})
