// Highlight compartido (DRY): un solo punto de highlight para ToolPart,
// visor del explorer y cualquier vista de solo-lectura. Reusa lowlight +
// langFromFilename + hastToHtml, igual que LiteEditor/FileEditor, con los
// mismos topes (archivos grandes van en plano).
import { memo, useMemo } from "react"
import { lowlight, langFromFilename } from "../utils/highlight"
import { escapeHtml, hastToHtml, type HastNode } from "../utils/editorOps"
import { sanitizeHtml } from "../utils/sanitize"

const HL_MAX_CHARS = 200_000
const HL_MAX_LINES = 5000

function countLines(s: string): number {
  let n = 1
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++
  return n
}

// HTML resaltado o "" si no aplica (plaintext, vacío o muy grande).
export function highlightToHtml(filename: string, code: string): string {
  if (!code || code.length > HL_MAX_CHARS || countLines(code) > HL_MAX_LINES) return ""
  const lang = langFromFilename(filename)
  if (lang === "plaintext") return ""
  try {
    const tree = lowlight.highlight(lang, code) as unknown as { children?: HastNode[] }
    const html = hastToHtml(tree.children)
    return html ? sanitizeHtml(html) : ""
  } catch {
    return ""
  }
}

// <code> con los colores del editor; fallback a texto plano escapado.
// Ocupa el mismo <pre> del llamador: sin wrapper extra ni layout propio.
export const HighlightedCode = memo(function HighlightedCode({ path, code }: { path: string; code: string }) {
  const html = useMemo(() => highlightToHtml(path, code) || escapeHtml(code), [path, code])
  return <HlCodeHtml html={html} />
})

// HTML ya resaltado (p. ej. una línea de un highlight de archivo completo).
export const HlCodeHtml = memo(function HlCodeHtml({ html }: { html: string }) {
  return <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} />
})
