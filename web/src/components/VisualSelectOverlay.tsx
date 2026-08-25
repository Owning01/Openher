import { memo, useCallback, useEffect, useRef, useState } from "react"

export type EditorSelectionPayload = {
  selectedText: string
  lineStart: number | null
  lineEnd: number | null
  surroundingContext: string
  boundingRect?: { x: number; y: number; w: number; h: number }
}

type Props = {
  enabled: boolean
  filePath: string
  onSelect: (payload: EditorSelectionPayload) => void
  onExit: () => void
}

function getLineRange(textarea: HTMLTextAreaElement, start: number, end: number): { lineStart: number; lineEnd: number } {
  const beforeStart = textarea.value.slice(0, start)
  const selected = textarea.value.slice(start, end)
  const lineStart = beforeStart.split("\n").length
  const lineEnd = lineStart + selected.split("\n").length - 1
  return { lineStart, lineEnd }
}

function getSurrounding(text: string, start: number, end: number, radius = 3): string {
  const lines = text.split("\n")
  const startLine = text.slice(0, start).split("\n").length - 1
  const endLine = startLine + text.slice(start, end).split("\n").length - 1
  const from = Math.max(0, startLine - radius)
  const to = Math.min(lines.length - 1, endLine + radius)
  return lines.slice(from, to + 1).join("\n").slice(0, 2000)
}

export const VisualSelectOverlay = memo(function VisualSelectOverlay({ enabled, filePath, onSelect, onExit }: Props) {
  const [hint, setHint] = useState<string | null>(null)

  const handleSelectFromTextarea = useCallback((ta: HTMLTextAreaElement) => {
    const start = ta.selectionStart ?? 0
    const end = ta.selectionEnd ?? 0
    const selectedText = ta.value.slice(start, end)
    if (!selectedText.trim()) {
      setHint("Seleccioná texto primero y luego clic en Capturar")
      return
    }
    const { lineStart, lineEnd } = getLineRange(ta, start, end)
    const surroundingContext = getSurrounding(ta.value, start, end)
    const rect = ta.getBoundingClientRect()
    onSelect({
      selectedText,
      lineStart,
      lineEnd,
      surroundingContext,
      boundingRect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height },
    })
  }, [onSelect])

  // Bridge: escucha mensajes del textarea host
  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onExit()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [enabled, onExit])

  if (!enabled) return null

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 8px",
          background: "var(--primary-soft)",
          borderBottom: "1px solid var(--primary-soft)",
          backdropFilter: "blur(6px)",
          fontSize: 12,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary)", display: "inline-block", flexShrink: 0 }} />
        <span style={{ fontWeight: 600, color: "var(--text)" }}>Modo selección</span>
        <span style={{ color: "var(--muted)", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {filePath.split("/").pop() ?? filePath} — seleccioná texto en el editor y capturá
        </span>
        <button
          type="button"
          className="btn-secondary compact"
          style={{ pointerEvents: "auto" }}
          onClick={() => {
            const ta = document.querySelector<HTMLTextAreaElement>(`textarea[data-vs-path="${CSS.escape(filePath)}"]`)
            if (ta) handleSelectFromTextarea(ta)
            else {
              // fallback: cualquier textarea visible dentro del panel
              const anyTa = document.querySelector<HTMLTextAreaElement>(".file-editor-textarea")
              if (anyTa) handleSelectFromTextarea(anyTa)
              else setHint("No se encontró editor activo")
            }
          }}
        >
          Capturar selección
        </button>
        <button type="button" className="btn-icon compact" onClick={onExit} title="Salir (Esc)" aria-label="Salir">
          ×
        </button>
      </div>
      {hint && (
        <div style={{ pointerEvents: "auto", padding: "4px 8px", fontSize: 12, color: "#f0883e", background: "rgba(240,136,62,0.12)" }}>
          {hint}
        </div>
      )}
      <div style={{ flex: 1, border: "1.5px dashed rgba(88,166,255,0.55)", margin: 6, borderRadius: 8, pointerEvents: "none" }} />
    </div>
  )
})

export function useTextareaSelectionCapture() {
  const ref = useRef<HTMLTextAreaElement | null>(null)
  const [hasUserSelection, setHasUserSelection] = useState(false)

  const onSelect = useCallback(() => {
    const ta = ref.current
    if (!ta) return
    const has = (ta.selectionStart ?? 0) !== (ta.selectionEnd ?? 0) && !!ta.value.slice(ta.selectionStart ?? 0, ta.selectionEnd ?? 0).trim()
    setHasUserSelection(has)
  }, [])

  useEffect(() => {
    const ta = ref.current
    if (!ta) return
    ta.addEventListener("select", onSelect)
    ta.addEventListener("mouseup", onSelect)
    ta.addEventListener("keyup", onSelect)
    return () => {
      ta.removeEventListener("select", onSelect)
      ta.removeEventListener("mouseup", onSelect)
      ta.removeEventListener("keyup", onSelect)
    }
  }, [onSelect])

  return { ref, hasUserSelection, onSelect }
}
