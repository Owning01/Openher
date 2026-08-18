import { memo, useState, useEffect, useCallback, useMemo } from "react"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"
import { api } from "../api"
import type { ServerConfig } from "../types"

type SkillItem = { id: string; name: string; description?: string }

type Props = {
  config: ServerConfig
  onClose: () => void
  onSelect: (skillName: string) => void
}

function getSkillCategory(name: string): string {
  if (name.startsWith("flutter")) return "Flutter"
  if (name.startsWith("mcp")) return "MCP"
  if (name.includes("web") || name.includes("frontend") || name.includes("seo") || name.includes("performance")) return "Web"
  if (name.includes("code") || name.includes("optimize")) return "Code"
  return ""
}

function getSkillIcon(name: string): string {
  if (name.startsWith("flutter")) return "📱"
  if (name.startsWith("mcp")) return "🔌"
  if (name.includes("web") || name.includes("frontend")) return "🌐"
  if (name.includes("seo")) return "🔍"
  if (name.includes("performance")) return "⚡"
  if (name.includes("firebase")) return "🔥"
  if (name.includes("code") || name.includes("optimize")) return "🛠"
  if (name.includes("design") || name.includes("premium")) return "🎨"
  if (name.includes("canvas")) return "🖼"
  if (name.includes("lean") || name.includes("ctx")) return "🧠"
  if (name.includes("skill")) return "⚙️"
  if (name.includes("mi-entorno")) return "👤"
  return "📄"
}

export const SkillBrowser = memo(function SkillBrowser({ config, onClose, onSelect }: Props) {
  const t = useT()
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

  const filtered = useMemo(() => {
    if (!query) return skills
    const q = query.toLowerCase()
    return skills.filter((s) =>
      s.name.toLowerCase().includes(q) || (s.description?.toLowerCase() ?? "").includes(q)
    )
  }, [skills, query])

  const grouped = useMemo(() => {
    if (query) return [{ label: "", items: filtered }]
    const groups = new Map<string, SkillItem[]>()
    for (const skill of filtered) {
      const cat = getSkillCategory(skill.name)
      const key = cat || "Other"
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(skill)
    }
    const result: { label: string; items: SkillItem[] }[] = []
    for (const [label, items] of groups) {
      result.push({ label, items })
    }
    return result
  }, [filtered, query])

  const handleSelect = useCallback((name: string) => {
    onSelect(name)
    onClose()
  }, [onSelect, onClose])

  const firstSentence = useCallback((desc: string): string => {
    const clean = desc.replace(/\s+/g, " ").trim()
    if (!clean) return ""
    const match = clean.match(/^[^.!?]*[.!?]/)
    return (match ? match[0] : clean).trim()
  }, [])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content skill-browser" onClick={(e) => e.stopPropagation()}>
        <ModalHeader title={t('session.skills')} onClose={onClose} />
        <div className="skill-search">
          <input type="search" placeholder={t('skills.searchPlaceholder')} value={query}
            onChange={(e) => setQuery(e.target.value)} autoFocus />
        </div>
        <div className="skill-list">
          {loading && <div className="skill-empty">{t('skills.loading')}</div>}
          {!loading && filtered.length === 0 && <div className="skill-empty">{t('skills.empty')}</div>}
          {grouped.map((group) => (
            <div key={group.label || "__all__"} className="skill-group">
              {group.label && <div className="skill-group-label">{group.label}</div>}
              {group.items.map((skill) => (
                <button key={skill.id} className="skill-card" onClick={() => handleSelect(skill.name)}>
                  <span className="skill-card-icon">{getSkillIcon(skill.name)}</span>
                  <div className="skill-card-body">
                    <span className="skill-card-name">{skill.name}</span>
                    {skill.description && (
                      <span className="skill-card-desc">{firstSentence(skill.description)}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

export default SkillBrowser
