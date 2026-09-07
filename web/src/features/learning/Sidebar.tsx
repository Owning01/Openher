// Sidebar jerárquica con búsqueda + drag & drop + secciones custom. — styles/learning.css
import { useMemo, useState, useCallback, useRef, useEffect } from "react"
import { CheckIcon, ChevronRightIcon, CloseIcon, FileIcon, NewFileIcon, PlusIcon, TrashIcon } from "../../Icons"
import { useT } from "../../i18n-context"
import type { LearningManifest, LearningLesson, LearningProgress } from "./types"

interface Props {
  manifest: LearningManifest
  progress: LearningProgress
  selectedId: string | null
  hideCompleted?: boolean
  onSelect: (lesson: LearningLesson) => void
  onMoveLesson?: (lessonId: string, toCategoryId: string, toIndex: number) => void
  onReorderCategory?: (categoryId: string, toIndex: number) => void
  onCreateCategory?: (title: string) => void
  onAddDoc?: (categoryId: string, file: File) => void
  onCreateEmptyDoc?: (categoryId: string) => void
  onDeleteDoc?: (lessonId: string) => void
  onDeleteCategory?: (categoryId: string) => void
  onDropFiles?: (categoryId: string, files: FileList) => void
  onClose?: () => void
  autoFocusSearch?: boolean
  newDocCat?: string | null
  newDocTitle?: string
  onNewDocTitleChange?: (v: string) => void
  onNewDocSubmit?: (categoryId: string, title: string) => void
  onNewDocCancel?: () => void
}

