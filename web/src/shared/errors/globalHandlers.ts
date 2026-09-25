// Handlers globales de errores no capturados (unhandledrejection / window.error).
// Antes de este módulo no había NINGUNO: una promesa rechazada o un error de
// window morían en consola a lo sumo, y en producción sin consola = en silencio.
// El aviso viaja por CustomEvent para no acoplar este módulo a React: el
// ToastProvider (components/Toasts.tsx) lo escucha y lo muestra.

import { log } from "../../utils/log"
import { errorMessage } from "./errorShape"

export const APP_ERROR_EVENT = "app-error"

// Anti-flood: un poll roto puede rechazar cada pocos segundos; no repetir el
// mismo texto dentro de la ventana.
const DEDUPE_MS = 10_000
const lastSeen = new Map<string, number>()

function report(source: string, error: unknown): void {
  const msg = errorMessage(error) || "Error desconocido"
  log.err(`[${source}]`, error)
  const now = Date.now()
  if ((lastSeen.get(msg) ?? 0) > now - DEDUPE_MS) return
  lastSeen.set(msg, now)
  // Cap de memoria: el Map conserva inserción; se descarta lo más viejo.
  if (lastSeen.size > 50) {
    const oldest = lastSeen.keys().next().value
    if (oldest !== undefined) lastSeen.delete(oldest)
  }
  window.dispatchEvent(new CustomEvent(APP_ERROR_EVENT, { detail: msg }))
}

export function installGlobalErrorHandlers(): void {
  window.addEventListener("unhandledrejection", (e) => report("unhandledrejection", e.reason))
  window.addEventListener("error", (e) => report("window.error", e.error ?? e.message))
}
