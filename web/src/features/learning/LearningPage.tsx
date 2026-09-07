// LearningPage — entry del plugin. Lazy-loaded. Estilos en styles/learning.css
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { loadProgress, markDone, markVisited, markCategoryDone, resetProgress, lastVisitedLesson, recentLessons } from "./progress"
import { GraduationCapIcon, PanelLeftIcon, PlayIcon, EyeIcon, EyeOffIcon, HistoryIcon, RefreshIcon, ChevronDownIcon, ChevronRightIcon, CheckIcon, SearchIcon } from "../../Icons"
import { useT } from "../../i18n-context"
import { LearningSidebar } from "./Sidebar"
import { LessonView } from "./LessonView"
import { shouldShowDiagram } from "./diagrams"
import type { LearningManifest, LearningLesson, LearningProgress } from "./types"
import { loadCustomCategories, saveCustomCategories, saveCustomDoc, deleteCustomDoc, createCustomCategory, createCustomLesson, persistLessonMove, persistCategoryOrder, removeCustomCategory } from "./customStore"
import { loadManifest, invalidateManifestCache, cacheLessonContent } from "./data"

type MobilePane = "list" | "lesson"

const LEVEL_ICON: Record<number, string> = {
  0: "◈", // fundamentos
  1: "⬢", // herramientas
  2: "⬣", // web/sistemas/agentes
  3: "⬔", // post/op
  4: "⬥", // ops/inject
}

