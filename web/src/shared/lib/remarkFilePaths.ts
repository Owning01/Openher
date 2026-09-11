// Plugin remark: convierte rutas de archivo en texto plano dentro de un link
// con esquema propio (openher-path:) para que <Markdown> las pinte como chips.
// No toca links existentes, inline code, bloques de código ni HTML embebido.
import { findTextFilePaths, toOpenherPathHref } from "./filePaths"

const SKIP_PARENTS = new Set(["link", "linkReference", "inlineCode", "code", "html", "image", "imageReference"])

type MdNode = {
  type?: string
  value?: string
  url?: string
  children?: MdNode[]
}

export function remarkFilePaths() {
  return function transformer(tree: MdNode) {
    const walk = (node: MdNode, parent?: MdNode) => {
      if (!node || typeof node !== "object") return
      if (node.type === "text" && typeof node.value === "string") {
        if (parent?.type && SKIP_PARENTS.has(parent.type)) return
        const matches = findTextFilePaths(node.value)
        if (matches.length === 0) return
        const children: MdNode[] = []
        let last = 0
        for (const match of matches) {
          if (match.index > last) children.push({ type: "text", value: node.value.slice(last, match.index) })
          children.push({
            type: "link",
            url: toOpenherPathHref(match.path),
            children: [{ type: "text", value: node.value.slice(match.index, match.index + match.length) }],
          })
          last = match.index + match.length
        }
        if (last < node.value.length) children.push({ type: "text", value: node.value.slice(last) })
        const idx = parent?.children?.indexOf(node) ?? -1
        if (idx >= 0 && parent?.children) parent.children.splice(idx, 1, ...children)
        return
      }
      if (Array.isArray(node.children)) {
        // Copia: el splice reemplaza nodos durante el recorrido.
        for (const child of [...node.children]) walk(child, node)
      }
    }
    walk(tree)
    return tree
  }
}
