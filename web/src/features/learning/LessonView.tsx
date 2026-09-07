// Lector de lección — TOC autogenerado + diagrama editorial del tema + wrapper tipográfico.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Markdown } from "../../components/Markdown"
import { ArrowLeftIcon, CheckIcon, ChevronRightIcon, ChevronDownIcon, CloseIcon, MaximizeIcon, DownloadIcon, ChatIcon } from "../../Icons"
import { useT } from "../../i18n-context"
import { loadLesson } from "./data"
import { loadScrollTop, saveScrollTop } from "./progress"
import { DiagramForLesson, shouldShowDiagram } from "./diagrams"
import type { LearningLesson, LearningProgress } from "./types"

interface Props {
  lesson: LearningLesson
  progress: LearningProgress
  lessonIndex?: number
  totalLessons?: number
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

export function extractToc(md: string): TocItem[] {
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

export function LessonView({ lesson, progress, lessonIndex, totalLessons, isFirstInCategory, onToggleDone, onBack, onPrev, onNext }: Props) {
  const t = useT()
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const storageKey = `learning:diagram:${lesson.category}`
  const [expanded, setExpanded] = useState<boolean>(() => {
    try { return localStorage.getItem(storageKey) === "1" } catch { return false }
  })
  const [lightbox, setLightbox] = useState(false)
  const [asked, setAsked] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  const saveRaf = useRef(0)
  const askTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (askTimer.current) clearTimeout(askTimer.current)
    if (saveRaf.current) cancelAnimationFrame(saveRaf.current)
  }, [])

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
    setActiveId(null)
    loadLesson(lesson).then((md) => { if (!cancelled) setContent(md) }).catch((e) => { if (!cancelled) setError(String(e)) })
    return () => { cancelled = true }
  }, [lesson])

  // Escape cierra el lightbox (POUR: operable por teclado)
  useEffect(() => {
    if (!lightbox) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox])

  const toc = useMemo(() => content ? extractToc(content) : [], [content])
  const done = !!progress[lesson.id]?.done
  const hasDiagram = shouldShowDiagram(lesson)

  // Scrollspy: resalta la sección visible en el TOC
  useEffect(() => {
    const root = scrollRef.current
    if (!root || toc.length === 0 || typeof IntersectionObserver === "undefined") return
    const headings = Array.from(root.querySelectorAll("h1[id], h2[id], h3[id]"))
    if (headings.length === 0) return
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (en.isIntersecting) setActiveId(en.target.id)
      }
    }, { root, rootMargin: "-15% 0px -70% 0px", threshold: 0 })
    for (const h of headings) io.observe(h)
    return () => io.disconnect()
  }, [toc, content])

  const scrollToId = useCallback((id: string) => {
    const root = scrollRef.current
    const el = root?.querySelector(`#${CSS.escape(id)}`) ?? document.getElementById(id)
    if (el) {
      el.scrollIntoView?.({ behavior: "smooth", block: "start" })
      setActiveId(id)
      history.replaceState(null, "", `#${id}`)
    }
  }, [])

  const handleDownload = useCallback(() => {
    if (!content) return
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${slugify(lesson.title) || lesson.id}.md`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [content, lesson])

  const toggleDiagram = useCallback(() => setExpanded((v) => !v), [])
  const closeLightbox = useCallback(() => setLightbox(false), [])

  // Preguntar al chat: inserta el prompt en el composer (patrón plugin:insert-text)
  // + copia al portapapeles por si el composer no está visible en este layout.
  const handleAsk = useCallback(() => {
    const section = toc.find((it) => it.id === activeId)
    const prompt = t("learning.askPrompt", {
      lesson: lesson.title,
      section: section ? t("learning.askSection", { section: section.text }) : "",
    })
    try { window.dispatchEvent(new CustomEvent("plugin:insert-text", { detail: prompt })) } catch { /* ignore */ }
    try { navigator.clipboard?.writeText(prompt)?.catch(() => {}) } catch { /* ignore */ }
    setAsked(true)
    if (askTimer.current) clearTimeout(askTimer.current)
    askTimer.current = setTimeout(() => setAsked(false), 1600)
  }, [t, toc, activeId, lesson.title])

  // Scroll restaurado por lección: vuelve a donde estabas al reabrirla.
  const handleScrollSave = useCallback(() => {
    const el = scrollRef.current
    if (!el || saveRaf.current) return
    saveRaf.current = requestAnimationFrame(() => {
      saveRaf.current = 0
      saveScrollTop(lesson.id, el.scrollTop)
    })
  }, [lesson.id])

  useEffect(() => {
    const root = scrollRef.current
    if (!root || content === null) return
    const hash = window.location.hash.replace(/^#/, "")
    const frame = requestAnimationFrame(() => {
      if (hash && toc.some((it) => it.id === hash)) {
        root.querySelector(`#${CSS.escape(hash)}`)?.scrollIntoView?.({ block: "start" })
        setActiveId(hash)
      } else {
        root.scrollTop = loadScrollTop(lesson.id)
      }
    })
    return () => {
      cancelAnimationFrame(frame)
      if (scrollRef.current) saveScrollTop(lesson.id, scrollRef.current.scrollTop)
    }
  }, [content, lesson.id, toc])

  return (
    <article className="learning-lesson" aria-label={lesson.title}>
      <header className="learning-lesson-head">
        {onBack && <button type="button" onClick={onBack} className="btn-icon compact" aria-label={t("learning.back")}><ArrowLeftIcon size={16} /></button>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 className="learning-lesson-title">{lesson.title}</h1>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginTop: 6, fontSize: "0.74rem", color: "var(--muted)" }}>
            <span className="learning-badge primary">{lesson.categoryTitle}</span>
            {lesson.subCategory && <span className="learning-badge">{lesson.subCategory}</span>}
            <span className="learning-depth-dot" data-depth={lesson.depth} aria-hidden="true" title={lesson.depth} />
            <span>{lesson.depth}</span>
            <span aria-hidden="true">·</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{t("learning.minutes", { count: lesson.minutes })}</span>
            {lessonIndex !== undefined && totalLessons !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span style={{ fontVariantNumeric: "tabular-nums" }}>{t("learning.ofLesson", { i: lessonIndex + 1, n: totalLessons })}</span>
              </>
            )}
          </div>
        </div>
        <div className="learning-head-actions">
          {(onPrev || onNext) && (
            <span className="learning-pager-inline" role="group" aria-label={t("learning.contents")}>
              <button type="button" onClick={onPrev} disabled={!onPrev} className="btn-icon compact" aria-label={t("learning.prev")}>
                <ChevronRightIcon size={15} style={{ transform: "rotate(180deg)" }} />
              </button>
              <button type="button" onClick={onNext} disabled={!onNext} className="btn-icon compact" aria-label={t("learning.next")}>
                <ChevronRightIcon size={15} />
              </button>
            </span>
          )}
          <button type="button" onClick={handleDownload} disabled={!content} className="btn-icon compact" aria-label={t("learning.download")} title={t("learning.download")}>
            <DownloadIcon size={15} />
          </button>
          <button
            type="button"
            onClick={handleAsk}
            className="btn-icon compact"
            aria-label={t("learning.askChat")}
            title={t("learning.askChat")}
          >
            {asked ? <CheckIcon size={15} aria-hidden="true" /> : <ChatIcon size={15} aria-hidden="true" />}
          </button>
          <button type="button" onClick={() => onToggleDone(lesson.id, !done)} className={`btn learning-done-btn${done ? " primary" : ""}`} aria-pressed={done}>
            {done && <CheckIcon size={14} aria-hidden="true" />} {done ? t("learning.completed") : t("learning.markDone")}
          </button>
        </div>
      </header>

      {lightbox && hasDiagram && (
        <div className="learning-lightbox" onClick={closeLightbox} role="dialog" aria-modal="true" aria-label={lesson.title}>
          <div className="learning-lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button ref={closeRef} type="button" className="learning-lightbox-close" onClick={closeLightbox} aria-label={t("learning.close")}>
              <CloseIcon size={15} />
            </button>
            <DiagramForLesson lesson={lesson} />
          </div>
        </div>
      )}

      <div className="learning-lesson-body">
        {toc.length >= 3 && (
          <nav className="learning-toc" aria-label={t("learning.contents")}>
            <p className="learning-toc-title">{t("learning.contents")}</p>
            <TocList toc={toc} activeId={activeId} onJump={scrollToId} />
          </nav>
        )}

        <div className="learning-content-wrap" ref={scrollRef} onScroll={handleScrollSave} tabIndex={-1}>
          {toc.length >= 3 && (
            <details className="learning-toc-mobile">
              <summary className="learning-toc-mobile-summary">{t("learning.contents")}</summary>
              <TocList toc={toc} activeId={activeId} onJump={scrollToId} />
            </details>
          )}
          {hasDiagram && (
            <div className={`learning-lesson-diagram ${expanded ? "is-expanded" : "is-collapsed"}`}>
              {isFirstInCategory && <div className="learning-diagram-badge">{t("learning.diagramSummary")}</div>}
              <DiagramForLesson lesson={lesson} />
              <div className="learning-diagram-toggle">
                <button
                  type="button"
                  className="learning-diagram-toggle-main"
                  onClick={toggleDiagram}
                  aria-expanded={expanded}
                  aria-label={expanded ? t("learning.hideDiagram") : t("learning.showDiagram")}
                >
                  {expanded ? <ChevronDownIcon size={14} aria-hidden="true" /> : <ChevronRightIcon size={14} aria-hidden="true" />}
                  {expanded ? t("learning.hideDiagram") : t("learning.showDiagram")}
                </button>
                <button
                  type="button"
                  className="learning-diagram-expand"
                  onClick={() => setLightbox(true)}
                  aria-label={t("learning.enlarge")}
                >
                  <MaximizeIcon size={12} aria-hidden="true" /> {t("learning.enlarge")}
                </button>
              </div>
            </div>
          )}
          {content === null && !error && (
            <div className="learning-lesson-skeleton" aria-label={t("learning.loading")} aria-busy="true">
              <div className="learning-skeleton" style={{ height: 26, width: "60%" }} />
              <div className="learning-skeleton" style={{ height: 14 }} />
              <div className="learning-skeleton" style={{ height: 14, width: "92%" }} />
              <div className="learning-skeleton" style={{ height: 14, width: "78%" }} />
              <div className="learning-skeleton" style={{ height: 180 }} />
              <div className="learning-skeleton" style={{ height: 14, width: "85%" }} />
            </div>
          )}
          {error && <p style={{ color: "var(--danger)", padding: "2rem" }}>{t("common.error")}: {String(error)}</p>}
          {content !== null && <LessonMarkdownWithAnchors content={content} toc={toc} />}
        </div>
      </div>

      {(onPrev || onNext) && (
        <footer className="learning-pager">
          {onPrev
            ? <button type="button" onClick={onPrev} className="btn"><ChevronRightIcon size={14} style={{ transform: "rotate(180deg)" }} aria-hidden="true" /> {t("learning.prev")}</button>
            : <span />}
          {onNext
            ? <button type="button" onClick={onNext} className="btn primary">{t("learning.next")} <ChevronRightIcon size={14} aria-hidden="true" /></button>
            : <span />}
        </footer>
      )}
    </article>
  )
}

