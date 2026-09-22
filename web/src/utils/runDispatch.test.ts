import { describe, it, expect, beforeEach, vi } from "vitest"
import { discardTask, dispatchRun, dispatchTask, mergeTask, pollRun, type RunDeps } from "./runDispatch"
import { createRun, persistRuns, runStore, updateRunTask } from "../stores/runStore"
import type { ServerConfig } from "../types"

const config = { host: "127.0.0.1", port: 4096, username: "u", password: "", use_ssl: false } as ServerConfig

function deps(over: Partial<RunDeps> = {}): RunDeps {
  return {
    worktreeAdd: vi.fn(async (_repo: string, name: string) => ({ path: `G:/repo.worktrees/${name}`, branch: `openher/${name}` })),
    worktreeRemove: vi.fn(async () => ({ ok: true })),
    mergeBranch: vi.fn(async () => ({ merged: true, conflicts: [], detail: "" })),
    createSession: vi.fn(async () => ({ id: "ses_x" })),
    sendPrompt: vi.fn(async () => true),
    listStatuses: vi.fn(async () => ({ ses_x: { type: "idle" } })),
    ...over,
  }
}

beforeEach(() => {
  localStorage.clear()
  persistRuns([])
})

describe("runDispatch", () => {
  it("dispatch crea worktree + sesión y manda el prompt con el directorio del worktree", async () => {
    const run = createRun({ name: "refactor", prompt: "hacelo", repoPath: "G:/repo", taskNames: ["a"] })!
    const d = deps()
    await dispatchTask(run, run.tasks[0], config, d)
    expect(d.worktreeAdd).toHaveBeenCalledWith("G:/repo", "refactor-a", undefined)
    expect(d.createSession).toHaveBeenCalledWith(config, "refactor · a", "G:/repo.worktrees/refactor-a")
    expect(d.sendPrompt).toHaveBeenCalledWith(config, "ses_x", "hacelo", "G:/repo.worktrees/refactor-a")
    const task = runStore.get()[0].tasks[0]
    expect(task.state).toBe("running")
    expect(task.sessionID).toBe("ses_x")
  })

  it("si falla la sesión, la tarea queda en error con detalle", async () => {
    const run = createRun({ name: "r", prompt: "p", repoPath: "G:/repo", taskNames: ["a"] })!
    const d = deps({ createSession: vi.fn(async () => ({ id: "" })) })
    await dispatchTask(run, run.tasks[0], config, d)
    const task = runStore.get()[0].tasks[0]
    expect(task.state).toBe("error")
    expect(task.error).toContain("no devolvió id")
  })

  it("dispatchRun solo toma las pendientes y respeta el estado ya avanzado", async () => {
    const run = createRun({ name: "r", prompt: "p", repoPath: "G:/repo", taskNames: ["a", "b"] })!
    updateRunTask(run.id, run.tasks[1].id, { state: "merged" })
    const d = deps()
    await dispatchRun(run.id, config, d)
    expect(d.worktreeAdd).toHaveBeenCalledTimes(1)
    expect(runStore.get()[0].tasks[1].state).toBe("merged")
  })

  it("pollRun marca done cuando la sesión está idle", async () => {
    const run = createRun({ name: "r", prompt: "p", repoPath: "G:/repo", taskNames: ["a"] })!
    updateRunTask(run.id, run.tasks[0].id, { state: "running", sessionID: "ses_x", worktreePath: "G:/wt" })
    const changed = await pollRun(run.id, config, deps())
    expect(changed).toBe(1)
    expect(runStore.get()[0].tasks[0].state).toBe("done")
  })

  it("pollRun no toca nada si sigue busy", async () => {
    const run = createRun({ name: "r", prompt: "p", repoPath: "G:/repo", taskNames: ["a"] })!
    updateRunTask(run.id, run.tasks[0].id, { state: "running", sessionID: "ses_x", worktreePath: "G:/wt" })
    const d = deps({ listStatuses: vi.fn(async () => ({ ses_x: { type: "busy" } })) })
    expect(await pollRun(run.id, config, d)).toBe(0)
    expect(runStore.get()[0].tasks[0].state).toBe("running")
  })

  it("merge marca merged, o error con conflictos", async () => {
    const run = createRun({ name: "r", prompt: "p", repoPath: "G:/repo", taskNames: ["a"] })!
    updateRunTask(run.id, run.tasks[0].id, { branch: "openher/a" })
    expect(await mergeTask(run.id, run.tasks[0].id, deps())).toEqual({ merged: true, conflicts: [] })
    expect(runStore.get()[0].tasks[0].state).toBe("merged")

    const run2 = createRun({ name: "r2", prompt: "p", repoPath: "G:/repo", taskNames: ["b"] })!
    updateRunTask(run2.id, run2.tasks[0].id, { branch: "openher/b" })
    const d2 = deps({ mergeBranch: vi.fn(async () => ({ merged: false, conflicts: ["src/a.ts"], detail: "CONFLICT" })) })
    const res = await mergeTask(run2.id, run2.tasks[0].id, d2)
    expect(res.merged).toBe(false)
    expect(res.conflicts).toEqual(["src/a.ts"])
    expect(runStore.get().find((r) => r.id === run2.id)!.tasks[0].error).toContain("src/a.ts")
  })

  it("discard tira el worktree y marca discarded", async () => {
    const run = createRun({ name: "r", prompt: "p", repoPath: "G:/repo", taskNames: ["a"] })!
    updateRunTask(run.id, run.tasks[0].id, { worktreePath: "G:/repo.worktrees/r-a" })
    const d = deps()
    await discardTask(run.id, run.tasks[0].id, d)
    expect(d.worktreeRemove).toHaveBeenCalledWith("G:/repo", "G:/repo.worktrees/r-a")
    expect(runStore.get()[0].tasks[0].state).toBe("discarded")
  })
})
