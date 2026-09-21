import { memo, useCallback, useEffect, useMemo, useState } from "react"
import { api } from "../api"
import { Modal } from "./Modal"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"
import { getApiVersion } from "../shared/api/version"
import type { MCPServerInfo, ServerConfig } from "../types"

type Props = {
  config: ServerConfig
  directory?: string
  onClose: () => void
  onSelect?: (name: string) => void
}

/** Un server se puede desconectar si está en marcha (o intentando). */
function isMcpActive(status: MCPServerInfo["status"]): boolean {
  return status === "connected" || status === "pending" || status === "needs_auth"
}

export const MCPBrowser = memo(function MCPBrowser({ config, directory, onClose, onSelect }: Props) {
  const t = useT()
  const [isV2, setIsV2] = useState<boolean | null>(null)
  const [servers, setServers] = useState<MCPServerInfo[]>([])
  const [serversLoading, setServersLoading] = useState(true)
  const [serversError, setServersError] = useState<string | null>(null)
  const [busyName, setBusyName] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [resources, setResources] = useState<{ id: string; name: string; description?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  const loadServers = useCallback(async () => {
    setServersLoading(true)
    setServersError(null)
    try {
      setServers(await api.listMCPServers(config, directory))
    } catch (err) {
      setServersError((err as Error).message || t('mcp.loadError'))
    } finally {
      setServersLoading(false)
    }
  }, [config, directory, t])

  const loadResources = useCallback(() => {
    setLoading(true)
    setError(null)
    api.listMCPResources(config, directory).then((r) => {
      setResources(r)
      setLoading(false)
    }).catch((err) => {
      setError((err as Error).message || "Failed to load MCP resources")
      setLoading(false)
    })
  }, [config, directory])

  useEffect(() => { void loadServers() }, [loadServers])
  useEffect(() => { loadResources() }, [loadResources])
  useEffect(() => {
    getApiVersion(config).then((v) => setIsV2(v === "v2")).catch(() => setIsV2(false))
  }, [config])

  // Un server "pending" puede tardar: refrescar hasta que conecte o falle.
  useEffect(() => {
    if (!servers.some((s) => s.status === "pending")) return
    const timer = setInterval(() => { void loadServers() }, 2500)
    return () => clearInterval(timer)
  }, [servers, loadServers])

  const toggleServer = useCallback(async (server: MCPServerInfo) => {
    setBusyName(server.name)
    setActionError(null)
    try {
      if (isMcpActive(server.status)) await api.disconnectMCPServer(config, server.name, directory)
      else await api.connectMCPServer(config, server.name, directory)
      await loadServers()
      loadResources()
    } catch (err) {
      setActionError(`${server.name}: ${(err as Error).message || t('mcp.actionError')}`)
    } finally {
      setBusyName(null)
    }
  }, [config, directory, loadServers, loadResources, t])

  const list = useMemo(() => (Array.isArray(resources) ? resources : []), [resources])
  const filtered = useMemo(() => {
    if (!query.trim()) return list
    const q = query.toLowerCase()
    return list.filter((r) => r.name.toLowerCase().includes(q) || (r.id ?? "").toLowerCase().includes(q))
  }, [list, query])

  return (
    <Modal onClose={onClose} variant="overlay" className="mcp-browser" label={t('mcp.title')}>
        <ModalHeader title={t('mcp.title')} onClose={onClose} />
        <div className="modal-body">
          <section className="mcp-section">
            <div className="mcp-section-head">
              <h4>{t('mcp.servers')}</h4>
              <button type="button" className="mcp-refresh" onClick={() => void loadServers()} disabled={serversLoading}>
                {t('mcp.refresh')}
              </button>
            </div>
            {isV2 === false ? (
              <p className="subtle">{t('mcp.v2Only')}</p>
            ) : serversLoading ? (
              <p className="subtle">{t('mcpBrowser.loading')}</p>
            ) : serversError ? (
              <p className="error">{serversError}</p>
            ) : servers.length === 0 ? (
              <p className="subtle">{t('mcp.empty')}</p>
            ) : (
              <div className="mcp-list">
                {servers.map((s) => {
                  const active = isMcpActive(s.status)
                  const busy = busyName === s.name
                  return (
                    <div key={s.name} className="mcp-server">
                      <div className="mcp-server-info">
                        <div className="mcp-server-name">
                          <span className={`mcp-dot mcp-dot-${s.status}`} aria-hidden="true" />
                          <strong>{s.name}</strong>
                        </div>
                        <span className={`mcp-status mcp-status-${s.status}`}>{t(`mcp.status.${s.status}`)}</span>
                        {s.error ? <p className="mcp-server-error">{s.error}</p> : null}
                      </div>
                      <button
                        type="button"
                        className={`mcp-toggle${active ? " mcp-toggle-off" : ""}`}
                        onClick={() => void toggleServer(s)}
                        disabled={busy || serversLoading}
                      >
                        {busy ? t('mcp.working') : active ? t('mcp.disconnect') : t('mcp.connect')}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
            {actionError ? <p className="error mcp-action-error">{actionError}</p> : null}
          </section>

          <section className="mcp-section">
            <div className="mcp-section-head">
              <h4>{t('mcp.resources')}</h4>
            </div>
            <input
              placeholder={t('mcpBrowser.search')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {loading ? (
              <p className="subtle">{t('mcpBrowser.loading')}</p>
            ) : error ? (
              <p className="error">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="subtle">{query ? t('mcpBrowser.noMatch') : t('mcpBrowser.empty')}</p>
            ) : (
              <div className="mcp-list">
                {filtered.map((r) => (
                  <div
                    key={r.id}
                    className={`mcp-item${onSelect ? " clickable" : ""}`}
                    onClick={() => { if (onSelect) { onSelect(r.name); onClose() } }}
                  >
                    <strong>{r.name}</strong>
                    {r.description && <p className="subtle">{r.description}</p>}
                    <code className="mcp-id">{r.id}</code>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
    </Modal>
  )
})
