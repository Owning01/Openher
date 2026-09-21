// Fetch + merge del listado de sesiones, fuera de React (B7).
// `refreshSessions` era ~208 LOC dentro de hooks/useSessions; acá queda la
// parte pura de datos: `fetchSessionsPlan` (IO + normalización) y
// `planSessionUpdate` (merge/dedupe/orden sobre el estado actual).

import type { ServerConfig, Session, SessionView, SessionStatus } from "../../types"
import { api } from "../../api"
import { getOpencodeClient } from "../../shared/api/opencodeClient"
import { toSessionV1 } from "../../shared/api/mappers"
import { buildDirPlan, dirKey, keepUncoveredSessions } from "../../utils/sessionDirs"
// ---- Mapeo Session (+status) -> SessionView y merge del poll (B7).
// Viven aca (modulo runtime, fuera del barrel) y NO en model.ts: los modelos de
// entities/* son type-only y entities/barrel.test.ts lo pinea (Object.keys vacio).

export function toSessionView(session: Session, status?: SessionStatus): SessionView {
  return {
    id: session.id,
    title: session.title,
    directory: session.directory,
    updated: session.time.updated,
    status: status?.type ?? "idle",
    files: session.summary?.files ?? 0,
    additions: session.summary?.additions ?? 0,
    deletions: session.summary?.deletions ?? 0,
    tokens: session.tokens,
    cost: session.cost,
    agent: session.agent,
    parentID: session.parentID,
    revert: session.revert ? { messageID: session.revert.messageID, partID: session.revert.partID } : undefined,
    model: session.model ? { providerID: session.model.providerID, modelID: session.model.id, variant: session.model.variant } : undefined
  }
}

/**
 * Merge de un poll liviano: pisa lo que vino del server y conserva el status
 * local cuando el dir de la sesión no fue consultado en este ciclo. Sin esto,
 * el poll liviano (sin statuses) pisaba busy→idle y el indicador de "activo"
 * del chat y la lista se apagaba solo aunque la sesión siguiera trabajando.
 */
export function mergeSessionPoll(existing: SessionView | undefined, incoming: SessionView, statusFresh: boolean): SessionView {
  return {
    ...existing,
    ...incoming,
    status: statusFresh ? incoming.status : existing?.status ?? incoming.status,
  }
}

// v2 /session devuelve 50 por defecto. El refresh COMPLETO (carga inicial,
// refresh manual, borrar/renombrar) reconstruye el estado con backfill por
// directorio: N respuestas chicas (una por proyecto) en vez de una sola
// gigante, que en el puente nativo (CapacitorHttp) es frágil.
const BACKFILL_SESSION_LIMIT = 1000

// Unión de directorios vistos por servidor: si el global viene parcial (scope
// del server, límite del API) o /project falla, los proyectos viejos NO
// desaparecen. Persistida en localStorage.
const KNOWN_DIRS_KEY = "opencode.knownSessionDirs"

function loadKnownDirs(serverKey: string): string[] {
  try {
    const all = JSON.parse(localStorage.getItem(KNOWN_DIRS_KEY) || "{}") as Record<string, unknown>
    const arr = all?.[serverKey]
    return Array.isArray(arr) ? arr.filter((d): d is string => typeof d === "string" && !!d) : []
  } catch {
    return []
  }
}

function saveKnownDirs(serverKey: string, dirs: string[]) {
  try {
    const all = JSON.parse(localStorage.getItem(KNOWN_DIRS_KEY) || "{}") as Record<string, unknown>
    all[serverKey] = dirs
    localStorage.setItem(KNOWN_DIRS_KEY, JSON.stringify(all))
  } catch {
    /* storage lleno o bloqueado: el historial en memoria sigue */
  }
}

const knownDirsHistoryRef: { current: { key: string; dirs: string[] } } = {
  current: { key: "", dirs: [] },
}

export type SessionsPlan = {
  mapped: SessionView[]
  verifiedKeys: Set<string>
  statusFreshKeys: Set<string>
}

export type FetchSessionsPlanInput = {
  config: ServerConfig
  full: boolean
  // Lecturas diferidas: el hook las resuelve contra su ref en el mismo punto
  // del ciclo async que antes (no antes de los awaits).
  getStateDirs: () => string[]
  getSelectedDir: () => string | undefined
}

