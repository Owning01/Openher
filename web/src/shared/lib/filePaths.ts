// Detección de rutas de archivo en texto (mensajes del agente).
// El chat las convierte en chips que permiten abrir en el editor, con la app
// predeterminada o eligiendo app (ver FilePathButton).
//
// Reglas para evitar falsos positivos:
// - Windows:  C:\..., C:/... (con al menos un segmento) y UNC \\server\share...
// - POSIX:    /home/... (raíces conocidas) o /dir/archivo.ext (2+ segmentos + extensión)
// - Relativas: dir/archivo.ext, dir\archivo.ext (solo con extensión)
// - Se ignoran URLs (https://...), fechas (9/11/2026), "y/o", "TCP/IP", etc.

/** Ruta absoluta que /shell/fs acepta sin resolver contra el directorio. */
export function isAbsoluteFsPath(p: string): boolean {
  if (p.startsWith("/") || p.startsWith("\\\\")) return true
  return /^[a-zA-Z]:[\\/]/.test(p)
}

/** Último segmento de una ruta (para labels del menú). */
export function basenameFsPath(p: string): string {
  const parts = p.split(/[/\\]/).filter(Boolean)
  return parts[parts.length - 1] ?? p
}

/** Separa una ruta en carpeta (con separador final) y nombre del archivo. */
export function splitFsPath(p: string): { dir: string; name: string } {
  const idx = Math.max(p.lastIndexOf("\\"), p.lastIndexOf("/"))
  if (idx < 0) return { dir: "", name: p }
  return { dir: p.slice(0, idx + 1), name: p.slice(idx + 1) }
}

// Punto de color por tipo de archivo (estilo "Ruta viva" A).
const EXT_COLORS: Record<string, string> = {
  tsx: "#7dd3fc", jsx: "#7dd3fc", ts: "#60a5fa", mts: "#60a5fa", cts: "#60a5fa",
  js: "#fcd34d", mjs: "#fcd34d", cjs: "#fcd34d",
  css: "#f0abfc", scss: "#f0abfc", less: "#f0abfc",
  md: "#c4b5fd", mdx: "#c4b5fd", txt: "#a1a1aa", log: "#a1a1aa",
  json: "#fcd34d", yml: "#f0abfc", yaml: "#f0abfc", toml: "#fdba74", xml: "#fdba74", ini: "#a1a1aa",
  html: "#fdba74", htm: "#fdba74", vue: "#86efac", svelte: "#fdba74", astro: "#fdba74",
  py: "#86efac", rb: "#fb7185", go: "#7dd3fc", rs: "#fdba74", java: "#fb7185", kt: "#c4b5fd",
  swift: "#fdba74", php: "#c4b5fd", c: "#7dd3fc", h: "#7dd3fc", cpp: "#7dd3fc", hpp: "#7dd3fc",
  sh: "#86efac", bash: "#86efac", ps1: "#7dd3fc", bat: "#a1a1aa", cmd: "#a1a1aa", sql: "#7dd3fc",
  png: "#f0abfc", jpg: "#f0abfc", jpeg: "#f0abfc", gif: "#f0abfc", webp: "#f0abfc", avif: "#f0abfc",
  svg: "#fcd34d", ico: "#fcd34d", pdf: "#fb7185", zip: "#fcd34d",
  exe: "#a1a1aa", dll: "#a1a1aa", lnk: "#a1a1aa",
}

/** Color del punto según la extensión (gris muted si no se conoce). */
export function extColor(fileName: string): string {
  const m = /\.([A-Za-z0-9]+)$/.exec(fileName)
  const ext = m?.[1]?.toLowerCase() ?? ""
  return EXT_COLORS[ext] ?? "#a1a1aa"
}

/** Resuelve una ruta relativa contra el directorio de la sesión. */
export function resolveFsPath(p: string, directory?: string): string {
  if (isAbsoluteFsPath(p)) return p
  const dir = (directory ?? "").trim().replace(/[\\/]+$/, "")
  if (!dir) return p
  const sep = dir.includes("\\") ? "\\" : "/"
  return `${dir}${sep}${p.replace(/[\\/]+/g, sep)}`
}

// Esquema propio para que el markdown convierta rutas en chips sin perder el
// texto original; react-markdown lo deja pasar con un urlTransform dedicado.
export const OPENHER_PATH_SCHEME = "openher-path:"

export function toOpenherPathHref(path: string): string {
  return OPENHER_PATH_SCHEME + encodeURIComponent(path)
}

export function pathFromOpenherHref(href: string): string | null {
  if (!href.startsWith(OPENHER_PATH_SCHEME)) return null
  try {
    return decodeURIComponent(href.slice(OPENHER_PATH_SCHEME.length))
  } catch {
    return null
  }
}

// Raíces POSIX que sí tratamos como FS local en un src de imagen (una ruta web
// tipo /img/x.png NO es FS).
const POSIX_FS_ROOT = /^\/(?:home|Users|tmp|var|etc|opt|usr|mnt|media|root|srv|dev|proc|Volumes)\//

/**
 * Si el src de una imagen es una ruta del FS local (Windows `C:\`, UNC,
 * `file://` o una raíz POSIX conocida), devuelve la ruta; si no, null.
 * Se usa para cargarla por el shell (/shell/fs/download) en vez de un <img>
 * directo, que en el webview no puede leer el disco.
 */
