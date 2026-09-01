import { memo, useState, useRef } from "react"
import { MenuDotsIcon, DownloadIcon, StarIcon } from "../../Icons"
import { VSCodeFileIcon } from "../../components/VSCodeFileIcon"
import type { FsEntry } from "../../shell"
import { useOutsideClick } from "../../hooks/useOutsideClick"
import type { GitFileStatus } from "./useGitStatus"

export type FileRowProps = {
  file: FsEntry
  depth?: number
  downloading: string | null
  onDownload: (f: FsEntry) => void
  onOpenFile?: (f: FsEntry) => void
  isFav: boolean
  onToggleFav: (path: string, add: boolean) => void
  showNotice: (msg: string) => void
  gitStatus?: GitFileStatus | null
  onContextMenu?: (e: React.MouseEvent, entry: FsEntry, isDir: boolean) => void
  renamingPath?: string | null
  renamingValue?: string
  onRenamingChange?: (v: string) => void
  onRenameCommit?: (entry: FsEntry) => void
  onRenameCancel?: () => void
  onStartRename?: (entry: FsEntry) => void
}

export function formatFileSize(size: number | null): string {
  if (size == null) return ""
  if (size > 1024 * 1024) return `${(size / 1048576).toFixed(1)}M`
  if (size > 1024) return `${(size / 1024).toFixed(0)}K`
  return `${size}B`
}

export const FileRow = memo(function FileRow({
  file: f,
  depth = 0,
  downloading,
  onDownload,
  onOpenFile,
  isFav,
  onToggleFav,
  showNotice,
  gitStatus,
  onContextMenu,
  renamingPath,
  renamingValue,
  onRenamingChange,
  onRenameCommit,
  onRenameCancel,
  onStartRename,
}: FileRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen)
  const isDownloading = downloading === f.path
  const isRenaming = renamingPath === f.path

  return (
    <div
      className={`pcf-row pcf-file ${gitStatus ? `git-${gitStatus.status.toLowerCase()}` : ""} ${isRenaming ? "is-renaming" : ""}`}
      style={{ paddingLeft: `${depth * 14 + 18}px` }}
      title={f.path}
      onClick={() => !isRenaming && (onOpenFile ? onOpenFile(f) : onDownload(f))}
      onContextMenu={onContextMenu ? (e) => onContextMenu(e, f, false) : undefined}
      draggable={!isRenaming}
      onDragStart={(e) => {
        if (isRenaming) { e.preventDefault(); return }
        const isImg = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(f.name)
        e.dataTransfer.setData("text/plain", f.path)
        e.dataTransfer.setData("application/x-opencode-path", f.path)
        e.dataTransfer.setData("application/x-opencode-is-image", isImg ? "1" : "0")
        e.dataTransfer.effectAllowed = "move"
      }}
      role="treeitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (isRenaming) return
        if (e.key === "Enter") (onOpenFile ? onOpenFile(f) : onDownload(f))
        else if (e.key === "F2" && onStartRename) { e.preventDefault(); onStartRename(f) }
      }}
    >
      <span className="pcf-icon-wrap">
        <VSCodeFileIcon name={f.name} size={15} />
      </span>
      {isRenaming ? (
        <input
          className="pcf-inline-input"
          value={renamingValue ?? ""}
          autoFocus
          onChange={(e) => onRenamingChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onRenameCommit?.(f) }
            else if (e.key === "Escape") { e.preventDefault(); onRenameCancel?.() }
          }}
          onBlur={() => onRenameCommit?.(f)}
          onClick={(e) => e.stopPropagation()}
          onFocus={(e) => e.currentTarget.select()}
        />
      ) : (
        <span
          className="pcf-name"
          style={gitStatus ? { color: gitStatus.color } : undefined}
        >
          {f.name}
        </span>
      )}

      {gitStatus && (
        <span
          className="pcf-git-badge"
          style={{ color: gitStatus.color }}
          title={`Git: ${gitStatus.status}`}
        >
          {gitStatus.badge}
        </span>
      )}

      <span className="pcf-size">{formatFileSize(f.size)}</span>

      <div className="pcf-menu-wrap" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="pcf-dots-btn"
          onClick={() => setMenuOpen((v) => !v)}
          title="Opciones"
          aria-label={`Opciones de ${f.name}`}
          aria-expanded={menuOpen}
        >
          <MenuDotsIcon size={13} />
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
