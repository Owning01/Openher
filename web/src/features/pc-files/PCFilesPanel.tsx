import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import {
  ChatIcon,
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
  CutIcon,
  SortIcon,
  ArchiveIcon,
  AttachmentIcon,
  CopyIcon,
} from "../../Icons"
import { shell, type FsEntry, type CodeSearchResult } from "../../shell"
import { useT } from "../../i18n-context"
import { useToast } from "../../components/Toasts"
import { useIsDesktop } from "../../hooks/useIsDesktop"
import { useLocalStorage } from "../../hooks/useLocalStorage"
import { calcMenuPos, calcMenuPosForAnchor, type MenuPos } from "../../utils/menuPos"
import { blobToBase64 } from "../../utils"
import { OpenWithDialog } from "./OpenWithDialog"
import { CodeSearchResults } from "./CodeSearchResults"
import { humanizeFsError, canDownloadAfterError, looksLikeBinary } from "./fileErrors"
import { HlCodeHtml, highlightToHtml } from "../../components/HighlightedCode"
import { HtmlPreview } from "./HtmlPreview"
import { usePaneState, loadExplorerRecent } from "./usePaneState"
import { useRowSelection, parseDragPaths } from "./multiSelect"
import { getParentPath, type SortMode } from "./explorerView"
import { usePaneNav } from "./usePaneNav"
import { ExplorerPane, type ExplorerPaneRows } from "./ExplorerPane"
import { isExecScript } from "../../shared/lib/fileKind"

// Duración de la animación de eliminado (slide-out rojo) antes del borrado
// real. Debe coincidir con el keyframe pcf-delete-out en pc-files.css.
const DELETE_ANIM_MS = 280

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

// Estado del visor de lectura: texto (código/archivo) o error legible con
// acción de descarga opcional (binarios, permisos, etc.).
type ViewerState =
  | { kind: "text"; path: string; line: number; content: string }
  | { kind: "error"; entry: FsEntry; message: string; canDownload: boolean }

type PendingDelete = { pane: "first" | "second"; paths: string[]; permanent: boolean }

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

// Confirmación inline en flujo (dentro del árbol, no modal ni overlay): nace
// sobre las filas del panel afectado, con Aceptar/Cancelar y borde notorio.
function PcfInlineConfirm({
  variant,
  title,
  detail,
  detailTitle,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  variant: "danger" | "exec"
  title: string
  detail: string
  detailTitle?: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    boxRef.current?.scrollIntoView?.({ block: "nearest" })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onCancel() }
      else if (e.key === "Enter" && !e.shiftKey) {
        // Con foco en un botón manda el click nativo (no robar el Enter de
        // "Cancelar" para confirmar).
        const el = e.target as HTMLElement | null
        if (el && (el.tagName === "BUTTON" || el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return
        e.preventDefault(); onConfirm()
      }
    }
    document.addEventListener("keydown", onKey, true)
    return () => document.removeEventListener("keydown", onKey, true)
  }, [onCancel, onConfirm])
  const isDanger = variant === "danger"
  return (
    <div
      ref={boxRef}
      className={`pcf-inline-confirm ${isDanger ? "is-danger" : "is-exec"}`}
      role="alertdialog"
      aria-label={title}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="pcf-inline-confirm-icon" aria-hidden="true">
        {isDanger ? <TrashIcon size={16} /> : <TerminalIcon size={16} />}
      </span>
      <div className="pcf-inline-confirm-body">
        <strong>{title}</strong>
        <span className="pcf-inline-confirm-path" title={detailTitle ?? detail}>{detail}</span>
      </div>
      <div className="pcf-inline-confirm-actions">
        <button type="button" className="btn-secondary compact" onClick={onCancel} autoFocus>
          Cancelar
        </button>
        <button type="button" className={isDanger ? "btn-danger compact" : "btn-primary compact"} onClick={onConfirm}>
          {!isDanger && <TerminalIcon size={14} />} {confirmLabel}
        </button>
      </div>
    </div>
  )
}

