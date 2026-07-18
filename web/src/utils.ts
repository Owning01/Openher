import type { ProjectDashboard } from "./types"

export const LANGUAGE_STORAGE_KEY = "opencode.remote.language"

export function isSessionActive(s: { status: string }): boolean {
  return s.status === "busy" || s.status === "retry"
}

export function hasFileChanges(s: { files: number; additions: number; deletions: number }): boolean {
  return s.files > 0 || s.additions > 0 || s.deletions > 0
}

export function formatTime(epoch: number): string {
  if (!epoch || epoch <= 0) return "-"
  return new Date(epoch).toLocaleString()
}

export function noopCatch<T>(fn: () => Promise<T>, def: T): Promise<T> {
  return fn().catch(() => def)
}

export function formatLimit(value?: number): string {
  if (!value) return "-"
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)}M`
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

export function pickString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

export function extractPath(dashboard: ProjectDashboard | null): string | null {
  const project = dashboard?.project
  if (!project) return null
  return pickString(project.path) ?? pickString(project.directory) ?? pickString(project.root) ?? null
}

export function extractName(dashboard: ProjectDashboard | null): string | null {
  const project = dashboard?.project
  if (!project) return null
  const name = pickString(project.name)
  if (name) return name
  const path = extractPath(dashboard)
  return path ? path.split("/").filter(Boolean).pop() ?? path : null
}

export function extractBranch(dashboard: ProjectDashboard | null): string | null {
  const vcs = dashboard?.vcs
  if (!vcs) return null
  return pickString(vcs.branch) ?? pickString(vcs.status) ?? null
}
