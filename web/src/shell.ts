// Cliente de la API de la shell (/shell/*) + utilidades del explorador.
// Originalmente solo mismo origen (:4848); ahora también Tailscale directo
// (móvil deriva http://<tailscale-ip>:4848 del host de opencode).

export type ShellPanelKind = "session" | "terminal" | "explorer" | "kanban" | "docs" | "updates" | "stats" | "session-stats" | "labs" | "config" | "editor" | "browser" | "doc" | "design" | "quickchat"

export const SHELL_PANEL_KINDS: ShellPanelKind[] = ["session", "editor", "terminal", "explorer", "kanban", "docs", "updates", "stats", "labs", "browser", "doc", "design", "quickchat", "session-stats", "config"]

export type FsEntry = { name: string; path: string; is_dir: boolean; size: number | null; modified: number | null }

export type KanbanBoard = { id: string; name: string; columns: { id: string; title: string }[]; cards: KanbanCard[] }
export type KanbanCard = { id: string; board: string; column: string; title: string; notes: string; color: string }

export type LabApp = { id: string; title: string; kind: string; configured: boolean }

export type ShellPlugin = { name: string; title: string; type: string; description: string; version: string }

// ===== Source control (git) =====

export type GitRepoInfo = { repoRoot: string; branch: string; upstream: string | null; isDetached: boolean }

export type GitChangedFile = {
  path: string
  originalPath: string | null
  indexStatus: string
  worktreeStatus: string
  staged: boolean
  unstaged: boolean
  untracked: boolean
  statusLabel: string
}

export type GitStatusSnapshot = {
  repoRoot: string
  branch: string
  upstream: string | null
  ahead: number
  behind: number
  isDetached: boolean
  truncated: boolean
  changedFiles: GitChangedFile[]
}

export type GitPanelSnapshot = { repo: GitRepoInfo | null; status: GitStatusSnapshot | null }

export type GitLogEntry = {
  sha: string
  shortSha: string
  author: string
  authorEmail: string
  timestampSecs: number
  parents: string[]
  subject: string
  filesChanged: number
  insertions: number
  deletions: number
}

export type GitCommitFileChange = {
  path: string
  originalPath: string | null
  status: string
  statusLabel: string
  added: number
  removed: number
  isBinary: boolean
}

export type GitBranchEntry = {
  name: string
  kind: "local" | "worktree"
  worktreePath: string | null
  isHead: boolean
  isDetached: boolean
}

export type ShellConfig = {
  server: { host: string; port: number; username: string; password: string; use_ssl: boolean }
  port: number
  start_minimized: boolean
  minimize_to_tray: boolean
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
  auto_opencode2?: boolean
  opencode2_enabled?: boolean
  opencode2_port?: number
  opencode2_command?: string
}

let resolvedBase: string | null = null
let resolvedBaseAt = 0
const SHELL_TTL_MS = 30_000

function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input)
  const binary = Array.from(bytes).map((b) => String.fromCodePoint(b)).join("")
  return btoa(binary)
}

function shellAuthHeader(): Record<string, string> {
  try {
    const raw = localStorage.getItem("opencode.remote.server")
    if (!raw) return {}
    const cfg = JSON.parse(raw) as { username?: string; password?: string }
    if (cfg.username && cfg.password) {
      return { Authorization: `Basic ${toBase64(`${cfg.username}:${cfg.password}`)}` }
    }
  } catch {}
  return {}
}

function withShellAuth(headers: Record<string, string>, base: string): Record<string, string> {
  if (!base) return headers
  return { ...headers, ...shellAuthHeader() }
}

function shellRemoteOverride(): string | null {
  try {
    const v = localStorage.getItem("opencode.mobile.shellBase")
    if (v && v.trim()) return v.trim().replace(/\/+$/, "")
  } catch {}
  return null
}

