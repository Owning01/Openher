// Normaliza el error del assistant que manda el server (v1 y v2) a la forma
// plana que consume la UI. El server lo serializa como un union discriminado
// por `name` con el detalle dentro de `data`:
//
//   { name: "ProviderAuthError", data: { providerID, message } }
//   { name: "UnknownError",      data: { message, ref? } }
//   { name: "APIError",          data: { message, statusCode, ... } }
//   { name: "MessageOutputLengthError", data: {} }
//
// Sin esto, `session.error` y `message.info.error` llegaban a la UI vacíos
// (el código leía `error.message` en vez de `error.data.message`).

export type AssistantErrorInfo = {
  name: string
  message: string
  /** `err_xxxxxxxx`: correlaciona con el log del server (ver docs). */
  ref?: string
}

// Fallback para variantes sin `message` (p. ej. corte por límite de salida).
const GENERIC_MESSAGE: Record<string, string> = {
  MessageOutputLengthError: "The model reached its maximum output length.",
  MessageAbortedError: "Generation was aborted.",
  ContextOverflowError: "The conversation exceeded the model context window.",
}

export function normalizeAssistantError(error: unknown): AssistantErrorInfo | null {
  if (!error || typeof error !== "object") return null
  const e = error as { name?: unknown; message?: unknown; data?: unknown }
  const data = (e.data && typeof e.data === "object" ? e.data : undefined) as Record<string, unknown> | undefined
  const name = typeof e.name === "string" && e.name ? e.name : "UnknownError"
  const raw = typeof data?.message === "string" ? data.message : typeof e.message === "string" ? e.message : ""
  const providerID = typeof data?.providerID === "string" ? data.providerID : undefined
  const message =
    raw ||
    GENERIC_MESSAGE[name] ||
    (providerID ? `Provider error (${providerID}). Check the API key/credential in /connect.` : name)
  const ref = typeof data?.ref === "string" && data.ref ? data.ref : undefined
  return { name, message, ref }
}
