// @ts-nocheck
// LearningPage — entry del plugin. Lazy-loaded. Estilos en styles/learning.css
import { useCallback, useEffect, useMemo, useState } from "react"
import { loadProgress, markDone, markVisited } from "./progress.ts"
import { GraduationCapIcon, PanelLeftIcon } from "../../Icons.tsx"
import { LearningSidebar } from "./Sidebar.tsx"
import { LessonView } from "./LessonView.tsx"
import { shouldShowDiagram } from "./diagrams.tsx"
import type { LearningManifest, LearningLesson, LearningProgress } from "./types.ts"
import { loadCustomCategories, saveCustomCategories, saveCustomDoc, createCustomCategory, createCustomLesson, persistLessonMove, persistCategoryOrder } from "./customStore.ts"
import { loadManifest, invalidateManifestCache, cacheLessonContent } from "./data.ts"

type MobilePane = "list" | "lesson"

const LEVEL_ICON: Record<number, string> = {
 0: "◈", // fundamentos
 1: "⬢", // herramientas
 2: "⬣", // web/sistemas/agentes
 3: "⬔", // post/op
 4: "⬥", // ops/inject
}

export default function LearningPage() {
 const [manifest, setManifest] = useState<LearningManifest | null>(null)
 const [error, setError] = useState<string | null>(null)
 const [progress, setProgress] = useState<LearningProgress>(loadProgress)
 const [selected, setSelected] = useState<LearningLesson | null>(null)
 const [mobilePane, setMobilePane] = useState<MobilePane>("list")
 const [sidebarOpen, setSidebarOpen] = useState(false)
 const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
  try { return localStorage.getItem("learning:sidebarCollapsed") === "1" } catch { return false }
 })

 const flatLessons = useMemo(() => manifest ? manifest.categories.flatMap((c) => c.items) : [], [manifest])
 const currentIndex = useMemo(() => selected ? flatLessons.findIndex((l) => l.id === selected.id) : -1, [flatLessons, selected])

 useEffect(() => {
  let cancelled = false
  loadManifest().then((m) => { if (!cancelled) setManifest(m) }).catch((e) => { if (!cancelled) setError(String(e)) })
  return () => { cancelled = true }
 }, [])

 const handleSelect = (lesson: LearningLesson) => {
  setSelected(lesson)
  setMobilePane("lesson")
  setSidebarOpen(false)
  markVisited(lesson.id)
  setProgress(loadProgress())
 }
 const handleToggleDone = (id: string, done: boolean) => setProgress(markDone(id, done))
 const goPrev = () => { if (currentIndex > 0) handleSelect(flatLessons[currentIndex - 1]) }
 const goNext = () => { if (currentIndex >= 0 && currentIndex < flatLessons.length - 1) handleSelect(flatLessons[currentIndex + 1]) }

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
  } catch (e) { setError(String(e)) }
 }, [])

 const handleMoveLesson = useCallback((lessonId: string, toCategoryId: string, toIndex: number) => {
  if (!manifest) return
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
 }, [manifest])

 const handleReorderCategory = useCallback((categoryId: string, toIndex: number) => {
  if (!manifest) return
  const ids = manifest.categories.map(c => c.id)
  const fromIdx = ids.indexOf(categoryId)
  if (fromIdx === -1) return
  const nextIds = [...ids]
  nextIds.splice(fromIdx, 1)
  const clamped = Math.max(0, Math.min(toIndex, nextIds.length))
  nextIds.splice(clamped, 0, categoryId)
  persistCategoryOrder(nextIds)
  setManifest((prev) => {
   if (!prev) return prev
   const map = new Map(prev.categories.map(c => [c.id, c] as const))
   const ordered = nextIds.map(id => map.get(id)!).filter(Boolean)
   for (const c of prev.categories) if (!nextIds.includes(c.id)) ordered.push(c)
   return { ...prev, categories: ordered }
  })
 }, [manifest])

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
  let target = allCats.find(c => c.id === categoryId) || cats.find(c => c.id === categoryId)
  if (!target) return
  const lesson = createCustomLesson(target, file.name, text)
  saveCustomDoc(lesson.id, text)
  cacheLessonContent(lesson.id, text)
  if (target.isCustom) {
   const updatedCats = cats.map(c => c.id === categoryId ? { ...c, items: [...c.items, lesson], count: c.items.length + 1 } : c)
   // si no estaba en cats (es base custom? no debería)
   const found = cats.some(c => c.id === categoryId)
   if (found) saveCustomCategories(updatedCats)
   else {
    // fallback: agregar a primera custom o crear pool
    if (cats.length > 0) {
     cats[0].items.push(lesson)
     cats[0].count = cats[0].items.length
     saveCustomCategories(cats)
    } else {
     const pool: import("./types.ts").LearningCategory = { id: "__custom_pool__", title: "Mis docs", level: 2, description: "Documentos importados", count: 1, items: [lesson], isCustom: true }
     saveCustomCategories([pool])
    }
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
  setTimeout(() => handleSelect(lesson), 100)
 }, [manifest])

 const handleCreateEmptyDoc = useCallback(async (categoryId: string) => {
  const title = prompt("Nombre del nuevo documento (sin extensión):")
  if (!title) return
  const fileName = title.trim().replace(/\.md$/i, "") + ".md"
  const content = `# ${title.trim()}\n\nEscribí tu contenido acá...\n`
  const fakeFile = new File([content], fileName, { type: "text/markdown" })
  await handleAddDoc(categoryId, fakeFile)
 }, [handleAddDoc])

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
  const onKey = (e: KeyboardEvent) => {
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
 }, [])

 if (error) return <div className="learning-center"><p style={{ color: "var(--danger)" }}>Error: {error}</p></div>
 if (!manifest) return <div className="learning-center"><p className="subtle">Cargando curriculum…</p></div>

 const totalDone = manifest.categories.reduce((a, c) => a + c.items.filter((it) => progress[it.id]?.done).length, 0)
 const percent = Math.round((totalDone / manifest.totalLessons) * 100)

 const showDashboard = mobilePane !== "lesson" || !selected
 const showLesson = !!selected

 return (
  <div className="learning-page">
   <header className="learning-topbar">
    <button type="button" onClick={() => setSidebarOpen(true)} className="btn-icon compact learning-menu-btn" aria-label="Menú"></button>
    <h2 className="learning-brand" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><GraduationCapIcon size={18} /> Aprendizaje</h2>
    <button
     type="button"
     onClick={() => setSidebarCollapsed((v) => !v)}
     className="btn-icon compact learning-dock-btn"
     aria-label={sidebarCollapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
     aria-expanded={!sidebarCollapsed}
     title={sidebarCollapsed ? "Acoplar barra (Ctrl+B)" : "Desacoplar barra (Ctrl+B)"}
     style={{ marginLeft: 8 }}
    >
     <PanelLeftIcon size={16} />
    </button>
    <span className="learning-stat" style={{ marginLeft: "auto" }}>{manifest.totalLessons} lecciones</span>
    <span className="learning-stat" style={{ color: percent === 100 ? "var(--success)" : undefined }}>{percent}%</span>
   </header>

   <div className="learning-layout">
    <aside className={`learning-desktop-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
     <LearningSidebar
      manifest={manifest}
      progress={progress}
      selectedId={selected?.id ?? null}
      onSelect={handleSelect}
      onMoveLesson={handleMoveLesson}
      onReorderCategory={handleReorderCategory}
      onCreateCategory={handleCreateCategory}
      onAddDoc={handleAddDoc}
      onCreateEmptyDoc={handleCreateEmptyDoc}
      onDropFiles={handleDropFiles}
     />
    </aside>
    <button
     type="button"
     className="learning-sidebar-toggle"
     onClick={() => setSidebarCollapsed((v) => !v)}
     aria-label={sidebarCollapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
     aria-expanded={!sidebarCollapsed}
     title={sidebarCollapsed ? "Mostrar" : "Ocultar"}
    >
     {sidebarCollapsed ? "»" : "«"}
    </button>

    <main className="learning-main">
     {showDashboard && <Dashboard manifest={manifest} progress={progress} onSelect={handleSelect} totalDone={totalDone} />}
     {showLesson && (
      <LessonView
       lesson={selected!}
       progress={progress}
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
      <div className="learning-mobile-panel" onClick={(e) => e.stopPropagation()}>
       <LearningSidebar
        manifest={manifest}
        progress={progress}
        selectedId={selected?.id ?? null}
        onSelect={handleSelect}
        onMoveLesson={handleMoveLesson}
        onReorderCategory={handleReorderCategory}
        onCreateCategory={handleCreateCategory}
        onAddDoc={handleAddDoc}
        onCreateEmptyDoc={handleCreateEmptyDoc}
        onDropFiles={handleDropFiles}
        onClose={() => setSidebarOpen(false)}
       />
      </div>
     </div>
    )}
   </div>
  </div>
 )
}

function Dashboard({ manifest, progress, onSelect, totalDone }: {
 manifest: LearningManifest
 progress: LearningProgress
 onSelect: (lesson: LearningLesson) => void
 totalDone: number
}) {
 const totalLessons = manifest.totalLessons
 const pct = Math.round((totalDone / totalLessons) * 100)

 return (
  <div className="learning-dash-scroll">
   {/* Roadmap visual */}
   <div className="learning-roadmap">
    <div className="learning-roadmap-head">
     <h3 className="learning-roadmap-title">Ruta de aprendizaje</h3>
     <span className="learning-roadmap-meta">{totalDone}/{totalLessons} · {pct}%</span>
    </div>
    <div className="learning-progress-track" style={{ margin: "0 0 10px" }}><div className="learning-progress-fill" style={{ width: `${pct}%` }} /></div>
    <RoadmapDiagram categories={manifest.categories} progress={progress} />
    <p className="learning-roadmap-hint">Tocá una tarjeta para abrir sus lecciones. El orden vertical es el orden recomendado.</p>
   </div>

   <div className="learning-dash-grid">
    {manifest.categories.map((cat) => {
     const done = cat.items.filter((it) => progress[it.id]?.done).length
     const catPct = Math.round((done / cat.count) * 100)
     return (
      <section key={cat.id} className="learning-cat-card">
       <div className="learning-cat-card-header">
        <div className="learning-icon-wrap" data-level={cat.level} aria-hidden="true">{LEVEL_ICON[cat.level] ?? "⬥"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
         <h3 className="learning-cat-title">{cat.title}</h3>
         <p className="learning-cat-meta">Nivel {cat.level} · {done}/{cat.count} · {catPct}%</p>
        </div>
       </div>
       <p className="learning-cat-desc" style={{ padding: "0 14px 8px" }}>{cat.description}</p>
       <div className="learning-progress-track"><div className="learning-progress-fill" style={{ width: `${catPct}%` }} /></div>
       <ul className="learning-cat-list">
        {cat.items.slice(0, 6).map((item) => {
         const isDone = !!progress[item.id]?.done
         return (
          <li key={item.id}>
           <button type="button" onClick={() => onSelect(item)} className={`learning-lesson-row${isDone ? " done" : ""}`}>
            <span className="learning-check" aria-hidden="true">{isDone ? "OK" : "○"}</span>
            <span className="learning-depth-dot" data-depth={item.depth} title={item.depth} aria-hidden="true" />
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
             {item.subCategory && <em style={{ fontStyle: "normal", opacity: .7 }}>{item.subCategory}: </em>}{item.title}
            </span>
            <span className="learning-time">{item.minutes}m</span>
           </button>
          </li>
         )
        })}
       </ul>
       {cat.count > 6 && <p className="learning-more-hint">…y {cat.count - 6} más en el menú lateral</p>}
      </section>
     )
    })}
   </div>
  </div>
 )
}

/** Diagrama del roadmap como SVG inline (sin dependencias externas). */
function RoadmapDiagram({ categories, progress }: { categories: LearningManifest["categories"]; progress: LearningProgress }) {
 const W = 720
 const H = 64
 const pad = 16
 const n = categories.length
 const step = (W - pad * 2) / Math.max(1, n - 1)
 const cy = 30
 return (
  <div className="learning-diagram" style={{ padding: 10 }}>
   <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} role="img" aria-label="Roadmap de niveles">
    {/* línea base */}
    <line x1={pad} y1={cy} x2={W - pad} y2={cy} stroke="var(--border)" strokeWidth={2} strokeLinecap="round" />
    {categories.map((cat, i) => {
     const x = pad + i * step
     const done = cat.items.filter((it) => progress[it.id]?.done).length
     const ratio = done / cat.count
     const r = 13 + ratio * 4
     const fill = ratio === 1 ? "var(--success)" : ratio > 0 ? "var(--primary)" : "var(--surface-strong)"
     const stroke = ratio > 0 ? "var(--primary)" : "var(--border-strong)"
     return (
      <g key={cat.id}>
       <circle cx={x} cy={cy} r={r} fill={fill} stroke={stroke} strokeWidth={1.4} />
       <text x={x} y={cy + 0.35} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={800} fill={ratio > 0.4 ? "#fff" : "var(--muted-strong)"}>{i}</text>
       <text x={x} y={H - 4} textAnchor="middle" fontSize={7.5} fill="var(--muted)" fontWeight={600}>{cat.title.split(" ")[0]}</text>
       <title>{`${cat.title}: ${done}/${cat.count} completadas`}</title>
      </g>
     )
    })}
    {/* flecha final */}
    <polygon points={`${W - pad + 6},${cy - 5} ${W - pad + 6},${cy + 5} ${W - pad + 12},${cy}`} fill="var(--border-strong)" />
   </svg>
  </div>
 )
}