function TocList({ toc, activeId, onJump }: { toc: TocItem[]; activeId: string | null; onJump: (id: string) => void }) {
  return (
    <ol className="learning-toc-list">
      {toc.map((item) => (
        <li key={item.id} style={{ paddingLeft: item.level === 1 ? 0 : item.level === 2 ? 10 : 20 }}>
          <a
            href={`#${item.id}`}
            onClick={(e) => { e.preventDefault(); onJump(item.id) }}
            className={`learning-toc-link${activeId === item.id ? " active" : ""}`}
            aria-current={activeId === item.id ? "location" : undefined}
          >
            {item.text}
          </a>
        </li>
      ))}
    </ol>
  )
}

// Wrapper que inyecta ids en los headings para que el TOC funcione — sin HTML crudo visible.
function LessonMarkdownWithAnchors({ content, toc }: { content: string; toc: TocItem[] }) {
  const headingComponents = useMemo(() => {
    // Mapa texto normalizado → id (por si hay duplicados, el primero gana)
    const textToId = new Map<string, string>()
    toc.forEach((item) => {
      const k = item.text.toLowerCase().trim()
      if (!textToId.has(k)) textToId.set(k, item.id)
      const sk = slugify(item.text)
      if (!textToId.has(sk)) textToId.set(sk, item.id)
    })
    const makeHeading = (level: number) => {
      const Tag = `h${level}` as "h1" | "h2" | "h3"
      return ({ children, ...props }: Record<string, unknown> & { children?: React.ReactNode }) => {
        // Extrae texto plano de children para mapear al id
        const raw = Array.isArray(children)
          ? (children as Array<{ props?: { children?: unknown } }>).map((c) => (typeof c === "string" ? c : String(c?.props?.children ?? ""))).join("")
          : String(children ?? "")
        const key = raw.toLowerCase().trim().slice(0, 80)
        const fromProps = (props as { id?: string }).id
        const id = textToId.get(key) || textToId.get(slugify(raw)) || fromProps
        return <Tag id={id} {...(props as object)}>{children}</Tag>
      }
    }
    return {
      h1: makeHeading(1),
      h2: makeHeading(2),
      h3: makeHeading(3),
    }
  }, [toc])

  return (
    <div className="message-content markdown-body">
      <Markdown text={content} components={headingComponents} />
    </div>
  )
}
