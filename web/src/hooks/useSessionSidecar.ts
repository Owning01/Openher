import { useState, useCallback } from "react"
import type { ServerConfig, TodoItem, DiffFile, ProjectDashboard } from "../types"
import { api } from "../api"

function toFileStatusList(input: unknown[] | Record<string, unknown>): Array<{ path: string; [key: string]: unknown }> {
  if (Array.isArray(input)) return input as Array<{ path: string; [key: string]: unknown }>
  return Object.entries(input).map(([path, value]) => ({ path, ...(value as object) }))
}

export function useSessionSidecar(config: ServerConfig) {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [diffFiles, setDiffFiles] = useState<DiffFile[]>([])
  const [projectDashboard, setProjectDashboard] = useState<ProjectDashboard | null>(null)
  const [dashboardError, setDashboardError] = useState<string | null>(null)
  const [todosExpanded, setTodosExpanded] = useState(false)
  const [activeDetailSheet, setActiveDetailSheet] = useState<null | "ai" | "details">(null)

  const totalDiffAdditions = diffFiles.reduce((sum, file) => sum + file.additions, 0)
  const totalDiffDeletions = diffFiles.reduce((sum, file) => sum + file.deletions, 0)

  const loadTodos = useCallback(async (sessionID: string, directory: string) => {
    const t = await api.loadTodo(config, sessionID, directory).catch(() => [] as TodoItem[])
    setTodos(t)
  }, [config])

  const loadDiffs = useCallback(async (sessionID: string, directory: string) => {
    const d = await api.loadDiff(config, sessionID, directory).catch(() => [] as DiffFile[])
    setDiffFiles(d)
  }, [config])

  const loadDashboard = useCallback(async (directory: string) => {
    setDashboardError(null)
    try {
      const [project, vcs, fileStatus] = await Promise.all([
        api.loadProjectCurrent(config, directory).catch(() => null),
        api.loadVcs(config, directory).catch(() => null),
        api.loadFileStatus(config, directory).catch(() => [] as unknown[])
      ])
      setProjectDashboard({
        project: project as ProjectDashboard["project"],
        vcs: vcs as ProjectDashboard["vcs"],
        files: toFileStatusList(fileStatus as unknown[] | Record<string, unknown>)
      })
    } catch (err) {
      setDashboardError((err as Error).message)
    }
  }, [config])

  const clearSidecar = useCallback(() => {
    setTodos([])
    setDiffFiles([])
    setProjectDashboard(null)
    setDashboardError(null)
    setActiveDetailSheet(null)
  }, [])

  return {
    todos, setTodos, diffFiles, setDiffFiles,
    projectDashboard, setProjectDashboard, dashboardError, setDashboardError,
    todosExpanded, setTodosExpanded, activeDetailSheet, setActiveDetailSheet,
    totalDiffAdditions, totalDiffDeletions,
    loadTodos, loadDiffs, loadDashboard, clearSidecar
  }
}
