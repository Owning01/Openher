// Paneles de la shell para el grid de escritorio: terminal, explorador,
// kanban, docs, updates, stats, labs y config. Todos hablan con /shell/*.

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebglAddon } from "@xterm/addon-webgl"
import "@xterm/xterm/css/xterm.css"
import { FolderIcon, RefreshIcon, TerminalIcon, PlusIcon, SplitIcon, MoreHorizontalIcon, TrashIcon, ChevronDownIcon } from "../Icons"
import { b64decode, fileIcon, KANBAN_COLORS, shell, type FsEntry, type KanbanBoard, type ShellPanelKind } from "../shell"
import { useT } from "../i18n-context"
import { Markdown } from "./Markdown"

// ============================================================== Terminal

// ============================================================== Terminal (Multi-Pestaña)

const SingleTerminal = memo(function SingleTerminal({ cwd, shellName }: { cwd?: string; shellName?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const term = new Terminal({
      fontFamily: "Consolas, 'Cascadia Mono', monospace",
      fontSize: 13,
      cursorBlink: true,
      scrollback: 5000,
      theme: {
        background: "#0d1117",
        foreground: "#e6edf3",
        cursor: "#58a6ff",
        selectionBackground: "#264f78",
      },
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(el)

    // Renderer WebGL (aceleración directa por GPU de xterm al estilo Terax)
    try {
      const webgl = new WebglAddon()
      webgl.onContextLoss(() => webgl.dispose())
      term.loadAddon(webgl)
    } catch {
      /* renderer DOM por defecto si no hay soporte WebGL */
    }

    term.attachCustomKeyEventHandler((e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && term.hasSelection()) {
        if (e.type === "keydown") {
          navigator.clipboard.writeText(term.getSelection())
        }
        return false
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && e.type === "keydown") {
        navigator.clipboard.readText().then((text) => {
          if (text) term.paste(text)
        }).catch(() => {})
        return false
      }
      return true
    })

    try {
      fit.fit()
    } catch {
      /* ignore */
    }

    let disposed = false
    let ws: WebSocket | null = null
    let ptyId = ""
    let pollTimer = 0
    let since = 0
    let polling = false

    const sendResize = () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ cmd: "resize", cols: term.cols, rows: term.rows }))
      }
    }

    // Fallback a polling si el WebSocket no está disponible (server viejo).
    const poll = async () => {
      if (disposed || !ptyId || !polling) return
      try {
        const r = await shell.pty.poll(ptyId, since)
        if (!disposed && r.data) {
          since = r.len
          term.write(b64decode(r.data))
        }
      } catch {
        /* ignore */
      }
      if (!disposed && polling) pollTimer = window.setTimeout(poll, 250)
    }

    const onData = term.onData((d) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ cmd: "input", data: d }))
      } else if (ptyId) {
        shell.pty.write(ptyId, d).catch(() => {})
      }
    })

    shell.pty.create(cwd, shellName).then((res) => {
      if (disposed) {
        shell.pty.kill(res.id)
        return
      }
      ptyId = res.id
      try {
        const wsProto = window.location.protocol === "https:" ? "wss:" : "ws:"
        const wsHost = window.location.hostname || "localhost"
        ws = new WebSocket(`${wsProto}//${wsHost}:${res.ws_port}`)
        ws.binaryType = "arraybuffer"
        ws.onopen = () => {
          sendResize()
        }
        ws.onmessage = (e) => {
          if (!disposed && e.data instanceof ArrayBuffer) {
            term.write(new Uint8Array(e.data))
          }
        }
        ws.onerror = () => {
          polling = true
          poll()
        }
        ws.onclose = () => {
          if (!disposed) {
            polling = true
            poll()
          }
        }
      } catch {
        polling = true
        poll()
      }
    })

    let resizeTimer = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        if (disposed) return
        try {
          fit.fit()
          sendResize()
        } catch {
          /* ignore */
        }
      }, 30)
    })
    ro.observe(el)
    window.setTimeout(() => {
      try {
        fit.fit()
        sendResize()
      } catch {
        /* ignore */
      }
    }, 150)

    return () => {
      disposed = true
      window.clearTimeout(pollTimer)
      window.clearTimeout(resizeTimer)
      ro.disconnect()
      onData.dispose()
      try {
        ws?.close()
      } catch {
        /* ignore */
      }
      if (ptyId) shell.pty.kill(ptyId)
      term.dispose()
    }
  }, [cwd, shellName])

  return <div ref={ref} style={{ width: "100%", height: "100%", background: "#0d1117", padding: 6 }} />
})

