import { memo } from "react"
import { CollapsibleSection } from "./CollapsibleSection"
import { BrainIcon, LoadingIcon } from "../Icons"
import { useT } from "../i18n-context"
import type { ThinkingPart } from "../types"

type Props = {
  parts: ThinkingPart[]
  duration?: string
  defaultOpen?: boolean
}

export const ThinkingBlock = memo(function ThinkingBlock({ parts, duration, defaultOpen = false }: Props) {
  const t = useT()
  if (parts.length === 0) return null

  const text = parts.map((p) => p.text).join("\n\n")
  const isStreaming = parts.some((p) => !p.time?.end)

  return (
    <CollapsibleSection
      icon={<BrainIcon size={14} />}
      title={t('detail.thought')}
      subtitle={isStreaming
        ? <span className="thinking-streaming"><LoadingIcon size={12} className="animate-spin" />{t('detail.thinking')}</span>
        : (duration ? `· ${duration}` : undefined)}
      defaultOpen={defaultOpen}
    >
      <pre className="thinking-text">{text}</pre>
    </CollapsibleSection>
  )
})
