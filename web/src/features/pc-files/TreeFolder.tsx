import { memo, useState, useEffect, useCallback } from "react"
import { ChevronRightIcon, ChevronDownIcon } from "../../Icons"
import { VSCodeFileIcon } from "../../components/VSCodeFileIcon"
import { shell, type FsEntry } from "../../shell"
import { FileRow } from "./FileRow"
import type { GitFileStatus } from "./useGitStatus"

export type TreeFolderProps = {
  entry: FsEntry
  depth?: number
  onEnterDir: (path: string) => void
  query: string
  downloading: string | null
  onDownload: (f: FsEntry) => void
  onOpenFile?: (f: FsEntry) => void
  favorites: string[]
  onFav: (path: string, add: boolean) => void
  showNotice: (msg: string) => void
  getFileGitStatus: (path: string) => GitFileStatus | null
  getFolderGitStatus: (path: string) => { color: string; hasChanges: boolean } | null
  collapseSignal?: number
  onContextMenu?: (e: React.MouseEvent, entry: FsEntry, isDir: boolean) => void
  renamingPath?: string | null
  renamingValue?: string
  onRenamingChange?: (v: string) => void
  onRenameCommit?: (entry: FsEntry) => void
  onRenameCancel?: () => void
  onStartRename?: (entry: FsEntry) => void
}

export const TreeFolder = memo(function TreeFolder({
  entry,
  depth = 0,
  onEnterDir,
  query,
  downloading,
  onDownload,
  onOpenFile,
  favorites,
  onFav,
  showNotice,
  getFileGitStatus,
  getFolderGitStatus,
  collapseSignal = 0,
  onContextMenu,
  renamingPath,
  renamingValue,
  onRenamingChange,
  onRenameCommit,
  onRenameCancel,
  onStartRename,
}: TreeFolderProps) {
  const [expanded, setExpanded] = useState(false)
  const [subDirs, setSubDirs] = useState<FsEntry[]>([])
  const [subFiles, setSubFiles] = useState<FsEntry[]>([])
  const [loading, setLoading] = useState(false)
  const isRenaming = renamingPath === entry.path

  // Collapse all signal handler
  useEffect(() => {
    if (collapseSignal > 0) {
      setExpanded(false)
    }
  }, [collapseSignal])

  const toggle = useCallback(async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (subDirs.length === 0 && subFiles.length === 0) {
      setLoading(true)
      try {
        const r = await shell.fs.list(entry.path)
        setSubDirs(r.dirs || [])
        setSubFiles(r.files || [])
      } catch {
        setSubDirs([])
        setSubFiles([])
      } finally {
        setLoading(false)
      }
    }
  }, [expanded, entry.path, subDirs.length, subFiles.length])

  const folderGitStatus = getFolderGitStatus(entry.path)
  const q = query.trim().toLowerCase()
  const filteredDirs = q ? subDirs.filter((d) => d.name.toLowerCase().includes(q)) : subDirs
  const filteredFiles = q ? subFiles.filter((f) => f.name.toLowerCase().includes(q)) : subFiles

  return (
    <div className="pcf-folder-group">
      <div
        className={`pcf-row pcf-dir ${expanded ? "is-expanded" : ""} ${isRenaming ? "is-renaming" : ""}`}
        style={{ paddingLeft: `${depth * 14 + 6}px` }}
        onClick={() => { if (!isRenaming) toggle() }}
        onDoubleClick={() => { if (!isRenaming) onEnterDir(entry.path) }}
        onContextMenu={onContextMenu ? (e) => onContextMenu(e, entry, true) : undefined}
        role="treeitem"
        aria-expanded={expanded}
        tabIndex={0}
        draggable={!isRenaming}
        onDragStart={(e) => {
          if (isRenaming) { e.preventDefault(); return }
          e.dataTransfer.setData("text/plain", entry.path)
          e.dataTransfer.setData("application/x-opencode-path", entry.path)
          e.dataTransfer.effectAllowed = "move"
          e.stopPropagation()
        }}
        onKeyDown={(e) => {
          if (isRenaming) return
          if (e.key === "F2" && onStartRename) { e.preventDefault(); onStartRename(entry); return }
          if (e.key === "Enter") toggle()
        }}
        title={entry.path}
      >
        <span className="pcf-chevron">
          {expanded ? <ChevronDownIcon size={11} /> : <ChevronRightIcon size={11} />}
        </span>
        <span className="pcf-icon-wrap">
          <VSCodeFileIcon name={entry.name} isDir={true} isOpen={expanded} size={15} />
        </span>
        {isRenaming ? (
          <input
            className="pcf-inline-input"
            value={renamingValue ?? ""}
            autoFocus
            onChange={(e) => onRenamingChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); onRenameCommit?.(entry) }
              else if (e.key === "Escape") { e.preventDefault(); onRenameCancel?.() }
            }}
            onBlur={() => onRenameCommit?.(entry)}
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.currentTarget.select()}
          />
        ) : (
          <span
            className="pcf-name"
            style={folderGitStatus ? { color: folderGitStatus.color } : undefined}
          >
            {entry.name}
          </span>
        )}
        {folderGitStatus?.hasChanges && (
          <span
            className="pcf-dot"
            style={{ backgroundColor: folderGitStatus.color }}
            title="Cambios en Git"
          />
        )}
      </div>

      {expanded && (
        <div className="pcf-sublist" style={{ marginLeft: `${depth * 14 + 11}px` }}>
          {loading && <div className="pcf-loading">Cargando…</div>}
          {!loading &&
            filteredDirs.map((d) => (
              <TreeFolder
                key={d.path}
                entry={d}
                depth={depth + 1}
                onEnterDir={onEnterDir}
                query={query}
                downloading={downloading}
                onDownload={onDownload}
                onOpenFile={onOpenFile}
                favorites={favorites}
                onFav={onFav}
                showNotice={showNotice}
                getFileGitStatus={getFileGitStatus}
                getFolderGitStatus={getFolderGitStatus}
                collapseSignal={collapseSignal}
                onContextMenu={onContextMenu}
                renamingPath={renamingPath}
                renamingValue={renamingValue}
                onRenamingChange={onRenamingChange}
                onRenameCommit={onRenameCommit}
                onRenameCancel={onRenameCancel}
                onStartRename={onStartRename}
              />
            ))}
          {!loading &&
            filteredFiles.map((f) => (
              <FileRow
                key={f.path}
                file={f}
                depth={depth + 1}
                downloading={downloading}
                onDownload={onDownload}
                onOpenFile={onOpenFile}
                isFav={favorites.includes(f.path)}
                onToggleFav={onFav}
                showNotice={showNotice}
                gitStatus={getFileGitStatus(f.path)}
                onContextMenu={onContextMenu}
                renamingPath={renamingPath}
                renamingValue={renamingValue}
                onRenamingChange={onRenamingChange}
                onRenameCommit={onRenameCommit}
                onRenameCancel={onRenameCancel}
                onStartRename={onStartRename}
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
