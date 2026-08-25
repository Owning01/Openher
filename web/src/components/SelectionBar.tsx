import { memo } from "react"
import type { VisualSelection } from "../hooks/useVisualSelection"
import { getVisualSelectionLabel } from "../hooks/useVisualSelection"

type Props = {
  selection: VisualSelection | null
  onClear: () => void
  onFocusFile?: (path: string) => void
}

export const SelectionBar = memo(function SelectionBar({ selection, onClear, onFocusFile }: Props) {
  if (!selection) return null
  const label = getVisualSelectionLabel(selection)
  const preview = selection.selectedText.trim().slice(0, 120).replace(/\n/g, " ⏎ ")
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        background: "rgba(88,166,255,0.10)",
        border: "1px solid rgba(88,166,255,0.30)",
        borderRadius: 8,
        fontSize: 12,
        marginBottom: 8,
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "var(--primary)",
          display: "inline-block",
          flexShrink: 0,
          boxShadow: "0 0 0 4px rgba(88,166,255,0.18)",
        }}
      />
      <span style={{ fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>{label}</span>
      {preview && (
        <span
          style={{
            color: "var(--muted)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}
          title={selection.selectedText}
        >
          {preview}
          {selection.selectedText.length > 120 ? "…" : ""}
        </span>
      )}
      <span
        style={{
          fontSize: 12,
          color: "var(--primary)",
          background: "rgba(88,166,255,0.16)",
          borderRadius: 999,
          padding: "2px 7px",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
        title="El próximo prompt se scropea solo a esta zona"
      >
        scropeado
      </span>
      {onFocusFile && (
        <button type="button" className="btn-secondary compact" onClick={() => onFocusFile(selection.filePath)} title="Ir al archivo">
          Abrir
        </button>
      )}
      <button
        type="button"
        className="btn-icon compact"
        onClick={onClear}
        title="Quitar selección (Esc)"
        aria-label="Quitar selección"
        style={{ flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  )
})
