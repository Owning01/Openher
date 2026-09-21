import { memo, useLayoutEffect, useRef, useState, useCallback, useMemo } from "react"
import { CopyIcon, CheckIcon } from "../Icons"
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

export const DiffView = memo(function DiffView({ patch, autoScroll = false }: { patch: string; autoScroll?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  const rows = useMemo(() => parseUnifiedDiff(patch), [patch])

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!patch) return
    navigator.clipboard.writeText(patch).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }, [patch])

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
                <div className="diff-gutter">
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
    </div>
  )
})