export function localFsPathFromImageSrc(src: string): string | null {
  if (!src) return null
  // micromark normaliza destinos y percent-encodea backslashes
  // (C:%5CUsers%5C...): decodificar para reconocer la ruta real.
  let candidate = src
  if (/%5C|%2F/i.test(candidate)) {
    try {
      candidate = decodeURIComponent(candidate)
    } catch {
      /* se evalúa el original */
    }
  }
  if (candidate.startsWith("file://")) {
    try {
      const p = decodeURIComponent(new URL(candidate).pathname)
      return p.replace(/^\/([A-Za-z]:)/, "$1")
    } catch {
      return null
    }
  }
  if (candidate.startsWith("data:") || candidate.startsWith("blob:") || /^[a-z][a-z0-9+.-]*:\/\//i.test(candidate)) return null
  if (/^[A-Za-z]:[\\/]/.test(candidate) || candidate.startsWith("\\\\")) return candidate
  if (POSIX_FS_ROOT.test(candidate)) return candidate
  return null
}

const POSIX_ROOT = /^\/(?:home|Users|tmp|var|etc|opt|usr|mnt|media|root|srv|dev|proc|Volumes)(?:\/|$)/
const HAS_EXT = /\.[A-Za-z0-9]{1,8}$/
const REL_FULL = /^(?:[A-Za-z0-9._@+-]+[\\/])+[A-Za-z0-9._@+-]+\.[A-Za-z0-9]{1,8}$/

const ABS_CANDIDATE = /(?:[A-Za-z]:[\\/]|\\\\[^\\/\s]+[\\/]|\/)[^\s"'`<>|*?\r\n]*/g
const REL_CANDIDATE = /(?:[A-Za-z0-9._@+-]+[\\/])+[A-Za-z0-9._@+-]+\.[A-Za-z0-9]{1,8}/g

export type TextPathMatch = { index: number; length: number; path: string }

function countChar(s: string, ch: string): number {
  let n = 0
  for (const c of s) if (c === ch) n++
  return n
}

/** Quita puntuación final que pertenece a la prosa, no a la ruta. */
function trimTrailingPunctuation(raw: string): string {
  let s = raw
  while (s.length > 0 && /[.,;:!?"'”’«»]/.test(s[s.length - 1]!)) s = s.slice(0, -1)
  const pairs: Array<[string, string]> = [["(", ")"], ["[", "]"], ["{", "}"]]
  for (const [open, close] of pairs) {
    while (s.endsWith(close) && countChar(s, close) > countChar(s, open)) s = s.slice(0, -1)
  }
  return s
}

function isPlausibleAbsolute(s: string): boolean {
  if (/^[A-Za-z]:[\\/]/.test(s)) return s.length > 3
  if (s.startsWith("\\\\")) return /^\\\\[^\\/\s]+[\\/][^\\/\s]+/.test(s)
  if (s.startsWith("/")) {
    if (s.startsWith("//")) return false
    if (POSIX_ROOT.test(s)) return s.length > 1
    const segs = s.split("/").filter(Boolean)
    return segs.length >= 2 && HAS_EXT.test(s)
  }
  return false
}

/** Texto de un inline code que ES una ruta (acepta espacios si es absoluta). */
export function cleanInlineCodePath(raw: string): string | null {
  const t = raw.replace(/\s+/g, " ").trim()
  if (t.length < 3 || t.length > 500 || t.includes("\n")) return null
  if (isAbsoluteFsPath(t)) return isPlausibleAbsolute(t) ? t : null
  return REL_FULL.test(t) ? t : null
}

/**
 * Busca rutas en un texto plano. Devuelve índices sobre el texto original
 * (para partirlo en nodos) en orden.
 */
export function findTextFilePaths(text: string): TextPathMatch[] {
  const matches: TextPathMatch[] = []

  ABS_CANDIDATE.lastIndex = 0
  let m: RegExpExecArray | null
  while ((m = ABS_CANDIDATE.exec(text)) !== null) {
    const raw = m[0]
    if (raw.startsWith("//")) continue
    const before = m.index > 0 ? text[m.index - 1]! : ""
    // URLs ("file:/C:/", "s3://..."), colas de otra ruta ("/C:/...") o tokens
    // pegados a una palabra ("abcC:\...") no son rutas locales.
    if (before === ":" || before === "/" || before === "\\") continue
    if (/[A-Za-z0-9_]/.test(before)) continue
    const path = trimTrailingPunctuation(raw)
    if (path.length < 3) continue
    if (!isPlausibleAbsolute(path)) continue
    matches.push({ index: m.index, length: path.length, path })
  }

  REL_CANDIDATE.lastIndex = 0
  while ((m = REL_CANDIDATE.exec(text)) !== null) {
    const start = m.index
    const path = m[0]
    const before = start > 0 ? text[start - 1]! : ""
    // Dentro de URLs, rutas absolutas o tokens más largos.
    if (before && /[\w.@/\\:-]/.test(before)) continue
    if (/\b(?:https?|ftp|file):\/\/$/i.test(text.slice(Math.max(0, start - 8), start))) continue
    const end = start + path.length
    if (matches.some((a) => start < a.index + a.length && end > a.index)) continue
    matches.push({ index: start, length: path.length, path })
  }

  return matches.sort((a, b) => a.index - b.index)
}
