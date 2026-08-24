export const STORAGE_KEYS = {
  SERVER: "opencode.remote.server",
  SERVER_FILE: "opencode.remote.server_file",
  DATA_MODE: "opencode.remote.dataMode",
  THEME: "opencode.remote.theme",
  FAVORITES: "opencode.remote.favorites",
  MODEL: "opencode.remote.model",
  AGENT: "opencode.remote.agent",
  STATS: "opencode.mobile.stats",
  CURSOR: "opencode.remote.cursor",
  LANGUAGE: "opencode.remote.language",
  NAVBAR: "opencode.remote.navbar",
  RECENT_MODELS: "opencode.mobile.recentModels",
  BLOCKED_MODELS: "opencode.mobile.blockedModels",
  FEATURE_FLAGS: "opencode.mobile.featureFlags",
  CONNECTED_PROVIDERS: "opencode.mobile.connectedProviders",
  CHAT_SETTINGS: "opencode.mobile.chatSettings",
  RECENT_DISMISS: "opencode.mobile.recentDismiss",
  MODEL_VARIANT: "opencode.mobile.modelVariant",
  SERVERS: "opencode.mobile.servers",
  STATS_PORT: "opencode.remote.statsPort",
  QUICKCHAT_PROVIDER: "opencode.mobile.quickchat.provider",
  QUICKCHAT_MODEL: "opencode.mobile.quickchat.model",
  QUICKCHAT_SEARCH: "opencode.mobile.quickchat.search",
  QUICKCHAT: "opencode.mobile.quickchat.messages",
  QUICKCHAT_KEY_GROQ: "opencode.mobile.quickchat.key.groq",
  QUICKCHAT_KEY_CEREBRAS: "opencode.mobile.quickchat.key.cerebras",
  QUICKCHAT_KEY_CUSTOM: "opencode.mobile.quickchat.key.custom",
  QUICKCHAT_CUSTOM_URL: "opencode.mobile.quickchat.custom.url",
  QUICKCHAT_CUSTOM_MODEL: "opencode.mobile.quickchat.custom.model"
}

export const DEFAULT_STATS_PORT = 8765

export const STREAMING_POLL_INTERVAL_MS = 1000
export const DEFAULT_POLL_INTERVALS: Record<string, number> = {
  full: 3500,
  saver: 15000,
  ultra: 30000,
  miser: 60000,
}

export const SSE_CONNECT_TIMEOUT_MS = 8_000
export const SSE_RECONNECT_BASE_MS = 1_000
export const SSE_RECONNECT_MAX_MS = 30_000
export const SSE_HEARTBEAT_TIMEOUT_MS = 35_000
export const POLL_BACKOFF_BASE_MS = 1_000
export const POLL_BACKOFF_MAX_MS = 60_000
export const POLL_BACKOFF_JITTER = 0.3
export const POLL_MAX_RETRIES = 5
export const QUESTION_POLL_INTERVAL_MS = 15_000

export const DB_NAME = "opencode-mobile"
export const DB_VERSION = 3
export const DB_STORES = { sessions: "sessions", messages: "messages", quickchat: "quickchat" } as const
export const QUICKCHAT_CACHE_TTL_MS = 24 * 60 * 60 * 1000
export const QUICKCHAT_MAX_TOKENS = 500
export const CEREBRAS_RPM = 5
export const CEREBRAS_TPM = 90_000
