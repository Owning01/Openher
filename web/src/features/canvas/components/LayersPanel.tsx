import type { CanvasPart } from "../model/canvasTypes"
import { canvasStore } from "../store/canvasStore"
import { ChevronDownIcon, ChevronRightIcon } from "../../../Icons"

type Props = {
  screenId: string
  parts: CanvasPart[]
  selectedId: string | null
}

export function LayersPanel({ screenId, parts, selectedId }: Props) {
  const ordered = [...parts].reverse()
  if (ordered.length === 0) {
    return <div style={{ fontSize: 12, color: "var(--muted)" }}>Sin partes. Agrega desde la paleta.</div>
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {ordered.map((p) => (
        <div
          key={p.id}
          role="button"
          tabIndex={0}
          onClick={() => canvasStore.select({ screenId, partId: p.id })}
          onKeyDown={(e) => { if (e.key === "Enter") canvasStore.select({ screenId, partId: p.id }) }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: selectedId === p.id ? "var(--primary-soft, var(--surface))" : "var(--surface)",
            cursor: "pointer",
            color: "var(--text)",
          }}
        >
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {p.label || p.kind}
          </span>
          <span style={{ fontSize: 10, color: "var(--muted)", flexShrink: 0 }}>{p.kind}</span>
          <button
            type="button" title="Al frente" aria-label="Al frente"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, display: "flex" }}
            onClick={(e) => { e.stopPropagation(); canvasStore.reorderPart(screenId, p.id, "front") }}
          >
            <ChevronRightIcon size={13} style={{ transform: "rotate(-90deg)" }} />
          </button>
          <button
            type="button" title="Al fondo" aria-label="Al fondo"
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, display: "flex" }}
            onClick={(e) => { e.stopPropagation(); canvasStore.reorderPart(screenId, p.id, "back") }}
          >
            <ChevronDownIcon size={13} />
          </button>
        </div>
      ))}
    </div>
  )
}
