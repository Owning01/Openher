import { useState, useMemo } from "react"
import type { SessionView } from "../../../types"
import { filterByQuery, extractPath, extractName, extractBranch } from "../../../utils"
import { groupSessionsByDir, dirKey } from "../../../utils/sessionDirs"

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

  // Group sessions by directory for project-based navigation.
  // Clave normalizada (mayúsculas, / vs \, trailing): el server devuelve el
  // mismo proyecto con escrituras distintas según el endpoint y sin esto el
  // grupo se parte o el lookup de selectedProjectDir falla. display conserva
  // el raw de la primera sesión para mostrar y accionar.
  const groups = useMemo(() => groupSessionsByDir(sessions), [sessions])

  // Compat: mapa por display raw (misma forma que antes).
  const groupedSessions = useMemo(() => new Map(groups), [groups])

  // Lookup tolerante: selectedProjectDir puede venir con otra escritura
  // del mismo dir (deep link, explorer, picker).
  const groupByKey = useMemo(
    () => new Map(groups.map(([display, list]) => [dirKey(display), list] as const)),
    [groups]
  )

  const projects = useMemo(
    () =>
      [...groups].sort(([, aSessions], [, bSessions]) => {
        const aMax = Math.max(...aSessions.map((s) => s.updated || 0))
        const bMax = Math.max(...bSessions.map((s) => s.updated || 0))
        return bMax - aMax
      }),
    [groups]
  )

  const projectSessions = selectedProjectDir ? (groupByKey.get(dirKey(selectedProjectDir)) ?? []) : []

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
