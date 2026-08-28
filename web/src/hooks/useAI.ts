import { useState, useCallback, useMemo, useRef } from "react"
import type { ServerConfig, AgentOption, ModelOption } from "../types"
import { api } from "../api"
import { modelKey, sameModel, modelFromKey, groupModels, variantsOf, resolveModelOption } from "../utils/model-utils"
import { STORAGE_KEYS } from "../constants"
import { useLocalStorage } from "./useLocalStorage"

export type { VariantGroup } from "../utils/model-utils"

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
  // Track whether models have been loaded at least once. On the first load,
  // if the saved model isn't in the list, we fall back to the default.
  // On subsequent loads (session switch, provider connect), we preserve the
  // user's choice — otherwise changing models gets silently overwritten.
  const modelsLoadedRef = useRef(false)

  const [sessionModels, setSessionModels] = useState<Record<string, { modelKey: string; variant?: string | null }>>(() => {
    const map: Record<string, { modelKey: string; variant?: string | null }> = {}
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith("opencode.remote.model.session.")) {
          const sid = k.slice("opencode.remote.model.session.".length)
          const val = JSON.parse(localStorage.getItem(k) ?? "null")
          if (val && typeof val.modelKey === "string") {
            map[sid] = val
          }
        }
      }
    } catch { /* ignore */ }
    return map
  })

  const getModelForSession = useCallback((sessionID?: string | null) => {
    const sessionOverride = sessionID ? sessionModels[sessionID] : null
    const key = sessionOverride?.modelKey ?? selectedModelKey
    const variant = sessionOverride ? (sessionOverride.variant ?? null) : selectedVariant
    const selected = key ? modelFromKey(key) : null

    const resolvedOption = resolveModelOption(modelOptions, selected, variant)

    const resolvedVariant = resolvedOption?.variant ?? (variant || undefined)
    const activeModel = resolvedOption
      ? { providerID: resolvedOption.providerID, modelID: resolvedOption.modelID, variant: resolvedVariant }
      : selected
      ? { providerID: selected.providerID, modelID: selected.modelID, variant: resolvedVariant }
      : undefined

    const activeModelVariants = variantsOf(modelOptions, resolvedOption)

    return {
      activeModelOption: resolvedOption,
      activeModel,
      activeModelVariants,
      selectedVariant: resolvedOption?.variant ?? variant ?? null,
      selectedModelKey: key
    }
  }, [sessionModels, selectedModelKey, selectedVariant, modelOptions])

  const selectedModel = useMemo(() => selectedModelKey ? modelFromKey(selectedModelKey) : null, [selectedModelKey])

  const [disabledAgents, setDisabledAgents] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem("opencode.remote.disabled_agents")
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const toggleAgentEnabled = useCallback((agentId: string) => {
    setDisabledAgents((prev) => {
      const next = { ...prev, [agentId]: !prev[agentId] }
      try { localStorage.setItem("opencode.remote.disabled_agents", JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const allPrimaryAgents = useMemo(() => filterPrimary(agentOptions), [agentOptions])

  const primaryAgentOptions = useMemo(() => {
    const primary = filterPrimary(agentOptions)
    const enabled = primary.filter((a) => !disabledAgents[a.id])
    return enabled.length > 0 ? enabled : primary
  }, [agentOptions, disabledAgents])

  const activeAgent = useMemo(() => {
    return primaryAgentOptions.find((agent) => agent.id === selectedAgentID)
      ?? primaryAgentOptions.find((agent) => agent.id === "build")
      ?? primaryAgentOptions[0]
      ?? null
  }, [primaryAgentOptions, selectedAgentID])

  const activeAgentID = activeAgent?.id ?? primaryAgentOptions[0]?.id ?? "build"

  const activeModelOption = useMemo(() => {
    return resolveModelOption(modelOptions, selectedModel, selectedVariant)
  }, [modelOptions, selectedModel, selectedVariant])

  const activeModel = useMemo(() => {
    const variant = activeModelOption?.variant || undefined
    if (selectedModel) {
      return { providerID: selectedModel.providerID, modelID: selectedModel.modelID, variant }
    }
    if (activeModelOption) {
      return { providerID: activeModelOption.providerID, modelID: activeModelOption.modelID, variant }
    }
    return undefined
  }, [selectedModel, activeModelOption])

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
    return { recentModels, groups: groupModels(allModels) }
  }, [filteredModelOptions, recentModels])

  // Variantes del modelo ACTIVO sobre la lista completa (sin excluir recientes):
  // el menú del header debe mostrar los niveles aunque el modelo esté en recientes.
  const activeModelVariants = useMemo(
    () => variantsOf(modelOptions, activeModelOption),
    [modelOptions, activeModelOption],
  )

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

  const loadAgents = useCallback(async (directory?: string, attempt = 0) => {
    if (!config.host || config.port <= 0) return
    const timeout = <T>(p: Promise<T>, ms = 6000) => Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Agent list timeout")), ms))]) as Promise<T>
    try {
      const list = await timeout(api.listAgents(config, directory))
      if (list.length === 0 && attempt < 1) {
        await new Promise((r) => setTimeout(r, 600))
        return loadAgents(directory, attempt + 1)
      }
      setAgentOptions(list)
      setAgentLoadError(list.length === 0 ? "Sin agentes — reintentando" : null)
      const saved = localStorage.getItem(STORAGE_KEYS.AGENT) || localStorage.getItem(agentStorageKey(directory)) || ""
      const primary = filterPrimary(list)
      const next = primary.find((agent) => agent.id === saved) ?? primary[0]
      if (next) {
        setSelectedAgentID(next.id)
        localStorage.setItem(agentStorageKey(directory), next.id)
        if (saved && saved !== next.id && !primary.some((agent) => agent.id === saved)) {
          localStorage.removeItem(agentStorageKey(directory))
        }
      }
    } catch (err) {
      if (attempt < 1) {
        await new Promise((r) => setTimeout(r, 600))
        return loadAgents(directory, attempt + 1)
      }
      setAgentLoadError((err as Error).message)
    }
  }, [config])

  const loadModels = useCallback(async (directory?: string, attempt = 0) => {
    if (!config.host || config.port <= 0) return
    // timeout 8s para no colgar UI si opencode está lento (antes 12s + reintentos = 20s bloqueado)
    const timeout = <T>(p: Promise<T>, ms = 8000) => Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error("Model list timeout — opencode lento")), ms))]) as Promise<T>
    try {
      const list = await timeout(api.listModels(config, directory))
      if (list.length === 0 && attempt < 1) {
        await new Promise((r) => setTimeout(r, 600))
        return loadModels(directory, attempt + 1)
      }
      setModelOptions(list)
      setModelLoadError(list.length === 0 ? "Sin modelos — verifica proveedores en opencode" : null)
      const saved = selectedModelKey ? modelFromKey(selectedModelKey) : null
      if (saved && list.some((option) => sameModel(option, saved))) {
        if (selectedVariant && !list.some((option) => sameModel(option, saved) && option.variant === selectedVariant)) {
          setSelectedVariant(null)
          localStorage.removeItem(STORAGE_KEYS.MODEL_VARIANT)
        }
        modelsLoadedRef.current = true
        return
      }
      if (!modelsLoadedRef.current) {
        const fallback = list.find((option) => option.isDefault) ?? list[0]
        if (fallback) {
          const nextKey = modelKey(fallback)
          setSelectedModelKey(nextKey)
          localStorage.setItem(STORAGE_KEYS.MODEL, nextKey)
        }
      }
      modelsLoadedRef.current = true
    } catch (err) {
      if (attempt < 1) {
        await new Promise((r) => setTimeout(r, 600))
        return loadModels(directory, attempt + 1)
      }
      setModelLoadError((err as Error).message)
    }
  }, [config, selectedModelKey, selectedVariant])

  const changeModel = useCallback((nextKey: string, variant?: string | null, sessionID?: string | null) => {
    const v = variant !== undefined ? (variant ?? null) : null
    if (sessionID) {
      setSessionModels((prev) => {
        const next = { ...prev, [sessionID]: { modelKey: nextKey, variant: v } }
        try {
          localStorage.setItem(`opencode.remote.model.session.${sessionID}`, JSON.stringify({ modelKey: nextKey, variant: v }))
        } catch { /* ignore */ }
        return next
      })
    } else {
      setSelectedModelKey(nextKey)
      localStorage.setItem(STORAGE_KEYS.MODEL, nextKey)
      setSelectedVariant(v)
      if (v) {
        localStorage.setItem(STORAGE_KEYS.MODEL_VARIANT, v)
      } else {
        localStorage.removeItem(STORAGE_KEYS.MODEL_VARIANT)
      }
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

  const changeVariant = useCallback((variant: string | null, sessionID?: string | null) => {
    if (sessionID) {
      setSessionModels((prev) => {
        const current = prev[sessionID]
        const currentKey = current?.modelKey ?? selectedModelKey ?? (activeModelOption ? modelKey(activeModelOption) : "")
        if (!currentKey) return prev
        const next = { ...prev, [sessionID]: { modelKey: currentKey, variant } }
        try {
          localStorage.setItem(`opencode.remote.model.session.${sessionID}`, JSON.stringify({ modelKey: currentKey, variant }))
        } catch { /* ignore */ }
        return next
      })
    } else {
      setSelectedVariant(variant)
      if (variant) {
        localStorage.setItem(STORAGE_KEYS.MODEL_VARIANT, variant)
      } else {
        localStorage.removeItem(STORAGE_KEYS.MODEL_VARIANT)
      }
    }
    const currentKey = sessionID ? sessionModels[sessionID]?.modelKey ?? selectedModelKey : selectedModelKey
    if (currentKey) {
      const model = modelOptions.find((m) => modelKey(m) === currentKey)
      if (model) {
        setRecentModelsArr((prev) => {
          const filtered = prev.filter((m) => modelKey(m) !== currentKey)
          filtered.unshift(variant ? { ...model, variant } : model)
          return filtered.slice(0, MAX_RECENT)
        })
      }
    }
  }, [selectedModelKey, activeModelOption, sessionModels, modelOptions, setRecentModelsArr])

  const changeAgent = useCallback((nextAgentID: string, directory?: string) => {
    setSelectedAgentID(nextAgentID)
    localStorage.setItem(STORAGE_KEYS.AGENT, nextAgentID)
    if (directory) localStorage.setItem(agentStorageKey(directory), nextAgentID)
  }, [])

  return {
    agentOptions, agentLoadError, selectedAgentID, modelOptions, modelLoadError,
    selectedModelKey, modelQuery, setModelQuery, selectedModel, primaryAgentOptions,
    allPrimaryAgents, disabledAgents, toggleAgentEnabled,
    activeAgent, activeAgentID, activeModelOption, activeModel, filteredModelOptions,
    groupedModelOptions, variantGroups, recentModels, activeModelVariants,
    selectedVariant, changeVariant, getModelForSession,
    loadAgents, loadModels, changeModel, changeAgent
  }
}
