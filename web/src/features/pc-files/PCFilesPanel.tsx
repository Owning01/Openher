import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
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
  ShareIcon,
  SplitIcon,
  EyeIcon,
  PencilIcon,
  ArrowLeftIcon,
  CutIcon,
  SortIcon,
  UndoIcon,
  RedoIcon,
  ArchiveIcon,
  AttachmentIcon,
  CopyIcon,
} from "../../Icons"
import { shell, type FsEntry, type CodeSearchResult } from "../../shell"
import { useT } from "../../i18n-context"
import { useDialog } from "../../components/DialogProvider"
import { calcMenuPos, calcMenuPosForAnchor, type MenuPos } from "../../utils/menuPos"
import { FileRow } from "./FileRow"
import { OpenWithDialog } from "./OpenWithDialog"
import { TreeFolder } from "./TreeFolder"
import { CodeSearchResults } from "./CodeSearchResults"
import { HlCodeHtml, highlightToHtml } from "../../components/HighlightedCode"
import { useGitStatus } from "./useGitStatus"
import { HtmlPreview } from "./HtmlPreview"
import { usePaneState } from "./usePaneState"
import { useRowSelection, parseDragPaths } from "./multiSelect"
import { sortFsEntries, splitCrumbs, pushHistory, type SortMode } from "./explorerView"

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

