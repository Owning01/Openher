import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import { FolderIcon, RefreshIcon, FileIcon, SearchIcon, StarIcon, MenuDotsIcon, DownloadIcon, CodeIcon, TerminalIcon, SaveIcon, LinkIcon, MonitorIcon, TrashIcon } from "../../Icons"
import { shell, fileIcon, type FsEntry, type CodeSearchMatch, type CodeSearchResult } from "../../shell"
import { useT } from "../../i18n-context"
import { useOutsideClick } from "../../hooks/useOutsideClick"

const EXPLORER_RECENT_KEY = "opencode.explorer.recentDirs"
function loadExplorerRecent(): string[] {
  try {
    const raw = localStorage.getItem(EXPLORER_RECENT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((s: unknown) => typeof s === "string" && s).slice(0, 20) : []
  } catch { return [] }
}

function formatSize(size: number | null): string {
  if (size == null) return ""
  if (size > 1024 * 1024) return `${(size / 1048576).toFixed(1)}M`
  if (size > 1024) return `${(size / 1024).toFixed(0)}K`
  return `${size}B`
}

function isRecentDot(modified: number | null): boolean {
  if (!modified) return false
  return Date.now() / 1000 - modified < 24 * 3600
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const idx = dataUrl.indexOf(",")
      resolve(idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

type FileRowProps = {
  file: FsEntry
  depth?: number
  downloading: string | null
  onDownload: (f: FsEntry) => void
  isFav: boolean
  onToggleFav: (path: string, add: boolean) => void
  showNotice: (msg: string) => void
  onContextMenu?: (e: React.MouseEvent, entry: FsEntry, isDir: boolean) => void
}

const FileRow = memo(function FileRow({ file: f, depth = 0, downloading, onDownload, isFav, onToggleFav, showNotice, onContextMenu }: FileRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen)
  const ic = fileIcon(f.name, false)
  const isDownloading = downloading === f.path

  return (
    <div
      className="pcf-row pcf-file"
      style={depth > 0 ? { paddingLeft: `${depth * 14 + 6}px` } : undefined}
      title={f.path}
      onClick={() => onDownload(f)}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, f, false) : undefined}
    >
      {depth > 0 && <span style={{ width: 12, flexShrink: 0 }} />}
      <span className="pcf-glyph" style={{ color: ic.color }}>{ic.glyph}</span>
      <span className="pcf-name">{f.name}</span>
      <span className="pcf-size">{formatSize(f.size)}</span>
      {isRecentDot(f.modified) && <span className="pcf-dot" aria-hidden="true" title="Modificado reciente" />}

      <div className="pcf-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="pcf-dots-btn"
          onClick={() => setMenuOpen((v) => !v)}
          title="Opciones"
          aria-label={`Opciones de ${f.name}`}
          aria-expanded={menuOpen}
        >
          <MenuDotsIcon size={14} />
        </button>

        {menuOpen && (
          <div className="pcf-file-menu">
            <button
              type="button"
              className="pcf-file-menu-item"
              disabled={isDownloading}
              onClick={() => {
                setMenuOpen(false)
                onDownload(f)
              }}
            >
              <DownloadIcon size={13} />
              <span>{isDownloading ? "Descargando…" : "Descargar"}</span>
            </button>
            <button
              type="button"
              className="pcf-file-menu-item"
              onClick={() => {
                setMenuOpen(false)
                onToggleFav(f.path, !isFav)
              }}
            >
              <StarIcon size={13} />
              <span>{isFav ? "Quitar favorito" : "Favorito"}</span>
            </button>
            <button
              type="button"
              className="pcf-file-menu-item"
              onClick={() => {
                setMenuOpen(false)
                navigator.clipboard.writeText(f.path)
                showNotice("Ruta copiada al portapapeles")
              }}
            >
              <span>Copiar ruta</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
})

type TreeFolderProps = {
  entry: FsEntry
  depth: number
  onEnterDir: (path: string) => void
  query: string
  downloading: string | null
  onDownload: (f: FsEntry) => void
  favorites: string[]
  onFav: (path: string, add: boolean) => void
  showNotice: (msg: string) => void
  onContextMenu?: (e: React.MouseEvent, entry: FsEntry, isDir: boolean) => void
}

const TreeFolder = memo(function TreeFolder({ entry, depth, onEnterDir, query, downloading, onDownload, favorites, onFav, showNotice, onContextMenu }: TreeFolderProps) {
  const [expanded, setExpanded] = useState(false)
  const [subDirs, setSubDirs] = useState<FsEntry[]>([])
  const [subFiles, setSubFiles] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    if (expanded) { setExpanded(false); return }
    setExpanded(true)
    if (subDirs.length === 0 && subFiles.length === 0) {
      setLoading(true)
      try {
        const r = await shell.fs.list(entry.path)
        setSubDirs(r.dirs || [])
        setSubFiles(r.files || [])
      } catch { setSubDirs([]); setSubFiles([]) }
      finally { setLoading(false) }
    }
  }

  const q = query.trim().toLowerCase()
  const filteredDirs = q ? subDirs.filter(d => d.name.toLowerCase().includes(q)) : subDirs
  const filteredFiles = q ? subFiles.filter(f => f.name.toLowerCase().includes(q)) : subFiles

  return (
    <div>
      <div
        className={`pcf-row${expanded ? " is-expanded" : ""}`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        onClick={toggle}
        onDoubleClick={() => onEnterDir(entry.path)}
        onContextMenu={onContextMenu ? (e) => onContextMenu(e, entry, true) : undefined}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter") onEnterDir(entry.path) }}
        title={entry.path}
      >
        <span className="pcf-chevron">{expanded ? "▾" : ""}</span>
        <FolderIcon size={13} className="pcf-glyph" />
        <span className="pcf-name">{entry.name}</span>
      </div>
      {expanded && (
        <div className="pcf-sublist" style={{ marginLeft: `${depth * 14 + 11}px` }}>
          {loading && <div className="pcf-loading">Cargando…</div>}
          {!loading && filteredDirs.map(d => (
            <TreeFolder
              key={d.path}
              entry={d}
              depth={depth + 1}
              onEnterDir={onEnterDir}
              query={query}
              downloading={downloading}
              onDownload={onDownload}
              favorites={favorites}
              onFav={onFav}
              showNotice={showNotice}
              onContextMenu={onContextMenu}
            />
          ))}
          {!loading && filteredFiles.map(f => (
            <FileRow
              key={f.path}
              file={f}
              depth={depth + 1}
              downloading={downloading}
              onDownload={onDownload}
              isFav={favorites.includes(f.path)}
              onToggleFav={onFav}
              showNotice={showNotice}
              onContextMenu={onContextMenu}
            />
          ))}
          {!loading && filteredDirs.length === 0 && filteredFiles.length === 0 && (
            <div className="pcf-empty">(vacío)</div>
          )}
        </div>
      )}
    </div>
  )
})

type CodeSearchResultsProps = {
  results: CodeSearchResult | null
  searching: boolean
  query: string
  cwd: string | null
  downloading: string | null
  onDownload: (f: FsEntry) => void
}

const CodeSearchResults = memo(function CodeSearchResults({
  results,
  searching,
  query,
  cwd,
  downloading,
  onDownload,
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
        const ic = fileIcon(g.fileName, false)
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
              <span className="pcf-chevron" style={{ width: 10 }}>
                {isCollapsed ? "" : "▾"}
              </span>
              <span className="pcf-glyph" style={{ color: ic.color, width: 14 }}>
                {ic.glyph}
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
                        onDownload({ name: g.fileName, path: g.path, is_dir: false, size: null, modified: null })
                      }}
                      title={`${m.path}:${m.line_number} (click para abrir/descargar)`}
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

export const PCFilesPanel = memo(function PCFilesPanel({ onCollapseSidebar }: { onCollapseSidebar?: () => void }) {
  const t = useT()
  const [cwd, setCwd] = useState<string | null>(null)
  const [dirs, setDirs] = useState<FsEntry[]>([])
  const [files, setFiles] = useState<FsEntry[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [drives, setDrives] = useState<string[]>([])
  const [showDrives, setShowDrives] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shellOk, setShellOk] = useState<boolean | null>(null)
  const [query, setQuery] = useState("")
  const [searchMode, setSearchMode] = useState<"files" | "code">("files")
  const [codeResults, setCodeResults] = useState<CodeSearchResult | null>(null)
  const [codeSearching, setCodeSearching] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const projectMenuRef = useRef<HTMLDivElement | null>(null)
  const [explorerRecent, setExplorerRecent] = useState<string[]>(() => loadExplorerRecent())
  useOutsideClick(projectMenuRef, () => setShowProjectMenu(false), showProjectMenu)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(null)
  const [newItemName, setNewItemName] = useState("")
  const createInputRef = useRef<HTMLInputElement | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FsEntry | null; isDir: boolean } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const [copiedItem, setCopiedItem] = useState<FsEntry | null>(null)
  const [execConfirm, setExecConfirm] = useState<{ path: string; name: string } | null>(null)

  useEffect(() => {
    if (creatingType && createInputRef.current) {
      createInputRef.current.focus()
    }
  }, [creatingType])

  const showNotice = useCallback((msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice(m => m === msg ? null : m), 2800)
  }, [])

  const isExecScript = (p?: string) => {
    if (!p) return false
    const v = p.toLowerCase()
    return v.endsWith(".bat") || v.endsWith(".cmd") || v.endsWith(".vbs") || v.endsWith(".ps1") || v.endsWith(".exe") || v.endsWith(".sh")
  }

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: FsEntry | null, isDir: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    const menuW = 240
    const menuH = 420
    const x = e.clientX + menuW > window.innerWidth ? Math.max(8, e.clientX - menuW) : e.clientX
    const y = e.clientY + menuH > window.innerHeight ? Math.max(8, window.innerHeight - menuH - 8) : e.clientY
    setContextMenu({ x, y, entry, isDir })
  }, [])

  useEffect(() => {
    if (!contextMenu) return
    const onDocClick = (e: PointerEvent) => {
      const t = e.target as Node
      if (contextMenuRef.current?.contains(t)) return
      setContextMenu(null)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setContextMenu(null) }
    document.addEventListener("pointerdown", onDocClick, true)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDocClick, true)
      document.removeEventListener("keydown", onKey)
    }
  }, [contextMenu])

  const copyRelativePath = (path: string) => {
    const rel = cwd && path.startsWith(cwd) ? path.slice(cwd.length).replace(/^[/\\]+/, "") : path
    navigator.clipboard.writeText(rel)
    setContextMenu(null)
    showNotice(`Ruta relativa copiada: ${rel}`)
  }
  const copyFullPath = (path: string) => {
    navigator.clipboard.writeText(path)
    setContextMenu(null)
    showNotice("Ruta completa copiada")
  }
  const handleCopyItem = (entry: FsEntry) => {
    setCopiedItem(entry)
    setContextMenu(null)
    showNotice(`Copiado: ${entry.name}`)
  }
  const handlePasteItem = async (destDir: string) => {
    if (!copiedItem) return
    setContextMenu(null)
    try {
      await shell.fs.copy(copiedItem.path, destDir)
      showNotice(`Pegado en ${destDir.split(/[/\\]/).pop() || destDir}`)
      load(destDir === cwd ? destDir : cwd || destDir)
      if (cwd) load(cwd)
    } catch {
      showNotice("Error al pegar")
    }
  }
  const handleDeleteItem = async (entry: FsEntry) => {
    setContextMenu(null)
    if (!window.confirm(`¿Eliminar definitivamente "${entry.name}"?`)) return
    try {
      await shell.fs.delete(entry.path)
      showNotice(`Eliminado: ${entry.name}`)
      if (cwd) load(cwd)
    } catch { showNotice("Error al eliminar") }
  }
  const handleCreateFileHere = (dir: string) => {
    setContextMenu(null)
    setCreatingType("file")
    setNewItemName("")
    if (cwd !== dir) { load(dir) }
  }
  const handleCreateFolderHere = (dir: string) => {
    setContextMenu(null)
    setCreatingType("folder")
    setNewItemName("")
    if (cwd !== dir) { load(dir) }
  }

  const load = useCallback(async (path: string) => {
    if (!path) return
    setCwd(path)
    setLoading(true)
    setError(null)
    try {
      const r = await shell.fs.list(path)
      setDirs(r.dirs || [])
      setFiles(r.files || [])
      setShellOk(true)
      try {
        const cur = loadExplorerRecent().filter(p => p !== path)
        cur.unshift(path)
        localStorage.setItem(EXPLORER_RECENT_KEY, JSON.stringify(cur.slice(0, 20)))
        setExplorerRecent(cur.slice(0, 20))
      } catch {}
    } catch (e) {
      setDirs([]); setFiles([])
      const msg = e instanceof Error ? e.message : String(e)
      if (/unauthorized|401/i.test(msg)) setShellOk(false)
      setError(msg)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let cancelled = false
    shell.fs.drives().then(({ drives: ds }) => {
      if (cancelled) return
      setDrives(ds)
      shell.fs.favorites().then(({ favorites: fav }) => { if (!cancelled) setFavorites(fav) }).catch(() => {})
      const recent = loadExplorerRecent()
      if (recent.length > 0) load(recent[0]!)
      else if (ds.length > 0) load(ds[0]!)
      else setShellOk(false)
    }).catch(() => {
      if (!cancelled) setShellOk(false)
    })
    return () => { cancelled = true }
  }, [load])

  useEffect(() => {
    if (showDrives && drives.length === 0) {
      shell.fs.drives().then(({ drives: ds }) => setDrives(ds)).catch(() => {})
    }
  }, [showDrives, drives.length])

  // Debounced code search
  useEffect(() => {
    if (searchMode !== "code" || !cwd) return
    const q = query.trim()
    if (!q) {
      setCodeResults(null)
      setCodeSearching(false)
      return
    }
    let cancelled = false
    setCodeSearching(true)
    const timer = setTimeout(() => {
      shell.fs
        .searchCode(cwd, q, 100)
        .then((res) => {
          if (!cancelled) {
            setCodeResults(res)
            setCodeSearching(false)
          }
        })
        .catch((e) => {
          if (!cancelled) {
            setCodeResults(null)
            setCodeSearching(false)
            showNotice(`Error en búsqueda: ${e instanceof Error ? e.message : String(e)}`)
          }
        })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchMode, query, cwd, showNotice])

  const nav = (path: string) => {
    setHistory(h => [...h, cwd ?? ""])
    load(path)
  }
  const back = () => {
    const prev = history[history.length - 1]
    if (prev) { setHistory(h => h.slice(0, -1)); load(prev) }
  }

  const openChangeFolder = async () => {
    try {
      const picked = await shell.fs.pickFolder()
      const p = (picked as { path?: string | null })?.path
      if (p) load(p)
    } catch {}
  }

  const fav = (path: string, add: boolean) => {
    shell.fs.toggleFavorite(path, add).then(() => shell.fs.favorites().then(({ favorites: favs }) => setFavorites(favs)).catch(() => {}))
  }

  const handleDownload = async (entry: FsEntry) => {
    if (downloading) return
    setDownloading(entry.path)
    try {
      const blob = await shell.fs.download(entry.path)
      const fileName = entry.name || "download"
      if (Capacitor.isNativePlatform()) {
        const b64 = await blobToBase64(blob)
        const saved = await Filesystem.writeFile({ path: fileName, data: b64, directory: Directory.Cache })
        try { await Share.share({ title: fileName, url: saved.uri }) } catch {}
        showNotice(`Guardado: ${fileName}`)
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 4000)
        showNotice(`Descargando: ${fileName}`)
      }
    } catch (e) {
      showNotice(`Error al descargar: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setDownloading(null)
    }
  }

  const qLower = query.trim().toLowerCase()
  const filteredDirs = qLower ? dirs.filter(d => d.name.toLowerCase().includes(qLower)) : dirs
  const filteredFiles = qLower ? files.filter(f => f.name.toLowerCase().includes(qLower)) : files

  return (
    <div className="pcf-root">
      <div className="pcf-header pcf-header--unified">
        <span className="pcf-title">Archivos</span>
        <span className="pcf-header-actions">
          <button type="button" className="btn-icon compact pcf-hbtn" title="Nuevo archivo" aria-label="Nuevo archivo" onClick={() => {
            setCreatingType("file")
            setNewItemName("")
          }}>＋<span className="pcf-hbtn-icon"><FileIcon size={13} /></span></button>
          <button type="button" className="btn-icon compact pcf-hbtn" title="Nueva carpeta" aria-label="Nueva carpeta" onClick={() => {
            setCreatingType("folder")
            setNewItemName("")
          }}>＋<FolderIcon size={13} /></button>
          <button type="button" className="btn-icon compact pcf-hbtn" title="Recargar" aria-label="Recargar" onClick={() => cwd && load(cwd)}><RefreshIcon size={13} /></button>
          {onCollapseSidebar && (
            <button type="button" className="btn-icon compact pcf-hbtn pcf-collapse-btn" title={t('desktop.collapseSidebar')} aria-label={t('desktop.collapseSidebar')} onClick={onCollapseSidebar}>«</button>
          )}
        </span>
      </div>

      <div className="pcf-cwd-row">
        <button type="button" className="btn-icon compact" onClick={back} aria-label={t('shell.back')} title={t('shell.back')} style={{ flexShrink: 0 }}>←</button>
        <span className="pcf-cwd" title={cwd ?? ""}>{cwd ?? "…"}</span>
      </div>

      <div className="pcf-change-row" ref={projectMenuRef} style={{ position: "relative" }}>
        <button type="button" className="pcf-change-btn" onClick={openChangeFolder} title="Cambiar carpeta">
          <FolderIcon size={11} /> Cambiar carpeta
        </button>
        <button type="button" className="pcf-change-chevron" onClick={() => setShowProjectMenu(v => !v)} aria-expanded={showProjectMenu} title="Proyectos recientes" aria-label="Proyectos recientes">▾</button>
        {showProjectMenu && (
          <div className="pcf-dropdown">
            <div className="pcf-dropdown-title">Proyectos recientes</div>
            {explorerRecent.length === 0 ? (
              <div className="pcf-dropdown-empty">Sin proyectos recientes</div>
            ) : explorerRecent.map(p => {
              const label = p.split(/[/\\]/).filter(Boolean).pop() || p
              const isActive = cwd === p
              return (
                <button key={p} type="button" className="pcf-dropdown-item" style={{ fontWeight: isActive ? 600 : 400 }} onClick={() => { setShowProjectMenu(false); load(p) }} title={p}>
                  <span className="pcf-dropdown-label"><FolderIcon size={13} /> <span className="pcf-dropdown-name">{label}</span></span>
                  <span className="pcf-dropdown-path">{p}</span>
                </button>
              )
            })}
            <div className="pcf-dropdown-sep" />
            <button type="button" className="pcf-dropdown-item" onClick={() => { setShowProjectMenu(false); openChangeFolder() }}><FolderIcon size={14} /> Cambiar carpeta…</button>
          </div>
        )}
      </div>

      <div className="pcf-search-row">
        {searchMode === "code" ? (
          <CodeIcon size={14} className="pcf-search-icon" />
        ) : (
          <SearchIcon size={14} className="pcf-search-icon" />
        )}
        <input
          ref={searchRef}
          className="pcf-search"
          type="search"
          placeholder={searchMode === "code" ? "Buscar código o texto en archivos..." : "Buscar archivos por nombre..."}
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label={searchMode === "code" ? "Buscar código" : "Buscar archivos"}
        />
        {query && <button type="button" className="btn-icon compact pcf-search-clear" onClick={() => setQuery("")} aria-label="Limpiar">×</button>}
      </div>

      <div className="pcf-search-mode-tabs">
        <button
          type="button"
          className={`pcf-search-tab ${searchMode === "files" ? "active" : ""}`}
          onClick={() => {
            setSearchMode("files")
            searchRef.current?.focus()
          }}
          title="Buscar por nombre de archivo o carpeta"
        >
          <FolderIcon size={10} /> Archivos
        </button>
        <button
          type="button"
          className={`pcf-search-tab ${searchMode === "code" ? "active" : ""}`}
          onClick={() => {
            setSearchMode("code")
            searchRef.current?.focus()
          }}
          title="Buscar texto o código dentro de los archivos"
        >
          <CodeIcon size={10} /> Código
        </button>
      </div>

      {shellOk === false && (
        <div className="pcf-banner">
          PC no alcanzable por Tailscale — verificá que OpenHer Desktop esté abierto, Tailscale conectado y el firewall permita el puerto 4848. Si cambiaste el server, revisá Ajustes → Servidores. <code>New-NetFirewallRule -DisplayName "OpenHer 4848" -Direction Inbound -Protocol TCP -LocalPort 4848 -Action Allow -Profile Private</code>
        </div>
      )}

      {notice && <div className="pcf-notice">{notice}</div>}

      {showDrives && (
        <div className="pcf-drives">
          {drives.map(d => (
            <button key={d} type="button" className={`pcf-drive${cwd === d ? " active" : ""}`} onClick={() => load(d)}>{d}</button>
          ))}
        </div>
      )}

      {searchMode === "code" ? (
        <div className="pcf-tree" role="region" aria-label="Resultados de búsqueda de código">
          <CodeSearchResults
            results={codeResults}
            searching={codeSearching}
            query={query}
            cwd={cwd}
            downloading={downloading}
            onDownload={handleDownload}
          />
        </div>
      ) : (
        <div className="pcf-tree" role="tree" aria-label="Archivos" onContextMenu={(e) => handleContextMenu(e, null, true)}>
          {creatingType && (
            <div className="pcf-row pcf-inline-create" onClick={(e) => e.stopPropagation()}>
              <span className="pcf-chevron" />
              {creatingType === "folder" ? (
                <FolderIcon size={13} className="pcf-glyph" />
              ) : (
                <span className="pcf-glyph" style={{ color: "#818cf8" }}>
                  <FileIcon size={13} />
                </span>
              )}
              <input
                ref={createInputRef}
                type="text"
                className="pcf-inline-input"
                value={newItemName}
                placeholder={creatingType === "folder" ? "nombre-carpeta" : "nombre-archivo.ext"}
                onChange={(e) => setNewItemName(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    const clean = newItemName.trim().replace(/[/\\]/g, "")
                    if (!clean || !cwd) {
                      setCreatingType(null)
                      return
                    }
                    const sep = cwd.includes("\\") ? "\\" : "/"
                    const full = `${cwd}${cwd.endsWith(sep) ? "" : sep}${clean}`
                    setCreatingType(null)
                    try {
                      if (creatingType === "folder") {
                        await shell.fs.mkdir(full)
                        showNotice(`Carpeta creada: ${clean}`)
                      } else {
                        await shell.fs.write(full, "")
                        showNotice(`Archivo creado: ${clean}`)
                      }
                      load(cwd)
                    } catch {
                      showNotice(`Error al crear ${creatingType === "folder" ? "carpeta" : "archivo"}`)
                    }
                  } else if (e.key === "Escape") {
                    setCreatingType(null)
                  }
                }}
                onBlur={() => {
                  if (!newItemName.trim()) setCreatingType(null)
                }}
                autoFocus
              />
            </div>
          )}
          {loading && <div className="pcf-loading">Cargando…</div>}
          {error && !loading && <div className="pcf-error">{error}</div>}
          {!loading && !error && (
            <>
              {showDrives && favorites.length > 0 && (
                <div className="pcf-group">
                  <div className="pcf-group-title">Favoritos</div>
                  {favorites.map(f => (
                    <div key={f} className="pcf-row" onDoubleClick={() => load(f)} title={f}>
                      <FolderIcon size={13} className="pcf-glyph" />
                      <span className="pcf-name">{f.split(/[/\\]/).pop() || f}</span>
                      <button type="button" className="btn-icon compact pcf-star" title={t('shell.removeFav')} onClick={() => fav(f, false)}>×</button>
                    </div>
                  ))}
                </div>
              )}
              {filteredDirs.map(d => (
                <TreeFolder
                  key={d.path}
                  entry={d}
                  depth={0}
                  onEnterDir={nav}
                  query={query}
                  downloading={downloading}
                  onDownload={handleDownload}
                  favorites={favorites}
                  onFav={fav}
                  showNotice={showNotice}
                  onContextMenu={handleContextMenu}
                />
              ))}
              {filteredDirs.length === 0 && qLower && <div className="pcf-empty">Sin carpetas</div>}
              <div className="pcf-files">
                {filteredFiles.map(f => (
                  <FileRow
                    key={f.path}
                    file={f}
                    depth={0}
                    downloading={downloading}
                    onDownload={handleDownload}
                    isFav={favorites.includes(f.path)}
                    onToggleFav={fav}
                    showNotice={showNotice}
                    onContextMenu={handleContextMenu}
                  />
                ))}
                {filteredFiles.length === 0 && filteredDirs.length === 0 && !qLower && <div className="pcf-empty">Vacío</div>}
                {filteredFiles.length === 0 && qLower && <div className="pcf-empty">Sin archivos</div>}
              </div>
            </>
          )}
        </div>
      )}

      <div className="pcf-footer">
        <button type="button" className="btn-icon compact" onClick={() => setShowDrives(v => !v)} title={showDrives ? "Ocultar unidades" : "Ver discos"} aria-label="Ver discos"><FolderIcon size={13} /> {showDrives ? "Ocultar" : "Discos"}</button>
        <span className="pcf-count">
          {searchMode === "code"
            ? `${codeResults?.total_matches ?? 0} coincidencias`
            : `${filteredDirs.length} carpetas · ${filteredFiles.length} archivos`}
        </span>
      </div>
      {/* Menú contextual — DESIGN.md: --surface, 1px --border, radius 6px, tokens */}
      {contextMenu && createPortal(
        <div
          ref={contextMenuRef}
          className="modal-dropdown fade-in"
          style={{
            position: "fixed",
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 100000,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-sm)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
            padding: "4px 0",
            minWidth: "230px",
            maxHeight: `calc(100vh - ${contextMenu.y}px - 12px)`,
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {contextMenu.entry ? (
            <>
              {!contextMenu.isDir && isExecScript(contextMenu.entry.path) && (
                <button type="button" className="overflow-item" style={{ color: "var(--primary)", fontWeight: 600 }} onClick={() => { const e = contextMenu.entry!; setContextMenu(null); setExecConfirm({ path: e.path, name: e.name }) }}>
                  <span><TerminalIcon size={14} /></span> Ejecutar script
                </button>
              )}
              {!contextMenu.isDir && (contextMenu.entry.name.endsWith(".docx") || contextMenu.entry.name.endsWith(".pdf") || contextMenu.entry.name.endsWith(".md") || contextMenu.entry.name.endsWith(".txt")) && (
                <>
                  {contextMenu.entry.name.endsWith(".docx") && (
                    <button type="button" className="overflow-item" onClick={() => { const p = contextMenu.entry!.path; setContextMenu(null); shell.doc.convert(p, "md").then((r: any) => { if (r.ok) { showNotice(`Convertido a Markdown: ${r.dest}`); if (cwd) load(cwd) } }).catch((e: any) => showNotice(`Error: ${e.message || String(e)}`)) }}>
                      <span><FileIcon size={14} /></span> Convertir a Markdown (.md)
                    </button>
                  )}
                  {contextMenu.entry.name.endsWith(".pdf") && (
                    <button type="button" className="overflow-item" onClick={() => { const p = contextMenu.entry!.path; setContextMenu(null); shell.doc.convert(p, "md").then((r: any) => { if (r.ok) { showNotice(`Extraído texto a Markdown: ${r.dest}`); if (cwd) load(cwd) } }).catch((e: any) => showNotice(`Error: ${e.message || String(e)}`)) }}>
                      <span><FileIcon size={14} /></span> Extraer texto a Markdown (.md)
                    </button>
                  )}
                  {(contextMenu.entry.name.endsWith(".md") || contextMenu.entry.name.endsWith(".txt")) && (
                    <>
                      <button type="button" className="overflow-item" onClick={() => { const p = contextMenu.entry!.path; setContextMenu(null); shell.doc.convert(p, "docx").then((r: any) => { if (r.ok) { showNotice(`Convertido a Word: ${r.dest}`); if (cwd) load(cwd) } }).catch((e: any) => showNotice(`Error: ${e.message || String(e)}`)) }}>
                        <span><FileIcon size={14} /></span> Convertir a Word (.docx)
                      </button>
                      <button type="button" className="overflow-item" onClick={() => { const p = contextMenu.entry!.path; setContextMenu(null); shell.doc.convert(p, "pdf").then((r: any) => { if (r.ok) { showNotice(`Convertido a PDF: ${r.dest}`); if (cwd) load(cwd) } }).catch((e: any) => showNotice(`Error: ${e.message || String(e)}`)) }}>
                        <span><FileIcon size={14} /></span> Convertir a PDF (.pdf)
                      </button>
                    </>
                  )}
                </>
              )}
              <button type="button" className="overflow-item" onClick={() => { if (contextMenu.isDir) nav(contextMenu.entry!.path); else handleDownload(contextMenu.entry!); setContextMenu(null) }}>
                <span><FolderIcon size={14} /></span> {contextMenu.isDir ? "Abrir carpeta" : "Abrir / Descargar"}
              </button>
              <button type="button" className="overflow-item" onClick={() => copyRelativePath(contextMenu.entry!.path)}>
                <span><LinkIcon size={14} /></span> Obtener ruta relativa
              </button>
              <button type="button" className="overflow-item" onClick={() => copyFullPath(contextMenu.entry!.path)}>
                <span><SaveIcon size={14} /></span> Obtener ruta completa
              </button>
              <button type="button" className="overflow-item" onClick={() => handleCreateFileHere(contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : cwd || "")}>
                <span><FileIcon size={14} /></span> Nuevo archivo
              </button>
              <button type="button" className="overflow-item" onClick={() => handleCreateFolderHere(contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : cwd || "")}>
                <span><FolderIcon size={14} /></span> Nueva carpeta
              </button>
              <button type="button" className="overflow-item" onClick={() => handleCopyItem(contextMenu.entry!)}>
                <span><SaveIcon size={14} /></span> Copiar {contextMenu.isDir ? "carpeta" : "archivo"}
              </button>
              <button type="button" className="overflow-item" onClick={() => { const p = contextMenu.entry!.path; setContextMenu(null); shell.fs.reveal(p).then(() => showNotice("Abierto en el Explorador")).catch(() => showNotice("No se pudo abrir")) }}>
                <span><MonitorIcon size={14} /></span> Abrir en el Explorador
              </button>
              <button type="button" className="overflow-item" style={{ color: "var(--danger)" }} onClick={() => handleDeleteItem(contextMenu.entry!)}>
                <span><TrashIcon size={14} /></span> Eliminar
              </button>
            </>
          ) : (
            <>
              <button type="button" className="overflow-item" onClick={() => handleCreateFileHere(cwd || "")}>
                <span><FileIcon size={14} /></span> Nuevo archivo aquí
              </button>
              <button type="button" className="overflow-item" onClick={() => handleCreateFolderHere(cwd || "")}>
                <span><FolderIcon size={14} /></span> Nueva carpeta aquí
              </button>
            </>
          )}
          {copiedItem && (
            <button type="button" className="overflow-item" onClick={() => handlePasteItem(contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : cwd || "")}>
              <span><SaveIcon size={14} /></span> Pegar "{copiedItem.name}"
            </button>
          )}
        </div>,
        document.body
      )}
      {execConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100001, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)" }} onClick={() => setExecConfirm(null)}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", padding: 16, minWidth: 320, maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8 }}><TerminalIcon size={16} /> Ejecutar archivo</h3>
            <p style={{ margin: "12px 0 6px", fontSize: "0.85rem" }}>¿Ejecutar <strong>{execConfirm.name}</strong>?</p>
            <p style={{ wordBreak: "break-all", fontSize: "0.75rem", color: "var(--muted)", margin: "0 0 14px" }}>{execConfirm.path}</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" className="btn-secondary compact" onClick={() => setExecConfirm(null)}>Cancelar</button>
              <button type="button" className="btn-primary compact" onClick={async () => { const t = execConfirm; setExecConfirm(null); try { const r = await shell.fs.execFile(t.path); showNotice(r.ok ? `Ejecutando: ${t.name}` : "Error al ejecutar") } catch (e: any) { showNotice(`Error: ${e?.message || String(e)}`) } }}>
                <TerminalIcon size={14} /> Ejecutar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
