// Sidebar jerárquico con búsqueda y progreso.
import { useMemo, useState } from "react"
import type { LearningManifest, LearningLesson, LearningProgress } from "./types.ts"

interface SidebarProps {
  manifest: LearningManifest
  progress: LearningProgress
  selectedId: string | null
  onSelect: (lesson: LearningLesson) => void
  onClose?: () => void
}

export function LearningSidebar({ manifest, progress, selectedId, onSelect, onClose }: SidebarProps) {
  const [query, setQuery] = useState("")
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(manifest.categories.map((c) => c.id)))

  const filtered = useMemo(() => {
    if (!query.trim()) return manifest.categories
    const q = query.toLowerCase()
    return manifest.categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) => it.title.toLowerCase().includes(q) || it.categoryTitle.toLowerCase().includes(q) || (it.subCategory?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter((c) => c.items.length > 0)
  }, [manifest, query])

  const toggleCat = (id: string) => {
    setOpenCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="learning-sidebar" style={sidebarStyle}>
      <div className="learning-search" style={searchWrapStyle}>
        <input
          type="text"
          placeholder="Buscar lección..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="learning-search-input"
          style={searchInputStyle}
        />
        {onClose && (
          <button type="button" onClick={onClose} className="btn-icon compact learning-close" aria-label="Cerrar">
            ✕
          </button>
        )}
      </div>
      <div className="learning-tree" style={treeStyle}>
        {filtered.map((cat) => (
          <div key={cat.id} className="learning-cat">
            <button
              type="button"
              onClick={() => toggleCat(cat.id)}
              className="learning-cat-header"
              style={catHeaderStyle}
              aria-expanded={openCats.has(cat.id)}
            >
              <span style={{ transform: openCats.has(cat.id) ? "rotate(90deg)" : "none", transition: "transform .15s" }}>▸</span>
              <span style={{ flex: 1, textAlign: "left" }}>{cat.title}</span>
              <span className="learning-cat-count" style={countStyle}>{cat.count}</span>
            </button>
            {openCats.has(cat.id) && (
              <ul className="learning-list" style={listStyle}>
                {cat.items.map((item) => {
                  const done = progress[item.id]?.done
                  const active = item.id === selectedId
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className={`learning-item${active ? " active" : ""}`}
                        style={{
                          ...itemStyle,
                          background: active ? "var(--accent-bg, rgba(99,102,241,.15))" : undefined,
                          fontWeight: active ? 600 : 400,
                        }}
                        title={`${item.title} · ${item.minutes} min · ${item.depth}`}
                      >
                        {done && <span style={checkStyle} title="Completada">✓</span>}
                        <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p style={{ color: "var(--muted)", padding: "1rem", textAlign: "center" }}>Sin resultados.</p>}
      </div>
    </div>
  )
}

// Estilos inline para no depender de CSS global (plugin autocontenido).
const sidebarStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
}
const searchWrapStyle: React.CSSProperties = { padding: ".75rem", display: "flex", gap: ".5rem", alignItems: "center" }
const searchInputStyle: React.CSSProperties = {
  flex: 1,
  padding: ".5rem .75rem",
  borderRadius: ".375rem",
  border: "1px solid var(--border)",
  background: "var(--bg-secondary)",
  color: "var(--fg)",
  fontSize: ".875rem",
}
const treeStyle: React.CSSProperties = { flex: 1, overflowY: "auto", padding: "0 .5rem .75rem" }
const catHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: ".4rem",
  width: "100%",
  padding: ".45rem .5rem",
  background: "transparent",
  border: "none",
  color: "var(--fg)",
  cursor: "pointer",
  fontSize: ".8125rem",
  fontWeight: 600,
  borderRadius: ".25rem",
}
const countStyle: React.CSSProperties = { fontSize: ".6875rem", opacity: .6, padding: ".125rem .375rem", borderRadius: "999px", background: "var(--border)" }
const listStyle: React.CSSProperties = { listStyle: "none", margin: 0, paddingLeft: ".75rem" }
const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: ".35rem",
  width: "100%",
  padding: ".35rem .5rem",
  background: "transparent",
  border: "none",
  color: "var(--fg)",
  cursor: "pointer",
  fontSize: ".8125rem",
  borderRadius: ".25rem",
  textAlign: "left",
}
const checkStyle: React.CSSProperties = { color: "#10b981", fontSize: ".75rem", flexShrink: 0 }
