export const STORAGE_KEYS = {
  SERVER: "opencode.remote.server",
  SERVER_FILE: "opencode.remote.server_file",
  DATA_MODE: "opencode.remote.dataMode",
  THEME: "opencode.remote.theme",
  FAVORITES: "opencode.remote.favorites",
  MODEL: "opencode.remote.model",
  AGENT: "opencode.remote.agent",
  STATS: "openher.stats",
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
  STATS_PORT: "opencode.remote.statsPort",
  QUICKCHAT_PROVIDER: "openher.quickchat.provider",
  QUICKCHAT_MODEL: "openher.quickchat.model",
  QUICKCHAT_SEARCH: "openher.quickchat.search",
  QUICKCHAT: "openher.quickchat.messages",
  QUICKCHAT_KEY_GROQ: "openher.quickchat.key.groq",
  QUICKCHAT_KEY_CEREBRAS: "openher.quickchat.key.cerebras",
  QUICKCHAT_KEY_CUSTOM: "openher.quickchat.key.custom",
  QUICKCHAT_CUSTOM_URL: "openher.quickchat.custom.url",
  QUICKCHAT_CUSTOM_MODEL: "openher.quickchat.custom.model",
  SHELL_REMOTE: "openher.shellBase"
}

export const DEFAULT_STATS_PORT = 8765

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
export const DB_STORES = { sessions: "sessions", messages: "messages", quickchat: "quickchat" } as const
export const QUICKCHAT_CACHE_TTL_MS = 24 * 60 * 60 * 1000
export const QUICKCHAT_MAX_TOKENS = 500
export const CEREBRAS_RPM = 5
export const CEREBRAS_TPM = 90_000
