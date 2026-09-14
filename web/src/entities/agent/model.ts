/**
 * Entidad agent — tipos de agente, modelo, proveedor y estadísticas.
 *
 * Extraído de `web/src/types.ts` (Fase 2).
 * Nota de coordinación: `ModelSelection` y `ProviderInfo` también existen
 * temporalmente en `entities/session` y `entities/ui`. La deduplicación se
 * resolverá en la fase de unificación del barrel `types.ts`.
 * Este archivo es la fuente canónica para AgentOption / ModelOption /
 * Question / Permission desde el punto de vista de agent.
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
export type ServerProviderConnection =
  | { type: "credential"; id: string; label: string }
  | { type: "env"; name: string }

export type ServerProvider = {
  id: string
  name: string
  source: "env" | "config" | "custom" | "api"
  env: string[]
  key?: string
  models: Record<string, unknown>
  /** v2: cada conexión es una cuenta (credential con label) o una env var. */
  connections?: ServerProviderConnection[]
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
  /** Clave del form field (v2): q0, q1… Necesaria para mapear la respuesta. */
  key?: string
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


