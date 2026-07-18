import { useState, useCallback, useMemo } from "react"
import type { ServerConfig, AgentOption, ModelOption } from "../types"
import { api } from "../api"
import { modelKey, sameModel, modelFromKey } from "./useSessions"

const MODEL_STORAGE_KEY = "opencode.remote.model"
const AGENT_STORAGE_KEY = "opencode.remote.agent"

function modelSearchText(option: ModelOption): string {
  return [option.modelName, option.modelID, option.providerName, option.providerID, option.variant ?? ""].join(" ").toLowerCase()
}

export function agentLabel(agent: AgentOption): string {
  return agent.name || agent.id
}

export function useAI(config: ServerConfig) {
  const [agentOptions, setAgentOptions] = useState<AgentOption[]>([])
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null)
  const [selectedAgentID, setSelectedAgentID] = useState<string>(() => localStorage.getItem(AGENT_STORAGE_KEY) || "build")
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([])
  const [modelLoadError, setModelLoadError] = useState<string | null>(null)
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(() => localStorage.getItem(MODEL_STORAGE_KEY))
  const [modelQuery, setModelQuery] = useState("")

  const selectedModel = useMemo(() => modelFromKey(selectedModelKey), [selectedModelKey])

  const primaryAgentOptions = useMemo(
    () => agentOptions.filter((agent) => agent.mode === "primary" || agent.mode === "all"),
    [agentOptions]
  )

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
      const saved = localStorage.getItem(AGENT_STORAGE_KEY) || selectedAgentID
      const primary = list.filter((agent) => agent.mode === "primary" || agent.mode === "all")
      const next = primary.find((agent) => agent.id === saved) ?? primary.find((agent) => agent.id === "build") ?? primary[0]
      if (next) {
        setSelectedAgentID(next.id)
        localStorage.setItem(AGENT_STORAGE_KEY, next.id)
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
        localStorage.setItem(MODEL_STORAGE_KEY, nextKey)
      }
    } catch (err) {
      setModelLoadError((err as Error).message)
    }
  }, [config, selectedModelKey])

  const changeModel = useCallback((nextKey: string) => {
    setSelectedModelKey(nextKey)
    localStorage.setItem(MODEL_STORAGE_KEY, nextKey)
  }, [])

  const changeAgent = useCallback((nextAgentID: string) => {
    setSelectedAgentID(nextAgentID)
    localStorage.setItem(AGENT_STORAGE_KEY, nextAgentID)
  }, [])

  return {
    agentOptions, agentLoadError, selectedAgentID, modelOptions, modelLoadError,
    selectedModelKey, modelQuery, setModelQuery, selectedModel, primaryAgentOptions,
    activeAgent, activeAgentID, activeModelOption, activeModel, filteredModelOptions,
    showModelChip, loadAgents, loadModels, changeModel, changeAgent
  }
}
