import { memo, useMemo } from "react"
import { diffLineClass } from "./DiffView"

type Props = {
  content: string
  language?: string
}

export const InlineDiff = memo(function InlineDiff({ content, language }: Props) {
  const lines = useMemo(() => content.split("\n"), [content])

  return (
    <div className="inline-diff">
      {language && <div className="inline-diff-lang">{language}</div>}
      <pre className="inline-diff-pre">
        {lines.map((line, i) => (
          <span key={i} className={`inline-diff-line ${diffLineClass(line)}`}>
            {line}
          </span>
        ))}
      </pre>
    </div>
  )
})
