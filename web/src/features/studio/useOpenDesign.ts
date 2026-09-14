import { useCallback, useEffect, useRef, useState } from "react"
import { shell } from "../../shell"

/** Proyecto detectado en el daemon de Open Design (`:3456`). */
export type OpenDesignProject = {
  id: string
  name: string
  directory: string | null
  status: string | null
  updated: number
}

// OpenHer lanza el daemon en 3456; 7456 es el default de Open Design.
const DAEMON_CANDIDATES = ["http://127.0.0.1:3456", "http://127.0.0.1:7456"]
const REQUEST_TIMEOUT_MS = 2500

async function fetchWithTimeout(target: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await shell.proxy.fetch(target, { signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Descubre proyectos generados por Open Design consultando su API a través
 * del proxy Rust de OpenHer (`/shell/proxy`), que no envía `Origin` y por eso
 * el daemon lo acepta como cliente local (evita el 403 de CORS).
 *
 * Cada petición tiene timeout (un daemon colgado no bloquea el fallback) y un
 * id de secuencia (una respuesta vieja no pisa a la nueva).
 */
export function useOpenDesign(enabled: boolean) {
  const [projects, setProjects] = useState<OpenDesignProject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reqRef = useRef(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const refresh = useCallback(async () => {
    const reqId = ++reqRef.current
    setLoading(true)
    setError(null)
    try {
      let base: string | null = null
      for (const candidate of DAEMON_CANDIDATES) {
        try {
          const res = await fetchWithTimeout(`${candidate}/api/health`)
          if (res.ok) {
            base = candidate
            break
          }
        } catch {
          /* try next candidate */
        }
      }
      if (!base) throw new Error("Open Design no está corriendo")

      const listRes = await fetchWithTimeout(`${base}/api/projects`)
      const data = (await listRes.json().catch(() => null)) as { projects?: unknown } | null
      const arr: Array<Record<string, unknown>> = Array.isArray(data?.projects)
        ? (data!.projects as Array<Record<string, unknown>>)
        : []

      const detailed = await Promise.all(
        arr.slice(0, 30).map(async (p) => {
          let directory: string | null = null
          let name = String(p?.name ?? p?.id ?? "")
          let status = (p?.status as { value?: string } | undefined)?.value ?? null
          let updated = 0
          try {
            const d = await fetchWithTimeout(`${base}/api/projects/${String(p.id)}`)
            const detail = (await d.json()) as {
              resolvedDir?: string
              name?: string
              status?: { value?: string }
              updatedAt?: number
              project?: {
                resolvedDir?: string
                name?: string
                status?: { value?: string }
                updatedAt?: number
              }
            }
            const src = detail?.project ?? detail
            directory = src?.resolvedDir ?? null
            name = src?.name ?? name
            status = src?.status?.value ?? status
            updated = src?.updatedAt ?? 0
          } catch {
            /* partial info is fine */
          }
          return { id: String(p.id), name, directory, status, updated }
        })
      )

      if (reqId !== reqRef.current || !mountedRef.current) return
      detailed.sort((a, b) => (b.updated || 0) - (a.updated || 0))
      setProjects(detailed)
    } catch (e) {
      if (reqId !== reqRef.current || !mountedRef.current) return
      setError((e as Error).message || String(e))
      setProjects([])
    } finally {
      if (reqId === reqRef.current && mountedRef.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) void refresh()
  }, [enabled, refresh])

  return { projects, loading, error, refresh }
}