export async function fetchSessionsPlan(input: FetchSessionsPlanInput): Promise<SessionsPlan> {
  const { config, full, getStateDirs, getSelectedDir } = input
  // Intento con client tipado @opencode-ai/client (nuevo), fallback a api manual
  // V2 devuelve V2Session {location:{directory}} → hay que mapear a Session {directory} vía toSessionV1
  const tryTypedList = async (): Promise<Session[]> => {
    try {
      const client = await getOpencodeClient(config)
      // @ts-ignore — client generado, método puede variar según versión beta
      const raw = await (client as any).session?.list?.({ directory: undefined })
      const normalize = (arr: unknown[]): Session[] => {
        // Detección por elemento (no solo arr[0]): arrays mixtos v1/v2
        // no se mapean mal en bloque.
        const out: Session[] = []
        for (const it of arr) {
          const o = it as Record<string, unknown>
          const dir = (o as unknown as { directory?: unknown }).directory
          const isV2 = o && typeof o === "object" && "location" in o && (!("directory" in o) || dir === "" || dir == null)
          if (!isV2) {
            out.push(it as Session)
            continue
          }
          try {
            out.push(toSessionV1(it as unknown as import("../../shared/api/mappers").V2Session))
          } catch {
            out.push(it as Session)
          }
        }
        return out
      }
      if (Array.isArray(raw)) return normalize(raw)
      if (raw && Array.isArray((raw as unknown as { data: unknown[] }).data)) return normalize((raw as unknown as { data: unknown[] }).data)
    } catch {
      // fallback silencioso
    }
    return api.listGlobalSessions(config).catch(() => api.listSessions(config))
  }
  const [items, projects] = await Promise.all([
    tryTypedList(),
    // Los dirs de /project solo alimentan el plan de backfill, que corre
    // en full: en polls sería un request extra por intervalo.
    full ? api.listProjects(config).catch(() => []) : Promise.resolve([]),
  ])

  const MAX_KNOWN_DIRS = 150
  // Ámbito por servidor: al cambiar de perfil/host el historial ajeno
  // solo ocuparía slots del cap y ocultaría proyectos locales.
  const serverKey = `${config.host}:${config.port}:${config.username ?? ""}`
  if (knownDirsHistoryRef.current.key !== serverKey) {
    knownDirsHistoryRef.current = { key: serverKey, dirs: loadKnownDirs(serverKey) }
  }
  // Nunca olvidar lo visible: si el global viene parcial, los dirs de la
  // UI actual alimentan el backfill por-dir.
  const stateDirs = getStateDirs()
  const { query: backfillDirs, history: nextHistory } = buildDirPlan({
    itemDirs: items.map((s) => s.directory).filter((d) => Boolean(d)),
    stateDirs,
    projectDirs: projects.map((p) => p.directory).filter((d) => Boolean(d)),
    historyDirs: knownDirsHistoryRef.current.dirs,
    cap: MAX_KNOWN_DIRS,
  })
  knownDirsHistoryRef.current = { key: serverKey, dirs: nextHistory }
  saveKnownDirs(serverKey, nextHistory)
  // Dirs verificados con éxito: cada backfill por-dir que respondió
  // completo. Un dir que FALLÓ (o vino truncado) queda fuera: en el
  // reemplazo full sus sesiones se conservan (ausencia no prueba borrado).
  const verifiedKeys = new Set<string>()

  const directories = nextHistory
  const chunk = <T>(arr: T[], size: number) => {
    const chunks: T[][] = []
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
    return chunks
  }
  const allSessionLists: Session[][] = []
  const allStatusLists: Record<string, SessionStatus>[] = []
  // Reconstrucción COMPLETA solo en full (carga inicial, refresh manual,
  // borrar/renombrar): el global viene recortado a 50 y una respuesta
  // gigante (limit=5000) es frágil en el puente nativo de Android.
  //   1) sesiones por proyecto (v2) → cubre todas, en respuestas acotadas
  //   2) dirs huérfanos del plan → sesiones sin proyecto o de scope raro
  //   3) statuses busy/retry por dir con sesiones
  if (full) {
    const projectIds = [...new Set(projects.map((p) => p.id).filter(Boolean))]
    for (const c of chunk(projectIds, 10)) {
      const lists = await Promise.all(c.map(async (pid) => {
        try {
          const list = await api.listSessionsByProject(config, pid, BACKFILL_SESSION_LIMIT)
          // Truncado por el límite: no verificar, para no descartar las
          // sesiones viejas que ya estaban en la UI.
          if (list.length < BACKFILL_SESSION_LIMIT) {
            for (const s of list) verifiedKeys.add(dirKey(s.directory))
          }
          return list
        } catch {
          // Fallo parcial: sus dirs quedan NO verificados y las sesiones
          // actuales se conservan (ver keepUncoveredSessions).
          return null
        }
      }))
      for (const list of lists) if (list) allSessionLists.push(list)
    }
    const coveredByProjects = new Set(allSessionLists.flat().map((s) => dirKey(s.directory)))
    const orphanDirs = directories.filter((d) => !coveredByProjects.has(dirKey(d)))
    for (const c of chunk(orphanDirs, 10)) {
      const lists = await Promise.all(c.map(async (d) => {
        try {
          const list = await api.listSessions(config, d, BACKFILL_SESSION_LIMIT)
          if (list.length < BACKFILL_SESSION_LIMIT) verifiedKeys.add(dirKey(d))
          return list
        } catch {
          return null
        }
      }))
      for (const list of lists) if (list) allSessionLists.push(list)
    }
  }

  // Status busy/retry por dir: en full, todos los dirs conocidos; en el
  // poll liviano, los visibles (cap 8, priorizando la sesión abierta).
  // Antes el poll liviano no traía statuses y el merge los pisaba con
  // "idle": el "activo" del chat/lista se apagaba solo aunque el server
  // siguiera trabajando.
  const selectedDir = getSelectedDir()
  const statusDirs: string[] = full
    ? [...new Set([
        ...directories,
        ...items.map((s) => s.directory),
        ...allSessionLists.flat().map((s) => s.directory),
      ].filter((d): d is string => Boolean(d)))]
    : [...new Set([selectedDir, ...stateDirs].filter((d): d is string => Boolean(d)))].slice(0, 8)
  for (const c of chunk(statusDirs, 10)) {
    const st = await Promise.all(c.map((d) => api.listStatuses(config, d).catch(() => ({} as Record<string, SessionStatus>))))
    allStatusLists.push(...st)
  }
  const fetchedStatusDirs = new Set(statusDirs.map((d) => dirKey(d)))

  const allSessionsMap = new Map<string, Session>()
  for (const s of items) if (s.id) allSessionsMap.set(s.id, s as Session)
  for (const s of allSessionLists.flat()) if (s.id) allSessionsMap.set(s.id, s)

  const allStatuses = new Map<string, SessionStatus>()
  for (const sm of allStatusLists) {
    for (const [id, st] of Object.entries(sm)) {
      if (!allStatuses.has(id)) allStatuses.set(id, st)
    }
  }

  const mapped = [...allSessionsMap.values()]
    .map((s) => toSessionView(s, allStatuses.get(s.id)))
    .sort((a, b) => b.updated - a.updated)

  // Diagnóstico "solo 3 proyectos": activar con localStorage.debug.sessions=1
  if (typeof localStorage !== "undefined" && localStorage.getItem("debug.sessions") === "1") {
    const dirCounts = new Map<string, number>()
    for (const s of mapped) if (s.directory) dirCounts.set(s.directory, (dirCounts.get(s.directory) ?? 0) + 1)
    console.info(`[sessions] full=${full} raw=${items.length} projects=${projects.length} dirsCandidatas=${directories.length} backfill=${backfillDirs.length} total=${mapped.length}`, [...dirCounts.entries()].slice(0, 20))
  }

  return { mapped, verifiedKeys, statusFreshKeys: fetchedStatusDirs }
}

