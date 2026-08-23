/**
 * Entidad agent — tipos de agente, modelo, proveedor y estadísticas.
 *
 * Extraído de `web/src/types.ts` (Fase 2).
 * Nota de coordinación: `ModelSelection` y `ProviderInfo` también existen
 * temporalmente en `entities/session` y `entities/ui`. La deduplicación se
 * resolverá en la fase de unificación del barrel `types.ts`.
 * Este archivo es la fuente canónica para AgentOption / ModelOption /
 * Question / Permission / Stats desde el punto de vista de agent.
 * Solo tipos puros, sin React/fetch/api.
 */

import type { ModelSelection } from "../session/model.ts"

// ---------------------------------------------------------------------------
// AgentOption — agente disponible (primary / subagent / all)
// ---------------------------------------------------------------------------
export type AgentOption = {
  id: string
  name: string
  description?: string
  mode: "primary" | "subagent" | "all"
  hidden?: boolean
  prompt?: string
  model?: { providerID?: string; modelID?: string }
}

// ---------------------------------------------------------------------------
// ModelOption — ModelSelection enriquecido con metadatos de catálogo
// ---------------------------------------------------------------------------
export type ModelOption = ModelSelection & {
  providerName: string
  modelName: string
  status?: string
  contextLimit?: number
  outputLimit?: number
  tools?: boolean
  attachments?: boolean
  isDefault?: boolean
}

// ---------------------------------------------------------------------------
// ProviderInfo — resumen de proveedor para UI/selección
// Duplicado potencial con entities/ui/model.ts — se deduplicará en merge.
// ---------------------------------------------------------------------------
export type ProviderInfo = {
  id: string
  name: string
  modelsCount: number
  connected: boolean
}

// ---------------------------------------------------------------------------
// ServerProvider — proveedor tal como lo devuelve el servidor opencode
// ---------------------------------------------------------------------------
export type ServerProvider = {
  id: string
  name: string
  source: "env" | "config" | "custom" | "api"
  env: string[]
  key?: string
  models: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// ServerProviderList — colección de proveedores del servidor
// ---------------------------------------------------------------------------
export type ServerProviderList = {
  all: ServerProvider[]
  default: Record<string, string>
  connected: string[]
}

// ---------------------------------------------------------------------------
// CommandInfo — comando / skill / mcp disponible
// ---------------------------------------------------------------------------
export type CommandInfo = {
  name: string
  description?: string
  source?: "command" | "mcp" | "skill"
}

// ---------------------------------------------------------------------------
// Question — sistema de preguntas interactivas del agente
// ---------------------------------------------------------------------------
export type QuestionOption = {
  label: string
  description?: string
}

export type QuestionInfo = {
  question: string
  header?: string
  options: QuestionOption[]
  multiple?: boolean
  custom?: boolean
}

export type Question = {
  id: string
  sessionID?: string
  status?: string
  question?: string
  questions?: QuestionInfo[]
  tool?: { messageID: string; callID: string }
}

// ---------------------------------------------------------------------------
// PermissionRequest — solicitud de permiso del agente
// ---------------------------------------------------------------------------
export type PermissionRequest = {
  requestID: string
  permission: string
  status: string
  directory?: string
  sessionID?: string
}

// ---------------------------------------------------------------------------
// Stats — métricas y agregaciones del servidor
// ---------------------------------------------------------------------------
export type StatsMeta = {
  sessions: number
  models: number
  since: string
  until: string
  avg_cost: number
  db: string
  filtered: boolean
}

export type StatsTotals = {
  input: number
  output: number
  reasoning: number
  cache_read: number
  cache_write: number
}

export type StatsRow = {
  key?: string
  model?: string
  id?: string
  title?: string
  start?: string
  sessions: number
  requests?: number
  input: number
  output: number
  reasoning: number
  cache_read: number
  cache_write: number
  cost: number
  est?: number
}

export type StatsLimitRow = {
  model: string
  u5h: number
  u7d: number
  u30d: number
  l5h: number | null
  l7d: number | null
  l30d: number | null
}

export type StatsPriceRow = {
  model: string
  in: number
  out: number
  cr: number
  cw: number
}

export type StatsPayload = {
  meta: StatsMeta
  totals: StatsTotals
  cost: number
  est_total: number
  stats: {
    mas_cara: { cost: number; title: string; model: string }
    mas_tokens: { title: string; model: string }
    input_medio: number
  }
  days: Array<{ day: string; cost: number }>
  models_chart: Array<{ model: string; cost: number }>
  by_model: StatsRow[]
  by_project: StatsRow[]
  by_day: StatsRow[]
  by_month: StatsRow[]
  sessions: StatsRow[]
  limits: StatsLimitRow[]
  prices: StatsPriceRow[]
}