// ArrayBuffer → base64 por chunks (evita desbordar la pila con apply).
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  const CHUNK = 0x8000
  let s = ""
  for (let i = 0; i < bytes.length; i += CHUNK) {
    s += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(s)
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
  const projectMenuElRef = useRef<HTMLDivElement | null>(null)
  const [projectMenuPos, setProjectMenuPos] = useState<MenuPos | null>(null)
  const [explorerRecent, setExplorerRecent] = useState<string[]>(() => loadExplorerRecent())

  // El dropdown vive en un portal (fixed): se cierra con click fuera del
  // anchor Y del menú, Escape, resize o scroll externo (el interno no cierra).
  useEffect(() => {
    if (!showProjectMenu) return
    const onPointerDown = (e: PointerEvent): void => {
      const t = e.target as Node
      if (projectMenuElRef.current?.contains(t)) return
      if (projectMenuRef.current?.contains(t)) return
      setShowProjectMenu(false)
    }
    const onKey = (e: KeyboardEvent): void => { if (e.key === "Escape") setShowProjectMenu(false) }
    const onResize = (): void => setShowProjectMenu(false)
    const onScroll = (e: Event): void => {
      if (projectMenuElRef.current?.contains(e.target as Node)) return
      setShowProjectMenu(false)
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    document.addEventListener("keydown", onKey)
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onScroll, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
      document.removeEventListener("keydown", onKey)
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onScroll, true)
    }
  }, [showProjectMenu])

  // Abrir/cerrar calculando posición fixed clampped al viewport: con sidebar
  // angosto el menú "se mueve" en vez de cortarse (antes era absolute 260px
  // dentro del header y el overflow del sidebar lo recortaba).
  const toggleProjectMenu = useCallback(() => {
    setShowProjectMenu((v) => {
      const next = !v
      if (next) {
        const r = projectMenuRef.current?.getBoundingClientRect()
        if (r) {
          setProjectMenuPos(calcMenuPosForAnchor(r, 280, Math.min(420, Math.round(window.innerHeight * 0.7))))
        }
      }
      return next
    })
  }, [])

  // Re-clamp con el tamaño real una vez montado (el max-width 90vw puede achicarlo)
  useLayoutEffect(() => {
    if (!showProjectMenu) return
    const el = projectMenuElRef.current
    const anchor = projectMenuRef.current?.getBoundingClientRect()
    if (!el || !anchor) return
    const real = calcMenuPos(anchor, el.offsetWidth || 280, el.offsetHeight || 300, {
      w: window.innerWidth,
      h: window.innerHeight,
    })
    setProjectMenuPos((prev) => (prev && prev.left === real.left ? prev : real))
  }, [showProjectMenu, explorerRecent.length])

  const searchRef = useRef<HTMLInputElement | null>(null)
  const uploadFirstRef = useRef<HTMLInputElement | null>(null)
  const uploadSecondRef = useRef<HTMLInputElement | null>(null)
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
  const [copiedPaths, setCopiedPaths] = useState<string[]>([])
  const [execConfirm, setExecConfirm] = useState<{ path: string; name: string } | null>(null)
  const [openWithFile, setOpenWithFile] = useState<FsEntry | null>(null)
  const [renamingPath, setRenamingPath] = useState<string | null>(null)
  const [renamingValue, setRenamingValue] = useState("")
  const [renamingPane, setRenamingPane] = useState<"first" | "second" | null>(null)

  // Selección múltiple estilo Explorador (click / Ctrl+click / Shift+click),
  // una por panel. El Shift+rango opera sobre la lista visible del panel.
  const selFirst = useRowSelection()
  const selSecond = useRowSelection()

  // Portapapeles interno: copiar o cortar (excluyentes). Ctrl+C / Ctrl+X / Ctrl+V.
  const [cutPaths, setCutPaths] = useState<string[]>([])

  // Orden compartido por ambos paneles (carpetas y archivos por separado).
  const [sortMode, setSortMode] = useState<SortMode>("name")
  const [sortDir, setSortDir] = useState<1 | -1>(1)

  // Historial atrás/adelante por panel (se alimenta solo en el efecto de cwd).
  const [histFirst, setHistFirst] = useState<string[]>([])
  const [hIdxFirst, setHIdxFirst] = useState(-1)
  const [histSecond, setHistSecond] = useState<string[]>([])
  const [hIdxSecond, setHIdxSecond] = useState(-1)

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
      // Click derecho sobre una fila fuera de la selección: seleccionar solo
      // esa fila (como en el Explorador); sobre la selección se conserva.
      if (entry) selFirst.selectOnly(entry.path)
      handleContextMenu(e, entry, isDir)
    },
    [handleContextMenu, selFirst],
  )
  const handleContextMenuSecond = useCallback(
    (e: React.MouseEvent, entry: FsEntry | null, isDir: boolean) => {
      setContextMenuPane("second")
      setActivePane("second")
      if (entry) selSecond.selectOnly(entry.path)
      handleContextMenu(e, entry, isDir)
    },
    [handleContextMenu, selSecond],
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
    const sel = contextMenuPane === "second" ? selSecond.selected : selFirst.selected
    const targets = sel.length > 1 && sel.includes(entry.path) ? sel : [entry.path]
    setCopiedPaths(targets)
    setCutPaths([])
    setContextMenu(null)
    showNotice(targets.length > 1 ? `Copiados: ${targets.length} elementos` : `Copiado: ${entry.name}`)
  }

  const handlePasteItem = async (destDir: string, pane?: "first" | "second") => {
    const usePane = pane ?? contextMenuPane
    const cutting = cutPaths.length > 0
    const sources = cutting ? cutPaths : copiedPaths
    if (sources.length === 0) return
    setContextMenu(null)
    const targetCwd = usePane === "second" ? secondPane.cwd : cwd
    const targetLoad = usePane === "second" ? secondPane.load : load
    let done = 0
    for (const src of sources) {
      try {
        if (cutting) await shell.fs.move(src, destDir)
        else await shell.fs.copy(src, destDir)
        done++
      } catch {}
    }
    const destName = destDir.split(/[/\\]/).pop() || destDir
    const verb = cutting ? "Movido" : "Pegado"
    showNotice(
      sources.length > 1
        ? `${verb}s ${done} de ${sources.length} en ${destName}`
        : `${verb} en ${destName}`,
    )
    if (cutting) {
      setCutPaths([])
      selFirst.clear()
      selSecond.clear()
      // El origen pudo ser otra carpeta: recargar ambas vistas.
      if (cwd) load(cwd)
      if (showSecondPane && secondPane.cwd) secondPane.load(secondPane.cwd)
    } else {
      targetLoad(destDir === targetCwd ? destDir : targetCwd || destDir)
    }
  }

  const handleDeleteItem = async (entry: FsEntry) => {
    const pane = contextMenuPane
    const sel = pane === "second" ? selSecond.selected : selFirst.selected
    const targets = sel.length > 1 && sel.includes(entry.path) ? sel : [entry.path]
    await handleDeletePaths(pane, targets)
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

  // Al cambiar de carpeta la selección anterior ya no vale.
  const clearSelFirst = selFirst.clear
  const clearSelSecond = selSecond.clear
  useEffect(() => { clearSelFirst() }, [cwd, clearSelFirst])
  useEffect(() => { clearSelSecond() }, [secondPane.cwd, clearSelSecond])

  // El historial registra navegaciones reales; recargar la misma carpeta no
  // duplica (pushHistory) y volver atrás no re-agrega (coincide con el índice).
  useEffect(() => {
    if (!cwd) return
    if (histFirst[hIdxFirst] === cwd) return
    const r = pushHistory(histFirst, hIdxFirst, cwd)
    setHistFirst(r.hist)
    setHIdxFirst(r.idx)
  }, [cwd, histFirst, hIdxFirst])
  useEffect(() => {
    const c = secondPane.cwd
    if (!c) return
    if (histSecond[hIdxSecond] === c) return
    const r = pushHistory(histSecond, hIdxSecond, c)
    setHistSecond(r.hist)
    setHIdxSecond(r.idx)
  }, [secondPane.cwd, histSecond, hIdxSecond])

  // Borrado a la Papelera (recuperable). El definitivo vive en
  // handleDeletePermanent como item separado del menú.
  const handleDeletePaths = useCallback(async (
    pane: "first" | "second",
    paths: string[],
  ) => {
    if (paths.length === 0) return
    setContextMenu(null)
    const baseName = (p: string) => p.split(/[/\\]/).filter(Boolean).pop() || p
    const confirmed = await confirm({
      message: paths.length > 1
        ? `Mover ${paths.length} elementos a la Papelera?`
        : `Mover "${baseName(paths[0]!)}" a la Papelera?`,
      confirmText: t('common.yes'),
      cancelText: t('common.cancel'),
      variant: "danger",
    })
    if (!confirmed) return
    let done = 0
    for (const p of paths) {
      try {
        await shell.fs.trash(p)
        done++
      } catch {}
    }
    showNotice(
      paths.length > 1
        ? (done === paths.length ? `A la Papelera: ${done} elementos` : `A la Papelera ${done} de ${paths.length} (${paths.length - done} con error)`)
        : (done === 1 ? `A la Papelera: ${baseName(paths[0]!)}` : "No se pudo mover a la Papelera"),
    )
    if (pane === "second") {
      selSecond.clear()
      if (secondPane.cwd) secondPane.load(secondPane.cwd)
    } else {
      selFirst.clear()
      if (cwd) load(cwd)
    }
  }, [confirm, t, showNotice, cwd, load, secondPane, selFirst, selSecond])

  // Borrado definitivo (sin Papelera): segunda confirmación implícita en el
  // propio item del menú, diferenciado del Eliminar habitual.
  const handleDeletePermanent = useCallback(async (
    pane: "first" | "second",
    paths: string[],
  ) => {
    if (paths.length === 0) return
    setContextMenu(null)
    const confirmed = await confirm({
      message: paths.length > 1
        ? `Borrar PARA SIEMPRE ${paths.length} elementos (sin Papelera)?`
        : `Borrar PARA SIEMPRE "${paths[0]!.split(/[/\\]/).filter(Boolean).pop()}" (sin Papelera)?`,
      confirmText: "Borrar",
      cancelText: t('common.cancel'),
      variant: "danger",
    })
    if (!confirmed) return
    let done = 0
    for (const p of paths) {
      try {
        await shell.fs.delete(p)
        done++
      } catch {}
    }
    showNotice(done === paths.length
      ? `Borrado definitivo: ${done}`
      : `Borrados ${done} de ${paths.length}`)
    if (pane === "second") {
      selSecond.clear()
      if (secondPane.cwd) secondPane.load(secondPane.cwd)
    } else {
      selFirst.clear()
      if (cwd) load(cwd)
    }
  }, [confirm, t, showNotice, cwd, load, secondPane, selFirst, selSecond])

  // Targets con selección: si la fila está dentro de la selección del panel,
  // la operación aplica a toda la selección; si no, solo a la fila.
  const targetsOf = (pane: "first" | "second", entryPath: string): string[] => {
    const sel = pane === "second" ? selSecond.selected : selFirst.selected
    return sel.length > 1 && sel.includes(entryPath) ? sel : [entryPath]
  }

  const handleCutItems = (entry: FsEntry) => {
    const targets = targetsOf(contextMenuPane, entry.path)
    setCutPaths(targets)
    setCopiedPaths([])
    setContextMenu(null)
    showNotice(targets.length > 1 ? `Cortados: ${targets.length} elementos` : `Cortado: ${entry.name}`)
  }

  // Atajos de teclado sobre el árbol (Ctrl+X/C/V): operan sobre la selección
  // del panel indicado; Ctrl+V pega en la carpeta visible de ese panel.
  const copySelection = (pane: "first" | "second") => {
    const sel = pane === "second" ? selSecond.selected : selFirst.selected
    if (sel.length === 0) return
    setCopiedPaths(sel)
    setCutPaths([])
    showNotice(sel.length > 1 ? `Copiados: ${sel.length} elementos` : "Copiado")
  }
  const cutSelection = (pane: "first" | "second") => {
    const sel = pane === "second" ? selSecond.selected : selFirst.selected
    if (sel.length === 0) return
    setCutPaths(sel)
    setCopiedPaths([])
    showNotice(sel.length > 1 ? `Cortados: ${sel.length} elementos` : "Cortado")
  }

  const handleDuplicate = async (entry: FsEntry) => {
    const pane = contextMenuPane
    const targets = targetsOf(pane, entry.path)
    setContextMenu(null)
    let done = 0
    for (const p of targets) {
      // copy_entry sobre el propio padre genera automáticamente "-copia".
      const parent = getParentPath(p)
      if (!parent) continue
      try {
        await shell.fs.copy(p, parent)
        done++
      } catch {}
    }
    showNotice(done === targets.length
      ? `Duplicados: ${done}`
      : `Duplicados ${done} de ${targets.length}`)
    if (pane === "second" && secondPane.cwd) secondPane.load(secondPane.cwd)
    else if (cwd) load(cwd)
  }

  const isZipFile = (name: string) => /\.zip$/i.test(name)

  const handleZip = async (entry: FsEntry) => {
    const pane = contextMenuPane
    const targets = targetsOf(pane, entry.path)
    setContextMenu(null)
    const destDir = (pane === "second" ? secondPane.cwd : cwd) || getParentPath(targets[0]!) || ""
    if (!destDir) {
      showNotice("Sin carpeta destino")
      return
    }
    const name = targets.length > 1
      ? `${targets.length} elementos.zip`
      : `${entry.name}.zip`
    try {
      const r = await shell.fs.zip(targets, destDir, name)
      const out = (r as { path?: string })?.path
      showNotice(`Comprimido: ${out ? out.split(/[/\\]/).pop() : name}`)
    } catch {
      showNotice("Error al comprimir")
    }
    if (pane === "second" && secondPane.cwd) secondPane.load(secondPane.cwd)
    else if (cwd) load(cwd)
  }

  const handleUnzip = async (entry: FsEntry) => {
    const pane = contextMenuPane
    setContextMenu(null)
    try {
      const r = await shell.fs.unzip(entry.path)
      const out = (r as { path?: string })?.path
      showNotice(`Extraído en: ${out ? out.split(/[/\\]/).pop() : entry.name}`)
    } catch {
      showNotice("Error al extraer")
    }
    if (pane === "second" && secondPane.cwd) secondPane.load(secondPane.cwd)
    else if (cwd) load(cwd)
  }

  const handleTerminalHere = async (dir: string) => {
    setContextMenu(null)
    try {
      await shell.fs.terminal(dir)
    } catch {
      showNotice("No se pudo abrir la terminal")
    }
  }

  // Subida dispositivo → PC (límite 12MB por archivo del backend /write).
  const uploadFiles = async (pane: "first" | "second", destDir: string, files: FileList | File[]) => {
    const list = Array.from(files)
    if (list.length === 0 || !destDir) return
    const sep = destDir.includes("\\") ? "\\" : "/"
    const base = destDir.endsWith(sep) ? destDir : destDir + sep
    let done = 0
    let skipped = 0
    for (const f of list) {
      if (f.size > 12 * 1024 * 1024) {
        skipped++
        continue
      }
      try {
        const buf = await f.arrayBuffer()
        await shell.fs.write(base + f.name, arrayBufferToBase64(buf))
        done++
      } catch {}
    }
    showNotice(skipped > 0
      ? `Subidos ${done} (${skipped} >12MB omitidos)`
      : `Subidos: ${done}`)
    if (pane === "second" && secondPane.cwd) secondPane.load(secondPane.cwd)
    else if (cwd) load(cwd)
  }

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
    async (e: React.DragEvent, destDir: string, pane: "first" | "second" = "first") => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverPath(null)
      // Drop desde el SO (archivos del dispositivo u otra app): subir.
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        await uploadFiles(pane, destDir, e.dataTransfer.files)
        return
      }
      const raw = e.dataTransfer.getData("application/x-opencode-path") || e.dataTransfer.getData("text/plain")
      if (!raw || !destDir) return
      // Drop de selección múltiple: varias rutas unidas con \n (ver multiSelect).
      const srcs = parseDragPaths(raw).filter((src) => {
        if (src === destDir) return false
        if (destDir.startsWith(src + "\\") || destDir.startsWith(src + "/")) return false
        return true
      })
      if (srcs.length === 0) return
      const destName = destDir.split(/[/\\]/).pop() || destDir
      try {
        for (const src of srcs) {
          await shell.fs.move(src, destDir)
        }
        showNotice(srcs.length > 1 ? `Movidos ${srcs.length} elementos a ${destName}` : `Movido a ${destName}`)
        selFirst.clear()
        selSecond.clear()
        if (cwd && (srcs.some((s) => s.startsWith(cwd)) || destDir === cwd)) load(cwd)
        if (showSecondPane && secondPane.cwd && (srcs.some((s) => s.startsWith(secondPane.cwd!)) || destDir === secondPane.cwd))
          secondPane.load(secondPane.cwd)
      } catch (err) {
        showNotice(`Error al mover: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
    [cwd, showSecondPane, secondPane, load, showNotice, selFirst, selSecond],
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
      // Fallback inline (móvil / sin grid): lee como texto vía GET /shell/fs/read
      // (misma base remota + auth que el listado, sin descargar) y muestra visor; binarios → descarga
      try {
        const res: any = await shell.fs.read(entry.path)
        const text: string = res?.content ?? res?.data ?? res?.text ?? (typeof res === "string" ? res : "")
        if (typeof text === "string" && text) {
          setCodeViewer({ path: entry.path, line: 1, content: text.slice(0, 30000) })
          showNotice(res?.truncated ? `Abierto (primeros 64KB): ${entry.name}` : `Abierto: ${entry.name}`)
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
  const filteredSecondDirs = qLower
    ? secondPane.dirs.filter((d) => d.name.toLowerCase().includes(qLower))
    : secondPane.dirs
  const filteredSecondFiles = qLower
    ? secondPane.files.filter((f) => f.name.toLowerCase().includes(qLower))
    : secondPane.files

  // Orden aplicado a lo filtrado (carpetas y archivos por separado, como el
  // Explorador). Lo ordenado es también el orden visible del Shift+rango.
  const sortedDirs = useMemo(
    () => sortFsEntries(filteredDirs, sortMode, sortDir),
    [filteredDirs, sortMode, sortDir],
  )
  const sortedFiles = useMemo(
    () => sortFsEntries(filteredFiles, sortMode, sortDir),
    [filteredFiles, sortMode, sortDir],
  )
  const sortedSecondDirs = useMemo(
    () => sortFsEntries(filteredSecondDirs, sortMode, sortDir),
    [filteredSecondDirs, sortMode, sortDir],
  )
  const sortedSecondFiles = useMemo(
    () => sortFsEntries(filteredSecondFiles, sortMode, sortDir),
    [filteredSecondFiles, sortMode, sortDir],
  )

  // Orden visible de cada panel (carpetas + archivos): base del Shift+rango.
  const orderedFirst = useMemo(
    () => [...sortedDirs, ...sortedFiles].map((e) => e.path),
    [sortedDirs, sortedFiles],
  )
  const orderedSecond = useMemo(
    () => [...sortedSecondDirs, ...sortedSecondFiles].map((e) => e.path),
    [sortedSecondDirs, sortedSecondFiles],
  )

  // Breadcrumbs por panel (memo: split barato pero renderiza cada fila).
  const crumbsFirst = useMemo(() => splitCrumbs(cwd), [cwd])
  const crumbsSecond = useMemo(() => splitCrumbs(secondPane.cwd), [secondPane.cwd])

  // Botón ordenar: rota nombre↑ → nombre↓ → tamaño↓ → fecha↓.
  const SORT_STEPS: Array<{ mode: SortMode; dir: 1 | -1; label: string }> = [
    { mode: "name", dir: 1, label: "Nombre (A–Z)" },
    { mode: "name", dir: -1, label: "Nombre (Z–A)" },
    { mode: "size", dir: -1, label: "Tamaño (mayor)" },
    { mode: "date", dir: -1, label: "Fecha (recientes)" },
  ]
  const sortStepIdx = Math.max(0, SORT_STEPS.findIndex((s) => s.mode === sortMode && s.dir === sortDir))
  const cycleSort = useCallback(() => {
    const next = SORT_STEPS[(sortStepIdx + 1) % SORT_STEPS.length]!
    setSortMode(next.mode)
    setSortDir(next.dir)
  }, [sortStepIdx])

  const goHistFirst = useCallback((delta: -1 | 1) => {
    const ni = hIdxFirst + delta
    if (ni < 0 || ni >= histFirst.length) return
    const target = histFirst[ni]
    if (!target) return
    setHIdxFirst(ni)
    load(target)
  }, [hIdxFirst, histFirst, load])
  const goHistSecond = useCallback((delta: -1 | 1) => {
    const ni = hIdxSecond + delta
    if (ni < 0 || ni >= histSecond.length) return
    const target = histSecond[ni]
    if (!target) return
    setHIdxSecond(ni)
    secondPane.load(target)
  }, [hIdxSecond, histSecond, secondPane])
  const selFirstPaths = selFirst.selected
  const selSecondPaths = selSecond.selected

  const handleRowClickFirst = useCallback((e: React.MouseEvent, entry: FsEntry) => {
    setActivePane("first")
    selFirst.select(entry.path, orderedFirst, e)
  }, [selFirst, orderedFirst])
  const handleRowClickSecond = useCallback((e: React.MouseEvent, entry: FsEntry) => {
    setActivePane("second")
    selSecond.select(entry.path, orderedSecond, e)
  }, [selSecond, orderedSecond])

  const dragPayloadFirst = useCallback((path: string) =>
    (selFirstPaths.length > 1 && selFirstPaths.includes(path) ? selFirstPaths : [path]),
    [selFirstPaths])
  const dragPayloadSecond = useCallback((path: string) =>
    (selSecondPaths.length > 1 && selSecondPaths.includes(path) ? selSecondPaths : [path]),
    [selSecondPaths])

  // Teclado estilo Explorador sobre cada árbol: Supr elimina la selección,
  // Ctrl+A selecciona todo lo visible, Escape la suelta. Los inputs (crear /
  // renombrar / buscar) quedan excluidos: el evento nace en ellos.
  const onTreeKeyDown = useCallback((
    e: React.KeyboardEvent,
    pane: "first" | "second",
  ) => {
    const target = e.target as HTMLElement | null
    if (target && target.closest("input, textarea, [contenteditable='true']")) return
    if (renamingPath) return
    const sel = pane === "second" ? selSecond : selFirst
    const ordered = pane === "second" ? orderedSecond : orderedFirst
    if ((e.ctrlKey || e.metaKey) && (e.key === "a" || e.key === "A")) {
      e.preventDefault()
      sel.selectAll(ordered)
      return
    }
    // Portapapeles por teclado (los inputs ya salieron arriba).
    if (e.ctrlKey || e.metaKey) {
      const k = e.key.toLowerCase()
      if (k === "x") {
        e.preventDefault()
        cutSelection(pane)
        return
      }
      if (k === "c") {
        e.preventDefault()
        copySelection(pane)
        return
      }
      if (k === "v") {
        e.preventDefault()
        const dest = pane === "second" ? secondPane.cwd : cwd
        if (dest) void handlePasteItem(dest, pane)
        return
      }
    }
    if (e.key === "Delete") {
      if (sel.selected.length === 0) return
      e.preventDefault()
      void handleDeletePaths(pane, sel.selected)
      return
    }
    if (e.key === "Escape") {
      sel.clear()
    }
  }, [renamingPath, selFirst, selSecond, orderedFirst, orderedSecond, handleDeletePaths, secondPane, cwd])

  // Cantidad en lote del menú contextual: si la fila clicada está dentro de
  // la selección del panel, Eliminar/Copiar operan sobre toda la selección.
  const menuSel = contextMenuPane === "second" ? selSecondPaths : selFirstPaths
  const menuBulkN = contextMenu?.entry && menuSel.length > 1 && menuSel.includes(contextMenu.entry.path)
    ? menuSel.length
    : 1

  return (
    <div className="pcf-root">
      {/* 1. Header principal VS Code: Explorer + ... */}
      <div className="pcf-header pcf-header--vscode">
        <span className="pcf-title">Explorer</span>
        <div className="pcf-header-actions" ref={projectMenuRef}>
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
            aria-expanded={showProjectMenu}
            onClick={toggleProjectMenu}
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

          {showProjectMenu && projectMenuPos && createPortal(
            <div
              ref={projectMenuElRef}
              className="pcf-dropdown pcf-dropdown--portal"
              style={{
                left: projectMenuPos.left,
                ...(projectMenuPos.top !== undefined ? { top: projectMenuPos.top } : { bottom: projectMenuPos.bottom }),
              }}
            >
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
            </div>,
            document.body
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
            style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}
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
              <button
                type="button"
                className="pcf-action-btn"
                title={`Ordenar: ${SORT_STEPS[sortStepIdx]!.label} (click para cambiar)`}
                aria-label="Cambiar orden"
                onClick={cycleSort}
              >
                <SortIcon size={14} />
              </button>
            </div>
          </div>

          <div className="pcf-crumbs" role="navigation" aria-label="Ruta actual">
            <button
              type="button"
              className="pcf-hist-btn"
              title="Atrás"
              aria-label="Atrás en el historial"
              disabled={hIdxFirst <= 0}
              onClick={() => goHistFirst(-1)}
            >
              <UndoIcon size={12} />
            </button>
            <button
              type="button"
              className="pcf-hist-btn"
              title="Adelante"
              aria-label="Adelante en el historial"
              disabled={hIdxFirst >= histFirst.length - 1}
              onClick={() => goHistFirst(1)}
            >
              <RedoIcon size={12} />
            </button>
            <div className="pcf-crumb-trail">
              {crumbsFirst.map((c, i) => (
                <span key={c.path} className="pcf-crumb-item">
                  {i > 0 && <span className="pcf-crumb-sep">›</span>}
                  <button
                    type="button"
                    className={`pcf-crumb${i === crumbsFirst.length - 1 ? " active" : ""}`}
                    onClick={() => load(c.path)}
                    title={c.path}
                  >
                    {c.label}
                  </button>
                </span>
              ))}
            </div>
          </div>
          <input
            ref={uploadFirstRef}
            type="file"
            multiple
            hidden
            aria-hidden="true"
            tabIndex={-1}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0 && cwd) void uploadFiles("first", cwd, e.target.files)
              e.target.value = ""
            }}
          />

          {selFirstPaths.length > 1 && (
            <div className="pcf-selbar" role="status">
              <span>{selFirstPaths.length} seleccionados</span>
              <button
                type="button"
                className="pcf-selbar-btn pcf-selbar-danger"
                onClick={() => void handleDeletePaths("first", selFirstPaths)}
              >
                Eliminar
              </button>
              <button
                type="button"
                className="pcf-selbar-btn"
                onClick={selFirst.clear}
                aria-label="Limpiar selección"
                title="Limpiar selección (Esc)"
              >
                ×
              </button>
            </div>
          )}

          {rootExpanded && (
            <div
              className="pcf-tree"
              role="tree"
              aria-label="Archivos"
              aria-multiselectable="true"
              onClick={() => selFirst.clear()}
              onKeyDown={(e) => onTreeKeyDown(e, "first")}
              onContextMenu={(e) => handleContextMenuFirst(e, null, true)}
              onDragOver={handleDragOver}
              onDrop={(e) => cwd && handleFileDrop(e, cwd, "first")}
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
                  {sortedDirs.map((d) => (
                    <div
                      key={d.path}
                      onDragOver={handleDragOver}
                      onDragEnter={(e) => handleDragEnter(e, d.path)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleFileDrop(e, d.path, "first")}
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
                        onOpenWith={setOpenWithFile}
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
                        selectedPaths={selFirstPaths}
                        onSelect={handleRowClickFirst}
                        getDragPayload={dragPayloadFirst}
                        cutPaths={cutPaths}
                      />
                    </div>
                  ))}

                  {sortedDirs.length === 0 && qLower && <div className="pcf-empty">Sin carpetas</div>}

                  <div className="pcf-files">
                    {sortedFiles.map((f) => (
                      <FileRow
                        key={f.path}
                        file={f}
                        depth={0}
                        downloading={downloading}
                        onDownload={handleDownload}
                        onOpenFile={handleOpenFile}
                        onOpenWith={setOpenWithFile}
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
                        selected={selFirstPaths.includes(f.path)}
                        onSelect={handleRowClickFirst}
                        getDragPayload={dragPayloadFirst}
                        cut={cutPaths.includes(f.path)}
                      />
                    ))}
                    {sortedFiles.length === 0 && sortedDirs.length === 0 && !qLower && (
                      <div className="pcf-empty">Vacío</div>
                    )}
                    {sortedFiles.length === 0 && qLower && (
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
                minHeight: 0,
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
                    title={`Ordenar: ${SORT_STEPS[sortStepIdx]!.label} (click para cambiar)`}
                    aria-label="Cambiar orden"
                    onClick={cycleSort}
                  >
                    <SortIcon size={14} />
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
              <div className="pcf-crumbs" role="navigation" aria-label="Ruta actual (2)">
                <button
                  type="button"
                  className="pcf-hist-btn"
                  title="Atrás"
                  aria-label="Atrás en el historial"
                  disabled={hIdxSecond <= 0}
                  onClick={() => goHistSecond(-1)}
                >
                  <UndoIcon size={12} />
                </button>
                <button
                  type="button"
                  className="pcf-hist-btn"
                  title="Adelante"
                  aria-label="Adelante en el historial"
                  disabled={hIdxSecond >= histSecond.length - 1}
                  onClick={() => goHistSecond(1)}
                >
                  <RedoIcon size={12} />
                </button>
                <div className="pcf-crumb-trail">
                  {crumbsSecond.map((c, i) => (
                    <span key={c.path} className="pcf-crumb-item">
                      {i > 0 && <span className="pcf-crumb-sep">›</span>}
                      <button
                        type="button"
                        className={`pcf-crumb${i === crumbsSecond.length - 1 ? " active" : ""}`}
                        onClick={() => secondPane.load(c.path)}
                        title={c.path}
                      >
                        {c.label}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
              <input
                ref={uploadSecondRef}
                type="file"
                multiple
                hidden
                aria-hidden="true"
                tabIndex={-1}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0 && secondPane.cwd) void uploadFiles("second", secondPane.cwd, e.target.files)
                  e.target.value = ""
                }}
              />
              <div className="pcf-tree" role="tree" aria-label="Archivos (2)" aria-multiselectable="true" onClick={() => selSecond.clear()} onKeyDown={(e) => onTreeKeyDown(e, "second")} onContextMenu={(e) => handleContextMenuSecond(e, null, true)} onDragOver={handleDragOver} onDrop={(e) => secondPane.cwd && handleFileDrop(e, secondPane.cwd, "second")}>
                {selSecondPaths.length > 1 && (
                  <div className="pcf-selbar" role="status">
                    <span>{selSecondPaths.length} seleccionados</span>
                    <button
                      type="button"
                      className="pcf-selbar-btn pcf-selbar-danger"
                      onClick={() => void handleDeletePaths("second", selSecondPaths)}
                    >
                      Eliminar
                    </button>
                    <button
                      type="button"
                      className="pcf-selbar-btn"
                      onClick={selSecond.clear}
                      aria-label="Limpiar selección"
                      title="Limpiar selección (Esc)"
                    >
                      ×
                    </button>
                  </div>
                )}
                {secondPane.loading && <div className="pcf-loading">Cargando…</div>}
                {secondPane.error && !secondPane.loading && <div className="pcf-error">{secondPane.error}</div>}
                {!secondPane.loading && !secondPane.error && (
                  <>
                    {sortedSecondDirs.map((d) => (
                      <div
                        key={d.path}
                        onDragOver={handleDragOver}
                        onDragEnter={(e) => handleDragEnter(e, d.path)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleFileDrop(e, d.path, "second")}
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
                          onOpenWith={setOpenWithFile}
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
                          selectedPaths={selSecondPaths}
                          onSelect={handleRowClickSecond}
                          getDragPayload={dragPayloadSecond}
                          cutPaths={cutPaths}
                        />
                      </div>
                    ))}
                    {sortedSecondDirs.length === 0 && qLower && <div className="pcf-empty">Sin carpetas</div>}
                    <div className="pcf-files">
                      {sortedSecondFiles.map((f) => (
                        <FileRow
                          key={f.path}
                          file={f}
                          depth={0}
                          downloading={downloading}
                          onDownload={handleDownload}
                          onOpenFile={handleOpenFile}
                          onOpenWith={setOpenWithFile}
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
                          selected={selSecondPaths.includes(f.path)}
                          onSelect={handleRowClickSecond}
                          getDragPayload={dragPayloadSecond}
                          cut={cutPaths.includes(f.path)}
                        />
                      ))}
                      {sortedSecondFiles.length === 0 && sortedSecondDirs.length === 0 && !qLower && (
                        <div className="pcf-empty">Vacío</div>
                      )}
                      {sortedSecondFiles.length === 0 && qLower && <div className="pcf-empty">Sin archivos</div>}
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
                {!contextMenu.isDir && (
                  <>
                    <button
                      type="button"
                      className="overflow-item"
                      onClick={() => {
                        const target = contextMenu.entry!
                        setContextMenu(null)
                        shell.fs
                          .openDefault(target.path)
                          .then(() => showNotice(`Abierto con programa predeterminado: ${target.name}`))
                          .catch(() => showNotice("No se pudo abrir"))
                      }}
                    >
                      <span>
                        <ShareIcon size={14} />
                      </span>{" "}
                      Abrir con programa predeterminado
                    </button>
                    <button
                      type="button"
                      className="overflow-item"
                      onClick={() => {
                        setOpenWithFile(contextMenu.entry)
                        setContextMenu(null)
                      }}
                    >
                      <span>
                        <ShareIcon size={14} />
                      </span>{" "}
                      Abrir con…
                    </button>
                  </>
                )}
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
                {!contextMenu.isDir && isZipFile(contextMenu.entry.name) && (
                  <button
                    type="button"
                    className="overflow-item"
                    onClick={() => handleUnzip(contextMenu.entry!)}
                  >
                    <span>
                      <ArchiveIcon size={14} />
                    </span>{" "}
                    Extraer aquí
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
                  Copiar {menuBulkN > 1 ? `${menuBulkN} elementos` : (contextMenu.isDir ? "carpeta" : "archivo")}
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => handleCutItems(contextMenu.entry!)}
                >
                  <span>
                    <CutIcon size={14} />
                  </span>{" "}
                  Cortar {menuBulkN > 1 ? `${menuBulkN} elementos` : (contextMenu.isDir ? "carpeta" : "archivo")}
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => handleDuplicate(contextMenu.entry!)}
                >
                  <span>
                    <CopyIcon size={14} />
                  </span>{" "}
                  Duplicar{menuBulkN > 1 ? ` (${menuBulkN})` : ""}
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => handleZip(contextMenu.entry!)}
                >
                  <span>
                    <ArchiveIcon size={14} />
                  </span>{" "}
                  Comprimir a .zip{menuBulkN > 1 ? ` (${menuBulkN})` : ""}
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
                      .then((r) => showNotice(r.ok ? "Abierto en el Explorador" : "No se pudo abrir"))
                      .catch(() => showNotice("No se pudo abrir"))
                  }}
                >
                  <span>
                    <MonitorIcon size={14} />
                  </span>{" "}
                  Abrir en el Explorador
                </button>
                {contextMenu.isDir && (
                  <button
                    type="button"
                    className="overflow-item"
                    onClick={() => handleTerminalHere(contextMenu.entry!.path)}
                  >
                    <span>
                      <TerminalIcon size={14} />
                    </span>{" "}
                    Abrir terminal aquí
                  </button>
                )}
                <button
                  type="button"
                  className="overflow-item"
                  style={{ color: "var(--danger)" }}
                  onClick={() => handleDeleteItem(contextMenu.entry!)}
                >
                  <span>
                    <TrashIcon size={14} />
                  </span>{" "}
                  Eliminar{menuBulkN > 1 ? ` (${menuBulkN})` : ""}
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  style={{ color: "var(--danger)" }}
                  onClick={() => {
                    const e = contextMenu.entry!
                    void handleDeletePermanent(contextMenuPane, menuBulkN > 1 ? menuSel : [e.path])
                  }}
                >
                  <span>
                    <TrashIcon size={14} />
                  </span>{" "}
                  Eliminar definitivamente
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
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => {
                    setContextMenu(null)
                    const ref = contextMenuPane === "second" ? uploadSecondRef.current : uploadFirstRef.current
                    ref?.click()
                  }}
                >
                  <span>
                    <AttachmentIcon size={14} />
                  </span>{" "}
                  Subir archivos
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => {
                    const dir = (contextMenuPane === "second" ? secondPane.cwd : cwd) || ""
                    if (dir) void handleTerminalHere(dir)
                    else setContextMenu(null)
                  }}
                >
                  <span>
                    <TerminalIcon size={14} />
                  </span>{" "}
                  Abrir terminal aquí
                </button>
              </>
            )}
            {(copiedPaths.length > 0 || cutPaths.length > 0) && (
              <button
                type="button"
                className="overflow-item"
                onClick={() =>
                  handlePasteItem(
                    contextMenu.entry && contextMenu.isDir
                      ? contextMenu.entry.path
                      : (contextMenuPane === "second" ? secondPane.cwd : cwd) || ""
                  )
                }
              >
                <span>
                  <SaveIcon size={14} />
                </span>{" "}
                {cutPaths.length > 0
                  ? (cutPaths.length > 1 ? `Mover aquí (${cutPaths.length})` : "Mover aquí")
                  : (copiedPaths.length > 1
                    ? `Pegar ${copiedPaths.length} elementos`
                    : `Pegar "${copiedPaths[0]!.split(/[/\\]/).filter(Boolean).pop()}"`)}
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

      {openWithFile && (
        <OpenWithDialog
          file={openWithFile}
          onClose={() => setOpenWithFile(null)}
          showNotice={showNotice}
        />
      )}
    </div>
  )
})
