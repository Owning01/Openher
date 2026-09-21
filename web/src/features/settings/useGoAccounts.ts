// useGoAccounts — cuentas OpenCode Go y su uso (F4-P4). Extraído de
// SettingsPanel.tsx sin cambios de conducta.
import { useCallback, useEffect, useState } from "react"
import { canTestDesktop, type DesktopConfig } from "../../desktop"
import { fetchGoUsage, loadGoAccounts, saveGoAccounts, type GoUsage } from "../../goUsage"

export function useGoAccounts(desktopCfg: DesktopConfig) {
  const [goKeys, setGoKeys] = useState<string[]>([])
  const [goEditing, setGoEditing] = useState<Record<number, boolean>>({})
  const [goUsageMap, setGoUsageMap] = useState<Record<string, GoUsage | null>>({})
  const [goLoadingMap, setGoLoadingMap] = useState<Record<string, boolean>>({})
  const [goErrorMap, setGoErrorMap] = useState<Record<string, string | null>>({})

  const checkGo = useCallback(async (key: string) => {
    const trimmed = key.trim()
    if (!trimmed) return
    const proxy = canTestDesktop(desktopCfg)
      ? { host: desktopCfg.host, port: desktopCfg.port, username: desktopCfg.username, password: desktopCfg.password }
      : undefined
    setGoLoadingMap((m) => ({ ...m, [trimmed]: true }))
    setGoErrorMap((m) => ({ ...m, [trimmed]: null }))
    try {
      const usage = await fetchGoUsage(trimmed, proxy)
      setGoUsageMap((m) => ({ ...m, [trimmed]: usage }))
    } catch (e: any) {
      setGoErrorMap((m) => ({ ...m, [trimmed]: e?.message ?? "Error de red" }))
    } finally {
      setGoLoadingMap((m) => ({ ...m, [trimmed]: false }))
    }
  }, [desktopCfg])

  const updateGoKey = useCallback((index: number, val: string) => {
    setGoKeys((ks) => {
      const next = [...ks]
      next[index] = val
      return next
    })
  }, [])

  const removeGoKey = useCallback((index: number) => {
    setGoKeys((ks) => ks.filter((_, i) => i !== index))
  }, [])

  const addGoKey = useCallback(() => setGoKeys((ks) => [...ks, ""]), [])

  useEffect(() => {
    loadGoAccounts().then((accounts) => {
      setGoKeys(accounts)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    saveGoAccounts(goKeys).catch(() => {})
  }, [goKeys])

  return { goKeys, goEditing, setGoEditing, goUsageMap, goLoadingMap, goErrorMap, checkGo, updateGoKey, removeGoKey, addGoKey }
}
