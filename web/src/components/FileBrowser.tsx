import { memo, useState } from "react"
import { FolderIcon, CloseIcon, LoadingIcon, TerminalIcon } from "../Icons"
import { FileTypeIcon } from "./FileTypeIcon"
import { useT } from "../i18n-context"
import type { FileEntry, ServerConfig } from "../types"
import { api } from "../api"
import { shell } from "../shell"
import { Modal } from "./Modal"

const isExecScript = (path?: string) => {
  if (!path) return false
  const p = path.toLowerCase()
  return p.endsWith(".bat") || p.endsWith(".cmd") || p.endsWith(".vbs") || p.endsWith(".ps1") || p.endsWith(".exe") || p.endsWith(".sh")
}

type FileBrowserProps = {
  currentPath: string
  items: FileEntry[]
  loading: boolean
  error: string | null
  config?: ServerConfig
  directory?: string
  onClose: () => void
  onNavigate?: (path: string) => void
  onGoUp?: () => void
  onOpenFile?: (path: string) => void
}

function FileTreeItem({
  item,
  depth = 0,
  config,
  directory,
  onOpenFile,
  onExecFile,
}: {
  item: FileEntry
  depth?: number
  config?: ServerConfig
  directory?: string
  onOpenFile?: (path: string) => void
  onExecFile?: (item: FileEntry) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<FileEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isDir = item.type === "directory"

  const toggleExpand = async () => {
    if (!isDir) {
      onOpenFile?.(item.absolute)
      return
    }

    if (expanded) {
      setExpanded(false)
      return
    }

    setExpanded(true)
    if (children.length === 0) {
      setLoading(true)
      setError(null)
      try {
        if (typeof window !== "undefined" && (window as any).__OPENCODE_DESKTOP__) {
          try {
            const res = await shell.fs.list(item.absolute)
            const entries: FileEntry[] = [
              ...(res.dirs || []).map((d) => ({
                name: d.name,
                path: d.path,
                absolute: d.path,
                type: "directory" as const,
              })),
              ...(res.files || []).map((f) => ({
                name: f.name,
                path: f.path,
                absolute: f.path,
                type: "file" as const,
                size: f.size,
              })),
            ]
            setChildren(entries.sort((a, b) => {
              if (a.type !== b.type) return a.type === "directory" ? -1 : 1
              return a.name.localeCompare(b.name)
            }))
            setLoading(false)
            return
          } catch {
            // fallback a api
          }
        }

        if (config) {
          const res = await api.listFiles(config, item.path || item.name, directory)
          setChildren(res.sort((a, b) => {
            if (a.type !== b.type) return a.type === "directory" ? -1 : 1
            return a.name.localeCompare(b.name)
          }))
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="file-tree-node">
      <button
        type="button"
        className={`folder-row${isDir ? " is-directory" : " is-file"}${expanded ? " is-expanded" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={toggleExpand}
        onContextMenu={(e) => {
          if (!isDir && isExecScript(item.absolute || item.name)) {
            e.preventDefault()
            e.stopPropagation()
            onExecFile?.(item)
          }
        }}
        title={isDir ? item.name : `${item.absolute || item.name}${!isDir && isExecScript(item.name) ? " (Click derecho para ejecutar)" : ""}`}
      >
        <span
          className="folder-chevron"
          style={{
            width: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            color: "var(--muted)",
            flexShrink: 0,
            userSelect: "none"
          }}
        >
          {isDir ? (expanded ? "▼" : "▶") : ""}
        </span>
        {isDir ? (
          <FolderIcon size={15} />
        ) : (
          <FileTypeIcon name={item.name} size={15} />
        )}
        <span className="file-tree-name">{item.name}</span>
        {!isDir && isExecScript(item.name) && (
          <span style={{ fontSize: "0.65rem", padding: "1px 5px", borderRadius: "3px", background: "var(--primary-soft)", color: "var(--primary)", marginLeft: "auto" }}>
            script
          </span>
        )}
      </button>

      {isDir && expanded && (
        <div
          className="file-tree-children"
          style={{
            borderLeft: `1px solid var(--border-subtle, rgba(255,255,255,0.08))`,
            marginLeft: `${depth * 16 + 14}px`,
          }}
        >
          {loading && (
            <div style={{ padding: "4px 8px 4px 18px", color: "var(--muted)", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: 6 }}>
              <LoadingIcon size={12} />
              <span>Cargando...</span>
            </div>
          )}
          {error && (
            <div style={{ padding: "4px 8px 4px 18px", color: "var(--color-error)", fontSize: "0.75rem" }}>
              {error}
            </div>
          )}
          {!loading && !error && children.length === 0 && (
            <div style={{ padding: "4px 8px 4px 18px", color: "var(--muted)", fontSize: "0.75rem", fontStyle: "italic" }}>
              (vacío)
            </div>
          )}
          {!loading && children.map((child) => (
            <FileTreeItem
              key={child.absolute || child.path || child.name}
              item={child}
              depth={depth + 1}
              config={config}
              directory={directory}
              onOpenFile={onOpenFile}
              onExecFile={onExecFile}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const FileBrowser = memo(function FileBrowser({
  currentPath, items, loading, error, config, directory, onClose, onOpenFile
}: FileBrowserProps) {
  const t = useT()
  const [execConfirm, setExecConfirm] = useState<FileEntry | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [filter, setFilter] = useState("")

  const showNotice = (msg: string) => {
    setNotice(msg)
    window.setTimeout(() => setNotice((m) => (m === msg ? null : m)), 2500)
  }

  const filteredItems = filter
    ? items.filter((i) => i.name.toLowerCase().includes(filter.toLowerCase()))
    : items

  return (
    <Modal onClose={onClose} className="file-browser" aria-labelledby="file-browser-title">
      <div className="file-browser-header">
        <h2 id="file-browser-title">{t('sessions.projectDirectoryLabel')}</h2>
        <button className="btn-icon btn-ghost" onClick={onClose} aria-label={t('session.cancel')}>
          <CloseIcon size={16} />
        </button>
      </div>
      <div style={{ padding: "0 12px 8px" }}>
        <input
          type="search"
          className="search-input"
          placeholder="Buscar archivos por nombre..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{ width: "100%", padding: "6px 10px", fontSize: "0.85rem" }}
        />
      </div>
      <div className="file-browser-path" title={currentPath}>
        <span className="subtle">{currentPath || directory || "\u00a0"}</span>
        {notice && (
          <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--primary)" }}>{notice}</span>
        )}
      </div>
      <div className="folder-list">
        {loading ? (
          <div className="empty-state compact"><LoadingIcon size={28} /><p>{t('sessions.folderPickerLoading')}</p></div>
        ) : error ? (
          <p className="subtle" style={{ color: "var(--color-error)", padding: "12px" }}>{error}</p>
        ) : filteredItems.length === 0 ? (
          <p className="subtle" style={{ padding: "12px" }}>{filter ? "No se encontraron coincidencias" : t('sessions.folderPickerEmpty')}</p>
        ) : (
          filteredItems.map((item) => (
            <FileTreeItem
              key={item.absolute || item.path || item.name}
              item={item}
              depth={0}
              config={config}
              directory={directory}
              onOpenFile={onOpenFile}
              onExecFile={(it) => setExecConfirm(it)}
            />
          ))
        )}
      </div>

      {execConfirm && (
        <Modal onClose={() => setExecConfirm(null)} className="compact-modal" aria-labelledby="exec-confirm-title">
          <h2 id="exec-confirm-title" style={{ display: "flex", alignItems: "center", gap: 8, margin: 0, fontSize: "1.1rem" }}>
            <TerminalIcon size={18} /> Ejecutar archivo
          </h2>
          <p style={{ margin: "12px 0 6px", fontSize: "0.9rem" }}>
            ¿Estás seguro de que deseas ejecutar <strong>{execConfirm.name}</strong>?
          </p>
          <p className="subtle" style={{ wordBreak: "break-all", fontSize: "0.8rem", margin: "0 0 16px" }}>
            {execConfirm.absolute || execConfirm.path || execConfirm.name}
          </p>
          <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button type="button" className="btn-secondary compact" onClick={() => setExecConfirm(null)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn-primary compact"
              onClick={async () => {
                const target = execConfirm
                setExecConfirm(null)
                const fullPath = target.absolute || target.path || target.name
                try {
                  const res = await shell.fs.execFile(fullPath)
                  if (res.ok) {
                    showNotice(`Ejecutando: ${target.name}`)
                  } else {
                    showNotice(`Error al ejecutar archivo`)
                  }
                } catch (err: any) {
                  showNotice(`Error: ${err?.message || "al ejecutar"}`)
                }
              }}
            >
              <TerminalIcon size={14} /> Ejecutar
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  )
})
