import { useMemo, useSyncExternalStore } from "react"
import type { ServerConfig } from "../../types"
import { pluginBus } from "../../plugins/bus"
import { authHeader, baseUrl } from "../../shared/api/client"

/**
 * Store de debates por sesión (DEBATE.md §2/§3, contrato docs/DEBATE-SCHEMA.json).
 *
 * Clave `originSessionID → debateID → estado`, idempotencia por
 * `(debateID, seq)`. Un debate solo existe en el chat que lo invocó: el
 * filtro por sesión vive acá, no en cada vista.
 *
 * La suscripción al `pluginBus` es singleton a nivel módulo: N paneles
 * montados reciben 1 evento → 1 entrada (el dedupe por seq absorbe el
 * re-emit duplicado de cada `useSSEHandler`).
 *
 * NOTA zustand: el plan pedía zustand, pero añadir la dependencia obligaba a
 * tocar `package.json`/`pnpm-lock.yaml` (fuera de los archivos exclusivos de
 * la fase). Se implementó el store externo equivalente con
 * `useSyncExternalStore` (stdlib React 19): misma semántica keyed + dedupe.
 */

// ---------------------------------------------------------------------------
// Tipos (contrato congelado v2)
// ---------------------------------------------------------------------------

export type DebateMessageKind = "agent" | "user"

export type DebateMessage = {
  seq: number
  role: string
  body: string
  status: string
  confidence?: number
  repliesTo?: string
  blockingIssues: string[]
  kind: DebateMessageKind
  tokensInEst?: number
  tokensOutEst?: number
  ts: number
}

export type DebateActa = {
  kind: "acta"
  text: string
  consensus: boolean
  minorities: string[]
  confidence?: number
  seq: number
  ts: number
}

export type DebateStatusBar = {
  turns: number
  consensusPct: number
  stalled: boolean
  budgetUsedPct?: number
}

export type DebateDone = {
  consensus: boolean
  turns: number
  reason: string
}

export type DebateState = {
  debateID: string
  originSessionID: string
  directory?: string
  topic: string
  engine: string
  roles: string[]
  messages: DebateMessage[]
  status: DebateStatusBar
  acta: DebateActa | null
  done: DebateDone | null
  error: string | null
  running: boolean
  paused: boolean
  seenSeq: Set<number>
  maxSeq: number
  updatedAt: number
}

export type DebateSnapshotMessage = {
  seq?: number
  role?: string
  body?: string
  status?: string
  confidence?: number
  repliesTo?: string
  blockingIssues?: string[]
  kind?: DebateMessageKind
  tokensInEst?: number
  tokensOutEst?: number
  ts?: number
}

export type DebateSnapshot = {
  debateID: string
  originSessionID?: string
  directory?: string
  topic?: string
  engine?: string
  roles?: string[]
  messages?: DebateSnapshotMessage[]
  status?: Partial<DebateStatusBar>
  acta?: { text?: string; consensus?: boolean; minorities?: string[]; confidence?: number; seq?: number; ts?: number } | null
  done?: Partial<DebateDone> | null
  running?: boolean
  seq?: number
}

// Evento DOM para abrir la sala del debate de una sesión (el chip vive en el
// ChatView; el drawer/sheet viven en SessionChatPanel/MobileLayoutView).
export const DEBATE_OPEN_EVENT = "debate:open"

export function openDebateRoom(originSessionID: string): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(DEBATE_OPEN_EVENT, { detail: { originSessionID } }))
}

// ---------------------------------------------------------------------------
// Estado + suscripción externa
// ---------------------------------------------------------------------------

type StoreShape = {
  bySession: Record<string, Record<string, DebateState>>
}

let store: StoreShape = { bySession: {} }
let version = 0
const listeners = new Set<() => void>()

