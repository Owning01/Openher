// Operaciones puras del mini-editor (LiteEditor): sin DOM, sin estado, 100% testeables.
// Todo trabaja sobre offsets de string para no duplicar arrays de líneas en RAM.

export type HastNode = {
  type?: string
  tagName?: string
  value?: string
  properties?: { className?: unknown; [k: string]: unknown }
  children?: HastNode[]
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function classAttr(props?: HastNode["properties"]): string {
  const c = props?.className
  if (Array.isArray(c)) {
    const s = c.filter((x) => typeof x === "string").join(" ")
    return s ? ` class="${s}"` : ""
  }
  if (typeof c === "string" && c) return ` class="${c}"`
  return ""
}

// Serializa el árbol hast de lowlight a HTML. Solo emite span/text: lowlight
// nunca genera otras etiquetas, así no hay riesgo de inyección de atributos.
export function hastToHtml(nodes: HastNode[] | undefined): string {
  if (!nodes || nodes.length === 0) return ""
  let out = ""
  for (const n of nodes) {
    if (!n || typeof n !== "object") continue
    if (n.type === "text") {
      out += escapeHtml(n.value ?? "")
    } else if (n.type === "element" && typeof n.tagName === "string") {
      const tag = n.tagName === "code" || n.tagName === "span" ? n.tagName : "span"
      out += `<${tag}${classAttr(n.properties)}>${hastToHtml(n.children)}</${tag}>`
    } else if (Array.isArray(n.children)) {
      out += hastToHtml(n.children)
    }
  }
  return out
}

// lowlight/highlight.js registran pocos lenguajes aquí: mapea el resto a
// comentarios correctos por extensión para el toggle de comentario.
export function commentPrefixFor(path: string): string {
  const ext = (path.split(".").pop() || "").toLowerCase()
  if (["py", "pyw", "sh", "bash", "zsh", "yml", "yaml", "toml", "ini", "cfg", "rb", "pl", "r", "dockerfile", "mk", "makefile"].includes(ext)) return "#"
  if (["sql", "lua", "adb", "ads"].includes(ext)) return "--"
  if (["vim", "asm", "s", "ini"].includes(ext)) return ";"
  return "//"
}

export function getLineCol(text: string, offset: number): { line: number; col: number } {
  const safe = Math.max(0, Math.min(offset, text.length))
  let line = 1
  let lastBreak = -1
  for (let i = 0; i < safe; i++) {
    if (text.charCodeAt(i) === 10) {
      line++
      lastBreak = i
    }
  }
  return { line, col: safe - lastBreak }
}

export function offsetFromLineCol(text: string, line: number, col: number): number {
  const l = Math.max(1, line)
  let cur = 1
  let i = 0
  while (i < text.length && cur < l) {
    if (text.charCodeAt(i) === 10) cur++
    i++
  }
  if (cur < l) return text.length
  const lineEnd = text.indexOf("\n", i)
  const end = lineEnd === -1 ? text.length : lineEnd
  return Math.min(i + Math.max(0, col - 1), end)
}

// Rango de la línea que contiene offset (sin incluir el \n).
export function lineRangeOf(text: string, offset: number): { start: number; end: number } {
  const safe = Math.max(0, Math.min(offset, text.length))
  let start = safe
  while (start > 0 && text.charCodeAt(start - 1) !== 10) start--
  let end = safe
  while (end < text.length && text.charCodeAt(end) !== 10) end++
  return { start, end }
}

// Expande una selección a líneas completas. Devuelve índices de línea [s, e).
export function linesOfSelection(text: string, selStart: number, selEnd: number): { startLine: number; endLine: number } {
  const a = Math.max(0, Math.min(selStart, selEnd))
  const b = Math.min(text.length, Math.max(selStart, selEnd))
  let startLine = 0
  for (let i = 0; i < a; i++) if (text.charCodeAt(i) === 10) startLine++
  let endLine = startLine
  for (let i = a; i < b; i++) if (text.charCodeAt(i) === 10) endLine++
  // Si la selección termina justo al inicio de una línea, esa línea no cuenta
  if (b > a && text.charCodeAt(b - 1) === 10) endLine--
  return { startLine, endLine: Math.max(startLine, endLine) }
}

function splitLines(text: string): string[] {
  return text.split("\n")
}

function offsetOfLine(lines: string[], line: number): number {
  let off = 0
  for (let i = 0; i < line && i < lines.length; i++) off += lines[i].length + 1
  return Math.min(off, lines.join("\n").length)
}

export function toggleLineComment(
  text: string,
  selStart: number,
  selEnd: number,
  prefix: string
): { text: string; selStart: number; selEnd: number } {
  const lines = splitLines(text)
  const { startLine, endLine } = linesOfSelection(text, selStart, selEnd)
  const target = lines.slice(startLine, endLine + 1)
  const nonEmpty = target.filter((l) => l.trim().length > 0)
  // Chequeo estricto real: prefijo justo tras el indent
  const isCommented = (l: string) => l.trimStart().startsWith(prefix)
  const next = [...lines]
  if (nonEmpty.length > 0 && nonEmpty.every(isCommented)) {
    for (let i = startLine; i <= endLine; i++) {
      const l = next[i]
      const indent = l.length - l.trimStart().length
      let j = indent + prefix.length
      if (l[j] === " ") j++
      next[i] = l.slice(0, indent) + l.slice(j)
    }
  } else {
    for (let i = startLine; i <= endLine; i++) {
      const l = next[i]
      if (l.trim().length === 0) continue
      const indent = l.length - l.trimStart().length
      next[i] = l.slice(0, indent) + prefix + " " + l.slice(indent)
    }
  }
  const out = next.join("\n")
  return { text: out, selStart: offsetOfLine(next, startLine), selEnd: offsetOfLine(next, endLine + 1) }
}

export function duplicateLineOrSelection(
  text: string,
  selStart: number,
  selEnd: number
): { text: string; selStart: number; selEnd: number } {
  const a = Math.max(0, Math.min(selStart, selEnd))
  const b = Math.min(text.length, Math.max(selStart, selEnd))
  if (b > a) {
    const chunk = text.slice(a, b)
    return { text: text.slice(0, b) + chunk + text.slice(b), selStart: a + chunk.length, selEnd: b + chunk.length }
  }
  const { start, end } = lineRangeOf(text, a)
  const line = text.slice(start, end)
  const col = a - start
  if (end === text.length) {
    const out = text + "\n" + line
    const pos = end + 1 + Math.min(col, line.length)
    return { text: out, selStart: pos, selEnd: pos }
  }
  const out = text.slice(0, end + 1) + line + "\n" + text.slice(end + 1)
  const pos = end + 1 + Math.min(col, line.length)
  return { text: out, selStart: pos, selEnd: pos }
}

export function moveLine(
  text: string,
  selStart: number,
  selEnd: number,
  dir: -1 | 1
): { text: string; selStart: number; selEnd: number } | null {
  const lines = splitLines(text)
  const { startLine, endLine } = linesOfSelection(text, selStart, selEnd)
  if (dir === -1 && startLine === 0) return null
  if (dir === 1 && endLine >= lines.length - 1) return null
  const next = [...lines]
  if (dir === -1) {
    const above = next.splice(startLine - 1, 1)[0]
    next.splice(endLine, 0, above)
  } else {
    const below = next.splice(endLine + 1, 1)[0]
    next.splice(startLine, 0, below)
  }
  const out = next.join("\n")
  const ns = startLine + dir
  const ne = endLine + dir
  return { text: out, selStart: offsetOfLine(next, ns), selEnd: offsetOfLine(next, ne + 1) }
}

export function deleteLine(
  text: string,
  selStart: number,
  selEnd: number
): { text: string; selStart: number; selEnd: number } {
  const lines = splitLines(text)
  const { startLine, endLine } = linesOfSelection(text, selStart, selEnd)
  if (lines.length === 1) return { text: "", selStart: 0, selEnd: 0 }
  const next = [...lines]
  next.splice(startLine, endLine - startLine + 1)
  const out = next.join("\n")
  const pos = Math.min(offsetOfLine(next, startLine), out.length)
  return { text: out, selStart: pos, selEnd: pos }
}

export function trimTrailingWhitespace(text: string): { text: string; removed: number } {
  const lines = splitLines(text)
  let removed = 0
  const next = lines.map((l) => {
    const t = l.replace(/[ \t]+$/, "")
    removed += l.length - t.length
    return t
  })
  return { text: next.join("\n"), removed }
}

export function indentSelection(
  text: string,
  selStart: number,
  selEnd: number,
  tab: string,
  outdent: boolean
): { text: string; selStart: number; selEnd: number } {
  const lines = splitLines(text)
  const { startLine, endLine } = linesOfSelection(text, selStart, selEnd)
  const next = [...lines]
  const width = tab === "\t" ? 1 : tab.length
  for (let i = startLine; i <= endLine; i++) {
    const l = next[i]
    if (outdent) {
      if (l.startsWith(tab)) next[i] = l.slice(tab.length)
      else {
        let k = 0
        while (k < width && l[k] === " ") k++
        next[i] = l.slice(k)
      }
    } else {
      if (l.length > 0) next[i] = tab + l
    }
  }
  const out = next.join("\n")
  return { text: out, selStart: offsetOfLine(next, startLine), selEnd: offsetOfLine(next, endLine + 1) }
}

// Indentación automática al pulsar Enter: hereda indent + suma si abre bloque.
export function autoIndentForEnter(lineBeforeCaret: string, tab: string): string {
  const base = lineBeforeCaret.match(/^[ \t]*/)?.[0] ?? ""
  const trimmed = lineBeforeCaret.trimEnd()
  const opens = /[{[(]\s*$/.test(trimmed) || /:\s*$/.test(trimmed)
  return "\n" + base + (opens ? tab : "")
}

const PAIRS: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  '"': '"',
  "'": "'",
  "`": "`",
}

export function pairCloser(open: string): string | null {
  return PAIRS[open] ?? null
}

export function isCloser(ch: string): boolean {
  return ch === ")" || ch === "]" || ch === "}" || ch === '"' || ch === "'" || ch === "`"
}

// Base64 sin el pico de RAM de btoa(unescape(encodeURIComponent())):
// codifica por chunks de 24KB (múltiplo de 3, sin padding intermedio).
export function toBase64Chunked(text: string): string {
  const bytes = new TextEncoder().encode(text)
  const CHUNK = 0x6000
  let out = ""
  for (let i = 0; i < bytes.length; i += CHUNK) {
    const sub = bytes.subarray(i, Math.min(i + CHUNK, bytes.length))
    let bin = ""
    for (let j = 0; j < sub.length; j++) bin += String.fromCharCode(sub[j])
    out += btoa(bin)
  }
  return out
}

export function countOccurrences(haystack: string, needle: string, caseSensitive: boolean, cap = 5000): number {
  if (!needle) return 0
  const h = caseSensitive ? haystack : haystack.toLowerCase()
  const n = caseSensitive ? needle : needle.toLowerCase()
  let count = 0
  let i = 0
  while (count < cap) {
    const j = h.indexOf(n, i)
    if (j === -1) break
    count++
    i = j + n.length
  }
  return count
}

export function findNext(
  text: string,
  query: string,
  from: number,
  caseSensitive: boolean
): number {
  if (!query) return -1
  if (caseSensitive) {
    const j = text.indexOf(query, from)
    return j !== -1 ? j : text.indexOf(query, 0)
  }
  const idx = text.toLowerCase().indexOf(query.toLowerCase(), from)
  if (idx !== -1) return idx
  return text.toLowerCase().indexOf(query.toLowerCase(), 0)
}
