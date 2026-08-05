import { memo, useState } from "react"
import { ModalHeader } from "./ModalHeader"
import { EyeIcon, EyeOffIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { ServerProfile } from "../types"

type Props = {
  profile: ServerProfile
  onSave: (name: string, config: ServerProfile["config"]) => void
  onClose: () => void
}

export const ServerProfileModal = memo(function ServerProfileModal({ profile, onSave, onClose }: Props) {
  const t = useT()
  const [name, setName] = useState(profile.name)
  const [host, setHost] = useState(profile.config.host)
  const [port, setPort] = useState(profile.config.port || 4096)
  const [username, setUsername] = useState(profile.config.username)
  const [password, setPassword] = useState(profile.config.password)
  const [showPassword, setShowPassword] = useState(false)

  const handleSave = () => {
    if (!host.trim()) return
    onSave(name.trim(), {
      host: host.trim(),
      port: Number(port || 4096),
      username: username.trim(),
      password
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={t('settings.editServer')}>
        <ModalHeader title={t('settings.editServer')} onClose={onClose} />
        <div className="modal-body">
          <div className="form-grid">
            <label className="form-field">
              <span>{t('settings.serverName')}</span>
              <input name="profileName" value={name} onChange={(e) => setName(e.target.value)}
                placeholder={t('settings.serverNamePlaceholder')} autoFocus />
            </label>
            <label className="form-field">
              <span>{t('settings.host')}</span>
              <input name="profileHost" value={host} onChange={(e) => setHost(e.target.value)} placeholder={t('settings.hostPlaceholder')} />
            </label>
            <label className="form-field">
              <span>{t('settings.port')}</span>
              <input name="profilePort" type="number" value={port} onChange={(e) => setPort(Number(e.target.value || 4096))} placeholder="4096" />
            </label>
            <label className="form-field">
              <span>{t('settings.username')}</span>
              <input name="profileUsername" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="opencode" />
            </label>
            <label className="form-field">
              <span>{t('settings.password')}</span>
              <div className="password-wrapper">
                <input name="profilePassword" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('settings.passwordPlaceholder')} />
                <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
            </label>
          </div>
          <div className="modal-actions">
            <button className="btn-primary compact" onClick={handleSave} disabled={!host.trim()}>{t('settings.saveAndApply')}</button>
            <button className="btn-secondary compact" onClick={onClose}>{t('settings.cancel')}</button>
          </div>
        </div>
      </div>
    </div>
  )
})