export type SessionUpdateInput = {
  current: SessionView[]
  mapped: SessionView[]
  full: boolean
  verifiedKeys: Set<string>
  statusFreshKeys: Set<string>
  selectedID: string | null
}

// Merge/dedupe/orden de la lista visible a partir del plan. Misma conducta
// que el updater inline que vivía en el hook.
export function planSessionUpdate(input: SessionUpdateInput): SessionView[] {
  const { current, mapped, full, verifiedKeys, statusFreshKeys, selectedID } = input
  // full=true (delete/rename/crear/refresh manual) => reemplazo, pero
  // solo suelta sesiones de dirs VERIFICADOS (el server informó sobre
  // ellos: la ausencia es borrado real). Lo de dirs con fallo parcial
  // se conserva: antes un backfill caído borraba proyectos enteros de
  // la UI de forma intermitente.
  if (full) {
    const mappedIds = new Set(mapped.map((m) => m.id))
    const kept = keepUncoveredSessions(current, mappedIds, (d) => verifiedKeys.has(dirKey(d)))
    const result = [...mapped, ...kept].sort((a, b) => b.updated - a.updated)
    const selected = selectedID ? result.find((s) => s.id === selectedID) : null
    if (!selected && selectedID) {
      const keep = current.find((s) => s.id === selectedID)
      if (keep) return [keep, ...result].sort((a, b) => b.updated - a.updated)
    }
    return result
  }
  const currentMap = new Map(current.map((s) => [s.id, s]))
  for (const m of mapped) {
    const existing = currentMap.get(m.id)
    currentMap.set(m.id, mergeSessionPoll(existing, m, statusFreshKeys.has(dirKey(m.directory))))
  }
  const result = [...currentMap.values()].sort((a, b) => b.updated - a.updated)
  const selected = selectedID ? result.find((s) => s.id === selectedID) : null
  if (!selected || result.some((s) => s.id === selected.id)) return result
  return [selected, ...result].sort((a, b) => b.updated - a.updated)
}
