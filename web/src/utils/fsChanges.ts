// Helpers puros para el auto-refresh del explorador vía /shell/fs/changes.
// El server es Windows: se normaliza a minúsculas con backslash para que
// "C:/a" y "c:\\a\\" comparen igual. Sin estado, 100% testeable.

export function normFsPath(p: string): string {
  return p.replace(/\//g, "\\").replace(/\\+$/, "").toLowerCase()
}

export function parentDirOf(p: string): string {
  const n = normFsPath(p)
  const i = n.lastIndexOf("\\")
  return i > 0 ? n.slice(0, i) : n
}

export type FsChangeEvent = { seq: number; path: string; kind: string }

/** Directorios padre afectados (solo create/remove: lo que cambia un listado) */
export function affectedParentDirs(events: FsChangeEvent[]): string[] {
  const out = new Set<string>()
  for (const e of events) {
    if (e.kind !== "create" && e.kind !== "remove") continue
    if (!e.path) continue
    out.add(parentDirOf(e.path))
  }
  return [...out]
}