export default function LearningPage() {
  const t = useT()
  const [manifest, setManifest] = useState<LearningManifest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<LearningProgress>(loadProgress)
  const [selected, setSelected] = useState<LearningLesson | null>(null)
  const [mobilePane, setMobilePane] = useState<MobilePane>("list")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hideCompleted, setHideCompleted] = useState<boolean>(() => {
    try { return localStorage.getItem("learning:hideCompleted") === "1" } catch { return false }
  })
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [confirmReset, setConfirmReset] = useState(false)
  const [newDocCat, setNewDocCat] = useState<string | null>(null)
  const [newDocTitle, setNewDocTitle] = useState("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem("learning:sidebarCollapsed") === "1" } catch { return false }
  })
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flatLessons = useMemo(() => manifest ? manifest.categories.flatMap((c) => c.items) : [], [manifest])
  const currentIndex = useMemo(() => selected ? flatLessons.findIndex((l) => l.id === selected.id) : -1, [flatLessons, selected])
  const resumeLesson = useMemo(() => {
    if (!manifest || selected) return null
    const id = lastVisitedLesson(progress)
    if (!id) return null
    return flatLessons.find((l) => l.id === id) ?? null
  }, [manifest, progress, selected, flatLessons])
  const remainingMinutes = useMemo(() => {
    if (!manifest) return 0
    return manifest.categories.reduce((a, c) => a + c.items.reduce((b, it) => b + (progress[it.id]?.done ? 0 : it.minutes), 0), 0)
  }, [manifest, progress])
  const recent = useMemo(() => {
    if (!manifest) return []
    const byId = new Map(flatLessons.map((l) => [l.id, l] as const))
    return recentLessons(progress)
      .filter((id) => id !== resumeLesson?.id)
      .map((id) => byId.get(id))
      .filter((l): l is LearningLesson => !!l)
      .slice(0, 4)
  }, [manifest, progress, flatLessons, resumeLesson])

  useEffect(() => {
    let cancelled = false
    loadManifest().then((m) => { if (!cancelled) setManifest(m) }).catch((e) => { if (!cancelled) setError(String(e)) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => () => { if (resetTimer.current) clearTimeout(resetTimer.current) }, [])

  const handleSelect = useCallback((lesson: LearningLesson) => {
    setSelected(lesson)
    setMobilePane("lesson")
    setSidebarOpen(false)
    markVisited(lesson.id)
    setProgress(loadProgress())
  }, [])

  const handleToggleDone = useCallback((id: string, done: boolean) => setProgress(markDone(id, done)), [])

  const goPrev = useCallback(() => { if (currentIndex > 0) handleSelect(flatLessons[currentIndex - 1]) }, [currentIndex, flatLessons, handleSelect])
  const goNext = useCallback(() => { if (currentIndex >= 0 && currentIndex < flatLessons.length - 1) handleSelect(flatLessons[currentIndex + 1]) }, [currentIndex, flatLessons, handleSelect])

  const isFirstInCategory = useMemo(() => {
    if (!selected || !manifest) return false
    const cat = manifest.categories.find((c) => c.id === selected.category)
    if (!cat) return false
    // Solo cuenta como "primero" si es el primer doc COMPLEJO de la sección
    // (para categorías selectivas como 01/02, el primer doc simple no debería mostrar diagrama)
    const firstComplex = cat.items.find((it) => shouldShowDiagram(it))
    if (firstComplex) return firstComplex.id === selected.id
    return cat.items[0]?.id === selected.id && shouldShowDiagram(selected)
  }, [selected, manifest])

  const reloadWithCustom = useCallback(async () => {
    invalidateManifestCache()
    try {
      const m = await loadManifest()
      setManifest(m)
      return m
    } catch (e) { setError(String(e)); return null }
  }, [])

  const handleMoveLesson = useCallback((lessonId: string, toCategoryId: string, toIndex: number) => {
    persistLessonMove(lessonId, toCategoryId, toIndex)
    setManifest((prev) => {
      if (!prev) return prev
      const lessonMap = new Map<string, LearningLesson>()
      for (const c of prev.categories) for (const it of c.items) lessonMap.set(it.id, it)
      const lesson = lessonMap.get(lessonId)
      if (!lesson) return prev
      const nextCats = prev.categories.map(c => ({ ...c, items: c.items.filter(it => it.id !== lessonId) }))
      const target = nextCats.find(c => c.id === toCategoryId)
      if (!target) return prev
      const updated: LearningLesson = { ...lesson, category: toCategoryId, categoryTitle: target.title }
      const idx = Math.max(0, Math.min(toIndex, target.items.length))
      target.items.splice(idx, 0, updated)
      for (const c of nextCats) c.count = c.items.length
      return { ...prev, categories: nextCats, totalLessons: nextCats.reduce((a, c) => a + c.items.length, 0) }
    })
  }, [])

  const handleReorderCategory = useCallback((categoryId: string, toIndex: number) => {
    setManifest((prev) => {
      if (!prev) return prev
      const ids = prev.categories.map(c => c.id)
      const fromIdx = ids.indexOf(categoryId)
      if (fromIdx === -1) return prev
      const nextIds = [...ids]
      nextIds.splice(fromIdx, 1)
      const clamped = Math.max(0, Math.min(toIndex, nextIds.length))
      nextIds.splice(clamped, 0, categoryId)
      persistCategoryOrder(nextIds)
      const map = new Map(prev.categories.map(c => [c.id, c] as const))
      const ordered = nextIds.map(id => map.get(id)!).filter(Boolean)
      for (const c of prev.categories) if (!nextIds.includes(c.id)) ordered.push(c)
      return { ...prev, categories: ordered }
    })
  }, [])

  const handleCreateCategory = useCallback(async (title: string) => {
    const newCat = createCustomCategory(title)
    const existing = loadCustomCategories()
    saveCustomCategories([...existing, newCat])
    await reloadWithCustom()
  }, [reloadWithCustom])

  const handleAddDoc = useCallback(async (categoryId: string, file: File) => {
    const text = await file.text()
    const cats = loadCustomCategories()
    const allCats = manifest ? [...manifest.categories] : []
    const target = allCats.find(c => c.id === categoryId) || cats.find(c => c.id === categoryId)
    if (!target) return
    const lesson = createCustomLesson(target, file.name, text)
    saveCustomDoc(lesson.id, text)
    cacheLessonContent(lesson.id, text)
    if (target.isCustom) {
      const found = cats.some(c => c.id === categoryId)
      if (found) {
        saveCustomCategories(cats.map(c => c.id === categoryId ? { ...c, items: [...c.items, lesson], count: c.items.length + 1 } : c))
      } else if (cats.length > 0) {
        cats[0].items.push(lesson)
        cats[0].count = cats[0].items.length
        saveCustomCategories(cats)
      } else {
        saveCustomCategories([{ id: "__custom_pool__", title: "Mis docs", level: 2, description: "Documentos importados", count: 1, items: [lesson], isCustom: true }])
      }
      await reloadWithCustom()
    } else {
      // categoría base: persistir movimiento para que aparezca ahí
      persistLessonMove(lesson.id, categoryId, target.items.length)
      // guardar lección en pool custom para que applyCustom la encuentre
      let pool = cats.find(c => c.id === "__custom_pool__")
      if (!pool && cats.length === 0) {
        pool = { id: "__custom_pool__", title: "Mis docs", level: 2, description: "Documentos importados", count: 0, items: [], isCustom: true }
        cats.push(pool)
      }
      if (pool) {
        pool.items.push(lesson)
        pool.count = pool.items.length
        saveCustomCategories(cats)
      } else if (cats.length > 0) {
        cats[0].items.push(lesson)
        cats[0].count = cats[0].items.length
        saveCustomCategories(cats)
      }
      await reloadWithCustom()
    }
    handleSelect(lesson)
  }, [manifest, reloadWithCustom, handleSelect])

  const handleCreateEmptyDoc = useCallback(async (categoryId: string, title: string) => {
    const clean = title.trim().replace(/\.md$/i, "")
    if (!clean) return
    const content = `# ${clean}\n\nEscribí tu contenido acá...\n`
    await handleAddDoc(categoryId, new File([content], `${clean}.md`, { type: "text/markdown" }))
    setNewDocCat(null)
    setNewDocTitle("")
  }, [handleAddDoc])

  const handleDeleteDoc = useCallback(async (lessonId: string) => {
    const cats = loadCustomCategories().map(c => ({ ...c, items: c.items.filter(it => it.id !== lessonId) }))
    for (const c of cats) c.count = c.items.length
    saveCustomCategories(cats.filter(c => c.id !== "__custom_pool__" || c.items.length > 0))
    deleteCustomDoc(lessonId)
    const { removeLessonMove } = await import("./customStore")
    removeLessonMove(lessonId)
    setSelected((prev) => (prev?.id === lessonId ? null : prev))
    await reloadWithCustom()
  }, [reloadWithCustom])

  const handleDeleteCategory = useCallback(async (categoryId: string) => {
    setSelected((prev) => (prev?.category === categoryId ? null : prev))
    removeCustomCategory(categoryId)
    await reloadWithCustom()
  }, [reloadWithCustom])

  const handleMarkCatDone = useCallback((categoryId: string) => {
    const cat = manifest?.categories.find((c) => c.id === categoryId)
    if (!cat) return
    const ids = cat.items.map((it) => it.id)
    const allDone = cat.items.every((it) => progress[it.id]?.done)
    setProgress(markCategoryDone(ids, !allDone))
  }, [manifest, progress])

  const handleReset = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true)
      if (resetTimer.current) clearTimeout(resetTimer.current)
      resetTimer.current = setTimeout(() => setConfirmReset(false), 3000)
      return
    }
    if (resetTimer.current) clearTimeout(resetTimer.current)
    setConfirmReset(false)
    setProgress(resetProgress())
  }, [confirmReset])

  const handleGotoCat = useCallback((categoryId: string) => {
    setExpandedCats((prev) => new Set(prev).add(categoryId))
    requestAnimationFrame(() => {
      document.getElementById(`learning-cat-${categoryId}`)?.scrollIntoView?.({ behavior: "smooth", block: "start" })
    })
  }, [])

  const handleOpenPending = useCallback((categoryId: string) => {
    const cat = manifest?.categories.find((c) => c.id === categoryId)
    if (!cat) return
    const pending = cat.items.find((it) => !progress[it.id]?.done) ?? cat.items[0]
    if (pending) handleSelect(pending)
  }, [manifest, progress, handleSelect])

  const toggleExpandCat = useCallback((categoryId: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }, [])

  const handleDropFiles = useCallback(async (categoryId: string, files: FileList) => {
    for (const file of Array.from(files)) {
      if (file.name.endsWith(".md") || file.name.endsWith(".txt") || file.type.startsWith("text/") || file.name.endsWith(".markdown")) {
        await handleAddDoc(categoryId, file)
      }
    }
  }, [handleAddDoc])

  useEffect(() => {
    try { localStorage.setItem("learning:sidebarCollapsed", sidebarCollapsed ? "1" : "0") } catch { /* ignore */ }
  }, [sidebarCollapsed])

  useEffect(() => {
    try { localStorage.setItem("learning:hideCompleted", hideCompleted ? "1" : "0") } catch { /* ignore */ }
  }, [hideCompleted])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && sidebarOpen) { setSidebarOpen(false); return }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        // solo cuando el foco está dentro de learning
        const target = e.target as HTMLElement | null
        if (target && target.closest && target.closest(".learning-page")) {
          e.preventDefault()
          setSidebarCollapsed((v) => !v)
        } else if (!target || target === document.body) {
          // permitir también cuando no hay foco específico pero estamos en learning
          const inLearning = document.querySelector(".learning-page")
          if (inLearning) {
            e.preventDefault()
            setSidebarCollapsed((v) => !v)
          }
        }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [sidebarOpen])

  if (error) return (
    <div className="learning-center">
      <div className="learning-empty">
        <p className="learning-empty-title">{t("common.error")}</p>
        <p className="subtle">{String(error)}</p>
        <button type="button" className="btn primary" onClick={() => { setError(null); loadManifest().then(setManifest).catch((e) => setError(String(e))) }}>
          <RefreshIcon size={15} /> {t("learning.retry")}
        </button>
      </div>
    </div>
  )
  if (!manifest) return (
    <div className="learning-page" aria-busy="true" aria-label={t("learning.loadingCurriculum")}>
      <div className="learning-dash-scroll">
        <div className="learning-roadmap"><div className="learning-skeleton" style={{ height: 90 }} /></div>
        <div className="learning-dash-grid" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} className="learning-skeleton-card"><div className="learning-skeleton" style={{ height: 56 }} /><div className="learning-skeleton" style={{ height: 12 }} /><div className="learning-skeleton" style={{ height: 12, width: "70%" }} /></div>)}
        </div>
      </div>
    </div>
  )

  const totalDone = manifest.categories.reduce((a, c) => a + c.items.filter((it) => progress[it.id]?.done).length, 0)
  const percent = manifest.totalLessons > 0 ? Math.round((totalDone / manifest.totalLessons) * 100) : 0

  const showDashboard = mobilePane !== "lesson" || !selected
  const showLesson = !!selected

  return (
    <div className="learning-page">
      <header className="learning-topbar">
        <button type="button" onClick={() => setSidebarOpen(true)} className="btn-icon compact learning-menu-btn" aria-label={t("learning.menu")}>
          <PanelLeftIcon size={16} />
        </button>
        <h2 className="learning-brand" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><GraduationCapIcon size={18} /> {t("learning.title")}</h2>
        <button
          type="button"
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="btn-icon compact learning-dock-btn"
          aria-label={t("learning.menu")}
          aria-expanded={!sidebarCollapsed}
          title="Ctrl+B"
          style={{ marginLeft: 8 }}
        >
          <PanelLeftIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="btn-icon compact learning-search-btn"
          aria-label={t("learning.searchOpen")}
          title={t("learning.search")}
        >
          <SearchIcon size={15} />
        </button>
        <button
          type="button"
          onClick={() => setHideCompleted((v) => !v)}
          className={`btn-icon compact learning-visibility-btn${hideCompleted ? " active" : ""}`}
          aria-pressed={hideCompleted}
          title={hideCompleted ? t("learning.showCompleted") : t("learning.hideCompleted")}
          aria-label={hideCompleted ? t("learning.showCompleted") : t("learning.hideCompleted")}
        >
          {hideCompleted ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={`btn-icon compact${confirmReset ? " danger-armed" : ""}`}
          title={confirmReset ? t("learning.resetConfirm") : t("learning.reset")}
          aria-label={confirmReset ? t("learning.resetConfirm") : t("learning.reset")}
        >
          <HistoryIcon size={15} />
        </button>
        <span className="learning-stat learning-stat-lessons" style={{ marginLeft: "auto" }}>{t("learning.lessons", { count: manifest.totalLessons })}</span>
        <span className="learning-stat learning-stat-remaining">{t("learning.remaining", { count: remainingMinutes })}</span>
        <span className="learning-stat" style={{ color: percent === 100 ? "var(--success)" : undefined, fontVariantNumeric: "tabular-nums" }}>{percent}%</span>
      </header>

      <div className="learning-layout">
        <aside className={`learning-desktop-sidebar ${sidebarCollapsed ? "collapsed" : ""}`} aria-label={t("learning.title")} aria-hidden={sidebarCollapsed}>
          <LearningSidebar
            manifest={manifest}
            progress={progress}
            selectedId={selected?.id ?? null}
            hideCompleted={hideCompleted}
            onSelect={handleSelect}
            onMoveLesson={handleMoveLesson}
            onReorderCategory={handleReorderCategory}
            onCreateCategory={handleCreateCategory}
            onAddDoc={handleAddDoc}
            onCreateEmptyDoc={(catId) => { setNewDocCat(catId); setNewDocTitle("") }}
            onDeleteDoc={handleDeleteDoc}
            onDeleteCategory={handleDeleteCategory}
            onDropFiles={handleDropFiles}
            newDocCat={newDocCat}
            newDocTitle={newDocTitle}
            onNewDocTitleChange={setNewDocTitle}
            onNewDocSubmit={handleCreateEmptyDoc}
            onNewDocCancel={() => { setNewDocCat(null); setNewDocTitle("") }}
          />
        </aside>
        <button
          type="button"
          className="learning-sidebar-toggle"
          onClick={() => setSidebarCollapsed((v) => !v)}
          aria-label={t("learning.menu")}
          aria-expanded={!sidebarCollapsed}
          title={sidebarCollapsed ? t("learning.showAll") : t("learning.showLess")}
        >
          {sidebarCollapsed ? <ChevronRightIcon size={14} /> : <ChevronDownIcon size={14} style={{ transform: "rotate(90deg)" }} />}
        </button>

        <main className="learning-main">
          {showDashboard && (
            <Dashboard
              manifest={manifest}
              progress={progress}
              hideCompleted={hideCompleted}
              expandedCats={expandedCats}
              resumeLesson={resumeLesson}
              recent={recent}
              onSelect={handleSelect}
              onOpenPending={handleOpenPending}
              onGotoCat={handleGotoCat}
              onToggleExpand={toggleExpandCat}
              onMarkCatDone={handleMarkCatDone}
              totalDone={totalDone}
            />
          )}
          {showLesson && (
            <LessonView
              lesson={selected!}
              progress={progress}
              lessonIndex={currentIndex}
              totalLessons={flatLessons.length}
              isFirstInCategory={isFirstInCategory}
              onToggleDone={handleToggleDone}
              onBack={() => { setMobilePane("list"); setSelected(null) }}
              onPrev={currentIndex > 0 ? goPrev : undefined}
              onNext={currentIndex < flatLessons.length - 1 ? goNext : undefined}
            />
          )}
        </main>

        {sidebarOpen && (
          <div className="learning-mobile-overlay" onClick={() => setSidebarOpen(false)}>
            <div className="learning-mobile-panel" role="dialog" aria-modal="true" aria-label={t("learning.title")} onClick={(e) => e.stopPropagation()}>
              <LearningSidebar
                manifest={manifest}
                progress={progress}
                selectedId={selected?.id ?? null}
                hideCompleted={hideCompleted}
                onSelect={handleSelect}
                onMoveLesson={handleMoveLesson}
                onReorderCategory={handleReorderCategory}
                onCreateCategory={handleCreateCategory}
                onAddDoc={handleAddDoc}
                onCreateEmptyDoc={(catId) => { setNewDocCat(catId); setNewDocTitle("") }}
                onDeleteDoc={handleDeleteDoc}
                onDeleteCategory={handleDeleteCategory}
                onDropFiles={handleDropFiles}
                onClose={() => setSidebarOpen(false)}
                autoFocusSearch
                newDocCat={newDocCat}
                newDocTitle={newDocTitle}
                onNewDocTitleChange={setNewDocTitle}
                onNewDocSubmit={handleCreateEmptyDoc}
                onNewDocCancel={() => { setNewDocCat(null); setNewDocTitle("") }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Dashboard({ manifest, progress, hideCompleted, expandedCats, resumeLesson, recent, onSelect, onOpenPending, onGotoCat, onToggleExpand, onMarkCatDone, totalDone }: {
  manifest: LearningManifest
  progress: LearningProgress
  hideCompleted: boolean
  expandedCats: Set<string>
  resumeLesson: LearningLesson | null
  recent: LearningLesson[]
  onSelect: (lesson: LearningLesson) => void
  onOpenPending: (categoryId: string) => void
  onGotoCat: (categoryId: string) => void
  onToggleExpand: (categoryId: string) => void
  onMarkCatDone: (categoryId: string) => void
  totalDone: number
}) {
  const t = useT()
  const totalLessons = manifest.totalLessons
  const pct = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0

  return (
    <div className="learning-dash-scroll">
      {/* Roadmap visual */}
      <div className="learning-roadmap">
        <div className="learning-roadmap-head">
          <h3 className="learning-roadmap-title">{t("learning.route")}</h3>
          <span className="learning-roadmap-meta" style={{ fontVariantNumeric: "tabular-nums" }}>{totalDone}/{totalLessons} · {pct}%</span>
        </div>
        <div className="learning-progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t("learning.route")} style={{ margin: "0 0 10px" }}><div className="learning-progress-fill" style={{ width: `${pct}%` }} /></div>
        <RoadmapDiagram categories={manifest.categories} progress={progress} onGotoCat={onGotoCat} />
        <p className="learning-roadmap-hint">{t("learning.routeHint")}</p>
      </div>

      {resumeLesson && (
        <button type="button" className="learning-resume" onClick={() => onSelect(resumeLesson)}>
          <span className="learning-resume-icon" aria-hidden="true"><PlayIcon size={16} /></span>
          <span className="learning-resume-text">
            <span className="learning-resume-label">{t("learning.resume")}</span>
            <span className="learning-resume-lesson">{resumeLesson.categoryTitle} · {resumeLesson.title}</span>
          </span>
          <ChevronRightIcon size={16} aria-hidden="true" />
        </button>
      )}

      {recent.length > 0 && (
        <nav className="learning-recent" aria-label={t("learning.recent")}>
          <span className="learning-recent-label">{t("learning.recent")}</span>
          <ul className="learning-recent-list">
            {recent.map((l) => {
              const isDone = !!progress[l.id]?.done
              return (
                <li key={l.id}>
                  <button type="button" onClick={() => onSelect(l)} className={`learning-recent-chip${isDone ? " done" : ""}`}>
                    {isDone && <CheckIcon size={11} aria-hidden="true" />}
                    <span className="learning-item-title">{l.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      )}

      <div className="learning-dash-grid">
        {manifest.categories.map((cat) => {
          const visible = hideCompleted ? cat.items.filter((it) => !progress[it.id]?.done) : cat.items
          if (hideCompleted && visible.length === 0) return null
          const done = cat.items.filter((it) => progress[it.id]?.done).length
          const catPct = cat.count > 0 ? Math.round((done / cat.count) * 100) : 0
          const expanded = expandedCats.has(cat.id)
          const shown = expanded ? visible : visible.slice(0, 6)
          const hidden = visible.length - shown.length
          return (
            <section key={cat.id} id={`learning-cat-${cat.id}`} className="learning-cat-card" aria-label={cat.title}>
              <div className="learning-cat-card-header">
                <button
                  type="button"
                  className="learning-cat-card-open"
                  onClick={() => onOpenPending(cat.id)}
                  title={t("learning.openPending")}
                  aria-label={`${t("learning.openPending")}: ${cat.title}`}
                >
                  <span className="learning-icon-wrap" data-level={cat.level} aria-hidden="true">{LEVEL_ICON[cat.level] ?? "⬥"}</span>
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 className="learning-cat-title">{cat.title}</h3>
                  <p className="learning-cat-meta" style={{ fontVariantNumeric: "tabular-nums" }}>{t("learning.level")} {cat.level} · {done}/{cat.count} · {catPct}%</p>
                </div>
                <button
                  type="button"
                  className="btn-icon compact"
                  onClick={() => onMarkCatDone(cat.id)}
                  title={t("learning.markCatDone")}
                  aria-label={`${t("learning.markCatDone")}: ${cat.title}`}
                  aria-pressed={done === cat.count && cat.count > 0}
                >
                  <CheckIcon size={15} />
                </button>
              </div>
              <p className="learning-cat-desc" style={{ padding: "0 14px 8px" }}>{cat.description}</p>
              <div className="learning-progress-track" role="progressbar" aria-valuenow={catPct} aria-valuemin={0} aria-valuemax={100} aria-label={cat.title}><div className="learning-progress-fill" style={{ width: `${catPct}%` }} /></div>
              <ul className="learning-cat-list">
                {shown.map((item) => {
                  const isDone = !!progress[item.id]?.done
                  return (
                    <li key={item.id}>
                      <button type="button" onClick={() => onSelect(item)} className={`learning-lesson-row${isDone ? " done" : ""}`}>
                        <span className="learning-check" aria-hidden="true">{isDone ? <CheckIcon size={12} /> : null}</span>
                        <span className="learning-depth-dot" data-depth={item.depth} title={item.depth} aria-hidden="true" />
                        <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.subCategory && <em style={{ fontStyle: "normal", opacity: .7 }}>{item.subCategory}: </em>}{item.title}
                        </span>
                        <span className="learning-depth-label">{item.depth}</span>
                        <span className="learning-time" style={{ fontVariantNumeric: "tabular-nums" }}>{t("learning.minutes", { count: item.minutes })}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {visible.length === 0 && <p className="learning-more-hint">{t("learning.showCompleted")}</p>}
              {hidden > 0 && (
                <button type="button" className="learning-more-btn" onClick={() => onToggleExpand(cat.id)} aria-expanded={expanded}>
                  {t("learning.andMore", { count: hidden })} · {t("learning.showAll")}
                </button>
              )}
              {expanded && visible.length > 6 && (
                <button type="button" className="learning-more-btn" onClick={() => onToggleExpand(cat.id)} aria-expanded={expanded}>
                  {t("learning.showLess")}
                </button>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}

/** Diagrama del roadmap como SVG inline (sin dependencias externas). Nodos accionables. */
function RoadmapDiagram({ categories, progress, onGotoCat }: { categories: LearningManifest["categories"]; progress: LearningProgress; onGotoCat: (categoryId: string) => void }) {
  const t = useT()
  const W = 720
  const H = 64
  const pad = 24
  const n = categories.length
  const step = (W - pad * 2) / Math.max(1, n - 1)
  const cy = 28
  return (
    <div className="learning-diagram learning-roadmap-diagram" style={{ padding: 10 }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="group" aria-label={t("learning.route")}>
        {/* línea base */}
        <line x1={pad} y1={cy} x2={W - pad} y2={cy} stroke="var(--border)" strokeWidth={2} strokeLinecap="round" />
        {categories.map((cat, i) => {
          const x = pad + i * step
          const done = cat.items.filter((it) => progress[it.id]?.done).length
          const ratio = cat.count > 0 ? done / cat.count : 0
          const r = 15 + ratio * 4
          const fill = ratio === 1 ? "var(--success)" : ratio > 0 ? "var(--primary)" : "var(--surface-strong)"
          const stroke = ratio > 0 ? "var(--primary)" : "var(--border-strong)"
          return (
            <g key={cat.id} role="button" tabIndex={0} aria-label={`${cat.title}: ${done}/${cat.count}`}
              onClick={() => onGotoCat(cat.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onGotoCat(cat.id) } }}
              style={{ cursor: "pointer" }}>
              <title>{`${cat.title}: ${done}/${cat.count} completadas`}</title>
              <circle cx={x} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={1.4} />
              {ratio === 1 ? (
                <path d={`M ${x - 5} ${cy} l 3.5 3.5 L ${x + 5} ${cy - 4}`} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" />
              ) : (
                <text x={x} y={cy + 0.35} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={800} fill={ratio > 0.4 ? "#fff" : "var(--muted-strong)"} aria-hidden="true">{String(i + 1)}</text>
              )}
              <text x={x} y={H - 4} textAnchor="middle" fontSize={7.5} fill="var(--muted)" fontWeight={600} aria-hidden="true">{cat.title.split(" ")[0]}</text>
            </g>
          )
        })}
        {/* flecha final */}
        <polygon points={`${W - pad + 6},${cy - 5} ${W - pad + 6},${cy + 5} ${W - pad + 12},${cy}`} fill="var(--border-strong)" aria-hidden="true" />
      </svg>
    </div>
  )
}

export function LearningSearchEmpty({ onClear }: { onClear: () => void }) {
  const t = useT()
  return (
    <div className="learning-empty">
      <span className="learning-empty-icon" aria-hidden="true"><SearchIcon size={22} /></span>
      <p className="learning-empty-title">{t("learning.noResults")}</p>
      <button type="button" className="btn compact" onClick={onClear}>{t("learning.clearSearch")}</button>
    </div>
  )
}
