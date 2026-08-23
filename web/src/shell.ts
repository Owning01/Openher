// Cliente de la API de la shell (/shell/*) + utilidades del explorador.
// Solo disponible cuando la app la sirve el exe de escritorio (mismo origen).

export type ShellPanelKind = "session" | "terminal" | "explorer" | "kanban" | "docs" | "updates" | "stats" | "session-stats" | "labs" | "config" | "editor" | "browser" | "doc" | "design" | "quickchat"

export const SHELL_PANEL_KINDS: ShellPanelKind[] = ["terminal", "explorer", "kanban", "docs", "updates", "stats", "labs", "browser", "doc", "design", "quickchat"]

export type FsEntry = { name: string; path: string; is_dir: boolean; size: number | null; modified: number | null }

export type KanbanBoard = { id: string; name: string; columns: { id: string; title: string }[]; cards: KanbanCard[] }
export type KanbanCard = { id: string; board: string; column: string; title: string; notes: string; color: string }

export type LabApp = { id: string; title: string; kind: string; configured: boolean }

export type ShellPlugin = { name: string; title: string; type: string; description: string; version: string }

export type ShellConfig = {
  server: { host: string; port: number; username: string; password: string; use_ssl: boolean }
  port: number
  start_minimized: boolean
  start_command: string
  server_ports: number[]
  docs_root: string
  x_handles: string[]
  github_repos: string[]
  desktop_agent_path: string
  labs_apps: { id: string; title: string; path: string }[]
  cerebras_api_key: string
  groq_api_key: string
  quickchat_provider: string
  quickchat_model: string
}

let resolvedBase: string | null = null

export async function resolveShellBase(): Promise<string> {
  if (resolvedBase !== null) return resolvedBase
  try {
    const res = await fetch("/shell/health", { cache: "no-store" })
    if (res.ok) {
      resolvedBase = ""
      return ""
    }
  } catch {}
  try {
    const res = await fetch("http://127.0.0.1:5900/shell/health", { cache: "no-store" })
    if (res.ok) {
      resolvedBase = "http://127.0.0.1:5900"
      return resolvedBase
    }
  } catch {}
  resolvedBase = ""
  return ""
}

export async function shellAvailable(): Promise<boolean> {
  try {
    const base = await resolveShellBase()
    const r = await fetch(`${base}/shell/health`, { cache: "no-store" })
    return r.ok
  } catch {
    return false
  }
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error((await res.json().catch(() => ({ error: res.status }))).error ?? String(res.status))
  return res.json() as Promise<T>
}

const get = async <T>(url: string) => {
  const base = await resolveShellBase()
  return fetch(`${base}${url}`).then(j<T>)
}

