/**
 * Entidad config — tipos de configuración, infraestructura y conexión.
 *
 * Extraído de `web/src/types.ts` (Fase 2).
 * Nota de coordinación: `HealthResponse` también existe temporalmente en
 * `entities/session/model.ts`; `ViewType`/`HelpPage` también en
 * `entities/ui/model.ts`. La deduplicación se resolverá en la fase de
 * unificación del barrel `types.ts`.
 * Solo tipos puros, sin React/fetch/api. TunnelConfig usa RTCIceServer
 * (lib DOM) sin importar nada extra.
 */

// ---------------------------------------------------------------------------
// ServerConfig — credenciales y endpoint del servidor opencode
// ---------------------------------------------------------------------------
export type ServerConfig = {
  host: string
  port: number
  username: string
  password: string
  apiVersion?: "auto" | "v1" | "v2"
}

// ---------------------------------------------------------------------------
// HealthResponse — respuesta del endpoint /health
// Duplicado con entities/session/model.ts — se deduplicará en merge.
// ---------------------------------------------------------------------------
export type HealthResponse = {
  healthy: boolean
  version: string
}

// ---------------------------------------------------------------------------
// FeatureFlags — flags de capacidades del servidor/UI
// ---------------------------------------------------------------------------
export type FeatureFlags = {
  fileBrowser: boolean
  inlineDiff: boolean
  contextMenu: boolean
  planBreakdown: boolean
  gitOps: boolean
  mcpConfig: boolean
  sessionArchive: boolean
  streamingFull: boolean
  offlineCache: boolean
  questionAuto: boolean
  permissionUI: boolean
  autoOpencode2: boolean
}

// ---------------------------------------------------------------------------
// ViewType / HelpPage — navegación de alto nivel de la SPA
// Duplicado con entities/ui/model.ts — se deduplicará en merge.
// ---------------------------------------------------------------------------
export type ViewType = "settings" | "sessions" | "detail" | "help" | "stats" | "quickchat" | "learning"

export type HelpPage = "overview" | "server" | "network" | "troubleshooting" | "commands"

// ---------------------------------------------------------------------------
// ConnectionState / DataMode / StreamState — estados de conexión
// ---------------------------------------------------------------------------
export type ConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "offline"

export type DataMode = "full" | "saver" | "ultra" | "miser"

export type StreamState = "polling" | "streaming" | "reconnecting"

// ---------------------------------------------------------------------------
// SSEEvent — evento genérico del stream SSE
// ---------------------------------------------------------------------------
export type SSEEvent = {
  id: string
  type: string
  properties: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// TunnelConfig — configuración de túnel WebRTC / signaling
// ---------------------------------------------------------------------------
export type TunnelConfig = {
  name: string
  password: string
  signalingURL: string
  iceServers?: RTCIceServer[]
}

// ---------------------------------------------------------------------------
// ServerProfile — perfil guardado de servidor (http / pair)
// ---------------------------------------------------------------------------
export type ServerProfile = {
  id: string
  name: string
  kind: "http" | "pair"
  config: ServerConfig
}

// ---------------------------------------------------------------------------
// DeepLinkAction — acción decodificada desde deep link / intent
// ---------------------------------------------------------------------------
export type DeepLinkAction = {
  kind: "server" | "session"
  host?: string
  port?: number
  username?: string
  sessionID?: string
  directory?: string
}

// ---------------------------------------------------------------------------
// Constante de infraestructura — URL por defecto del servidor de signaling
// ---------------------------------------------------------------------------
export const DEFAULT_SIGNALING_URL = "wss://opencode-tunnel-signaling.owning01.workers.dev/signal"