export const TerminalPanel = memo(function TerminalPanel({ cwd, shellName, hideHeader = false }: { cwd?: string; shellName?: string; hideHeader?: boolean }) {
  const [activeMainTab, setActiveMainTab] = useState<"problems" | "output" | "debug" | "terminal" | "ports">("terminal")
  const [termTabs, setTermTabs] = useState<Array<{ id: string; title: string }>>([
    { id: "term-1", title: "pwsh" },
  ])
  const [activeTabId, setActiveTabId] = useState<string>("term-1")
  const [currentShell, setCurrentShell] = useState<string>(shellName || "pwsh")

  const handleAddTab = () => {
    const nextNum = termTabs.length + 1
    const newId = `term-${Date.now()}`
    setTermTabs((prev) => [...prev, { id: newId, title: `${currentShell} ${nextNum}` }])
    setActiveTabId(newId)
  }

  const handleCloseTab = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (termTabs.length <= 1) return
    const nextTabs = termTabs.filter((t) => t.id !== id)
    setTermTabs(nextTabs)
    if (activeTabId === id) {
      setActiveTabId(nextTabs[nextTabs.length - 1].id)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", background: "#0d1117" }}>
      {/* Barra superior estilo VS Code con drag & drop */}
      {!hideHeader && (
        <div className="terminal-header-bar"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", "kind:terminal")
            e.dataTransfer.effectAllowed = "move"
          }}
        >
        <div className="terminal-tabs-group">
          <div className={`terminal-tab${activeMainTab === "problems" ? " active" : ""}`} onClick={() => setActiveMainTab("problems")}>
            <span>PROBLEMS</span>
          </div>
          <div className={`terminal-tab${activeMainTab === "output" ? " active" : ""}`} onClick={() => setActiveMainTab("output")}>
            <span>OUTPUT</span>
          </div>
          <div className={`terminal-tab${activeMainTab === "debug" ? " active" : ""}`} onClick={() => setActiveMainTab("debug")}>
            <span>DEBUG CONSOLE</span>
          </div>
          <div className={`terminal-tab${activeMainTab === "terminal" ? " active" : ""}`} onClick={() => setActiveMainTab("terminal")}>
            <span className="terminal-status-dot" />
            <span>TERMINAL</span>
          </div>
          <div className={`terminal-tab${activeMainTab === "ports" ? " active" : ""}`} onClick={() => setActiveMainTab("ports")}>
            <span>PORTS</span>
          </div>
        </div>

        <div className="terminal-actions-group">
          <div className="terminal-shell-picker">
            <span className="terminal-tab-icon" style={{ marginRight: 4 }}><TerminalIcon size={12} /></span>
            <select
              value={currentShell}
              onChange={(e) => setCurrentShell(e.target.value)}
              className="terminal-shell-select"
              title="Seleccionar shell"
            >
              <option value="pwsh">pwsh</option>
              <option value="powershell">powershell</option>
              <option value="cmd">cmd</option>
              <option value="bash">bash</option>
              <option value="wsl">wsl</option>
            </select>
          </div>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={handleAddTab}
            title="Nueva terminal"
            aria-label="Nueva terminal"
          >
            <PlusIcon size={13} />
            <span style={{ marginLeft: 1 }}><ChevronDownIcon size={10} /></span>
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={handleAddTab}
            title="Dividir terminal"
            aria-label="Dividir terminal"
          >
            <SplitIcon size={13} />
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            onClick={() => handleCloseTab(activeTabId)}
            title="Eliminar terminal"
            aria-label="Eliminar terminal"
          >
            <TrashIcon size={13} />
          </button>

          <button
            type="button"
            className="terminal-action-btn"
            title="Más acciones..."
            aria-label="Más acciones"
          >
            <MoreHorizontalIcon size={13} />
          </button>
        </div>
      </div>
      )}

      {/* Contenedor de la terminal activa */}
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
        {activeMainTab === "terminal" ? (
          termTabs.map((tab) => (
            <div
              key={tab.id}
              style={{
                position: "absolute",
                inset: 0,
                display: tab.id === activeTabId ? "block" : "none",
              }}
            >
              {tab.id === activeTabId && <SingleTerminal cwd={cwd} shellName={currentShell} />}
            </div>
          ))
        ) : (
          <div style={{ padding: "16px", color: "#8b949e", fontSize: "12px", fontFamily: "monospace" }}>
            No hay elementos en la vista {activeMainTab.toUpperCase()}.
          </div>
        )}
      </div>
    </div>
  )
})

// ============================================================== Explorador

let clipboardItem: { path: string; name: string; isDir: boolean } | null = null

