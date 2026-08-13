import { memo, type ComponentProps, type ReactNode } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { createLowlight } from "lowlight"
import hljsJavascript from "highlight.js/lib/languages/javascript"
import hljsTypescript from "highlight.js/lib/languages/typescript"
import hljsJson from "highlight.js/lib/languages/json"
import hljsBash from "highlight.js/lib/languages/bash"
import hljsPython from "highlight.js/lib/languages/python"
import hljsCss from "highlight.js/lib/languages/css"
import hljsXml from "highlight.js/lib/languages/xml"
import hljsGo from "highlight.js/lib/languages/go"
import hljsRust from "highlight.js/lib/languages/rust"
import hljsSql from "highlight.js/lib/languages/sql"
import hljsYaml from "highlight.js/lib/languages/yaml"
import hljsIni from "highlight.js/lib/languages/ini"
import hljsMarkdown from "highlight.js/lib/languages/markdown"
import hljsDiff from "highlight.js/lib/languages/diff"
import hljsGraphql from "highlight.js/lib/languages/graphql"
import hljsPlaintext from "highlight.js/lib/languages/plaintext"
import { Capacitor } from "@capacitor/core"

// Registro selectivo: sin esto, highlight.js embebe ~190 lenguajes y duplica
// el chunk de markdown. OpenCode solo emite estos lenguajes.
const lowlight = createLowlight()
lowlight.register("js", hljsJavascript)
lowlight.register("javascript", hljsJavascript)
lowlight.register("ts", hljsTypescript)
lowlight.register("typescript", hljsTypescript)
lowlight.register("json", hljsJson)
lowlight.register("jsonc", hljsJson)
lowlight.register("bash", hljsBash)
lowlight.register("sh", hljsBash)
lowlight.register("shell", hljsBash)
lowlight.register("python", hljsPython)
lowlight.register("py", hljsPython)
lowlight.register("css", hljsCss)
lowlight.register("html", hljsXml)
lowlight.register("xml", hljsXml)
lowlight.register("go", hljsGo)
lowlight.register("rust", hljsRust)
lowlight.register("rs", hljsRust)
lowlight.register("sql", hljsSql)
lowlight.register("yaml", hljsYaml)
lowlight.register("yml", hljsYaml)
lowlight.register("toml", hljsIni)
lowlight.register("ini", hljsIni)
lowlight.register("markdown", hljsMarkdown)
lowlight.register("md", hljsMarkdown)
lowlight.register("diff", hljsDiff)
lowlight.register("graphql", hljsGraphql)
lowlight.register("plaintext", hljsPlaintext)
lowlight.register("text", hljsPlaintext)

// Reemplazo de rehype-highlight: ese paquete embebe lowlight/lib/common
// (37 lenguajes) de forma inseparable. Este plugin usa solo los registrados.
function toText(node: unknown): string {
  const n = node as { type?: string; value?: string; children?: unknown[] }
  if (n?.type === "text") return n.value ?? ""
  if (n?.type === "element" && n.children) return n.children.map(toText).join("")
  return ""
}

function rehypeHighlightLocal() {
  return (tree: unknown) => {
    const walk = (node: unknown) => {
      const n = node as { type?: string; tagName?: string; properties?: { className?: unknown }; children?: unknown[] }
      if (!n || typeof n !== "object") return
      if (n.type === "element" && n.tagName === "code" && Array.isArray(n.properties?.className)) {
        const classes = n.properties.className as string[]
        const lang = classes.find((c) => typeof c === "string" && c.startsWith("language-"))?.slice(9)
        if (lang && lang !== "plaintext" && lang !== "text") {
          try {
            const result = lowlight.highlight(lang, toText(n))
            if (result.children.length > 0) {
              n.children = result.children as unknown[]
              if (!classes.includes("hljs")) classes.unshift("hljs")
            }
          } catch { /* lenguaje no registrado: sin resaltar */ }
        }
      }
      if (Array.isArray(n.children)) n.children.forEach(walk)
    }
    walk(tree)
    return tree
  }
}

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

// Caché del árbol renderizado por (texto, highlight): reusar el elemento evita
// re-parsear react-markdown + lowlight en re-renders sin cambio de texto
// (scrolls, tab switches, remounts). LRU acotado a 16 mensajes.
const mdCache = new Map<string, ReactNode>()
const MD_CACHE_MAX = 16

export const Markdown = memo(function Markdown({ text, highlight }: { text: string; highlight?: string }) {
  const key = `${highlight ?? ""}\u0000${text}`
  let el = mdCache.get(key)
  if (!el) {
    el = (
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkHighlight(highlight)]}
        rehypePlugins={[rehypeHighlightLocal]}
        components={components}
      >
        {text}
      </ReactMarkdown>
    )
    if (mdCache.size >= MD_CACHE_MAX) {
      const oldest = mdCache.keys().next().value
      if (oldest !== undefined) mdCache.delete(oldest)
    }
    mdCache.set(key, el)
  }
  return el
})
