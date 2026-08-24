/**
 * Copiado de G:\Proyectos\opencode\packages\sdk\js\src\error-interceptor.ts
 * Envuelve respuestas de error decodificadas (POJOs) en Error con cause {body,status}
 * para que formatServerError pueda hacer unwrap.
 */
export function wrapClientError(
  error: unknown,
  status: number | undefined,
  target: string | undefined,
  method: string | undefined,
): unknown {
  if (error instanceof Error) return error
  if (typeof error === "object" && error !== null && Object.keys(error as object).length > 0) {
    const obj = error as { data?: { message?: unknown }; message?: unknown; name?: unknown }
    const message =
      (typeof obj.data?.message === "string" && obj.data.message) ||
      (typeof obj.message === "string" && obj.message) ||
      (typeof obj.name === "string" && obj.name) ||
      describe(target, method, status)
    return new Error(message, { cause: { body: error, status } })
  }
  if (typeof error === "string" && error.length > 0) {
    return new Error(error, { cause: { body: error, status } })
  }
  const reason = status ? "(empty response body)" : "network error (no response)"
  return new Error(`opencode server ${describe(target, method, status)}: ${reason}`, {
    cause: { body: error, status },
  })
}

function describe(target: string | undefined, method: string | undefined, status: number | undefined) {
  const m = method ?? "?"
  const u = target ?? "?"
  return `${m} ${u}${status ? ` → ${status}` : ""}`
}

export function toWrappedError(detail: string, status: number | undefined, target: string, method: string, rawBody: unknown) {
  if (rawBody && typeof rawBody === "object" && Object.keys(rawBody as object).length > 0) {
    return wrapClientError(rawBody, status, target, method)
  }
  return new Error(detail || `HTTP ${status ?? "?"}`, { cause: { body: rawBody ?? detail, status } })
}
