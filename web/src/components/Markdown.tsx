import { memo, type ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function Table({ children }: ComponentProps<"table">) {
  return (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  )
}

const components = { table: Table }

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {text}
    </ReactMarkdown>
  )
})
