// LearningPage — entry del plugin. Lazy-loaded. Estilos en styles/learning.css
import { useEffect, useMemo, useState } from "react"
import { loadManifest } from "./data.ts"
import { loadProgress, markDone, markVisited } from "./progress.ts"
import { LearningSidebar } from "./Sidebar.tsx"
import { LessonView } from "./LessonView.tsx"
import { shouldShowDiagram } from "./diagrams.tsx"
import type { LearningManifest, LearningLesson, LearningProgress } from "./types.ts"

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

  useEffect(() => {
    try { localStorage.setItem("learning:sidebarCollapsed", sidebarCollapsed ? "1" : "0") } catch { /* ignore */ }
  }, [sidebarCollapsed])

  if (error) return <div className="learning-center"><p style={{ color: "var(--danger)" }}>Error: {error}</p></div>
  if (!manifest) return <div className="learning-center"><p className="subtle">Cargando curriculum…</p></div>

  const totalDone = manifest.categories.reduce((a, c) => a + c.items.filter((it) => progress[it.id]?.done).length, 0)
  const percent = Math.round((totalDone / manifest.totalLessons) * 100)

  const showDashboard = mobilePane !== "lesson" || !selected
  const showLesson = !!selected
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

  return (
    <div className="learning-page">
      <header className="learning-topbar">
        <button type="button" onClick={() => setSidebarOpen(true)} className="btn-icon compact learning-menu-btn" aria-label="Menú">☰</button>
        <h2 className="learning-brand">📚 Aprendizaje</h2>
        <span className="learning-stat">{manifest.totalLessons} lecciones</span>
        <span className="learning-stat" style={{ color: percent === 100 ? "var(--success)" : undefined }}>{percent}%</span>
      </header>

      <div className="learning-layout">
        <aside className={`learning-desktop-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
          <LearningSidebar manifest={manifest} progress={progress} selectedId={selected?.id ?? null} onSelect={handleSelect} />
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
              <LearningSidebar manifest={manifest} progress={progress} selectedId={selected?.id ?? null} onSelect={handleSelect} onClose={() => setSidebarOpen(false)} />
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
                        <span className="learning-check" aria-hidden="true">{isDone ? "✓" : "○"}</span>
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
