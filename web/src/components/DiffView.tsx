import { memo, useEffect, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react"
import { CopyIcon, CheckIcon, CloseIcon } from "../Icons"
import { useT } from "../i18n-context"
import { diffRowLine, formatDiffNotes, type DiffNote } from "../utils/diffAnnotations"
import { injectToComposer } from "../stores/composerInjectStore"
import type { DiffStat } from "../utils/diffStat"

export function sumDiffStat(diffs: Array<{ additions?: number; deletions?: number }>): DiffStat {
  let add = 0
  let del = 0
  for (const d of diffs) {
    add += d.additions ?? 0
    del += d.deletions ?? 0
  }
  return { add, del }
}

export function diffLineClass(line: string): "diff-hunk" | "diff-add" | "diff-del" | "diff-ctx" {
  if (line.startsWith("@@")) return "diff-hunk"
  if (line.startsWith("+") && !line.startsWith("+++")) return "diff-add"
  if (line.startsWith("-") && !line.startsWith("---")) return "diff-del"
  return "diff-ctx"
}

export type ParsedDiffRow = {
  type: "diff-hunk" | "diff-add" | "diff-del" | "diff-ctx" | "diff-meta"
  text: string
  code: string
  oldLine: number | null
  newLine: number | null
  hunkRange?: string
  hunkContext?: string
}

export function parseUnifiedDiff(patch: string): ParsedDiffRow[] {
  if (!patch) return []
  const lines = patch.split("\n")
  const result: ParsedDiffRow[] = []
  let oldNum = 0
  let newNum = 0

  for (const line of lines) {
    if (line.startsWith("@@")) {
      const match = line.match(/@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@(.*)?/)
      if (match) {
        oldNum = parseInt(match[1], 10)
        newNum = parseInt(match[2], 10)
      }
      const rangeMatch = line.match(/(@@\s+-\d+(?:,\d+)?\s+\+\d+(?:,\d+)?\s+@@)/)
      const hunkRange = rangeMatch ? rangeMatch[1] : "@@"
      const hunkContext = line.replace(hunkRange, "").trim()
      result.push({
        type: "diff-hunk",
        text: line,
        code: line,
        oldLine: null,
        newLine: null,
        hunkRange,
        hunkContext: hunkContext || undefined,
      })
      continue
    }

    if (line.startsWith("---") || line.startsWith("+++")) {
      result.push({
        type: "diff-meta",
        text: line,
        code: line,
        oldLine: null,
        newLine: null,
      })
      continue
    }

    if (line.startsWith("+")) {
      result.push({
        type: "diff-add",
        text: line,
        code: line.slice(1),
        oldLine: null,
        newLine: newNum++,
      })
      continue
    }

    if (line.startsWith("-")) {
      result.push({
        type: "diff-del",
        text: line,
        code: line.slice(1),
        oldLine: oldNum++,
        newLine: null,
      })
      continue
    }

    // Línea de contexto
    const code = line.startsWith(" ") ? line.slice(1) : line
    result.push({
      type: "diff-ctx",
      text: line,
      code,
      oldLine: oldNum > 0 ? oldNum++ : null,
      newLine: newNum > 0 ? newNum++ : null,
    })
  }

  return result
}

const NOTES_CAP = 50

type StoredNote = DiffNote & { row: number; patchLen?: number; patchHead?: string }

/** Notas guardadas en sessionStorage para ESTE archivo+patch (vacío si no hay).
 *  Se guardan junto a un sello del patch (largo + cabecera): si el diff cambió,
 *  las notas viejas no sirven y no deben reengancharse a filas ajenas. */
function loadDiffNotes(file: string | undefined, patch: string): Array<DiffNote & { row: number }> {
  if (file === undefined) return []
  try {
    const raw = sessionStorage.getItem(`openher.diffNotes.${file}`)
    if (!raw) return []
    const arr: unknown = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return (arr as StoredNote[])
      .filter((n) => n.patchLen === patch.length && n.patchHead === patch.slice(0, 32))
      .map((n) => ({ file: n.file, line: n.line, code: n.code, note: n.note, row: n.row }))
      .slice(0, NOTES_CAP)
  } catch {
    return []
  }
}

export const DiffView = memo(function DiffView({ patch, autoScroll = false, annotateFile }: { patch: string; autoScroll?: boolean; annotateFile?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const t = useT()
  // Revisión con anotaciones (el "annotate AI diff" de Orca): se comenta una
  // línea y el bloque viaja al composer. Solo aparece si el dueño pasa
  // `annotateFile`; sin eso el visor sigue siendo de solo lectura.
  const [notes, setNotes] = useState<Array<DiffNote & { row: number }>>(() => loadDiffNotes(annotateFile, patch))
  const [editing, setEditing] = useState<{ row: number; line: number } | null>(null)
  const [draft, setDraft] = useState("")

  // El componente se reusa sin remontar cuando cambia el archivo o el patch:
  // recargar las notas guardadas de ESTE patch; si no hay, arrancar vacío (sin
  // esto, las notas del diff viejo quedarían apuntando a filas ajenas).
  useEffect(() => {
    setNotes(loadDiffNotes(annotateFile, patch))
    setEditing(null)
    setDraft("")
  }, [annotateFile, patch])

  // Zero Data Loss: las anotaciones del usuario se guardan por archivo+patch
  // en sessionStorage para sobrevivir a recargas; se vacían al enviar.
  useEffect(() => {
    if (annotateFile === undefined) return
    const key = `openher.diffNotes.${annotateFile}`
    try {
      if (notes.length === 0) {
        sessionStorage.removeItem(key)
        return
      }
      const stored = notes.map((n) => ({ ...n, patchLen: patch.length, patchHead: patch.slice(0, 32) }))
      sessionStorage.setItem(key, JSON.stringify(stored))
    } catch {
      // storage bloqueado: las notas viven solo en memoria
    }
  }, [notes, annotateFile, patch])

  const rows = useMemo(() => parseUnifiedDiff(patch), [patch])

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!patch) return
    navigator.clipboard.writeText(patch).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }, [patch])

  const openNote = useCallback((row: number, line: number) => {
    setEditing({ row, line })
    setDraft("")
  }, [])

  const addNote = useCallback(() => {
    const note = draft.trim()
    if (!editing || !note) return
    setNotes((prev) => [
      ...prev.filter((n) => n.row !== editing.row),
      { row: editing.row, line: editing.line, code: rows[editing.row]?.code, note },
    ].slice(0, NOTES_CAP))
    setEditing(null)
    setDraft("")
  }, [draft, editing, rows])

  const sendNotes = useCallback(() => {
    const block = formatDiffNotes(notes.map((n) => ({ file: annotateFile, line: n.line, code: n.code, note: n.note })))
    if (!block) return
    injectToComposer(block)
    setNotes([])
  }, [notes, annotateFile])

  // Al abrir un diff expandido, centra el primer cambio (la primera línea +/−
  // en orden del archivo) dentro del contenedor scrollable, sin tocar el scroll del chat.
  useLayoutEffect(() => {
    if (!autoScroll) return
    const container = containerRef.current
    if (!container) return
    const firstChange = container.querySelector<HTMLDivElement>(".diff-add, .diff-del")
    if (!firstChange) return
    container.scrollTop = Math.max(0, firstChange.offsetTop - container.clientHeight / 2)
  }, [patch, autoScroll])

  if (!patch) return null

  return (
    <div className="diff-view-wrap">
      <button
        type="button"
        className="diff-copy-btn"
        onClick={handleCopy}
        title={copied ? "Copiado!" : "Copiar diff"}
        aria-label="Copiar diff"
      >
        {copied ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
      </button>
      <div
        ref={containerRef}
        className="diff-view"
        role="region"
        aria-label="Diff"
        onWheel={(e) => {
          if (e.shiftKey && e.deltaY !== 0 && e.deltaX === 0) {
            e.currentTarget.scrollLeft += e.deltaY
          }
        }}
      >
        {rows.map((row, i) => (
          <div key={i} className={`diff-row ${row.type}`}>
            {row.type === "diff-hunk" ? (
              <div className="diff-hunk-inner">
                <div className="diff-gutter">
                  <span className="diff-num-old">···</span>
                  <span className="diff-num-new">···</span>
                  <span className="diff-sign">@@</span>
                </div>
                <div className="diff-code diff-hunk-text">
                  <span className="diff-hunk-badge">{row.hunkRange}</span>
                  {row.hunkContext && <span className="diff-hunk-ctx">{row.hunkContext}</span>}
                </div>
              </div>
            ) : row.type === "diff-meta" ? (
              <div className="diff-meta-inner">
                <div className="diff-gutter">
                  <span className="diff-num-old" />
                  <span className="diff-num-new" />
                  <span className="diff-sign">#</span>
                </div>
                <div className="diff-code diff-meta-text">{row.code}</div>
              </div>
            ) : (
              <>
                <div
                  className={`diff-gutter${annotateFile !== undefined ? " diff-gutter-note" : ""}`}
                  {...(annotateFile !== undefined
                    ? {
                        role: "button",
                        tabIndex: 0,
                        title: t('diff.annotateLine'),
                        onClick: () => openNote(i, diffRowLine(row)),
                        onKeyDown: (e: React.KeyboardEvent) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            openNote(i, diffRowLine(row))
                          }
                        },
                      }
                    : {})}
                >
                  <span className="diff-num-old">{row.oldLine ?? ""}</span>
                  <span className="diff-num-new">{row.newLine ?? ""}</span>
                  <span className="diff-sign">
                    {row.type === "diff-add" ? "+" : row.type === "diff-del" ? "−" : " "}
                  </span>
                </div>
                <div className="diff-code">
                  {row.code || "\u00A0"}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      {annotateFile !== undefined && (
        <div className="diff-notes">
          {notes.length > 0 && (
            <ul className="diff-notes-list">
              {notes.map((n) => (
                <li key={n.row} className="diff-note-item">
                  <span className="diff-note-where">{annotateFile}:{n.line}</span>
                  <span className="diff-note-text">{n.note}</span>
                  <button
                    type="button"
                    className="btn-icon btn-ghost"
                    title={t('diff.removeNote')}
                    aria-label={t('diff.removeNote')}
                    onClick={() => setNotes((prev) => prev.filter((x) => x.row !== n.row))}
                  >
                    <CloseIcon size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {editing ? (
            <div className="diff-note-editor">
              <span className="diff-note-where">{annotateFile}:{editing.line}</span>
              <input
                className="diff-note-input"
                autoFocus
                value={draft}
                placeholder={t('diff.notePlaceholder')}
                aria-label={t('diff.notePlaceholder')}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addNote()
                  else if (e.key === "Escape") setEditing(null)
                }}
              />
              <button type="button" className="btn-secondary compact" onClick={addNote}>{t('diff.addNote')}</button>
            </div>
          ) : notes.length === 0 ? (
            <span className="diff-notes-hint">{t('diff.annotateHint')}</span>
          ) : null}
          {notes.length > 0 && (
            <button type="button" className="btn-primary compact diff-notes-send" onClick={sendNotes}>
              {t('diff.sendNotes', { count: notes.length })}
            </button>
          )}
        </div>
      )}
    </div>
  )
})
