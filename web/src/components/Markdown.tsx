import { memo, useState, useCallback, cloneElement, isValidElement, Children, type ComponentProps, type ReactNode, type ReactElement } from "react"
import ReactMarkdown, { defaultUrlTransform } from "react-markdown"
import remarkGfm from "remark-gfm"
import { Capacitor } from "@capacitor/core"
import { lowlight } from "../utils/highlight"
import { cleanInlineCodePath, localFsPathFromImageSrc, pathFromOpenherHref } from "../shared/lib/filePaths.ts"
import { escapeHtml } from "../shared/lib/escapeHtml"
import { remarkFilePaths } from "../shared/lib/remarkFilePaths"
import { FilePathButton } from "./FilePathButton"
import { MarkdownImage } from "./MarkdownImage"
import { Flowchart } from "../vendor/bt-flowchart/Flowchart"
import { parseFlowchartSpec } from "../vendor/bt-flowchart/spec"

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

// Umbral acordado: hasta 3 columnas entran en el ancho del chat; de 4 para
// arriba la tabla scrollea en horizontal en vez de aplastar las celdas.
const TABLE_SCROLL_MIN_COLUMNS = 4

/** Columnas de una tabla markdown = celdas de su primera fila. */
function tableColumns(children: ReactNode): number {
  for (const section of Children.toArray(children)) {
    if (!isValidElement(section)) continue
    for (const row of Children.toArray((section.props as { children?: ReactNode }).children)) {
      if (!isValidElement(row)) continue
      const cells = Children.toArray((row.props as { children?: ReactNode }).children)
      if (cells.length > 0) return cells.length
    }
  }
  return 0
}

function Table({ children }: ComponentProps<"table">) {
  const wide = tableColumns(children) >= TABLE_SCROLL_MIN_COLUMNS
  return (
    <div className={wide ? "table-wrap table-wrap-scroll" : "table-wrap"}>
      <table>{children}</table>
    </div>
  )
}

function Link({ href, children, ...rest }: ComponentProps<"a">) {
  // Rutas detectadas por remarkFilePaths: chip con menú de apertura.
  const filePath = href ? pathFromOpenherHref(href) : null
  if (filePath) return <FilePathButton path={filePath} />
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

// react-markdown sanitiza URLs con esquema desconocido; el nuestro y las rutas
// locales de imagen se preservan para que <Link>/<MarkdownImage> las manejen.
function filePathUrlTransform(url: string): string {
  if (pathFromOpenherHref(url) !== null) return url
  if (localFsPathFromImageSrc(url)) return url
  return defaultUrlTransform(url)
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

// Marca el <code> interno de un fence para que InlineCode no interprete una
// ruta de un bloque de código como inline code (chip).
function markBlockCode(children: ReactNode): ReactNode {
  if (!isValidElement(children)) return children
  return cloneElement(children as ReactElement<{ "data-block"?: string }>, { "data-block": "true" })
}

function CodeBlock({ children, ...props }: ComponentProps<"pre">) {
  const [copied, setCopied] = useState(false)
  // Extract language from the inner <code> className
  const codeChild = Array.isArray(children) ? children[0] : children
  // \w+ deja el guion suelto: "bt-flowchart" cortaría en "bt". [\w-]+ conserva
  // el id completo del bloque ```flowchart (bt-flowchart) sin tocar el resto.
  const lang = (codeChild?.props?.className?.match(/language-([\w-]+)/)?.[1]) || ""
  const text = typeof codeChild?.props?.children === "string"
    ? codeChild.props.children
    : Array.isArray(codeChild?.props?.children)
      ? codeChild.props.children.join("")
      : ""

  // bt-flowchart (BeautifulUI): ```flowchart con JSON {steps,edges} → canvas
  // en vivo. JSON inválido/incompleto → null y el bloque se ve como código.
  const flowchartSpec = lang === "flowchart" || lang === "bt-flowchart"
    ? parseFlowchartSpec(text)
    : null

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }, [text])

  return (
    <div className="code-block-wrap">
      <div className="code-block-header">
        <span className="code-block-lang">{lang || "code"}</span>
        <button type="button" className="code-block-copy" onClick={handleCopy}
          title={copied ? "Copied!" : "Copy code"}>
          {copied ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          )}
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>
      {flowchartSpec ? (
        <Flowchart
          steps={flowchartSpec.steps}
          {...(flowchartSpec.edges ? { edges: flowchartSpec.edges } : {})}
        />
      ) : (
        <pre {...props}>{markBlockCode(children)}</pre>
      )}
    </div>
  )
}

function InlineCode({ className, children, ...props }: ComponentProps<"code">) {
  const isBlock = Boolean(className && (className.includes("hljs") || className.includes("language-")))
  // Marca que CodeBlock pone en el <code> de un fence sin lenguaje: no es
  // inline code, así que una ruta adentro no debe volverse chip.
  const inPre = (props as Record<string, unknown>)["data-block"] === "true"
  if (isBlock || inPre) {
    return <code className={className} {...props}>{children}</code>
  }
  // `C:\ruta\archivo.ts` o `src/foo.tsx` → chip con menú de apertura.
  const raw = typeof children === "string"
    ? children
    : Array.isArray(children) && children.every((c) => typeof c === "string")
      ? children.join("")
      : null
  const path = raw ? cleanInlineCodePath(raw) : null
  if (path) return <FilePathButton path={path} label={raw!.trim()} />
  return (
    <code
      style={{
        background: "transparent",
        backgroundColor: "transparent",
        border: "none",
        borderRadius: "0",
        boxShadow: "none",
        padding: "0",
        margin: "0",
        color: "var(--md-code, var(--success, #4ade80))",
        fontFamily: "var(--font-mono, monospace)",
        fontSize: "0.88em",
        fontWeight: 500,
      }}
      {...props}
    >
      {children}
    </code>
  )
}

const baseComponents = { table: Table, a: Link, code: InlineCode, pre: CodeBlock, img: MarkdownImage }

// Caché del árbol renderizado por (texto, highlight): reusar el elemento evita
// re-parsear react-markdown + lowlight en re-renders sin cambio de texto
// (scrolls, tab switches, remounts). LRU acotado a 16 mensajes.
const mdCache = new Map<string, ReactNode>()
const MD_CACHE_MAX = 16

export const Markdown = memo(function Markdown({ text, highlight, components: extraComponents }: { text: string; highlight?: string; components?: Record<string, any> }) {
  const key = `${highlight ?? ""}\u0000${text}\u0000${extraComponents ? JSON.stringify(Object.keys(extraComponents)) : ""}`
  // Si hay componentes custom, no usar caché (depende de closures)
  const useCache = !extraComponents
  if (useCache) {
    const cached = mdCache.get(key)
    if (cached) return cached
  }
  const mergedComponents = extraComponents ? { ...baseComponents, ...extraComponents } : baseComponents
  const el = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkHighlight(highlight), remarkFilePaths]}
      rehypePlugins={[rehypeHighlightLocal]}
      components={mergedComponents}
      urlTransform={filePathUrlTransform}
    >
      {text}
    </ReactMarkdown>
  )
  if (useCache) {
    if (mdCache.size >= MD_CACHE_MAX) {
      const oldest = mdCache.keys().next().value
      if (oldest !== undefined) mdCache.delete(oldest)
    }
    mdCache.set(key, el)
  }
  return el
})