export const ExplorerPanel = memo(function ExplorerPanel({
  onOpenSessionDir,
  initialCwd,
  onOpenFile,
}: {
  onOpenSessionDir: (dir: string) => void
  initialCwd?: string | null
  onOpenFile?: (path: string) => void
}) {
  const t = useT()
  const [drives, setDrives] = useState<string[]>([])
  const [showDrives, setShowDrives] = useState(false)
  const [cwd, setCwd] = useState<string | null>(initialCwd || null)
  const [dirs, setDirs] = useState<FsEntry[]>([])
  const [files, setFiles] = useState<FsEntry[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [preview, setPreview] = useState<{ path: string; content: string; ext: string; truncated: boolean } | null>(null)
  const [history, setHistory] = useState<string[]>([])
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; entry: FsEntry | null; isDir: boolean } | null>(null)
  const [copied, setCopied] = useState<typeof clipboardItem>(clipboardItem)
  const [dragOverTree, setDragOverTree] = useState(false)
  const [actionNotice, setActionNotice] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const showNotice = (msg: string) => {
    setActionNotice(msg)
    window.setTimeout(() => setActionNotice((m) => (m === msg ? null : m)), 2500)
  }

  const load = useCallback(async (path: string) => {
    if (!path) return
    setCwd(path)
    setPreview(null)
    try {
      const r = await shell.fs.list(path)
      setDirs(r.dirs || [])
      setFiles(r.files || [])
    } catch {
      setDirs([])
      setFiles([])
    }
  }, [])

  // Auto-cargar la sesión cuando cambia o se define initialCwd
  useEffect(() => {
    if (initialCwd) {
      load(initialCwd)
    } else {
      shell.fs.drives().then(({ drives }) => {
        setDrives(drives)
        if (drives.length > 0) load(drives[0])
      }).catch(() => {})
    }
  }, [initialCwd, load])

  useEffect(() => {
    if (showDrives && drives.length === 0) {
      shell.fs.drives().then(({ drives }) => {
        setDrives(drives)
        shell.fs.favorites().then(({ favorites }) => setFavorites(favorites))
      }).catch(() => {})
    }
  }, [showDrives, drives.length])

  // Cerrar menú contextual al hacer clic fuera
  useEffect(() => {
    if (!contextMenu) return
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenu(null)
      }
    }
    window.addEventListener("pointerdown", onDocClick)
    return () => window.removeEventListener("pointerdown", onDocClick)
  }, [contextMenu])

  const nav = (path: string) => {
    setHistory((h) => [...h, cwd ?? ""])
    load(path)
  }
  const back = () => {
    const prev = history[history.length - 1]
    if (prev) {
      setHistory((h) => h.slice(0, -1))
      load(prev)
    } else if (initialCwd && cwd !== initialCwd) {
      load(initialCwd)
    }
  }
  const fav = (path: string, add: boolean) => {
    shell.fs.toggleFavorite(path, add).then(() => shell.fs.favorites().then(({ favorites }) => setFavorites(favorites)))
  }

  const openFile = async (path: string) => {
    if (onOpenFile) {
      onOpenFile(path)
      return
    }
    const r = await shell.fs.read(path)
    setPreview({ path: r.path, content: r.content, ext: r.ext, truncated: r.truncated })
  }

  const handleContextMenu = (e: React.MouseEvent, entry: FsEntry | null, isDir: boolean) => {
    e.preventDefault()
    e.stopPropagation()
    const menuW = 210
    const menuH = 260
    const x = e.clientX + menuW > window.innerWidth ? Math.max(10, e.clientX - menuW) : e.clientX
    const y = e.clientY + menuH > window.innerHeight ? Math.max(10, e.clientY - menuH) : e.clientY
    setContextMenu({ x, y, entry, isDir })
  }

  const copyRelativePath = (path: string) => {
    const base = initialCwd || cwd || ""
    const rel = base && path.startsWith(base) ? path.slice(base.length).replace(/^[/\\]+/, "") : path
    navigator.clipboard.writeText(rel)
    setContextMenu(null)
    showNotice(`Ruta relativa copiada: ${rel}`)
  }

  const copyFullPath = (path: string) => {
    navigator.clipboard.writeText(path)
    setContextMenu(null)
    showNotice(`Ruta completa copiada`)
  }

  const handleCopyItem = (entry: FsEntry, isDir: boolean) => {
    clipboardItem = { path: entry.path, name: entry.name, isDir }
    setCopied(clipboardItem)
    setContextMenu(null)
    showNotice(`Copiado: ${entry.name}`)
  }

  const handlePasteItem = async (destDir: string) => {
    if (!copied) return
    setContextMenu(null)
    try {
      await shell.fs.copy(copied.path, destDir)
      showNotice(`Pegado en ${destDir.split(/[/\\]/).pop() || destDir}`)
      if (cwd) load(cwd)
    } catch {
      showNotice(`Error al pegar archivo`)
    }
  }

  const handleDeleteItem = async (entry: FsEntry) => {
    setContextMenu(null)
    if (!window.confirm(`¿Eliminar definitivamente "${entry.name}"?`)) return
    try {
      await shell.fs.delete(entry.path)
      showNotice(`Eliminado: ${entry.name}`)
      if (cwd) load(cwd)
    } catch {
      showNotice(`Error al eliminar`)
    }
  }

  const handleDropExternal = async (e: React.DragEvent, targetDir: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverTree(false)
    const filesList = e.dataTransfer.files
    if (!filesList || filesList.length === 0) return

    let count = 0
    for (const f of Array.from(filesList)) {
      try {
        const reader = new FileReader()
        const b64 = await new Promise<string>((res, rej) => {
          reader.onload = () => {
            const dataUrl = reader.result as string
            const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl
            res(base64)
          }
          reader.onerror = rej
          reader.readAsDataURL(f)
        })
        const sep = targetDir.includes("\\") ? "\\" : "/"
        const targetPath = `${targetDir}${targetDir.endsWith(sep) ? "" : sep}${f.name}`
        await shell.fs.write(targetPath, b64)
        count++
      } catch {
        /* ignore */
      }
    }
    showNotice(`Añadido(s) ${count} archivo(s) a la carpeta`)
    if (cwd) load(cwd)
  }

  const handleCreateFile = async (parentDir: string) => {
    setContextMenu(null)
    const name = window.prompt("Nombre del nuevo archivo (ej: app.ts):")
    if (!name || !name.trim()) return
    const sep = parentDir.includes("\\") ? "\\" : "/"
    const fullPath = `${parentDir}${parentDir.endsWith(sep) ? "" : sep}${name.trim()}`
    try {
      await shell.fs.write(fullPath, "")
      showNotice(`Archivo creado: ${name}`)
      if (cwd) load(cwd)
      if (onOpenFile) onOpenFile(fullPath)
    } catch {
      showNotice("Error al crear archivo")
    }
  }

  const handleCreateFolder = async (parentDir: string) => {
    setContextMenu(null)
    const name = window.prompt("Nombre de la nueva carpeta:")
    if (!name || !name.trim()) return
    const sep = parentDir.includes("\\") ? "\\" : "/"
    const fullPath = `${parentDir}${parentDir.endsWith(sep) ? "" : sep}${name.trim()}`
    try {
      await shell.fs.mkdir(fullPath)
      showNotice(`Carpeta creada: ${name}`)
      if (cwd) load(cwd)
    } catch {
      showNotice("Error al crear carpeta")
    }
  }

  const projName = initialCwd ? (initialCwd.split(/[/\\]/).filter(Boolean).pop() || initialCwd) : null

  return (
    <div
      className={`shell-explorer${dragOverTree ? " is-drag-over" : ""}`}
      onContextMenu={(e) => handleContextMenu(e, null, true)}
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setDragOverTree(true) }}
      onDragLeave={() => setDragOverTree(false)}
      onDrop={(e) => handleDropExternal(e, cwd || initialCwd || "")}
    >
      <div className="shell-explorer-top">
        <button className="btn-icon compact" onClick={back} title={t('shell.back')} aria-label={t('shell.back')}>←</button>
        <span className="shell-path" title={cwd ?? ""}>
          {projName && cwd?.startsWith(initialCwd!) ? (
            cwd === initialCwd ? `📁 ${projName}` : `📁 ${projName}/${cwd.slice(initialCwd!.length).replace(/^[/\\]+/, "")}`
          ) : (cwd ?? "…")}
        </span>
        <button type="button" className="btn-icon compact" onClick={() => handleCreateFile(cwd || initialCwd || "")} title="Nuevo archivo">
          +📄
        </button>
        <button type="button" className="btn-icon compact" onClick={() => handleCreateFolder(cwd || initialCwd || "")} title="Nueva carpeta">
          +📁
        </button>
        <button type="button" className="btn-icon compact" onClick={() => load(cwd || initialCwd || "")} title="Recargar archivos">
          ↻
        </button>
        {copied && cwd && (
          <button type="button" className="btn-icon compact" onClick={() => handlePasteItem(cwd)} title={`Pegar "${copied.name}" aquí`}>
            📋
          </button>
        )}
        {initialCwd && (
          <button type="button" className="btn-icon compact" onClick={() => setShowDrives(!showDrives)} title={showDrives ? "Ocultar unidades de disco" : "Ver discos del sistema"}>
            💾
          </button>
        )}
      </div>
      {actionNotice && (
        <div style={{ padding: "4px 8px", fontSize: "0.75rem", background: "var(--primary-soft)", color: "var(--primary)", borderBottom: "1px solid var(--border)" }}>
          {actionNotice}
        </div>
      )}
      {showDrives && (
        <div className="shell-drives">
          {initialCwd && (
            <button type="button" className={`shell-drive${cwd === initialCwd ? " active" : ""}`} onClick={() => load(initialCwd)} title={initialCwd}>
              📁 Proyecto ({projName})
            </button>
          )}
          {drives.map((d) => (
            <button key={d} type="button" className={`shell-drive${cwd === d ? " active" : ""}`} onClick={() => load(d)}>{d}</button>
          ))}
        </div>
      )}
      <div className="shell-tree">
        {showDrives && favorites.length > 0 && (
          <div className="shell-tree-group">
            <div className="shell-tree-title">Favoritos</div>
            {favorites.map((f) => (
              <div key={f} className="shell-row" onDoubleClick={() => load(f)}>
                <FolderIcon size={13} className="shell-glyph" />
                <span className="shell-name">{f}</span>
                <button className="btn-icon compact" title={t('shell.removeFav')} onClick={() => fav(f, false)}>×</button>
              </div>
            ))}
          </div>
        )}
        {dirs.map((d) => (
          <div
            key={d.path}
            className="shell-row shell-dir"
            onClick={() => nav(d.path)}
            onDoubleClick={() => fav(d.path, true)}
            onContextMenu={(e) => handleContextMenu(e, d, true)}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "copy" }}
            onDrop={(e) => handleDropExternal(e, d.path)}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", d.path)
              e.dataTransfer.setData("application/x-opencode-path", d.path)
              e.dataTransfer.setData("application/x-opencode-is-image", "0")
            }}
          >
            <FolderIcon size={13} className="shell-glyph" />
            <span className="shell-name">{d.name}</span>
            {cwd && (
              <button className="btn-icon compact shell-star" title={t('shell.fav')} onClick={(e) => { e.stopPropagation(); fav(d.path, true) }}>☆</button>
            )}
          </div>
        ))}
        {files.map((f) => {
          const ic = fileIcon(f.name, false)
          const isImg = /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(f.name)
          return (
            <div
              key={f.path}
              className="shell-row shell-file"
              onClick={() => openFile(f.path)}
              onContextMenu={(e) => handleContextMenu(e, f, false)}
              draggable={true}
              onDragStart={(e) => {
                e.dataTransfer.setData("text/plain", f.path)
                e.dataTransfer.setData("application/x-opencode-path", f.path)
                e.dataTransfer.setData("application/x-opencode-is-image", isImg ? "1" : "0")
              }}
            >
              <span className="shell-glyph" style={{ color: ic.color }}>{ic.glyph}</span>
              <span className="shell-name">{f.name}</span>
              <span className="shell-size">{f.size != null ? (f.size > 1024 * 1024 ? `${(f.size / 1048576).toFixed(1)}M` : f.size > 1024 ? `${(f.size / 1024).toFixed(0)}K` : `${f.size}B`) : ""}</span>
            </div>
          )
        })}
        {dirs.length === 0 && files.length === 0 && <div className="shell-empty">{t('shell.empty')}</div>}
      </div>

      {/* Menú Contextual (Click Derecho) */}
      {contextMenu && (
        <div
          ref={menuRef}
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
            minWidth: "190px",
            maxHeight: "calc(100vh - 40px)",
            overflowY: "auto",
          }}
        >
          {contextMenu.entry && (
            <>
              <button
                type="button"
                className="overflow-item"
                onClick={() => (contextMenu.isDir ? nav(contextMenu.entry!.path) : openFile(contextMenu.entry!.path))}
              >
                <span>📂</span> {contextMenu.isDir ? "Abrir carpeta" : "Abrir archivo"}
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => copyRelativePath(contextMenu.entry!.path)}
              >
                <span>🔗</span> Obtener ruta relativa
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => copyFullPath(contextMenu.entry!.path)}
              >
                <span>📋</span> Obtener ruta completa
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => handleCreateFile(contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : cwd || initialCwd || "")}
              >
                <span>📄</span> Nuevo archivo
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => handleCreateFolder(contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : cwd || initialCwd || "")}
              >
                <span>📁</span> Nueva carpeta
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => handleCopyItem(contextMenu.entry!, contextMenu.isDir)}
              >
                <span>📋</span> Copiar {contextMenu.isDir ? "carpeta" : "archivo"}
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => {
                  const p = contextMenu.entry!.path
                  setContextMenu(null)
                  shell.fs.reveal(p).then((r) => {
                    if (r.ok) showNotice(`Abierto en el Explorador`)
                  }).catch(() => showNotice(`No se pudo abrir el Explorador`))
                }}
              >
                <span>🖥️</span> Abrir en el Explorador
              </button>
              <button
                type="button"
                className="overflow-item"
                style={{ color: "var(--danger)" }}
                onClick={() => handleDeleteItem(contextMenu.entry!)}
              >
                <span>🗑️</span> Eliminar
              </button>
            </>
          )}
          {!contextMenu.entry && (
            <>
              <button
                type="button"
                className="overflow-item"
                onClick={() => handleCreateFile(cwd || initialCwd || "")}
              >
                <span>📄</span> Nuevo archivo aquí
              </button>
              <button
                type="button"
                className="overflow-item"
                onClick={() => handleCreateFolder(cwd || initialCwd || "")}
              >
                <span>📁</span> Nueva carpeta aquí
              </button>
            </>
          )}
          {copied && (
            <button
              type="button"
              className="overflow-item"
              onClick={() => handlePasteItem(contextMenu.entry && contextMenu.isDir ? contextMenu.entry.path : cwd || initialCwd || "")}
            >
              <span>📥</span> Pegar "{copied.name}"
            </button>
          )}
        </div>
      )}

      {preview && (
        <div className="shell-preview">
          <div className="shell-preview-head">
            <span className="shell-preview-name">{preview.path}</span>
            {cwd && <button className="btn-secondary compact" onClick={() => onOpenSessionDir(cwd)}>{t('shell.openSession')}</button>}
            <button className="btn-icon compact" onClick={() => setPreview(null)}>×</button>
          </div>
          <pre className="shell-preview-body">{preview.content}{preview.truncated ? "\n…" : ""}</pre>
        </div>
      )}
    </div>
  )
})

