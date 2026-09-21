// useRemoteDesktopConfig — borrador y test del agente de escritorio remoto
// (F4-P4). Extraído de SettingsPanel.tsx sin cambios de conducta.
import { useCallback, useState } from "react"
import { desktopApi, loadDesktopConfig, saveDesktopConfig, type DesktopConfig } from "../../desktop"
import { useT } from "../../i18n-context"

export function useRemoteDesktopConfig() {
  const t = useT()
  const [desktopCfg, setDesktopCfg] = useState<DesktopConfig>(() =>
    loadDesktopConfig() ?? { host: "", port: 5901, username: "opencode", password: "" }
  )
  const [desktopTesting, setDesktopTesting] = useState(false)
  const [desktopNotice, setDesktopNotice] = useState<string | null>(null)
  const [desktopNoticeType, setDesktopNoticeType] = useState<"ok" | "fail">("ok")
  const [showDesktopPass, setShowDesktopPass] = useState(false)
  const [desktopSaved, setDesktopSaved] = useState(false)

  const testDesktop = useCallback(async () => {
    setDesktopTesting(true)
    setDesktopNotice(null)
    setDesktopSaved(false)
    try {
      const ok = await desktopApi.health(desktopCfg)
      if (ok) {
        setDesktopNotice(t('settings.desktopOk', { os: "Remote Host", v: "1.0" }))
        setDesktopNoticeType("ok")
        saveDesktopConfig(desktopCfg)
        setDesktopSaved(true)
      } else {
        setDesktopNotice(t('settings.desktopFail', { err: "no responde" }))
        setDesktopNoticeType("fail")
      }
    } catch (e: any) {
      setDesktopNotice(t('settings.desktopFail', { err: e?.message || "error de red" }))
      setDesktopNoticeType("fail")
    } finally {
      setDesktopTesting(false)
    }
  }, [desktopCfg, t])

  return {
    desktopCfg, setDesktopCfg, desktopTesting, desktopNotice, desktopNoticeType,
    showDesktopPass, setShowDesktopPass, desktopSaved, testDesktop,
  }
}

export type RemoteDesktopConfigState = ReturnType<typeof useRemoteDesktopConfig>
