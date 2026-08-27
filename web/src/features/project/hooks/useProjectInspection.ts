import { useState, useMemo } from "react"
import type { SessionView } from "../../../types"
import { filterByQuery, extractPath, extractName, extractBranch } from "../../../utils"

export type UseProjectInspectionParams = {
  sessions: SessionView[]
  query: string
  projectDashboard: any
  diffFiles: any[]
}

export function useProjectInspection({
  sessions,
  query,
  projectDashboard,
  diffFiles,
}: UseProjectInspectionParams) {
  const [selectedProjectDir, setSelectedProjectDir] = useState<string | null>(null)

  // Group sessions by directory for project-based navigation
  const groupedSessions = useMemo(() => {
    const map = new Map<string, SessionView[]>()
    for (const s of sessions) {
      const dir = s.directory || "/"
      const list = map.get(dir) || []
      list.push(s)
      map.set(dir, list)
    }
    return map
  }, [sessions])

  const projects = useMemo(
    () =>
      [...groupedSessions.entries()].sort(([, aSessions], [, bSessions]) => {
        const aMax = Math.max(...aSessions.map((s) => s.updated || 0))
        const bMax = Math.max(...bSessions.map((s) => s.updated || 0))
        return bMax - aMax
      }),
    [groupedSessions]
  )

  const projectSessions = selectedProjectDir ? groupedSessions.get(selectedProjectDir) ?? [] : []

  const filteredProjects = useMemo(() => {
    return filterByQuery(projects, query, ([dir, sessionsList]) => [
      dir,
      ...sessionsList.map((s) => s.title),
    ])
  }, [projects, query])

  const filteredProjectSessions = useMemo(() => {
    return filterByQuery(projectSessions, query, (s) => [s.title, s.directory])
  }, [projectSessions, query])

  const projectPath = extractPath(projectDashboard)
  const projectName = extractName(projectDashboard)
  const vcsBranch = extractBranch(projectDashboard)

  const totalDiffAdditions = useMemo(
    () => diffFiles.reduce((acc, f) => acc + (f.additions || 0), 0),
    [diffFiles]
  )
  const totalDiffDeletions = useMemo(
    () => diffFiles.reduce((acc, f) => acc + (f.deletions || 0), 0),
    [diffFiles]
  )

  return {
    selectedProjectDir,
    setSelectedProjectDir,
    groupedSessions,
    projects,
    projectSessions,
    filteredProjects,
    filteredProjectSessions,
    projectPath,
    projectName,
    vcsBranch,
    totalDiffAdditions,
    totalDiffDeletions,
  }
}
