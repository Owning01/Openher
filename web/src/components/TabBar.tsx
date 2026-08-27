import { memo, useCallback, useRef, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { basename } from "../utils"
import { PlusIcon, CloseIcon } from "../Icons"

type SessionLike = { id: string; title?: string; directory: string }

export type TabBarTab = {
  id: string
  label: string
  busy?: boolean
}

export const TabBar = memo(function TabBar({
  tabs,
  activeIndex,
  sessions,
  busySessionIds,
  onSwitch,
  onClose,
  onAdd,
  onMoveTab,
  panelIndex,
  onDropTerminal,
  onTransferTab,
  onCloseOthers,
  onCloseRight,
  onCloseLeft,
  onCloseAll,
  onDuplicate,
}: {
  tabs: Array<string>
  activeIndex: number
  sessions: Array<SessionLike>
  busySessionIds?: Set<string>
  onSwitch: (index: number) => void
  onClose: (index: number) => void
  onAdd: () => void
  onMoveTab: (fromIndex: number, toIndex: number) => void
  /** Mover un tab de otro panel a esta barra en toIndex (cross-panel). */
  onTransferTab?: (fromPanel: number, fromIndex: number, toIndex: number) => void
  panelIndex?: number
  onDropTerminal?: (panelIndex: number, targetIndex?: number) => void
  onCloseOthers?: (keepIndex: number) => void
  onCloseRight?: (index: number) => void
  onCloseLeft?: (index: number) => void
  onCloseAll?: () => void
  onDuplicate?: (index: number) => void
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)
  const [ctx, setCtx] = useState<{ x: number; y: number; idx: number } | null>(null)
  const ctxRef = useRef<HTMLDivElement | null>(null)

  const getLabel = useCallback((id: string) => {
    if (id.startsWith("browser:")) {
      // browser tab id stores url in browserTabUrls; fallback to label
      const suffix = id.slice(8)
      // try to show host if suffix looks like url (legacy), else generic
      if (suffix.includes("://") || suffix.includes(".")) return ` ${suffix.replace(/^https?:\/\//, "").slice(0, 24)}`
      return " Navegador"
    }
    if (id.startsWith("http://") || id.startsWith("https://")) {
      return ` ${id.replace(/^https?:\/\//, "")}`
    }
    if (id.startsWith("editor:")) {
      return ` ${basename(id.replace(/^editor:/, ""))}`
    }
    if (id.startsWith("terminal")) return " Terminal"
    if (id === "explorer") return " Explorador"
    if (id === "stats" || id === "__stats__") return " Estadísticas"
    if (id.startsWith("plugin:")) {
      const rest = id.slice(7)
      const label = rest.split(":").pop() || rest
      return ` ${label}`
    }
    if (id === "kanban") return " Kanban"
    if (id === "docs") return " Docs"
    if (id === "labs") return " Labs"
    if (id === "__design__") return "◈ Open Design"
    if (id === "__learning__" || id === "learning") return "📚 Aprendizaje"

    const session = sessions.find((s) => s.id === id)
    if (session?.title && session.title !== "New Session") return session.title
    if (session?.directory) return basename(session.directory)
    return id.slice(0, 8)
  }, [sessions])

  const handleTabContextMenu = useCallback((e: React.MouseEvent, idx: number) => {
    e.preventDefault()
    const menuW = 220
    const menuH = 340
    const x = e.clientX + menuW > window.innerWidth ? Math.max(8, e.clientX - menuW) : e.clientX
    const y = e.clientY + menuH > window.innerHeight ? Math.max(8, window.innerHeight - menuH - 8) : e.clientY
    setCtx({ x, y, idx })
  }, [])

  useEffect(() => {
    if (!ctx) return
    const onDown = (e: PointerEvent) => { if (ctxRef.current && !ctxRef.current.contains(e.target as Node)) setCtx(null) }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCtx(null) }
    document.addEventListener("pointerdown", onDown, true)
    document.addEventListener("keydown", onKey)
    return () => { document.removeEventListener("pointerdown", onDown, true); document.removeEventListener("keydown", onKey) }
  }, [ctx])

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const id = tabs[index]
    e.dataTransfer.setData("application/x-opencode-tab-index", String(index))
    // Origen del drag ("panel|index", -1 si la barra no pertenece a un panel)
    e.dataTransfer.setData("application/x-opencode-tab-src", `${panelIndex ?? -1}|${index}`)
    if (id) {
      const payload = panelIndex !== undefined ? `panel:${panelIndex}:${id}` : `session:${id}`
      e.dataTransfer.setData("application/x-opencode-path", payload)
      e.dataTransfer.setData("text/plain", payload)
    } else {
      e.dataTransfer.setData("text/plain", `tab:${index}`)
    }
    e.dataTransfer.effectAllowed = "move"
    setDragIdx(index)
  }, [tabs, panelIndex])

  // Índice de inserción según la posición X del cursor sobre la barra
  const getIndexFromX = useCallback((clientX: number): number => {
    const bar = barRef.current
    if (!bar) return tabs.length
    const els = Array.from(bar.querySelectorAll<HTMLDivElement>('[role="tab"]'))
    for (let k = 0; k < els.length; k++) {
      const r = els[k]!.getBoundingClientRect()
      if (clientX < r.left + r.width / 2) return k
    }
    return els.length
  }, [tabs.length])

  const readDragOrigin = useCallback((e: React.DragEvent): { panel: number; index: number } | null => {
    const idx = parseInt(e.dataTransfer.getData("application/x-opencode-tab-index"), 10)
    if (isNaN(idx)) return null
    const srcPanel = parseInt((e.dataTransfer.getData("application/x-opencode-tab-src") || "").split("|")[0] ?? "", 10)
    return { panel: isNaN(srcPanel) ? (panelIndex ?? -1) : srcPanel, index: idx }
  }, [panelIndex])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIdx(index)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    e.stopPropagation() // evita doble manejo con el drop de la barra
    const path = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain") || ""
    if (path.includes("kind:terminal") || path === "kind:terminal") {
      if (panelIndex !== undefined && onDropTerminal) {
        onDropTerminal(panelIndex, toIndex)
      }
      setDragIdx(null)
      setDragOverIdx(null)
      return
    }
    const origin = readDragOrigin(e)
    setDragIdx(null)
    setDragOverIdx(null)
    if (!origin) return
    if (origin.panel === -1 || origin.panel === panelIndex) {
      // Reorden dentro del mismo panel (índices ya exactos por-tab)
      if (origin.index !== toIndex) onMoveTab(origin.index, toIndex)
    } else if (onTransferTab && panelIndex !== undefined) {
      // Tab arrastrado desde otra barra de pestañas
      onTransferTab(origin.panel, origin.index, toIndex)
    }
  }, [onMoveTab, onTransferTab, panelIndex, onDropTerminal, readDragOrigin])

  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
    setDragOverIdx(null)
  }, [])

  const handleBarDragOver = useCallback((e: React.DragEvent) => {
    const isInternal = e.dataTransfer.types.includes("application/x-opencode-tab-index")
    // Drops externos (terminal desde el rail) y reorden interno: ambos válidos
    e.preventDefault()
    e.dataTransfer.dropEffect = isInternal ? "move" : "copy"
    if (isInternal) setDragOverIdx(getIndexFromX(e.clientX))
  }, [getIndexFromX])

  const handleBarDrop = useCallback((e: React.DragEvent) => {
    const isInternal = e.dataTransfer.types.includes("application/x-opencode-tab-index")
    const path = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain") || ""
    const isTerminal = path.includes("kind:terminal") || path === "kind:terminal"
    // Tipos desconocidos (ej. sesión desde sidebar): dejar pasar al handler de la celda (split)
    if (!isInternal && !isTerminal) return
    e.preventDefault()
    e.stopPropagation()
    const at = getIndexFromX(e.clientX)
    if (isTerminal) {
      if (panelIndex !== undefined && onDropTerminal) onDropTerminal(panelIndex, at)
    } else if (panelIndex !== undefined) {
      const origin = readDragOrigin(e)
      if (origin) {
        if (origin.panel === -1 || origin.panel === panelIndex) {
          // Drop en el hueco de la barra: ajustar por la remoción previa
          let to = at
          if (origin.index < to) to -= 1
          if (to !== origin.index) onMoveTab(origin.index, to)
        } else if (onTransferTab) {
          onTransferTab(origin.panel, origin.index, at)
        }
      }
    }
    setDragIdx(null)
    setDragOverIdx(null)
  }, [getIndexFromX, onDropTerminal, onMoveTab, onTransferTab, panelIndex, readDragOrigin])

  return (
    <div
      className="tab-bar"
      ref={barRef}
      role="tablist"
      aria-label="Tabs"
      onWheel={(e) => {
        if (e.deltaY) {
          e.currentTarget.scrollLeft += e.deltaY
        }
      }}
      onDragOver={handleBarDragOver}
      onDrop={handleBarDrop}
    >
      {tabs.map((id, i) => {
        const busy = busySessionIds?.has(id)
        const isDragging = dragIdx === i
        const isDragOver = dragOverIdx === i && dragIdx !== null && dragIdx !== i
        return (
          <div
            key={id}
            role="tab"
            aria-selected={i === activeIndex}
            aria-label={getLabel(id)}
            tabIndex={i === activeIndex ? 0 : -1}
            className={`tab${i === activeIndex ? " active" : ""}${isDragging ? " tab-dragging" : ""}${isDragOver ? " tab-drag-over" : ""}`}
            draggable
            onClick={() => onSwitch(i)}
            onContextMenu={(e) => handleTabContextMenu(e, i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSwitch(i) }
              else if (e.key === "ArrowRight") { e.preventDefault(); const n = barRef.current?.querySelectorAll('[role="tab"]'); (n?.[Math.min(i + 1, tabs.length - 1)] as HTMLElement)?.focus() }
              else if (e.key === "ArrowLeft") { e.preventDefault(); const n = barRef.current?.querySelectorAll('[role="tab"]'); (n?.[Math.max(i - 1, 0)] as HTMLElement)?.focus() }
              else if (e.key === "Delete") { e.preventDefault(); onClose(i) }
            }}
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            title={getLabel(id)}
          >
            <span className="tab-label">{getLabel(id)}</span>
            {busy && <span className="tab-busy" />}
            <button
              type="button"
              className="tab-close"
              onClick={(e) => { e.stopPropagation(); onClose(i) }}
              aria-label="Close tab"
            >
              <CloseIcon size={10} />
            </button>
          </div>
        )
      })}
      <button
        type="button"
        className="tab-add"
        onClick={onAdd}
        title="New tab"
        aria-label="New tab"
      >
        <PlusIcon size={12} />
      </button>
      {onDropTerminal && panelIndex !== undefined && (
        <button
          type="button"
          className="tab-add"
          onClick={() => onDropTerminal(panelIndex, tabs.length)}
          title="Nueva terminal como pestaña"
          aria-label="Nueva terminal"
        >
          
        </button>
      )}
      {ctx && createPortal(
        <div
          ref={ctxRef}
          className="modal-dropdown fade-in"
          style={{
            position: "fixed",
            left: `${ctx.x}px`,
            top: `${ctx.y}px`,
            zIndex: 100000,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            padding: "4px 0",
            minWidth: "200px",
            maxHeight: `calc(100vh - ${ctx.y}px - 12px)`,
            overflowY: "auto",
          }}
          onClick={() => setCtx(null)}
        >
          {(() => {
            const idx = ctx.idx
            const id = tabs[idx]
            const label = getLabel(id)
            const session = sessions.find((s) => s.id === id)
            const isSession = !!session
            const canCloseOthers = tabs.length > 1
            const canCloseRight = idx < tabs.length - 1
            const canCloseLeft = idx > 0
            const copy = (text: string) => { try { navigator.clipboard.writeText(text) } catch {} }
            return (
              <>
                <button type="button" className="overflow-item" onClick={() => { setCtx(null); onClose(idx) }}>
                  <span>Cerrar</span>
                </button>
                <button type="button" className="overflow-item" disabled={!canCloseOthers} onClick={() => { setCtx(null); if (onCloseOthers) onCloseOthers(idx); else { for (let i = tabs.length - 1; i >= 0; i--) if (i !== idx) onClose(i) } }}>
                  <span>Cerrar otras</span>
                </button>
                <button type="button" className="overflow-item" disabled={!canCloseRight} onClick={() => { setCtx(null); if (onCloseRight) onCloseRight(idx); else { for (let i = tabs.length - 1; i > idx; i--) onClose(i) } }}>
                  <span>Cerrar a la derecha</span>
                </button>
                <button type="button" className="overflow-item" disabled={!canCloseLeft} onClick={() => { setCtx(null); if (onCloseLeft) onCloseLeft(idx); else { for (let i = idx - 1; i >= 0; i--) onClose(i) } }}>
                  <span>Cerrar a la izquierda</span>
                </button>
                <button type="button" className="overflow-item" onClick={() => { setCtx(null); if (onCloseAll) onCloseAll(); else { for (let i = tabs.length - 1; i >= 0; i--) onClose(i) } }}>
                  <span>Cerrar todas</span>
                </button>
                <div style={{ height: 1, background: "var(--border)", margin: "4px 0" }} />
                <button type="button" className="overflow-item" onClick={() => { setCtx(null); copy(label.trim()) }}>
                  <span>Copiar título</span>
                </button>
                <button type="button" className="overflow-item" onClick={() => { setCtx(null); copy(id) }}>
                  <span>Copiar ID</span>
                </button>
                {isSession && session.directory && (
                  <button type="button" className="overflow-item" onClick={() => { setCtx(null); copy(session.directory) }}>
                    <span>Copiar ruta</span>
                  </button>
                )}
                {id.startsWith("browser:") && (
                  <button type="button" className="overflow-item" onClick={() => { setCtx(null); copy(id.slice(8)) }}>
                    <span>Copiar URL</span>
                  </button>
                )}
                {onDuplicate && (
                  <button type="button" className="overflow-item" onClick={() => { setCtx(null); onDuplicate(idx) }}>
                    <span>Duplicar pestaña</span>
                  </button>
                )}
              </>
            )
          })()}
        </div>,
        document.body
      )}
    </div>
  )
})
