/**
 * Entidad file — tipos de archivo, diff y estado de proyecto/vcs.
 *
 * Extraído de `web/src/types.ts` (Fase 2).
 * Nota de coordinación: `FileDiff` también existe en `entities/message/model.ts`;
 * `ProjectCurrent`, `VcsStatus`, `FileStatusEntry` y `ProjectDashboard`
 * también existen temporalmente en `entities/session/model.ts`.
 * La deduplicación se resolverá en la fase de unificación del barrel
 * `types.ts`. Este archivo es la fuente canónica para FileEntry / PathInfo
 * / DiffFile / ProjectCurrent / VcsStatus desde el punto de vista de file.
 * Solo tipos puros, sin React/fetch/api.
 */

// ---------------------------------------------------------------------------
// FileDiff — parche asociado a un mensaje (summary diffs)
// Duplicado con entities/message/model.ts — se deduplicará en merge.
// ---------------------------------------------------------------------------
export type FileDiff = {
  file?: string
  patch?: string
  additions: number
  deletions: number
  status?: string
}

// ---------------------------------------------------------------------------
// DiffFile — resumen agregado de cambios por archivo
// ---------------------------------------------------------------------------
export type DiffFile = {
  file: string
  additions: number
  deletions: number
}

// ---------------------------------------------------------------------------
// DiffContent — contenido completo de un diff por archivo
// ---------------------------------------------------------------------------
export type DiffContent = {
  file: string
  content: string
  additions: number
  deletions: number
}

// ---------------------------------------------------------------------------
// FileEntry — entrada del navegador de archivos
// ---------------------------------------------------------------------------
export type FileEntry = {
  name: string
  path: string
  absolute: string
  type: "file" | "directory"
  ignored?: boolean
}

// ---------------------------------------------------------------------------
// FileStatusEntry — estado git por archivo (status por defecto flexible)
// Duplicado con entities/session/model.ts — se deduplicará en merge.
// ---------------------------------------------------------------------------
export type FileStatusEntry = {
  path?: string
  file?: string
  status?: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// PathInfo — rutas relevantes del host (home, config, worktree…)
// ---------------------------------------------------------------------------
export type PathInfo = {
  home: string
  state: string
  config: string
  worktree: string
  directory: string
}

// ---------------------------------------------------------------------------
// ProjectCurrent — proyecto activo
// Duplicado con entities/session/model.ts — se deduplicará en merge.
// ---------------------------------------------------------------------------
export type ProjectCurrent = {
  name?: string
  path?: string
  directory?: string
  root?: string
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// VcsStatus — estado del VCS (branch, ahead/behind…)
// Duplicado con entities/session/model.ts — se deduplicará en merge.
// ---------------------------------------------------------------------------
export type VcsStatus = {
  branch?: string
  status?: string
  ahead?: number
  behind?: number
  [key: string]: unknown
}

// ---------------------------------------------------------------------------
// ProjectDashboard — agregado de proyecto + VCS + archivos cambiados
// Duplicado con entities/session/model.ts — se deduplicará en merge.
// ---------------------------------------------------------------------------
export type ProjectDashboard = {
  project: ProjectCurrent | null
  vcs: VcsStatus | null
  files: FileStatusEntry[]
}
