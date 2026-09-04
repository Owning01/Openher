import type { ProjectDashboard } from "./types"
import { STORAGE_KEYS } from "./constants"

export const LANGUAGE_STORAGE_KEY = STORAGE_KEYS.LANGUAGE

export function isSessionActive(s?: { status?: any } | null): boolean {
  if (!s || !s.status) return false
  const st = typeof s.status === "object" ? s.status.type : s.status
  return st === "busy" || st === "retry" || st === "running" || st === "working"
}

export function hasFileChanges(s: { files: number; additions: number; deletions: number }): boolean {
  return s.files > 0 || s.additions > 0 || s.deletions > 0
}

export function formatTime(epoch: number): string {
  if (!epoch || epoch <= 0) return "-"
  return new Date(epoch).toLocaleString()
}

export function formatTimeCompact(epoch: number): string {
  if (!epoch || epoch <= 0 || Number.isNaN(epoch)) return ""
  const date = new Date(epoch)
  if (isNaN(date.getTime())) return ""
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return "ahora"
  if (diffMin < 60) return `${diffMin}m`
  if (diffMin < 1440 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  const isYesterday = new Date(now.getTime() - 86400000).getDate() === date.getDate()
  if (isYesterday) return "ayer"
  if (diffMs < 6 * 86400000) {
    return date.toLocaleDateString([], { weekday: "short" })
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }
  return date.toLocaleDateString([], { year: "2-digit", month: "numeric", day: "numeric" })
}

export function noopCatch<T>(fn: () => Promise<T>, def: T): Promise<T> {
  return fn().catch(() => def)
}

export function formatLimit(value?: number, decimals = 0): string {
  if (!value) return "-"
  if (value >= 1_000_000) return decimals ? `${(value / 1_000_000).toFixed(decimals)}M` : `${Math.round(value / 1_000_000)}M`
  if (value >= 1_000) return decimals ? `${(value / 1_000).toFixed(decimals)}k` : `${Math.round(value / 1_000)}K`
  return String(value)
}

// Formato compacto para contadores (tokens, líneas): 1.2K, 3.4M.
export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function formatCost(c: number): string {
  return `$${c.toFixed(2)}`
}

// Backoff exponencial con jitter para reconexiones y polling.
// `attempt` es 0-based; `jitterFactor` agrega aleatoriedad para evitar thundering herd.
// El resultado nunca supera `maxMs`.
export function computeBackoff(baseMs: number, maxMs: number, attempt: number, jitterFactor = 0.5): number {
  const base = Math.min(baseMs * Math.pow(2, attempt), maxMs)
  return Math.round(Math.min(base + base * jitterFactor * Math.random(), maxMs))
}

export function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

export function extractPath(dashboard: ProjectDashboard | null): string | null {
  const project = dashboard?.project
  if (!project) return null
  return pickString(project.path) ?? pickString(project.directory) ?? pickString(project.root) ?? null
}

// Último segmento de una ruta (file.ts, src/main.go...). Nunca crashea:
// entradas vacías/undefined devuelven "" (los sessions pueden llegar sin
// directory y los paneles del desktop grid lo renderizan directo).
export function basename(path: string | undefined | null): string {
  if (!path) return ""
  const clean = path.replace(/\\/g, "/")
  return clean.split("/").filter(Boolean).pop() ?? path
}

export function extractName(dashboard: ProjectDashboard | null): string | null {
  const project = dashboard?.project
  if (!project) return null
  const name = pickString(project.name)
  if (name) return name
  const path = extractPath(dashboard)
  return path ? basename(path) : null
}

export function extractBranch(dashboard: ProjectDashboard | null): string | null {
  const vcs = dashboard?.vcs
  if (!vcs) return null
  return pickString(vcs.branch) ?? pickString(vcs.status) ?? null
}

export function filterByQuery<T>(items: T[], query: string, fields: (item: T) => string[]): T[] {
  if (!query.trim()) return items
  const q = query.toLowerCase()
  return items.filter((item) => fields(item).some((f) => f.toLowerCase().includes(q)))
}

export function isImagePart(p: { type: string; mimeType?: string; mime?: string }): boolean {
  const mime = p.mimeType ?? p.mime ?? ""
  return p.type === "image" || (p.type === "file" && mime.startsWith("image/"))
}

export function countImageParts(parts: Array<{ type: string; mimeType?: string; mime?: string }>): number {
  return parts.filter(isImagePart).length
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement("textarea")
      ta.value = text
      ta.style.position = "fixed"
      ta.style.opacity = "0"
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand("copy")
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}
