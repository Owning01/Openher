/**
 * Lectura del buffer de un terminal del cliente + espera de "idle".
 *
 * No toca `ptyx` (lista NO TOCAR): el WS ya entrega los datos al cliente y acá
 * se acumula el texto plano (sin secuencias ANSI) por tab. Sirve para
 * automatizar ("mandá el comando y esperá a que termine") sin depender del
 * scrollback de xterm, que vive en el DOM.
 */

/** Tope de texto por tab (evita crecer sin límite en builds largos). */
const MAX_CHARS = 24_000

type Entry = { text: string; lastAt: number }
const buffers = new Map<string, Entry>()

/** Secuencias ANSI (CSI/OSC/ESC) + CR suelto: se descartan al leer. */
const ANSI_RE = /\u001b\][^\u0007]*(?:\u0007|\u001b\\)|\u001b[@-Z\\-_]|\u001b\[[0-?]*[ -/]*[@-~]/g

export function stripAnsi(input: string): string {
  return input.replace(ANSI_RE, "").replace(/\r(?!\n)/g, "\n")
}

/** Suma salida cruda (texto o bytes) al buffer del tab. */
export function appendTerminalOutput(tabId: string, data: string | Uint8Array): void {
  if (!tabId || !data) return
  const text = typeof data === "string" ? data : new TextDecoder().decode(data)
  if (!text) return
  const clean = stripAnsi(text)
  if (!clean) {
    // Solo control: igual cuenta como actividad (el proceso está vivo).
    const prev = buffers.get(tabId)
    buffers.set(tabId, { text: prev?.text ?? "", lastAt: Date.now() })
    return
  }
  const prev = buffers.get(tabId)
  const merged = (prev?.text ?? "") + clean
  buffers.set(tabId, {
    text: merged.length > MAX_CHARS ? merged.slice(merged.length - MAX_CHARS) : merged,
    lastAt: Date.now(),
  })
}

/** Último texto del tab (cola de `maxChars`). */
export function readTerminal(tabId: string, maxChars = 8000): string {
  const text = buffers.get(tabId)?.text ?? ""
  return text.length > maxChars ? text.slice(text.length - maxChars) : text
}

/** Timestamp de la última salida del tab (0 si nunca hubo). */
export function lastOutputAt(tabId: string): number {
  return buffers.get(tabId)?.lastAt ?? 0
}

/** Hace cuántos ms que el tab no emite nada. */
export function terminalIdleFor(tabId: string): number {
  const last = lastOutputAt(tabId)
  return last === 0 ? Number.POSITIVE_INFINITY : Date.now() - last
}

export function isTerminalIdle(tabId: string, idleMs = 600): boolean {
  return terminalIdleFor(tabId) >= idleMs
}

export function resetTerminalBuffer(tabId: string): void {
  buffers.delete(tabId)
}

export type WaitResult = { text: string; idleMs: number; timedOut: boolean }

/**
 * Espera a que el tab deje de emitir durante `idleMs`. Si la salida no aparece
 * nunca, corta por `timeoutMs` (devuelve igual el texto que haya).
 */
export function waitForIdle(
  tabId: string,
  opts: { idleMs?: number; timeoutMs?: number; pollMs?: number } = {}
): Promise<WaitResult> {
  const idleMs = opts.idleMs ?? 600
  const timeoutMs = opts.timeoutMs ?? 30_000
  const pollMs = opts.pollMs ?? 50
  return new Promise((resolve) => {
    const started = Date.now()
    const finish = (timedOut: boolean) => {
      clearInterval(timer)
      resolve({ text: readTerminal(tabId), idleMs: Math.floor(terminalIdleFor(tabId)), timedOut })
    }
    const timer = setInterval(() => {
      if (isTerminalIdle(tabId, idleMs)) finish(false)
      else if (Date.now() - started >= timeoutMs) finish(true)
    }, pollMs)
  })
}

/**
 * Espera a que el tab emita salida NUEVA después de `since` (por defecto, ahora).
 * Complementa a `waitForIdle`: `send` → `waitForOutput` → `waitForIdle`.
 */
export function waitForOutput(
  tabId: string,
  opts: { since?: number; timeoutMs?: number; pollMs?: number } = {}
): Promise<{ appeared: boolean; text: string }> {
  const since = opts.since ?? Date.now()
  const timeoutMs = opts.timeoutMs ?? 15_000
  const pollMs = opts.pollMs ?? 40
  return new Promise((resolve) => {
    const started = Date.now()
    const timer = setInterval(() => {
      if (lastOutputAt(tabId) > since) {
        clearInterval(timer)
        resolve({ appeared: true, text: readTerminal(tabId) })
        return
      }
      if (Date.now() - started >= timeoutMs) {
        clearInterval(timer)
        resolve({ appeared: false, text: readTerminal(tabId) })
      }
    }, pollMs)
  })
}
