import { memo, useState } from "react"
import { LoadingIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { ThinkingPart } from "../types"

type Props = {
  parts: ThinkingPart[]
  duration?: string
  defaultOpen?: boolean
}

export const ThinkingBlock = memo(function ThinkingBlock({ parts, duration, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const t = useT()
  if (parts.length === 0) return null

  const text = parts.map((p) => p.text).join("\n\n")
  const isStreaming = parts.some((p) => !p.time?.end)

  let label = "Thought"
  let computedDuration = duration ? duration.replace(/^[·\s]+/, "").trim() : ""
  if (!computedDuration) {
    let totalMs = 0
    for (const p of parts) {
      if (p.time?.start && p.time?.end) {
        totalMs += (p.time.end - p.time.start)
      }
    }
    if (totalMs > 0) {
      const sec = Math.round(totalMs / 1000)
      computedDuration = `${sec > 0 ? sec : 1}s`
    }
  }

  if (isStreaming) {
    label = t('detail.thinking') || "Thinking..."
  } else if (computedDuration) {
    label = `Thought for ${computedDuration}`
  }

  return (
    <div className={`thinking-block${open ? " open" : ""}`}>
      <button
        type="button"
        className="thinking-minimal-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {isStreaming && <LoadingIcon size={12} className="animate-spin mr-1" />}
        <span className="thinking-minimal-text">{label}</span>
        <span className="thinking-minimal-chevron">{open ? "▾" : ">"}</span>
      </button>
      {open && (
        <div className="thinking-content">
          <pre className="thinking-text">{text}</pre>
        </div>
      )}
    </div>
  )
})
