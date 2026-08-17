import { memo, useState, useCallback, useEffect } from "react"
import { useT } from "../i18n-context"
import { Modal } from "./Modal"
import { api } from "../api"
import { EyeIcon, EyeOffIcon, RefreshIcon } from "../Icons"
import type { ServerConfig, ServerProviderList } from "../types"

type Props = {
  config: ServerConfig
  onClose: () => void
  onConnect: (providerID: string, apiKey: string) => Promise<boolean>
  onDisconnect: (providerID: string) => Promise<void>
  onAddCustom: (providerID: string, name: string, baseURL: string, models: string[]) => Promise<boolean>
  onConnected: () => void
}

function sourceLabel(source: ServerProviderList["all"][number]["source"], t: ReturnType<typeof useT>): string {
  switch (source) {
    case "env": return t('connect.sourceEnv')
    case "config": return t('connect.sourceConfig')
    case "custom": return t('connect.sourceCustom')
    case "api": return t('connect.sourceApi')
    default: return source
  }
}

export const ConnectProviderSheet = memo(function ConnectProviderSheet({
  config, onClose, onConnect, onDisconnect, onAddCustom, onConnected,
}: Props) {
  const t = useT()
  const [list, setList] = useState<ServerProviderList>({ all: [], default: {}, connected: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyID, setBusyID] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [keyFor, setKeyFor] = useState<{ id: string; name: string } | null>(null)
  const [key, setKey] = useState("")
  const [showKey, setShowKey] = useState(false)

  const [showCustom, setShowCustom] = useState(false)
  const [cID, setCID] = useState("")
  const [cName, setCName] = useState("")
  const [cURL, setCURL] = useState("")
  const [cModels, setCModels] = useState("")
  const [cKey, setCKey] = useState("")
  const [showCKey, setShowCKey] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setList(await api.loadProviders(config))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err))
    }
    setLoading(false)
  }, [config])

  useEffect(() => {
    void load()
  }, [load])

  const connected = (id: string) => list.connected.includes(id)

  const handleConnect = useCallback(async (id: string) => {
    if (!key.trim()) return
    setBusyID(id)
    setError(null)
    const ok = await onConnect(id, key.trim())
    setBusyID(null)
    if (ok) {
      setKeyFor(null)
      setKey("")
      await load()
      onConnected()
    }
  }, [key, onConnect, load, onConnected])

  const handleDisconnect = useCallback(async (id: string) => {
    setBusyID(id)
    setError(null)
    await onDisconnect(id)
    setBusyID(null)
    await load()
    onConnected()
  }, [onDisconnect, load, onConnected])

  const handleAddCustom = useCallback(async () => {
    const pid = cID.trim().toLowerCase().replace(/[^a-z0-9-]/g, "")
    const name = cName.trim() || pid
    const url = cURL.trim()
    const models = cModels.split(",").map((m) => m.trim()).filter(Boolean)
    if (!pid || !url || models.length === 0 || !cKey.trim()) {
      setError(t('connect.customRequired'))
      return
    }
    setBusyID("__custom__")
    setError(null)
    const ok = await onAddCustom(pid, name, url, models)
    if (ok) {
      await onConnect(pid, cKey.trim())
    }
    setBusyID(null)
    if (ok) {
      setShowCustom(false)
      setCID(""); setCName(""); setCURL(""); setCModels(""); setCKey("")
      await load()
      onConnected()
    }
  }, [cID, cName, cURL, cModels, cKey, onAddCustom, onConnect, load, onConnected, t])

  return (
    <Modal onClose={onClose} aria-labelledby="connect-sheet-title">
      <div className="connect-sheet-header">
        <div>
          <h3 id="connect-sheet-title">{t('connect.title')}</h3>
          <p className="subtle">{t('connect.desc')}</p>
        </div>
        <button type="button" className="btn-icon btn-ghost" onClick={() => void load()} title={t('connect.refresh')} aria-label={t('connect.refresh')}>
          <RefreshIcon size={16} />
        </button>
      </div>

      {(error || loadError) && (
        <div className="notice error" style={{ marginBottom: "var(--space-2)" }}>{error || loadError}</div>
      )}

      <div className="connect-sheet-body">
        {loading ? (
          <p className="subtle">{t('detail.modelLoading')}</p>
        ) : list.all.length === 0 ? (
          <p className="subtle">{t('connect.noProviders')}</p>
        ) : (
          <div className="provider-list">
            {[...list.all].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
              <div key={p.id} className="provider-row">
                <div className="provider-info">
                  <span className="provider-name">{p.name || p.id}</span>
                  <span className="provider-meta">
                    {t('connect.sourcePrefix', { source: sourceLabel(p.source, t) })}
                    {Object.keys(p.models).length > 0 && ` · ${Object.keys(p.models).length} modelos`}
                    {connected(p.id) && <span className="provider-badge connected">{t('settings.connected')}</span>}
                  </span>
                </div>
                <div className="provider-actions">
                  {connected(p.id) ? (
                    <button className="btn-sm btn-danger" onClick={() => void handleDisconnect(p.id)} disabled={busyID === p.id}>
                      {busyID === p.id ? t('settings.connecting') : t('settings.disconnect')}
                    </button>
                  ) : (
                    <button className="btn-sm btn-primary" onClick={() => setKeyFor({ id: p.id, name: p.name || p.id })}>
                      {t('settings.connect')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="connect-custom">
        <button type="button" className="btn-link" onClick={() => setShowCustom((v) => !v)} aria-expanded={showCustom}>
          {showCustom ? t('connect.hideCustom') : t('connect.customTitle')}
        </button>
        {showCustom && (
          <div className="connect-custom-form">
            <p className="subtle">{t('connect.customHint')}</p>
            <div className="form-grid">
              <label>
                {t('connect.providerId')}
                <input className="input" value={cID} onChange={(e) => setCID(e.target.value)} placeholder="myprovider" autoComplete="off" />
              </label>
              <label>
                {t('connect.providerName')}
                <input className="input" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="My Provider" autoComplete="off" />
              </label>
              <label>
                {t('connect.baseUrl')}
                <input className="input" value={cURL} onChange={(e) => setCURL(e.target.value)} placeholder="https://api.example.com/v1" autoComplete="off" />
              </label>
              <label>
                {t('connect.models')}
                <input className="input" value={cModels} onChange={(e) => setCModels(e.target.value)} placeholder="gpt-4o, gpt-4o-mini" autoComplete="off" />
              </label>
              <label>
                {t('settings.apiKey')}
                <div className="password-wrapper">
                  <input className="input" type={showCKey ? "text" : "password"} value={cKey} onChange={(e) => setCKey(e.target.value)}
                    placeholder={t('settings.apiKeyPlaceholder')} autoComplete="off" />
                  <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowCKey((v) => !v)} tabIndex={-1} aria-label="Toggle password visibility">
                    {showCKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                  </button>
                </div>
              </label>
            </div>
            <button type="button" className="btn-primary" onClick={() => void handleAddCustom()} disabled={busyID === "__custom__"}>
              {busyID === "__custom__" ? t('settings.connecting') : t('connect.addProvider')}
            </button>
          </div>
        )}
      </div>

      <div className="modal-actions" style={{ gridTemplateColumns: "1fr" }}>
        <button type="button" className="btn-secondary" onClick={onClose}>{t('settings.cancel')}</button>
      </div>

      {keyFor && (
        <Modal onClose={() => { setKeyFor(null); setKey("") }} aria-label={keyFor.name}>
          <h3 style={{ margin: "0 0 var(--space-3)" }}>{keyFor.name}</h3>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "var(--space-1)" }}>
              {t('settings.apiKey')}
            </label>
            <div className="password-wrapper">
              <input className="input" type={showKey ? "text" : "password"} value={key} onChange={(e) => setKey(e.target.value)}
                placeholder={t('settings.apiKeyPlaceholder')} autoFocus autoComplete="off"
                style={{ width: "100%", boxSizing: "border-box" }} />
              <button type="button" className="btn-icon btn-ghost password-toggle" onClick={() => setShowKey((v) => !v)} tabIndex={-1} aria-label="Toggle password visibility">
                {showKey ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>
          <div className="modal-actions" style={{ gridTemplateColumns: "1fr 1fr", marginTop: "var(--space-3)" }}>
            <button type="button" className="btn-cancel" onClick={() => { setKeyFor(null); setKey("") }}>{t('settings.cancel')}</button>
            <button type="button" className="btn-primary" onClick={() => void handleConnect(keyFor.id)} disabled={!key.trim() || busyID === keyFor.id}>
              {busyID === keyFor.id ? t('settings.connecting') : t('settings.connect')}
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  )
})

export default ConnectProviderSheet