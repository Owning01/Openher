import { memo, useState, useCallback, useEffect, useMemo, useRef } from "react"
import type { FileDiff, DiffFile, ServerConfig } from "../types"
import { api } from "../api"
import { FileTypeIcon } from "./FileTypeIcon"
import { CloseIcon, CopyIcon, PencilIcon, CheckIcon } from "../Icons"

type Props = {
  diffs?: FileDiff[]
  files?: DiffFile[]
  config?: ServerConfig
  sessionID?: string
  directory?: string
  initialFile?: string
  onClose: () => void
  onEditFile?: (file: string) => void
  onResize?: (width: number) => void
}

type ParsedLine = {
  type: "diff-hunk" | "diff-add" | "diff-del" | "diff-ctx"
  text: string
  oldLine: number | null
  newLine: number | null
}

function parseUnifiedDiffWithLineNumbers(patch: string): ParsedLine[] {
  if (!patch) return []
  const lines = patch.split("\n")
  const result: ParsedLine[] = []
  let oldNum = 0
  let newNum = 0

  for (const line of lines) {
    if (line.startsWith("@@")) {
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
      if (match) {
        oldNum = parseInt(match[1], 10)
        newNum = parseInt(match[2], 10)
      }
      result.push({ type: "diff-hunk", text: line, oldLine: null, newLine: null })
      continue
    }
    if (line.startsWith("+") && !line.startsWith("+++")) {
      result.push({ type: "diff-add", text: line, oldLine: null, newLine: newNum++ })
      continue
    }
    if (line.startsWith("-") && !line.startsWith("---")) {
      result.push({ type: "diff-del", text: line, oldLine: oldNum++, newLine: null })
      continue
    }
    if (line.startsWith("---") || line.startsWith("+++")) {
      result.push({ type: "diff-hunk", text: line, oldLine: null, newLine: null })
      continue
    }
    result.push({ type: "diff-ctx", text: line, oldLine: oldNum++, newLine: newNum++ })
  }

  return result
}

