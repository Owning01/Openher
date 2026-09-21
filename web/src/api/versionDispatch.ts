import type { ServerConfig } from "../types"
import { getApiVersion } from "../shared/api/version"

/**
 * Despacho por versión del server. Resuelve la versión detectada y ejecuta la
 * rama v2 si es "v2", o la v1 en caso contrario. Reemplaza los repetidos
 * `if ((await getApiVersion(config)) === "v2") { ... }` conservando el mismo
 * orden de evaluación: primero se detecta la versión, después corre UNA rama.
 */
export async function pickV2<T>(
  config: ServerConfig,
  onV1: () => T | Promise<T>,
  onV2: () => T | Promise<T>,
): Promise<T> {
  return (await getApiVersion(config)) === "v2" ? onV2() : onV1()
}

/** Como pickV2 pero para ramas que necesitan saber si la versión es v2. */
export async function isV2(config: ServerConfig): Promise<boolean> {
  return (await getApiVersion(config)) === "v2"
}
