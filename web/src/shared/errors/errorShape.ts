// Normalizadores únicos de la forma de un error desconocido.
// Unifican los lectores que antes vivían duplicados: `errorStatus` en api.ts y
// el `httpStatus` de useFolderPicker (ambos leían `cause.status`), y
// `errorMessage` en serverErrors.ts.

/**
 * Status HTTP del error envuelto por el cliente SDK (`cause.status`).
 * Sin status (o no numérico) = fallo de red / error no-HTTP.
 */
export function errorStatus(error: unknown): number | undefined {
  const cause = (error as { cause?: { status?: unknown } } | undefined)?.cause
  return typeof cause?.status === "number" ? cause.status : undefined
}

/** Formateo genérico de un error: mensaje plano, `data.message` o JSON. */
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