// ============================================================== Editor de Archivos Multi-Pestaña

export const FileEditorPanel = memo(function FileEditorPanel({
  path: initialPath,
  openPaths,
  onClose,
  initialCwd,
  onSelectFile,
}: {
  path: string
  openPaths?: string[]
  onClose?: () => void
  initialCwd?: string
  onSelectFile?: (path: string) => void
}) {
  const [tabs, setTabs] = useState<string[]>(() => {
    if (openPaths && openPaths.length > 0) {
      return openPaths.includes(initialPath) ? openPaths : [...openPaths, initialPath]
    }
    return initialPath ? [initialPath] : []
  })
  const [activeTab, setActiveTab] = useState<string>(initialPath || "")
  const [filesState, setFilesState] = useState<Record<string, { content: string; dirty: boolean; loading: boolean; error: string | null }>>({})
  const [saving, setSaving] = useState(false)
  const [mdViewMode, setMdViewMode] = useState<"edit" | "preview" | "split">("split")

  const isMarkdown = /\.(md|markdown|mdown|mkd)$/i.test(activeTab)

  // Si cambia la prop inicial desde fuera (ej: clic en otro archivo)
  useEffect(() => {
    if (!initialPath) return
    setTabs((prev) => (prev.includes(initialPath) ? prev : [...prev, initialPath]))
    setActiveTab(initialPath)
  }, [initialPath])

  // Cargar contenido de la pestaña activa si no fue cargada aún
  useEffect(() => {
    if (!activeTab) return
    let cancelled = false
    setFilesState((prev) => {
      if (prev[activeTab] && (prev[activeTab].content || prev[activeTab].error)) return prev
      return {
        ...prev,
        [activeTab]: { content: "", dirty: false, loading: true, error: null },
      }
    })

    shell.fs.read(activeTab).then((r) => {
      if (cancelled) return
      setFilesState((prev) => ({
        ...prev,
        [activeTab]: { content: r.content, dirty: false, loading: false, error: null },
      }))
    }).catch((err) => {
      if (cancelled) return
      setFilesState((prev) => ({
        ...prev,
        [activeTab]: { content: "", dirty: false, loading: false, error: err instanceof Error ? err.message : "Error al abrir archivo" },
      }))
    })

    return () => {
      cancelled = true
    }
  }, [activeTab])

  const activeFile = filesState[activeTab]

  const handleSave = async () => {
    if (!activeTab || !activeFile || saving) return
    setSaving(true)
    try {
      const b64 = btoa(unescape(encodeURIComponent(activeFile.content)))
      await shell.fs.write(activeTab, b64)
      setFilesState((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], dirty: false },
      }))
    } catch {
      setFilesState((prev) => ({
        ...prev,
        [activeTab]: { ...prev[activeTab], error: "Error al guardar archivo" },
      }))
    } finally {
      setSaving(false)
    }
  }

  const handleCloseTab = (tabToClose: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const nextTabs = tabs.filter((t) => t !== tabToClose)
    setTabs(nextTabs)
    if (nextTabs.length === 0) {
      if (onClose) onClose()
    } else if (activeTab === tabToClose) {
      const idx = tabs.indexOf(tabToClose)
      const newActive = nextTabs[Math.max(0, idx - 1)]
      setActiveTab(newActive)
      if (onSelectFile) onSelectFile(newActive)
    }
  }

  const handleSelectTab = (tabPath: string) => {
    setActiveTab(tabPath)
    if (onSelectFile) onSelectFile(tabPath)
  }

  if (tabs.length === 0) {
    return null
  }

  const relPath = initialCwd && activeTab.startsWith(initialCwd) ? activeTab.slice(initialCwd.length).replace(/^[/\\]+/, "") : activeTab
  const lineCount = activeFile?.content ? activeFile.content.split("\n").length : 0
  const charCount = activeFile?.content ? activeFile.content.length : 0
  const ext = (activeTab.split(".").pop() || "").toLowerCase()

  return (
    <div className="file-editor-panel" style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)" }}>
      {/* Barra de pestañas tipo VS Code */}
      <div className="file-editor-tab-bar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px", borderBottom: "1px solid var(--border)", background: "var(--surface-subtle)", overflowX: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2px", minWidth: 0 }}>
          {tabs.map((tab) => {
            const name = tab.split(/[/\\]/).pop() || tab
            const isActive = tab === activeTab
            const isDirty = filesState[tab]?.dirty
            const ic = fileIcon(name, false)
            return (
              <div
                key={tab}
                onClick={() => handleSelectTab(tab)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 10px",
                  cursor: "pointer",
                  fontSize: "0.82rem",
                  background: isActive ? "var(--surface)" : "transparent",
                  borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                  borderRight: "1px solid var(--border-subtle)",
                  color: isActive ? "var(--text)" : "var(--muted)",
                  fontWeight: isActive ? 600 : 400,
                  maxWidth: "180px",
                  minWidth: "80px",
                }}
              >
                <span style={{ color: ic.color, fontSize: "0.9rem" }}>{ic.glyph}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{name}</span>
                {isDirty && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--primary)" }} title="Cambios sin guardar" />}
                <button
                  type="button"
                  className="btn-icon compact"
                  onClick={(e) => handleCloseTab(tab, e)}
                  title="Cerrar pestaña"
                  style={{ padding: "0 3px", fontSize: "11px", opacity: 0.7 }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 6px" }}>
          {isMarkdown && (
            <div style={{ display: "inline-flex", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
              <button
                type="button"
                className={`btn-icon compact${mdViewMode === "edit" ? " active" : ""}`}
                style={{ borderRadius: 0, padding: "2px 6px", fontSize: "12px", border: "none", background: mdViewMode === "edit" ? "var(--primary-soft)" : "transparent", color: mdViewMode === "edit" ? "var(--primary)" : "var(--muted)" }}
                onClick={() => setMdViewMode("edit")}
                title="Editor de código"
              >
                ✏️ Editar
              </button>
              <button
                type="button"
                className={`btn-icon compact${mdViewMode === "split" ? " active" : ""}`}
                style={{ borderRadius: 0, padding: "2px 6px", fontSize: "12px", borderLeft: "1px solid var(--border)", borderRight: "1px solid var(--border)", borderTop: "none", borderBottom: "none", background: mdViewMode === "split" ? "var(--primary-soft)" : "transparent", color: mdViewMode === "split" ? "var(--primary)" : "var(--muted)" }}
                onClick={() => setMdViewMode("split")}
                title="Vista dividida (Editor + Vista previa)"
              >
                ◫ Dividido
              </button>
              <button
                type="button"
                className={`btn-icon compact${mdViewMode === "preview" ? " active" : ""}`}
                style={{ borderRadius: 0, padding: "2px 6px", fontSize: "12px", border: "none", background: mdViewMode === "preview" ? "var(--primary-soft)" : "transparent", color: mdViewMode === "preview" ? "var(--primary)" : "var(--muted)" }}
                onClick={() => setMdViewMode("preview")}
                title="Vista previa renderizada"
              >
                👁️ Vista previa
              </button>
            </div>
          )}
          {activeFile?.dirty && (
            <button type="button" className="btn-primary compact" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          )}
          {onClose && (
            <button type="button" className="btn-icon compact" onClick={onClose} title="Cerrar panel de editor">
              ×
            </button>
          )}
        </div>
      </div>

      {/* Barra de información del archivo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2px 10px", fontSize: "0.72rem", color: "var(--muted)", borderBottom: "1px solid var(--border-subtle)", background: "var(--surface)" }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{relPath}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
          {ext && <span style={{ textTransform: "uppercase", fontWeight: 700, color: "var(--primary)" }}>{ext}</span>}
          <span>{lineCount} líneas</span>
          <span>{charCount} caracs</span>
          <kbd style={{ fontSize: "0.68rem", opacity: 0.8 }}>Ctrl+S</kbd>
        </div>
      </div>

      {/* Cuerpo del editor de código / Markdown */}
      <div style={{ flex: 1, position: "relative", minHeight: 0, display: "flex" }}>
        {activeFile?.loading ? (
          <div style={{ padding: 16, color: "var(--muted)" }}>Cargando archivo...</div>
        ) : activeFile?.error ? (
          <div style={{ padding: 16, color: "var(--danger)" }}>{activeFile.error}</div>
        ) : isMarkdown && mdViewMode === "preview" ? (
          <div className="markdown-body message-content" style={{ flex: 1, padding: "16px 24px", overflowY: "auto", background: "var(--surface)" }}>
            <Markdown text={activeFile?.content ?? ""} />
          </div>
        ) : isMarkdown && mdViewMode === "split" ? (
          <div style={{ flex: 1, display: "flex", minHeight: 0, width: "100%" }}>
            <div style={{ flex: 1, minWidth: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
              <textarea
                style={{
                  width: "100%",
                  height: "100%",
                  boxSizing: "border-box",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontFamily: "Consolas, 'Cascadia Mono', monospace",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  padding: "10px",
                  tabSize: 2,
                }}
                value={activeFile?.content ?? ""}
                onChange={(e) => {
                  const val = e.target.value
                  setFilesState((prev) => ({
                    ...prev,
                    [activeTab]: { ...(prev[activeTab] || { loading: false, error: null }), content: val, dirty: true },
                  }))
                }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                    e.preventDefault()
                    handleSave()
                  }
                }}
                spellCheck={false}
              />
            </div>
            <div className="markdown-body message-content" style={{ flex: 1, minWidth: 0, padding: "16px 20px", overflowY: "auto", background: "var(--surface-subtle)" }}>
              <Markdown text={activeFile?.content ?? ""} />
            </div>
          </div>
        ) : (
          <textarea
            style={{
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
              border: "none",
              outline: "none",
              resize: "none",
              background: "var(--surface)",
              color: "var(--text)",
              fontFamily: "Consolas, 'Cascadia Mono', monospace",
              fontSize: "13px",
              lineHeight: 1.5,
              padding: "10px",
              tabSize: 2,
            }}
            value={activeFile?.content ?? ""}
            onChange={(e) => {
              const val = e.target.value
              setFilesState((prev) => ({
                ...prev,
                [activeTab]: { ...(prev[activeTab] || { loading: false, error: null }), content: val, dirty: true },
              }))
            }}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                e.preventDefault()
                handleSave()
              }
            }}
            spellCheck={false}
          />
        )}
      </div>
    </div>
  )
})

