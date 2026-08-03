import { memo, type ComponentProps } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { Capacitor } from "@capacitor/core"

function Table({ children }: ComponentProps<"table">) {
  return (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  )
}

function Link({ href, children, ...rest }: ComponentProps<"a">) {
  return (
    <a
      href={href}
      {...rest}
      target={Capacitor.isNativePlatform() ? undefined : "_blank"}
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!href || href.startsWith("#")) return
        if (Capacitor.isNativePlatform()) {
          e.preventDefault()
          window.open(href, "_system")
        }
      }}
    >
      {children}
    </a>
  )
}

const components = { table: Table, a: Link }

export const Markdown = memo(function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={components}
    >
      {text}
    </ReactMarkdown>
  )
})
