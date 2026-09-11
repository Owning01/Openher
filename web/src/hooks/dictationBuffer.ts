// Lógica pura de acumulación del dictado (sin DOM ni micrófono).
// Invariante: estas funciones NUNCA recortan ni vacían el texto previo.
// Ante hipótesis ambiguas conservan el buffer y solo añaden.

/** Añade un segmento final (Web Speech API) al buffer acumulado. */
export function appendWebFinal(prev: string, chunk: string): string {
  const c = chunk.trim()
  if (!c) return prev
  if (!prev) return c
  if (prev.endsWith(c)) return prev
  return `${prev} ${c}`
}

/** Texto a mostrar = finales acumulados + interim en curso. */
export function combineDisplay(finalBuffer: string, interim: string): string {
  const it = interim.trim()
  if (!it) return finalBuffer
  return finalBuffer ? `${finalBuffer} ${it}` : it
}

/**
 * Integra un parcial nativo en el buffer.
 * `baseLen` es la longitud del buffer al empezar la utterance actual:
 * solo se reescribe la cola posterior a ese punto. Nunca recorta.
 */
export function mergeNativePartial(prev: string, baseLen: number, text: string): string {
  const t = text.trim()
  if (!t) return prev
  const cut = Math.max(0, Math.min(baseLen, prev.length))
  const head = prev.slice(0, cut).trim()
  const tail = prev.slice(cut).trim()
  const withHead = (x: string) => (head ? `${head} ${x}` : x)
  if (!tail) return withHead(t)
  if (t === tail) return prev
  if (t.startsWith(tail)) return withHead(t)
  if (tail.startsWith(t)) return prev
  if (!prev.includes(t)) return `${prev.trim()} ${t}`
  return prev
}
