// Dispatch de un Run: por cada tarea crea un worktree, una sesión dentro de ese
// worktree y le manda el prompt. El poll marca `done` cuando la sesión queda
// idle; el gate humano mergea o descarta (worktree remove).
//
// Todo el I/O entra por parámetro (`deps`) para poder testear sin desktop.
import { api } from "../api"
import { shell } from "../shell"
import { runStore, updateRunTask, type Run, type RunTask } from "../stores/runStore"
import type { ServerConfig } from "../types"

export type RunDeps = {
  worktreeAdd: (repoPath: string, name: string, base?: string) => Promise<{ path: string; branch: string }>
  worktreeRemove: (repoPath: string, worktreePath: string) => Promise<unknown>
  mergeBranch: (repoPath: string, branch: string) => Promise<{ merged: boolean; conflicts: string[]; detail: string }>
  createSession: (config: ServerConfig, title: string, worktreePath: string) => Promise<{ id: string }>
  sendPrompt: (config: ServerConfig, sessionID: string, text: string, directory?: string) => Promise<unknown>
  listStatuses: (config: ServerConfig, directory?: string) => Promise<Record<string, { type?: string }>>
}

export function defaultRunDeps(): RunDeps {
  return {
    worktreeAdd: (repoPath, name, base) => shell.git.worktreeAdd(repoPath, name, base),
    worktreeRemove: (repoPath, worktreePath) => shell.git.worktreeRemove(repoPath, worktreePath, true),
    mergeBranch: (repoPath, branch) => shell.git.mergeBranch(repoPath, branch),
    createSession: async (config, title, worktreePath) => {
      const s = await api.createSession(config, title, undefined, worktreePath)
      return { id: String((s as any)?.id ?? "") }
    },
    sendPrompt: (config, sessionID, text, directory) => api.sendPrompt(config, sessionID, text, directory),
    listStatuses: (config, directory) => api.listStatuses(config, directory),
  }
}

const errText = (e: unknown): string => (e instanceof Error ? e.message : typeof e === "string" ? e : "error")

/** Crea worktree + sesión y manda el prompt de la tarea. */
export async function dispatchTask(run: Run, task: RunTask, config: ServerConfig, deps: RunDeps = defaultRunDeps()): Promise<void> {
  updateRunTask(run.id, task.id, { state: "creating", error: undefined })
  try {
    const wt = await deps.worktreeAdd(run.repoPath, `${run.name}-${task.name}`.slice(0, 40), run.base)
    updateRunTask(run.id, task.id, { worktreePath: wt.path, branch: wt.branch, state: "running" })
    const session = await deps.createSession(config, `${run.name} · ${task.name}`, wt.path)
    if (!session.id) throw new Error("la sesión no devolvió id")
    updateRunTask(run.id, task.id, { sessionID: session.id })
    await deps.sendPrompt(config, session.id, run.prompt, wt.path)
  } catch (e) {
    updateRunTask(run.id, task.id, { state: "error", error: errText(e) })
  }
}

/** Despacha todas las tareas pendientes de un run (secuencial: evita saturar). */
export async function dispatchRun(runID: string, config: ServerConfig, deps: RunDeps = defaultRunDeps()): Promise<void> {
  const run = runStore.get().find((r) => r.id === runID)
  if (!run) return
  for (const task of run.tasks) {
    if (task.state !== "pending") continue
    const fresh = runStore.get().find((r) => r.id === runID)
    const current = fresh?.tasks.find((t) => t.id === task.id)
    if (!current || current.state !== "pending") continue
    await dispatchTask(run, current, config, deps)
  }
}

/** Marca `done` las tareas cuya sesión quedó idle. */
export async function pollRun(runID: string, config: ServerConfig, deps: RunDeps = defaultRunDeps()): Promise<number> {
  const run = runStore.get().find((r) => r.id === runID)
  if (!run) return 0
  const active = run.tasks.filter((t) => t.state === "running" && t.sessionID && t.worktreePath)
  if (active.length === 0) return 0
  let changed = 0
  // Un listStatuses por directorio (cada tarea vive en su worktree).
  for (const task of active) {
    try {
      const statuses = await deps.listStatuses(config, task.worktreePath)
      const st = statuses?.[task.sessionID]
      const busy = st?.type === "busy" || st?.type === "retry"
      if (st && !busy) {
        updateRunTask(runID, task.id, { state: "done" })
        changed += 1
      }
    } catch {
      // sin estado (servidor caído): se reintenta en el próximo tick
    }
  }
  return changed
}

/** Gate: mergea la rama de la tarea en el repo principal. */
export async function mergeTask(runID: string, taskID: string, deps: RunDeps = defaultRunDeps()): Promise<{ merged: boolean; conflicts: string[] }> {
  const run = runStore.get().find((r) => r.id === runID)
  const task = run?.tasks.find((t) => t.id === taskID)
  if (!run || !task?.branch) return { merged: false, conflicts: [] }
  try {
    const res = await deps.mergeBranch(run.repoPath, task.branch)
    if (res.merged) {
      updateRunTask(runID, taskID, { state: "merged", error: undefined })
      return { merged: true, conflicts: [] }
    }
    updateRunTask(runID, taskID, { state: "error", error: res.conflicts.length > 0 ? `conflictos: ${res.conflicts.join(", ")}` : res.detail })
    return { merged: false, conflicts: res.conflicts }
  } catch (e) {
    updateRunTask(runID, taskID, { state: "error", error: errText(e) })
    return { merged: false, conflicts: [] }
  }
}

/** Gate: tira el worktree de la tarea (sin tocar la rama, no se pierde trabajo). */
export async function discardTask(runID: string, taskID: string, deps: RunDeps = defaultRunDeps()): Promise<void> {
  const run = runStore.get().find((r) => r.id === runID)
  const task = run?.tasks.find((t) => t.id === taskID)
  if (!run || !task?.worktreePath) return
  try {
    await deps.worktreeRemove(run.repoPath, task.worktreePath)
    updateRunTask(runID, taskID, { state: "discarded", error: undefined })
  } catch (e) {
    updateRunTask(runID, taskID, { state: "error", error: errText(e) })
  }
}
