import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import {
  FolderIcon,
  RefreshIcon,
  FileIcon,
  SearchIcon,
  CodeIcon,
  TerminalIcon,
  SaveIcon,
  LinkIcon,
  MonitorIcon,
  TrashIcon,
  NewFileIcon,
  NewFolderIcon,
  CollapseAllIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
  SplitIcon,
  EyeIcon,
  PencilIcon,
  ArrowLeftIcon,
} from "../../Icons"
import { shell, type FsEntry, type CodeSearchResult } from "../../shell"
import { useT } from "../../i18n-context"
import { useDialog } from "../../components/DialogProvider"
import { useOutsideClick } from "../../hooks/useOutsideClick"
import { FileRow } from "./FileRow"
import { TreeFolder } from "./TreeFolder"
import { CodeSearchResults } from "./CodeSearchResults"
import { HlCodeHtml, highlightToHtml } from "../../components/HighlightedCode"
import { useGitStatus } from "./useGitStatus"
import { HtmlPreview } from "./HtmlPreview"
import { usePaneState } from "./usePaneState"

const EXPLORER_RECENT_KEY = "opencode.explorer.recentDirs"
function loadExplorerRecent(): string[] {
  try {
    const raw = localStorage.getItem(EXPLORER_RECENT_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr.filter((s: unknown) => typeof s === "string" && s).slice(0, 20) : []
  } catch {
    return []
  }
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

function getParentPath(p: string | null): string | null {
  if (!p) return null
  const trimmed = p.replace(/[\\/]+$/, "")
  if (!trimmed) return null
  if (/^[a-zA-Z]:$/.test(trimmed)) return null
  const lastSlash = Math.max(trimmed.lastIndexOf("/"), trimmed.lastIndexOf("\\"))
  if (lastSlash < 0) return null
  const parent = trimmed.slice(0, lastSlash)
  if (!parent) return trimmed.startsWith("/") ? "/" : null
  if (/^[a-zA-Z]:$/.test(parent)) return `${parent}\\`
  return parent || null
}

// Líneas de código con los colores del editor: un solo highlight del archivo
// completo (mismo HighlightedCode del chat, sin duplicar lógica) repartido
// por línea para conservar número de línea y scroll al target. Mismo DOM.
const PcfCodeLines = memo(function PcfCodeLines({ path, content, target }: { path: string; content: string; target: number }) {
  const lines = useMemo(() => content.split("\n"), [content])
  const hlLines = useMemo(() => {
    const parts = highlightToHtml(path, content).split("\n")
    return parts.length === lines.length ? parts : null
  }, [path, content, lines])
  if (!hlLines) {
    return (
      <pre className="pcf-code-content">
        {lines.map((line, idx) => {
          const n = idx + 1
          return (
            <div key={n} data-line={n} className={`pcf-code-line ${n === target ? "is-target" : ""}`}>
              <span className="pcf-code-line-num">{n}</span>
              <span className="pcf-code-line-text">{line || " "}</span>
            </div>
          )
        })}
      </pre>
    )
  }
  return (
    <pre className="pcf-code-content">
      {lines.map((line, idx) => {
        const n = idx + 1
        const hl = hlLines[idx] || ""
        return (
          <div key={n} data-line={n} className={`pcf-code-line ${n === target ? "is-target" : ""}`}>
            <span className="pcf-code-line-num">{n}</span>
            <span className="pcf-code-line-text">{hl ? <HlCodeHtml html={hl} /> : (line || " ")}</span>
          </div>
        )
      })}
    </pre>
  )
})

export const PCFilesPanel = memo(function PCFilesPanel({
  onCollapseSidebar,
  onOpenFile,
}: {
  onCollapseSidebar?: () => void
  onOpenFile?: (path: string) => void
}) {
  const t = useT()
  const { confirm } = useDialog()
  const [cwd, setCwd] = useState<string | null>(null)
  const [dirs, setDirs] = useState<FsEntry[]>([])
  const [files, setFiles] = useState<FsEntry[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [drives, setDrives] = useState<string[]>([])
  const [showDrives, setShowDrives] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [searchMode, setSearchMode] = useState<"files" | "code">("files")
  const [codeResults, setCodeResults] = useState<CodeSearchResult | null>(null)
  const [codeSearching, setCodeSearching] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [rootExpanded, setRootExpanded] = useState(true)
  const [collapseSignal, setCollapseSignal] = useState(0)

  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const projectMenuRef = useRef<HTMLDivElement | null>(null)
  const [explorerRecent, setExplorerRecent] = useState<string[]>(() => loadExplorerRecent())
  useOutsideClick(projectMenuRef, () => setShowProjectMenu(false), showProjectMenu)

  const searchRef = useRef<HTMLInputElement | null>(null)
  const [creatingType, setCreatingType] = useState<"file" | "folder" | null>(null)
  const [newItemName, setNewItemName] = useState("")
  const createInputRef = useRef<HTMLInputElement | null>(null)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    entry: FsEntry | null
    isDir: boolean
  } | null>(null)
  const contextMenuRef = useRef<HTMLDivElement | null>(null)
  const [copiedItem, setCopiedItem] = useState<FsEntry | null>(null)
  const [execConfirm, setExecConfirm] = useState<{ path: string; name: string } | null>(null)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [renamingValue, setRenamingValue] = useState("")
  const [renamingPane, setRenamingPane] = useState<"first" | "second" | null>(null)

  const { refreshGit, getFileGitStatus, getFolderGitStatus } = useGitStatus(cwd)

  useEffect(() => {
    if (creatingType && createInputRef.current) {
      createInputRef.current.focus()
    }
  }, [creatingType])

  const showNotice = useCallback((msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice((m) => (m === msg ? null : m)), 2800)
  }, [])

  const isExecScript = (p?: string) => {
    if (!p) return false
    const v = p.toLowerCase()
    return (
      v.endsWith(".bat") ||
      v.endsWith(".cmd") ||
      v.endsWith(".vbs") ||
      v.endsWith(".ps1") ||
      v.endsWith(".exe") ||
      v.endsWith(".sh")
    )
  }

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, entry: FsEntry | null, isDir: boolean) => {
      e.preventDefault()
      e.stopPropagation()
      const menuW = 240
      const menuH = 420
      const x = e.clientX + menuW > window.innerWidth ? Math.max(8, e.clientX - menuW) : e.clientX
      const y = e.clientY + menuH > window.innerHeight ? Math.max(8, window.innerHeight - menuH - 8) : e.clientY
      setContextMenu({ x, y, entry, isDir })
    },
    []
  )

  const handleContextMenuFirst = useCallback(
    (e: React.MouseEvent, entry: FsEntry | null, isDir: boolean) => {
      setContextMenuPane("first")
      setActivePane("first")
      handleContextMenu(e, entry, isDir)
    },
    [handleContextMenu],
  )
  const handleContextMenuSecond = useCallback(
    (e: React.MouseEvent, entry: FsEntry | null, isDir: boolean) => {
      setContextMenuPane("second")
      setActivePane("second")
      handleContextMenu(e, entry, isDir)
    },
    [handleContextMenu],
  )
  void handleContextMenuSecond

  useEffect(() => {
    if (!contextMenu) return
    const onDocClick = (e: PointerEvent) => {
      const target = e.target as Node
      if (contextMenuRef.current?.contains(target)) return
      setContextMenu(null)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null)
    }
    document.addEventListener("pointerdown", onDocClick, true)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onDocClick, true)
      document.removeEventListener("keydown", onKey)
    }
  }, [contextMenu])

  const copyRelativePath = (path: string) => {
    const base = contextMenuPane === "second" ? secondPane.cwd : cwd
    const rel = base && path.startsWith(base) ? path.slice(base.length).replace(/^[/\\]+/, "") : path
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
    const targetCwd = contextMenuPane === "second" ? secondPane.cwd : cwd
    const targetLoad = contextMenuPane === "second" ? secondPane.load : load
    try {
      await shell.fs.copy(copiedItem.path, destDir)
      showNotice(`Pegado en ${destDir.split(/[/\\]/).pop() || destDir}`)
      targetLoad(destDir === targetCwd ? destDir : targetCwd || destDir)
    } catch {
      showNotice("Error al pegar")
    }
  }

  const handleDeleteItem = async (entry: FsEntry) => {
    setContextMenu(null)
    if (!(await confirm({ message: `¿Eliminar definitivamente "${entry.name}"?`, confirmText: t('common.yes'), cancelText: t('common.cancel'), variant: "danger" }))) return
    try {
      await shell.fs.delete(entry.path)
      showNotice(`Eliminado: ${entry.name}`)
      if (contextMenuPane === "second" && secondPane.cwd) secondPane.load(secondPane.cwd)
      else if (cwd) load(cwd)
    } catch {
      showNotice("Error al eliminar")
    }
  }

  const startRenameFirst = useCallback((entry: FsEntry) => {
    setRenamingPath(entry.path)
    setRenamingValue(entry.name)
    setRenamingPane("first")
    setContextMenu(null)
  }, [])
  const startRenameSecond = useCallback((entry: FsEntry) => {
    setRenamingPath(entry.path)
    setRenamingValue(entry.name)
    setRenamingPane("second")
    setContextMenu(null)
  }, [])

  const cancelRename = useCallback(() => {
    setRenamingPath(null)
    setRenamingValue("")
    setRenamingPane(null)
  }, [])

  const handleCreateFileHere = (dir: string) => {
    setContextMenu(null)
    setCreatingType("file")
    setNewItemName("")
    const targetLoad = contextMenuPane === "second" ? secondPane.load : load
    const targetCwd = contextMenuPane === "second" ? secondPane.cwd : cwd
    if (targetCwd !== dir) targetLoad(dir)
  }

  const handleCreateFolderHere = (dir: string) => {
    setContextMenu(null)
    setCreatingType("folder")
    setNewItemName("")
    const targetLoad = contextMenuPane === "second" ? secondPane.load : load
    const targetCwd = contextMenuPane === "second" ? secondPane.cwd : cwd
    if (targetCwd !== dir) targetLoad(dir)
  }

  const load = useCallback(
    async (path: string) => {
      if (!path) return
      setCwd(path)
      setLoading(true)
      setError(null)
      try {
        const r = await shell.fs.list(path)
        setDirs(r.dirs || [])
        setFiles(r.files || [])

        const cur = loadExplorerRecent().filter((p) => p !== path)
        cur.unshift(path)
        try {
          localStorage.setItem(EXPLORER_RECENT_KEY, JSON.stringify(cur.slice(0, 20)))
        } catch {}
        setExplorerRecent(cur.slice(0, 20))
      } catch (e: any) {
        setError(e?.message || "No se pudo leer el directorio")
      } finally {
        setLoading(false)
        refreshGit()
      }
    },
    [refreshGit]
  )

  const loadRef = useRef(load)
  useEffect(() => { loadRef.current = load }, [load])
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    shell.fs
      .favorites()
      .then(({ favorites: f }) => setFavorites(f))
      .catch(() => {})
    const recent = loadExplorerRecent()
    if (recent.length > 0 && recent[0]) {
      loadRef.current(recent[0])
      shell.fs
        .drives()
        .then(({ drives: d }) => setDrives(d))
        .catch(() => {})
    } else {
      shell.fs
        .drives()
        .then(({ drives: d }) => {
          setDrives(d)
          if (d.length > 0 && d[0]) loadRef.current(d[0])
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (searchMode !== "code" || !query.trim() || !cwd) {
      setCodeResults(null)
      setCodeSearching(false)
      return
    }
    let cancelled = false
    const q = query.trim()
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

  const openChangeFolder = async () => {
    try {
      const picked = await shell.fs.pickFolder()
      const p = (picked as { path?: string | null })?.path
      if (p) (activePane === "second" ? secondPane.load(p) : load(p))
    } catch {}
  }

  const fav = (path: string, add: boolean) => {
    shell.fs
      .toggleFavorite(path, add)
      .then(() =>
        shell.fs
          .favorites()
          .then(({ favorites: favs }) => setFavorites(favs))
          .catch(() => {})
      )
  }

  const handleDownload = useCallback(
    async (entry: FsEntry) => {
      if (downloading) return
      setDownloading(entry.path)
      try {
        const blob = await shell.fs.download(entry.path)
        const fileName = entry.name || "download"
        if (Capacitor.isNativePlatform()) {
          const b64 = await blobToBase64(blob)
          const saved = await Filesystem.writeFile({
            path: fileName,
            data: b64,
            directory: Directory.Cache,
          })
          try {
            await Share.share({ title: fileName, url: saved.uri })
          } catch {}
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
    },
    [downloading, showNotice]
  )

  const [codeViewer, setCodeViewer] = useState<{ path: string; line: number; content: string } | null>(null)
  const [htmlPreview, setHtmlPreview] = useState<{ path: string } | null>(null)
  const [showSecondPane, setShowSecondPane] = useState(false)
  const secondPane = usePaneState()
  const [activePane, setActivePane] = useState<"first" | "second">("first")
  const [contextMenuPane, setContextMenuPane] = useState<"first" | "second">("first")

  const isHtmlFile = (name: string) => /\.html?$/i.test(name)

  const commitRename = useCallback(async (entry: FsEntry) => {
    const clean = renamingValue.trim()
    if (!clean || clean === entry.name) { setRenamingPath(null); setRenamingValue(""); setRenamingPane(null); return }
    if (/[/\\]/.test(clean)) { showNotice("El nombre no puede contener / o \\"); return }
    try {
      await shell.fs.rename(entry.path, clean)
      showNotice(`Renombrado a ${clean}`)
      const pane = renamingPane ?? contextMenuPane
      setRenamingPath(null); setRenamingValue(""); setRenamingPane(null)
      if (pane === "second" && secondPane.cwd) secondPane.load(secondPane.cwd)
      else if (cwd) load(cwd)
    } catch (e: any) {
      showNotice(`Error al renombrar: ${e?.message || String(e)}`)
    }
  }, [renamingValue, cwd, secondPane, contextMenuPane, renamingPane, showNotice, load])

  const [dragOverPath, setDragOverPath] = useState<string | null>(null)
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }, [])
  const handleDragEnter = useCallback((e: React.DragEvent, dest: string) => {
    e.preventDefault()
    setDragOverPath(dest)
  }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if ((e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) return
    setDragOverPath(null)
  }, [])
  const handleFileDrop = useCallback(
    async (e: React.DragEvent, destDir: string) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverPath(null)
      const src = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
      if (!src || !destDir || src === destDir) return
      if (destDir.startsWith(src + "\\") || destDir.startsWith(src + "/")) return
      try {
        await shell.fs.move(src, destDir)
        showNotice(`Movido a ${destDir.split(/[/\\]/).pop()}`)
        if (cwd && (src.startsWith(cwd) || destDir === cwd)) load(cwd)
        if (showSecondPane && secondPane.cwd && (src.startsWith(secondPane.cwd) || destDir === secondPane.cwd))
          secondPane.load(secondPane.cwd)
      } catch (err) {
        showNotice(`Error al mover: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
    [cwd, showSecondPane, secondPane, load, showNotice],
  )

  // Abrir en editor/visor — click primario NO descarga
  const handleOpenFile = useCallback(
    async (entry: FsEntry) => {
      if (onOpenFile) {
        onOpenFile(entry.path)
        return
      }
      // HTML → visor con preview tipo navegador (CSS embebido o externo)
      if (isHtmlFile(entry.name)) {
        setHtmlPreview({ path: entry.path })
        setCodeViewer(null)
        showNotice(`Vista previa: ${entry.name}`)
        return
      }
      // Fallback inline (móvil / sin grid): lee como texto y muestra visor; binarios → descarga
      try {
        const res: any = await shell.fs.read(entry.path)
        const text: string = res?.content ?? res?.data ?? res?.text ?? ""
        if (typeof text === "string" && text) {
          setCodeViewer({ path: entry.path, line: 1, content: text.slice(0, 30000) })
          showNotice(`Abierto: ${entry.name}`)
          return
        }
        if (typeof res === "string" && res) {
          setCodeViewer({ path: entry.path, line: 1, content: String(res).slice(0, 30000) })
          showNotice(`Abierto: ${entry.name}`)
          return
        }
      } catch {}
      // Si no se pudo leer como texto (binario / error) → descarga como fallback
      void handleDownload(entry)
    },
    [onOpenFile, showNotice, handleDownload]
  )
  const handleOpenAtLine = useCallback(
    async (path: string, line: number) => {
      try {
        const res: any = await shell.fs.read(path)
        const text: string = res?.content ?? res?.data ?? res?.text ?? ""
        if (!text && typeof res === "string") {
          setCodeViewer({ path, line, content: String(res).slice(0, 30000) })
        } else if (typeof text === "string" && text) {
          setCodeViewer({ path, line, content: text.slice(0, 30000) })
        } else {
          const blob = await shell.fs.download(path)
          const txt = await blob.text()
          setCodeViewer({ path, line, content: txt.slice(0, 30000) })
        }
        showNotice(`Abierto en línea ${line}: ${path.split(/[/\\]/).pop()}`)
      } catch (e) {
        showNotice(`Error al abrir: ${e instanceof Error ? e.message : String(e)}`)
      }
    },
    [showNotice]
  )

  const workspaceName = useMemo(() => {
    if (!cwd) return "WORKSPACE"
    const cleaned = cwd.replace(/[/\\]+$/, "")
    const parts = cleaned.split(/[/\\]/)
    return parts[parts.length - 1] || cleaned
  }, [cwd])

  const parentPath = useMemo(() => getParentPath(cwd), [cwd])
  const canGoBack = !!parentPath && !!cwd

  const qLower = query.trim().toLowerCase()
  const filteredDirs = qLower ? dirs.filter((d) => d.name.toLowerCase().includes(qLower)) : dirs
  const filteredFiles = qLower ? files.filter((f) => f.name.toLowerCase().includes(qLower)) : files

  const secondWorkspaceName = useMemo(() => {
    const c = secondPane.cwd
    if (!c) return "WORKSPACE"
    const cleaned = c.replace(/[/\\]+$/, "")
    const parts = cleaned.split(/[/\\]/)
    return parts[parts.length - 1] || cleaned
  }, [secondPane.cwd])
  const secondParentPath = useMemo(() => getParentPath(secondPane.cwd), [secondPane.cwd])
  const secondCanGoBack = !!secondParentPath && !!secondPane.cwd
  const secondFilteredDirs = qLower
    ? secondPane.dirs.filter((d) => d.name.toLowerCase().includes(qLower))
    : secondPane.dirs
  const secondFilteredFiles = qLower
    ? secondPane.files.filter((f) => f.name.toLowerCase().includes(qLower))
    : secondPane.files

  return (
    <div className="pcf-root">
      {/* 1. Header principal VS Code: Explorer + ... */}
      <div className="pcf-header pcf-header--vscode">
        <span className="pcf-title">Explorer</span>
        <div className="pcf-header-actions" ref={projectMenuRef} style={{ position: "relative" }}>
          <button
            type="button"
            className="pcf-hbtn"
            title="Buscar en archivos"
            aria-label="Buscar en archivos"
            onClick={() => setShowSearch((v) => !v)}
          >
            <SearchIcon size={14} />
          </button>
          <button
            type="button"
            className="pcf-hbtn"
            title="Más acciones de explorador"
            aria-label="Más acciones de explorador"
            onClick={() => setShowProjectMenu((v) => !v)}
          >
            <MoreHorizontalIcon size={14} />
          </button>
          {onCollapseSidebar && (
            <button
              type="button"
              className="pcf-hbtn pcf-collapse-btn"
              title={t("desktop.collapseSidebar")}
              aria-label={t("desktop.collapseSidebar")}
              onClick={onCollapseSidebar}
            >
              «
            </button>
          )}

          {showProjectMenu && (
            <div className="pcf-dropdown">
              <div className="pcf-dropdown-title">Proyectos recientes</div>
              {explorerRecent.length === 0 ? (
                <div className="pcf-dropdown-empty">Sin proyectos recientes</div>
              ) : (
                explorerRecent.map((p) => {
                  const label = p.split(/[/\\]/).filter(Boolean).pop() || p
                  const isActive = cwd === p
                  return (
                    <button
                      key={p}
                      type="button"
                      className="pcf-dropdown-item"
                      style={{ fontWeight: isActive ? 600 : 400 }}
                      onClick={() => {
                        setShowProjectMenu(false)
                        load(p)
                      }}
                      title={p}
                    >
                      <span className="pcf-dropdown-label">
                        <FolderIcon size={13} /> <span className="pcf-dropdown-name">{label}</span>
                      </span>
                      <span className="pcf-dropdown-path">{p}</span>
                    </button>
                  )
                })
              )}
              <div className="pcf-dropdown-sep" />
              <button
                type="button"
                className="pcf-dropdown-item"
                onClick={() => {
                  setShowProjectMenu(false)
                  openChangeFolder()
                }}
              >
                <span className="pcf-dropdown-label">
                  <FolderIcon size={13} />
                  <span>Abrir carpeta…</span>
                </span>
              </button>
              <button
                type="button"
                className="pcf-dropdown-item"
                onClick={() => {
                  setShowProjectMenu(false)
                  setShowDrives((v) => !v)
                }}
              >
                <span className="pcf-dropdown-label">
                  <FolderIcon size={13} />
                  <span>{showDrives ? "Ocultar discos" : "Mostrar discos"}</span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Barra de búsqueda opcional */}
      {showSearch && (
        <>
          <div className="pcf-search-row">
            {searchMode === "code" ? (
              <CodeIcon size={13} className="pcf-search-icon" />
            ) : (
              <SearchIcon size={13} className="pcf-search-icon" />
            )}
            <input
              ref={searchRef}
              className="pcf-search"
              type="search"
              placeholder={searchMode === "code" ? "Buscar código..." : "Buscar archivos..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={searchMode === "code" ? "Buscar código" : "Buscar archivos"}
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="btn-icon compact pcf-search-clear"
                onClick={() => setQuery("")}
                aria-label="Limpiar"
              >
                ×
              </button>
            )}
          </div>
          <div className="pcf-search-mode-tabs">
            <button
              type="button"
              className={`pcf-search-tab ${searchMode === "files" ? "active" : ""}`}
              onClick={() => setSearchMode("files")}
            >
              Archivos
            </button>
            <button
              type="button"
              className={`pcf-search-tab ${searchMode === "code" ? "active" : ""}`}
              onClick={() => setSearchMode("code")}
            >
              Código
            </button>
          </div>
        </>
      )}

      {notice && <div className="pcf-notice">{notice}</div>}

      {showDrives && (
        <div className="pcf-drives">
          {drives.map((d) => (
            <button
              key={d}
              type="button"
              className={`pcf-drive${(activePane === "second" ? secondPane.cwd : cwd) === d ? " active" : ""}`}
              onClick={() => (activePane === "second" ? secondPane.load(d) : load(d))}
            >
              {d}
            </button>
          ))}
        </div>
      )}

      {searchMode === "code" && query.trim() ? (
        <div className="pcf-tree" role="region" aria-label="Resultados de búsqueda de código">
          <CodeSearchResults
            results={codeResults}
            searching={codeSearching}
            query={query}
            cwd={cwd}
            downloading={downloading}
            onDownload={handleDownload}
            onOpenAtLine={handleOpenAtLine}
          />
        </div>
      ) : (
        <div className="pcf-tree-container" style={showSecondPane ? { display: "flex", gap: 8, alignItems: "stretch" } : undefined}>
          <div
            style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
            onClick={() => setActivePane("first")}
          >
          {/* 2. Sección del proyecto / Workspace: ← volver + ⌄ nombre-proyecto + 5 botones */}
          <div className="pcf-workspace-header">
            <button
              type="button"
              className="pcf-action-btn pcf-back-btn"
              title={canGoBack ? `Volver a ${parentPath}` : "No hay carpeta anterior"}
              aria-label="Volver a la carpeta anterior"
              disabled={!canGoBack}
              onClick={() => parentPath && load(parentPath)}
            >
              <ArrowLeftIcon size={14} />
            </button>
            <div
              className="pcf-workspace-title"
              onClick={() => setRootExpanded((v) => !v)}
              title={cwd ?? ""}
            >
              <span className="pcf-chevron">
                {rootExpanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
              </span>
              <span className="pcf-workspace-name">{workspaceName}</span>
            </div>

            <div className="pcf-workspace-actions">
              <button
                type="button"
                className="pcf-action-btn"
                title="Nuevo archivo"
                aria-label="Nuevo archivo"
                onClick={() => {
                  setRootExpanded(true)
                  setCreatingType("file")
                  setNewItemName("")
                }}
              >
                <NewFileIcon size={14} />
              </button>
              <button
                type="button"
                className="pcf-action-btn"
                title="Nueva carpeta"
                aria-label="Nueva carpeta"
                onClick={() => {
                  setRootExpanded(true)
                  setCreatingType("folder")
                  setNewItemName("")
                }}
              >
                <NewFolderIcon size={14} />
              </button>
              <button
                type="button"
                className="pcf-action-btn"
                title="Recargar"
                aria-label="Recargar"
                onClick={() => cwd && load(cwd)}
              >
                <RefreshIcon size={13} />
              </button>
              <button
                type="button"
                className="pcf-action-btn"
                title="Colapsar carpetas"
                aria-label="Colapsar carpetas"
                onClick={() => setCollapseSignal((v) => v + 1)}
              >
                <CollapseAllIcon size={14} />
              </button>
              <button
                type="button"
                className={`pcf-action-btn ${showSecondPane ? "active" : ""}`}
                title={showSecondPane ? "Cerrar panel dividido" : "Dividir vista (dos carpetas)"}
                aria-label="Dividir vista"
                onClick={() => {
                  if (!showSecondPane) {
                    setShowSecondPane(true)
                    if (!secondPane.cwd) {
                      if (cwd) secondPane.load(cwd)
                      else if (drives[0]) secondPane.load(drives[0])
                    }
                  } else {
                    setShowSecondPane(false)
                  }
                }}
              >
                <SplitIcon size={14} />
              </button>
            </div>
          </div>

          {rootExpanded && (
            <div
              className="pcf-tree"
              role="tree"
              aria-label="Archivos"
              onContextMenu={(e) => handleContextMenuFirst(e, null, true)}
              onDragOver={handleDragOver}
              onDrop={(e) => cwd && handleFileDrop(e, cwd)}
            >
              {creatingType && (
                <div className="pcf-row pcf-inline-create" onClick={(e) => e.stopPropagation()}>
                  <span className="pcf-chevron" />
                  <span className="pcf-icon-wrap">
                    {creatingType === "folder" ? (
                      <FolderIcon size={14} />
                    ) : (
                      <FileIcon size={14} />
                    )}
                  </span>
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
                  {filteredDirs.map((d) => (
                    <div
                      key={d.path}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, d.path)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleFileDrop(e, d.path)}
                      className={dragOverPath === d.path ? "pcf-drop-target" : ""}
                    >
                      <TreeFolder
                        entry={d}
                        depth={0}
                        onEnterDir={load}
                        query={query}
                        downloading={downloading}
                        onDownload={handleDownload}
                        onOpenFile={handleOpenFile}
                        favorites={favorites}
                        onFav={fav}
                        showNotice={showNotice}
                        getFileGitStatus={getFileGitStatus}
                        getFolderGitStatus={getFolderGitStatus}
                        collapseSignal={collapseSignal}
                        onContextMenu={handleContextMenuFirst}
                        renamingPath={renamingPath}
                        renamingValue={renamingValue}
                        onRenamingChange={setRenamingValue}
                        onRenameCommit={commitRename}
                        onRenameCancel={cancelRename}
                        onStartRename={startRenameFirst}
                      />
                    </div>
                  ))}

                  {filteredDirs.length === 0 && qLower && <div className="pcf-empty">Sin carpetas</div>}

                  <div className="pcf-files">
                    {filteredFiles.map((f) => (
                      <FileRow
                        key={f.path}
                        file={f}
                        depth={0}
                        downloading={downloading}
                        onDownload={handleDownload}
                        onOpenFile={handleOpenFile}
                        isFav={favorites.includes(f.path)}
                        onToggleFav={fav}
                        showNotice={showNotice}
                        gitStatus={getFileGitStatus(f.path)}
                        onContextMenu={handleContextMenuFirst}
                        renamingPath={renamingPath}
                        renamingValue={renamingValue}
                        onRenamingChange={setRenamingValue}
                        onRenameCommit={commitRename}
                        onRenameCancel={cancelRename}
                        onStartRename={startRenameFirst}
                      />
                    ))}
                    {filteredFiles.length === 0 && filteredDirs.length === 0 && !qLower && (
                      <div className="pcf-empty">Vacío</div>
                    )}
                    {filteredFiles.length === 0 && qLower && (
                      <div className="pcf-empty">Sin archivos</div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          </div>
          {showSecondPane && (
            <div
              style={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                borderLeft: "1px solid var(--border)",
                paddingLeft: 8,
              }}
              onClick={() => setActivePane("second")}
            >
              <div className="pcf-workspace-header">
                <button
                  type="button"
                  className="pcf-action-btn pcf-back-btn"
                  title={secondCanGoBack ? `Volver a ${secondParentPath}` : "No hay carpeta anterior"}
                  aria-label="Volver a la carpeta anterior"
                  disabled={!secondCanGoBack}
                  onClick={() => secondParentPath && secondPane.load(secondParentPath)}
                >
                  <ArrowLeftIcon size={14} />
                </button>
                <div
                  className="pcf-workspace-title"
                  onClick={() => secondPane.cwd && secondPane.load(secondPane.cwd)}
                  title={secondPane.cwd ?? ""}
                >
                  <span className="pcf-chevron">
                    <FolderIcon size={12} />
                  </span>
                  <span className="pcf-workspace-name">{secondWorkspaceName}</span>
                </div>
                <div className="pcf-workspace-actions">
                  <button
                    type="button"
                    className="pcf-action-btn"
                    title="Recargar"
                    aria-label="Recargar"
                    onClick={() => secondPane.cwd && secondPane.load(secondPane.cwd)}
                  >
                    <RefreshIcon size={13} />
                  </button>
                  <button
                    type="button"
                    className="pcf-action-btn"
                    title="Cerrar panel"
                    aria-label="Cerrar panel"
                    onClick={() => setShowSecondPane(false)}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="pcf-tree" role="tree" aria-label="Archivos (2)" onContextMenu={(e) => handleContextMenuSecond(e, null, true)} onDragOver={handleDragOver} onDrop={(e) => secondPane.cwd && handleFileDrop(e, secondPane.cwd)}>
                {secondPane.loading && <div className="pcf-loading">Cargando…</div>}
                {secondPane.error && !secondPane.loading && <div className="pcf-error">{secondPane.error}</div>}
                {!secondPane.loading && !secondPane.error && (
                  <>
                    {secondFilteredDirs.map((d) => (
                      <div
                        key={d.path}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, d.path)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleFileDrop(e, d.path)}
                        className={dragOverPath === d.path ? "pcf-drop-target" : ""}
                      >
                        <TreeFolder
                          entry={d}
                          depth={0}
                          onEnterDir={secondPane.load}
                          query={query}
                          downloading={downloading}
                          onDownload={handleDownload}
                          onOpenFile={handleOpenFile}
                          favorites={favorites}
                          onFav={fav}
                          showNotice={showNotice}
                          getFileGitStatus={getFileGitStatus}
                          getFolderGitStatus={getFolderGitStatus}
                          collapseSignal={collapseSignal}
                          onContextMenu={handleContextMenuSecond}
                          renamingPath={renamingPath}
                          renamingValue={renamingValue}
                          onRenamingChange={setRenamingValue}
                          onRenameCommit={commitRename}
                          onRenameCancel={cancelRename}
                          onStartRename={startRenameSecond}
                        />
                      </div>
                    ))}
                    {secondFilteredDirs.length === 0 && qLower && <div className="pcf-empty">Sin carpetas</div>}
                    <div className="pcf-files">
                      {secondFilteredFiles.map((f) => (
                        <FileRow
                          key={f.path}
                          file={f}
                          depth={0}
                          downloading={downloading}
                          onDownload={handleDownload}
                          onOpenFile={handleOpenFile}
                          isFav={favorites.includes(f.path)}
                          onToggleFav={fav}
                          showNotice={showNotice}
                          gitStatus={getFileGitStatus(f.path)}
                          onContextMenu={handleContextMenuSecond}
                          renamingPath={renamingPath}
                          renamingValue={renamingValue}
                          onRenamingChange={setRenamingValue}
                          onRenameCommit={commitRename}
                          onRenameCancel={cancelRename}
                          onStartRename={startRenameSecond}
                        />
                      ))}
                      {secondFilteredFiles.length === 0 && secondFilteredDirs.length === 0 && !qLower && (
                        <div className="pcf-empty">Vacío</div>
                      )}
                      {secondFilteredFiles.length === 0 && qLower && <div className="pcf-empty">Sin archivos</div>}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {codeViewer && (
        <div className="pcf-code-viewer">
          <div className="pcf-code-viewer-header">
            <div className="pcf-code-viewer-info">
              <span className="pcf-code-viewer-file" title={codeViewer.path}>
                {codeViewer.path.split(/[/\\]/).pop()} :{codeViewer.line}
              </span>
              <span className="pcf-code-viewer-path" title={codeViewer.path}>
                {codeViewer.path}
              </span>
            </div>
            <button
              type="button"
              className="btn-icon compact"
              onClick={() => setCodeViewer(null)}
              aria-label="Cerrar visor"
              title="Cerrar"
            >
              ×
            </button>
          </div>
          <div
            className="pcf-code-viewer-body"
            ref={(el) => {
              if (el) {
                const target = el.querySelector(`[data-line="${codeViewer.line}"]`) as HTMLElement | null
                setTimeout(() => target?.scrollIntoView({ block: "center", behavior: "smooth" }), 50)
              }
            }}
          >
            <PcfCodeLines path={codeViewer.path} content={codeViewer.content} target={codeViewer.line} />
          </div>
        </div>
      )}

      {htmlPreview && <HtmlPreview path={htmlPreview.path} onClose={() => setHtmlPreview(null)} />}

      {/* Menú contextual */}
      {contextMenu &&
        createPortal(
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
                  <button
                    type="button"
                    className="overflow-item"
                    style={{ color: "var(--primary)", fontWeight: 600 }}
                    onClick={() => {
                      const e = contextMenu.entry!
                      setContextMenu(null)
                      setExecConfirm({ path: e.path, name: e.name })
                    }}
                  >
                    <span>
                      <TerminalIcon size={14} />
                    </span>{" "}
                    Ejecutar script
                  </button>
                )}
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => {
                    if (contextMenu.isDir)
                      (contextMenuPane === "second" ? secondPane.load : load)(contextMenu.entry!.path)
                    else handleOpenFile(contextMenu.entry!)
                    setContextMenu(null)
                  }}
                >
                  <span>
                    <FolderIcon size={14} />
                  </span>{" "}
                  {contextMenu.isDir ? "Abrir carpeta" : "Abrir"}
                </button>
                {!contextMenu.isDir && isHtmlFile(contextMenu.entry.name) && (
                  <button
                    type="button"
                    className="overflow-item"
                    onClick={() => {
                      setHtmlPreview({ path: contextMenu.entry!.path })
                      setContextMenu(null)
                    }}
                  >
                    <span>
                      <EyeIcon size={14} />
                    </span>{" "}
                    Vista previa HTML
                  </button>
                )}
                {!contextMenu.isDir && (
                  <button
                    type="button"
                    className="overflow-item"
                    onClick={() => {
                      handleDownload(contextMenu.entry!)
                      setContextMenu(null)
                    }}
                  >
                    <span>
                      <SaveIcon size={14} />
                    </span>{" "}
                    Descargar
                  </button>
                )}
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => copyRelativePath(contextMenu.entry!.path)}
                >
                  <span>
                    <LinkIcon size={14} />
                  </span>{" "}
                  Obtener ruta relativa
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => copyFullPath(contextMenu.entry!.path)}
                >
                  <span>
                    <SaveIcon size={14} />
                  </span>{" "}
                  Obtener ruta completa
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() =>
                    handleCreateFileHere(
                      contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : (contextMenuPane === "second" ? secondPane.cwd : cwd) || ""
                    )
                  }
                >
                  <span>
                    <FileIcon size={14} />
                  </span>{" "}
                  Nuevo archivo
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() =>
                    handleCreateFolderHere(
                      contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : (contextMenuPane === "second" ? secondPane.cwd : cwd) || ""
                    )
                  }
                >
                  <span>
                    <FolderIcon size={14} />
                  </span>{" "}
                  Nueva carpeta
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => handleCopyItem(contextMenu.entry!)}
                >
                  <span>
                    <SaveIcon size={14} />
                  </span>{" "}
                  Copiar {contextMenu.isDir ? "carpeta" : "archivo"}
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => {
                    const e = contextMenu.entry!
                    setRenamingPath(e.path)
                    setRenamingValue(e.name)
                    setRenamingPane(contextMenuPane)
                    setContextMenu(null)
                  }}
                >
                  <span>
                    <PencilIcon size={14} />
                  </span>{" "}
                  Renombrar
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => {
                    const p = contextMenu.entry!.path
                    setContextMenu(null)
                    shell.fs
                      .reveal(p)
                      .then(() => showNotice("Abierto en el Explorador"))
                      .catch(() => showNotice("No se pudo abrir"))
                  }}
                >
                  <span>
                    <MonitorIcon size={14} />
                  </span>{" "}
                  Abrir en el Explorador
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  style={{ color: "var(--danger)" }}
                  onClick={() => handleDeleteItem(contextMenu.entry!)}
                >
                  <span>
                    <TrashIcon size={14} />
                  </span>{" "}
                  Eliminar
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => handleCreateFileHere((activePane === "second" ? secondPane.cwd : cwd) || "")}
                >
                  <span>
                    <FileIcon size={14} />
                  </span>{" "}
                  Nuevo archivo aquí
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => handleCreateFolderHere((activePane === "second" ? secondPane.cwd : cwd) || "")}
                >
                  <span>
                    <FolderIcon size={14} />
                  </span>{" "}
                  Nueva carpeta aquí
                </button>
              </>
            )}
            {copiedItem && (
              <button
                type="button"
                className="overflow-item"
                onClick={() =>
                  handlePasteItem(
                    contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : cwd || ""
                  )
                }
              >
                <span>
                  <SaveIcon size={14} />
                </span>{" "}
                Pegar "{copiedItem.name}"
              </button>
            )}
          </div>,
          document.body
        )}

      {execConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
          }}
          onClick={() => setExecConfirm(null)}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
              padding: 16,
              minWidth: 320,
              maxWidth: 420,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: 0, fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8 }}>
              <TerminalIcon size={16} /> Ejecutar archivo
            </h3>
            <p style={{ margin: "12px 0 6px", fontSize: "0.85rem" }}>
              ¿Ejecutar <strong>{execConfirm.name}</strong>?
            </p>
            <p
              style={{
                wordBreak: "break-all",
                fontSize: "0.75rem",
                color: "var(--muted)",
                margin: "0 0 14px",
              }}
            >
              {execConfirm.path}
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                type="button"
                className="btn-secondary compact"
                onClick={() => setExecConfirm(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary compact"
                onClick={async () => {
                  const t = execConfirm
                  setExecConfirm(null)
                  try {
                    const r = await shell.fs.execFile(t.path)
                    showNotice(r.ok ? `Ejecutando: ${t.name}` : "Error al ejecutar")
                  } catch (e: any) {
                    showNotice(`Error: ${e?.message || String(e)}`)
                  }
                }}
              >
                <TerminalIcon size={14} /> Ejecutar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
