// Sidebar jerárquica con búsqueda. — styles/learning.css
import { useMemo, useState } from "react"
import type { LearningManifest, LearningLesson, LearningProgress } from "./types.ts"

interface Props {
  manifest: LearningManifest
  progress: LearningProgress
  selectedId: string | null
  onSelect: (lesson: LearningLesson) => void
  onClose?: () => void
}

export function LearningSidebar({ manifest, progress, selectedId, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("")
  const [openCats, setOpenCats] = useState<Set<string>>(new Set(manifest.categories.map((c) => c.id)))

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return manifest.categories
    return manifest.categories
      .map((c) => ({
        ...c,
        items: c.items.filter(
          (it) => it.title.toLowerCase().includes(q) || it.categoryTitle.toLowerCase().includes(q) || (it.subCategory?.toLowerCase().includes(q) ?? false),
        ),
      }))
      .filter((c) => c.items.length > 0)
  }, [manifest, query])

  const toggleCat = (id: string) =>
    setOpenCats((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  return (
    <div className="learning-sidebar">
      <div className="learning-search-row">
        <input
          type="text"
          placeholder="Buscar…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="learning-search-input"
          aria-label="Buscar lecciones"
        />
        {onClose && <button type="button" onClick={onClose} className="btn-icon compact" aria-label="Cerrar">✕</button>}
      </div>
      <div className="learning-tree">
        {filtered.map((cat) => (
          <div key={cat.id}>
            <button type="button" onClick={() => toggleCat(cat.id)} className="learning-cat-toggle" aria-expanded={openCats.has(cat.id)}>
              <span aria-hidden="true" style={{ transition: "transform .14s", transform: openCats.has(cat.id) ? "rotate(90deg)" : "none" }}>▸</span>
              <span style={{ flex: 1 }}>{cat.title}</span>
              <span className="learning-cat-count">{cat.count}</span>
            </button>
            {openCats.has(cat.id) && (
              <ul className="learning-nested-list">
                {cat.items.map((item) => {
                  const done = !!progress[item.id]?.done
                  const active = item.id === selectedId
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className={`learning-item${active ? " active" : ""}${done ? " done" : ""}`}
                        title={`${item.title} · ${item.minutes}m · ${item.depth}`}
                      >
                        <span className="learning-check" aria-hidden="true">{done ? "✓" : ""}</span>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="subtle" style={{ padding: "1rem", textAlign: "center" }}>Sin resultados.</p>}
      </div>
    </div>
  )
}
