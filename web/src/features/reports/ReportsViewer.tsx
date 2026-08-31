import { memo, useEffect, useState } from "react"
import { Markdown } from "../../components/Markdown"
import { shell } from "../../shell"
import type { ReportMeta } from "./types"

export const ReportsViewer = memo(function ReportsViewer({ report }: { report: ReportMeta }) {
  const [md, setMd] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setErr(null)
    // Intenta vía shell.fs.read (mínima RAM, sin iframe), fallback a fetch relativo
    const load = async () => {
      try {
        // report.file es "reports/*.md" relativo a data/reports o a 53plataforma
        const candidates = [
          `G:\\Proyectos\\opencode-remote-android\\data\\reports\\${report.file.replace(/^reports\//, "")}`,
          `G:\\Proyectos\\53plataforma-informes\\public\\${report.file}`,
          `G:\\Proyectos\\53plataforma-informes\\dist\\${report.file}`,
        ]
        for (const p of candidates) {
          try {
            const r = await shell.fs.read(p)
            if (r?.content) {
              if (!cancelled) { setMd(r.content); setLoading(false) }
              return
            }
          } catch {}
        }
        // Fallback fetch (cuando corre como embed o file://, reports.json ya es relativo)
        const res = await fetch(report.file, { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const text = await res.text()
        if (!cancelled) { setMd(text); setLoading(false) }
      } catch (e) {
        if (!cancelled) { setErr(String(e)); setLoading(false) }
      }
    }
    load()
    return () => { cancelled = true }
  }, [report.file])

  if (loading) return <div style={{ padding: 24, color: "var(--muted)" }}>Cargando {report.title}…</div>
  if (err) return <div style={{ padding: 24, color: "var(--danger)" }}>Error: {err}</div>
  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px", width: "100%", boxSizing: "border-box" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: 8 }}>{report.title}</h1>
      <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 16 }}>{report.date} · {report.category} · {report.tags.join(", ")}</div>
      <Markdown text={md} />
    </div>
  )
})
