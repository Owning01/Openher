import { memo, useMemo } from "react"

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
        {lines.map((line, i) => {
          let cls = ""
          if (line.startsWith("+")) cls = "diff-add"
          else if (line.startsWith("-")) cls = "diff-rem"
          else if (line.startsWith("@@")) cls = "diff-hunk"
          return (
            <span key={i} className={`inline-diff-line ${cls}`}>
              {line}
            </span>
          )
        })}
      </pre>
    </div>
  )
})
