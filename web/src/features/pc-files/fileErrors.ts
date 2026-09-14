// Traducción de errores crudos del shell/FS a mensajes legibles en español.
// Funciones puras (sin React ni DOM) para testearlas en aislamiento.

const MSG_IN_USE =
  "El archivo está en uso por otro proceso. Cerrá el programa que lo usa e intentá de nuevo."
const MSG_DENIED = "Sin permisos para leer este archivo."
const MSG_MISSING = "El archivo ya no existe."
const MSG_OFFLINE = "Sin conexión con la PC."
const MSG_FALLBACK = "No se pudo leer el archivo."

const RE_IN_USE = /os error 32|another process|otro proceso/i
const RE_DENIED = /os error 5|access is denied|acceso denegado|permission denied/i
const RE_MISSING = /os error 2|no existe|not found/i
const RE_NETWORK = /failed to fetch|load failed|networkerror|sin conexión/i

export function humanizeFsError(raw: string): string {
  const s = raw ?? ""
  if (!s.trim()) return MSG_FALLBACK
  if (RE_IN_USE.test(s)) return MSG_IN_USE
  if (RE_DENIED.test(s)) return MSG_DENIED
  if (RE_MISSING.test(s)) return MSG_MISSING
  if (RE_NETWORK.test(s)) return MSG_OFFLINE
  return s
}

export function canDownloadAfterError(raw: string): boolean {
  const s = raw ?? ""
  if (RE_IN_USE.test(s) || RE_DENIED.test(s) || RE_MISSING.test(s) || RE_NETWORK.test(s)) return false
  return true
}

export function looksLikeBinary(text: string): boolean {
  if (text.includes("\0")) return true
  if (text.length < 8) return false
  let bad = 0
  let control = 0
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i)
    // U+FFFD: byte inválido decodificado con lossy (ANSI/Latin-1 también cae
    // acá, por eso el umbral es alto: un texto español CP1252 ronda 5-8%).
    if (c === 0xfffd) bad++
    // Controles C0 (sin tab/newline/CR) y DEL: señal fuerte de binario.
    else if ((c < 0x20 && c !== 0x09 && c !== 0x0a && c !== 0x0d) || c === 0x7f) control++
  }
  return bad / text.length > 0.1 || control / text.length > 0.1
}
