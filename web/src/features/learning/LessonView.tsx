// Lector de lección — TOC autogenerado + diagrama editorial del tema + wrapper tipográfico.
import { useEffect, useMemo, useState } from "react"
import { Markdown } from "../../components/Markdown.tsx"
import { loadLesson } from "./data.ts"
import { DiagramForLesson, shouldShowDiagram } from "./diagrams.tsx"
import type { LearningLesson, LearningProgress } from "./types.ts"

interface Props {
  lesson: LearningLesson
  progress: LearningProgress
  isFirstInCategory?: boolean
  onToggleDone: (id: string, done: boolean) => void
  onBack?: () => void
  onPrev?: () => void
  onNext?: () => void
}

interface TocItem { level: number; text: string; id: string }

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
}

function extractToc(md: string): TocItem[] {
  const out: TocItem[] = []
  const seen = new Set<string>()
  for (const line of md.split("\n")) {
    const m = line.match(/^(#{1,3})\s+(.+)$/)
    if (!m) continue
    const level = m[1].length
    const text = m[2].replace(/[#`*_\[\]]/g, "").trim().slice(0, 80)
    if (!text) continue
    let id = slugify(text)
    let n = 1
    while (seen.has(id)) { n++; id = `${slugify(text)}-${n}` }
    seen.add(id)
    out.push({ level, text, id })
  }
  return out
}

export function LessonView({ lesson, progress, isFirstInCategory, onToggleDone, onBack, onPrev, onNext }: Props) {
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const storageKey = `learning:diagram:${lesson.category}`
  const [expanded, setExpanded] = useState<boolean>(() => {
    try { return localStorage.getItem(storageKey) === "1" } catch { return false }
  })
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    try { localStorage.setItem(storageKey, expanded ? "1" : "0") } catch { /* ignore */ }
  }, [storageKey, expanded])

  // reset collapsed state when category changes (respect persisted value)
  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey)
      setExpanded(v === "1")
    } catch { setExpanded(false) }
  }, [storageKey])

  useEffect(() => {
    let cancelled = false
    setContent(null)
    setError(null)
    loadLesson(lesson).then((md) => { if (!cancelled) setContent(md) }).catch((e) => { if (!cancelled) setError(String(e)) })
    return () => { cancelled = true }
  }, [lesson])

  const toc = useMemo(() => content ? extractToc(content) : [], [content])
  const done = !!progress[lesson.id]?.done
  const hasDiagram = shouldShowDiagram(lesson)

  return (
    <article className="learning-lesson">
      <header className="learning-lesson-head">
        {onBack && <button type="button" onClick={onBack} className="btn-icon compact" aria-label="Volver">←</button>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="learning-lesson-title">{lesson.title}</h1>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 6, fontSize: "0.74rem", color: "var(--muted)" }}>
            <span className="learning-badge primary">{lesson.categoryTitle}</span>
            {lesson.subCategory && <span className="learning-badge">{lesson.subCategory}</span>}
            <span className="learning-depth-dot" data-depth={lesson.depth} aria-hidden="true" title={lesson.depth} />
            <span>{lesson.depth}</span>
            <span>·</span>
            <span>{lesson.minutes} min</span>
          </div>
        </div>
        <button type="button" onClick={() => onToggleDone(lesson.id, !done)} className={`btn learning-done-btn${done ? " primary" : ""}`}>
          {done ? "✓ Completada" : "Marcar completada"}
        </button>
      </header>

      {hasDiagram && (
        <div className={`learning-lesson-diagram ${expanded ? "is-expanded" : "is-collapsed"}`}>
          {isFirstInCategory && <div className="learning-diagram-badge">Resumen de la sección</div>}
          <DiagramForLesson lesson={lesson} />
          <div className="learning-diagram-toggle">
            <button
              type="button"
              className="learning-diagram-toggle-main"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              aria-label={expanded ? "Ocultar diagrama" : "Ver diagrama completo"}
            >
              {expanded ? "▾ Ocultar diagrama" : "▸ Ver diagrama completo"}
            </button>
            <button
              type="button"
              className="learning-diagram-expand"
              onClick={() => setLightbox(true)}
              aria-label="Ampliar diagrama"
            >
              ⤢ Ampliar
            </button>
          </div>
        </div>
      )}
      {lightbox && hasDiagram && (
        <div className="learning-lightbox" onClick={() => setLightbox(false)} role="dialog" aria-modal="true">
          <div className="learning-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="learning-lightbox-close" onClick={() => setLightbox(false)} aria-label="Cerrar">✕</button>
            <DiagramForLesson lesson={lesson} />
          </div>
        </div>
      )}

      <div className="learning-lesson-body">
        {toc.length >= 3 && (
          <nav className="learning-toc" aria-label="Tabla de contenidos">
            <p className="learning-toc-title">Contenido</p>
            <ol className="learning-toc-list">
              {toc.map((item) => (
                <li key={item.id} style={{ paddingLeft: item.level === 1 ? 0 : item.level === 2 ? 10 : 20 }}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      const el = document.getElementById(item.id)
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
                    }}
                    className="learning-toc-link"
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="learning-content-wrap">
          {content === null && !error && <p className="subtle" style={{ padding: "2rem", textAlign: "center" }}>Cargando…</p>}
          {error && <p style={{ color: "var(--danger)", padding: "2rem" }}>Error: {String(error)}</p>}
          {content !== null && <LessonMarkdownWithAnchors content={content} toc={toc} />}
        </div>
      </div>

      {(onPrev || onNext) && (
        <footer className="learning-pager">
          {onPrev ? <button type="button" onClick={onPrev} className="btn">← Anterior</button> : <span />}
          {onNext ? <button type="button" onClick={onNext} className="btn primary">Siguiente →</button> : <span />}
        </footer>
      )}
    </article>
  )
}

// Wrapper que inyecta ids en los headings para que el TOC funcione.
function LessonMarkdownWithAnchors({ content, toc }: { content: string; toc: TocItem[] }) {
  const patched = useMemo(() => {
    let idx = 0
    return content.split("\n").map((line) => {
      const m = line.match(/^(#{1,3})\s+(.+)$/)
      if (!m) return line
      const item = toc[idx++]
      if (!item) return line
      // Inyecta id html detrás del heading: react-markdown renderiza <hN id=...>
      // Usamos sintaxis que react-markdown preserva: envolvemos en <div id=...>
      return `<a id="${item.id}" aria-hidden="true"></a>\n` + line
    }).join("\n")
  }, [content, toc])

  return (
    <div className="message-content markdown-body">
      {/* El <a id> trick funciona aunque no reescriba el heading: react-markdown deja pasar raw html por default si remarkGfm lo permite. */}
      <Markdown text={patched} />
    </div>
  )
}
