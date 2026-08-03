import { memo, useMemo } from "react"
import { toolMeta, detectToolName } from "../utils/toolMeta"

export const ToolStatus = memo(function ToolStatus({ part }: { part: { id: string; type: string; text?: string; tool?: string; state?: { status?: string; input?: unknown; output?: unknown } } }) {
  const text = part.text?.trim()
  const toolName = useMemo(() => part.tool ?? detectToolName(text ?? ""), [part.tool, text])
  const meta = toolName ? toolMeta[toolName] : null
  const label = useMemo(() => {
    const input = part.state?.input
    if (input != null) {
      if (typeof input === "string") return input.slice(0, 80)
      try {
        const s = JSON.stringify(input)
        return s.length > 80 ? s.slice(0, 80) + "…" : s
      } catch { /* ignore */ }
    }
    return text ? extractPreview(text) : ""
  }, [part.state?.input, text])

  if (!toolName) return null

  return (
    <div className={`tool-status tool-${toolName} active`}>
      <span className="tool-status-icon">{meta?.icon ?? "⚙"}</span>
      <span className="tool-status-label">{meta?.label ?? toolName}</span>
      {label && <span className="tool-status-preview">{label}</span>}
      <span className="tool-status-dot" />
    </div>
  )
})

function extractPreview(text: string): string {
  const lines = text.split("\n")
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("<") && !trimmed.startsWith("</")) return trimmed.slice(0, 80)
  }
  return ""
}
