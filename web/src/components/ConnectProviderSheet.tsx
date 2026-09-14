import { memo, useState, useCallback, useEffect, useMemo } from "react"
import { useT } from "../i18n-context"
import { Modal } from "./Modal"
import { api } from "../api"
import { EyeIcon, EyeOffIcon, RefreshIcon, SearchIcon, CloseIcon } from "../Icons"
import type { ServerConfig, ServerProviderConnection, ServerProviderList } from "../types"

type Props = {
  config: ServerConfig
  onClose: () => void
  onConnect: (providerID: string, apiKey: string, label?: string) => Promise<boolean>
  onDisconnect: (providerID: string) => Promise<void>
  /** v2: quita una cuenta concreta (credencial) del proveedor. */
  onRemoveCredential: (credentialID: string) => Promise<void>
  /** v2: marca una cuenta concreta como la activa. */
  onActivateCredential: (credentialID: string) => Promise<void>
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
  config, onClose, onConnect, onDisconnect, onRemoveCredential, onActivateCredential, onAddCustom, onConnected,
}: Props) {
  const t = useT()
  const [list, setList] = useState<ServerProviderList>({ all: [], default: {}, connected: [] })
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [busyID, setBusyID] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [keyFor, setKeyFor] = useState<{ id: string; name: string; existing: number } | null>(null)
  const [key, setKey] = useState("")
  const [keyLabel, setKeyLabel] = useState("")
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

  const connectedSet = useMemo(() => new Set(list.connected), [list.connected])
  const connected = (id: string) => connectedSet.has(id)

  // Buscador + conectados primero: la lista v2 trae >200 integraciones y sin
  // filtro era imposible encontrar la que ya tenías conectada.
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...list.all]
      .filter((p) => !q || `${p.name || p.id} ${p.id}`.toLowerCase().includes(q))
      .sort((a, b) => {
        const ca = connectedSet.has(a.id) ? 0 : 1
        const cb = connectedSet.has(b.id) ? 0 : 1
        if (ca !== cb) return ca - cb
        return (a.name || a.id).localeCompare(b.name || b.id)
      })
  }, [list.all, query, connectedSet])

  const handleConnect = useCallback(async (id: string) => {
    if (!key.trim()) return
    setBusyID(id)
    setError(null)
    const ok = await onConnect(id, key.trim(), keyLabel.trim() || undefined)
    setBusyID(null)
    if (ok) {
      setKeyFor(null)
      setKey("")
      setKeyLabel("")
      await load()
      onConnected()
    }
  }, [key, keyLabel, onConnect, load, onConnected])

  const handleDisconnect = useCallback(async (id: string) => {
    setBusyID(id)
    setError(null)
    await onDisconnect(id)
    setBusyID(null)
    await load()
    onConnected()
  }, [onDisconnect, load, onConnected])

  const handleRemoveAccount = useCallback(async (credentialID: string) => {
    setBusyID(credentialID)
    setError(null)
    await onRemoveCredential(credentialID)
    setBusyID(null)
    await load()
    onConnected()
  }, [onRemoveCredential, load, onConnected])

  const handleActivateAccount = useCallback(async (credentialID: string) => {
    setBusyID(credentialID)
    setError(null)
    await onActivateCredential(credentialID)
    setBusyID(null)
    await load()
    onConnected()
  }, [onActivateCredential, load, onConnected])

  const openKeyFor = useCallback((p: ServerProviderList["all"][number]) => {
    const existing = (p.connections ?? []).filter((c) => c.type === "credential").length
    setKeyFor({ id: p.id, name: p.name || p.id, existing })
    setKey("")
    setKeyLabel("")
  }, [])

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

      <div className="connect-search">
        <SearchIcon size={15} className="connect-search-icon" />
        <input
          className="input connect-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('connect.search')}
          aria-label={t('connect.search')}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
        />
        {query && (
          <button type="button" className="btn-icon btn-ghost connect-search-clear" onClick={() => setQuery("")} aria-label={t('connect.clearSearch')} title={t('connect.clearSearch')} tabIndex={-1}>
            <CloseIcon size={14} />
          </button>
        )}
      </div>
      {list.connected.length > 0 && (
        <p className="subtle connect-connected-count">{t('connect.connectedCount', { count: list.connected.length })}</p>
      )}

      {(error || loadError) && (
        <div className="notice error" style={{ marginBottom: "var(--space-2)" }}>{error || loadError}</div>
      )}

      <div className="connect-sheet-body">
        {loading ? (
          <p className="subtle">{t('detail.modelLoading')}</p>
        ) : list.all.length === 0 ? (
          <p className="subtle">{t('connect.noProviders')}</p>
        ) : visible.length === 0 ? (
          <p className="subtle">{t('connect.noResults')}</p>
        ) : (
          <div className="provider-list">
            {visible.map((p) => {
              const connections = p.connections
              const supportsAccounts = connections !== undefined
              const creds = (connections ?? []).filter(
                (c): c is Extract<ServerProviderConnection, { type: "credential" }> => c.type === "credential",
              )
              const envs = (connections ?? []).filter(
                (c): c is Extract<ServerProviderConnection, { type: "env" }> => c.type === "env",
              )
              const hasAccounts = creds.length > 0
              return (
                <div key={p.id} className={`provider-row${hasAccounts ? " connected" : ""}`}>
                  <div className="provider-info">
                    <span className="provider-name">{p.name || p.id}</span>
                    <span className="provider-meta">
                      {t('connect.sourcePrefix', { source: sourceLabel(p.source, t) })}
                      {Object.keys(p.models).length > 0 && ` · ${Object.keys(p.models).length} modelos`}
                      {hasAccounts && <span className="provider-badge connected">{t('settings.connected')}</span>}
                    </span>
                    {supportsAccounts && connections.length > 0 && (
                      <ul className="provider-accounts">
                        {creds.map((c, i) => (
                          <li key={c.id} className="provider-account">
                            <span className="provider-account-label">{c.label || t('connect.accountDefault')}</span>
                            {i === 0 ? (
                              <span className="provider-badge active">{t('connect.accountActive')}</span>
                            ) : (
                              <button type="button" className="btn-link provider-account-action" disabled={busyID === c.id}
                                onClick={() => void handleActivateAccount(c.id)}>
                                {t('connect.accountActivate')}
                              </button>
                            )}
                            <button type="button" className="btn-icon btn-ghost provider-account-remove" disabled={busyID === c.id}
                              onClick={() => void handleRemoveAccount(c.id)}
                              aria-label={t('connect.accountRemove')} title={t('connect.accountRemove')}>
                              <CloseIcon size={13} />
                            </button>
                          </li>
                        ))}
                        {envs.map((c) => (
                          <li key={`env-${c.name}`} className="provider-account">
                            <span className="provider-account-label">{c.name}</span>
                            <span className="provider-account-env">{t('connect.sourceEnv')}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="provider-actions">
                    {supportsAccounts ? (
                      <button className="btn-sm btn-primary" onClick={() => openKeyFor(p)} disabled={busyID === p.id}>
                        {hasAccounts ? t('connect.addAccount') : t('settings.connect')}
                      </button>
                    ) : connected(p.id) ? (
                      <button className="btn-sm btn-danger" onClick={() => void handleDisconnect(p.id)} disabled={busyID === p.id}>
                        {busyID === p.id ? t('settings.connecting') : t('settings.disconnect')}
                      </button>
                    ) : (
                      <button className="btn-sm btn-primary" onClick={() => openKeyFor(p)}>
                        {t('settings.connect')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
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
        <Modal onClose={() => { setKeyFor(null); setKey(""); setKeyLabel("") }} aria-label={keyFor.name}>
          <h3 style={{ margin: "0 0 var(--space-3)" }}>{keyFor.name}</h3>
          {keyFor.existing > 0 && (
            <div style={{ marginBottom: "var(--space-3)" }}>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "var(--space-1)" }}>
                {t('connect.accountLabel')}
              </label>
              <input className="input" type="text" value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)}
                placeholder={t('connect.accountLabelPlaceholder', { n: keyFor.existing + 1 })} autoComplete="off"
                style={{ width: "100%", boxSizing: "border-box" }} />
              <p className="subtle" style={{ margin: "var(--space-1) 0 0" }}>{t('connect.accountLabelHint')}</p>
            </div>
          )}
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
            <button type="button" className="btn-cancel" onClick={() => { setKeyFor(null); setKey(""); setKeyLabel("") }}>{t('settings.cancel')}</button>
            <button type="button" className="btn-primary" onClick={() => void handleConnect(keyFor.id)} disabled={!key.trim() || busyID === keyFor.id}>
              {busyID === keyFor.id ? t('settings.connecting') : (keyFor.existing > 0 ? t('connect.addAccount') : t('settings.connect'))}
            </button>
          </div>
        </Modal>
      )}
    </Modal>
  )
})

export default ConnectProviderSheet