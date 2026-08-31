// Sidebar jerárquica con búsqueda + drag & drop + secciones custom. — styles/learning.css
import { useMemo, useState, useCallback, useRef } from "react"
import type { LearningManifest, LearningLesson, LearningProgress } from "./types.ts"

interface Props {
  manifest: LearningManifest
  progress: LearningProgress
  selectedId: string | null
  onSelect: (lesson: LearningLesson) => void
  onMoveLesson?: (lessonId: string, toCategoryId: string, toIndex: number) => void
  onReorderCategory?: (categoryId: string, toIndex: number) => void
  onCreateCategory?: (title: string) => void
  onAddDoc?: (categoryId: string, file: File) => void
  onCreateEmptyDoc?: (categoryId: string) => void
  onDropFiles?: (categoryId: string, files: FileList) => void
  onClose?: () => void
}

export function LearningSidebar({ manifest, progress, selectedId, onSelect, onMoveLesson, onReorderCategory, onCreateCategory, onAddDoc, onCreateEmptyDoc, onDropFiles, onClose }: Props) {
  const [query, setQuery] = useState("")
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(manifest.categories.map((c) => c.id)))
  const [draggingLesson, setDraggingLesson] = useState<string | null>(null)
  const [draggingCat, setDraggingCat] = useState<string | null>(null)
  const [dropCat, setDropCat] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatTitle, setNewCatTitle] = useState("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [fileTargetCat, setFileTargetCat] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return manifest.categories
    return manifest.categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) => it.title.toLowerCase().includes(q) || it.categoryTitle.toLowerCase().includes(q) || (it.subCategory?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter((c) => c.items.length > 0)
  }, [manifest, query])

  const toggleCat = (id: string) =>
    setOpenCats((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const handleCreateCategory = useCallback(() => {
    const title = newCatTitle.trim()
    if (!title) return
    onCreateCategory?.(title)
    setNewCatTitle("")
    setShowNewCat(false)
  }, [newCatTitle, onCreateCategory])

  const handleFilePick = useCallback((catId: string) => {
    setFileTargetCat(catId)
    fileInputRef.current?.click()
  }, [])

  const onFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !fileTargetCat) return
    onDropFiles?.(fileTargetCat, files)
    // también probar onAddDoc por compat
    if (files.length === 1 && onAddDoc) onAddDoc(fileTargetCat, files[0])
    e.target.value = ""
    setFileTargetCat(null)
  }, [fileTargetCat, onAddDoc, onDropFiles])

  return (
    <div className="learning-sidebar">
      <div className="learning-search-row">
        <input
          type="text"
          placeholder="Buscar…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="learning-search-input"
          aria-label="Buscar lecciones"
        />
        {onClose && <button type="button" onClick={onClose} className="btn-icon compact" aria-label="Cerrar">✕</button>}
      </div>

      <div className="learning-sidebar-actions">
        <button type="button" className="btn compact learning-new-cat-btn" onClick={() => setShowNewCat((v) => !v)} title="Crear nueva sección (carpeta)">
          ＋ Nueva sección
        </button>
        <input ref={fileInputRef} type="file" accept=".md,.txt,.markdown" style={{ display: "none" }} onChange={onFileInputChange} />
      </div>
      {showNewCat && (
        <div className="learning-new-cat-row">
          <input
            type="text"
            placeholder="Nombre de la sección…"
            value={newCatTitle}
            onChange={(e) => setNewCatTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCreateCategory(); if (e.key === "Escape") setShowNewCat(false) }}
            className="learning-search-input"
            autoFocus
          />
          <button type="button" className="btn compact primary" onClick={handleCreateCategory} disabled={!newCatTitle.trim()}>Crear</button>
          <button type="button" className="btn compact" onClick={() => setShowNewCat(false)}>Cancelar</button>
        </div>
      )}

      <div className="learning-tree" role="list">
        {filtered.map((cat, catIndex) => (
          <div
            key={cat.id}
            className={`learning-cat-group${cat.isCustom ? " is-custom" : ""}${dropCat === cat.id ? " drag-over" : ""}${draggingCat === cat.id ? " dragging" : ""}`}
            draggable={!!onReorderCategory}
            onDragStart={(e) => {
              if (!onReorderCategory) return
              // solo arrastrar desde el header, no desde hijos
              const target = e.target as HTMLElement
              if (!target.closest(".learning-cat-toggle")) { e.preventDefault(); return }
              setDraggingCat(cat.id)
              e.dataTransfer.setData("application/x-learning-category", cat.id)
              e.dataTransfer.effectAllowed = "move"
            }}
            onDragEnd={() => { setDraggingCat(null); setDropCat(null); setDropIndex(null) }}
            onDragOver={(e) => {
              if (draggingCat) {
                e.preventDefault()
                setDropCat(cat.id)
              } else if (draggingLesson) {
                e.preventDefault()
                setDropCat(cat.id)
                // si está sobre la lista vacía, drop al final
                if (cat.items.length === 0) setDropIndex(0)
              } else if (e.dataTransfer.types.includes("Files")) {
                e.preventDefault()
                setDropCat(cat.id)
              }
            }}
            onDragLeave={(e) => {
              const related = e.relatedTarget as HTMLElement | null
              if (!related || !e.currentTarget.contains(related)) {
                if (dropCat === cat.id) setDropCat(null)
              }
            }}
            onDrop={(e) => {
              e.preventDefault()
              // Reorden de categorías
              if (draggingCat && onReorderCategory) {
                const fromId = draggingCat
                const toIdx = catIndex
                if (fromId !== cat.id) onReorderCategory(fromId, toIdx)
                setDraggingCat(null)
                setDropCat(null)
                return
              }
              // Drop de lección interna
              const lessonId = e.dataTransfer.getData("application/x-learning-lesson")
              if (lessonId && onMoveLesson) {
                const toIdx = dropIndex ?? cat.items.length
                onMoveLesson(lessonId, cat.id, toIdx)
                setDraggingLesson(null)
                setDropCat(null)
                setDropIndex(null)
                setOpenCats((prev) => new Set(prev).add(cat.id))
                return
              }
              // Drop de archivos del OS
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                onDropFiles?.(cat.id, e.dataTransfer.files)
                setDropCat(null)
                setOpenCats((prev) => new Set(prev).add(cat.id))
                return
              }
              setDropCat(null)
            }}
          >
            <div className="learning-cat-header-row" style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button type="button" onClick={() => toggleCat(cat.id)} className="learning-cat-toggle" aria-expanded={openCats.has(cat.id)} style={{ flex: 1 }}>
                <span aria-hidden="true" style={{ transition: "transform .14s", transform: openCats.has(cat.id) ? "rotate(90deg)" : "none", display: "inline-block", width: 12 }}>▸</span>
                <span style={{ flex: 1, display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span aria-hidden="true" style={{ fontSize: 12 }}>{cat.isCustom ? "📁" : "📂"}</span>
                  <span>{cat.title}</span>
                  {cat.isCustom && <span className="learning-badge" style={{ fontSize: "0.6rem", padding: "0 4px" }}>custom</span>}
                </span>
                <span className="learning-cat-count">{cat.count}</span>
              </button>
              <button type="button" className="btn-icon compact" title="Añadir documento a esta sección" aria-label="Añadir documento" style={{ flexShrink: 0, width: 26, height: 26, fontSize: 14 }} onClick={() => handleFilePick(cat.id)}>＋</button>
              <button type="button" className="btn-icon compact" title="Crear documento vacío" aria-label="Crear documento vacío" style={{ flexShrink: 0, width: 26, height: 26, fontSize: 12 }} onClick={() => onCreateEmptyDoc?.(cat.id)}>📄</button>
            </div>
            {openCats.has(cat.id) && (
              <ul className="learning-nested-list" role="list">
                {cat.items.map((item, idx) => {
                  const done = !!progress[item.id]?.done
                  const active = item.id === selectedId
                  const isDragging = draggingLesson === item.id
                  const showDropIndicator = dropCat === cat.id && dropIndex === idx
                  return (
                    <li key={item.id} style={{ position: "relative" }}>
                      {showDropIndicator && <div className="drop-indicator" aria-hidden="true" />}
                      <button
                        type="button"
                        draggable={!!onMoveLesson}
                        onDragStart={(e) => {
                          setDraggingLesson(item.id)
                          e.dataTransfer.setData("application/x-learning-lesson", item.id)
                          e.dataTransfer.effectAllowed = "move"
                          // para que el OS lo vea como archivo
                          e.dataTransfer.setData("text/plain", item.title)
                        }}
                        onDragEnd={() => { setDraggingLesson(null); setDropCat(null); setDropIndex(null) }}
                        onDragOver={(e) => {
                          if (!draggingLesson) return
                          e.preventDefault()
                          e.stopPropagation()
                          setDropCat(cat.id)
                          setDropIndex(idx)
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          const lessonId = e.dataTransfer.getData("application/x-learning-lesson")
                          if (lessonId && onMoveLesson) {
                            onMoveLesson(lessonId, cat.id, idx)
                            setOpenCats((prev) => new Set(prev).add(cat.id))
                          }
                          setDraggingLesson(null)
                          setDropCat(null)
                          setDropIndex(null)
                        }}
                        onClick={() => onSelect(item)}
                        className={`learning-item${active ? " active" : ""}${done ? " done" : ""}${isDragging ? " dragging" : ""}${item.isCustom ? " is-custom" : ""}`}
                        title={`${item.title} · ${item.minutes}m · ${item.depth}${item.isCustom ? " · custom" : ""}`}
                      >
                        <span aria-hidden="true" style={{ cursor: "grab", opacity: .5, fontSize: 10, flexShrink: 0 }} title="Arrastrar">⋮⋮</span>
                        <span className="learning-check" aria-hidden="true">{done ? "✓" : ""}</span>
                        <span aria-hidden="true" style={{ fontSize: 12, flexShrink: 0 }}>{item.isCustom ? "📄" : "📃"}</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                        {item.isCustom && <span className="learning-badge" style={{ fontSize: "0.6rem" }}>custom</span>}
                      </button>
                    </li>
                  )
                })}
                {/* zona de drop al final de la lista */}
                <li
                  className={`learning-drop-zone${dropCat === cat.id && dropIndex === cat.items.length ? " drag-over" : ""}`}
                  onDragOver={(e) => {
                    if (draggingLesson || e.dataTransfer.types.includes("Files")) {
                      e.preventDefault()
                      setDropCat(cat.id)
                      setDropIndex(cat.items.length)
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    const lessonId = e.dataTransfer.getData("application/x-learning-lesson")
                    if (lessonId && onMoveLesson) {
                      onMoveLesson(lessonId, cat.id, cat.items.length)
                      setOpenCats((prev) => new Set(prev).add(cat.id))
                    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      onDropFiles?.(cat.id, e.dataTransfer.files)
                      setOpenCats((prev) => new Set(prev).add(cat.id))
                    }
                    setDraggingLesson(null)
                    setDropCat(null)
                    setDropIndex(null)
                  }}
                  style={{ height: cat.items.length === 0 ? 32 : 10, borderRadius: 6, margin: "2px 0" }}
                  aria-hidden="true"
                >
                  {cat.items.length === 0 && dropCat === cat.id && <span style={{ fontSize: ".72rem", color: "var(--muted)", padding: "6px 8px", display: "block" }}>Soltá archivos acá</span>}
                  {cat.items.length === 0 && dropCat !== cat.id && <span style={{ fontSize: ".72rem", color: "var(--muted)", padding: "6px 8px", display: "block", opacity: .6 }}>Vacío — arrastrá lecciones o archivos .md</span>}
                </li>
                {dropCat === cat.id && dropIndex === cat.items.length && cat.items.length > 0 && <div className="drop-indicator" aria-hidden="true" />}
              </ul>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="subtle" style={{ padding: "1rem", textAlign: "center" }}>Sin resultados.</p>}
        {/* drop global para reordenar categorías al final */}
        <div
          className={`learning-cat-drop-end${dropCat === "__end__" ? " drag-over" : ""}`}
          onDragOver={(e) => {
            if (draggingCat) { e.preventDefault(); setDropCat("__end__") }
          }}
          onDrop={(e) => {
            e.preventDefault()
            const catId = e.dataTransfer.getData("application/x-learning-category")
            if (catId && onReorderCategory) {
              onReorderCategory(catId, manifest.categories.length)
            }
            setDraggingCat(null)
            setDropCat(null)
          }}
          style={{ height: 16 }}
        />
      </div>
    </div>
  )
}
