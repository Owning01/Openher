import { memo } from "react"
import { CollapsibleSection } from "./CollapsibleSection"
import { BrainIcon } from "../Icons"

type ThinkingPart = { id: string; text: string }

type Props = {
  parts: ThinkingPart[]
}

export const ThinkingBlock = memo(function ThinkingBlock({ parts }: Props) {
  if (parts.length === 0) return null

  const text = parts.map((p) => p.text).join("\n\n")

  return (
    <CollapsibleSection icon={<BrainIcon size={14} />} title="Razonamiento">
      <pre className="thinking-text">{text}</pre>
    </CollapsibleSection>
  )
})
