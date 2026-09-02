import { memo, useState } from "react"
import type { FileDiff } from "../types"
import { useT } from "../i18n-context"
import { DiffView, sumDiffStat } from "./DiffView"
import { DiffStatBadge } from "./ToolPart"
import { FileTypeIcon } from "./FileTypeIcon"
import { ChevronIcon } from "../Icons"

export const FileDiffs = memo(function FileDiffs({
  diffs, onOpenADEDiff, defaultOpen
}: {
  diffs: FileDiff[]
  onOpenADEDiff?: (diffs: FileDiff[], file?: string) => void
  defaultOpen?: boolean
}) {
  const t = useT()
  const [open, setOpen] = useState(!!defaultOpen)
  const [openFile, setOpenFile] = useState<Record<string, boolean>>(() => defaultOpen ? Object.fromEntries(diffs.map((_, i) => [String(i), true])) : {})
  if (!diffs || diffs.length === 0) return null
  const total = sumDiffStat(diffs)

  const handleToggle = () => {
    setOpen((v) => !v)
  }

  return (
    <div className={`file-diffs${open ? " open" : ""}`}>
      <button type="button" className="file-diffs-toggle" onClick={handleToggle} aria-expanded={open}>
        <span className="tool-part-icon"><ChevronIcon size={12} /></span>
        <span className="tool-part-label">
          {t('diff.filesModified', { count: diffs.length })}
        </span>
        <DiffStatBadge add={total.add} del={total.del} />
        {onOpenADEDiff && (
          <span
            className="file-diffs-ade-link"
            role="button"
            title="Abrir visor de diff"
            onClick={(e) => {
              e.stopPropagation()
              onOpenADEDiff(diffs)
            }}
          >
            Diff ↗
          </span>
        )}
        <span className="tool-part-chevron">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="file-diffs-content">
          {diffs.map((d, i) => {
            const path = d.file || `file ${i + 1}`
            const fileOpen = !!openFile[i]
            return (
              <div key={i} className="file-diff-item">
                <button
                  type="button"
                  className="file-diff-toggle"
                  onClick={() => setOpenFile((prev) => ({ ...prev, [i]: !prev[i] }))}
                  aria-expanded={fileOpen}
                >
                  <FileTypeIcon name={path} size={15} />
                  <span className="file-diff-path">{path}</span>
                  <DiffStatBadge add={d.additions} del={d.deletions} />
                  <span className="tool-part-chevron">{fileOpen ? "▾" : "▸"}</span>
                </button>
                {fileOpen && d.patch && (
                  <div className="tool-part-body">
                    <DiffView patch={d.patch} autoScroll />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})
