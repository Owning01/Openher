import type { MessageEnvelope } from "./model"

/**
 * Autor externo de un mensaje: si quien lo envió marcó `metadata.from`
 * (otro agente vía inbox/API), se devuelve ese nombre para pintarlo distinto.
 * Sin marca → null (mensaje del humano).
 */
export function messageAuthorFrom(info: MessageEnvelope["info"] | null | undefined): string | null {
  const meta = info?.metadata
  if (!meta || typeof meta !== "object") return null
  const from = (meta as Record<string, unknown>).from
  if (typeof from !== "string") return null
  const name = from.trim()
  return name ? name : null
}