const post = async <T>(url: string, body?: unknown) => {
  const base = await resolveShellBase()
  return fetch(`${base}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  }).then(j<T>)
}

export const shell = {
  fs: {
    drives: () => get<{ drives: string[] }>("/shell/fs/drives"),
    list: (path: string) => get<{ path: string; dirs: FsEntry[]; files: FsEntry[] }>(`/shell/fs/list?path=${encodeURIComponent(path)}`),
    read: (path: string) => get<{ path: string; content: string; truncated: boolean; size: number; ext: string }>(`/shell/fs/read?path=${encodeURIComponent(path)}`),
    favorites: () => get<{ favorites: string[] }>("/shell/fs/favorites"),
    toggleFavorite: (path: string, add: boolean) => post("/shell/fs/favorites", { path, add }),
    sessionFor: (path: string) => get<{ ok: boolean; directory?: string }>(`/shell/fs/session?path=${encodeURIComponent(path)}`),
    delete: (path: string) => post("/shell/fs/delete", { path }),
    copy: (src: string, dest: string) => post<{ ok: boolean; path: string }>("/shell/fs/copy", { src, dest }),
    write: (path: string, dataBase64: string) => post("/shell/fs/write", { path, data: dataBase64 }),
    mkdir: (path: string) => post("/shell/fs/mkdir", { path }),
    reveal: (path: string) => post<{ ok: boolean; path: string; is_dir: boolean }>("/shell/fs/reveal", { path }),
    execFile: (path: string) => post<{ ok: boolean; path: string }>("/shell/fs/exec", { path }),
    pickFolder: () => get<{ ok: boolean; path: string | null }>("/shell/fs/pick-folder"),
  },
  project: {
    serve: (path: string) => post<{
      ok: boolean
      token: string
      previewUrl: string
      directory: string
      entrypoint: string
      htmlFiles: string[]
      hasPackageJson: boolean
      scripts: Record<string, string>
    }>("/shell/project/serve", { path }),
  },
  pty: {
    create: (cwd?: string, shellName?: string) => {
      const params = new URLSearchParams()
      if (cwd) params.set("cwd", cwd)
      if (shellName) params.set("shell", shellName)
      const qs = params.toString()
      return post<{ id: string; ws_port: number }>(`/shell/pty${qs ? `?${qs}` : ""}`)
    },
    write: (id: string, data: string) => post(`/shell/pty/${id}/write`, { data }),
    resize: (id: string, cols: number, rows: number) => post(`/shell/pty/${id}/resize`, { cols, rows }),
    kill: (id: string) => fetch(`/shell/pty/${id}`, { method: "DELETE" }).then(() => undefined),
    poll: (id: string, since: number) => get<{ len: number; done: boolean; data?: string; error?: string }>(`/shell/pty/${id}/buffer?since=${since}`),
  },
  kanban: {
    all: () => get<{ boards: KanbanBoard[] }>("/shell/kanban"),
    addBoard: (name: string) => post("/shell/kanban/board", { name }),
    delBoard: (id: string) => fetch(`/shell/kanban/board?id=${id}`, { method: "DELETE" }).then(j),
    addCard: (board: string, column: string, title: string, notes: string, color: string) => post("/shell/kanban/card", { board, column, title, notes, color }),
    updateCard: (id: string, patch: Partial<{ column: string; title: string; notes: string; color: string }>) => fetch("/shell/kanban/card", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...patch }) }).then(j),
    delCard: (id: string) => fetch(`/shell/kanban/card?id=${id}`, { method: "DELETE" }).then(j),
  },
  updates: {
    get: (refresh = false) => get<any>(`/shell/updates${refresh ? "?refresh=1" : ""}`),
  },
  docs: {
    list: () => get<{ root: string; files: { name: string; path: string; size: number }[] }>("/shell/docs"),
    read: (path: string) => get<{ path: string; content: string; size: number; root: string }>(`/shell/docs/read?path=${encodeURIComponent(path)}`),
  },
  stats: {
    status: () => get<{ running: boolean; port: number; url: string }>("/shell/stats"),
    start: () => post("/shell/stats/start"),
    proxy: (path: string) => fetch(`/shell/stats/proxy/${path}`).then((r) => r.json()),
  },
  plugins: {
    list: () => get<{ plugins: ShellPlugin[] }>("/shell/plugins"),
    run: (name: string) => post("/shell/plugins/run", { name }),
  },
  labs: {
    list: () => get<{ apps: LabApp[] }>("/shell/labs"),
    start: (id: string) => post("/shell/labs/start", { id }),
  },
  server: {
    status: () => get<{ running: boolean; ports_up: number[] }>("/shell/server"),
    start: () => post("/shell/server/start"),
    stop: () => post("/shell/server/stop"),
  },
  autostart: {
    get: () => get<{ enabled: boolean }>("/shell/autostart"),
    set: (enabled: boolean) => post("/shell/autostart", { enabled }),
  },
  doc: {
    convert: (src: string, target: "md" | "docx" | "pdf", dest?: string) =>
      post<{ ok: boolean; src: string; dest: string; format: string; size: number; preview: string }>("/shell/doc/convert", { src, target, dest }),
    save: (path: string, content: string, format: "md" | "docx" | "pdf") =>
      post<{ ok: boolean; path: string }>("/shell/doc/save", { path, content, format }),
  },
  // Open Design (od-web) — Rust side puede proxear a daemon/Next, fallback a iframe directo
  design: {
    status: () => get<{ running: boolean; url: string }>("/shell/design/status").catch(() => ({ running: false, url: "http://localhost:3000" } as any)),
    openExternal: (url: string) => post<{ ok: boolean }>("/shell/design/open", { url }).catch(() => ({ ok: false } as any)),
  },
  browser: {
    open: (url: string, bounds: { x: number; y: number; w: number; h: number }) =>
      post<{ ok: boolean }>("/shell/browser/open", { url, bounds }),
    setBounds: (bounds: { x: number; y: number; w: number; h: number }) =>
      post<{ ok: boolean }>("/shell/browser/bounds", bounds),
    setVisibility: (visible: boolean) =>
      post<{ ok: boolean }>("/shell/browser/visibility", { visible }),
    navigate: (url: string, action?: "back" | "forward" | "reload") =>
      post<{ ok: boolean }>("/shell/browser/navigate", { url, action }),
    close: () => post<{ ok: boolean }>("/shell/browser/close"),
    url: () => get<{ url: string }>("/shell/browser/url"),
    eval: (code: string) => post<{ ok: boolean }>("/shell/browser/eval", { code }),
    drainPicks: () => get<{ picks: any[] }>("/shell/browser/pick"),
  },
  config: {
    get: () => get<ShellConfig>("/shell/config"),
    patch: (patch: Partial<ShellConfig>) => post<{ ok: boolean; config: ShellConfig }>("/shell/config", patch),
    export: () => get<{ config: ShellConfig }>("/shell/config/export"),
    import: (config: ShellConfig) => post("/shell/config/import", { config }),
  },
  search: {
    query: (q: string) => get<{ results: { title: string; url: string; snippet: string }[]; cached: boolean }>(`/shell/search?q=${encodeURIComponent(q)}`),
  },
  proxy: {
    /** URL para iframe same-origin que bypasea X-Frame-Options/CSP */
    iframeUrl: (target: string) => `/shell/proxy?url=${encodeURIComponent(target)}`,
    /** Fetch robusto vía Rust: bypasea CORS preflight sin --disable-web-security */
    fetch: async (target: string, init?: RequestInit): Promise<Response> => {
      const base = await resolveShellBase()
      const url = `${base}/shell/proxy?url=${encodeURIComponent(target)}`
      return fetch(url, init as any)
    },
  },
}

// ================================================================ Base64

export function b64decode(s: string): Uint8Array {
  const clean = s.replace(/=/g, "")
  const out = new Uint8Array(Math.floor((clean.length * 6) / 8))
  let bits = 0
  let acc = 0
  let n = 0
  const T = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
  for (const ch of clean) {
    const v = T.indexOf(ch)
    if (v < 0) continue
    acc = (acc << 6) | v
    bits += 6
    if (bits >= 8) {
      bits -= 8
      out[n++] = (acc >> bits) & 0xff
    }
  }
  return out.subarray(0, n)
}

// ================================================== Iconos y colores de archivos
// Mapa extensión -> color (tema claro/oscuro) + letra del icono (SVG inline).

type IconSpec = { color: string; glyph: string }

const FILE_COLORS: Record<string, IconSpec> = {
  md: { color: "#4aa3df", glyph: "M" },
  mdx: { color: "#4aa3df", glyph: "M" },
  js: { color: "#e8c547", glyph: "JS" },
  jsx: { color: "#61dafb", glyph: "JS" },
  ts: { color: "#3178c6", glyph: "TS" },
  tsx: { color: "#61dafb", glyph: "TS" },
  html: { color: "#e34c26", glyph: "H" },
  htm: { color: "#e34c26", glyph: "H" },
  css: { color: "#663399", glyph: "C" },
  scss: { color: "#cc6699", glyph: "S" },
  less: { color: "#1d365d", glyph: "L" },
  py: { color: "#3776ab", glyph: "PY" },
  rs: { color: "#f74c00", glyph: "RS" },
  go: { color: "#00add8", glyph: "GO" },
  java: { color: "#e76f00", glyph: "J" },
  c: { color: "#5c6bc0", glyph: "C" },
  cpp: { color: "#5c6bc0", glyph: "C++" },
  h: { color: "#5c6bc0", glyph: "H" },
  cs: { color: "#68217a", glyph: "C#" },
  rb: { color: "#cc342d", glyph: "RB" },
  php: { color: "#777bb4", glyph: "PHP" },
  json: { color: "#cbcb41", glyph: "{}" },
  jsonc: { color: "#cbcb41", glyph: "{}" },
  toml: { color: "#9c4221", glyph: "T" },
  yml: { color: "#e34c26", glyph: "Y" },
  yaml: { color: "#e34c26", glyph: "Y" },
  sh: { color: "#89e051", glyph: "SH" },
  bat: { color: "#4f5b66", glyph: "BAT" },
  ps1: { color: "#5391fe", glyph: "PS" },
  sql: { color: "#e38c00", glyph: "SQL" },
  svg: { color: "#ffb13b", glyph: "SVG" },
  png: { color: "#8b89cc", glyph: "IMG" },
  jpg: { color: "#8b89cc", glyph: "IMG" },
  jpeg: { color: "#8b89cc", glyph: "IMG" },
  gif: { color: "#8b89cc", glyph: "IMG" },
  webp: { color: "#8b89cc", glyph: "IMG" },
  ico: { color: "#8b89cc", glyph: "ICO" },
  pdf: { color: "#e2574c", glyph: "PDF" },
  txt: { color: "#c0c0c0", glyph: "TXT" },
  log: { color: "#c0c0c0", glyph: "LOG" },
  lock: { color: "#8b8b8b", glyph: "KEY" },
  gitignore: { color: "#e2574c", glyph: "GI" },
  gitattributes: { color: "#e2574c", glyph: "GA" },
  md5: { color: "#8b8b8b", glyph: "HASH" },
}

const FILE_GROUPS: [RegExp, string][] = [
  [/^dockerfile/i, "#2496ed"],
  [/^makefile$/i, "#a074c4"],
  [/^readme/i, "#4aa3df"],
  [/^package\.json$/, "#cbcb41"],
  [/^vite\.config/, "#ffc24b"],
  [/^tsconfig/, "#3178c6"],
  [/^cargo\.(toml|lock)$/, "#f74c00"],
  [/^go\.mod$/, "#00add8"],
  [/^\.env/, "#e8c547"],
  [/^editorconfig$/, "#8b8b8b"],
]

export function fileIcon(name: string, isDir: boolean): { color: string; glyph: string } {
  if (isDir) return { color: "#e8b04b", glyph: "▸" }
  const low = name.toLowerCase()
  const ext = low.includes(".") ? low.split(".").pop() ?? "" : ""
  const byName = FILE_GROUPS.find(([re]) => re.test(name))
  if (byName) return { color: byName[1], glyph: name[0]?.toUpperCase() ?? "F" }
  if (ext && FILE_COLORS[ext]) return FILE_COLORS[ext]
  if (ext === "min.js") return FILE_COLORS.js
  return { color: "#9aa0a6", glyph: "F" }
}

export const KANBAN_COLORS = ["#fab283", "#7dd3fc", "#86efac", "#fca5a5", "#d8b4fe", "#fde68a", "#94a3b8"]
