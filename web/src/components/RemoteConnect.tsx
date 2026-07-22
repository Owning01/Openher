import { useState } from "react"
import { useT } from "../i18n-context"
import { DEFAULT_SIGNALING_URL } from "../types"
import type { TunnelConfig } from "../types"

type RemoteConnectProps = {
  status: "idle" | "connecting" | "connected" | "disconnected" | "error"
  error: string | null
  savedConfig: TunnelConfig
  onConnect: (config: TunnelConfig) => void
  onDisconnect: () => void
  onClose: () => void
}

export function RemoteConnect({ status, error, savedConfig, onConnect, onDisconnect, onClose }: RemoteConnectProps) {
  const t = useT()
  const [name, setName] = useState(savedConfig.name || "")
  const [password, setPassword] = useState(savedConfig.password || "")
  const [signalingURL, setSignalingURL] = useState(savedConfig.signalingURL || DEFAULT_SIGNALING_URL)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleConnect = () => {
    if (!name.trim() || !password.trim()) return
    onConnect({ name: name.trim(), password: password.trim(), signalingURL: signalingURL.trim() || DEFAULT_SIGNALING_URL })
  }

  const isConnected = status === "connected"

  return (
    <div className="remote-connect">
      <div className="remote-connect-header">
        <h3>{t('tunnel.title')}</h3>
        <button className="btn-icon btn-secondary" onClick={onClose}>✕</button>
      </div>

      <div className="remote-connect-status">
        <span className={`status-badge status-${status}`}>
          {status === "idle" && t('tunnel.disconnected')}
          {status === "connecting" && t('tunnel.connecting')}
          {status === "connected" && t('tunnel.connected')}
          {status === "disconnected" && t('tunnel.disconnected')}
          {status === "error" && t('tunnel.error')}
        </span>
      </div>

      {error && <div className="remote-connect-error">{error}</div>}

      {!isConnected ? (
        <div className="remote-connect-form">
          <label className="field-label">
            <span>{t('tunnel.name')}</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('tunnel.namePlaceholder')}
              disabled={status === "connecting"}
            />
          </label>

          <label className="field-label">
            <span>{t('tunnel.password')}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('tunnel.passwordPlaceholder')}
              disabled={status === "connecting"}
            />
          </label>

          <button
            className="btn-primary"
            onClick={handleConnect}
            disabled={!name.trim() || !password.trim() || status === "connecting"}
          >
            {status === "connecting" ? t('tunnel.connecting') : t('tunnel.connect')}
          </button>

          <button className="btn-link" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? "Ocultar" : "Avanzado"}
          </button>

          {showAdvanced && (
            <label className="field-label">
              <span>{t('tunnel.signalingURL')}</span>
              <input
                type="text"
                value={signalingURL}
                onChange={(e) => setSignalingURL(e.target.value)}
                placeholder={DEFAULT_SIGNALING_URL}
              />
            </label>
          )}

          <p className="remote-connect-hint">{t('tunnel.qrHint')}</p>
        </div>
      ) : (
        <div className="remote-connect-connected">
          <p className="remote-connect-info">
            {t('tunnel.connected')}: <strong>{savedConfig.name}</strong>
          </p>
          <button className="btn-danger" onClick={onDisconnect}>
            {t('tunnel.disconnect')}
          </button>
        </div>
      )}
    </div>
  )
}
