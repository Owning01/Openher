import type { ServerConfig } from "../../types"
import { log } from "../../utils/log"

export type ApiVersion = "auto" | "v1" | "v2"

export const detectedVersionCache = new Map<string, "v1" | "v2">()
export const detectionPromises = new Map<string, Promise<"v1" | "v2">>()

export function versionKey(config: ServerConfig): string {
  return `${config.host.trim()}:${config.port}`
}

// ---------------------------------------------------------------------------
// Persistencia de la versión detectada (por `host:port`)
//
// Por qué: el sondeo son 2-3 requests SECUENCIALES antes de la primera llamada
// útil y todo `pickV2`/`apiPath` lo espera (medido en :4098: el primer probe es
// un 404 — `/api/health` no existe en el v2 moderno — y recién el segundo
// decide). Con la versión guardada, la carga siguiente la usa al instante y el
// sondeo deja de estar en el camino crítico.
//
// Fallas que este diseño cubre (enumeradas antes del código):
//  1. valor viejo (el server cambió de versión) -> se confirma en background y
//     `rememberApiVersion` corrige + notifica a los suscriptores;
//  2. server caído -> la confirmación NO baja la versión persistida (un server
//     caído no prueba que sea v1), a diferencia del sondeo bloqueante que cae a
//     v1 cuando el probe falla;
//  3. storage bloqueado (modo privado) -> se cae al sondeo de siempre;
//  4. confirmación repetida en cada carga -> TTL: dentro de la ventana no se
//     sondea ni en background;
//  5. server caído + usuario activo -> la confirmación fallida no se reintenta
//     más de una vez por minuto por sesión.
// ---------------------------------------------------------------------------
const STORAGE_PREFIX = "openher.apiVersion."
const CONFIRM_TTL_MS = 30 * 60_000
const CONFIRM_RETRY_MS = 60_000

/** Claves cuyo valor salió del disco y todavía no se confirmó contra el server. */
const persistedHydrated = new Set<string>()
const confirmationsInFlight = new Set<string>()
const lastConfirmAt = new Map<string, number>()

type PersistedVersion = { v: "v1" | "v2"; at: number }

function readPersisted(key: string): PersistedVersion | null {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedVersion>
    if (parsed.v !== "v1" && parsed.v !== "v2") return null
    return { v: parsed.v, at: typeof parsed.at === "number" ? parsed.at : 0 }
  } catch (e) {
    log.info("[version] no se pudo leer la versión persistida; se sondea", e)
    return null
  }
}

function writePersisted(key: string, version: "v1" | "v2"): void {
  try {
    const payload: PersistedVersion = { v: version, at: Date.now() }
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(payload))
  } catch (e) {
    // Sin persistencia el sondeo sigue funcionando: degradación, no falla.
    log.info("[version] no se pudo persistir la versión detectada", e)
  }
}

let healthProbe: ((config: ServerConfig) => Promise<unknown>) | null = null

export function setHealthProbe(probe: (config: ServerConfig) => Promise<unknown>) {
  healthProbe = probe
}

/**
 * Confirma la versión persistida contra el server sin bloquear al llamador.
 * Si el probe determina otra versión, `rememberApiVersion` ya la persiste y
 * notifica; si falla, la versión persistida se mantiene.
 */
function confirmInBackground(config: ServerConfig, key: string): void {
  if (confirmationsInFlight.has(key)) return
  const last = lastConfirmAt.get(key) ?? 0
  if (Date.now() - last < CONFIRM_RETRY_MS) return
  lastConfirmAt.set(key, Date.now())
  confirmationsInFlight.add(key)
  void (async () => {
    let confirmed = false
    try {
      if (healthProbe) {
        await healthProbe(config)
        confirmed = true
      }
    } catch (e) {
      log.info("[version] confirmación en background falló; se mantiene", key, e)
    } finally {
      confirmationsInFlight.delete(key)
      // Confirmada (o sin probe que confirmar): deja de depender del disco.
      if (confirmed) persistedHydrated.delete(key)
    }
  })()
}

export async function ensureVersionDetected(config: ServerConfig): Promise<"v1" | "v2"> {
  if (config.apiVersion === "v1" || config.apiVersion === "v2") return config.apiVersion
  const key = versionKey(config)
  const cached = detectedVersionCache.get(key)
  if (cached) {
    if (persistedHydrated.has(key)) confirmInBackground(config, key)
    return cached
  }
  const persisted = readPersisted(key)
  if (persisted) {
    detectedVersionCache.set(key, persisted.v)
    if (Date.now() - persisted.at > CONFIRM_TTL_MS) {
      persistedHydrated.add(key)
      confirmInBackground(config, key)
    }
    return persisted.v
  }
  let promise = detectionPromises.get(key)
  if (!promise) {
    promise = (async () => {
      try {
        if (healthProbe) {
          await healthProbe(config)
        }
      } catch {
        // server caído: el error real lo reporta el request que sigue
      } finally {
        detectionPromises.delete(key)
      }
      return detectedVersionCache.get(key) ?? "v1"
    })()
    detectionPromises.set(key, promise)
  }
  return promise
}

export function resolveApiVersion(config: ServerConfig): "v1" | "v2" {
  if (config.apiVersion === "v1" || config.apiVersion === "v2") return config.apiVersion
  const key = versionKey(config)
  const cached = detectedVersionCache.get(key)
  if (cached) return cached
  const persisted = readPersisted(key)
  if (!persisted) return "v1"
  // Lectura sync (apiPath la usa en render): hidrata la caché de memoria. La
  // confirmación la dispara `ensureVersionDetected`, no este camino sync.
  detectedVersionCache.set(key, persisted.v)
  if (Date.now() - persisted.at > CONFIRM_TTL_MS) persistedHydrated.add(key)
  return persisted.v
}

export function getApiVersion(config: ServerConfig): Promise<"v1" | "v2"> {
  return ensureVersionDetected(config)
}

export function rememberApiVersion(config: ServerConfig, version: "v1" | "v2") {
  const key = versionKey(config)
  if (detectedVersionCache.get(key) === version) return
  detectedVersionCache.set(key, version)
  writePersisted(key, version)
  versionListeners.forEach((fn) => fn())
}

export const versionListeners = new Set<() => void>()

export function onApiVersionChange(listener: () => void): () => void {
  versionListeners.add(listener)
  return () => {
    versionListeners.delete(listener)
  }
}

export function apiPath(config: ServerConfig, path: string): string {
  return resolveApiVersion(config) === "v2" ? `/api${path}` : path
}

export function unwrapData<T>(raw: T): T {
  if (raw && typeof raw === "object") {
    const candidate = raw as unknown as { data?: unknown }
    if ("data" in candidate) return candidate.data as T
  }
  return raw
}
