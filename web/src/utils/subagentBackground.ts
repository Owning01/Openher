// Detección de subagentes que corren en BACKGROUND.
//
// Cómo lo marca el server (tool `task`): al delegar con `background: true`,
// `ctx.metadata` escribe `state.metadata.background = true` y el tool part queda
// `completed` de inmediato (la sesión hija sigue trabajando aparte). Por eso el
// part NO alcanza para saber si sigue vivo: hay que mirar el estado de la
// SESIÓN HIJA, igual que la TUI (`session_status[childSessionId] !== idle`).
// `metadata.sessionId` trae la sesión hija; `metadata.jobId`, el BackgroundJob.
import { isTaskToolPart } from "./toolName"
import { isSessionActive } from "../utils"

export { isTaskToolPart } from "./toolName"

export type SubagentBackground = {
  /** El tool part fue lanzado con `background: true`. */
  isBackground: boolean
  /** Sesión hija del subagente (para consultar su estado). */
  childSessionID: string | null
  /** Id del BackgroundJob (fallback: la sesión hija). */
  jobID: string | null
}

type PartLike = {
  state?: {
    metadata?: Record<string, unknown> | null
  } | null
} | null | undefined

function str(value: unknown): string | null {
  return typeof value === "string" && value ? value : null
}

export function subagentBackground(part: PartLike): SubagentBackground {
  const meta = part?.state?.metadata
  const childSessionID = str(meta?.sessionId) ?? str(meta?.sessionID)
  return {
    isBackground: meta?.background === true,
    childSessionID,
    jobID: str(meta?.jobId) ?? childSessionID,
  }
}

/** `true` solo si es background Y su sesión hija sigue activa (busy/retry). */
export function isBackgroundRunning(part: PartLike, busySessionIds?: ReadonlySet<string> | null): boolean {
  const info = subagentBackground(part)
  return info.isBackground && !!info.childSessionID && !!busySessionIds?.has(info.childSessionID)
}

/**
 * Chats activos de subagentes de una sesión: hijos (`parentID`) que siguen
 * vivos. Si hay `busySessionIds` manda ese set (mismo criterio que la TUI);
 * si no, se usa el `status` de cada sesión (`isSessionActive`, única fuente
 * para string u objeto `{type}`). Fuente única para el botón del header y
 * cualquier otro listado de subagentes activos.
 */
export function activeSubagentSessions<T extends { id: string; parentID?: string; status?: unknown }>(
  sessions: ReadonlyArray<T | null | undefined>,
  parentID: string | null | undefined,
  busySessionIds?: ReadonlySet<string> | null
): T[] {
  if (!parentID) return []
  return (sessions ?? []).filter(
    (s): s is T =>
      !!s && s.parentID === parentID && (busySessionIds ? busySessionIds.has(s.id) : isSessionActive(s))
  )
}

type TaskLike = {
  tool?: string
  state?: {
    input?: unknown
    metadata?: Record<string, unknown> | null
  } | null
} | null | undefined

/**
 * Subagente que bloquea el turno ahora mismo (foreground, running). El server
 * puede desacoplarlo a background (`experimental.session.background`, Ctrl+B).
 */
export function isForegroundRunningSubagent(
  part: TaskLike & { state?: { status?: string } | null }
): boolean {
  return part?.state?.status === "running" && isTaskToolPart(part) && !subagentBackground(part).isBackground
}