export function LearningSidebar({ manifest, progress, selectedId, hideCompleted, onSelect, onMoveLesson, onReorderCategory, onCreateCategory, onAddDoc, onCreateEmptyDoc, onDeleteDoc, onDeleteCategory, onDropFiles, onClose, autoFocusSearch, newDocCat, newDocTitle, onNewDocTitleChange, onNewDocSubmit, onNewDocCancel }: Props) {
  const t = useT()
  const [query, setQuery] = useState("")
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(manifest.categories.map((c) => c.id)))
  const [draggingLesson, setDraggingLesson] = useState<string | null>(null)
  const [draggingCat, setDraggingCat] = useState<string | null>(null)
  const [dropCat, setDropCat] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [showNewCat, setShowNewCat] = useState(false)
  const [newCatTitle, setNewCatTitle] = useState("")
  const [pendingDelete, setPendingDelete] = useState<{ kind: "lesson" | "category"; id: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [fileTargetCat, setFileTargetCat] = useState<string | null>(null)
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (deleteTimer.current) clearTimeout(deleteTimer.current) }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return manifest.categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) =>
            (!hideCompleted || !progress[it.id]?.done) &&
            (!q || it.title.toLowerCase().includes(q) || it.categoryTitle.toLowerCase().includes(q) || (it.subCategory?.toLowerCase().includes(q) ?? false)),
        ),
      }))
      .filter((c) => c.items.length > 0 || (q === "" && !hideCompleted))
  }, [manifest, query, hideCompleted, progress])

  const toggleCat = useCallback((id: string) => {
    setOpenCats((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }, [])

  const armDelete = useCallback((kind: "lesson" | "category", id: string) => {
    setPendingDelete({ kind, id })
    if (deleteTimer.current) clearTimeout(deleteTimer.current)
    deleteTimer.current = setTimeout(() => setPendingDelete(null), 3000)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!pendingDelete) return
    if (deleteTimer.current) clearTimeout(deleteTimer.current)
    if (pendingDelete.kind === "lesson") onDeleteDoc?.(pendingDelete.id)
    else onDeleteCategory?.(pendingDelete.id)
    setPendingDelete(null)
  }, [pendingDelete, onDeleteDoc, onDeleteCategory])

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

  const clearSearch = useCallback(() => setQuery(""), [])

  // ---- DnD categorías ----
  const onCatDragStart = useCallback((e: React.DragEvent, catId: string) => {
    if (!onReorderCategory) return
    const target = e.target as HTMLElement
    if (!target.closest(".learning-cat-toggle")) { e.preventDefault(); return }
    setDraggingCat(catId)
    e.dataTransfer.setData("application/x-learning-category", catId)
    e.dataTransfer.effectAllowed = "move"
  }, [onReorderCategory])

  const onCatDragEnd = useCallback(() => { setDraggingCat(null); setDropCat(null); setDropIndex(null) }, [])

  const onCatDragOver = useCallback((e: React.DragEvent, catId: string, itemCount: number) => {
    if (draggingCat || draggingLesson) {
      e.preventDefault()
      setDropCat(catId)
      if (itemCount === 0) setDropIndex(0)
    } else if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault()
      setDropCat(catId)
    }
  }, [draggingCat, draggingLesson])

  const onCatDragLeave = useCallback((e: React.DragEvent, catId: string, current: string | null) => {
    const related = e.relatedTarget as HTMLElement | null
    if ((!related || !e.currentTarget.contains(related)) && current === catId) setDropCat(null)
  }, [])

  const onCatDrop = useCallback((e: React.DragEvent, catId: string, catIndex: number, itemCount: number) => {
    e.preventDefault()
    if (draggingCat && onReorderCategory) {
      if (draggingCat !== catId) onReorderCategory(draggingCat, catIndex)
      setDraggingCat(null)
      setDropCat(null)
      return
    }
    const lessonId = e.dataTransfer.getData("application/x-learning-lesson")
    if (lessonId && onMoveLesson) {
      onMoveLesson(lessonId, catId, dropIndex ?? itemCount)
      setDraggingLesson(null)
      setDropCat(null)
      setDropIndex(null)
      setOpenCats((prev) => new Set(prev).add(catId))
      return
    }
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles?.(catId, e.dataTransfer.files)
      setDropCat(null)
      setOpenCats((prev) => new Set(prev).add(catId))
      return
    }
    setDropCat(null)
  }, [draggingCat, dropIndex, onMoveLesson, onReorderCategory, onDropFiles])

  // ---- DnD lecciones ----
  const onLessonDragStart = useCallback((e: React.DragEvent, item: LearningLesson) => {
    setDraggingLesson(item.id)
    e.dataTransfer.setData("application/x-learning-lesson", item.id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", item.title)
  }, [])

  const onLessonDragEnd = useCallback(() => { setDraggingLesson(null); setDropCat(null); setDropIndex(null) }, [])

  const onLessonDragOver = useCallback((e: React.DragEvent, catId: string, idx: number) => {
    if (!draggingLesson) return
    e.preventDefault()
    e.stopPropagation()
    setDropCat(catId)
    setDropIndex(idx)
  }, [draggingLesson])

  const onLessonDrop = useCallback((e: React.DragEvent, catId: string, idx: number) => {
    e.preventDefault()
    e.stopPropagation()
    const lessonId = e.dataTransfer.getData("application/x-learning-lesson")
    if (lessonId && onMoveLesson) {
      onMoveLesson(lessonId, catId, idx)
      setOpenCats((prev) => new Set(prev).add(catId))
    }
    setDraggingLesson(null)
    setDropCat(null)
    setDropIndex(null)
  }, [onMoveLesson])

  const onEndZoneDragOver = useCallback((e: React.DragEvent) => {
    if (draggingLesson || e.dataTransfer.types.includes("Files")) {
      e.preventDefault()
      setDropCat("__end__items__")
    }
  }, [draggingLesson])

  const onEndZoneDrop = useCallback((e: React.DragEvent, catId: string, itemCount: number) => {
    e.preventDefault()
    const lessonId = e.dataTransfer.getData("application/x-learning-lesson")
    if (lessonId && onMoveLesson) {
      onMoveLesson(lessonId, catId, itemCount)
      setOpenCats((prev) => new Set(prev).add(catId))
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles?.(catId, e.dataTransfer.files)
      setOpenCats((prev) => new Set(prev).add(catId))
    }
    setDraggingLesson(null)
    setDropCat(null)
    setDropIndex(null)
  }, [onMoveLesson, onDropFiles])

  const onCatDropEnd = useCallback((e: React.DragEvent, total: number) => {
    e.preventDefault()
    const catId = e.dataTransfer.getData("application/x-learning-category")
    if (catId && onReorderCategory) onReorderCategory(catId, total)
    setDraggingCat(null)
    setDropCat(null)
  }, [onReorderCategory])

  return (
    <div className="learning-sidebar">
      <div className="learning-search-row">
        <input
          type="search"
          placeholder={t("learning.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Escape") setQuery("") }}
          className="learning-search-input"
          aria-label={t("learning.search")}
          autoFocus={autoFocusSearch}
        />
        {onClose && <button type="button" onClick={onClose} className="btn-icon compact" aria-label={t("learning.close")}><CloseIcon size={15} /></button>}
      </div>

      <div className="learning-sidebar-actions">
        <button type="button" className="btn compact learning-new-cat-btn" onClick={() => setShowNewCat((v) => !v)} title={t("learning.newSection")} aria-expanded={showNewCat}>
          <PlusIcon size={14} aria-hidden="true" /> {t("learning.newSection")}
        </button>
        <input ref={fileInputRef} type="file" accept=".md,.txt,.markdown" multiple style={{ display: "none" }} onChange={onFileInputChange} aria-hidden="true" tabIndex={-1} />
      </div>
      {showNewCat && (
        <form className="learning-new-cat-row" onSubmit={(e) => { e.preventDefault(); handleCreateCategory() }}>
          <input
            type="text"
            placeholder={t("learning.sectionName")}
            value={newCatTitle}
            onChange={(e) => setNewCatTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setShowNewCat(false) }}
            className="learning-search-input"
            aria-label={t("learning.sectionName")}
            autoFocus
          />
          <button type="submit" className="btn compact primary" disabled={!newCatTitle.trim()}>{t("learning.create")}</button>
          <button type="button" className="btn compact" onClick={() => setShowNewCat(false)}>{t("common.cancel")}</button>
        </form>
      )}

      <div className="learning-tree" role="list" aria-label={t("learning.title")}>
        {filtered.map((cat, catIndex) => {
          const isOpen = openCats.has(cat.id)
          return (
            <div
              key={cat.id}
              className={`learning-cat-group${cat.isCustom ? " is-custom" : ""}${dropCat === cat.id ? " drag-over" : ""}${draggingCat === cat.id ? " dragging" : ""}`}
              draggable={!!onReorderCategory}
              onDragStart={(e) => onCatDragStart(e, cat.id)}
              onDragEnd={onCatDragEnd}
              onDragOver={(e) => onCatDragOver(e, cat.id, cat.items.length)}
              onDragLeave={(e) => onCatDragLeave(e, cat.id, dropCat)}
              onDrop={(e) => onCatDrop(e, cat.id, catIndex, cat.items.length)}
            >
              <div className="learning-cat-header-row">
                <button type="button" onClick={() => toggleCat(cat.id)} className="learning-cat-toggle" aria-expanded={isOpen} aria-label={`${cat.title} (${cat.count})`}>
                  <ChevronRightIcon size={14} aria-hidden="true" style={{ transition: "transform .14s", transform: isOpen ? "rotate(90deg)" : "none", flexShrink: 0 }} />
                  <span className="learning-cat-toggle-title">{cat.title}</span>
                  {cat.isCustom && <span className="learning-badge learning-badge-mini">{t("learning.custom")}</span>}
                  <span className="learning-cat-count" style={{ fontVariantNumeric: "tabular-nums" }}>{cat.count}</span>
                </button>
                <span className="learning-cat-tools" role="group" aria-label={cat.title}>
                  <button type="button" className="btn-icon compact" title={t("learning.addDoc")} aria-label={`${t("learning.addDoc")}: ${cat.title}`} onClick={() => handleFilePick(cat.id)}>
                    <PlusIcon size={14} />
                  </button>
                  <button type="button" className="btn-icon compact" title={t("learning.newDoc")} aria-label={`${t("learning.newDoc")}: ${cat.title}`} onClick={() => onCreateEmptyDoc?.(cat.id)}>
                    <NewFileIcon size={14} />
                  </button>
                  {cat.isCustom && onDeleteCategory && (
                    <button
                      type="button"
                      className={`btn-icon compact${pendingDelete?.kind === "category" && pendingDelete.id === cat.id ? " danger-armed" : ""}`}
                      title={pendingDelete?.kind === "category" && pendingDelete.id === cat.id ? t("common.confirmDelete") : t("learning.deleteSection")}
                      aria-label={`${t("learning.deleteSection")}: ${cat.title}`}
                      onClick={() => {
                        if (pendingDelete?.kind === "category" && pendingDelete.id === cat.id) confirmDelete()
                        else armDelete("category", cat.id)
                      }}
                    >
                      <TrashIcon size={14} />
                    </button>
                  )}
                </span>
              </div>
              {newDocCat === cat.id && (
                <form className="learning-new-cat-row" onSubmit={(e) => { e.preventDefault(); onNewDocSubmit?.(cat.id, newDocTitle ?? "") }}>
                  <input
                    type="text"
                    placeholder={t("learning.docName")}
                    value={newDocTitle ?? ""}
                    onChange={(e) => onNewDocTitleChange?.(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Escape") onNewDocCancel?.() }}
                    className="learning-search-input"
                    aria-label={t("learning.docName")}
                    autoFocus
                  />
                  <button type="submit" className="btn compact primary" disabled={!(newDocTitle ?? "").trim()}>{t("learning.create")}</button>
                  <button type="button" className="btn compact" onClick={onNewDocCancel}>{t("common.cancel")}</button>
                </form>
              )}
              {isOpen && (
                <ul className="learning-nested-list" role="list">
                  {cat.items.map((item, idx) => {
                    const done = !!progress[item.id]?.done
                    const active = item.id === selectedId
                    const isDragging = draggingLesson === item.id
                    const showDropIndicator = dropCat === cat.id && dropIndex === idx
                    const armed = pendingDelete?.kind === "lesson" && pendingDelete.id === item.id
                    return (
                      <li key={item.id} className="learning-nested-item">
                        {showDropIndicator && <div className="drop-indicator" aria-hidden="true" />}
                        <div className="learning-item-row">
                          <button
                            type="button"
                            draggable={!!onMoveLesson}
                            onDragStart={(e) => onLessonDragStart(e, item)}
                            onDragEnd={onLessonDragEnd}
                            onDragOver={(e) => onLessonDragOver(e, cat.id, idx)}
                            onDrop={(e) => onLessonDrop(e, cat.id, idx)}
                            onClick={() => onSelect(item)}
                            className={`learning-item${active ? " active" : ""}${done ? " done" : ""}${isDragging ? " dragging" : ""}${item.isCustom ? " is-custom" : ""}`}
                            aria-current={active ? "true" : undefined}
                            title={`${item.title} · ${item.minutes}m · ${item.depth}${item.isCustom ? ` · ${t("learning.custom")}` : ""}`}
                          >
                            <span className="learning-check" aria-hidden="true">{done ? <CheckIcon size={12} /> : null}</span>
                            <FileIcon size={13} aria-hidden="true" />
                            <span className="learning-item-title">{item.title}</span>
                          </button>
                          {item.isCustom && onDeleteDoc && (
                            <button
                              type="button"
                              className={`btn-icon compact learning-item-del${armed ? " danger-armed" : ""}`}
                              title={armed ? t("common.confirmDelete") : t("learning.deleteDoc")}
                              aria-label={`${t("learning.deleteDoc")}: ${item.title}`}
                              onClick={() => {
                                if (armed) confirmDelete()
                                else armDelete("lesson", item.id)
                              }}
                            >
                              <TrashIcon size={12} />
                            </button>
                          )}
                        </div>
                      </li>
                    )
                  })}
                  {/* zona de drop al final de la lista */}
                  <li
                    className={`learning-drop-zone${dropCat === cat.id && dropIndex === cat.items.length ? " drag-over" : ""}`}
                    onDragOver={onEndZoneDragOver}
                    onDrop={(e) => onEndZoneDrop(e, cat.id, cat.items.length)}
                    aria-hidden="true"
                  >
                    {cat.items.length === 0 && dropCat === cat.id && <span className="learning-drop-hint">{t("learning.dropHere")}</span>}
                    {cat.items.length === 0 && dropCat !== cat.id && <span className="learning-drop-hint dim">{t("learning.emptyCat")}</span>}
                  </li>
                  {dropCat === cat.id && dropIndex === cat.items.length && cat.items.length > 0 && <div className="drop-indicator" aria-hidden="true" />}
                </ul>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="learning-empty">
            <p className="learning-empty-title">{t("learning.noResults")}</p>
            {(query.trim() || hideCompleted) && <button type="button" className="btn compact" onClick={clearSearch}>{t("learning.clearSearch")}</button>}
          </div>
        )}
        {/* drop global para reordenar categorías al final */}
        <div
          className={`learning-cat-drop-end${dropCat === "__end__" ? " drag-over" : ""}`}
          onDragOver={(e) => { if (draggingCat) { e.preventDefault(); setDropCat("__end__") } }}
          onDrop={(e) => onCatDropEnd(e, manifest.categories.length)}
          style={{ height: 16 }}
        />
      </div>
    </div>
  )
}
