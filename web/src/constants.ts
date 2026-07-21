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
  CONNECTED_PROVIDERS: "opencode.mobile.connectedProviders"
}

export const DEFAULT_AUTO_SUMMARIZE_THRESHOLD = 32000

export const STREAMING_POLL_INTERVAL_MS = 1000
export const DEFAULT_POLL_INTERVALS: Record<string, number> = {
  full: 3500,
  saver: 15000,
  ultra: 30000,
  miser: 60000,
}
