// Primitivos async compartidos. Una sola implementación de `withTimeout`:
// los hooks que necesitaban cortar una promesa lenta pasaban su propio
// `Promise.race` inline (useAI x2, useConfig) o una copia local
// (serverDiscovery). El mensaje de rechazo es parámetro para no cambiar el
// texto que cada llamador inspecciona en su catch.

/**
 * Corre `promise` contra un reloj de `ms`.
 * - Si gana la promesa, resuelve con su valor (y limpia el timer).
 * - Si la promesa rechaza antes, propaga ESE rechazo (no lo envuelve).
 * - Si vence el reloj, rechaza con `new Error(message)`.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, message = "timeout"): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}