export const PCFilesPanel = memo(function PCFilesPanel({
  onCollapseSidebar,
  onOpenFile,
  onOpenBrowser,
  initialCwd,
  onOpenSessionDir,
}: {
  onCollapseSidebar?: () => void
  onOpenFile?: (path: string) => void
  onOpenBrowser?: (url: string) => void
  /** Carpeta inicial (la usa el panel explorer del grid; si falta, recientes). */
  initialCwd?: string | null
  /** Si se provee, el menú ofrece "Nueva sesión de chat aquí". */
  onOpenSessionDir?: (dir: string) => void
}) {
  const t = useT()
  const { toast } = useToast()
  // Desktop (wry) mantiene doble clic para entrar y click simple para expandir;
  // en táctil el tap entra directo a la carpeta.
  const isDesktop = useIsDesktop()
  const touchNav = !isDesktop

  // Avisos flotantes por encima del contenido (toast): nada se renderiza
  // dentro del panel. showNotice = info/success, showError = error.
  const showNotice = useCallback((msg: string) => {
    toast(msg, "info")
  }, [toast])

  const showError = useCallback((msg: string) => {
    toast(msg, "error")
  }, [toast])

  // Estado de cada panel: cwd/dirs/files/loading + recientes + git status.
  // El panel primario reutiliza el mismo hook que el secundario (antes lo
  // reimplementaba a mano).
  const first = usePaneState(null, { onError: showError })
  const second = usePaneState(null, { onError: showError })
  const { getFileGitStatus, getFolderGitStatus } = first

  const [favorites, setFavorites] = useState<string[]>([])
  const [drives, setDrives] = useState<string[]>([])
  const [showDrives, setShowDrives] = useState(false)
  const [query, setQuery] = useState("")
  const [showSearch, setShowSearch] = useState(false)
  const [searchMode, setSearchMode] = useState<"files" | "code">("files")
  const [codeResults, setCodeResults] = useState<CodeSearchResult | null>(null)
  const [codeSearching, setCodeSearching] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [rootExpanded, setRootExpanded] = useState(true)
  const [collapseSignal, setCollapseSignal] = useState(0)

  const [showProjectMenu, setShowProjectMenu] = useState(false)
  const projectMenuRef = useRef<HTMLDivElement | null>(null)
  const projectMenuElRef = useRef<HTMLDivElement | null>(null)
  const [projectMenuPos, setProjectMenuPos] = useState<MenuPos | null>(null)

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
  }, [showProjectMenu, first.recent.length])

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
  const [execConfirm, setExecConfirm] = useState<{ path: string; name: string; pane: "first" | "second" } | null>(null)
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

  // Confirmación inline (en flujo, sobre el árbol del panel afectado).
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null)
  // Filas en animación de eliminado (slide-out rojo) antes del borrado real.
  const [deletingPaths, setDeletingPaths] = useState<string[]>([])
  const [dragOverPath, setDragOverPath] = useState<string | null>(null)

  const [codeViewer, setCodeViewer] = useState<ViewerState | null>(null)
  // El visor recorta al mismo límite en todas las aperturas (el server
  // también trunca, pero a 64KB: el aviso debe reflejar lo que se muestra).
  const VIEWER_MAX_CHARS = 30000
  // Tamaño de texto del visor móvil, persistido entre sesiones (clamp 11-20).
  const [viewerFontSize, setViewerFontSize] = useLocalStorage<number>("opencode.explorer.viewerFontSize", 13)
  const codeFontSize = Number.isFinite(viewerFontSize)
    ? Math.min(20, Math.max(11, viewerFontSize))
    : 13
  const [htmlPreview, setHtmlPreview] = useState<{ path: string } | null>(null)
  const [showSecondPane, setShowSecondPane] = useState(false)
  const [activePane, setActivePane] = useState<"first" | "second">("first")
  const [contextMenuPane, setContextMenuPane] = useState<"first" | "second">("first")

  // Navegación/vista por panel (historial, crumbs, filas filtradas/ordenadas).
  const navFirst = usePaneNav(first.cwd, first.dirs, first.files, first.load, { query, sortMode, sortDir })
  const navSecond = usePaneNav(second.cwd, second.dirs, second.files, second.load, { query, sortMode, sortDir })

  useEffect(() => {
    if (creatingType && createInputRef.current) {
      createInputRef.current.focus()
    }
  }, [creatingType])

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
    const base = contextMenuPane === "second" ? second.cwd : first.cwd
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
    const targetCwd = usePane === "second" ? second.cwd : first.cwd
    const targetLoad = usePane === "second" ? second.load : first.load
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
      if (first.cwd) first.load(first.cwd)
      if (showSecondPane && second.cwd) second.load(second.cwd)
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
    const targetLoad = contextMenuPane === "second" ? second.load : first.load
    const targetCwd = contextMenuPane === "second" ? second.cwd : first.cwd
    if (targetCwd !== dir) targetLoad(dir)
  }

  const handleCreateFolderHere = (dir: string) => {
    setContextMenu(null)
    setCreatingType("folder")
    setNewItemName("")
    const targetLoad = contextMenuPane === "second" ? second.load : first.load
    const targetCwd = contextMenuPane === "second" ? second.cwd : first.cwd
    if (targetCwd !== dir) targetLoad(dir)
  }

  const loadRef = useRef(first.load)
  useEffect(() => { loadRef.current = first.load }, [first.load])
  const didInit = useRef(false)
  useEffect(() => {
    if (didInit.current) return
    didInit.current = true
    shell.fs
      .favorites()
      .then(({ favorites: f }) => setFavorites(f))
      .catch(() => {})
    // initialCwd (panel explorer del grid) manda sobre recientes/unidades.
    if (initialCwd) {
      loadRef.current(initialCwd)
      shell.fs.drives().then(({ drives: d }) => setDrives(d)).catch(() => {})
      return
    }
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

  // Si el padre cambia la carpeta del panel (grid desktop), navegar a ella.
  const prevInitialCwd = useRef<string | null | undefined>(initialCwd)
  useEffect(() => {
    if (initialCwd && initialCwd !== prevInitialCwd.current) {
      prevInitialCwd.current = initialCwd
      loadRef.current(initialCwd)
    }
  }, [initialCwd])

  useEffect(() => {
    const cwd = first.cwd
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
            showError(`Error en búsqueda: ${e instanceof Error ? e.message : String(e)}`)
          }
        })
    }, 350)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchMode, query, first.cwd, showError])

  const openChangeFolder = async () => {
    try {
      const picked = await shell.fs.pickFolder()
      const p = (picked as { path?: string | null })?.path
      if (p) (activePane === "second" ? second.load(p) : first.load(p))
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
          let canShare = false
          try { canShare = (await Share.canShare()).value } catch {}
          if (!canShare) {
            showNotice(`Guardado en caché: ${fileName}`)
            return
          }
          try {
            await Share.share({ title: fileName, url: saved.uri, dialogTitle: fileName })
            // En Android el plugin resuelve también si se cancela el diálogo:
            // no prometemos "Compartido", solo confirmamos que está listo.
            showNotice(`Listo: ${fileName}`)
          } catch (e) {
            const raw = e instanceof Error ? e.message : String(e)
            // Cancelar el diálogo de compartir no es un error: el archivo ya
            // quedó en caché.
            if (/cancel/i.test(raw)) showNotice(`Guardado en caché: ${fileName}`)
            else showError(humanizeFsError(raw))
          }
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
        const raw = e instanceof Error ? e.message : String(e)
        showError(humanizeFsError(raw))
      } finally {
        setDownloading(null)
      }
    },
    [downloading, showNotice, showError]
  )

  // Al cambiar de carpeta la selección anterior ya no vale.
  const clearSelFirst = selFirst.clear
  const clearSelSecond = selSecond.clear
  useEffect(() => { clearSelFirst() }, [first.cwd, clearSelFirst])
  useEffect(() => { clearSelSecond() }, [second.cwd, clearSelSecond])

  const baseName = (p: string) => p.split(/[/\\]/).filter(Boolean).pop() || p

  // Borrado a la Papelera (recuperable). El definitivo vive en
  // handleDeletePermanent como item separado del menú.
  const handleDeletePaths = useCallback((
    pane: "first" | "second",
    paths: string[],
  ) => {
    if (paths.length === 0) return
    setContextMenu(null)
    setPendingDelete({ pane, paths, permanent: false })
  }, [])

  // Borrado definitivo (sin Papelera): diferenciado del Eliminar habitual.
  const handleDeletePermanent = useCallback((
    pane: "first" | "second",
    paths: string[],
  ) => {
    if (paths.length === 0) return
    setContextMenu(null)
    setPendingDelete({ pane, paths, permanent: true })
  }, [])

  const cancelPendingDelete = useCallback(() => setPendingDelete(null), [])

  const confirmPendingDelete = useCallback(async () => {
    const cur = pendingDelete
    if (!cur) return
    setPendingDelete(null)
    setDeletingPaths(cur.paths)
    const reduceMotion = document.documentElement.classList.contains("no-motion")
      || (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    if (!reduceMotion) await new Promise((r) => setTimeout(r, DELETE_ANIM_MS))
    let done = 0
    for (const p of cur.paths) {
      try {
        if (cur.permanent) await shell.fs.delete(p)
        else await shell.fs.trash(p)
        done++
      } catch {}
    }
    setDeletingPaths([])
    if (cur.paths.length > 1) {
      if (done === cur.paths.length) showNotice(cur.permanent ? `Borrado definitivo: ${done}` : `A la Papelera: ${done} elementos`)
      else showError(cur.permanent ? `Borrados ${done} de ${cur.paths.length}` : `A la Papelera ${done} de ${cur.paths.length} (${cur.paths.length - done} con error)`)
    } else if (done === 1) {
      showNotice(cur.permanent ? "Borrado definitivo" : `A la Papelera: ${baseName(cur.paths[0]!)}`)
    } else {
      showError(cur.permanent ? "No se pudo borrar" : "No se pudo mover a la Papelera")
    }
    if (cur.pane === "second") {
      selSecond.clear()
      if (second.cwd) second.load(second.cwd)
    } else {
      selFirst.clear()
      if (first.cwd) first.load(first.cwd)
    }
  }, [pendingDelete, showNotice, showError, first, second, selFirst, selSecond])

  const cancelExecFile = useCallback(() => setExecConfirm(null), [])

  const confirmExecFile = useCallback(async () => {
    const cur = execConfirm
    if (!cur) return
    setExecConfirm(null)
    try {
      const r = await shell.fs.execFile(cur.path)
      if (r.ok) showNotice(`Ejecutando: ${cur.name}`)
      else showError("Error al ejecutar")
    } catch (e: any) {
      showError(`Error: ${e?.message || String(e)}`)
    }
  }, [execConfirm, showNotice, showError])

  // Cajas inline del panel indicado (borrado + ejecutar): en flujo sobre el
  // árbol, no modales.
  const renderPaneConfirms = (pane: "first" | "second") => (
    <>
      {pendingDelete?.pane === pane && (
        <PcfInlineConfirm
          variant="danger"
          title={pendingDelete.permanent
            ? (pendingDelete.paths.length > 1 ? `Borrar ${pendingDelete.paths.length} para siempre (sin Papelera)` : "Borrar para siempre (sin Papelera)")
            : (pendingDelete.paths.length > 1 ? `Mover ${pendingDelete.paths.length} elementos a la Papelera` : "Mover a la Papelera")}
          detail={pendingDelete.paths.length > 1
            ? pendingDelete.paths.map(baseName).slice(0, 3).join(", ") + (pendingDelete.paths.length > 3 ? ` +${pendingDelete.paths.length - 3} más` : "")
            : `“${baseName(pendingDelete.paths[0]!)}”`}
          detailTitle={pendingDelete.paths.join("\n")}
          confirmLabel={pendingDelete.permanent ? "Borrar" : "Mover"}
          onCancel={cancelPendingDelete}
          onConfirm={() => void confirmPendingDelete()}
        />
      )}
      {execConfirm?.pane === pane && (
        <PcfInlineConfirm
          variant="exec"
          title="Ejecutar script"
          detail={execConfirm.name}
          detailTitle={execConfirm.path}
          confirmLabel="Ejecutar"
          onCancel={cancelExecFile}
          onConfirm={() => void confirmExecFile()}
        />
      )}
    </>
  )

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
    if (pane === "second" && second.cwd) second.load(second.cwd)
    else if (first.cwd) first.load(first.cwd)
  }

  const isZipFile = (name: string) => /\.zip$/i.test(name)

  const handleZip = async (entry: FsEntry) => {
    const pane = contextMenuPane
    const targets = targetsOf(pane, entry.path)
    setContextMenu(null)
    const destDir = (pane === "second" ? second.cwd : first.cwd) || getParentPath(targets[0]!) || ""
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
      showError("Error al comprimir")
    }
    if (pane === "second" && second.cwd) second.load(second.cwd)
    else if (first.cwd) first.load(first.cwd)
  }

  const handleUnzip = async (entry: FsEntry) => {
    const pane = contextMenuPane
    setContextMenu(null)
    try {
      const r = await shell.fs.unzip(entry.path)
      const out = (r as { path?: string })?.path
      showNotice(`Extraído en: ${out ? out.split(/[/\\]/).pop() : entry.name}`)
    } catch {
      showError("Error al extraer")
    }
    if (pane === "second" && second.cwd) second.load(second.cwd)
    else if (first.cwd) first.load(first.cwd)
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
    if (pane === "second" && second.cwd) second.load(second.cwd)
    else if (first.cwd) first.load(first.cwd)
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
      if (pane === "second" && second.cwd) second.load(second.cwd)
      else if (first.cwd) first.load(first.cwd)
    } catch (e: any) {
      showError(`Error al renombrar: ${e?.message || String(e)}`)
    }
  }, [renamingValue, first.cwd, first.load, second.cwd, second.load, contextMenuPane, renamingPane, showNotice, showError])

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
        if (first.cwd && (srcs.some((s) => s.startsWith(first.cwd!)) || destDir === first.cwd)) first.load(first.cwd)
        if (showSecondPane && second.cwd && (srcs.some((s) => s.startsWith(second.cwd!)) || destDir === second.cwd))
          second.load(second.cwd)
      } catch (err) {
        showError(`Error al mover: ${err instanceof Error ? err.message : String(err)}`)
      }
    },
    [first, showSecondPane, second, showNotice, showError, selFirst, selSecond],
  )

  // Vista previa HTML en ventana del navegador: sirve el directorio del
  // archivo y abre la URL con token en un browser tab (desktop) o pestaña
  // nueva (móvil/web). Si el serve falla, cae al visor inline.
  const handlePreviewInBrowser = useCallback(
    async (entry: FsEntry) => {
      setContextMenu(null)
      const dir = entry.path.includes("\\")
        ? entry.path.slice(0, entry.path.lastIndexOf("\\"))
        : entry.path.slice(0, entry.path.lastIndexOf("/"))
      try {
        const proj = await shell.project.serve(dir || entry.path)
        const token = (proj as unknown as Record<string, unknown>)?.token as string | undefined
        const preview = (proj as unknown as Record<string, unknown>)?.previewUrl as string | undefined
        const url = token
          ? `${window.location.origin}/shell/preview/${token}/${encodeURIComponent(entry.name)}`
          : preview ?? null
        if (url) {
          if (onOpenBrowser) onOpenBrowser(url)
          else window.open(url, "_blank")
          showNotice(`Abierto en navegador: ${entry.name}`)
          return
        }
      } catch {
        // cae al visor inline
      }
      setHtmlPreview({ path: entry.path })
    },
    [onOpenBrowser, showNotice]
  )

  // Abrir en editor/visor — click primario NO descarga
  // Secuencia del visor: cualquier apertura/cierre invalida las lecturas en
  // vuelo (una respuesta vieja no pisa el archivo nuevo ni reabre al cerrar).
  const viewerSeqRef = useRef(0)
  const handleOpenFile = useCallback(
    async (entry: FsEntry) => {
      if (onOpenFile) {
        onOpenFile(entry.path)
        return
      }
      // HTML → visor con preview tipo navegador (CSS embebido o externo)
      if (isHtmlFile(entry.name)) {
        setHtmlPreview({ path: entry.path })
        viewerSeqRef.current++
        setCodeViewer(null)
        showNotice(`Vista previa: ${entry.name}`)
        return
      }
      // Fallback inline (móvil / sin grid): lee como texto vía GET /shell/fs/read
      // (misma base remota + auth que el listado, sin descargar) y muestra visor.
      const seq = ++viewerSeqRef.current
      try {
        const res: any = await shell.fs.read(entry.path)
        if (seq !== viewerSeqRef.current) return
        const text: string = res?.content ?? res?.data ?? res?.text ?? (typeof res === "string" ? res : "")
        if (typeof text === "string") {
          // Binario: no mostrar basura; ofrecer descarga explícita.
          if (looksLikeBinary(text)) {
            setCodeViewer({
              kind: "error",
              entry,
              message: "Este archivo parece binario; no hay vista previa de texto.",
              canDownload: true,
            })
            return
          }
          // Texto vacío es un archivo legible: visor vacío, no error.
          const clipped = text.length > VIEWER_MAX_CHARS
          setCodeViewer({ kind: "text", path: entry.path, line: 1, content: text.slice(0, VIEWER_MAX_CHARS) })
          showNotice(res?.truncated || clipped ? `Abierto (vista parcial): ${entry.name}` : `Abierto: ${entry.name}`)
          return
        }
      } catch (e) {
        if (seq !== viewerSeqRef.current) return
        const raw = e instanceof Error ? e.message : String(e)
        setCodeViewer({
          kind: "error",
          entry,
          message: humanizeFsError(raw),
          canDownload: canDownloadAfterError(raw),
        })
        return
      }
    },
    [onOpenFile, showNotice]
  )
  const handleOpenAtLine = useCallback(
    async (path: string, line: number) => {
      const seq = ++viewerSeqRef.current
      try {
        const res: any = await shell.fs.read(path)
        if (seq !== viewerSeqRef.current) return
        const text: string = res?.content ?? res?.data ?? res?.text ?? ""
        if (!text && typeof res === "string") {
          setCodeViewer({ kind: "text", path, line, content: String(res).slice(0, VIEWER_MAX_CHARS) })
        } else if (typeof text === "string" && text) {
          setCodeViewer({ kind: "text", path, line, content: text.slice(0, VIEWER_MAX_CHARS) })
        } else {
          const blob = await shell.fs.download(path)
          if (seq !== viewerSeqRef.current) return
          const txt = await blob.text()
          if (seq !== viewerSeqRef.current) return
          setCodeViewer({ kind: "text", path, line, content: txt.slice(0, VIEWER_MAX_CHARS) })
        }
        showNotice(`Abierto en línea ${line}: ${path.split(/[/\\]/).pop()}`)
      } catch (e) {
        if (seq !== viewerSeqRef.current) return
        const raw = e instanceof Error ? e.message : String(e)
        showError(humanizeFsError(raw))
      }
    },
    [showNotice, showError]
  )

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

  const selFirstPaths = selFirst.selected
  const selSecondPaths = selSecond.selected

  const handleRowClickFirst = useCallback((e: React.MouseEvent, entry: FsEntry) => {
    setActivePane("first")
    selFirst.select(entry.path, navFirst.ordered, e)
  }, [selFirst, navFirst.ordered])
  const handleRowClickSecond = useCallback((e: React.MouseEvent, entry: FsEntry) => {
    setActivePane("second")
    selSecond.select(entry.path, navSecond.ordered, e)
  }, [selSecond, navSecond.ordered])

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
    const ordered = pane === "second" ? navSecond.ordered : navFirst.ordered
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
        const dest = pane === "second" ? second.cwd : first.cwd
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
  }, [renamingPath, selFirst, selSecond, navFirst.ordered, navSecond.ordered, handleDeletePaths, second, first])

  // Cantidad en lote del menú contextual: si la fila clicada está dentro de
  // la selección del panel, Eliminar/Copiar operan sobre toda la selección.
  const menuSel = contextMenuPane === "second" ? selSecondPaths : selFirstPaths
  const menuBulkN = contextMenu?.entry && menuSel.length > 1 && menuSel.includes(contextMenu.entry.path)
    ? menuSel.length
    : 1

  // Filo de props de fila por panel (mismas para primario y secundario).
  const rowsFirst: ExplorerPaneRows = {
    favorites,
    onFav: fav,
    downloading,
    onDownload: handleDownload,
    onOpenFile: handleOpenFile,
    onOpenWith: setOpenWithFile,
    showNotice,
    getFileGitStatus,
    getFolderGitStatus,
    renamingPath,
    renamingValue,
    onRenamingChange: setRenamingValue,
    onRenameCommit: commitRename,
    onRenameCancel: cancelRename,
    onStartRename: startRenameFirst,
    selection: selFirst,
    onSelect: handleRowClickFirst,
    getDragPayload: dragPayloadFirst,
    cutPaths,
    deletingPaths,
  }
  const rowsSecond: ExplorerPaneRows = {
    ...rowsFirst,
    onStartRename: startRenameSecond,
    selection: selSecond,
    onSelect: handleRowClickSecond,
    getDragPayload: dragPayloadSecond,
  }

  const headerActionsFirst = (
    <>
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
        onClick={() => first.cwd && first.load(first.cwd)}
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
            if (!second.cwd) {
              if (first.cwd) second.load(first.cwd)
              else if (drives[0]) second.load(drives[0])
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
    </>
  )

  const headerActionsSecond = (
    <>
      <button
        type="button"
        className="pcf-action-btn"
        title="Recargar"
        aria-label="Recargar"
        onClick={() => second.cwd && second.load(second.cwd)}
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
    </>
  )

  const inlineCreateFirst = creatingType ? (
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
            if (!clean || !first.cwd) {
              setCreatingType(null)
              return
            }
            const sep = first.cwd.includes("\\") ? "\\" : "/"
            const full = `${first.cwd}${first.cwd.endsWith(sep) ? "" : sep}${clean}`
            setCreatingType(null)
            try {
              if (creatingType === "folder") {
                await shell.fs.mkdir(full)
                showNotice(`Carpeta creada: ${clean}`)
              } else {
                await shell.fs.write(full, "")
                showNotice(`Archivo creado: ${clean}`)
              }
              first.load(first.cwd)
            } catch {
              showError(`Error al crear ${creatingType === "folder" ? "carpeta" : "archivo"}`)
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
  ) : null

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
              {first.recent.length === 0 ? (
                <div className="pcf-dropdown-empty">Sin proyectos recientes</div>
              ) : (
                first.recent.map((p) => {
                  const label = p.split(/[/\\]/).filter(Boolean).pop() || p
                  const isActive = first.cwd === p
                  return (
                    <button
                      key={p}
                      type="button"
                      className="pcf-dropdown-item"
                      style={{ fontWeight: isActive ? 600 : 400 }}
                      onClick={() => {
                        setShowProjectMenu(false)
                        first.load(p)
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

      {showDrives && (
        <div className="pcf-drives">
          {drives.map((d) => (
            <button
              key={d}
              type="button"
              className={`pcf-drive${(activePane === "second" ? second.cwd : first.cwd) === d ? " active" : ""}`}
              onClick={() => (activePane === "second" ? second.load(d) : first.load(d))}
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
            cwd={first.cwd}
            downloading={downloading}
            onDownload={handleDownload}
            onOpenAtLine={handleOpenAtLine}
          />
        </div>
      ) : (
        <div className="pcf-tree-container" style={showSecondPane ? { display: "flex", gap: 8, alignItems: "stretch" } : undefined}>
          <ExplorerPane
            pane={first}
            nav={navFirst}
            variant="first"
            ariaBase="Archivos"
            crumbsAria="Ruta actual"
            titleIcon={rootExpanded ? <ChevronDownIcon size={12} /> : <ChevronRightIcon size={12} />}
            onTitleClick={() => setRootExpanded((v) => !v)}
            headerActions={headerActionsFirst}
            onActivate={() => setActivePane("first")}
            query={query}
            collapseSignal={collapseSignal}
            touchNav={touchNav}
            rows={rowsFirst}
            onContextMenu={handleContextMenuFirst}
            onTreeKeyDown={(e) => onTreeKeyDown(e, "first")}
            onDeletePaths={(paths) => void handleDeletePaths("first", paths)}
            confirms={renderPaneConfirms("first")}
            inlineCreate={inlineCreateFirst}
            showTree={rootExpanded}
            uploadRef={uploadFirstRef}
            onUpload={(files) => first.cwd && void uploadFiles("first", first.cwd, files)}
            dragOverPath={dragOverPath}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDropOnDir={(e, d) => void handleFileDrop(e, d, "first")}
            onDropOnPane={(e) => { if (first.cwd) void handleFileDrop(e, first.cwd, "first") }}
          />
          {showSecondPane && (
            <ExplorerPane
              pane={second}
              nav={navSecond}
              variant="second"
              ariaBase="Archivos (2)"
              crumbsAria="Ruta actual (2)"
              titleIcon={<FolderIcon size={12} />}
              onTitleClick={() => second.cwd && second.load(second.cwd)}
              headerActions={headerActionsSecond}
              onActivate={() => setActivePane("second")}
              query={query}
              collapseSignal={collapseSignal}
              touchNav={touchNav}
              rows={rowsSecond}
              onContextMenu={handleContextMenuSecond}
              onTreeKeyDown={(e) => onTreeKeyDown(e, "second")}
              onDeletePaths={(paths) => void handleDeletePaths("second", paths)}
              confirms={renderPaneConfirms("second")}
              showTree
              uploadRef={uploadSecondRef}
              onUpload={(files) => second.cwd && void uploadFiles("second", second.cwd, files)}
              dragOverPath={dragOverPath}
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDropOnDir={(e, d) => void handleFileDrop(e, d, "second")}
              onDropOnPane={(e) => { if (second.cwd) void handleFileDrop(e, second.cwd, "second") }}
            />
          )}
        </div>
      )}

      {codeViewer && (
        <div
          className={`pcf-code-viewer ${isDesktop ? "" : "is-mobile"}`}
          {...(isDesktop ? {} : { style: { ["--pcf-code-font-size" as string]: `${codeFontSize}px` } })}
        >
          <div className="pcf-code-viewer-header">
            <div className="pcf-code-viewer-info">
              <span
                className="pcf-code-viewer-file"
                title={codeViewer.kind === "text" ? codeViewer.path : codeViewer.entry.path}
              >
                {codeViewer.kind === "text"
                  ? `${codeViewer.path.split(/[/\\]/).pop()} :${codeViewer.line}`
                  : codeViewer.entry.name}
              </span>
              <span
                className="pcf-code-viewer-path"
                title={codeViewer.kind === "text" ? codeViewer.path : codeViewer.entry.path}
              >
                {codeViewer.kind === "text" ? codeViewer.path : codeViewer.entry.path}
              </span>
            </div>
            {!isDesktop && codeViewer.kind === "text" && (
              <>
                <button
                  type="button"
                  className="pcf-code-font-btn"
                  aria-label="Reducir tamaño de texto"
                  title="Texto más chico"
                  onClick={() => setViewerFontSize((v) => Math.max(11, Math.min(20, (Number.isFinite(v) ? v : 13)) - 1))}
                >
                  A−
                </button>
                <button
                  type="button"
                  className="pcf-code-font-btn"
                  aria-label="Aumentar tamaño de texto"
                  title="Texto más grande"
                  onClick={() => setViewerFontSize((v) => Math.min(20, Math.max(11, (Number.isFinite(v) ? v : 13)) + 1))}
                >
                  A+
                </button>
              </>
            )}
            <button
              type="button"
              className="btn-icon compact pcf-code-close"
              onClick={() => {
                viewerSeqRef.current++
                setCodeViewer(null)
              }}
              aria-label="Cerrar visor"
              title="Cerrar"
            >
              ×
            </button>
          </div>
          {codeViewer.kind === "error" ? (
            <div className="pcf-viewer-error" role="alert">
              <span>{codeViewer.message}</span>
              {codeViewer.canDownload && (
                <button
                  type="button"
                  className="btn-primary compact"
                  onClick={() => void handleDownload(codeViewer.entry)}
                >
                  Descargar
                </button>
              )}
            </div>
          ) : (
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
          )}
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
                      setExecConfirm({ path: e.path, name: e.name, pane: contextMenuPane })
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
                      (contextMenuPane === "second" ? second.load : first.load)(contextMenu.entry!.path)
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
                          .catch(() => showError("No se pudo abrir"))
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
                    onClick={() => handlePreviewInBrowser(contextMenu.entry!)}
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
                      contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : (contextMenuPane === "second" ? second.cwd : first.cwd) || ""
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
                      contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : (contextMenuPane === "second" ? second.cwd : first.cwd) || ""
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
                      .then((r) => (r.ok ? showNotice("Abierto en el Explorador") : showError("No se pudo abrir")))
                      .catch(() => showError("No se pudo abrir"))
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
                {onOpenSessionDir && contextMenu.isDir && (
                  <button
                    type="button"
                    className="overflow-item"
                    onClick={() => {
                      const p = contextMenu.entry!.path
                      setContextMenu(null)
                      onOpenSessionDir(p)
                    }}
                  >
                    <span>
                      <ChatIcon size={14} />
                    </span>{" "}
                    Nueva sesión de chat aquí
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
                  onClick={() => handleCreateFileHere((activePane === "second" ? second.cwd : first.cwd) || "")}
                >
                  <span>
                    <FileIcon size={14} />
                  </span>{" "}
                  Nuevo archivo aquí
                </button>
                <button
                  type="button"
                  className="overflow-item"
                  onClick={() => handleCreateFolderHere((activePane === "second" ? second.cwd : first.cwd) || "")}
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
                    const dir = (contextMenuPane === "second" ? second.cwd : first.cwd) || ""
                    if (dir) void handleTerminalHere(dir)
                    else setContextMenu(null)
                  }}
                >
                  <span>
                    <TerminalIcon size={14} />
                  </span>{" "}
                  Abrir terminal aquí
                </button>
                {onOpenSessionDir && (() => {
                  const dir = (contextMenuPane === "second" ? second.cwd : first.cwd) || ""
                  return dir ? (
                    <button
                      type="button"
                      className="overflow-item"
                      onClick={() => {
                        setContextMenu(null)
                        onOpenSessionDir(dir)
                      }}
                    >
                      <span>
                        <ChatIcon size={14} />
                      </span>{" "}
                      Nueva sesión de chat aquí
                    </button>
                  ) : null
                })()}
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
                      : (contextMenuPane === "second" ? second.cwd : first.cwd) || ""
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
