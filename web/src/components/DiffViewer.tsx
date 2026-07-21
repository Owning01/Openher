import { memo, useState } from "react"
import { useT } from "../i18n-context"
import type { DiffFile } from "../types"

type Props = {
  files: DiffFile[]
}

export const DiffViewer = memo(function DiffViewer({ files }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (files.length === 0) return null

  return (
    <div className="diff-viewer">
      {files.map((f) => (
        <div key={f.file} className="diff-file">
          <button
            className="diff-file-header"
            onClick={() => setExpanded(expanded === f.file ? null : f.file)}
            aria-expanded={expanded === f.file}
          >
            <span className="diff-file-name">{f.file}</span>
            <span className="diff-stats">
              <span className="positive">+{f.additions}</span>
              <span className="negative">-{f.deletions}</span>
            </span>
            <span className="diff-chevron">{expanded === f.file ? "−" : "+"}</span>
          </button>
          {expanded === f.file && (
            <div className="diff-file-body">
              <DiffMini lines={f.additions + f.deletions} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
})

function DiffMini({ lines }: { lines: number }) {
  const t = useT()
  if (lines === 0) return <span className="diff-empty">{t('detail.diff.noChanges')}</span>
  return <div className="diff-mini-bar" style={{ height: Math.min(lines * 2, 60) }} />
}

export default DiffViewer
