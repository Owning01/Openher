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

// Envuelve cada ocurrencia case-insensitive del query en <mark>.
// Reemplaza texto plano por nodos html (<mark>...</mark>) que react-markdown
// renderiza sin re-procesar markdown.
function highlightText(text: string, query: string): string {
  const q = query.toLowerCase()
  const lower = text.toLowerCase()
  const out: string[] = []
  let from = 0
  let idx = lower.indexOf(q, from)
  while (idx !== -1) {
    if (idx > from) out.push(escapeHtml(text.slice(from, idx)))
    out.push(`<mark>${escapeHtml(text.slice(idx, idx + q.length))}</mark>`)
    from = idx + q.length
    idx = lower.indexOf(q, from)
  }
  if (from < text.length) out.push(escapeHtml(text.slice(from)))
  return out.join("")
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

// Plugin remark: recorre los nodos `text` y reemplaza el value con HTML
// resaltado. Los nodos que no matchean se dejan intactos.
function remarkHighlight(query?: string) {
  return function transformer(tree: any) {
    if (!query) return tree
    const q = query.toLowerCase()
    const walk = (node: any) => {
      if (node.type === "text" && typeof node.value === "string") {
        if (node.value.toLowerCase().includes(q)) {
          node.type = "html"
          node.value = highlightText(node.value, query)
        }
      } else if (node.children) {
        node.children.forEach(walk)
      }
    }
    walk(tree)
    return tree
  }
}

const components = { table: Table, a: Link }

export const Markdown = memo(function Markdown({ text, highlight }: { text: string; highlight?: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkHighlight(highlight)]}
      rehypePlugins={[rehypeHighlight]}
      components={components}
    >
      {text}
    </ReactMarkdown>
  )
})
