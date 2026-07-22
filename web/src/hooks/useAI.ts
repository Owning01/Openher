import { useState, useCallback, useMemo } from "react"
import type { ServerConfig, AgentOption, ModelOption } from "../types"
import { api } from "../api"
import { modelKey, sameModel, modelFromKey } from "../utils/model-utils"
import { STORAGE_KEYS } from "../constants"
import { useLocalStorage } from "./useLocalStorage"

export const MODEL_STORAGE_KEY = "opencode.remote.model"
export const AGENT_STORAGE_KEY = "opencode.remote.agent"
export const RECENT_MODELS_KEY = STORAGE_KEYS.RECENT_MODELS
const MAX_RECENT = 5

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

export type VariantGroup = { base: ModelOption; variants: ModelOption[] }

export function useAI(config: ServerConfig) {
  const [agentOptions, setAgentOptions] = useState<AgentOption[]>([])
  const [agentLoadError, setAgentLoadError] = useState<string | null>(null)
  const [selectedAgentID, setSelectedAgentID] = useState<string>(() => localStorage.getItem(STORAGE_KEYS.AGENT) || "")
  const [modelOptions, setModelOptions] = useState<ModelOption[]>([])
  const [modelLoadError, setModelLoadError] = useState<string | null>(null)
  const [selectedModelKey, setSelectedModelKey] = useState<string | null>(() => localStorage.getItem(STORAGE_KEYS.MODEL))
  const [selectedVariant, setSelectedVariant] = useState<string | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MODEL_VARIANT)
    return saved || null
  })
  const [modelQuery, setModelQuery] = useState("")
  const [recentModelsArr, setRecentModelsArr] = useLocalStorage<ModelOption[]>(RECENT_MODELS_KEY, [])

  const selectedModel = useMemo(() => selectedModelKey ? modelFromKey(selectedModelKey) : null, [selectedModelKey])

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
      if (selectedVariant) {
        const exact = modelOptions.find(
          (opt) => sameModel(opt, selectedModel) && opt.variant === selectedVariant
        )
        if (exact) return exact
      }
      const base = modelOptions.find(
        (opt) => sameModel(opt, selectedModel) && !opt.variant
      )
      if (base) return base
      const any = modelOptions.find((opt) => sameModel(opt, selectedModel))
      if (any) return any
    }
    return modelOptions.find((opt) => opt.isDefault) ?? modelOptions[0] ?? null
  }, [modelOptions, selectedModel, selectedVariant])

  const activeModel = useMemo(() => {
    if (selectedModel) {
      return { providerID: selectedModel.providerID, modelID: selectedModel.modelID, variant: selectedVariant || undefined }
    }
    if (activeModelOption) {
      return { providerID: activeModelOption.providerID, modelID: activeModelOption.modelID, variant: selectedVariant || undefined }
    }
    return undefined
  }, [selectedModel, activeModelOption, selectedVariant])

  const filteredModelOptions = useMemo(() => {
    const text = modelQuery.trim().toLowerCase()
    if (!text) return modelOptions
    return modelOptions.filter((option) => modelSearchText(option).includes(text))
  }, [modelOptions, modelQuery])

  const recentModels = useMemo(() => {
    const keys = new Set(modelOptions.map(modelKey))
    return recentModelsArr.filter((m) => keys.has(modelKey(m)))
  }, [modelOptions, recentModelsArr])

  const variantGroups = useMemo(() => {
    const hasQuery = modelQuery.trim().length > 0
    const recentKeys = new Set(recentModels.map(modelKey))
    const allModels = hasQuery ? filteredModelOptions : filteredModelOptions.filter((m) => !recentKeys.has(modelKey(m)))
    const groups = new Map<string, VariantGroup>()
    for (const opt of allModels) {
      const key = modelKey(opt)
      if (!groups.has(key)) {
        groups.set(key, { base: opt, variants: [] })
      }
      if (opt.variant) {
        groups.get(key)!.variants.push(opt)
      }
    }
    return { recentModels, groups }
  }, [filteredModelOptions, recentModels])

  const groupedModelOptions = useMemo(() => {
    const recentKeys = new Set(recentModels.map(modelKey))
    const allModels = filteredModelOptions.filter((m) => !recentKeys.has(modelKey(m)))
    const allGroups = new Map<string, ModelOption[]>()
    for (const option of allModels) {
      const key = option.providerID || option.providerName || "other"
      if (!allGroups.has(key)) allGroups.set(key, [])
      allGroups.get(key)!.push(option)
    }
    return { recentModels, allGroups }
  }, [filteredModelOptions, recentModels])

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
      const saved = selectedModelKey ? modelFromKey(selectedModelKey) : null
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

  const changeModel = useCallback((nextKey: string, variant?: string | null) => {
    setSelectedModelKey(nextKey)
    localStorage.setItem(STORAGE_KEYS.MODEL, nextKey)
    const v = variant !== undefined ? (variant ?? null) : null
    setSelectedVariant(v)
    if (v) {
      localStorage.setItem(STORAGE_KEYS.MODEL_VARIANT, v)
    } else {
      localStorage.removeItem(STORAGE_KEYS.MODEL_VARIANT)
    }
    const model = modelOptions.find((m) => modelKey(m) === nextKey)
    if (model) {
      setRecentModelsArr((prev) => {
        const filtered = prev.filter((m) => modelKey(m) !== nextKey)
        filtered.unshift(v ? { ...model, variant: v } : model)
        return filtered.slice(0, MAX_RECENT)
      })
    }
  }, [modelOptions, setRecentModelsArr])

  const changeVariant = useCallback((variant: string | null) => {
    setSelectedVariant(variant)
    if (variant) {
      localStorage.setItem(STORAGE_KEYS.MODEL_VARIANT, variant)
    } else {
      localStorage.removeItem(STORAGE_KEYS.MODEL_VARIANT)
    }
    if (selectedModelKey) {
      const model = modelOptions.find((m) => modelKey(m) === selectedModelKey)
      if (model) {
        setRecentModelsArr((prev) => {
          const filtered = prev.filter((m) => modelKey(m) !== selectedModelKey)
          filtered.unshift(variant ? { ...model, variant } : model)
          return filtered.slice(0, MAX_RECENT)
        })
      }
    }
  }, [selectedModelKey, modelOptions, setRecentModelsArr])

  const changeAgent = useCallback((nextAgentID: string, directory?: string) => {
    setSelectedAgentID(nextAgentID)
    localStorage.setItem(agentStorageKey(directory), nextAgentID)
  }, [])

  return {
    agentOptions, agentLoadError, selectedAgentID, modelOptions, modelLoadError,
    selectedModelKey, modelQuery, setModelQuery, selectedModel, primaryAgentOptions,
    activeAgent, activeAgentID, activeModelOption, activeModel, filteredModelOptions,
    groupedModelOptions, variantGroups, recentModels,
    selectedVariant, changeVariant,
    showModelChip, loadAgents, loadModels, changeModel, changeAgent
  }
}
