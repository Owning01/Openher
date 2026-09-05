import { createTranslator, normalizeLanguage } from "../../i18n"
import { STORAGE_KEYS } from "../../constants"

export type ConfigInvalidError = {
  name: "ConfigInvalidError"
  data: {
    path?: string
    message?: string
    issues?: Array<{ message: string; path: string[] }>
  }
}

export type ProviderModelNotFoundError = {
  name: "ProviderModelNotFoundError"
  data: {
    providerID: string
    modelID: string
    suggestions?: string[]
  }
}

type Translator = (key: string, vars?: Record<string, string | number>) => string

function tr(translator: Translator | undefined, key: string, text: string, vars?: Record<string, string | number>) {
  if (!translator) return text
  const out = translator(key, vars)
  if (!out || out === key) return text
  return out
}

export function formatServerError(error: unknown, translate?: Translator, fallback?: string) {
  const unwrapped = unwrapNamedError(error)
  if (isConfigInvalidErrorLike(unwrapped)) return parseReadableConfigInvalidError(unwrapped, translate)
  if (isProviderModelNotFoundErrorLike(unwrapped)) return parseReadableProviderModelNotFoundError(unwrapped, translate)
  // ClientError("Transport") del SDK (@opencode-ai/client): el fetch ni siquiera
  // llegó al servidor (red caída, Tailscale, host/puerto, server apagado).
  // El texto crudo "Transport" no le dice nada al usuario: mensaje accionable.
  if (isTransportError(unwrapped)) return transportMessage(translate)
  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error) return error
  if (fallback) return fallback
  return tr(translate, "error.chain.unknown", "Unknown error")
}

export function unwrapNamedError(error: unknown): unknown {
  if (error instanceof Error && error.cause && typeof error.cause === "object" && "body" in error.cause) {
    return (error.cause as Record<string, unknown>).body
  }
  return error
}

const sessionNotFoundMessage = (sessionID: string) => `Session not found: ${sessionID}`

export function sessionNotFoundError(sessionID: string) {
  return new Error(sessionNotFoundMessage(sessionID))
}

export function isLocalSessionNotFoundError(error: unknown, sessionID: string) {
  return error instanceof Error && error.message === sessionNotFoundMessage(sessionID)
}

export function isSessionNotFoundError(error: unknown, sessionID: string) {
  const unwrapped = unwrapNamedError(error)
  if (typeof unwrapped !== "object" || unwrapped === null) return false
  const value = unwrapped as Record<string, unknown>
  return value._tag === "SessionNotFoundError" && value.sessionID === sessionID
}

function isConfigInvalidErrorLike(error: unknown): error is ConfigInvalidError {
  if (typeof error !== "object" || error === null) return false
  const o = error as Record<string, unknown>
  return o.name === "ConfigInvalidError" && typeof o.data === "object" && o.data !== null
}

function isProviderModelNotFoundErrorLike(error: unknown): error is ProviderModelNotFoundError {
  if (typeof error !== "object" || error === null) return false
  const o = error as Record<string, unknown>
  return o.name === "ProviderModelNotFoundError" && typeof o.data === "object" && o.data !== null
}

export function parseReadableConfigInvalidError(errorInput: ConfigInvalidError, translator?: Translator) {
  const file = errorInput.data.path && errorInput.data.path !== "config" ? errorInput.data.path : "config"
  const detail = errorInput.data.message?.trim() ?? ""
  const issues = (errorInput.data.issues ?? [])
    .map((issue) => {
      const msg = issue.message.trim()
      if (!issue.path.length) return msg
      return `${issue.path.join(".")}: ${msg}`
    })
    .filter(Boolean)
  const msg = issues.length ? issues.join("\n") : detail
  if (!msg) return tr(translator, "error.chain.configInvalid", `Config file at ${file} is invalid`, { path: file })
  return tr(translator, "error.chain.configInvalidWithMessage", `Config file at ${file} is invalid: ${msg}`, {
    path: file,
    message: msg,
  })
}

function parseReadableProviderModelNotFoundError(errorInput: ProviderModelNotFoundError, translator?: Translator) {
  const p = errorInput.data.providerID.trim()
  const m = errorInput.data.modelID.trim()
  const list = (errorInput.data.suggestions ?? []).map((v) => v.trim()).filter(Boolean)
  const body = tr(translator, "error.chain.modelNotFound", `Model not found: ${p}/${m}`, { provider: p, model: m })
  const tail = tr(translator, "error.chain.checkConfig", "Check your config (opencode.json) provider/model names")
  if (list.length) {
    const suggestions = list.slice(0, 5).join(", ")
    return [body, tr(translator, "error.chain.didYouMean", `Did you mean: ${suggestions}`, { suggestions }), tail].join("\n")
  }
  return [body, tail].join("\n")
}

// Copiado de tui/util/error.ts — formateo genérico para .cause.body
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
    return (error as { message: string }).message
  }
  if (
    error &&
    typeof error === "object" &&
    "data" in error &&
    error.data !== null &&
    typeof (error as { data: unknown }).data === "object" &&
    typeof (error as { data: { message?: unknown } }).data.message === "string"
  ) {
    return (error as { data: { message: string } }).data.message
  }
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

const REASON_LIMIT = 1024
export function truncateReason(reason: string): string {
  return reason.length > REASON_LIMIT ? `${reason.slice(0, REASON_LIMIT)}…` : reason
}

/** Detecta el fallo de red del SDK: `new ClientError("Transport", { cause })` en dist/promise. */
export function isTransportError(error: unknown): boolean {
  if (error instanceof Error) {
    if (error.name === "ClientError" && error.message.includes("Transport")) return true
    if (error.cause instanceof Error) return isTransportError(error.cause)
  }
  if (typeof error === "object" && error !== null) {
    const o = error as Record<string, unknown>
    if (o._tag === "Transport" || o.reason === "Transport") return true
  }
  return false
}

/** Traductor del idioma guardado (sin React): los callers de formatServerError no tienen `t`. */
function storedTranslator(): Translator {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEYS.LANGUAGE) : null
    return createTranslator(normalizeLanguage(raw || "es"))
  } catch {
    return createTranslator("es")
  }
}

function transportMessage(translate?: Translator): string {
  const t = translate ?? storedTranslator()
  return tr(
    t,
    "error.transport",
    "Could not reach the server. Check that Tailscale is connected on both devices, the host and port in Settings are correct, and opencode is still running.",
  )
}
