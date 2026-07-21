import { memo, useState, useCallback } from "react"
import { useT } from "../i18n-context"
import type { ProviderInfo } from "../types"

type ApiKeyModalProps = {
  provider: ProviderInfo
  onConnect: (apiKey: string) => void
  onClose: () => void
  connecting: boolean
}

const ApiKeyModal = memo(function ApiKeyModal({ provider, onConnect, onClose, connecting }: ApiKeyModalProps) {
  const t = useT()
  const [key, setKey] = useState("")

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (key.trim()) onConnect(key.trim())
  }, [key, onConnect])

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
        <h3 style={{ margin: "0 0 var(--space-3)" }}>{provider.name}</h3>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div>
            <label style={{ display: "block", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "var(--space-1)" }}>
              {t('settings.apiKey')}
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={t('settings.apiKeyPlaceholder')}
              autoFocus
              disabled={connecting}
              className="input"
              style={{ width: "100%", boxSizing: "border-box" }}
            />
          </div>
          {connecting && <span style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{t('settings.connecting')}</span>}
          <div className="modal-actions" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <button type="button" className="btn-cancel" onClick={onClose} disabled={connecting}>
              {t('settings.cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={!key.trim() || connecting}>
              {t('settings.connect')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

type Props = {
  providers: ProviderInfo[]
  connecting: string | null
  error: string | null
  onConnect: (providerID: string, apiKey: string) => void
  onDisconnect: (providerID: string) => void
}

export const ProviderManager = memo(function ProviderManager({ providers, connecting, error, onConnect, onDisconnect }: Props) {
  const t = useT()
  const [selected, setSelected] = useState<ProviderInfo | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const visible = showArchived ? providers : providers.filter((p) => p.modelsCount > 0 || p.connected)

  return (
    <div className="provider-manager">
      {error && <div className="notice error" style={{ marginBottom: "var(--space-2)" }}>{error}</div>}

      {visible.length === 0 ? (
        <p className="subtle" style={{ fontSize: "0.82rem" }}>{t('settings.noProviders')}</p>
      ) : (
        <div className="provider-list">
          {visible.map((p) => (
            <div key={p.id} className="provider-row">
              <div className="provider-info">
                <span className="provider-name">{p.name}</span>
                <span className="provider-meta">
                  {p.modelsCount} modelos
                  {p.connected && <span className="provider-badge connected">{t('settings.connected')}</span>}
                </span>
              </div>
              <div className="provider-actions">
                {p.connected ? (
                  <button className="btn-sm btn-danger" onClick={() => onDisconnect(p.id)}>
                    {t('settings.disconnect')}
                  </button>
                ) : (
                  <button
                    className="btn-sm btn-primary"
                    onClick={() => setSelected(p)}
                    disabled={connecting === p.id}
                  >
                    {connecting === p.id ? t('settings.connecting') : t('settings.connect')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        className="btn-link"
        onClick={() => setShowArchived((v) => !v)}
        style={{ fontSize: "0.75rem", marginTop: "var(--space-2)", opacity: 0.7 }}
      >
        {showArchived ? t('settings.hideEmpty') : t('settings.showEmpty')}
      </button>

      {selected && (
        <ApiKeyModal
          provider={selected}
          connecting={connecting === selected.id}
          onConnect={(apiKey) => { onConnect(selected.id, apiKey); setSelected(null) }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
})

export default ProviderManager