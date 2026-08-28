import { memo, useState, useMemo } from "react"
import { DownloadIcon, ChevronDownIcon, ChevronRightIcon } from "../../Icons"
import { VSCodeFileIcon } from "../../components/VSCodeFileIcon"
import type { FsEntry, CodeSearchResult, CodeSearchMatch } from "../../shell"

export type CodeSearchResultsProps = {
  results: CodeSearchResult | null
  searching: boolean
  query: string
  cwd: string | null
  downloading: string | null
  onDownload: (f: FsEntry) => void
  onOpenAtLine?: (path: string, line: number) => void
}

export const CodeSearchResults = memo(function CodeSearchResults({
  results,
  searching,
  query,
  cwd,
  downloading,
  onDownload,
  onOpenAtLine,
}: CodeSearchResultsProps) {
  const [collapsedFiles, setCollapsedFiles] = useState<Record<string, boolean>>({})

  const toggleCollapse = (p: string) => {
    setCollapsedFiles((prev) => ({ ...prev, [p]: !prev[p] }))
  }

  const grouped = useMemo(() => {
    if (!results?.matches) return []
    const map = new Map<string, { fileName: string; path: string; relPath: string; matches: CodeSearchMatch[] }>()
    for (const m of results.matches) {
      if (!map.has(m.path)) {
        let rel = m.path
        if (cwd && m.path.startsWith(cwd)) {
          rel = m.path.slice(cwd.length).replace(/^[/\\]/, "")
        }
        map.set(m.path, { fileName: m.file_name, path: m.path, relPath: rel, matches: [] })
      }
      map.get(m.path)!.matches.push(m)
    }
    return Array.from(map.values())
  }, [results, cwd])

  if (searching) {
    return <div className="pcf-loading">Buscando código en {cwd ?? "directorio"}…</div>
  }

  if (!query.trim()) {
    return (
      <div className="pcf-empty" style={{ padding: "24px 16px", textAlign: "center", color: "var(--muted)" }}>
        Ingresa un término para buscar código dentro de este proyecto.
      </div>
    )
  }

  if (!results || results.matches.length === 0) {
    return <div className="pcf-empty">Sin coincidencias de código para "{query}"</div>
  }

  return (
    <div className="pcf-code-results">
      <div className="pcf-code-summary">
        <span>
          {results.total_matches} coincidencia{results.total_matches === 1 ? "" : "s"} en {results.total_files} archivo{results.total_files === 1 ? "" : "s"}
        </span>
        {results.truncated && <span style={{ color: "var(--warning, #eab308)" }}>(límite de 100)</span>}
      </div>

      {grouped.map((g) => {
        const isCollapsed = !!collapsedFiles[g.path]
        const isDownloading = downloading === g.path
        return (
          <div key={g.path} className="pcf-code-file-group">
            <div
              className="pcf-code-file-header"
              onClick={() => toggleCollapse(g.path)}
              title={g.path}
              role="button"
              tabIndex={0}
            >
              <span className="pcf-chevron" style={{ width: 12 }}>
                {isCollapsed ? <ChevronRightIcon size={10} /> : <ChevronDownIcon size={10} />}
              </span>
              <span className="pcf-icon-wrap" style={{ width: 16 }}>
                <VSCodeFileIcon name={g.fileName} size={14} />
              </span>
              <span className="pcf-code-file-name" title={g.path}>
                {g.relPath || g.fileName}
              </span>
              <span className="pcf-code-badge">{g.matches.length}</span>
              <button
                type="button"
                className="btn-icon compact"
                style={{ padding: "0 4px", fontSize: 11 }}
                title={isDownloading ? "Descargando…" : "Descargar archivo"}
                disabled={isDownloading}
                onClick={(e) => {
                  e.stopPropagation()
                  onDownload({ name: g.fileName, path: g.path, is_dir: false, size: null, modified: null })
                }}
              >
                <DownloadIcon size={12} />
              </button>
            </div>

            {!isCollapsed && (
              <div className="pcf-code-matches-list">
                {g.matches.map((m, idx) => {
                  const line = m.line_content
                  const qLower = query.toLowerCase()
                  const matchIdx = line.toLowerCase().indexOf(qLower)
                  return (
                    <div
                      key={`${m.path}-${m.line_number}-${idx}`}
                      className="pcf-code-match"
                      onClick={() => {
                        if (onOpenAtLine) onOpenAtLine(g.path, m.line_number)
                        else onDownload({ name: g.fileName, path: g.path, is_dir: false, size: null, modified: null })
                      }}
                      title={`${m.path}:${m.line_number} (click para ir a la línea)`}
                    >
                      <span className="pcf-line-num">L{m.line_number}</span>
                      <span className="pcf-match-text">
                        {matchIdx >= 0 ? (
                          <>
                            {line.slice(0, matchIdx)}
                            <mark className="pcf-highlight">{line.slice(matchIdx, matchIdx + query.length)}</mark>
                            {line.slice(matchIdx + query.length)}
                          </>
                        ) : (
                          line
                        )}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})
