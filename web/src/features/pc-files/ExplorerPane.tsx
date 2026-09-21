import type { DragEvent, KeyboardEvent, MouseEvent, ReactNode, RefObject } from "react"
import { ArrowLeftIcon, RedoIcon, UndoIcon } from "../../Icons"
import type { FsEntry } from "../../shell"
import { FileRow } from "./FileRow"
import { TreeFolder } from "./TreeFolder"
import type { GitFileStatus } from "./useGitStatus"
import type { PaneState } from "./usePaneState"
import type { PaneNav } from "./usePaneNav"
import type { RowSelection } from "./multiSelect"

// Props compartidas de las filas (archivos y carpetas): todo lo que el panel
// reenvía a FileRow/TreeFolder, agrupado para no repetir 20 props por panel.
export type ExplorerPaneRows = {
  favorites: string[]
  onFav: (path: string, add: boolean) => void
  downloading: string | null
  onDownload: (f: FsEntry) => void
  onOpenFile?: (f: FsEntry) => void
  onOpenWith: (f: FsEntry) => void
  showNotice: (msg: string) => void
  getFileGitStatus: (path: string) => GitFileStatus | null
  getFolderGitStatus: (path: string) => { color: string; hasChanges: boolean } | null
  renamingPath: string | null
  renamingValue: string
  onRenamingChange: (v: string) => void
  onRenameCommit: (f: FsEntry) => void
  onRenameCancel: () => void
  onStartRename: (f: FsEntry) => void
  selection: RowSelection
  onSelect: (e: MouseEvent, entry: FsEntry) => void
  getDragPayload: (path: string) => string[]
  cutPaths: string[]
  deletingPaths: string[]
}

