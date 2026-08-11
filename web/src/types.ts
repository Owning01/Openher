export type ServerConfig = {
  host: string
  port: number
  username: string
  password: string
  apiVersion?: "auto" | "v1" | "v2"
}

export type HealthResponse = {
  healthy: boolean
  version: string
}

export type ModelSelection = {
  providerID: string
  modelID: string
  variant?: string
}

export type AgentOption = {
  id: string
  name: string
  description?: string
  mode: "primary" | "subagent" | "all"
  hidden?: boolean
}

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

export type TokenUsage = {
  total?: number
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

export type Session = {
  id: string
  title: string
  directory: string
  time: {
    created: number
    updated: number
    compacting?: number
    archived?: number
  }
  summary?: {
    additions: number
    deletions: number
    files: number
  }
  tokens?: TokenUsage
  cost?: number
  agent?: string
  parentID?: string
  version?: string
  revert?: {
    messageID: string
    partID?: string
    snapshot?: string
    diff?: string
  }
  model?: {
    id: string
    providerID: string
    variant?: string
  }
  project?: {
    id: string
    name?: string
    worktree: string
  } | null
}

export type SessionStatus = {
  type: string
  attempt?: number
  message?: string
  next?: number
}

export type FileDiff = {
  file?: string
  patch?: string
  additions: number
  deletions: number
  status?: string
}

export type MessageEnvelope = {
  info: {
    id: string
    role: string
    sessionID: string
    time: {
      created: number
      completed?: number
    }
    agent?: string
    parentID?: string
    modelID?: string
    providerID?: string
    mode?: string
    finish?: string
    summary?: { diffs?: FileDiff[] }
    error?: { name: string; message?: string }
    tokens?: {
      total?: number
      input: number
      output: number
      reasoning: number
      cache: { read: number; write: number }
    }
    cost?: number
  }
  parts: Array<{
    id: string
    type: string
    sessionID?: string
    text?: string
    data?: string
    mimeType?: string
    callID?: string
    tool?: string
    state?: {
      status?: string
      input?: unknown
      output?: unknown
      error?: unknown
      duration?: number
      metadata?: Record<string, unknown>
    }
    time?: { created?: number; completed?: number; start?: number; end?: number }
  }>
}

export type ThinkingPart = {
  id: string
  text: string
  time?: { start?: number; end?: number }
}

type MessageTokens = {
  total?: number
  input: number
  output: number
  reasoning: number
  cache: { read: number; write: number }
}

export type RenderedMessage = {
  info: MessageEnvelope["info"]
  parts: MessageEnvelope["parts"]
  text: string
  hasCompaction: boolean
  thinkingParts: ThinkingPart[]
  toolParts: Array<{
    id: string
    type: string
    text?: string
    callID?: string
    tool?: string
    state?: {
      status?: string
      input?: unknown
      output?: unknown
      error?: unknown
      duration?: number
      title?: string
      metadata?: Record<string, unknown>
    }
  }>
  summaryDiffs?: FileDiff[]
  dataMode?: string
  turnMode?: string
  tokens?: MessageTokens
  cost?: number
}

export type TodoItem = {
  content: string
  status: string
  priority: string
  id: string
}

export type DiffFile = {
  file: string
  additions: number
  deletions: number
}

export type ProjectCurrent = {
  name?: string
  path?: string
  directory?: string
  root?: string
  [key: string]: unknown
}

export type VcsStatus = {
  branch?: string
  status?: string
  ahead?: number
  behind?: number
  [key: string]: unknown
}

export type FileStatusEntry = {
  path?: string
  file?: string
  status?: string
  [key: string]: unknown
}

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
}

export type FileEntry = {
  name: string
  path: string
  absolute: string
  type: "file" | "directory"
  ignored?: boolean
}

export type PathInfo = {
  home: string
  state: string
  config: string
  worktree: string
  directory: string
}

export type ProjectDashboard = {
  project: ProjectCurrent | null
  vcs: VcsStatus | null
  files: FileStatusEntry[]
}

export type SessionView = {
  id: string
  title: string
  directory: string
  updated: number
  status: string
  files: number
  additions: number
  deletions: number
  tokens?: TokenUsage
  cost?: number
  agent?: string
  parentID?: string
  revert?: { messageID: string; partID?: string }
  model?: ModelSelection
}

export type ProviderInfo = {
  id: string
  name: string
  modelsCount: number
  connected: boolean
}

export type CommandInfo = {
  name: string
  description?: string
  source?: "command" | "mcp" | "skill"
}

export type NoticeType = "info" | "success" | "error"

export type ThemePreference = "system" | "light" | "dark" | "scheduled"

export type ViewType = "settings" | "sessions" | "detail" | "help" | "stats"

export type HelpPage = "overview" | "server" | "network" | "troubleshooting" | "commands"

export type ConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "offline"

export type DataMode = "full" | "saver" | "ultra" | "miser"

export type StreamState = "polling" | "streaming" | "reconnecting"

export type SSEEvent = {
  id: string
  type: string
  properties: Record<string, unknown>
}

export type StreamingPart = {
  messageID: string
  partID: string
  text: string
  field: string
}

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

export type PermissionRequest = {
  requestID: string
  permission: string
  status: string
  directory?: string
  sessionID?: string
}

export type DiffContent = {
  file: string
  content: string
  additions: number
  deletions: number
}

export type CachedSession = {
  id: string
  title: string
  directory: string
  updated: number
  summary?: { additions: number; deletions: number; files: number }
  tokens?: TokenUsage
  cost?: number
  agent?: string
  model?: ModelSelection
}

export type CachedMessages = {
  sessionID: string
  messages: MessageEnvelope[]
  cachedAt: number
}

export type ChatSettings = {
  fontSize: number
  messageSpacing: "compact" | "normal" | "comfortable"
  showThinking: boolean
  showToolCalls: boolean
  showTimestamps: boolean
  showTodoButton: boolean
  showModelInfo: boolean
  showDiffs: boolean
  showSubagentHint: boolean
  showCompactionCheckpoint: boolean
  showImages: boolean
  bubbleRadius: number
  messageMaxWidth: "normal" | "wide" | "full"
  fontFamily: "system" | "serif" | "mono"
  userBubbleColor: string
  chatBackground: "default" | "indigo" | "amber" | "green" | "solid"
  agentAccent: string
  compactTools: boolean
  completionSound: boolean
  composerCharLimit: number
}

export type PromptSnippet = {
  id: string
  name: string
  text: string
}

export type TunnelConfig = {
  name: string
  password: string
  signalingURL: string
  iceServers?: RTCIceServer[]
}

export type ServerProfile = {
  id: string
  name: string
  kind: "http" | "pair"
  config: ServerConfig
}

export type DeepLinkAction = {
  kind: "server" | "session"
  host?: string
  port?: number
  username?: string
  sessionID?: string
  directory?: string
}

export const DEFAULT_SIGNALING_URL = "wss://opencode-tunnel-signaling.owning01.workers.dev/signal"

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