function emit(): void {
  version += 1
  for (const fn of listeners) {
    try {
      fn()
    } catch {
      /* un listener roto no tumba al resto */
    }
  }
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

function getVersion(): number {
  return version
}

export function resetDebateStore(): void {
  store = { bySession: {} }
  emit()
}

function emptyDebate(debateID: string, originSessionID: string, directory?: string): DebateState {
  return {
    debateID,
    originSessionID,
    directory,
    topic: "",
    engine: "isolated",
    roles: [],
    messages: [],
    status: { turns: 0, consensusPct: 0, stalled: false },
    acta: null,
    done: null,
    error: null,
    running: true,
    paused: false,
    seenSeq: new Set(),
    maxSeq: 0,
    updatedAt: Date.now(),
  }
}

function ensureDebate(originSessionID: string, debateID: string, directory?: string): DebateState {
  let byID = store.bySession[originSessionID]
  if (!byID) {
    byID = {}
    store.bySession[originSessionID] = byID
  }
  let deb = byID[debateID]
  if (!deb) {
    deb = emptyDebate(debateID, originSessionID, directory)
    byID[debateID] = deb
  } else if (directory && !deb.directory) {
    deb.directory = directory
  }
  return deb
}

/** seq del evento o, si el emisor no trae (plugin viejo), uno local monotónico. */
function claimSeq(deb: DebateState, raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw
  deb.maxSeq += 1
  return deb.maxSeq
}

// ---------------------------------------------------------------------------
// Ingesta de eventos (v1 compat + v2, dual-emit con mismo seq)
// ---------------------------------------------------------------------------

function asArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined
}

function messageFrom(seq: number, get: (k: string) => unknown): DebateMessage {
  const role = String(get("role") ?? "?")
  const kind: DebateMessageKind = role === "human" || get("kind") === "user" ? "user" : "agent"
  return {
    seq,
    role,
    body: String(get("body") ?? ""),
    status: String(get("status") ?? "UNKNOWN"),
    confidence: asNumber(get("confidence")),
    repliesTo: typeof get("repliesTo") === "string" ? (get("repliesTo") as string) : undefined,
    blockingIssues: asArray(get("blockingIssues")),
    kind,
    tokensInEst: asNumber(get("tokensInEst")),
    tokensOutEst: asNumber(get("tokensOutEst")),
    ts: asNumber(get("ts")) ?? Date.now(),
  }
}

export function ingestDebateEnvelope(event: string, payload: unknown): void {
  if (typeof event !== "string" || !event.startsWith("rpc.debate.")) return
  const kind = event.slice("rpc.debate.".length)
  const p = (payload ?? {}) as Record<string, unknown>
  const data = (p.data && typeof p.data === "object" ? p.data : {}) as Record<string, unknown>
  // La raíz gana: useSSEHandler ya resolvió sessionID/directory con la
  // precedencia p.sessionID ?? p.data.sessionID ?? d.originSessionID.
  const get = (k: string): unknown => (p[k] !== undefined ? p[k] : data[k])
  const debateID = get("debateID")
  if (typeof debateID !== "string" || !debateID) return
  const origin = get("originSessionID") ?? get("sessionID")
  if (typeof origin !== "string" || !origin) return
  const directory = get("directory")
  const deb = ensureDebate(origin, debateID, typeof directory === "string" ? directory : undefined)
  const seq = claimSeq(deb, get("seq"))
  // Idempotencia por (debateID, seq): absorbe el dual-emit v1+v2 y el
  // re-emit de cada panel montado sobre la misma sesión.
  if (deb.seenSeq.has(seq)) return
  deb.seenSeq.add(seq)
  if (seq > deb.maxSeq) deb.maxSeq = seq
  deb.updatedAt = Date.now()

  if (kind === "started") {
    const topic = get("topic")
    const engine = get("engine") ?? get("cache")
    const roles = get("roles")
    if (typeof topic === "string") deb.topic = topic
    if (typeof engine === "string") deb.engine = engine
    if (Array.isArray(roles)) deb.roles = roles.filter((r): r is string => typeof r === "string")
    deb.running = true
    deb.error = null
  } else if (kind === "message" || kind === "turn") {
    deb.messages.push(messageFrom(seq, get))
    deb.running = true
  } else if (kind === "status") {
    const turns = asNumber(get("turns"))
    const pct = asNumber(get("consensusPct"))
    const consensus = get("consensus")
    const stalled = get("stalled")
    const budget = asNumber(get("budgetUsedPct"))
    if (turns !== undefined) deb.status.turns = turns
    if (pct !== undefined) deb.status.consensusPct = pct
    else if (consensus === true) deb.status.consensusPct = 100
    else if (consensus === false) deb.status.consensusPct = 0
    if (typeof stalled === "boolean") deb.status.stalled = stalled
    if (budget !== undefined) deb.status.budgetUsedPct = budget
  } else if (kind === "artifact" || kind === "acta") {
    const text = get("text")
    deb.acta = {
      kind: "acta",
      text: typeof text === "string" ? text : "",
      consensus: get("consensus") === true,
      minorities: asArray(get("minorities")),
      confidence: asNumber(get("confidence")),
      seq,
      ts: asNumber(get("ts")) ?? Date.now(),
    }
  } else if (kind === "done") {
    const turns = asNumber(get("turns"))
    const reason = get("reason")
    deb.done = {
      consensus: get("consensus") === true,
      turns: turns ?? deb.messages.length,
      reason: typeof reason === "string" ? reason : "consensus",
    }
    deb.running = false
  } else if (kind === "error") {
    const message = get("message")
    deb.error = typeof message === "string" ? message : "error"
    deb.running = false
  } else {
    return
  }
  emit()
}

