import { useCallback, useEffect, useMemo, useState } from "react"
import { shell } from "../../shell"
import { useDevServer } from "../../hooks/useDevServer"
import { basenameFsPath } from "../../shared/lib/filePaths.ts"

/** Proyecto activo del Estudio (carpeta servida + metadatos de preview). */
export type StudioProject = {
  directory: string
  name: string
  kind: "static" | "node"
  token: string
  entryPoint: string
  htmlFiles: string[]
}

const STORAGE_KEY = "opencode.studio.project"

function readStored(): StudioProject | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StudioProject>
    return parsed && typeof parsed.directory === "string" && typeof parsed.token === "string"
      ? (parsed as StudioProject)
      : null
  } catch {
    return null
  }
}

/**
 * Estado del proyecto del Estudio: sirve la carpeta (fallback estático vía
 * `/shell/preview/<token>`) y delega el dev server con hot-reload a
 * `useDevServer`. Persiste el proyecto activo en localStorage.
 */
export function useStudioProject() {
  const [project, setProject] = useState<StudioProject | null>(readStored)
  const [serving, setServing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const devServer = useDevServer(project?.directory)

  useEffect(() => {
    try {
      if (project) localStorage.setItem(STORAGE_KEY, JSON.stringify(project))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore quota/privacy errors */
    }
  }, [project])

  const openDirectory = useCallback(async (dir: string): Promise<boolean> => {
    setServing(true)
    setError(null)
    try {
      const res = await shell.project.serve(dir)
      if (!res?.ok || !res.token) throw new Error("No se pudo servir la carpeta")
      setProject({
        directory: res.directory || dir,
        name: basenameFsPath(res.directory || dir),
        kind: res.hasPackageJson ? "node" : "static",
        token: res.token,
        entryPoint: res.entrypoint || "index.html",
        htmlFiles: res.htmlFiles?.length ? res.htmlFiles : ["index.html"],
      })
      setReloadKey((k) => k + 1)
      return true
    } catch (e) {
      setError((e as Error).message || String(e))
      return false
    } finally {
      setServing(false)
    }
  }, [])

  const openFolder = useCallback(async (): Promise<boolean> => {
    setError(null)
    const res = await shell.fs.pickFolder().catch(() => null)
    if (!res?.ok || !res.path) return false
    return openDirectory(res.path)
  }, [openDirectory])

  const close = useCallback(() => {
    setProject(null)
    setError(null)
  }, [])

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  const selectEntry = useCallback((entryPoint: string) => {
    setProject((p) => (p ? { ...p, entryPoint } : p))
    setReloadKey((k) => k + 1)
  }, [])

  const startDev = useCallback(async (): Promise<string | null> => {
    try {
      return await devServer.startDevServer()
    } catch (e) {
      setError((e as Error).message || String(e))
      return null
    }
  }, [devServer])

  const previewUrl = useMemo(() => {
    if (!project) return ""
    if (devServer.status === "running" && devServer.serverUrl) return devServer.serverUrl
    return `${window.location.origin}/shell/preview/${project.token}/${project.entryPoint || "index.html"}`
  }, [project, devServer.status, devServer.serverUrl])

  return {
    project,
    previewUrl,
    serving,
    error,
    reloadKey,
    devServer,
    startDev,
    openFolder,
    openDirectory,
    close,
    reload,
    selectEntry,
    setError,
  }
}