// ============================================================== Kanban

export const KanbanPanel = memo(function KanbanPanel() {
  const t = useT()
  const [boards, setBoards] = useState<KanbanBoard[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [drag, setDrag] = useState<string | null>(null)

  const load = useCallback(() => {
    shell.kanban.all().then(({ boards }) => {
      setBoards(boards)
      setActive((a) => (a && boards.some((b) => b.id === a) ? a : boards[0]?.id ?? null))
    })
  }, [])
  useEffect(load, [load])

  const board = boards.find((b) => b.id === active) ?? null
  const addCard = async (column: string) => {
    if (!board) return
    const title = window.prompt(t('shell.cardTitle'))
    if (title) {
      const color = KANBAN_COLORS[Math.floor(Math.random() * KANBAN_COLORS.length)]
      await shell.kanban.addCard(board.id, column, title, "", color)
      load()
    }
  }
  const drop = async (column: string) => {
    if (drag) {
      await shell.kanban.updateCard(drag, { column })
      setDrag(null)
      load()
    }
  }
  const delCard = async (cardId: string) => {
    await shell.kanban.delCard(cardId)
    load()
  }
  const addBoard = async () => {
    const name = window.prompt(t('shell.boardName'))
    if (name) {
      await shell.kanban.addBoard(name)
      load()
    }
  }

  if (!board) {
    return (
      <div className="shell-kanban-empty">
        <p>{t('shell.noBoards')}</p>
        <button className="btn-primary" onClick={addBoard}>{t('shell.newBoard')}</button>
      </div>
    )
  }

  return (
    <div className="shell-kanban">
      <div className="shell-kanban-head">
        <select value={active ?? ""} onChange={(e) => setActive(e.target.value)}>
          {boards.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <button className="btn-secondary compact" onClick={addBoard}>{t('shell.newBoard')}</button>
        <button className="btn-icon compact" title={t('shell.deleteBoard')} onClick={() => { if (board && window.confirm(t('shell.deleteBoard'))) shell.kanban.delBoard(board.id).then(load) }}>×</button>
      </div>
      <div className="shell-kanban-cols">
        {board.columns.map((col) => (
          <div key={col.id} className="shell-kanban-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => drop(col.id)}>
            <div className="shell-kanban-col-title">{col.title}</div>
            <div className="shell-kanban-cards">
              {board.cards.filter((c) => c.column === col.id).map((c) => (
                <div key={c.id} className="shell-kanban-card" style={{ borderLeft: `3px solid ${c.color}` }}
                  draggable onDragStart={() => setDrag(c.id)}
                  title={c.notes || undefined}
                  onDoubleClick={() => {
                    const notes = window.prompt(t('shell.cardNotes'), c.notes)
                    if (notes !== null) shell.kanban.updateCard(c.id, { notes }).then(load)
                  }}>
                  <span>{c.title}</span>
                  <button className="btn-icon compact" onClick={() => delCard(c.id)}>×</button>
                </div>
              ))}
              <button className="shell-kanban-add" onClick={() => addCard(col.id)}>+ {t('shell.addCard')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
})

// ============================================================== Docs

function renderMarkdown(src: string): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const lines = src.replace(/\r\n/g, "\n").split("\n")
  const out: string[] = []
  let inCode = false
  let codeBuf: string[] = []
  const flushCode = () => {
    if (codeBuf.length) {
      out.push(`<pre class="shell-md-code">${esc(codeBuf.join("\n"))}</pre>`)
      codeBuf = []
    }
  }
  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) { flushCode(); inCode = false } else { flushCode(); inCode = true }
      continue
    }
    if (inCode) { codeBuf.push(line); continue }
    const h = line.match(/^(#{1,4})\s+(.*)/)
    if (h) { out.push(`<h${h[1].length}>${esc(h[2])}</h${h[1].length}>`); continue }
    if (/^\s*[-*]\s+/.test(line)) { out.push(`<li>${esc(line.replace(/^\s*[-*]\s+/, ""))}</li>`); continue }
    if (/^\d+\.\s+/.test(line)) { out.push(`<li>${esc(line.replace(/^\d+\.\s+/, ""))}</li>`); continue }
    if (line.trim() === "") { if (out.length && out[out.length - 1] !== "<br>") out.push("<br>"); continue }
    let html = esc(line)
    html = html.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>").replace(/`(.+?)`/g, "<code>$1</code>")
    html = html.replace(/\[(.+?)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    out.push(`<p>${html}</p>`)
  }
  flushCode()
  return out.join("\n")
}

export const DocsPanel = memo(function DocsPanel() {
  const t = useT()
  const [root, setRoot] = useState<string>("")
  const [files, setFiles] = useState<{ name: string; path: string; size: number }[]>([])
  const [filter, setFilter] = useState("")
  const [doc, setDoc] = useState<{ path: string; html: string } | null>(null)

  useEffect(() => {
    shell.docs.list().then((r) => {
      setRoot(r.root)
      setFiles(r.files)
    })
  }, [])

  const open = async (path: string) => {
    const r = await shell.docs.read(path)
    setDoc({ path: r.path, html: renderMarkdown(r.content) })
  }

  const shown = filter ? files.filter((f) => f.path.toLowerCase().includes(filter.toLowerCase())) : files

  return (
    <div className="shell-docs">
      <div className="shell-docs-head">
        <input type="search" placeholder={t('shell.searchDocs')} value={filter} onChange={(e) => setFilter(e.target.value)} />
        <a className="btn-secondary compact" href="https://opencode.ai/docs" target="_blank" rel="noreferrer">{t('shell.officialDocs')}</a>
      </div>
      <div className="shell-docs-body">
        <div className="shell-docs-list">
          {shown.map((f) => (
            <div key={f.path} className={`shell-row shell-file${doc?.path === f.path ? " active" : ""}`} onClick={() => open(f.path)} title={f.path}>
              <span className="shell-glyph" style={{ color: "#4aa3df" }}>M</span>
              <span className="shell-name">{f.name}</span>
            </div>
          ))}
        </div>
        <div className="shell-docs-content" dangerouslySetInnerHTML={doc ? { __html: doc.html } : undefined}>
          {!doc && <div className="shell-empty">{t('shell.selectDoc')}<br /><small>{root}</small></div>}
        </div>
      </div>
    </div>
  )
})

// ============================================================== Updates (GitHub + X)

export const UpdatesPanel = memo(function UpdatesPanel() {
  const t = useT()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback((refresh = false) => {
    setLoading(true)
    shell.updates.get(refresh).then(setData).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const fmt = (iso: string) => (iso ? new Date(iso).toLocaleDateString() : "")

  return (
    <div className="shell-updates">
      <div className="shell-updates-head">
        <strong>{t('shell.updates')}</strong>
        <button className="btn-secondary compact" onClick={() => load(true)} disabled={loading}>{loading ? "…" : t('shell.refresh')}</button>
      </div>
      <div className="shell-updates-body">
        {data?.github?.map((repo: any) => (
          <div key={repo.repo} className="shell-updates-section">
            <div className="shell-updates-title">GitHub · {repo.repo}</div>
            {repo.releases?.map((r: any, i: number) => (
              <div key={i} className="shell-update-item">
                <a href={r.url} target="_blank" rel="noreferrer"><b>{r.tag}</b> {r.name}</a>
                <small>{fmt(r.date)}</small>
                {r.body && <p className="shell-update-body">{r.body.slice(0, 300)}</p>}
              </div>
            ))}
            <div className="shell-updates-commits">
              {repo.commits?.map((c: any, i: number) => (
                <a key={i} href={c.url} target="_blank" rel="noreferrer" title={c.message}>
                  <code>{c.sha}</code> {c.message.slice(0, 80)}
                </a>
              ))}
            </div>
          </div>
        ))}
        {data?.x?.map((x: any) => (
          <div key={x.handle} className="shell-updates-section">
            <div className="shell-updates-title">X @{x.handle}</div>
            {x.error && <small>{x.error}</small>}
            <div className="shell-x-lines">{x.lines?.slice(0, 15).map((l: string, i: number) => <div key={i}>{l}</div>)}</div>
          </div>
        ))}
        {!data && !loading && <div className="shell-empty">{t('shell.noUpdates')}</div>}
      </div>
    </div>
  )
})

// ============================================================== Stats

export const StatsPanel = memo(function StatsPanel() {
  const t = useT()
  const [status, setStatus] = useState<{ running: boolean; port: number; url: string } | null>(null)
  const [attemptedStart, setAttemptedStart] = useState(false)

  const load = useCallback(() => {
    shell.stats.status()
      .then((s) => {
        if (!s.running && !attemptedStart) {
          setAttemptedStart(true)
          shell.stats.start().then(() => shell.stats.status().then(setStatus)).catch(() => {})
        }
        setStatus(s)
      })
      .catch(() => {
        // Fallback: verificar localhost:8765
        fetch("http://localhost:8765/api/data?raw=1", { mode: "no-cors" })
          .then(() => setStatus({ running: true, port: 8765, url: "http://localhost:8765" }))
          .catch(() => setStatus({ running: false, port: 8765, url: "http://localhost:8765" }))
      })
  }, [attemptedStart])

  useEffect(() => {
    load()
    const iv = window.setInterval(load, 5000)
    return () => window.clearInterval(iv)
  }, [load])

  return (
    <div className="shell-stats">
      {status?.running ? (
        <iframe src={status.url || "http://localhost:8765"} className="shell-stats-frame" title="OpenCode Stats" />
      ) : (
        <div className="shell-empty">
          <p>{t('shell.statsOff')}</p>
          <button className="btn-primary" onClick={() => shell.stats.start().then(load)}>{t('shell.startStats')}</button>
        </div>
      )}
    </div>
  )
})

// ============================================================== Labs + Config

export const LabsPanel = memo(function LabsPanel() {
  const t = useT()
  const [apps, setApps] = useState<any[]>([])
  const [server, setServer] = useState<any>(null)
  const [autostart, setAutostart] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(() => {
    shell.labs.list().then((r) => setApps(r.apps))
    shell.server.status().then(setServer)
    shell.autostart.get().then((r) => setAutostart(r.enabled))
  }, [])
  useEffect(() => {
    load()
    const iv = window.setInterval(load, 6000)
    return () => window.clearInterval(iv)
  }, [load])

  const start = async (appId: string) => {
    setBusy(appId)
    try {
      await shell.labs.start(appId)
    } catch (e: any) {
      window.alert(e.message ?? String(e))
    }
    setBusy(null)
    load()
  }

  return (
    <div className="shell-labs">
      <div className="shell-updates-head">
        <strong>{t('shell.labs')}</strong>
        <button className="btn-secondary compact" onClick={load} title="refresh"><RefreshIcon size={12} /></button>
      </div>
      <div className="shell-labs-section">
        <div className="shell-updates-title">Server opencode</div>
        <div className="shell-labs-row">
          <span>{server?.running ? "● " + t('shell.running') : "○ " + t('shell.stopped')}</span>
          <button className="btn-primary compact" disabled={!server?.running && !server} onClick={() => shell.server.start().then(load)}>{t('shell.start')}</button>
          <button className="btn-secondary compact" onClick={() => shell.server.stop().then(load)}>{t('shell.stop')}</button>
        </div>
      </div>
      <div className="shell-labs-section">
        <div className="shell-updates-title">{t('shell.apps')}</div>
        {apps.map((a) => (
          <div key={a.id} className="shell-labs-row">
            <span>{a.title} {!a.configured && <small>({t('shell.notConfigured')})</small>}</span>
            <button className="btn-primary compact" disabled={!a.configured || busy === a.id} onClick={() => start(a.id)}>{busy === a.id ? "…" : t('shell.launch')}</button>
          </div>
        ))}
      </div>
      <div className="shell-labs-section">
        <div className="shell-updates-title">Windows</div>
        <label className="shell-labs-row">
          <span>{t('shell.autostart')}</span>
          <input type="checkbox" checked={autostart} onChange={(e) => shell.autostart.set(e.target.checked).then(() => setAutostart(e.target.checked))} />
        </label>
      </div>
    </div>
  )
})

export const ConfigPanel = memo(function ConfigPanel() {
  const t = useT()
  const [raw, setRaw] = useState("")
  const [msg, setMsg] = useState("")

  const load = useCallback(() => {
    shell.config.get().then((c) => {
      setRaw(JSON.stringify(c, null, 2))
    })
  }, [])
  useEffect(load, [load])

  const apply = async () => {
    try {
      const parsed = JSON.parse(raw)
      await shell.config.import(parsed)
      setMsg("✓")
      load()
    } catch (e: any) {
      setMsg("✗ " + (e.message ?? e))
    }
  }
  const exportCfg = async () => {
    const r = await shell.config.export()
    await navigator.clipboard.writeText(JSON.stringify(r.config, null, 2))
    setMsg("✓ " + t('shell.copied'))
  }

  return (
    <div className="shell-config">
      <div className="shell-config-head">
        <button className="btn-primary compact" onClick={apply}>{t('shell.apply')}</button>
        <button className="btn-secondary compact" onClick={exportCfg}>{t('shell.export')}</button>
        {msg && <span className="shell-config-msg">{msg}</span>}
      </div>
      <textarea className="shell-config-ta" value={raw} onChange={(e) => { setRaw(e.target.value); setMsg("") }} spellCheck={false} />
    </div>
  )
})

// ============================================================== Wrapper

export type ShellPanelProps = {
  kind: Exclude<ShellPanelKind, "session">
  cwd?: string
  onOpenSessionDir: (dir: string) => void
  sessionID?: string | null
}

// ============================================================== Session Stats (compacto)

type SessionDetail = {
  id: string
  title: string
  model: string
  directory: string
  created: number
  updated: number
  input: number
  output: number
  reasoning: number
  cache_read: number
  cache_write: number
  cost: number
  events: number
  events_mb: number
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function fmtCost(n: number): string {
  if (n >= 1) return `$${n.toFixed(2)}`
  if (n >= 0.01) return `$${n.toFixed(3)}`
  return `$${n.toFixed(4)}`
}

function timeAgo(ts: number): string {
  const diff = Date.now() / 1000 - ts
  if (diff < 60) return "ahora"
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

export const SessionStatsPanel = memo(function SessionStatsPanel({ sessionID }: { sessionID?: string | null }) {
  const t = useT()
  const [detail, setDetail] = useState<SessionDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!sessionID) return
    setLoading(true)
    setError(null)
    try {
      const r = await shell.stats.proxy(`admin/session/${sessionID}`)
      setDetail(r)
    } catch {
      setError("Stats no disponibles")
    } finally {
      setLoading(false)
    }
  }, [sessionID])

  useEffect(() => {
    load()
    const iv = window.setInterval(load, 15_000)
    return () => window.clearInterval(iv)
  }, [load])

  if (!sessionID) return <div className="shell-empty"><p>{t('shell.noSession')}</p></div>
  if (loading && !detail) return <div className="shell-empty"><p>Cargando stats...</p></div>
  if (error) return <div className="shell-empty"><p>{error}</p><button className="btn-secondary" onClick={load}>Reintentar</button></div>
  if (!detail) return null

  const totalTokens = detail.input + detail.output + detail.reasoning
  const cacheHit = detail.cache_read > 0 ? ((detail.cache_read / (detail.cache_read + detail.input)) * 100).toFixed(0) : "0"

  return (
    <div className="session-stats">
      <div className="session-stats-header">
        <span className="session-stats-title" title={detail.title}>{detail.title || "(sin título)"}</span>
        <button className="btn-icon compact" onClick={load} title="Actualizar">↻</button>
      </div>
      <div className="session-stats-grid">
        <div className="session-stats-card">
          <span className="ss-label">Costo</span>
          <span className="ss-value">{fmtCost(detail.cost)}</span>
        </div>
        <div className="session-stats-card">
          <span className="ss-label">Tokens</span>
          <span className="ss-value">{fmtTokens(totalTokens)}</span>
        </div>
        <div className="session-stats-card">
          <span className="ss-label">Input</span>
          <span className="ss-value">{fmtTokens(detail.input)}</span>
        </div>
        <div className="session-stats-card">
          <span className="ss-label">Output</span>
          <span className="ss-value">{fmtTokens(detail.output)}</span>
        </div>
        <div className="session-stats-card">
          <span className="ss-label">Reasoning</span>
          <span className="ss-value">{fmtTokens(detail.reasoning)}</span>
        </div>
        <div className="session-stats-card">
          <span className="ss-label">Cache HIT</span>
          <span className="ss-value">{cacheHit}%</span>
        </div>
        <div className="session-stats-card">
          <span className="ss-label">Eventos</span>
          <span className="ss-value">{detail.events}</span>
        </div>
        <div className="session-stats-card">
          <span className="ss-label">Última vez</span>
          <span className="ss-value">{timeAgo(detail.updated)}</span>
        </div>
      </div>
      {detail.model && (
        <div className="session-stats-footer">
          <span className="ss-model">{detail.model}</span>
        </div>
      )}
    </div>
  )
})

export const ShellPanel = memo(function ShellPanel({ kind, cwd, onOpenSessionDir, sessionID: _sessionID }: ShellPanelProps) {
  switch (kind) {
    case "terminal":
      return <TerminalPanel cwd={cwd} />
    case "explorer":
      return <ExplorerPanel onOpenSessionDir={onOpenSessionDir} initialCwd={cwd} />
    case "kanban":
      return <KanbanPanel />
    case "docs":
      return <DocsPanel />
    case "updates":
      return <UpdatesPanel />
    case "stats":
      return <StatsPanel />
    case "labs":
      return <LabsPanel />
    case "config":
      return <ConfigPanel />
    default:
      return null
  }
})
