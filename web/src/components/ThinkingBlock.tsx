import { memo } from "react"
import { CollapsibleSection } from "./CollapsibleSection"

type ThinkingPart = { id: string; text: string }

type Props = {
  parts: ThinkingPart[]
}

export const ThinkingBlock = memo(function ThinkingBlock({ parts }: Props) {
  if (parts.length === 0) return null

  const text = parts.map((p) => p.text).join("\n\n")

  return (
    <CollapsibleSection icon="💭" title="Razonamiento">
      <pre className="thinking-text">{text}</pre>
    </CollapsibleSection>
  )
})
