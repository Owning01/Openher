import { memo, useState } from "react"
import { useT } from "../i18n-context"
import { isDesktopShell, supportsAppUpdate, useAppUpdate } from "../hooks/useAppUpdate"

/**
 * Banner de actualización: aparece cuando el shell publica una versión más
 * nueva que la instalada.
 * - APK: descarga y abre el instalador; Android pide confirmar.
 * - Desktop con server remoto: descarga el zip, el shell reemplaza y relanza.
 */
export const AppUpdateBanner = memo(function AppUpdateBanner() {
  const t = useT()
  const { status, info, error, install } = useAppUpdate()
  const [hidden, setHidden] = useState(false)

  if (!supportsAppUpdate() || hidden) return null
  if (status !== "available" && status !== "downloading" && status !== "installing" && status !== "error") return null

  const busy = status === "downloading" || status === "installing"
  const desktop = isDesktopShell()
  const version = desktop ? (info?.desktop?.version ?? info?.version ?? "") : (info?.version ?? "")
  const title =
    status === "error" ? t('update.error') : `${t('update.available', { version })}`
  const detail = status === "error" ? error : info?.notes

  return (
    <div className="app-update-banner" role="status">
      <div className="aub-text">
        <strong>{title}</strong>
        {detail ? <span className="aub-notes">{detail}</span> : null}
      </div>
      <button className="aub-btn" onClick={() => void install()} disabled={busy}>
        {status === "downloading"
          ? t('update.downloading')
          : status === "installing"
            ? (desktop ? t('update.restarting') : t('update.installing'))
            : t('update.install')}
      </button>
      <button className="aub-close" onClick={() => setHidden(true)} aria-label={t('update.later')}>
        ×
      </button>
    </div>
  )
})
