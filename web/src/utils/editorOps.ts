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

const OPENERS = "([{"
const CLOSERS = ")]}"
const MATCH: Record<string, string> = { "(": ")", "[": "]", "{": "}" }
const RMATCH: Record<string, string> = { ")": "(", "]": "[", "}": "{" }

// Paréntesis pareja del caret (revisa char previo y actual). Escaneo lineal con
// tope: O(n) acotado, sin parser. Dentro de strings/comentarios puede fallar:
// tradeoff documentado, igual que el resaltado por regex.
export function findMatchingBracket(
  text: string,
  caret: number,
  maxScan = 50000
): { open: number; close: number } | null {
  const cands = [caret - 1, caret]
  for (const pos of cands) {
    if (pos < 0 || pos >= text.length) continue
    const ch = text[pos]
    if (OPENERS.includes(ch)) {
      const want = MATCH[ch]
      let depth = 0
      const end = Math.min(text.length, pos + maxScan)
      for (let i = pos; i < end; i++) {
        if (text[i] === ch) depth++
        else if (text[i] === want && --depth === 0) return { open: pos, close: i }
      }
      return null
    }
    if (CLOSERS.includes(ch)) {
      const want = RMATCH[ch]
      let depth = 0
      const start = Math.max(0, pos - maxScan)
      for (let i = pos; i >= start; i--) {
        if (text[i] === ch) depth++
        else if (text[i] === want && --depth === 0) return { open: i, close: pos }
      }
      return null
    }
  }
  return null
}

// Diccionario local para autocompletado: palabras del propio documento por
// frecuencia. Escaneo único con tope para no castigar archivos grandes.
export function collectWords(text: string, minLen = 3, cap = 300, scanMax = 200_000): string[] {
  const freq = new Map<string, number>()
  const src = text.length > scanMax ? text.slice(0, scanMax) : text
  const re = /[A-Za-z_$\u00C0-\u024F][\w$\u00C0-\u024F]*/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    const w = m[0]
    if (w.length < minLen) continue
    freq.set(w, (freq.get(w) ?? 0) + 1)
  }
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, cap)
    .map(([w]) => w)
}

// Prefijo de palabra justo antes del caret (para autocompletar)
export function wordBeforeCaret(text: string, caret: number): { word: string; start: number } {
  let i = Math.max(0, Math.min(caret, text.length))
  while (i > 0 && /[\w$\u00C0-\u024F]/.test(text[i - 1])) i--
  return { word: text.slice(i, caret), start: i }
}

export type TextEdit = { start: number; end: number; insert: string }

// Aplica N ediciones de una vez (multi-cursor): orden descendente para no
// invalidar offsets. Ediciones solapadas: gana la de mayor offset.
export function applyEdits(text: string, edits: TextEdit[]): string {
  const sorted = [...edits].sort((a, b) => b.start - a.start)
  let out = text
  let guard = -1
  for (const e of sorted) {
    const s = Math.max(0, Math.min(e.start, out.length))
    const en = Math.max(s, Math.min(e.end, out.length))
    if (guard !== -1 && en > guard) continue
    out = out.slice(0, s) + e.insert + out.slice(en)
    guard = s
  }
  return out
}

export type DiffLine = { t: " " | "-" | "+"; text: string }
export type DiffHunk = { oldStart: number; newStart: number; lines: DiffLine[] }

// Diff unificado por líneas para "cambios sin guardar". Recorta prefijo/sufijo
// común y corre LCS solo en el medio, con tope: si el núcleo es muy grande
// devuelve un hunk plano (borra todo + agrega todo) en vez de colgar la UI.
export function diffLines(
  oldText: string,
  newText: string,
  maxCells = 4_000_000,
  context = 3
): { hunks: DiffHunk[]; tooLarge: boolean } {
  if (oldText === newText) return { hunks: [], tooLarge: false }
  const a = oldText.split("\n")
  const b = newText.split("\n")
  if (a.length > 20000 || b.length > 20000) return { hunks: [], tooLarge: true }
  let pre = 0
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++
  let suf = 0
  while (
    suf < a.length - pre &&
    suf < b.length - pre &&
    a[a.length - 1 - suf] === b[b.length - 1 - suf]
  ) suf++
  const am = a.slice(pre, a.length - suf)
  const bm = b.slice(pre, b.length - suf)
  type Op = { t: " " | "-" | "+"; text: string }
  let ops: Op[]
  if (am.length * bm.length > maxCells) {
    ops = [...am.map((text): Op => ({ t: "-", text })), ...bm.map((text): Op => ({ t: "+", text }))]
  } else {
    // LCS DP solo sobre el núcleo recortado
    const n = am.length
    const m = bm.length
    const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = am[i] === bm[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
    ops = []
    let i = 0
    let j = 0
    while (i < n && j < m) {
      if (am[i] === bm[j]) { ops.push({ t: " ", text: am[i] }); i++; j++ }
      else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push({ t: "-", text: am[i] }); i++ }
      else { ops.push({ t: "+", text: bm[j] }); j++ }
    }
    while (i < n) { ops.push({ t: "-", text: am[i++] }) }
    while (j < m) { ops.push({ t: "+", text: bm[j++] }) }
  }
  // Agrupa cambios cercanos en hunks con contexto
  const hunks: DiffHunk[] = []
  const changed: number[] = []
  ops.forEach((o, i) => { if (o.t !== " ") changed.push(i) })
  const groups: number[][] = []
  let g: number[] = []
  let prev = -Infinity
  for (const i of changed) {
    if (i - prev > context * 2) { if (g.length) groups.push(g); g = [] }
    g.push(i)
    prev = i
  }
  if (g.length) groups.push(g)
  for (const [gi, grp] of groups.entries()) {
    const s = Math.max(0, grp[0] - context)
    const e = Math.min(ops.length, grp[grp.length - 1] + context + 1)
    let oldStart = pre + 1
    let newStart = pre + 1
    for (let q = 0; q < s; q++) {
      if (ops[q].t !== "+") oldStart++
      if (ops[q].t !== "-") newStart++
    }
    let lines = ops.slice(s, e)
    // Contexto del prefijo/sufijo recortado (son idénticos en a y b)
    if (gi === 0) {
      const ctx = a.slice(Math.max(0, pre - context), pre).map((text) => ({ t: " " as const, text }))
      lines = [...ctx, ...lines]
      oldStart -= ctx.length
      newStart -= ctx.length
    }
    if (gi === groups.length - 1) {
      const ctx = a
        .slice(a.length - suf, a.length - suf + context)
        .map((text) => ({ t: " " as const, text }))
      lines = [...lines, ...ctx]
    }
    hunks.push({ oldStart, newStart, lines })
  }
  return { hunks, tooLarge: false }
}
