import { memo, useState, useEffect, useCallback } from "react"
import { ModalHeader } from "./ModalHeader"
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
      <div className="modal-content skill-browser" onClick={(e) => e.stopPropagation()}>
        <ModalHeader title="Skills" onClose={onClose} />
        <div className="skill-search">
          <input type="search" placeholder="Search skills..." value={query}
            onChange={(e) => setQuery(e.target.value)} autoFocus />
        </div>
        <div className="skill-list">
          {loading && <div className="skill-empty">Loading...</div>}
          {!loading && filtered.length === 0 && <div className="skill-empty">No skills found</div>}
          {filtered.map((skill) => (
            <button key={skill.id} className="skill-item" onClick={() => handleSelect(skill.name)}>
              <strong>{skill.name}</strong>
              {skill.description && <small className="truncate">{skill.description}</small>}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
})

export default SkillBrowser
