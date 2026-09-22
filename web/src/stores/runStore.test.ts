import { describe, it, expect, beforeEach } from "vitest"
import { createRun, persistRuns, removeRun, runProgress, runStore, updateRun, updateRunTask } from "./runStore"

beforeEach(() => {
  localStorage.clear()
  persistRuns([])
})

describe("runStore", () => {
  it("crea un run con una tarea por agente", () => {
    const run = createRun({ name: "refactor", prompt: "hacelo", repoPath: "G:/repo", taskNames: ["a", "b", "c"] })
    expect(run?.tasks.length).toBe(3)
    expect(run?.gate).toBe("open")
    expect(runStore.get().length).toBe(1)
  })

  it("exige prompt y repo", () => {
    expect(createRun({ name: "x", prompt: "  ", repoPath: "G:/repo", taskNames: ["a"] })).toBeNull()
    expect(createRun({ name: "x", prompt: "p", repoPath: "", taskNames: ["a"] })).toBeNull()
    expect(createRun({ name: "x", prompt: "p", repoPath: "G:/repo", taskNames: [] })).toBeNull()
  })

  it("actualiza tarea y gate", () => {
    const run = createRun({ name: "r", prompt: "p", repoPath: "G:/repo", taskNames: ["a"] })!
    updateRunTask(run.id, run.tasks[0].id, { state: "running", branch: "openher/a" })
    updateRun(run.id, { gate: "closed" })
    const after = runStore.get()[0]
    expect(after.gate).toBe("closed")
    expect(after.tasks[0].state).toBe("running")
    expect(after.tasks[0].branch).toBe("openher/a")
  })

  it("runProgress cuenta done/merged y fallos", () => {
    const run = createRun({ name: "r", prompt: "p", repoPath: "G:/repo", taskNames: ["a", "b", "c"] })!
    updateRunTask(run.id, run.tasks[0].id, { state: "done" })
    updateRunTask(run.id, run.tasks[1].id, { state: "merged" })
    updateRunTask(run.id, run.tasks[2].id, { state: "error" })
    expect(runProgress(runStore.get()[0])).toEqual({ total: 3, done: 2, failed: 1, open: 0 })
  })

  it("remove borra el run", () => {
    const run = createRun({ name: "r", prompt: "p", repoPath: "G:/repo", taskNames: ["a"] })!
    removeRun(run.id)
    expect(runStore.get()).toEqual([])
  })
})
