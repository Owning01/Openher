// Vista de una lección: carga markdown y lo renderiza con el Markdown compartido.
import { useEffect, useState } from "react"
import { Markdown } from "../../components/Markdown.tsx"
import { loadLesson } from "./data.ts"
import type { LearningLesson, LearningProgress } from "./types.ts"

interface LessonViewProps {
  lesson: LearningLesson
  progress: LearningProgress
  onToggleDone: (id: string, done: boolean) => void
  onBack?: () => void
  onPrev?: () => void
  onNext?: () => void
}

export function LessonView({ lesson, progress, onToggleDone, onBack, onPrev, onNext }: LessonViewProps) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setContent(null)
    setError(null)
    loadLesson(lesson)
      .then((md) => { if (!cancelled) setContent(md) })
      .catch((err) => { if (!cancelled) setError(String(err)) })
    return () => { cancelled = true }
  }, [lesson])

  const done = !!progress[lesson.id]?.done

  return (
    <article className="learning-lesson" style={articleStyle}>
      <header style={headerStyle}>
        {onBack && (
          <button type="button" onClick={onBack} className="btn-icon compact" aria-label="Volver" style={backStyle}>←</button>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={titleStyle}>{lesson.title}</h1>
          <div style={metaStyle}>
            <span className="learning-badge" style={badgeStyle}>{lesson.categoryTitle}</span>
            {lesson.subCategory && <span className="learning-badge" style={{ ...badgeStyle, background: "var(--border)" }}>{lesson.subCategory}</span>}
            <span style={depthStyle}>Profundidad: {lesson.depth}</span>
            <span style={depthStyle}>~{lesson.minutes} min</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleDone(lesson.id, !done)}
          className={`btn${done ? " primary" : ""}`}
          style={doneBtnStyle}
        >
          {done ? "✓ Completada" : "Marcar completada"}
        </button>
      </header>

      <div className="learning-content markdown-body" style={contentWrapStyle}>
        {content === null && !error && <p style={{ color: "var(--muted)", padding: "2rem", textAlign: "center" }}>Cargando…</p>}
        {error && <p style={{ color: "#ef4444", padding: "2rem", textAlign: "center" }}>Error cargando lección: {error}</p>}
        {content !== null && <Markdown text={content} />}
      </div>

      {(onPrev || onNext) && (
        <footer style={footerNavStyle}>
          {onPrev ? <button type="button" onClick={onPrev} className="btn">← Anterior</button> : <span />}
          {onNext ? <button type="button" onClick={onNext} className="btn primary">Siguiente →</button> : <span />}
        </footer>
      )}
    </article>
  )
}

const articleStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
}
const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: ".75rem",
  padding: ".75rem 1rem",
  borderBottom: "1px solid var(--border)",
  flexWrap: "wrap",
}
const backStyle: React.CSSProperties = { flexShrink: 0 }
const titleStyle: React.CSSProperties = { margin: 0, fontSize: "1.125rem", lineHeight: 1.3 }
const metaStyle: React.CSSProperties = { display: "flex", gap: ".5rem", alignItems: "center", flexWrap: "wrap", marginTop: ".25rem", fontSize: ".75rem" }
const badgeStyle: React.CSSProperties = { padding: ".125rem .5rem", borderRadius: "999px", background: "rgba(99,102,241,.15)", color: "var(--fg)", fontSize: ".6875rem" }
const depthStyle: React.CSSProperties = { color: "var(--muted)" }
const doneBtnStyle: React.CSSProperties = { flexShrink: 0, fontSize: ".8125rem" }
const contentWrapStyle: React.CSSProperties = { flex: 1, overflowY: "auto", padding: "1rem 1.25rem", minHeight: 0 }
const footerNavStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: ".5rem 1rem",
  borderTop: "1px solid var(--border)",
  gap: ".5rem",
}