// Suscripción singleton al bus: un solo listener procese de a uno los eventos
// que cada useSSEHandler reemite por panel.
let busSubscribed = false

export function ensureDebateSubscription(): void {
  if (busSubscribed) return
  busSubscribed = true
  pluginBus.on("*", (wrapper: { event?: unknown; payload?: unknown }) => {
    try {
      ingestDebateEnvelope(wrapper?.event as string, wrapper?.payload)
    } catch {
      /* la ingesta nunca rompe el bus */
    }
  })
}

ensureDebateSubscription()

// ---------------------------------------------------------------------------
// Hidratación vía RPC debate/state (al abrir la sala)
// ---------------------------------------------------------------------------

export function hydrateDebate(originSessionID: string, snap: DebateSnapshot): void {
  if (!snap || typeof snap.debateID !== "string" || !snap.debateID) return
  const deb = ensureDebate(originSessionID, snap.debateID, snap.directory)
  if (typeof snap.topic === "string") deb.topic = snap.topic
  if (typeof snap.engine === "string") deb.engine = snap.engine
  if (Array.isArray(snap.roles)) deb.roles = snap.roles.filter((r): r is string => typeof r === "string")
  if (snap.status) {
    if (typeof snap.status.turns === "number") deb.status.turns = snap.status.turns
    if (typeof snap.status.consensusPct === "number") deb.status.consensusPct = snap.status.consensusPct
    if (typeof snap.status.stalled === "boolean") deb.status.stalled = snap.status.stalled
    if (typeof snap.status.budgetUsedPct === "number") deb.status.budgetUsedPct = snap.status.budgetUsedPct
  }
  for (const m of snap.messages ?? []) {
    const seq = typeof m.seq === "number" ? m.seq : deb.maxSeq + 1
    if (deb.seenSeq.has(seq)) continue
    deb.seenSeq.add(seq)
    if (seq > deb.maxSeq) deb.maxSeq = seq
    const role = typeof m.role === "string" ? m.role : "?"
    deb.messages.push({
      seq,
      role,
      body: typeof m.body === "string" ? m.body : "",
      status: typeof m.status === "string" ? m.status : "UNKNOWN",
      confidence: typeof m.confidence === "number" ? m.confidence : undefined,
      repliesTo: typeof m.repliesTo === "string" ? m.repliesTo : undefined,
      blockingIssues: (m.blockingIssues ?? []).filter((x): x is string => typeof x === "string"),
      kind: role === "human" || m.kind === "user" ? "user" : "agent",
      tokensInEst: typeof m.tokensInEst === "number" ? m.tokensInEst : undefined,
      tokensOutEst: typeof m.tokensOutEst === "number" ? m.tokensOutEst : undefined,
      ts: typeof m.ts === "number" ? m.ts : Date.now(),
    })
  }
  deb.messages.sort((a, b) => a.seq - b.seq)
  if (snap.acta) {
    deb.acta = {
      kind: "acta",
      text: typeof snap.acta.text === "string" ? snap.acta.text : "",
      consensus: snap.acta.consensus === true,
      minorities: (snap.acta.minorities ?? []).filter((x): x is string => typeof x === "string"),
      confidence: typeof snap.acta.confidence === "number" ? snap.acta.confidence : undefined,
      seq: typeof snap.acta.seq === "number" ? snap.acta.seq : deb.maxSeq,
      ts: typeof snap.acta.ts === "number" ? snap.acta.ts : Date.now(),
    }
  }
  if (snap.done) {
    deb.done = {
      consensus: snap.done.consensus === true,
      turns: typeof snap.done.turns === "number" ? snap.done.turns : deb.messages.length,
      reason: typeof snap.done.reason === "string" ? snap.done.reason : "consensus",
    }
  }
  if (typeof snap.running === "boolean") deb.running = snap.running
  else if (deb.done) deb.running = false
  if (typeof snap.seq === "number" && snap.seq > deb.maxSeq) deb.maxSeq = snap.seq
  deb.updatedAt = Date.now()
  emit()
}

