import { useEffect, useState } from "react"
import { api } from "../../api"
import type { AgentOption, ServerConfig } from "../../types"
import type { MentionItem } from "./types"

type UseMentionsParams = {
  /** El menú @ está abierto. */
  active: boolean
  /** Texto tipeado después de la @. */
  query: string
  config?: ServerConfig
  directory?: string
  visibleAgents: AgentOption[]
}

/**
 * Carga perezosa de menciones del composer: agentes visibles, skills, archivos
 * y recursos MCP. Los agentes se filtran sincrónicamente; el resto se pide con
 * debounce de 150ms para no disparar una request por tecla.
 */
export function useMentions({ active, query, config, directory, visibleAgents }: UseMentionsParams) {
  const [items, setItems] = useState<MentionItem[]>([])
  const [loading, setLoading] = useState(false)
  // Fallback: si el padre aún no entregó agentes (carga perezosa del server),
  // el @ los pide directo para que agentes/subagentes siempre aparezcan.
  const [fallbackAgents, setFallbackAgents] = useState<MentionItem[]>([])

  useEffect(() => {
    if (!active || visibleAgents.length > 0 || !config) return
    let cancelled = false
    api.listAgents(config, directory).then((list) => {
      if (cancelled) return
      setFallbackAgents(list.filter((a) => !a.hidden).map((a) => ({
        id: a.id, name: a.name, description: a.description, source: "agent" as const,
      })))
    }).catch(() => {})
    return () => { cancelled = true }
  }, [active, visibleAgents.length, config, directory])

  useEffect(() => {
    if (!active) { setItems([]); return }

    const agentItems: MentionItem[] = (visibleAgents.length > 0 ? visibleAgents : fallbackAgents).map((a) => ({
      id: a.id, name: a.name, description: a.description, source: "agent" as const,
    }))

    const q = query.toLowerCase()
    const filteredAgents = !query ? agentItems : agentItems.filter((a) =>
      a.name.toLowerCase().includes(q) || (a.description?.toLowerCase() ?? "").includes(q))

    setItems(filteredAgents)
    setLoading(true)

    let cancelled = false
    const timer = setTimeout(() => {
      const fileFetch = config ? api.findFiles(config, query, directory, 10).then((files) =>
        files.map((f) => ({ id: f.path, name: f.path, source: "file" as const, description: f.type }))
      ).catch(() => [] as MentionItem[]) : Promise.resolve([] as MentionItem[])

      const mcpFetch = config ? api.listMCPResources(config, directory).then((resources) =>
        resources.filter((r) => !query || r.name.toLowerCase().includes(q))
          .map((r) => ({ id: r.id, name: r.name, description: r.description, source: "mcp" as const }))
      ).catch(() => [] as MentionItem[]) : Promise.resolve([] as MentionItem[])

      // Como el TUI: @ también invoca skills del server (/skill).
      const skillFetch = config ? api.listSkills(config, directory).then((skills) =>
        skills.filter((s) => !query || s.name.toLowerCase().includes(q) || (s.description?.toLowerCase() ?? "").includes(q))
          .map((s) => ({ id: s.id, name: s.name, description: s.description, source: "skill" as const }))
      ).catch(() => [] as MentionItem[]) : Promise.resolve([] as MentionItem[])

      Promise.all([fileFetch, mcpFetch, skillFetch]).then(([files, mcps, skills]) => {
        if (cancelled) return
        setItems([...filteredAgents, ...skills, ...files, ...mcps])
        setLoading(false)
      })
    }, 150)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [active, query, config, directory, visibleAgents, fallbackAgents])

  return { items, loading }
}
