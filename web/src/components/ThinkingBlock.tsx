import { memo } from "react"
import { CollapsibleSection } from "./CollapsibleSection"
import { BrainIcon } from "../Icons"

type ThinkingPart = { id: string; text: string }

type Props = {
  parts: ThinkingPart[]
  duration?: string
}

export const ThinkingBlock = memo(function ThinkingBlock({ parts, duration }: Props) {
  if (parts.length === 0) return null

  const text = parts.map((p) => p.text).join("\n\n")

  return (
    <CollapsibleSection icon={<BrainIcon size={14} />} title="Razonamiento" subtitle={duration ? `· ${duration}` : undefined}>
      <pre className="thinking-text">{text}</pre>
    </CollapsibleSection>
  )
})
