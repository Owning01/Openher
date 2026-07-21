import { memo, useMemo } from "react"
import { toolMeta, detectToolName } from "../utils/toolMeta"

export const ToolStatus = memo(function ToolStatus({ part }: { part: { id: string; type: string; text?: string } }) {
  const text = part.text?.trim()
  const toolName = useMemo(() => detectToolName(text ?? ""), [text])
  const meta = toolName ? toolMeta[toolName] : null
  const label = text ? extractPreview(text) : ""

  if (!text || !meta) return null

  return (
    <div className={`tool-status tool-${toolName} active`}>
      <span className="tool-status-icon">{meta.icon}</span>
      <span className="tool-status-label">{meta.label}</span>
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
