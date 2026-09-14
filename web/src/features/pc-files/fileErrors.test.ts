import { describe, it, expect } from "vitest"
import { humanizeFsError, canDownloadAfterError, looksLikeBinary } from "./fileErrors"

describe("humanizeFsError", () => {
  it("traduce os error 32 (archivo en uso)", () => {
    expect(humanizeFsError("os error 32")).toBe(
      "El archivo está en uso por otro proceso. Cerrá el programa que lo usa e intentá de nuevo."
    )
    expect(humanizeFsError("The process cannot access the file because it is being used by another process")).toContain(
      "otro proceso"
    )
  })

  it("traduce os error 5 / acceso denegado", () => {
    expect(humanizeFsError("os error 5")).toBe("Sin permisos para leer este archivo.")
    expect(humanizeFsError("Access is denied")).toBe("Sin permisos para leer este archivo.")
    expect(humanizeFsError("permission denied")).toBe("Sin permisos para leer este archivo.")
  })

  it("traduce os error 2 / no encontrado", () => {
    expect(humanizeFsError("os error 2")).toBe("El archivo ya no existe.")
    expect(humanizeFsError("not found")).toBe("El archivo ya no existe.")
  })

  it("traduce errores de red", () => {
    expect(humanizeFsError("Failed to fetch")).toBe("Sin conexión con la PC.")
    expect(humanizeFsError("Load failed")).toBe("Sin conexión con la PC.")
    expect(humanizeFsError("NetworkError")).toBe("Sin conexión con la PC.")
  })

  it("devuelve el crudo para errores desconocidos y fallback si está vacío", () => {
    expect(humanizeFsError("timeout inesperado")).toBe("timeout inesperado")
    expect(humanizeFsError("")).toBe("No se pudo leer el archivo.")
    expect(humanizeFsError("   ")).toBe("No se pudo leer el archivo.")
  })
})

describe("canDownloadAfterError", () => {
  it("no ofrece descarga para 32/5/2 ni red", () => {
    expect(canDownloadAfterError("os error 32")).toBe(false)
    expect(canDownloadAfterError("os error 5")).toBe(false)
    expect(canDownloadAfterError("os error 2")).toBe(false)
    expect(canDownloadAfterError("Failed to fetch")).toBe(false)
    expect(canDownloadAfterError("permission denied")).toBe(false)
  })

  it("ofrece descarga para errores desconocidos", () => {
    expect(canDownloadAfterError("timeout inesperado")).toBe(true)
    expect(canDownloadAfterError("")).toBe(true)
  })
})

describe("looksLikeBinary", () => {
  it("detecta NUL", () => {
    expect(looksLikeBinary("PNG\u0000IHDRdata")).toBe(true)
  })

  it("detecta exceso de caracteres de reemplazo U+FFFD", () => {
    expect(looksLikeBinary("\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD")).toBe(true)
    expect(looksLikeBinary("abc\uFFFD\uFFFD\uFFFDdefgh")).toBe(true)
    // Uno solo en un texto largo no alcanza el umbral.
    expect(
      looksLikeBinary(
        "texto plano normal y suficientemente largo como para diluir por completo un carácter de reemplazo aislado \uFFFD"
      )
    ).toBe(false)
  })

  it("no marca texto UTF-8 normal (acentos, ñ, emoji)", () => {
    expect(looksLikeBinary("líneas con acentos y ñ: canción 🎵")).toBe(false)
    expect(looksLikeBinary("")).toBe(false)
    expect(looksLikeBinary("corto")).toBe(false)
  })

  it("no marca texto ANSI/Latin-1 (CP1252): U+FFFD moderado es válido", () => {
    // ~7% de reemplazo: lo típico de un .txt español guardado en ANSI.
    const ansi = "El ni\uFFFD\uFFFDo tiene sue\uFFFD\uFFFDo; despu\uFFFDFs vuelve a leer el archivo completo."
    expect(looksLikeBinary(ansi)).toBe(false)
  })

  it("detecta controles C0 como binario", () => {
    expect(looksLikeBinary("texto\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008bin")).toBe(true)
  })
})