// Estructura común de un panel del explorer: header (volver + título +
// acciones), breadcrumbs + atrás/adelante, input de subida, barra de selección
// y árbol de carpetas/archivos. Antes duplicada entre panel primario y secundario.
export function ExplorerPane({
  pane,
  nav,
  variant,
  ariaBase,
  crumbsAria,
  titleIcon,
  onTitleClick,
  headerActions,
  onActivate,
  query,
  collapseSignal,
  touchNav,
  rows,
  onContextMenu,
  onTreeKeyDown,
  onDeletePaths,
  confirms,
  inlineCreate,
  showTree,
  uploadRef,
  onUpload,
  dragOverPath,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDropOnDir,
  onDropOnPane,
}: {
  pane: PaneState
  nav: PaneNav
  variant: "first" | "second"
  ariaBase: string
  crumbsAria: string
  titleIcon: ReactNode
  onTitleClick: () => void
  headerActions: ReactNode
  onActivate: () => void
  query: string
  collapseSignal: number
  touchNav: boolean
  rows: ExplorerPaneRows
  onContextMenu: (e: MouseEvent, entry: FsEntry | null, isDir: boolean) => void
  onTreeKeyDown: (e: KeyboardEvent<HTMLDivElement>) => void
  onDeletePaths: (paths: string[]) => void
  confirms: ReactNode
  inlineCreate?: ReactNode
  showTree: boolean
  uploadRef: RefObject<HTMLInputElement | null>
  onUpload: (files: FileList) => void
  dragOverPath: string | null
  onDragOver: (e: DragEvent) => void
  onDragEnter: (e: DragEvent, dest: string) => void
  onDragLeave: (e: DragEvent) => void
  onDropOnDir: (e: DragEvent, dest: string) => void
  onDropOnPane: (e: DragEvent) => void
}) {
  const { sortedDirs, sortedFiles, qLower, crumbs, workspaceName, parentPath, canGoBack, canBack, canForward, goHist } = nav
  const selectedPaths = rows.selection.selected
  const isSecond = variant === "second"

  return (
    <div
      style={
        isSecond
          ? {
              flex: 1,
              minWidth: 0,
              minHeight: 0,
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid var(--border)",
              paddingLeft: 8,
            }
          : { flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }
      }
      onClick={onActivate}
    >
      <div className="pcf-workspace-header">
        <button
          type="button"
          className="pcf-action-btn pcf-back-btn"
          title={canGoBack ? `Volver a ${parentPath}` : "No hay carpeta anterior"}
          aria-label="Volver a la carpeta anterior"
          disabled={!canGoBack}
          onClick={() => parentPath && pane.load(parentPath)}
        >
          <ArrowLeftIcon size={14} />
        </button>
        <div className="pcf-workspace-title" onClick={onTitleClick} title={pane.cwd ?? ""}>
          <span className="pcf-chevron">{titleIcon}</span>
          <span className="pcf-workspace-name">{workspaceName}</span>
        </div>
        <div className="pcf-workspace-actions">{headerActions}</div>
      </div>

      <div className="pcf-crumbs" role="navigation" aria-label={crumbsAria}>
        <button
          type="button"
          className="pcf-hist-btn"
          title="Atrás"
          aria-label="Atrás en el historial"
          disabled={!canBack}
          onClick={() => goHist(-1)}
        >
          <UndoIcon size={12} />
        </button>
        <button
          type="button"
          className="pcf-hist-btn"
          title="Adelante"
          aria-label="Adelante en el historial"
          disabled={!canForward}
          onClick={() => goHist(1)}
        >
          <RedoIcon size={12} />
        </button>
        <div className="pcf-crumb-trail">
          {crumbs.map((c, i) => (
            <span key={c.path} className="pcf-crumb-item">
              {i > 0 && <span className="pcf-crumb-sep">›</span>}
              <button
                type="button"
                className={`pcf-crumb${i === crumbs.length - 1 ? " active" : ""}`}
                onClick={() => pane.load(c.path)}
                title={c.path}
              >
                {c.label}
              </button>
            </span>
          ))}
        </div>
      </div>

      <input
        ref={uploadRef}
        type="file"
        multiple
        hidden
        aria-hidden="true"
        tabIndex={-1}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0 && pane.cwd) onUpload(e.target.files)
          e.target.value = ""
        }}
      />

      {selectedPaths.length > 1 && (
        <div className="pcf-selbar" role="status">
          <span>{selectedPaths.length} seleccionados</span>
          <button
            type="button"
            className="pcf-selbar-btn pcf-selbar-danger"
            onClick={() => onDeletePaths(selectedPaths)}
          >
            Eliminar
          </button>
          <button
            type="button"
            className="pcf-selbar-btn"
            onClick={rows.selection.clear}
            aria-label="Limpiar selección"
            title="Limpiar selección (Esc)"
          >
            ×
          </button>
        </div>
      )}

      {showTree && (
        <div
          className="pcf-tree"
          role="tree"
          aria-label={ariaBase}
          aria-multiselectable="true"
          onClick={() => rows.selection.clear()}
          onKeyDown={onTreeKeyDown}
          onContextMenu={(e) => onContextMenu(e, null, true)}
          onDragOver={onDragOver}
          onDrop={onDropOnPane}
        >
          {confirms}
          {inlineCreate}

          {pane.loading && <div className="pcf-loading">Cargando…</div>}

          {!pane.loading && (
            <>
              {sortedDirs.map((d) => (
                <div
                  key={d.path}
                  onDragOver={onDragOver}
                  onDragEnter={(e) => onDragEnter(e, d.path)}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDropOnDir(e, d.path)}
                  className={dragOverPath === d.path ? "pcf-drop-target" : ""}
                >
                  <TreeFolder
                    entry={d}
                    depth={0}
                    touchNav={touchNav}
                    onEnterDir={pane.load}
                    query={query}
                    downloading={rows.downloading}
                    onDownload={rows.onDownload}
                    onOpenFile={rows.onOpenFile}
                    onOpenWith={rows.onOpenWith}
                    favorites={rows.favorites}
                    onFav={rows.onFav}
                    showNotice={rows.showNotice}
                    getFileGitStatus={rows.getFileGitStatus}
                    getFolderGitStatus={rows.getFolderGitStatus}
                    collapseSignal={collapseSignal}
                    onContextMenu={onContextMenu}
                    renamingPath={rows.renamingPath}
                    renamingValue={rows.renamingValue}
                    onRenamingChange={rows.onRenamingChange}
                    onRenameCommit={rows.onRenameCommit}
                    onRenameCancel={rows.onRenameCancel}
                    onStartRename={rows.onStartRename}
                    selectedPaths={selectedPaths}
                    onSelect={rows.onSelect}
                    getDragPayload={rows.getDragPayload}
                    cutPaths={rows.cutPaths}
                    deletingPaths={rows.deletingPaths}
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
                    downloading={rows.downloading}
                    onDownload={rows.onDownload}
                    onOpenFile={rows.onOpenFile}
                    onOpenWith={rows.onOpenWith}
                    isFav={rows.favorites.includes(f.path)}
                    onToggleFav={rows.onFav}
                    showNotice={rows.showNotice}
                    gitStatus={rows.getFileGitStatus(f.path)}
                    onContextMenu={onContextMenu}
                    renamingPath={rows.renamingPath}
                    renamingValue={rows.renamingValue}
                    onRenamingChange={rows.onRenamingChange}
                    onRenameCommit={rows.onRenameCommit}
                    onRenameCancel={rows.onRenameCancel}
                    onStartRename={rows.onStartRename}
                    selected={selectedPaths.includes(f.path)}
                    onSelect={rows.onSelect}
                    getDragPayload={rows.getDragPayload}
                    cut={rows.cutPaths.includes(f.path)}
                    deleting={rows.deletingPaths.includes(f.path)}
                  />
                ))}
                {sortedFiles.length === 0 && sortedDirs.length === 0 && !qLower && (
                  <div className="pcf-empty">Vacío</div>
                )}
                {sortedFiles.length === 0 && qLower && <div className="pcf-empty">Sin archivos</div>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
