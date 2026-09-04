import { memo, useState, useEffect } from "react"
import { api } from "../api"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"
import type { ServerConfig } from "../types"

type Props = {
  config: ServerConfig
  directory?: string
  onClose: () => void
  onSelect?: (name: string) => void
}

export const MCPBrowser = memo(function MCPBrowser({ config, directory, onClose, onSelect }: Props) {
  const t = useT()
  const [resources, setResources] = useState<{ id: string; name: string; description?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState("")

  useEffect(() => {
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

  const list = Array.isArray(resources) ? resources : []
  const filtered = query.trim()
    ? list.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()) || (r.id ?? "").toLowerCase().includes(query.toLowerCase()))
    : list

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content mcp-browser" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="MCP Resources">
        <ModalHeader title={t('session.mcpResources')} onClose={onClose} />
        <div className="modal-body">
          <input
            placeholder={t('mcpBrowser.search')}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading ? (
            <p className="subtle">{t('mcpBrowser.loading')}</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : filtered.length === 0 ? (
            <p className="subtle">{query ? "No matches" : "No MCP resources available"}</p>
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
        </div>
      </div>
    </div>
  )
})
