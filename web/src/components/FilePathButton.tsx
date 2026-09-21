// FilePathButton — chip para rutas detectadas en el chat (Markdown).
// Click → menú con: abrir en editor, app predeterminada, elegir app, mostrar
// en carpeta y copiar ruta. El editor sale del contexto (FilePathProvider);
// las acciones de app usan el shell del PC (/shell/fs/*), que también funciona
// desde el celular cuando el explorador remoto está disponible.
import { createContext, memo, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { ContextMenu, type ContextAction } from "./ContextMenu"
import { OpenWithDialog } from "../features/pc-files/OpenWithDialog"
import { useToast } from "./Toasts"
import { shell, type FsEntry } from "../shell"
import { basenameFsPath, extColor, isAbsoluteFsPath, resolveFsPath, splitFsPath } from "../shared/lib/filePaths.ts"
import { CodeIcon, CopyIcon, FolderIcon, MonitorIcon, PlayIcon } from "../Icons"

export type FilePathActions = {
  /** Abre la ruta en el editor (modal en móvil, panel en desktop). */
  onOpenFile?: (path: string) => void
  /** Directorio de la sesión para resolver rutas relativas. */
  directory?: string
}

const FilePathCtx = createContext<FilePathActions>({})

export function FilePathProvider({ onOpenFile, directory, children }: FilePathActions & { children: ReactNode }) {
  const value = useMemo(() => ({ onOpenFile, directory }), [onOpenFile, directory])
  return <FilePathCtx.Provider value={value}>{children}</FilePathCtx.Provider>
}

export const FilePathButton = memo(function FilePathButton({ path, label }: { path: string; label?: string }) {
  const { onOpenFile, directory } = useContext(FilePathCtx)
  const { toast } = useToast()
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [openWith, setOpenWith] = useState<string | null>(null)

  const resolved = useMemo(() => resolveFsPath(path, directory), [path, directory])
  const relativeUnresolved = !isAbsoluteFsPath(path) && !directory
  const shown = label ?? path
  const { dir, name } = useMemo(() => splitFsPath(shown), [shown])
  const dot = useMemo(() => extColor(name), [name])

  const run = useCallback(
    (fn: () => Promise<unknown>, okMsg: string) => {
      fn()
        .then(() => toast(okMsg, "success"))
        .catch((e) => toast(e instanceof Error ? e.message : String(e), "error"))
    },
    [toast]
  )

  const actions = useMemo<ContextAction[]>(() => {
    const list: ContextAction[] = []
    if (onOpenFile) {
      list.push({ id: "editor", label: "Abrir en editor", icon: <CodeIcon size={14} />, onAction: () => onOpenFile(resolved) })
    }
    list.push({
      id: "default",
      label: "Abrir con app predeterminada",
      icon: <MonitorIcon size={14} />,
      onAction: () => run(() => shell.fs.openDefault(resolved), `Abriendo con app predeterminada: ${basenameFsPath(resolved)}`),
    })
    list.push({
      id: "openwith",
      label: "Abrir con…",
      icon: <PlayIcon size={14} />,
      onAction: () => setOpenWith(resolved),
    })
    list.push({
      id: "reveal",
      label: "Mostrar en carpeta",
      icon: <FolderIcon size={14} />,
      dividerBefore: true,
      onAction: () => run(() => shell.fs.reveal(resolved), "Mostrando en el explorador del PC…"),
    })
    list.push({
      id: "copy",
      label: "Copiar ruta completa",
      icon: <CopyIcon size={14} />,
      onAction: () => {
        navigator.clipboard
          ?.writeText(resolved)
          .then(() => toast("Ruta copiada", "success"))
          .catch(() => toast("No se pudo copiar la ruta", "error"))
      },
    })
    return list
  }, [onOpenFile, resolved, run, toast])

  // Ruta relativa sin directorio de sesión: no hay forma de resolverla.
  if (relativeUnresolved) return <>{shown}</>

  const dialogFile: FsEntry | null = openWith
    ? { name: basenameFsPath(openWith), path: openWith, is_dir: false, size: null, modified: null }
    : null

  // Al abrir el menú (también en móvil, sin hover) se ve la ruta absoluta a la
  // que resuelve una referencia relativa; en el chip queda además en el title.
  const info = (
    <div className="menu-info-path" title={resolved}>
      <span className="menu-info-label">Ruta completa</span>
      <code>{resolved}</code>
    </div>
  )

  return (
    <>
      <button
        type="button"
        className="filepath-chip"
        title={resolved === path ? resolved : `${shown} → ${resolved}`}
        aria-haspopup="menu"
        aria-expanded={menu !== null}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setMenu({ x: e.clientX, y: e.clientY })
        }}
      >
        <span className="fp-dot" style={{ background: dot }} aria-hidden="true" />
        {dir && <span className="fp-dir">{dir}</span>}
        <span className="fp-name">{name}</span>
        <span className="fp-go" aria-hidden="true">↗</span>
      </button>
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          actions={actions}
          info={info}
          onClose={() => setMenu(null)}
        />
      )}
      {dialogFile && (
        <OpenWithDialog file={dialogFile} onClose={() => setOpenWith(null)} showNotice={(msg) => toast(msg)} />
      )}
    </>
  )
})
