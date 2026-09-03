// Partes <agent-embed> de la skill generative_ui.
// El chat muestra el tag como texto literal (react-markdown no hace
// rehype-raw): se parte el mensaje ANTES de Markdown y cada embed se
// renderiza como iframe con sandbox. Puro y testeable.

export type EmbedPart = { type: "md"; text: string } | { type: "embed"; src: string }

const EMBED_RE = /<agent-embed\s+src="([^"]+)"\s*\/?>(?:\s*<\/agent-embed>)?/g

/** Divide el texto en chunks markdown + embeds. Sin tags → un solo chunk md. */
export function splitEmbeds(text: string): EmbedPart[] {
  EMBED_RE.lastIndex = 0
  const parts: EmbedPart[] = []
  let last = 0
  let m: RegExpExecArray | null
  while ((m = EMBED_RE.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "md", text: text.slice(last, m.index) })
    const src = (m[1] ?? "").trim()
    if (src) parts.push({ type: "embed", src })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: "md", text: text.slice(last) })
  if (parts.length === 0) return [{ type: "md", text }]
  return parts
}

/** file:///C:/a/b.html → C:/a/b.html. Otra cosa (http, path suelto) → null. */
export function fileUrlToPath(src: string): string | null {
  const m = /^file:\/\/\/?(.+)$/.exec(src.trim())
  if (!m) return null
  try {
    let p = decodeURIComponent(m[1])
    // file:///C:/x → /C:/x: quitar la barra inicial ante letra de unidad
    if (/^\/[a-zA-Z]:/.test(p)) p = p.slice(1)
    return p || null
  } catch {
    return null
  }
}
