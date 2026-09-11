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
