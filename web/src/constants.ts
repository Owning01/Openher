export const STORAGE_KEYS = {
  SERVER: "opencode.remote.server",
  SERVER_FILE: "opencode.remote.server_file",
  DATA_MODE: "opencode.remote.dataMode",
  THEME: "opencode.remote.theme",
  FAVORITES: "opencode.remote.favorites",
  MODEL: "opencode.remote.model",
  AGENT: "opencode.remote.agent",
  CURSOR: "opencode.remote.cursor",
  LANGUAGE: "opencode.remote.language",
  NAVBAR: "opencode.remote.navbar",
  RECENT_MODELS: "openher.recentModels",
  BLOCKED_MODELS: "openher.blockedModels",
  FEATURE_FLAGS: "openher.featureFlags",
  CONNECTED_PROVIDERS: "openher.connectedProviders",
  CHAT_SETTINGS: "openher.chatSettings",
  RECENT_DISMISS: "openher.recentDismiss",
  MODEL_VARIANT: "openher.modelVariant",
  SERVERS: "openher.servers",
  SHELL_REMOTE: "openher.shellBase"
}

export const STREAMING_POLL_INTERVAL_MS = 1000
export const DEFAULT_POLL_INTERVALS: Record<string, number> = {
  full: 3500,
  saver: 15000,
  ultra: 30000,
  miser: 60000,
}

export const SSE_CONNECT_TIMEOUT_MS = 3_000
export const SSE_RECONNECT_BASE_MS = 1_000
export const SSE_RECONNECT_MAX_MS = 30_000
export const SSE_HEARTBEAT_TIMEOUT_MS = 15_000
export const POLL_BACKOFF_BASE_MS = 1_000
export const POLL_BACKOFF_MAX_MS = 60_000
export const POLL_BACKOFF_JITTER = 0.3
export const POLL_MAX_RETRIES = 5
export const QUESTION_POLL_INTERVAL_MS = 15_000

export const DB_NAME = "openher"
export const DB_VERSION = 3
export const DB_STORES = { sessions: "sessions", messages: "messages" } as const