function deriveShellBaseFromServer(): string | null {
  try {
    const raw = localStorage.getItem("opencode.remote.server")
    if (!raw) return null
    const cfg = JSON.parse(raw) as { host?: string; port?: number }
    if (!cfg.host) return null
    let host = String(cfg.host).trim()
    const schemeMatch = host.match(/^(https?):\/\//)
    const scheme = schemeMatch ? schemeMatch[1] : "http"
    if (schemeMatch) host = host.slice(schemeMatch[0].length)
    host = host.split("/")[0]!.split(":")[0]!
    if (!host || host === "localhost" || host === "127.0.0.1" || host === "::1") return null
    return `${scheme}://${host}:4848`
  } catch {
    return null
  }
}

async function probeShellBase(base: string, timeoutMs = 2000): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const headers = withShellAuth({}, base)
    const res = await fetch(`${base}/shell/health`, { cache: "no-store", signal: ctrl.signal, headers })
    clearTimeout(t)
    return res.ok
  } catch {
    return false
  }
}

export async function resolveShellBase(): Promise<string> {
  if (resolvedBase !== null && Date.now() - resolvedBaseAt < SHELL_TTL_MS) return resolvedBase
  const override = shellRemoteOverride()
  if (override) {
    if (await probeShellBase(override)) {
      resolvedBase = override
      resolvedBaseAt = Date.now()
      return resolvedBase
    }
  }
  if (await probeShellBase("")) {
    resolvedBase = ""
    resolvedBaseAt = Date.now()
    return ""
  }
  if (await probeShellBase("http://127.0.0.1:4848")) {
    resolvedBase = "http://127.0.0.1:4848"
    resolvedBaseAt = Date.now()
    return resolvedBase
  }
  const derived = deriveShellBaseFromServer()
  if (derived && derived !== "http://127.0.0.1:4848") {
    if (await probeShellBase(derived)) {
      resolvedBase = derived
      resolvedBaseAt = Date.now()
      return resolvedBase
    }
  }
  resolvedBase = ""
  resolvedBaseAt = Date.now()
  return ""
}

export function invalidateShellBase() {
  resolvedBase = null
  resolvedBaseAt = 0
}

