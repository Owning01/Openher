// useSettingsDraft — estado y handlers del borrador de conexión (F4-P4).
// Extraído de SettingsPanel.tsx sin cambios de conducta.
import { useCallback, useMemo, useState } from "react"
import type { ModelOption, ServerConfig, ServerProfile } from "../../types"
import { useT } from "../../i18n-context"

type UseSettingsDraftArgs = {
  draftConfig: ServerConfig
  onChange: (config: ServerConfig) => void
  mk: (model: { providerID: string; modelID: string; variant?: string }) => string
  modelOptions: ModelOption[]
  onAddServerProfile: (name: string, kind: "http", config: ServerConfig) => ServerProfile | null
  onApplyServerProfile: (profile: ServerProfile) => void
}

export function useSettingsDraft({
  draftConfig, onChange, mk, modelOptions, onAddServerProfile, onApplyServerProfile
}: UseSettingsDraftArgs) {
  const t = useT()
  const [draftProfile, setDraftProfile] = useState<{ name: string; config: ServerConfig } | null>(null)
  const [showServerPass, setShowServerPass] = useState(false)

  const uniqueModels = useMemo(
    () => Array.from(new Map(modelOptions.map((opt) => [mk(opt), opt])).values()),
    [modelOptions, mk]
  )

  const startDraft = useCallback(() => {
    setDraftProfile({ name: "", config: { ...draftConfig } })
  }, [draftConfig])

  const draftField = useCallback(<K extends keyof ServerConfig>(key: K, value: ServerConfig[K]) => {
    setDraftProfile((d) => (d ? { ...d, config: { ...d.config, [key]: value } } : d))
  }, [])

  const saveDraft = useCallback(() => {
    if (!draftProfile) return
    const profile = onAddServerProfile(draftProfile.name.trim() || t('settings.serverUntitled'), "http", draftProfile.config)
    if (profile) setDraftProfile(null)
  }, [draftProfile, onAddServerProfile, t])

  const connectDraft = useCallback(() => {
    if (!draftProfile) return
    const profile = onAddServerProfile(draftProfile.name.trim() || t('settings.serverUntitled'), "http", draftProfile.config)
    if (profile) {
      setDraftProfile(null)
      onApplyServerProfile(profile)
    }
  }, [draftProfile, onAddServerProfile, onApplyServerProfile, t])

  const setDraftName = useCallback((name: string) => {
    setDraftProfile((d) => (d ? { ...d, name } : d))
  }, [])

  const discardDraft = useCallback(() => setDraftProfile(null), [])

  const toggleServerPass = useCallback(() => setShowServerPass((v) => !v), [])

  const setField = useCallback((field: keyof ServerConfig, value: string | number) => {
    onChange({ ...draftConfig, [field]: value })
  }, [draftConfig, onChange])

  return {
    uniqueModels, draftProfile, startDraft, draftField, saveDraft, connectDraft, setDraftName, discardDraft,
    showServerPass, toggleServerPass, setField,
  }
}
