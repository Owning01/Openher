import { memo, useState, useEffect, useCallback, useMemo } from "react"
import { ModalHeader } from "./ModalHeader"
import { useT } from "../i18n-context"
import { api } from "../api"
import type { ServerConfig } from "../types"
import {
  MonitorIcon, LinkIcon, GlobeIcon, SearchIcon, StatsIcon,
  ServerIcon, CodeIcon, PaintIcon, CameraIcon, BrainIcon,
  SettingsIcon, FileIcon, LayersIcon, KeyboardIcon
} from "../Icons"
import type { ComponentType } from "react"

type SkillItem = { id: string; name: string; description?: string; content?: string; location?: string }

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

function getSkillIcon(name: string): ComponentType<{ className?: string; size?: number }> {
  if (name.startsWith("flutter")) return MonitorIcon
  if (name.startsWith("mcp")) return LinkIcon
  if (name.includes("web") || name.includes("frontend")) return GlobeIcon
  if (name.includes("seo")) return SearchIcon
  if (name.includes("performance")) return StatsIcon
  if (name.includes("firebase")) return ServerIcon
  if (name.includes("code") || name.includes("optimize")) return CodeIcon
  if (name.includes("design") || name.includes("premium")) return PaintIcon
  if (name.includes("canvas")) return CameraIcon
  if (name.includes("lean") || name.includes("ctx")) return BrainIcon
  if (name.includes("skill")) return SettingsIcon
  if (name.includes("mi-entorno")) return KeyboardIcon
  if (name.includes("json")) return LayersIcon
  return FileIcon
}

function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 4)
}

export const SkillBrowser = memo(function SkillBrowser({ config, onClose, onSelect }: Props) {
  const t = useT()
  const [skills, setSkills] = useState<SkillItem[]>([])
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<SkillItem | null>(null)

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

  const handleSelect = useCallback((skill: SkillItem) => {
    onSelect(skill.name)
    setSelectedSkill(skill)
  }, [onSelect])

  const handleBack = useCallback(() => {
    setSelectedSkill(null)
  }, [])

  if (selectedSkill) {
    const Icon = getSkillIcon(selectedSkill.name)
    const tokenCount = estimateTokens(selectedSkill.content ?? selectedSkill.description ?? "")
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content skill-browser skill-browser-detail" onClick={(e) => e.stopPropagation()}>
          <div className="skill-detail-header">
            <button type="button" className="skill-detail-back" onClick={handleBack}>← {t('detail.backToSessions') || 'Back'}</button>
            <span className="skill-detail-tokens">{tokenCount.toLocaleString()} tokens</span>
          </div>
          <div className="skill-detail-title">
            <Icon size={20} />
            <h3>{selectedSkill.name}</h3>
          </div>
          {selectedSkill.description && (
            <p className="skill-detail-desc">{selectedSkill.description}</p>
          )}
          <div className="skill-detail-content">
            <pre>{selectedSkill.content || selectedSkill.description || ""}</pre>
          </div>
        </div>
      </div>
    )
  }

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
              {group.items.map((skill) => {
                const Icon = getSkillIcon(skill.name)
                return (
                  <button key={skill.id} className="skill-card" onClick={() => handleSelect(skill)}>
                    <span className="skill-card-icon"><Icon size={18} /></span>
                    <div className="skill-card-body">
                      <span className="skill-card-name">{skill.name}</span>
                      {skill.description && (
                        <span className="skill-card-desc">{firstSentence(skill.description)}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

function firstSentence(desc: string): string {
  const clean = desc.replace(/\s+/g, " ").trim()
  if (!clean) return ""
  const match = clean.match(/^[^.!?]*[.!?]/)
  return (match ? match[0] : clean).trim()
}

export default SkillBrowser