export async function shellAvailable(): Promise<boolean> {
  try {
    const base = await resolveShellBase()
    if (base === "") {
      try {
        const r = await fetch("/shell/health", { cache: "no-store" })
        if (r.ok) return true
      } catch {}
      const derived = deriveShellBaseFromServer()
      if (derived && (await probeShellBase(derived))) return true
      return false
    }
    return await probeShellBase(base)
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
  const headers = withShellAuth({}, base)
  const h: Record<string, string> = { ...headers }
  return fetch(`${base}${url}`, { headers: h }).then(j<T>)
}

const post = async <T>(url: string, body?: unknown) => {
  const base = await resolveShellBase()
  const headers: Record<string, string> = { "Content-Type": "application/json", ...withShellAuth({}, base) }
  return fetch(`${base}${url}`, {
    method: "POST",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  }).then(j<T>)
}

export type CodeSearchMatch = {
  path: string
  file_name: string
  line_number: number
  line_content: string
}

export type CodeSearchResult = {
  query: string
  matches: CodeSearchMatch[]
  total_matches: number
  total_files: number
  truncated: boolean
}

export const shell = {
  fs: {
    drives: () => get<{ drives: string[] }>("/shell/fs/drives"),
    list: (path: string) => get<{ path: string; dirs: FsEntry[]; files: FsEntry[] }>(`/shell/fs/list?path=${encodeURIComponent(path)}`),
    changes: (since: number) => get<{ seq: number; events: Array<{ seq: number; path: string; kind: string }> }>(`/shell/fs/changes?since=${since}`),
    searchCode: (path: string, query: string, limit = 100) =>
      get<CodeSearchResult>(`/shell/fs/search?path=${encodeURIComponent(path)}&q=${encodeURIComponent(query)}&limit=${limit}`),
    read: (path: string) => get<{ path: string; content: string; truncated: boolean; size: number; ext: string }>(`/shell/fs/read?path=${encodeURIComponent(path)}`),
    favorites: () => get<{ favorites: string[] }>("/shell/fs/favorites"),
    toggleFavorite: (path: string, add: boolean) => post("/shell/fs/favorites", { path, add }),
    sessionFor: (path: string) => get<{ ok: boolean; directory?: string }>(`/shell/fs/session?path=${encodeURIComponent(path)}`),
    delete: (path: string) => post("/shell/fs/delete", { path }),
    move: (src: string, destDir: string) => post<{ ok: boolean; path: string }>("/shell/fs/move", { src, dest: destDir }),
    copy: (src: string, dest: string) => post<{ ok: boolean; path: string }>("/shell/fs/copy", { src, dest }),
    write: (path: string, dataBase64: string) => post("/shell/fs/write", { path, data: dataBase64 }),
    mkdir: (path: string) => post("/shell/fs/mkdir", { path }),
    rename: (oldPath: string, newName: string) => post<{ ok: boolean; path: string }>("/shell/fs/rename", { oldPath, newName }),
    reveal: (path: string) => post<{ ok: boolean; path: string; is_dir: boolean }>("/shell/fs/reveal", { path }),
    execFile: (path: string) => post<{ ok: boolean; path: string }>("/shell/fs/exec", { path }),
    pickFolder: () => get<{ ok: boolean; path: string | null }>("/shell/fs/pick-folder"),
    download: async (path: string): Promise<Blob> => {
      const base = await resolveShellBase()
      const headers: Record<string, string> = { ...withShellAuth({}, base) }
      const res = await fetch(`${base}/shell/fs/download?path=${encodeURIComponent(path)}`, { headers })
      if (!res.ok) {
        const msg = (await res.json().catch(() => ({ error: res.statusText }))).error ?? res.statusText
        throw new Error(String(msg))
      }
      return res.blob()
    },
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
  git: {
    panel: (path: string) => get<GitPanelSnapshot>(`/shell/git/panel?path=${encodeURIComponent(path)}`),
    diff: (path: string, file: string | null, staged: boolean) =>
      get<{ diffText: string; truncated: boolean }>(
        `/shell/git/diff?path=${encodeURIComponent(path)}&file=${encodeURIComponent(file ?? "")}&staged=${staged}`,
      ),
    stage: (path: string, files: string[]) => post("/shell/git/stage?path=" + encodeURIComponent(path), { files }),
    unstage: (path: string, files: string[]) => post("/shell/git/unstage?path=" + encodeURIComponent(path), { files }),
    discard: (path: string, entries: { path: string; untracked: boolean }[]) =>
      post("/shell/git/discard?path=" + encodeURIComponent(path), { entries }),
    commit: (path: string, message: string) =>
      post<{ commitSha: string; summary: string }>("/shell/git/commit?path=" + encodeURIComponent(path), { message }),
    push: (path: string) =>
      post<{ remote: string | null; branch: string | null; pushed: boolean }>("/shell/git/push?path=" + encodeURIComponent(path)),
    fetch: (path: string) => post("/shell/git/fetch?path=" + encodeURIComponent(path)),
    pull: (path: string) => post("/shell/git/pull?path=" + encodeURIComponent(path)),
    log: (path: string, limit: number, before?: string, search?: string) => {
      const params = new URLSearchParams({ path, limit: String(limit) })
      if (before) params.set("before", before)
      if (search) params.set("search", search)
      return get<GitLogEntry[]>(`/shell/git/log?${params.toString()}`)
    },
    commitFiles: (path: string, sha: string) =>
      get<GitCommitFileChange[]>(`/shell/git/commit-files?path=${encodeURIComponent(path)}&sha=${encodeURIComponent(sha)}`),
    showCommitDiff: (path: string, sha: string) =>
      post<{ diffText: string; truncated: boolean }>(`/shell/git/show-commit-diff?path=` + encodeURIComponent(path), { sha }),
    commitDiff: (path: string, sha: string, file: string, originalPath?: string) =>
      post<{ diffText: string; truncated: boolean; isBinary: boolean; fallbackPatch: string }>(
        `/shell/git/commit-diff?path=` + encodeURIComponent(path),
        { sha, file, originalPath: originalPath ?? "" },
      ),
    remoteUrl: (path: string, name: string) =>
      get<string | null>(`/shell/git/remote-url?path=${encodeURIComponent(path)}&name=${encodeURIComponent(name)}`),
    branches: (path: string) => get<{ branches: GitBranchEntry[] }>(`/shell/git/branches?path=${encodeURIComponent(path)}`),
    checkout: (path: string, name: string) => post(`/shell/git/checkout?path=` + encodeURIComponent(path), { name }),
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
    resize: (id: string, cols: number, rows: number, pixelWidth?: number, pixelHeight?: number) => post(`/shell/pty/${id}/resize`, { cols, rows, pixel_width: pixelWidth, pixel_height: pixelHeight }),
    kill: async (id: string) => {
      const base = await resolveShellBase()
      const headers = withShellAuth({}, base)
      const res = await fetch(`${base}/shell/pty/${id}`, { method: "DELETE", headers })
      if (!res.ok) throw new Error(String(res.status))
    },
    poll: (id: string, since: number) => get<{ len: number; done: boolean; data?: string; error?: string }>(`/shell/pty/${id}/buffer?since=${since}`),
  },
  kanban: {
    all: () => get<{ boards: KanbanBoard[] }>("/shell/kanban"),
    addBoard: (name: string) => post("/shell/kanban/board", { name }),
    delBoard: async (id: string) => {
      const base = await resolveShellBase()
      const headers = withShellAuth({}, base)
      const res = await fetch(`${base}/shell/kanban/board?id=${encodeURIComponent(id)}`, { method: "DELETE", headers })
      return j(await res) as Promise<unknown>
    },
    addCard: (board: string, column: string, title: string, notes: string, color: string) => post("/shell/kanban/card", { board, column, title, notes, color }),
    updateCard: async (id: string, patch: Partial<{ column: string; title: string; notes: string; color: string }>) => {
      const base = await resolveShellBase()
      const headers: Record<string, string> = { "Content-Type": "application/json", ...withShellAuth({}, base) }
      const res = await fetch(`${base}/shell/kanban/card`, { method: "PATCH", headers, body: JSON.stringify({ id, ...patch }) })
      return j(await res) as Promise<unknown>
    },
    delCard: async (id: string) => {
      const base = await resolveShellBase()
      const headers = withShellAuth({}, base)
      const res = await fetch(`${base}/shell/kanban/card?id=${encodeURIComponent(id)}`, { method: "DELETE", headers })
      return j(await res) as Promise<unknown>
    },
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
    list: () => get<{ ok?: boolean; plugins: ShellPlugin[] }>("/shell/plugins"),
    reload: () => post<{ ok?: boolean; plugins: ShellPlugin[] }>("/shell/plugins/reload"),
    toggle: (name: string, enabled: boolean) => post<{ ok: boolean }>("/shell/plugins/toggle", { name, enabled }),
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
  external: {
    list: () => get<{ ok: boolean; items: Array<{ name: string; title: string; dir: string; port: number | null; url: string; running: boolean }> }>("/shell/external/list").catch(() => ({ ok: false, items: [] } as any)),
    status: (name: string) => get<{ ok: boolean; name: string; running: boolean; url: string; dir: string; port: number | null }>(`/shell/external/${name}/status`).catch(() => ({ ok: false, running: false, url: "" } as any)),
    start: (name: string) => post<{ ok: boolean; pid?: number; url?: string; already?: boolean }>(`/shell/external/${name}/start`).catch(() => ({ ok: false } as any)),
    stop: (name: string) => post<{ ok: boolean }>(`/shell/external/${name}/stop`).catch(() => ({ ok: false } as any)),
    restart: (name: string) => post<{ ok: boolean; pid?: number; url?: string; restarted?: boolean; embed?: boolean }>(`/shell/external/${name}/restart`).catch(() => ({ ok: false } as any)),
    mtime: (name: string) => get<{ ok: boolean; mtime: number; dir: string; port: number | null }>(`/shell/external/${name}/mtime`).catch(() => ({ ok: false, mtime: 0, dir: "", port: null } as any)),
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
  opencode: {
    getGlobal: () => get<{
      configPath: string
      configContent: string
      configFiles: Array<{ path: string; name: string; content: string }>
      instructionsFiles: Array<{ path: string; name: string; content: string }>
      skills: Array<{ name: string; description: string; path: string; skillFile: string; source: string }>
      scannedRoots: string[]
    }>("/shell/opencode/global"),
    saveGlobal: (path: string, content: string) => post<{ ok: boolean }>("/shell/opencode/global", { path, content }),
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
