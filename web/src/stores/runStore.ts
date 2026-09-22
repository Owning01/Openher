// Runs (orchestration formal): un Run despacha N tareas, cada una en su propio
// worktree con su propia sesión, y cierra con un gate humano (merge o descarte).
// Es la capa nueva que pedía la fase 6, al lado del bus de equipo: no toca
// `debateStore`. Persiste en localStorage.
import { createStore } from "../shared/lib/store"

export type RunTaskState = "pending" | "creating" | "running" | "done" | "error" | "merged" | "discarded"

export type RunTask = {
  id: string
  /** Nombre corto del agente/tarea (define rama y carpeta). */
  name: string
  worktreePath: string
  branch: string
  sessionID: string
  state: RunTaskState
  error?: string
  updatedAt: number
}

export type Run = {
  id: string
  name: string
  prompt: string
  repoPath: string
  base?: string
  createdAt: number
  /** gate abierto = se puede seguir mergeando/descartando tareas. */
  gate: "open" | "closed"
  tasks: RunTask[]
}

export const RUNS_KEY = "opencode.runs"
export const MAX_RUNS = 12
export const MAX_TASKS_PER_RUN = 8

const str = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined)
const num = (v: unknown): number | undefined => (typeof v === "number" ? v : undefined)

function normalizeTask(raw: unknown): RunTask | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const rawName = str(r.name)
  const name = rawName?.trim() ? rawName.trim().slice(0, 40) : ""
  if (!name) return null
  const state = str(r.state)
  const known: RunTaskState[] = ["pending", "creating", "running", "done", "error", "merged", "discarded"]
  return {
    id: str(r.id) || `task_${Math.random().toString(36).slice(2, 8)}`,
    name,
    worktreePath: str(r.worktreePath) ?? "",
    branch: str(r.branch) ?? "",
    sessionID: str(r.sessionID) ?? "",
    state: state && known.includes(state as RunTaskState) ? (state as RunTaskState) : "pending",
    error: str(r.error)?.slice(0, 300),
    updatedAt: num(r.updatedAt) ?? Date.now(),
  }
}

function normalizeRun(raw: unknown): Run | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const repoPath = str(r.repoPath) ?? ""
  const prompt = str(r.prompt) ?? ""
  if (!repoPath || !prompt.trim()) return null
  const tasks = Array.isArray(r.tasks)
    ? r.tasks.map(normalizeTask).filter((t): t is RunTask => t !== null).slice(0, MAX_TASKS_PER_RUN)
    : []
  const rawName = str(r.name)
  const base = str(r.base)
  return {
    id: str(r.id) || `run_${Math.random().toString(36).slice(2, 8)}`,
    name: rawName?.trim() ? rawName.trim().slice(0, 60) : prompt.trim().slice(0, 40),
    prompt,
    repoPath,
    base: base?.trim() ? base.trim() : undefined,
    createdAt: num(r.createdAt) ?? Date.now(),
    gate: r.gate === "closed" ? "closed" : "open",
    tasks,
  }
}

function load(): Run[] {
  try {
    const raw = localStorage.getItem(RUNS_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    return arr.map(normalizeRun).filter((r: Run | null): r is Run => r !== null).slice(0, MAX_RUNS)
  } catch {
    return []
  }
}

export const runStore = createStore<Run[]>(typeof localStorage === "undefined" ? [] : load())

export function persistRuns(list: Run[]): void {
  runStore.set(list.slice(0, MAX_RUNS))
  try {
    localStorage.setItem(RUNS_KEY, JSON.stringify(runStore.get()))
  } catch {
    // sin persistencia: vive en memoria
  }
}

export function createRun(input: { name: string; prompt: string; repoPath: string; base?: string; taskNames: string[] }): Run | null {
  const names = input.taskNames.map((n) => n.trim()).filter(Boolean).slice(0, MAX_TASKS_PER_RUN)
  const created = normalizeRun({
    id: `run_${Date.now().toString(36)}`,
    name: input.name,
    prompt: input.prompt,
    repoPath: input.repoPath,
    base: input.base,
    createdAt: Date.now(),
    gate: "open",
    tasks: names.map((name) => ({
      id: `task_${name}_${Math.random().toString(36).slice(2, 6)}`,
      name,
      state: "pending",
      updatedAt: Date.now(),
    })),
  })
  if (!created || created.tasks.length === 0) return null
  persistRuns([created, ...runStore.get()])
  return created
}

export function updateRun(id: string, patch: Partial<Pick<Run, "name" | "gate" | "prompt">>): void {
  persistRuns(runStore.get().map((r) => (r.id === id ? { ...r, ...patch } : r)))
}

export function updateRunTask(runID: string, taskID: string, patch: Partial<RunTask>): void {
  persistRuns(
    runStore.get().map((r) =>
      r.id === runID
        ? {
            ...r,
            tasks: r.tasks.map((t) => (t.id === taskID ? { ...t, ...patch, updatedAt: Date.now() } : t)),
          }
        : r
    )
  )
}

export function removeRun(id: string): void {
  persistRuns(runStore.get().filter((r) => r.id !== id))
}

export function runProgress(run: Run): { total: number; done: number; failed: number; open: number } {
  const total = run.tasks.length
  const done = run.tasks.filter((t) => t.state === "done" || t.state === "merged").length
  const failed = run.tasks.filter((t) => t.state === "error").length
  const open = run.tasks.filter((t) => t.state === "running" || t.state === "creating" || t.state === "pending").length
  return { total, done, failed, open }
}
