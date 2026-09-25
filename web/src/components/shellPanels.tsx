// Paneles de la shell para el grid de escritorio: terminal, explorador,
// kanban, docs, updates, labs y config. Todos hablan con /shell/*.

import { memo, useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from "react"
import { useScheduled } from "../hooks/useScheduled"
import { RefreshIcon, TerminalIcon, PlusIcon, SplitIcon, MoreHorizontalIcon, TrashIcon, ChevronDownIcon, PencilIcon, EyeIcon, MaximizeIcon, MinimizeIcon, CloseIcon } from "../Icons"
import { fileIcon, shell, type ShellPanelKind } from "../shell"
import { VisualSelectOverlay } from "./VisualSelectOverlay"
const CodeMirrorEditor = lazy(() => import("./CodeMirrorEditor").then((m) => ({ default: m.CodeMirrorEditor })))
import { toBase64Chunked } from "../utils/editorOps"
import { withTimeout } from "../shared/lib/async"
import { ContextMenu } from "./ContextMenu"
import { LedSwitch } from "./LedSwitch"
import { Opencode2Button } from "../features/opencode2/Opencode2Button"
import type { VisualSelection } from "../hooks/useVisualSelection"

import { terminalStore, killTerminalPty, transferTerminalTab, getTerminalFontSize, setTerminalFontSize } from "../utils/terminalStore"
export { killTerminalPty, transferTerminalTab }
import { useT } from "../i18n-context"
import { useDialog } from "./DialogProvider"
import { Markdown } from "./Markdown"
const SingleTerminal = lazy(() => import("../features/shell/SingleTerminal").then((m) => ({ default: m.SingleTerminal })))
import { DesignPanel } from "../features/shell/DesignPanel"
export { SingleTerminal, DesignPanel }

// Superficie única del editor CodeMirror: la rama split y la normal montaban el
// mismo Suspense+CodeMirrorEditor duplicado. F4-P3.
const EditorSurface = memo(function EditorSurface({ path, value, savedValue, onChange, onSave, onCursor }: {
  path: string
  value: string
  savedValue?: string
  onChange: (val: string) => void
  onSave: () => void
  onCursor: (c: { line: number; col: number }) => void
}) {
  return (
    <Suspense fallback={<div style={{ padding: 16, color: "var(--muted)" }}>Cargando editor…</div>}>
      <CodeMirrorEditor
        path={path}
        value={value}
        savedValue={savedValue}
        onChange={onChange}
        onSave={onSave}
        onCursor={onCursor}
        vsPath={path}
      />
    </Suspense>
  )
})

/** Ruta absoluta del FS (Windows `C:\…`, UNC o POSIX `/…`). El server solo
    resuelve absolutas: un nombre pelado ("download.png" de un drop del SO o
    de un tab persistido viejo) nunca abre y solo genera 404 en /shell/fs/*.
    (Movida a shared/lib/filePaths para reusarla en el chat.) */
import { isAbsoluteFsPath } from "../shared/lib/filePaths.ts"
export { isAbsoluteFsPath }
const BrowserPanel = lazy(() => import("./BrowserPanel").then((m) => ({ default: m.BrowserPanel })))
const DocEditorPanel = lazy(() => import("./DocEditorPanel").then((m) => ({ default: m.DocEditorPanel })))
// Visor PDF bajo demanda: chunk + worker solo se descargan al abrir un .pdf
const PdfViewer = lazy(() => import("./PdfViewer").then((m) => ({ default: m.PdfViewer })))
export { BrowserPanel, DocEditorPanel }

// ============================================================== Terminal (Multi-Pestaña)

export const TerminalPanel = memo(function TerminalPanel({
  cwd,
  shellName,
  hideHeader = false,
  panelIndex,
  panelId,
  onToggleDock,
  isDocked,
  isFloating,
  onMaximize,
  maximized,
  onClose,
}: {
  cwd?: string
  shellName?: string
  hideHeader?: boolean
  panelIndex?: number
  panelId?: string
  onToggleDock?: () => void
  isDocked?: boolean
  /** Instancia de la ventana flotante (modal), no un panel del grid. */
  isFloating?: boolean
  onMaximize?: () => void
  maximized?: boolean
  onClose?: () => void
}) {
  const [currentShell, setCurrentShell] = useState<string>(shellName || "pwsh")
  const [splitTabId, setSplitTabId] = useState<string | null>(null)
  const [termTabs, setTermTabs] = useState<Array<{ id: string; title: string; shell: string }>>(() => {
    if (panelId && terminalStore.has(panelId)) return terminalStore.get(panelId)!.tabs
    return [{ id: "term-1", title: `${shellName || "pwsh"} 1`, shell: shellName || "pwsh" }]
  })
  const [activeTabId, setActiveTabId] = useState<string>(() => {
    if (panelId && terminalStore.has(panelId)) return terminalStore.get(panelId)!.activeId
    return "term-1"
  })

  // Persistir tabs al mover la terminal (panelId se mueve con el panel).
  useEffect(() => {
    if (!panelId) return
    terminalStore.set(panelId, { tabs: termTabs, activeId: activeTabId, splitId: splitTabId })
  }, [panelId, termTabs, activeTabId, splitTabId])

  // Si el panelId cambia (movimiento), hidratar desde el store.
  useEffect(() => {
    if (panelId && terminalStore.has(panelId)) {
      const saved = terminalStore.get(panelId)!
      setTermTabs(saved.tabs)
      setActiveTabId(saved.activeId)
      if (saved.splitId) setSplitTabId(saved.splitId)
    }
  }, [panelId])

  useEffect(() => {
    const onTabsUpdated = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (panelId && (detail?.sourcePanelId === panelId || detail?.destPanelId === panelId)) {
        if (terminalStore.has(panelId)) {
          const saved = terminalStore.get(panelId)!
          setTermTabs([...saved.tabs])
          setActiveTabId(saved.activeId)
          if (saved.splitId) setSplitTabId(saved.splitId)
        }
      }
    }
    window.addEventListener("terminal:tabs-updated", onTabsUpdated)
    return () => window.removeEventListener("terminal:tabs-updated", onTabsUpdated)
  }, [panelId])

  const handleAddTab = () => {
    const nextNum = termTabs.length + 1
    const newId = `term-${Date.now()}`
    setTermTabs((prev) => [...prev, { id: newId, title: `${currentShell} ${nextNum}`, shell: currentShell }])
    setActiveTabId(newId)
  }

  const handleSplit = () => {
    const nextNum = termTabs.length + 1
    const newId = `term-${Date.now()}`
    const newTab = { id: newId, title: `${currentShell} ${nextNum}`, shell: currentShell }
    setTermTabs((prev) => [...prev, newTab])
    // Mostrar split: mantener el tab activo actual a la izquierda y el nuevo a la derecha
    if (!splitTabId) {
      setSplitTabId(newId)
    } else {
      // Si ya hay split, reemplazar el panel derecho y enfocar el nuevo
      setSplitTabId(newId)
      setActiveTabId(newId)
    }
  }

  const handleCloseTab = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (termTabs.length <= 1) {
      killTerminalPty(id)
      const newId = `term-${Date.now()}`
      setTermTabs([{ id: newId, title: `${currentShell} 1`, shell: currentShell }])
      setActiveTabId(newId)
      setSplitTabId(null)
      if (panelId) {
        terminalStore.delete(panelId)
      }
      return
    }
    const nextTabs = termTabs.filter((t) => t.id !== id)
    setTermTabs(nextTabs)
    // Solo X explícita mata la PTY; hide/resize no la toca
    killTerminalPty(id)
    if (splitTabId === id) {
      setSplitTabId(null)
    }
    if (activeTabId === id) {
      // Si se cerró el tab activo y había split, promover el split a activo
      if (splitTabId && splitTabId !== id) {
        setActiveTabId(splitTabId)
        setSplitTabId(null)
      } else {
        setActiveTabId(nextTabs[nextTabs.length - 1].id)
      }
    } else if (splitTabId && activeTabId === splitTabId) {
      // Caso borde: active es el split y se cerró otro tab
    }
  }

  const [zoomTick, setZoomTick] = useState(0)
  useEffect(() => {
    const onZoom = () => setZoomTick((x) => x + 1)
    window.addEventListener("terminal:zoom", onZoom)
    return () => window.removeEventListener("terminal:zoom", onZoom)
  }, [])
  const activeZoom = (() => { void zoomTick; try { return getTerminalFontSize(activeTabId) } catch { return 13 } })()
  const pct = Math.round((activeZoom / 13) * 100)
  const zoomIn = () => { try { const cur = getTerminalFontSize(activeTabId); setTerminalFontSize(activeTabId, cur + 1) } catch {} }
  const zoomOut = () => { try { const cur = getTerminalFontSize(activeTabId); setTerminalFontSize(activeTabId, cur - 1) } catch {} }
  const zoomReset = () => { try { setTerminalFontSize(activeTabId, 13) } catch {} }

  // Menú contextual del header (click derecho): movimiento + acople
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null)

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "#0d1117" }}>
      {/* Barra superior estilo VS Code */}
      {!hideHeader && (
        <div className="terminal-header-bar"
          draggable={true}
          style={{ cursor: "grab" }}
          onContextMenu={(e) => {
            e.preventDefault()
            setCtxMenu({ x: e.clientX, y: e.clientY })
          }}
          onDragStart={(e) => {
            const dragPayload = panelIndex !== undefined ? `panel:${panelIndex}:kind:terminal` : "kind:terminal"
            e.dataTransfer.setData("text/plain", dragPayload)
            e.dataTransfer.setData("application/x-opencode-path", dragPayload)
            e.dataTransfer.effectAllowed = "move"
          }}
        >
          <div className="terminal-tabs-group">
            <div className="terminal-tab active">
              <span className="terminal-status-dot" />
              <span>TERMINAL</span>
            </div>
          </div>

          <div className="terminal-actions-group">
            <span className="terminal-zoom-group" title="Zoom (Ctrl+rueda, pinch, Ctrl+=/-/0)">
              <button type="button" className="terminal-action-btn" onClick={zoomOut} aria-label="Zoom menos">−</button>
              <button type="button" className="terminal-zoom-label" onClick={zoomReset} aria-label="Restablecer zoom" title="Restablecer al 100% (Ctrl+0)">{pct}%</button>
              <button type="button" className="terminal-action-btn" onClick={zoomIn} aria-label="Zoom más">+</button>
            </span>
            <div className="terminal-shell-picker">
              <span className="terminal-tab-icon" style={{ marginRight: 4 }}><TerminalIcon size={12} /></span>
              <select
                value={currentShell}
                onChange={(e) => setCurrentShell(e.target.value)}
                className="terminal-shell-select"
                title="Seleccionar shell"
              >
                <option value="pwsh">pwsh</option>
                <option value="powershell">powershell</option>
                <option value="cmd">cmd</option>
                <option value="bash">bash</option>
                <option value="wsl">wsl</option>
              </select>
            </div>

            <button
              type="button"
              className="terminal-action-btn"
              onClick={handleAddTab}
              title="Nueva terminal"
              aria-label="Nueva terminal"
            >
              <PlusIcon size={13} />
              <span style={{ marginLeft: 1 }}><ChevronDownIcon size={10} /></span>
            </button>

            <button
              type="button"
              className="terminal-action-btn"
              onClick={handleSplit}
              title="Dividir terminal"
              aria-label="Dividir terminal"
            >
              <SplitIcon size={13} />
            </button>

            <button
              type="button"
              className="terminal-action-btn terminal-trash-btn"
              onClick={() => handleCloseTab(activeTabId)}
              title="Eliminar terminal"
              aria-label="Eliminar terminal"
            >
              <TrashIcon size={13} />
            </button>

            <button
              type="button"
              className="terminal-action-btn"
              title="Más acciones..."
              aria-label="Más acciones"
            >
              <MoreHorizontalIcon size={13} />
            </button>

            {(onToggleDock || onMaximize || onClose) && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 2, marginLeft: 6, borderLeft: "1px solid rgba(255,255,255,0.1)", paddingLeft: 6 }}>
                {onToggleDock && (
                  <button
                    type="button"
                    className="terminal-action-btn"
                    onClick={onToggleDock}
                    title={isDocked ? "Desacoplar terminal" : "Acoplar abajo"}
                    aria-label={isDocked ? "Desacoplar terminal" : "Acoplar abajo"}
                  >
                    <SplitIcon size={12} />
                  </button>
                )}

                {onMaximize && (
                  <button
                    type="button"
                    className="terminal-action-btn"
                    onClick={onMaximize}
                    title={maximized ? "Restaurar tamaño" : "Maximizar"}
                    aria-label={maximized ? "Restaurar tamaño" : "Maximizar"}
                  >
                    {maximized ? <MinimizeIcon size={12} /> : <MaximizeIcon size={12} />}
                  </button>
                )}

                {onClose && (
                  <button
                    type="button"
                    className="terminal-action-btn"
                    onClick={onClose}
                    title="Cerrar panel"
                    aria-label="Cerrar panel"
                  >
                    <CloseIcon size={13} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Contenedor principal de terminales con columna de pestañas estilo VS Code */}
      <div className="terminal-body-wrapper">
        {splitTabId ? (
          <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 1, background: "var(--border)" }}>
            {(() => {
              const leftTab = termTabs.find((t) => t.id === activeTabId) ?? termTabs[0]
              const rightTab = termTabs.find((t) => t.id === splitTabId)
              if (!leftTab || !rightTab) return null
              return (
                <>
                  <div style={{ flex: 1, position: "relative", background: "#0d1117", display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <Suspense fallback={<div style={{ background: "#0d1117", width: "100%", height: "100%" }} />}>
                        <SingleTerminal cwd={cwd} shellName={leftTab.shell} tabId={leftTab.id} />
                      </Suspense>
                    </div>
                    <div style={{ padding: "2px 6px", fontSize: 12, color: "var(--muted)", background: "var(--surface-strong)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                      <span>{leftTab.title}</span>
                      <button onClick={() => setSplitTabId(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }} title="Cerrar split">×</button>
                    </div>
                  </div>
                  <div style={{ flex: 1, position: "relative", background: "#0d1117", display: "flex", flexDirection: "column" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                      <Suspense fallback={<div style={{ background: "#0d1117", width: "100%", height: "100%" }} />}>
                        <SingleTerminal cwd={cwd} shellName={rightTab.shell} tabId={rightTab.id} />
                      </Suspense>
                    </div>
                    <div style={{ padding: "2px 6px", fontSize: 12, color: "var(--muted)", background: "var(--surface-strong)", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                      <span>{rightTab.title}</span>
                      <button onClick={() => setSplitTabId(null)} style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer" }} title="Cerrar split">×</button>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        ) : (
          <>
            {/* Viewport de xterm: solo la terminal activa montada (las ocultas
            desmontan su canvas/WebGL y re-adjuntan el PTY vía poll(ptyId,0) al
            volver — el proceso sobrevive en el backend). Montar N xterms con
            scrollback 3000 retenía GB en GPU+JS. */}
            <div className="terminal-viewport-container">
              {(() => {
                const visibleTab = termTabs.find((t) => t.id === activeTabId) ?? termTabs[0]
                if (!visibleTab) return null
                return (
                <div
                  key={visibleTab.id}
                  style={{
                    position: "absolute",
                    inset: 0,
                    visibility: "visible",
                    pointerEvents: "auto",
                    zIndex: 1,
                  }}
                >
                  <Suspense fallback={<div style={{ background: "#0d1117", width: "100%", height: "100%" }} />}>
                    <SingleTerminal cwd={cwd} shellName={visibleTab.shell} tabId={visibleTab.id} />
                  </Suspense>
                </div>
                )
              })()}
            </div>

            {/* Columna lateral de terminales activas estilo VS Code */}
            <div className="terminal-tabs-column">
                <div
                className="terminal-tabs-column-head"
                draggable={!isDocked}
                style={{ cursor: isDocked ? "default" : "grab" }}
                onDragStart={(e) => {
                  if (isDocked) { e.preventDefault(); return }
                  const dragPayload = panelIndex !== undefined ? `panel:${panelIndex}:kind:terminal` : "kind:terminal"
                  e.dataTransfer.setData("text/plain", dragPayload)
                  e.dataTransfer.setData("application/x-opencode-path", dragPayload)
                  e.dataTransfer.effectAllowed = "move"
                }}
              >
                <span>TERMINALS ({termTabs.length})</span>
                <button
                  type="button"
                  onClick={handleAddTab}
                  style={{ background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", padding: 0 }}
                  title="Nueva terminal"
                >
                  <PlusIcon size={11} />
                </button>
              </div>
              {termTabs.map((tab) => (
                <div
                  key={tab.id}
                  className={`terminal-tab-item${tab.id === activeTabId ? " active" : ""}`}
                  onClick={() => setActiveTabId(tab.id)}
                  draggable
                  style={{ cursor: "grab" }}
                  onDragStart={(e) => {
                    const pId = panelId || (isDocked ? "bottom-terminal" : `panel-${panelIndex ?? 0}-term`)
                    const dragPayload = `panel:${panelIndex ?? 0}:terminal-tab:${tab.id}:${pId}`
                    e.dataTransfer.setData("text/plain", dragPayload)
                    e.dataTransfer.setData("application/x-opencode-path", dragPayload)
                    e.dataTransfer.effectAllowed = "move"
                  }}
                >
                  <div className="terminal-tab-item-left">
                    <TerminalIcon size={12} />
                    <span>{tab.title}</span>
                  </div>
                  <button
                    type="button"
                    className="terminal-tab-close-btn"
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    title={termTabs.length > 1 ? "Cerrar terminal" : "Reiniciar terminal"}
                    aria-label={termTabs.length > 1 ? "Cerrar terminal" : "Reiniciar terminal"}
                  >
                    <TrashIcon size={11} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Menú contextual del header: movimiento, acople como ventana, zoom, cerrar */}
      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          actions={[
            ...(onToggleDock ? [{
              id: "dock",
              label: isDocked ? "Abrir como ventana flotante" : "Acoplar abajo",
              onAction: () => onToggleDock(),
            }] : []),
            ...(!isDocked && isFloating ? [{
              id: "center",
              label: "Centrar ventana",
              onAction: () => { try { window.dispatchEvent(new CustomEvent("terminal:float-center")) } catch {} },
            }] : []),
            ...(onMaximize ? [{
              id: "maximize",
              label: maximized ? "Restaurar tamaño" : "Maximizar",
              onAction: () => onMaximize(),
            }] : []),
            ...(onClose ? [{
              id: "close",
              label: "Cerrar terminal",
              dividerBefore: true,
              onAction: () => onClose(),
            }] : []),
          ]}
        />
      )}
    </div>
  )
})

// ============================================================== Explorador
// Explorer único: el panel del grid reutiliza PCFilesPanel (el mismo del
// sidebar/móvil). Misma UI, mismos confirms inline y mismos toasts en todos
// lados; la implementación propia anterior (ExplorerTreeFolder + ExplorerPanel
// con barra superior) se eliminó para no duplicar.
const PCFilesPanelLazy = lazy(() => import("../features/pc-files/PCFilesPanel").then((m) => ({ default: m.PCFilesPanel })))

export const ExplorerPanel = memo(function ExplorerPanel({
  onOpenSessionDir,
  initialCwd,
  onOpenFile,
}: {
  onOpenSessionDir: (dir: string) => void
  initialCwd?: string | null
  onOpenFile?: (path: string) => void
}) {
  return (
    <Suspense fallback={<div className="panel-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando explorador...</div>}>
      <PCFilesPanelLazy initialCwd={initialCwd} onOpenFile={onOpenFile} onOpenSessionDir={onOpenSessionDir} />
    </Suspense>
  )
})

// ============================================================== Editor de Archivos Multi-Pestaña

export const FileEditorPanel = memo(function FileEditorPanel({
  path: initialPath,
  openPaths,
  tabs: controlledTabs,
  activePath: controlledActive,
  onTabSelect,
  onTabClose,
  onClose,
  initialCwd,
  onSelectFile,
  visualSelection,
  inspectMode,
  onVisualSelect,
  onVisualClear,
  onToggleInspect,
}: {
  path: string
  openPaths?: string[]
  tabs?: string[]
  activePath?: string
  onTabSelect?: (path: string) => void
  onTabClose?: (path: string) => void
  onClose?: () => void
  initialCwd?: string
  onSelectFile?: (path: string) => void
  visualSelection?: VisualSelection | null
  inspectMode?: boolean
  onVisualSelect?: (payload: { selectedText: string; lineStart: number | null; lineEnd: number | null; surroundingContext: string; boundingRect?: { x: number; y: number; w: number; h: number } }) => void
  onVisualClear?: () => void
  onToggleInspect?: () => void
}) {
  const isControlled = Array.isArray(controlledTabs) && controlledActive !== undefined
  const [internalTabs, setInternalTabs] = useState<string[]>(() => {
    if (controlledTabs) return controlledTabs
    if (openPaths && openPaths.length > 0) {
      return openPaths.includes(initialPath) ? openPaths : [...openPaths, initialPath]
    }
    return initialPath ? [initialPath] : []
  })
  const [internalActive, setInternalActive] = useState<string>(controlledActive ?? initialPath ?? "")
  const tabs = isControlled ? controlledTabs! : internalTabs
  const activeTab = isControlled ? controlledActive! : internalActive
  // Sincroniza tabs controlados si el caller cambia la lista (ej: abrir nuevo archivo)
  useEffect(() => {
    if (isControlled && controlledTabs) {
      // no-op: tabs viene de props, React ya re-renderiza
    }
  }, [isControlled, controlledTabs])
  const [filesState, setFilesState] = useState<Record<string, { content: string; savedContent: string; dirty: boolean; loading: boolean; error: string | null; loaded: boolean; saveError: string | null }>>({})
  const [saving, setSaving] = useState(false)
  const [cursor, setCursor] = useState({ line: 1, col: 1 })
  useEffect(() => {
    setCursor({ line: 1, col: 1 })
  }, [activeTab])
  // .md abre en vista previa por defecto; resto de archivos en dividido.
  // Modos por tab (no global): volver a un .md conserva su modo.
  const [mdModes, setMdModes] = useState<Record<string, "edit" | "preview" | "split">>({})
  const mdViewMode =
    mdModes[activeTab] ?? (/\.(md|markdown|mdown|mkd)$/i.test(activeTab) ? "preview" : "split")
  const setMdViewMode = useCallback(
    (mode: "edit" | "preview" | "split") =>
      setMdModes((prev) => (prev[activeTab] === mode ? prev : { ...prev, [activeTab]: mode })),
    [activeTab]
  )

  const isMarkdown = /\.(md|markdown|mdown|mkd)$/i.test(activeTab)

  // Si cambia la prop inicial desde fuera (solo no controlado, para no duplicar tabs)
  useEffect(() => {
    if (isControlled) return
    if (!initialPath) return
    setInternalTabs((prev) => (prev.includes(initialPath) ? prev : [...prev, initialPath]))
    setInternalActive(initialPath)
  }, [initialPath, isControlled])

  // Cargar contenido de la pestaña activa si no fue cargada aún
  // pendingReload + reloadNonce permiten reintentar tras un error de lectura.
  const pendingReload = useRef<Set<string>>(new Set())
  const [reloadNonce, setReloadNonce] = useState(0)
  useEffect(() => {
    if (!activeTab) return
    // Los PDF son binarios: los maneja PdfViewer vía /shell/fs/download, no fs.read
    if (/\.pdf$/i.test(activeTab)) return
    // Tab con nombre pelado (drop del SO, estado persistido viejo): el server
    // no lo resuelve — error local inmediato en vez de un 404 en consola.
    if (!isAbsoluteFsPath(activeTab)) {
      setFilesState((prev) => {
        if (prev[activeTab]?.error) return prev
        return {
          ...prev,
          [activeTab]: { content: "", savedContent: "", dirty: false, loading: false, error: "Ruta no válida — abrí el archivo desde el Explorador", loaded: false, saveError: null },
        }
      })
      return
    }
    let cancelled = false
    setFilesState((prev) => {
      if (!pendingReload.current.has(activeTab) && prev[activeTab] && (prev[activeTab].content || prev[activeTab].error)) return prev
      pendingReload.current.delete(activeTab)
      return {
        ...prev,
        [activeTab]: { content: "", savedContent: "", dirty: false, loading: true, error: null, loaded: false, saveError: null },
      }
    })

    shell.fs.read(activeTab).then((r) => {
      if (cancelled) return
      setFilesState((prev) => ({
        ...prev,
        [activeTab]: { content: r.content, savedContent: r.content, dirty: false, loading: false, error: null, loaded: true, saveError: null },
      }))
    }).catch((err) => {
      if (cancelled) return
      setFilesState((prev) => ({
        ...prev,
        [activeTab]: { content: "", savedContent: "", dirty: false, loading: false, error: err instanceof Error ? err.message : "Error al abrir archivo", loaded: false, saveError: null },
      }))
    })

    return () => {
      cancelled = true
    }
  }, [activeTab, reloadNonce])

  const activeFile = filesState[activeTab]
  const autoSaveTimerRef = useRef<number | null>(null)
  const filesStateRef = useRef(filesState)
  filesStateRef.current = filesState
  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab
  const prevTabRef = useRef(activeTab)

  // Escritura con timeout (15s, el POST no acepta AbortSignal) + 1 reintento
  const savePath = useCallback(async (tab: string, content: string): Promise<boolean> => {
    const b64 = toBase64Chunked(content)
    let lastErr: unknown = null
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        await withTimeout(shell.fs.write(tab, b64), 15000, "timeout 15s")
        lastErr = null
        break
      } catch (err) {
        lastErr = err
      }
    }
    if (lastErr) {
      const msg = lastErr instanceof Error ? lastErr.message : "Error al guardar archivo"
      setFilesState((prev) => {
        const cur = prev[tab]
        if (!cur) return prev
        return { ...prev, [tab]: { ...cur, saveError: msg } }
      })
      return false
    }
    setFilesState((prev) => {
      const cur = prev[tab]
      if (!cur) return prev
      return { ...prev, [tab]: { ...cur, dirty: cur.content !== content, savedContent: content, saveError: null } }
    })
    return true
  }, [])

  const handleSave = useCallback(async () => {
    if (!activeTab || !filesState[activeTab] || saving) return
    const current = filesState[activeTab]
    if (!current.loaded) {
      setFilesState((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], saveError: "El archivo no terminó de cargar; reintentá la carga" },
      }))
      return
    }
    setSaving(true)
    try {
      await savePath(activeTab, current.content)
    } finally {
      setSaving(false)
    }
  }, [activeTab, filesState, saving, savePath])

  // Flush anti-pérdida al cambiar de tab: el autosave con debounce se
  // cancelaría en el cleanup y handleSave solo conoce activeTab.
  useEffect(() => {
    const prev = prevTabRef.current
    prevTabRef.current = activeTab
    if (!prev || prev === activeTab) return
    const st = filesStateRef.current[prev]
    if (st && st.dirty && !st.loading && !st.error && st.loaded) {
      void savePathRef.current(prev, st.content)
    }
  }, [activeTab])
  const savePathRef = useRef(savePath)
  savePathRef.current = savePath

  // Aviso del navegador si quedan tabs sucias al cerrar/recargar
  useEffect(() => {
    const onBefore = (e: BeforeUnloadEvent) => {
      if (Object.values(filesStateRef.current).some((f) => f.dirty)) e.preventDefault()
    }
    window.addEventListener("beforeunload", onBefore)
    return () => window.removeEventListener("beforeunload", onBefore)
  }, [])

  const handleRetryLoad = useCallback(() => {
    if (!activeTab) return
    pendingReload.current.add(activeTab)
    setReloadNonce((n) => n + 1)
  }, [activeTab])

  const handleContentChange = useCallback((val: string) => {
    setFilesState((prev) => ({
      ...prev,
      [activeTab]: {
        ...(prev[activeTab] || { loading: false, error: null, savedContent: "", loaded: false, saveError: null }),
        content: val,
        // Sucio exacto: deshacer hasta lo guardado limpia el flag (sin writes redundantes)
        dirty: val !== (prev[activeTab]?.savedContent ?? ""),
        saveError: null,
      },
    }))
  }, [activeTab])

  // Autoguardado con debounce de 1000ms al detectar modificaciones
  useEffect(() => {
    if (!activeFile?.dirty || activeFile?.loading || saving) return
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)

    autoSaveTimerRef.current = window.setTimeout(() => {
      void handleSave()
    }, 1000)

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current)
    }
  }, [activeFile?.content, activeFile?.dirty, activeFile?.loading, handleSave, saving])

  // Cierre con flush: si la tab está sucia se guarda antes de cerrar
  // (mejor que un diálogo: cero pérdida sin fricción).
  const handleCloseTab = async (tabToClose: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const st = filesState[tabToClose]
    if (st && st.dirty && !st.loading && !st.error && st.loaded) {
      try {
        await savePath(tabToClose, st.content)
      } catch {
        /* best effort: se cierra igual, el contenido queda en disco parcial */
      }
    }
    if (isControlled) {
      if (onTabClose) onTabClose(tabToClose)
      return
    }
    const nextTabs = tabs.filter((t) => t !== tabToClose)
    setInternalTabs(nextTabs)
    if (nextTabs.length === 0) {
      if (onClose) onClose()
    } else if (activeTab === tabToClose) {
      const idx = tabs.indexOf(tabToClose)
      const newActive = nextTabs[Math.max(0, idx - 1)]
      setInternalActive(newActive)
      if (onSelectFile) onSelectFile(newActive)
    }
  }

  const handleSelectTab = (tabPath: string) => {
    if (isControlled) {
      if (onTabSelect) onTabSelect(tabPath)
      return
    }
    setInternalActive(tabPath)
    if (onSelectFile) onSelectFile(tabPath)
  }

  if (tabs.length === 0) {
    return null
  }

  const relPath = initialCwd && activeTab.startsWith(initialCwd) ? activeTab.slice(initialCwd.length).replace(/^[/\\]+/, "") : activeTab
  // Conteo sin split (sin duplicar el archivo en RAM por render)
  const { lineCount, charCount } = useMemo(() => {
    const c = activeFile?.content ?? ""
    if (!c) return { lineCount: 0, charCount: 0 }
    let n = 1
    for (let i = 0; i < c.length; i++) if (c.charCodeAt(i) === 10) n++
    return { lineCount: n, charCount: c.length }
  }, [activeFile?.content])
  const ext = (activeTab.split(".").pop() || "").toLowerCase()

  return (
    <div className="file-editor-panel" style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)" }}>
      {/* Barra de pestañas — DRY con .tab (24px/23px) */}
      <div className="file-editor-tab-bar">
        <div style={{ display: "flex", alignItems: "center", gap: "1px", minWidth: 0, overflowX: "auto", scrollbarWidth: "none" }}>
          {tabs.map((tab) => {
            const name = tab.split(/[/\\]/).pop() || tab
            const isActive = tab === activeTab
            const isDirty = filesState[tab]?.dirty
            const ic = fileIcon(name, false)
            return (
              <div
                key={tab}
                className={`file-editor-tab${isActive ? " active" : ""}`}
                onClick={() => handleSelectTab(tab)}
                title={tab}
                role="tab"
                aria-selected={isActive}
              >
                <span className="file-editor-tab-icon" style={{ color: ic.color }}>{ic.glyph}</span>
                <span className="file-editor-tab-name">{name}</span>
                {isDirty && <span className="file-editor-dirty" title="Modificado (autoguardando...)" />}
                <button
                  type="button"
                  className="file-editor-tab-close"
                  onClick={(e) => handleCloseTab(tab, e)}
                  title="Cerrar pestaña"
                  aria-label={`Cerrar ${name}`}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "0 4px", flexShrink: 0 }}>
          {onVisualSelect && onToggleInspect && (
            <button
              type="button"
              className={`btn-icon compact${inspectMode ? " active" : ""}${visualSelection ? " has-selection" : ""}`}
              onClick={onToggleInspect}
              title={inspectMode ? "Salir modo selección (Esc)" : visualSelection ? `Zona: ${visualSelection.fileName ?? ""}:${visualSelection.lineStart ?? ""} — clic para cambiar` : "Seleccionar zona para el agente (Ctrl+Shift+C)"}
              aria-label="Seleccionar zona"
              style={visualSelection ? { color: "var(--primary)", borderColor: "var(--primary-soft)" } : undefined}
            >
              <MaximizeIcon size={13} />
            </button>
          )}
          {visualSelection && onVisualClear && (
            <button type="button" className="btn-icon compact" onClick={onVisualClear} title={`Quitar selección ${visualSelection.fileName ?? ""}`} aria-label="Quitar selección">
              ×
            </button>
          )}
          {onClose && (
            <button type="button" className="btn-icon compact" onClick={onClose} title="Cerrar panel de editor">
              ×
            </button>
          )}
        </div>
      </div>
      {/* Barra de modos markdown — 3 iconos compactos debajo de las pestañas */}
      {isMarkdown && (
        <div className="file-editor-md-bar">
          <button type="button" className={`file-editor-md-btn${mdViewMode === "edit" ? " active" : ""}`} onClick={() => setMdViewMode("edit")} title="Editar" aria-label="Editar">
            <PencilIcon size={12} />
          </button>
          <button type="button" className={`file-editor-md-btn${mdViewMode === "split" ? " active" : ""}`} onClick={() => setMdViewMode("split")} title="Vista dividida" aria-label="Vista dividida">
            <SplitIcon size={12} />
          </button>
          <button type="button" className={`file-editor-md-btn${mdViewMode === "preview" ? " active" : ""}`} onClick={() => setMdViewMode("preview")} title="Vista previa" aria-label="Vista previa">
            <EyeIcon size={12} />
          </button>
        </div>
      )}

      {/* Cuerpo del editor de código / Markdown */}
      <div style={{ flex: 1, position: "relative", minHeight: 0, display: "flex", flexDirection: "column" }}>
        {(activeFile?.error || activeFile?.saveError) && (
          <div className="file-editor-banner" role="alert">
            <span className="file-editor-banner-msg" title={activeFile.error ?? activeFile.saveError ?? ""}>
              {activeFile.error ?? activeFile.saveError}
            </span>
            {activeFile.error ? (
              <button type="button" className="btn-secondary compact" onClick={handleRetryLoad}>
                Reintentar carga
              </button>
            ) : (
              <button type="button" className="btn-secondary compact" onClick={() => void handleSave()}>
                Reintentar guardado
              </button>
            )}
          </div>
        )}
        <div style={{ flex: 1, position: "relative", minHeight: 0, display: "flex" }}>
        {onVisualSelect && onToggleInspect && (
          <VisualSelectOverlay
            enabled={!!inspectMode}
            filePath={activeTab}
            onSelect={(payload) => onVisualSelect(payload)}
            onExit={onToggleInspect}
          />
        )}
        {/\.pdf$/i.test(activeTab) ? (
          <Suspense fallback={<div style={{ padding: 16, color: "var(--muted)" }}>Cargando visor PDF…</div>}>
            <PdfViewer path={activeTab} />
          </Suspense>
        ) : activeFile?.loading ? (
          <div style={{ padding: 16, color: "var(--muted)" }}>Cargando archivo...</div>
        ) : isMarkdown && mdViewMode === "preview" ? (
          <div className="markdown-body message-content" style={{ flex: 1, padding: "16px 24px", overflowY: "auto", background: "var(--surface)" }}>
            <Markdown text={activeFile?.content ?? ""} />
          </div>
        ) : isMarkdown && mdViewMode === "split" ? (
          <div style={{ flex: 1, display: "flex", minHeight: 0, width: "100%" }}>
            <div style={{ flex: 1, minWidth: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <EditorSurface
                path={activeTab}
                value={activeFile?.content ?? ""}
                savedValue={activeFile && !activeFile.loading && !activeFile.error ? activeFile.savedContent : undefined}
                onChange={handleContentChange}
                onSave={() => void handleSave()}
                onCursor={setCursor}
              />
            </div>
            <div className="markdown-body message-content" style={{ flex: 1, minWidth: 0, padding: "16px 20px", overflowY: "auto", background: "var(--surface-subtle)" }}>
              <Markdown text={activeFile?.content ?? ""} />
            </div>
          </div>
        ) : (
          <EditorSurface
            path={activeTab}
            value={activeFile?.content ?? ""}
            savedValue={activeFile && !activeFile.loading && !activeFile.error ? activeFile.savedContent : undefined}
            onChange={handleContentChange}
            onSave={() => void handleSave()}
            onCursor={setCursor}
          />
        )}
        </div>
      </div>
      {/* Status bar inferior — todo mismo color */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 10px", fontSize: "0.72rem", color: "var(--muted)", borderTop: "1px solid var(--border-subtle)", background: "var(--surface)", height: "22px", minHeight: "22px", flexShrink: 0 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{relPath}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          <span>{saving ? "Guardando..." : activeFile?.dirty ? "● Modificado" : " Guardado"}</span>
          {ext && <span style={{ textTransform: "uppercase" }}>{ext}</span>}
          <span>Ln {cursor.line}, Col {cursor.col}</span>
          <span>{lineCount} líneas</span>
          <span>{charCount} caracs</span>
          <span>Ctrl+S</span>
        </div>
      </div>
    </div>
  )
})

// ============================================================== Kanban — Premium


// KanbanPanel vive en ./KanbanPanel (split P1): import diferido + re-export
const KanbanPanel = lazy(() => import("./KanbanPanel").then((m) => ({ default: m.KanbanPanel })))
export { KanbanPanel }

// ============================================================== Docs

export const DocsPanel = memo(function DocsPanel() {
  const t = useT()
  const [root, setRoot] = useState<string>("")
  const [files, setFiles] = useState<{ name: string; path: string; size: number }[]>([])
  const [filter, setFilter] = useState("")
  const [doc, setDoc] = useState<{ path: string; content: string } | null>(null)

  useEffect(() => {
    shell.docs.list().then((r) => {
      setRoot(r.root)
      setFiles(r.files)
    })
  }, [])

  const open = async (path: string) => {
    const r = await shell.docs.read(path)
    setDoc({ path: r.path, content: r.content })
  }

  const shown = filter ? files.filter((f) => f.path.toLowerCase().includes(filter.toLowerCase())) : files

  return (
    <div className="shell-docs">
      <div className="shell-docs-head">
        <input type="search" placeholder={t('shell.searchDocs')} value={filter} onChange={(e) => setFilter(e.target.value)} />
        <a className="btn-secondary compact" href="https://opencode.ai/v2/docs" target="_blank" rel="noreferrer">{t('shell.officialDocs')}</a>
      </div>
      <div className="shell-docs-body">
        <div className="shell-docs-list">
          {shown.map((f) => (
            <div key={f.path} className={`shell-row shell-file${doc?.path === f.path ? " active" : ""}`} onClick={() => open(f.path)} title={f.path}>
              <span className="shell-glyph" style={{ color: "var(--primary)" }}>M</span>
              <span className="shell-name">{f.name}</span>
            </div>
          ))}
        </div>
        {doc
          ? <div className="shell-docs-content"><Markdown text={doc.content} /></div>
          : <div className="shell-docs-content"><div className="shell-empty">{t('shell.selectDoc')}<br /><small>{root}</small></div></div>}
      </div>
    </div>
  )
})

// ============================================================== Updates (GitHub + X)

export const UpdatesPanel = memo(function UpdatesPanel() {
  const t = useT()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback((refresh = false) => {
    setLoading(true)
    shell.updates.get(refresh).then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString() : "")

  return (
    <div className="shell-updates">
      <div className="shell-updates-head">
        <strong>{t('shell.updates')}</strong>
        <button className="btn-secondary compact" onClick={() => load(true)} disabled={loading}>{loading ? "…" : t('shell.refresh')}</button>
      </div>
      <div className="shell-updates-body">
        {data?.github?.map((repo: any) => (
          <div key={repo.repo} className="shell-updates-section">
            <div className="shell-updates-title">GitHub · {repo.repo}</div>
            {repo.releases?.map((r: any, i: number) => (
              <div key={i} className="shell-update-item">
                <a href={r.url} target="_blank" rel="noreferrer"><b>{r.tag}</b> {r.name}</a>
                <small>{fmt(r.date)}</small>
                {r.body && <p className="shell-update-body">{r.body.slice(0, 300)}</p>}
              </div>
            ))}
            <div className="shell-updates-commits">
              {repo.commits?.map((c: any, i: number) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" title={c.message}>
                  <code>{c.sha}</code> {c.message.slice(0, 80)}
                </a>
              ))}
            </div>
          </div>
        ))}
        {data?.x?.map((x: any) => (
          <div key={x.handle} className="shell-updates-section">
            <div className="shell-updates-title">X @{x.handle}</div>
            {x.error && <small>{x.error}</small>}
            <div className="shell-x-lines">{x.lines?.slice(0, 15).map((l: string, i: number) => <div key={i}>{l}</div>)}</div>
          </div>
        ))}
        {!data && !loading && <div className="shell-empty">{t('shell.noUpdates')}</div>}
      </div>
    </div>
  )
})

// ============================================================== Labs + Config

export const LabsPanel = memo(function LabsPanel() {
  const t = useT()
  const { alert } = useDialog()
  const [apps, setApps] = useState<any[]>([])
  const [server, setServer] = useState<any>(null)
  const [autostart, setAutostart] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    shell.labs.list().then((r) => setApps(r.apps))
    shell.server.status().then(setServer)
    shell.autostart.get().then((r) => setAutostart(r.enabled))
  }, [])
  // Reloj central (Plan 3) con load inmediato.
  useScheduled("labs-panel", 6000, load, { runOnRegister: true })

  const start = async (appId: string) => {
    setBusy(appId)
    try {
      await shell.labs.start(appId)
    } catch (e: any) {
      void alert({ title: "Error", message: e.message ?? String(e) })
    }
    setBusy(null)
    load()
  }

  return (
    <div className="shell-labs">
      <div className="shell-updates-head">
        <strong>{t('shell.labs')}</strong>
        <button className="btn-secondary compact" onClick={load} title="refresh"><RefreshIcon size={12} /></button>
      </div>
      <div className="shell-labs-section">
        <div className="shell-updates-title">Server OpenHer</div>
        <div className="shell-labs-row">
          <span>{server?.running ? "● " + t('shell.running') : "○ " + t('shell.stopped')}</span>
          <button className="btn-primary compact" disabled={!server?.running && !server} onClick={() => shell.server.start().then(load)}>{t('shell.start')}</button>
          <button className="btn-secondary compact" onClick={() => shell.server.stop().then(load)}>{t('shell.stop')}</button>
        </div>
        <div className="shell-labs-row">
          <Opencode2Button compact />
        </div>
      </div>
      <div className="shell-labs-section">
        <div className="shell-updates-title">{t('shell.apps')}</div>
        {apps.map((a) => (
          <div key={a.id} className="shell-labs-row">
            <span>{a.title} {!a.configured && <small>({t('shell.notConfigured')})</small>}</span>
            <button className="btn-primary compact" disabled={!a.configured || busy === a.id} onClick={() => start(a.id)}>{busy === a.id ? "…" : t('shell.launch')}</button>
          </div>
        ))}
      </div>
      <div className="shell-labs-section">
        <div className="shell-updates-title">Windows</div>
        <label className="shell-labs-row">
          <span>{t('shell.autostart')}</span>
          <LedSwitch label={t('shell.autostart')} checked={autostart} onChange={(next) => { shell.autostart.set(next).then(() => setAutostart(next)) }} />
        </label>
      </div>
    </div>
  )
})

export const ConfigPanel = memo(function ConfigPanel() {
  const t = useT()
  const [raw, setRaw] = useState("")
  const [msg, setMsg] = useState("")

  const load = useCallback(() => {
    shell.config.get().then((c) => {
      setRaw(JSON.stringify(c, null, 2))
    })
  }, [])
  useEffect(load, [load])

  const apply = async () => {
    try {
      const parsed = JSON.parse(raw)
      await shell.config.import(parsed)
      setMsg("")
      load()
    } catch (e: any) {
      setMsg(" " + (e.message ?? e))
    }
  }
  const exportCfg = async () => {
    const r = await shell.config.export()
    await navigator.clipboard.writeText(JSON.stringify(r.config, null, 2))
    setMsg(" " + t('shell.copied'))
  }

  return (
    <div className="shell-config">
      <div className="shell-config-head">
        <button className="btn-primary compact" onClick={apply}>{t('shell.apply')}</button>
        <button className="btn-secondary compact" onClick={exportCfg}>{t('shell.export')}</button>
        {msg && <span className="shell-config-msg">{msg}</span>}
      </div>
      <textarea className="shell-config-ta" value={raw} onChange={(e) => { setRaw(e.target.value); setMsg("") }} spellCheck={false} />
    </div>
  )
})

// ============================================================== Wrapper

export type ShellPanelProps = {
  kind: Exclude<ShellPanelKind, "session">
  cwd?: string
  onOpenSessionDir: (dir: string) => void
  sessionID?: string | null
  onOpenFile?: (path: string) => void
  panelIndex?: number
  panelId?: string
}

export const ShellPanel = memo(function ShellPanel({ kind, cwd, onOpenSessionDir, sessionID: _sessionID, onOpenFile, panelIndex, panelId }: ShellPanelProps) {
  switch (kind) {
    case "terminal":
      return <TerminalPanel cwd={cwd} panelIndex={panelIndex} panelId={panelId} />
    case "explorer":
      return <ExplorerPanel onOpenSessionDir={onOpenSessionDir} initialCwd={cwd} onOpenFile={onOpenFile} />
    case "kanban":
      return <Suspense fallback={<div className="panel-loading">Cargando…</div>}><KanbanPanel /></Suspense>
    case "docs":
      return <DocsPanel />
    case "updates":
      return <UpdatesPanel />
    case "labs":
      return <LabsPanel />
    case "config":
      return <ConfigPanel />
    case "browser":
      return (
        <Suspense fallback={<div className="panel-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando navegador...</div>}>
          <BrowserPanel initialUrl={cwd?.startsWith("http") ? cwd : "http://localhost:5173"} />
        </Suspense>
      )
    case "doc":
      return (
        <Suspense fallback={<div className="panel-loading" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)" }}>Cargando editor...</div>}>
          <DocEditorPanel initialPath={cwd} />
        </Suspense>
      )
    case "design":
      return <DesignPanel initialUrl={cwd?.startsWith("http") ? cwd : undefined} />
    default:
      return null
  }
})
