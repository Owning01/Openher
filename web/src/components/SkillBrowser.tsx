import { memo, useState, useEffect, useCallback } from "react"
import { api } from "../api"
import type { ServerConfig } from "../types"

type SkillItem = { id: string; name: string; description?: string }

type Props = {
  config: ServerConfig
  onClose: () => void
  onSelect: (skillName: string) => void
}

export const SkillBrowser = memo(function SkillBrowser({ config, onClose, onSelect }: Props) {
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.listSkills(config).then((list) => {
      setSkills(list)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [config])

  const filtered = query
    ? skills.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()) || (s.description?.toLowerCase() ?? "").includes(query.toLowerCase()))
    : skills

  const handleSelect = useCallback((name: string) => {
    onSelect(name)
    onClose()
  }, [onSelect, onClose])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500, maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
        <div className="modal-header">
          <h3>Skills</h3>
          <button className="btn-icon btn-secondary compact" onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <input
          type="search"
          placeholder="Search skills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          style={{ margin: "0 0 var(--space-3)", padding: "0.5rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "0.85rem", width: "100%" }}
        />
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
          {loading && <div style={{ padding: "1rem", textAlign: "center", color: "var(--muted)" }}>Loading...</div>}
          {!loading && filtered.length === 0 && <div style={{ padding: "1rem", textAlign: "center", color: "var(--muted)" }}>No skills found</div>}
          {filtered.map((skill) => (
            <button
              key={skill.id}
              onClick={() => handleSelect(skill.name)}
              style={{ textAlign: "left", padding: "0.6rem 0.8rem", border: "none", borderRadius: "var(--radius-sm)", background: "transparent", color: "var(--text)", cursor: "pointer", fontSize: "0.85rem", display: "flex", flexDirection: "column", gap: 2, minHeight: 0 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--primary-soft)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <strong>{skill.name}</strong>
              {skill.description && <small style={{ color: "var(--muted)" }}>{skill.description}</small>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

export default SkillBrowser