function rpcHeaders(config: ServerConfig): Record<string, string> {
  const headers: Record<string, string> = { "content-type": "application/json" }
  if (config.username && config.password) headers.authorization = authHeader(config)
  return headers
}

async function postRpc(config: ServerConfig | null, name: string, body: Record<string, unknown>): Promise<unknown> {
  if (!config) return null
  try {
    // El server unificado (opencode v2) exige Rpc.Input = { input: {...} }
    // y responde { output: ... }. Sin el envoltorio devuelve 400 vacío
    // (por eso el debate v1 "ni funcionaba").
    const res = await fetch(`${baseUrl(config)}/api/rpc/debate/${name}`, {
      method: "POST",
      headers: rpcHeaders(config),
      body: JSON.stringify({ input: body }),
    })
    if (!res.ok) return null
    const json = (await res.json()) as { output?: unknown }
    return json?.output ?? null
  } catch {
    return null
  }
}

export async function fetchDebateState(config: ServerConfig | null, debateID: string): Promise<DebateSnapshot | null> {
  if (!config || !debateID) return null
  const out = await postRpc(config, "state", { debateID })
  if (!out || typeof out !== "object") return null
  return out as DebateSnapshot
}

/** Rehidrata desde el server los debates conocidos de la sesión (best-effort). */
export async function rehydrateSessionDebates(config: ServerConfig | null, originSessionID: string): Promise<void> {
  if (!config || !originSessionID) return
  const ids = Object.keys(store.bySession[originSessionID] ?? {})
  for (const debateID of ids) {
    const snap = await fetchDebateState(config, debateID)
    if (snap && snap.debateID) hydrateDebate(originSessionID, { ...snap, debateID })
  }
}

export async function sendDebateIntervene(config: ServerConfig | null, debateID: string, text: string): Promise<boolean> {
  const value = text.trim()
  if (!config || !debateID || !value) return false
  const out = (await postRpc(config, "intervene", { debateID, text: value })) as { seq?: unknown } | null
  // El mensaje entra al canal append-only y vuelve por SSE (rol "human" → "tú").
  return out !== null
}

export async function sendDebateControl(
  config: ServerConfig | null,
  originSessionID: string,
  debateID: string,
  action: "pause" | "resume" | "stop",
): Promise<boolean> {
  if (!config || !debateID) return false
  const out = await postRpc(config, action, { debateID })
  if (out === null) return false
  const byID = store.bySession[originSessionID]
  const deb = byID?.[debateID]
  if (deb) {
    if (action === "pause") deb.paused = true
    else if (action === "resume") deb.paused = false
    else deb.running = false
    deb.updatedAt = Date.now()
    emit()
  }
  return true
}

// ---------------------------------------------------------------------------
// Selectores + hooks
// ---------------------------------------------------------------------------

export function debatesForSession(originSessionID: string): DebateState[] {
  const byID = store.bySession[originSessionID] ?? {}
  return Object.values(byID).sort((a, b) => a.updatedAt - b.updatedAt)
}

export function activeDebateForSession(originSessionID: string): DebateState | null {
  const list = debatesForSession(originSessionID)
  if (list.length === 0) return null
  const running = list.filter((d) => d.running)
  if (running.length > 0) return running[running.length - 1]!
  return list[list.length - 1]!
}

export function useDebatesForSession(originSessionID: string | null | undefined): DebateState[] {
  const tick = useSyncExternalStore(subscribe, getVersion)
  return useMemo(() => {
    void tick
    if (!originSessionID) return []
    return debatesForSession(originSessionID)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, originSessionID])
}

export function useActiveDebate(originSessionID: string | null | undefined): DebateState | null {
  const list = useDebatesForSession(originSessionID)
  if (list.length === 0) return null
  const running = list.filter((d) => d.running)
  if (running.length > 0) return running[running.length - 1]!
  return list[list.length - 1]!
}
