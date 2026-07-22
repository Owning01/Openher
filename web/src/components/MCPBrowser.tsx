import { memo, useState, useEffect } from "react"
import { api } from "../api"
import { ModalHeader } from "./ModalHeader"
import type { ServerConfig } from "../types"

type Props = {
  config: ServerConfig
  onClose: () => void
  onSelect?: (name: string) => void
}

export const MCPBrowser = memo(function MCPBrowser({ config, onClose, onSelect }: Props) {
  const [resources, setResources] = useState<{ id: string; name: string; description?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")

  useEffect(() => {
    setLoading(true)
    api.listMCPResources(config).then((r) => {
      setResources(r)
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })
  }, [config])

  const list = Array.isArray(resources) ? resources : []
  const filtered = query.trim()
    ? list.filter((r) => r.name.toLowerCase().includes(query.toLowerCase()) || r.id.toLowerCase().includes(query.toLowerCase()))
    : list

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content mcp-browser" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="MCP Resources">
        <ModalHeader title="MCP Resources" onClose={onClose} />
        <div className="modal-body">
          <input
            placeholder="Search resources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading ? (
            <p className="subtle">Loading...</p>
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
