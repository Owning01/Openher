import type { TokenUsage } from "../message/model.ts"

export type ModelSelection = {
  providerID: string
  modelID: string
  variant?: string
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
