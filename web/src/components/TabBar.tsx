import { memo, useCallback, useRef, useState } from "react"
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
}: {
  tabs: Array<string>
  activeIndex: number
  sessions: Array<SessionLike>
  busySessionIds?: Set<string>
  onSwitch: (index: number) => void
  onClose: (index: number) => void
  onAdd: () => void
  onMoveTab: (fromIndex: number, toIndex: number) => void
  panelIndex?: number
  onDropTerminal?: (panelIndex: number, targetIndex?: number) => void
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const getLabel = useCallback((id: string) => {
    if (id.startsWith("browser:") || id.startsWith("http://") || id.startsWith("https://")) {
      const u = id.replace(/^browser:/, "")
      return ` ${u.replace(/^https?:\/\//, "")}`
    }
    if (id.startsWith("editor:")) {
      return ` ${basename(id.replace(/^editor:/, ""))}`
    }
    if (id.startsWith("terminal")) return " Terminal"
    if (id === "explorer") return " Explorador"
    if (id === "stats") return " Estadísticas"
    if (id === "kanban") return " Kanban"
    if (id === "docs") return " Docs"
    if (id === "labs") return " Labs"
    if (id === "__design__") return "◈ Open Design"

    const session = sessions.find((s) => s.id === id)
    if (session?.title && session.title !== "New Session") return session.title
    if (session?.directory) return basename(session.directory)
    return id.slice(0, 8)
  }, [sessions])

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const id = tabs[index]
    e.dataTransfer.setData("application/x-opencode-tab-index", String(index))
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

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIdx(index)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    // Si es un drop externo de terminal, crear terminal en este tabset
    const path = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain") || ""
    if (path.includes("kind:terminal") || path === "kind:terminal") {
      if (panelIndex !== undefined && onDropTerminal) {
        onDropTerminal(panelIndex, toIndex)
      }
      setDragIdx(null)
      setDragOverIdx(null)
      return
    }
    const tabIdx = e.dataTransfer.getData("application/x-opencode-tab-index")
    const fromIndex = tabIdx ? parseInt(tabIdx, 10) : NaN
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      onMoveTab(fromIndex, toIndex)
    }
    setDragIdx(null)
    setDragOverIdx(null)
  }, [onMoveTab, panelIndex, onDropTerminal])

  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
    setDragOverIdx(null)
  }, [])

  const handleBarDragOver = useCallback((e: React.DragEvent) => {
    // Solo permitir drop externo de terminal; el reorden interno se maneja por tab
    if (e.dataTransfer.types.includes("application/x-opencode-tab-index")) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "copy"
  }, [])

  const handleBarDrop = useCallback((e: React.DragEvent) => {
    const path = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain") || ""
    if ((path.includes("kind:terminal") || path === "kind:terminal") && panelIndex !== undefined && onDropTerminal) {
      e.preventDefault()
      onDropTerminal(panelIndex, tabs.length)
    }
  }, [panelIndex, onDropTerminal, tabs.length])

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
    </div>
  )
})
