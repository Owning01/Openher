// BrowserSection — agente de escritorio remoto (F4-P4). Extraído de
// SettingsPanel.tsx sin cambios de conducta.
import { TestIcon, LoadingIcon, EyeIcon, EyeOffIcon } from "../../../Icons"
import { useT } from "../../../i18n-context"
import { canTestDesktop } from "../../../desktop"
import type { RemoteDesktopConfigState } from "../useRemoteDesktopConfig"

export function BrowserSection({ remote }: { remote: RemoteDesktopConfigState }) {
  const t = useT()
  const {
    desktopCfg, setDesktopCfg, desktopTesting, desktopNotice, desktopNoticeType,
    showDesktopPass, setShowDesktopPass, desktopSaved, testDesktop,
  } = remote

  return (
    <>
     <p className="settings-group-heading">{t('settings.desktopTitle')}</p>
     <div className="setting-item-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <p className="setting-item-desc" style={{ marginBottom: 12 }}>{t('settings.desktopHint')}</p>
      <div className="desktop-settings-grid">
       <label className="field-label">
        {t('settings.host')}
        <input
         type="text"
         value={desktopCfg.host}
         onChange={(e) => setDesktopCfg((c) => ({ ...c, host: e.target.value }))}
         placeholder="100.101.102.103"
         className="settings-search-input"
        />
       </label>
       <label className="field-label">
        {t('settings.port')}
        <input
         type="number"
         value={desktopCfg.port}
         onChange={(e) => setDesktopCfg((c) => ({ ...c, port: Number(e.target.value) || 0 }))}
         placeholder="5901"
         className="settings-search-input"
        />
       </label>
       <label className="field-label">
        {t('settings.username')}
        <input
         type="text"
         value={desktopCfg.username}
         onChange={(e) => setDesktopCfg((c) => ({ ...c, username: e.target.value }))}
         className="settings-search-input"
        />
       </label>
       <label className="field-label">
        {t('settings.password')}
        <div className="password-wrapper">
         <input
          type={showDesktopPass ? "text" : "password"}
          value={desktopCfg.password}
          onChange={(e) => setDesktopCfg((c) => ({ ...c, password: e.target.value }))}
          className="settings-search-input"
         />
         <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowDesktopPass((v) => !v)} tabIndex={-1}>
          {showDesktopPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
         </button>
        </div>
       </label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
       <button
        type="button"
        className="ag-btn-open"
        onClick={testDesktop}
        disabled={desktopTesting || !canTestDesktop(desktopCfg)}
       >
        {desktopTesting ? <LoadingIcon size={14} /> : <span style={{ display: "inline-flex", marginRight: 6 }}><TestIcon size={14} /></span>}
        {t('settings.desktopTest')}
       </button>
       {desktopSaved && <span className="desktop-saved-hint">{t('settings.desktopSaved')}</span>}
      </div>
      {desktopNotice && <p className={`desktop-settings-notice ${desktopNoticeType}`} style={{ marginTop: 8 }}>{desktopNotice}</p>}
     </div>
    </>
  )
}