export const ADEDiffPanel = memo(function ADEDiffPanel({
  diffs = [], files = [], config, sessionID, directory, initialFile, onClose, onEditFile, onResize
}: Props) {
  const [filterQuery, setFilterQuery] = useState("")
  const [copied, setCopied] = useState(false)
  const [contents, setContents] = useState<Record<string, string>>({})
  const [loadingFile, setLoadingFile] = useState<string | null>(null)
  const loadingRef = useRef<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement | null>(null)

  // Unir lista de archivos desde diffs o files
  const fileItems = useMemo(() => {
    const map = new Map<string, { file: string; additions: number; deletions: number; patch?: string }>()
    for (const d of diffs) {
      if (d.file) map.set(d.file, { file: d.file, additions: d.additions, deletions: d.deletions, patch: d.patch })
    }
    for (const f of files) {
      if (f.file) {
        const existing = map.get(f.file)
        map.set(f.file, {
          file: f.file,
          additions: existing?.additions ?? f.additions,
          deletions: existing?.deletions ?? f.deletions,
          patch: existing?.patch
        })
      }
    }
    return Array.from(map.values())
  }, [diffs, files])

  const [selectedFile, setSelectedFile] = useState<string>(() => {
    if (initialFile && fileItems.some((f) => f.file === initialFile)) return initialFile
    return fileItems[0]?.file ?? ""
  })

  useEffect(() => {
    if (initialFile && fileItems.some((f) => f.file === initialFile)) {
      setSelectedFile(initialFile)
    } else if (!fileItems.some((f) => f.file === selectedFile) && fileItems.length > 0) {
      setSelectedFile(fileItems[0].file)
    }
  }, [initialFile, fileItems, selectedFile])

  // Cargar contenido de diff para el archivo seleccionado si no vino inline
  const activeItem = fileItems.find((f) => f.file === selectedFile)

  useEffect(() => {
    if (!selectedFile) return
    if (activeItem?.patch) {
      setContents((prev) => ({ ...prev, [selectedFile]: activeItem.patch! }))
      return
    }
    if (contents[selectedFile] || !config || !sessionID || loadingRef.current.has(selectedFile)) return

    loadingRef.current.add(selectedFile)
    setLoadingFile(selectedFile)
    api.fetchDiffContent(config, sessionID, selectedFile, directory)
      .then((res) => {
        setContents((prev) => ({ ...prev, [selectedFile]: res.content }))
      })
      .catch(() => {
        setContents((prev) => ({ ...prev, [selectedFile]: "// Failed to load diff" }))
      })
      .finally(() => {
        loadingRef.current.delete(selectedFile)
        setLoadingFile(null)
      })
  }, [selectedFile, activeItem?.patch, config, sessionID, directory, contents])

  const totalAdd = useMemo(() => fileItems.reduce((acc, f) => acc + (f.additions || 0), 0), [fileItems])
  const totalDel = useMemo(() => fileItems.reduce((acc, f) => acc + (f.deletions || 0), 0), [fileItems])

  const filteredFiles = useMemo(() => {
    const q = filterQuery.trim().toLowerCase()
    if (!q) return fileItems
    return fileItems.filter((f) => f.file.toLowerCase().includes(q))
  }, [fileItems, filterQuery])

  const currentPatch = contents[selectedFile] || activeItem?.patch || ""
  const parsedLines = useMemo(() => parseUnifiedDiffWithLineNumbers(currentPatch), [currentPatch])

  const handleCopyDiff = useCallback(() => {
    if (!currentPatch) return
    navigator.clipboard.writeText(currentPatch)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [currentPatch])

  // Resize drag handle (DOM directo a 60fps sin re-render de React)
  const startResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const panel = panelRef.current
    const startWidth = panel ? panel.getBoundingClientRect().width : 440
    let lastW = startWidth
    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"

    const onMove = (ev: PointerEvent) => {
      lastW = Math.max(280, Math.min(900, startWidth - (ev.clientX - startX)))
      if (panelRef.current) {
        panelRef.current.style.width = `${lastW}px`
      }
      const shell = panelRef.current?.closest(".app-shell") as HTMLElement | null
      if (shell) {
        const parts = shell.style.gridTemplateColumns.split(" ")
        if (parts.length >= 4) {
          parts[3] = `${lastW}px`
          shell.style.gridTemplateColumns = parts.join(" ")
        }
      }
    }
    const onUp = () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      if (onResize) onResize(lastW)
    }
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }, [onResize])

  return (
    <aside className="ade-diff-panel" ref={panelRef} aria-label="Diff Viewer">
      <div className="ade-diff-resizer" onPointerDown={startResize} title="Redimensionar panel de diff" />

      {/* Top Header */}
      <div className="ade-diff-header">
        <div className="ade-diff-title-wrap">
          <span className="ade-diff-title">Diff</span>
          <span className="ade-diff-count-chip">
            {fileItems.length} {fileItems.length === 1 ? "archivo" : "archivos"}
          </span>
          <span className="ade-diff-stats-chip">
            <span className="positive">+{totalAdd}</span>
            <span className="negative">−{totalDel}</span>
          </span>
        </div>
        <div className="ade-diff-header-actions">
          {fileItems.length > 4 && (
            <input
              type="search"
              className="ade-diff-tab-search"
              placeholder="Filtrar..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              title="Filtrar pestañas"
            />
          )}
          <button type="button" className="btn-icon compact" onClick={handleCopyDiff} title={copied ? "Copiado" : "Copiar diff"}>
            {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
          </button>
          <button type="button" className="btn-icon compact" onClick={onClose} title="Cerrar panel de diff" aria-label="Cerrar">
            <CloseIcon size={14} />
          </button>
        </div>
      </div>

      {/* Body: Horizontal File Tabs + Full-Width Code Diff */}
      <div className="ade-diff-body">
        <div
          className="ade-diff-tabs-bar"
          role="tablist"
          aria-label="Archivos modificados"
          onWheel={(e) => {
            if (e.deltaY !== 0 && e.deltaX === 0) {
              e.currentTarget.scrollLeft += e.deltaY
            }
          }}
        >
          {filteredFiles.map((f) => {
            const active = f.file === selectedFile
            const fileName = f.file.split(/[/\\]/).pop() || f.file
            return (
              <button
                key={f.file}
                type="button"
                role="tab"
                aria-selected={active}
                className={`ade-diff-tab${active ? " active" : ""}`}
                onClick={() => setSelectedFile(f.file)}
                title={f.file}
              >
                <FileTypeIcon name={f.file} size={14} />
                <span className="ade-diff-tab-name">{fileName}</span>
                <span className="ade-diff-tab-stats">
                  {f.additions > 0 && <span className="positive">+{f.additions}</span>}
                  {f.deletions > 0 && <span className="negative">−{f.deletions}</span>}
                </span>
              </button>
            )
          })}
          {filteredFiles.length === 0 && (
            <div className="ade-diff-tab-empty">Sin archivos</div>
          )}
        </div>

        {/* Code Diff Display */}
        <div className="ade-diff-code-area">
          {selectedFile ? (
            <>
              <div className="ade-code-header">
                <div className="ade-code-path" title={selectedFile}>
                  <FileTypeIcon name={selectedFile} size={14} />
                  <span>{selectedFile}</span>
                </div>
                <div className="ade-code-actions">
                  {onEditFile && (
                    <button
                      type="button"
                      className="btn-secondary compact ade-edit-btn"
                      onClick={() => onEditFile(selectedFile)}
                      title="Editar este archivo"
                    >
                      <PencilIcon size={12} />
                      <span>Editar</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-icon compact"
                    onClick={handleCopyDiff}
                    title="Copiar diff de este archivo"
                  >
                    <CopyIcon size={12} />
                  </button>
                </div>
              </div>
              <div
                className="ade-code-scroll"
                onWheel={(e) => {
                  if (e.shiftKey && e.deltaY !== 0 && e.deltaX === 0) {
                    e.currentTarget.scrollLeft += e.deltaY
                  }
                }}
              >
                {loadingFile === selectedFile ? (
                  <div className="ade-diff-loading">Cargando diff...</div>
                ) : parsedLines.length > 0 ? (
                  <div className="ade-diff-table" role="table">
                    {parsedLines.map((line, idx) => (
                      <div key={idx} className={`ade-diff-row ${line.type}`}>
                        <span className="ade-line-num old">{line.oldLine ?? ""}</span>
                        <span className="ade-line-num new">{line.newLine ?? ""}</span>
                        <span className="ade-line-sign">
                          {line.type === "diff-add" ? "+" : line.type === "diff-del" ? "−" : " "}
                        </span>
                        <span className="ade-line-code">{line.text.slice(1) || line.text}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ade-diff-no-changes">Sin cambios visibles en este archivo.</div>
                )}
              </div>
            </>
          ) : (
            <div className="ade-diff-placeholder">
              <p>Selecciona un archivo para inspeccionar su diff.</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
})
