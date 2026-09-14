// Autodescubrimiento del server opencode local (agnóstico del origen).
//
// La config del servidor vive en localStorage, que es POR ORIGEN. Un origen
// nuevo no la tiene: pestaña con `localhost` vs `127.0.0.1` (orígenes distintos
// para el navegador), segunda instancia del desktop en otro puerto, o navegador
// externo. Peor: el shell de escritorio inyecta su config guardada, que puede
// estar stale (default 127.0.0.1:4096 sin password) → la app vuelve a pedir
// los datos del servidor.
//
// Solución: cuando no hay config o la guardada es loopback, probar candidatos
// locales (host/puerto/credenciales documentadas) y quedarse con el primero que
// responda /health. Así cualquier pestaña/instancia se auto-conecta al mismo
// server sin reingresar datos.
import type { ServerConfig } from "../types"

export type ServerDiscovery = { config: ServerConfig; version: string }

export type HealthCheck = (config: ServerConfig) => Promise<{ version?: string }>

const DEFAULT_TIMEOUT_MS = 1500
const MAX_CANDIDATES = 18
const DEFAULT_HOSTS = ["127.0.0.1", "localhost"]
const DEFAULT_PORTS = [4096, 4098, 4097]
// Credenciales documentadas del setup local (mismo fallback que testConnection
// para el servicio opencode2 de este equipo).
const DEFAULT_CREDENTIALS: Array<Pick<ServerConfig, "username" | "password">> = [
  { username: "opencode", password: "" },
  { username: "opencode", password: "octavio" },
]

export function isLoopbackHost(host: string | undefined | null): boolean {
  const h = String(host || "").trim().toLowerCase()
  return h === "" || h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]" || h === "0.0.0.0"
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("discovery_timeout")), ms)),
  ])
}

// Orden: config guardada primero (si responde, no cambia nada), después el host
// del origen actual, después loopback; puertos y credenciales documentados.
export function discoveryCandidates(stored: ServerConfig | null | undefined, hostname?: string): ServerConfig[] {
  const hosts: string[] = []
  const pushHost = (h?: string | null) => {
    const v = String(h || "").trim()
    if (v && !hosts.includes(v)) hosts.push(v)
  }
  pushHost(stored?.host)
  pushHost(hostname)
  DEFAULT_HOSTS.forEach(pushHost)

  const ports: number[] = []
  const pushPort = (p?: number | null) => {
    if (p && Number.isFinite(p) && p > 0 && !ports.includes(p)) ports.push(p)
  }
  pushPort(stored?.port)
  DEFAULT_PORTS.forEach(pushPort)

  const creds: Array<Pick<ServerConfig, "username" | "password">> = []
  const pushCred = (c?: Pick<ServerConfig, "username" | "password"> | null) => {
    if (c && c.username && !creds.some((x) => x.username === c.username && x.password === c.password)) creds.push(c)
  }
  pushCred(stored ? { username: stored.username, password: stored.password } : null)
  DEFAULT_CREDENTIALS.forEach(pushCred)

  const out: ServerConfig[] = []
  const seen = new Set<string>()
  for (const host of hosts) {
    for (const port of ports) {
      for (const cred of creds) {
        const key = `${host}:${port}:${cred.username}:${cred.password}`
        if (seen.has(key)) continue
        seen.add(key)
        out.push({ host, port, username: cred.username, password: cred.password, apiVersion: stored?.apiVersion ?? "auto" })
      }
    }
  }
  return out.slice(0, MAX_CANDIDATES)
}

export async function discoverServer(opts: {
  health: HealthCheck
  stored?: ServerConfig | null
  hostname?: string
  timeoutMs?: number
}): Promise<ServerDiscovery | null> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const hostname = opts.hostname ?? (typeof window !== "undefined" ? window.location.hostname : undefined)
  for (const config of discoveryCandidates(opts.stored, hostname)) {
    try {
      const health = await withTimeout(Promise.resolve(opts.health(config)), timeoutMs)
      return { config, version: String(health?.version ?? "") }
    } catch { /* siguiente candidato */ }
  }
  return null
}
