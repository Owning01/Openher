// Paneles de la shell para el grid de escritorio: terminal, explorador,
// kanban, docs, updates, stats, labs y config. Todos hablan con /shell/*.

import { memo, useCallback, useEffect, useRef, useState } from "react"
import { Terminal } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import "@xterm/xterm/css/xterm.css"
import { FolderIcon, RefreshIcon } from "../Icons"
import { b64decode, fileIcon, KANBAN_COLORS, shell, type FsEntry, type KanbanBoard, type ShellPanelKind } from "../shell"
import { useT } from "../i18n-context"

// ============================================================== Terminal

const TerminalPanel = memo(function TerminalPanel({ cwd }: { cwd?: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const termRef = useRef<Terminal | null>(null)
  const ptyIdRef = useRef<string | null>(null)

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
    try {
      fit.fit()
    } catch {
      /* ignore */
    }
    termRef.current = term

    let disposed = false
    let pollTimer = 0
    let since = 0

    const poll = async () => {
      const pid = ptyIdRef.current
      if (disposed || !pid) return
      try {
        const r = await shell.pty.poll(pid, since)
        if (!disposed && r.data) {
          since = r.len
          term.write(b64decode(r.data))
        }
      } catch {
        /* server restart etc */
      }
      if (!disposed) pollTimer = window.setTimeout(poll, 250)
    }

    const dispose = term.onData((d) => {
      const pid = ptyIdRef.current
      if (pid) shell.pty.write(pid, d)
    })

    shell.pty.create(cwd).then(({ id: newId }) => {
      if (disposed) {
        shell.pty.kill(newId)
        return
      }
      ptyIdRef.current = newId
      poll()
    })

    const ro = new ResizeObserver(() => {
      try {
        fit.fit()
      } catch {
        /* ignore */
      }
    })
    ro.observe(el)

    return () => {
      disposed = true
      window.clearTimeout(pollTimer)
      ro.disconnect()
      dispose.dispose()
      const pid = ptyIdRef.current
      if (pid) shell.pty.kill(pid)
      term.dispose()
    }
  }, [cwd])

  return <div className="shell-terminal" ref={ref} style={{ width: "100%", height: "100%", background: "#0d1117", padding: 6 }} />
})

// ============================================================== Explorador

const ExplorerPanel = memo(function ExplorerPanel({ onOpenSessionDir }: { onOpenSessionDir: (dir: string) => void }) {
  const t = useT()
  const [drives, setDrives] = useState<string[]>([])
  const [cwd, setCwd] = useState<string | null>(null)
  const [dirs, setDirs] = useState<FsEntry[]>([])
  const [files, setFiles] = useState<FsEntry[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [preview, setPreview] = useState<{ path: string; content: string; ext: string; truncated: boolean } | null>(null)
  const [history, setHistory] = useState<string[]>([])

  const load = useCallback(async (path: string) => {
    setCwd(path)
    setPreview(null)
    const r = await shell.fs.list(path)
    setDirs(r.dirs)
    setFiles(r.files)
  }, [])

  useEffect(() => {
    shell.fs.drives().then(({ drives }) => {
      setDrives(drives)
      shell.fs.favorites().then(({ favorites }) => setFavorites(favorites))
      if (drives.length > 0) load(drives[0])
    })
  }, [load])

  const nav = (path: string) => {
    setHistory((h) => [...h, cwd ?? ""])
    load(path)
  }
  const back = () => {
    const prev = history[history.length - 1]
    if (prev) {
      setHistory((h) => h.slice(0, -1))
      load(prev)
    }
  }
  const fav = (path: string, add: boolean) => {
    shell.fs.toggleFavorite(path, add).then(() => shell.fs.favorites().then(({ favorites }) => setFavorites(favorites)))
  }

  const openFile = async (path: string) => {
    const r = await shell.fs.read(path)
    setPreview({ path: r.path, content: r.content, ext: r.ext, truncated: r.truncated })
  }

  return (
    <div className="shell-explorer">
      <div className="shell-explorer-top">
        <button className="btn-icon compact" onClick={back} title={t('shell.back')} aria-label={t('shell.back')}>←</button>
        <span className="shell-path" title={cwd ?? ""}>{cwd ?? "…"}</span>
      </div>
      <div className="shell-drives">
        {drives.map((d) => (
          <button key={d} type="button" className={`shell-drive${cwd === d ? " active" : ""}`} onClick={() => load(d)}>{d}</button>
        ))}
      </div>
      <div className="shell-tree">
        {favorites.length > 0 && (
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
          <div key={d.path} className="shell-row shell-dir" onClick={() => nav(d.path)} onDoubleClick={() => fav(d.path, true)} title={d.path}>
            <FolderIcon size={13} className="shell-glyph" />
            <span className="shell-name">{d.name}</span>
            {cwd && (
              <button className="btn-icon compact shell-star" title={t('shell.fav')} onClick={(e) => { e.stopPropagation(); fav(d.path, true) }}>☆</button>
            )}
          </div>
        ))}
        {files.map((f) => {
          const ic = fileIcon(f.name, false)
          return (
            <div key={f.path} className="shell-row shell-file" onClick={() => openFile(f.path)} title={f.path}>
              <span className="shell-glyph" style={{ color: ic.color }}>{ic.glyph}</span>
              <span className="shell-name">{f.name}</span>
              <span className="shell-size">{f.size != null ? (f.size > 1024 * 1024 ? `${(f.size / 1048576).toFixed(1)}M` : f.size > 1024 ? `${(f.size / 1024).toFixed(0)}K` : `${f.size}B`) : ""}</span>
            </div>
          )
        })}
        {dirs.length === 0 && files.length === 0 && <div className="shell-empty">{t('shell.empty')}</div>}
      </div>
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

// ============================================================== Kanban

const KanbanPanel = memo(function KanbanPanel() {
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

const DocsPanel = memo(function DocsPanel() {
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

const UpdatesPanel = memo(function UpdatesPanel() {
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

const StatsPanel = memo(function StatsPanel() {
  const t = useT()
  const [status, setStatus] = useState<{ running: boolean; port: number; url: string } | null>(null)

  const load = useCallback(() => {
    shell.stats.status().then(setStatus)
  }, [])
  useEffect(() => {
    load()
    const iv = window.setInterval(load, 5000)
    return () => window.clearInterval(iv)
  }, [load])

  return (
    <div className="shell-stats">
      {status?.running ? (
        <iframe src={status.url} className="shell-stats-frame" title="OpenCode Stats" />
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

const LabsPanel = memo(function LabsPanel() {
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

const ConfigPanel = memo(function ConfigPanel() {
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
}

export const ShellPanel = memo(function ShellPanel({ kind, cwd, onOpenSessionDir }: ShellPanelProps) {
  switch (kind) {
    case "terminal":
      return <TerminalPanel cwd={cwd} />
    case "explorer":
      return <ExplorerPanel onOpenSessionDir={onOpenSessionDir} />
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
