import { memo } from "react"
import { DiffView } from "./DiffView"

type Props = {
  content: string
  language?: string
}

export const InlineDiff = memo(function InlineDiff({ content, language }: Props) {
  return (
    <div className="inline-diff">
      {language && <div className="inline-diff-lang">{language}</div>}
      <DiffView patch={content} />
    </div>
  )
})
