import { useState } from "react"
import { useT } from "../i18n-context"
import { DEFAULT_SIGNALING_URL } from "../types"
import { EyeIcon, EyeOffIcon } from "../Icons"
import type { TunnelConfig } from "../types"

type RemoteConnectProps = {
  status: "idle" | "connecting" | "connected" | "disconnected" | "error"
  error: string | null
  savedConfig: TunnelConfig
  onConnect: (config: TunnelConfig) => void
  onDisconnect: () => void
  onClose: () => void
}

function parseICEServers(raw: string): RTCIceServer[] {
  return raw.split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({ urls: s }))
}

export function RemoteConnect({ status, error, savedConfig, onConnect, onDisconnect, onClose }: RemoteConnectProps) {
  const t = useT()
  const [name, setName] = useState(savedConfig.name || "")
  const [password, setPassword] = useState(savedConfig.password || "")
  const [showPassword, setShowPassword] = useState(false)
  const [signalingURL, setSignalingURL] = useState(savedConfig.signalingURL || DEFAULT_SIGNALING_URL)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [iceServersRaw, setIceServersRaw] = useState(
    (savedConfig.iceServers ?? []).map((s) => (Array.isArray(s.urls) ? s.urls.join(", ") : s.urls)).join("\n")
  )

  const handleConnect = () => {
    if (!name.trim() || !password.trim()) return
    onConnect({
      name: name.trim(),
      password: password.trim(),
      signalingURL: signalingURL.trim() || DEFAULT_SIGNALING_URL,
      iceServers: parseICEServers(iceServersRaw),
    })
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
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('tunnel.passwordPlaceholder')}
                disabled={status === "connecting"}
              />
              <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} disabled={status === "connecting"}>
                {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
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
            <>
              <label className="field-label">
                <span>{t('tunnel.signalingURL')}</span>
                <input
                  type="text"
                  value={signalingURL}
                  onChange={(e) => setSignalingURL(e.target.value)}
                  placeholder={DEFAULT_SIGNALING_URL}
                />
              </label>
              <label className="field-label">
                <span>TURN / STUN servers (opcional, uno por línea)</span>
                <textarea
                  value={iceServersRaw}
                  onChange={(e) => setIceServersRaw(e.target.value)}
                  placeholder="stun:stun.l.google.com:19302&#10;turn:turn.example.com:3478?transport=udp"
                  rows={3}
                />
              </label>
            </>
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
