import { useEffect, useState, useMemo } from "react"
import { shell } from "../../shell"
import type { ReportMeta } from "./types"
import { ReportsViewer } from "./ReportsViewer"

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [selected, setSelected] = useState<ReportMeta | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        // Preferir shell.fs para no usar servidor 5174
        const candidates = [
          "G:\\Proyectos\\opencode-remote-android\\data\\reports\\manifest.json",
          "G:\\Proyectos\\53plataforma-informes\\public\\reports.json",
          "G:\\Proyectos\\53plataforma-informes\\dist\\reports.json",
        ]
        for (const p of candidates) {
          try {
            const r = await shell.fs.read(p)
            if (r?.content) {
              const data = JSON.parse(r.content) as ReportMeta[]
              // convertir .html -> .md si existe
              const mapped = data.map(d => ({ ...d, file: d.file.replace(/\.html$/, ".md") }))
              setReports(mapped)
              setLoading(false)
              return
            }
          } catch {}
        }
        const res = await fetch("reports/manifest.json", { cache: "no-store" }).catch(() => fetch("reports.json", { cache: "no-store" } as any))
        const data = await res.json() as ReportMeta[]
        setReports(data.map(d => ({ ...d, file: d.file.replace(/\.html$/, ".md") })))
        setLoading(false)
      } catch {
        setLoading(false)
      }
    }
    load()
  }, [])

  const categories = useMemo(() => [...new Set(reports.map(r => r.category))].sort(), [reports])
  const filtered = useMemo(() => {
    let list = [...reports]
    if (category) list = list.filter(r => r.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(r => r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q)))
    }
    list.sort((a,b) => b.date.localeCompare(a.date))
    return list
  }, [reports, search, category])

  useEffect(() => {
    if (!selected && filtered.length > 0) setSelected(filtered[0])
  }, [filtered, selected])

  if (loading) return <div style={{ padding: 24 }}>Cargando informes…</div>

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      <div style={{ width: 320, borderRight: "1px solid var(--border)", overflow: "auto", padding: 12, flexShrink: 0 }}>
        <h2 style={{ fontWeight: 800, marginBottom: 8 }}>Informes ({reports.length})</h2>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar…" style={{ width: "100%", padding: "6px 8px", borderRadius: 6, border: "1px solid var(--border)", marginBottom: 8 }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          <button onClick={() => setCategory("")} style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid var(--border)", background: !category ? "var(--primary)" : "transparent", color: !category ? "white" : "var(--text)", cursor: "pointer" }}>Todas</button>
          {categories.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: "4px 8px", borderRadius: 999, border: "1px solid var(--border)", background: category===c ? "var(--primary)" : "transparent", color: category===c ? "white" : "var(--text)", cursor: "pointer" }}>{c}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map(r => (
            <button key={r.id} onClick={() => setSelected(r)} style={{ textAlign: "left", padding: 10, borderRadius: 8, border: selected?.id===r.id ? "1px solid var(--primary)" : "1px solid var(--border)", background: selected?.id===r.id ? "var(--surface-strong)" : "var(--surface)", cursor: "pointer" }}>
              <div style={{ fontWeight: 700, fontSize: 13 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{r.date} · {r.category}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.description}</div>
            </button>
          ))}
          {filtered.length===0 && <div style={{ color:"var(--muted)", fontSize:12 }}>Sin resultados</div>}
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto", background: "var(--surface)" }}>
        {selected ? <ReportsViewer report={selected} /> : <div style={{ padding: 24, color:"var(--muted)" }}>Seleccioná un informe</div>}
      </div>
    </div>
  )
}
