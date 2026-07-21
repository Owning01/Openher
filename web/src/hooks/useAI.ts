import { useState, useCallback, useMemo } from "react"
import type { ServerConfig, AgentOption, ModelOption } from "../types"
import { api } from "../api"
import { modelKey, sameModel, modelFromKey } from "./useSessions"
import { STORAGE_KEYS } from "../constants"

export const MODEL_STORAGE_KEY = "opencode.remote.model"
export const AGENT_STORAGE_KEY = "opencode.remote.agent"
export const RECENT_MODELS_KEY = STORAGE_KEYS.RECENT_MODELS
const MAX_RECENT = 5

function loadRecentModels(): ModelOption[] {
  try {
    const raw = localStorage.getItem(RECENT_MODELS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    localStorage.removeItem(RECENT_MODELS_KEY)
    return []
  }
}

function pushRecentModel(model: ModelOption) {
  const key = modelKey(model)
  const recent = loadRecentModels().filter((m) => modelKey(m) !== key)
  recent.unshift(model)
  const trimmed = recent.slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_MODELS_KEY, JSON.stringify(trimmed))
}

function modelSearchText(option: ModelOption): string {
  return [option.modelName, option.modelID, option.providerName, option.providerID, option.variant ?? ""].join(" ").toLowerCase()
}

export function agentLabel(agent: AgentOption): string {
  return agent.name || agent.id
}

function agentStorageKey(directory?: string): string {
  return directory ? `${STORAGE_KEYS.AGENT}.${encodeURIComponent(directory)}` : STORAGE_KEYS.AGENT
}

function filterPrimary(agents: AgentOption[]): AgentOption[] {
  return agents.filter((agent) => agent.mode === "primary" || agent.mode === "all")
}

export function useAI(config: ServerConfig) {
  const [agentOptions, setAgentOptions] = useState<AgentOption[]>([])
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null)
  const [selectedAgentID, setSelectedAgentID] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.AGENT) || "")
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([])
  const [modelLoadError, setModelLoadError] = useState<string | null>(null)
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.MODEL))
  const [modelQuery, setModelQuery] = useState("")

  const selectedModel = useMemo(() => modelFromKey(selectedModelKey), [selectedModelKey])

  const primaryAgentOptions = useMemo(() => filterPrimary(agentOptions), [agentOptions])

  const activeAgent = useMemo(() => {
    return primaryAgentOptions.find((agent) => agent.id === selectedAgentID)
      ?? primaryAgentOptions.find((agent) => agent.id === "build")
      ?? primaryAgentOptions[0]
      ?? null
  }, [primaryAgentOptions, selectedAgentID])

  const activeAgentID = activeAgent?.id ?? primaryAgentOptions[0]?.id ?? "build"

  const activeModelOption = useMemo(() => {
    if (selectedModel) {
      const explicit = modelOptions.find((option) => sameModel(option, selectedModel))
      if (explicit) return explicit
    }
    return modelOptions.find((option) => option.isDefault) ?? modelOptions[0] ?? null
  }, [modelOptions, selectedModel])

  const activeModel = useMemo(() => {
    if (activeModelOption) {
      return { providerID: activeModelOption.providerID, modelID: activeModelOption.modelID, variant: activeModelOption.variant }
    }
    return selectedModel ?? undefined
  }, [activeModelOption, selectedModel])

  const filteredModelOptions = useMemo(() => {
    const text = modelQuery.trim().toLowerCase()
    if (!text) return modelOptions
    return modelOptions.filter((option) => modelSearchText(option).includes(text))
  }, [modelOptions, modelQuery])

  const showModelChip = modelOptions.length > 1 || Boolean(activeModelOption) || primaryAgentOptions.length > 0

  const loadAgents = useCallback(async (directory?: string) => {
    if (!config.host || config.port <= 0) return
    try {
      const list = await api.listAgents(config, directory)
      setAgentOptions(list)
      setAgentLoadError(null)
      const saved = localStorage.getItem(agentStorageKey(directory)) || localStorage.getItem(STORAGE_KEYS.AGENT) || ""
      const primary = filterPrimary(list)
      const next = primary.find((agent) => agent.id === saved) ?? primary[0]
      if (next) {
        setSelectedAgentID(next.id)
        localStorage.setItem(agentStorageKey(directory), next.id)
      }
    } catch (err) {
      setAgentLoadError((err as Error).message)
    }
  }, [config, selectedAgentID])

  const loadModels = useCallback(async (directory?: string) => {
    if (!config.host || config.port <= 0) return
    try {
      const list = await api.listModels(config, directory)
      setModelOptions(list)
      setModelLoadError(null)
      const saved = modelFromKey(selectedModelKey)
      if (saved && list.some((option) => sameModel(option, saved))) return
      const fallback = list.find((option) => option.isDefault) ?? list[0]
      if (fallback) {
        const nextKey = modelKey(fallback)
        setSelectedModelKey(nextKey)
        localStorage.setItem(STORAGE_KEYS.MODEL, nextKey)
      }
    } catch (err) {
      setModelLoadError((err as Error).message)
    }
  }, [config, selectedModelKey])

  const recentModels = useMemo(() => {
    const keys = new Set(modelOptions.map(modelKey))
    return loadRecentModels().filter((m) => keys.has(modelKey(m)))
  }, [modelOptions])

  const changeModel = useCallback((nextKey: string) => {
    setSelectedModelKey(nextKey)
    localStorage.setItem(STORAGE_KEYS.MODEL, nextKey)
    const model = modelOptions.find((m) => modelKey(m) === nextKey)
    if (model) pushRecentModel(model)
  }, [modelOptions])

  const changeAgent = useCallback((nextAgentID: string, directory?: string) => {
    setSelectedAgentID(nextAgentID)
    localStorage.setItem(agentStorageKey(directory), nextAgentID)
  }, [])

  return {
    agentOptions, agentLoadError, selectedAgentID, modelOptions, modelLoadError,
    selectedModelKey, modelQuery, setModelQuery, selectedModel, primaryAgentOptions,
    activeAgent, activeAgentID, activeModelOption, activeModel, filteredModelOptions,
    recentModels,
    showModelChip, loadAgents, loadModels, changeModel, changeAgent
  }
}
