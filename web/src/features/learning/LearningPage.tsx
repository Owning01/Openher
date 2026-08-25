// LearningPage — entry del plugin de formación. Lazy-loaded desde App.tsx.
import { useEffect, useMemo, useState } from "react"
import { loadManifest } from "./data.ts"
import { loadProgress, markDone, markVisited } from "./progress.ts"
import { LearningSidebar } from "./Sidebar.tsx"
import { LessonView } from "./LessonView.tsx"
import type { LearningManifest, LearningLesson, LearningProgress } from "./types.ts"

type MobilePane = "list" | "lesson"

export default function LearningPage() {
  const [manifest, setManifest] = useState<LearningManifest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<LearningProgress>(loadProgress)
  const [selected, setSelected] = useState<LearningLesson | null>(null)
  const [mobilePane, setMobilePane] = useState<MobilePane>("list")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Lista plana en orden curricular para navegación prev/next.
  const flatLessons = useMemo(() => {
    if (!manifest) return []
    return manifest.categories.flatMap((c) => c.items)
  }, [manifest])

  const currentIndex = useMemo(() => {
    if (!selected) return -1
    return flatLessons.findIndex((l) => l.id === selected.id)
  }, [flatLessons, selected])

  useEffect(() => {
    let cancelled = false
    loadManifest()
      .then((m) => { if (!cancelled) setManifest(m) })
      .catch((err) => { if (!cancelled) setError(String(err)) })
    return () => { cancelled = true }
  }, [])

  const handleSelect = (lesson: LearningLesson) => {
    setSelected(lesson)
    setMobilePane("lesson")
    setSidebarOpen(false)
    markVisited(lesson.id)
    setProgress(loadProgress())
  }

  const handleToggleDone = (id: string, done: boolean) => {
    setProgress(markDone(id, done))
  }

  const goPrev = () => { if (currentIndex > 0) handleSelect(flatLessons[currentIndex - 1]) }
  const goNext = () => { if (currentIndex >= 0 && currentIndex < flatLessons.length - 1) handleSelect(flatLessons[currentIndex + 1]) }

  if (error) {
    return (
      <div style={centerStyle}>
        <p style={{ color: "#ef4444" }}>Error cargando plataforma: {error}</p>
      </div>
    )
  }

  if (!manifest) {
    return <div style={centerStyle}><p style={{ color: "var(--muted)" }}>Cargando curriculum…</p></div>
  }

  const totalDone = manifest.categories.reduce(
    (acc, cat) => acc + cat.items.filter((it) => progress[it.id]?.done).length,
    0,
  )
  const percent = Math.round((totalDone / manifest.totalLessons) * 100)

  return (
    <div className="learning-page" style={pageStyle}>
      {/* Header */}
      <header style={topBarStyle}>
        <button type="button" onClick={() => setSidebarOpen(true)} className="btn-icon compact learning-menu-btn" aria-label="Menú" style={{ display: sidebarOpen ? undefined : undefined }}>
          ☰
        </button>
        <h2 style={brandStyle}>📚 Aprendizaje</h2>
        <span style={statStyle}>{manifest.totalLessons} lecciones</span>
        <span style={statStyle}>{percent}% completado</span>
      </header>

      {/* Layout desktop: sidebar fija + contenido */}
      <div style={layoutStyle}>
        <aside style={{ ...desktopSidebarStyle }} className="learning-desktop-sidebar">
          <LearningSidebar
            manifest={manifest}
            progress={progress}
            selectedId={selected?.id ?? null}
            onSelect={handleSelect}
          />
        </aside>

        <main style={mainStyle} className="learning-main">
          {mobilePane === "lesson" && selected ? null : (
            <Dashboard manifest={manifest} progress={progress} onSelect={handleSelect} />
          )}
          {(mobilePane === "lesson" || window.innerWidth > 768) && selected && (
            <LessonView
              lesson={selected}
              progress={progress}
              onToggleDone={handleToggleDone}
              onBack={() => { setMobilePane("list"); setSelected(null) }}
              onPrev={currentIndex > 0 ? goPrev : undefined}
              onNext={currentIndex < flatLessons.length - 1 ? goNext : undefined}
            />
          )}
        </main>

        {/* Sidebar móvil como overlay */}
        {sidebarOpen && (
          <div style={mobileOverlayStyle} onClick={() => setSidebarOpen(false)}>
            <div style={mobileSidebarStyle} onClick={(e) => e.stopPropagation()}>
              <LearningSidebar
                manifest={manifest}
                progress={progress}
                selectedId={selected?.id ?? null}
                onSelect={handleSelect}
                onClose={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        )}
      </div>

      <style>{cssOverrides}</style>
    </div>
  )
}

function Dashboard({ manifest, progress, onSelect }: {
  manifest: LearningManifest
  progress: LearningProgress
  onSelect: (lesson: LearningLesson) => void
}) {
  return (
    <div style={dashStyle}>
      {manifest.categories.map((cat) => {
        const doneCount = cat.items.filter((it) => progress[it.id]?.done).length
        return (
          <section key={cat.id} style={dashCatStyle}>
            <header style={dashCatHeaderStyle}>
              <h3 style={dashTitleStyle}>{cat.title}</h3>
              <span style={dashMetaStyle}>Nivel {cat.level} · {doneCount}/{cat.count} completadas</span>
            </header>
            <p style={dashDescStyle}>{cat.description}</p>
            <ul style={dashListStyle}>
              {cat.items.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => onSelect(item)} style={dashItemBtnStyle} title={`${item.minutes} min · ${item.depth}`}>
                    {progress[item.id]?.done && <span style={{ color: "#10b981", marginRight: ".35rem" }}>✓</span>}
                    <span>{item.subCategory && <em style={dashSubStyle}>{item.subCategory}: </em>}{item.title}</span>
                    <span style={dashMinStyle}>{item.minutes}m</span>
                  </button>
                </li>
              ))}
            </ul>
            {cat.count > 6 && (
              <p style={{ fontSize: ".75rem", color: "var(--muted)", marginTop: ".25rem" }}>
                …y {cat.count - 6} más. Usá el menú para ver todas.
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}

// Estilos inline autocontenidos — el plugin no toca CSS global.
const pageStyle: React.CSSProperties = { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }
const topBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: ".75rem",
  padding: ".5rem .75rem",
  borderBottom: "1px solid var(--border)",
  flexShrink: 0,
}
const brandStyle: React.CSSProperties = { margin: 0, fontSize: "1rem", fontWeight: 600, flex: 1 }
const statStyle: React.CSSProperties = { fontSize: ".75rem", color: "var(--muted)", whiteSpace: "nowrap" }
const layoutStyle: React.CSSProperties = { display: "flex", flex: 1, minHeight: 0, position: "relative" }
const desktopSidebarStyle: React.CSSProperties = {
  width: 260,
  borderRight: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  flexShrink: 0,
}
const mainStyle: React.CSSProperties = { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }
const mobileOverlayStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  background: "rgba(0,0,0,.5)",
  zIndex: 50,
  display: "flex",
}
const mobileSidebarStyle: React.CSSProperties = {
  width: "min(80vw, 300px)",
  background: "var(--bg)",
  borderRight: "1px solid var(--border)",
  height: "100%",
  animation: "slideInLeft .15s ease-out",
}
const centerStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: "2rem" }
const dashStyle: React.CSSProperties = { padding: "1rem", overflowY: "auto", flex: 1, display: "grid", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", alignContent: "start" }
const dashCatStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: ".5rem", padding: ".875rem", background: "var(--bg-secondary)" }
const dashCatHeaderStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: ".5rem", flexWrap: "wrap" }
const dashTitleStyle: React.CSSProperties = { margin: 0, fontSize: ".9375rem", fontWeight: 600 }
const dashMetaStyle: React.CSSProperties = { fontSize: ".6875rem", color: "var(--muted)" }
const dashDescStyle: React.CSSProperties = { margin: ".25rem 0 .5rem", fontSize: ".8125rem", color: "var(--muted)" }
const dashListStyle: React.CSSProperties = { listStyle: "none", margin: 0, padding: 0, display: "grid", gap: ".25rem" }
const dashItemBtnStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: ".5rem",
  width: "100%",
  padding: ".375rem .5rem",
  borderRadius: ".25rem",
  background: "transparent",
  border: "none",
  color: "var(--fg)",
  cursor: "pointer",
  textAlign: "left",
  fontSize: ".8125rem",
}
const dashSubStyle: React.CSSProperties = { fontStyle: "italic", opacity: .8 }
const dashMinStyle: React.CSSProperties = { fontSize: ".6875rem", color: "var(--muted)", flexShrink: 0 }

// CSS responsivo mínimo para móvil/desktop switch.
const cssOverrides = `
.learning-desktop-sidebar { display: none; }
@media (min-width: 769px) {
  .learning-desktop-sidebar { display: block; }
  .learning-menu-btn { display: none !important; }
}
@keyframes slideInLeft {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
`
