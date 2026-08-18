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
}: {
  tabs: Array<string>
  activeIndex: number
  sessions: Array<SessionLike>
  busySessionIds?: Set<string>
  onSwitch: (index: number) => void
  onClose: (index: number) => void
  onAdd: () => void
  onMoveTab: (fromIndex: number, toIndex: number) => void
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const getLabel = useCallback((id: string) => {
    if (id.startsWith("browser:") || id.startsWith("http://") || id.startsWith("https://")) {
      const u = id.replace(/^browser:/, "")
      return `🌐 ${u.replace(/^https?:\/\//, "")}`
    }
    if (id.startsWith("editor:")) {
      return `📝 ${basename(id.replace(/^editor:/, ""))}`
    }
    if (id.startsWith("terminal")) return "💻 Terminal"
    if (id === "explorer") return "📁 Explorador"
    if (id === "stats") return "📊 Estadísticas"
    if (id === "kanban") return "📋 Kanban"
    if (id === "docs") return "📖 Docs"
    if (id === "labs") return "🧪 Labs"

    const session = sessions.find((s) => s.id === id)
    if (session?.title && session.title !== "New Session") return session.title
    if (session?.directory) return basename(session.directory)
    return id.slice(0, 8)
  }, [sessions])

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    const id = tabs[index]
    e.dataTransfer.setData("application/x-opencode-tab-index", String(index))
    if (id) {
      e.dataTransfer.setData("application/x-opencode-path", `session:${id}`)
      e.dataTransfer.setData("text/plain", `session:${id}`)
    } else {
      e.dataTransfer.setData("text/plain", `tab:${index}`)
    }
    e.dataTransfer.effectAllowed = "move"
    setDragIdx(index)
  }, [tabs])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIdx(index)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    const tabIdx = e.dataTransfer.getData("application/x-opencode-tab-index")
    const fromIndex = tabIdx ? parseInt(tabIdx, 10) : NaN
    if (!isNaN(fromIndex) && fromIndex !== toIndex) {
      onMoveTab(fromIndex, toIndex)
    }
    setDragIdx(null)
    setDragOverIdx(null)
  }, [onMoveTab])

  const handleDragEnd = useCallback(() => {
    setDragIdx(null)
    setDragOverIdx(null)
  }, [])

  return (
    <div
      className="tab-bar"
      ref={barRef}
      onWheel={(e) => {
        if (e.deltaY) {
          e.currentTarget.scrollLeft += e.deltaY
        }
      }}
    >
      {tabs.map((id, i) => {
        const busy = busySessionIds?.has(id)
        const isDragging = dragIdx === i
        const isDragOver = dragOverIdx === i && dragIdx !== null && dragIdx !== i
        return (
          <div
            key={id}
            className={`tab${i === activeIndex ? " active" : ""}${isDragging ? " tab-dragging" : ""}${isDragOver ? " tab-drag-over" : ""}`}
            draggable
            onClick={() => onSwitch(i)}
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            title={getLabel(id)}
          >
            <span className="tab-label">{getLabel(id)}</span>
            {busy && <span className="tab-busy" />}
            {tabs.length > 1 && (
              <button
                type="button"
                className="tab-close"
                onClick={(e) => { e.stopPropagation(); onClose(i) }}
                aria-label="Close tab"
              >
                <CloseIcon size={10} />
              </button>
            )}
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
    </div>
  )
})
