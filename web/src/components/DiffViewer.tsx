import { memo, useState, useCallback, useRef } from "react"
import { useT } from "../i18n-context"
import type { DiffFile, ServerConfig, DiffContent } from "../types"
import { api } from "../api"

type Props = {
  files: DiffFile[]
  config?: ServerConfig
  sessionID?: string
  directory?: string
}

export const DiffViewer = memo(function DiffViewer({ files, config, sessionID, directory }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [contents, setContents] = useState<Record<string, DiffContent>>({})
  const [loading, setLoading] = useState<string | null>(null)
  const loadingRef = useRef<Set<string>>(new Set())

  const toggleExpand = useCallback(async (file: string) => {
    if (expanded === file) {
      setExpanded(null)
      return
    }
    setExpanded(file)
    if (!contents[file] && config && sessionID && !loadingRef.current.has(file)) {
      loadingRef.current.add(file)
      setLoading(file)
      try {
        const result = await api.fetchDiffContent(config, sessionID, file, directory)
        setContents((prev) => ({ ...prev, [file]: { file, content: result.content, additions: 0, deletions: 0 } }))
      } catch {
        setContents((prev) => ({ ...prev, [file]: { file, content: "// Failed to load diff", additions: 0, deletions: 0 } }))
      } finally {
        loadingRef.current.delete(file)
        setLoading(null)
      }
    }
  }, [expanded, contents, config, sessionID, directory])

  if (files.length === 0) return null

  return (
    <div className="diff-viewer">
      {files.map((f) => (
        <div key={f.file} className="diff-file">
          <button
            className="diff-file-header"
            onClick={() => toggleExpand(f.file)}
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
              {loading === f.file ? (
                <div className="diff-loading">Loading diff...</div>
              ) : contents[f.file] ? (
                <pre className="diff-content"><code>{contents[f.file].content}</code></pre>
              ) : (
                <DiffMini lines={f.additions + f.deletions} />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
})

const DiffMini = memo(function DiffMini({ lines }: { lines: number }) {
  const t = useT()
  if (lines === 0) return <span className="diff-empty">{t('detail.diff.noChanges')}</span>
  return <div className="diff-mini-bar" style={{ height: Math.min(lines * 2, 60) }} />
})

export default DiffViewer
