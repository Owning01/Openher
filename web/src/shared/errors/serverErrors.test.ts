import { describe, it, expect, afterEach } from "vitest"
import { formatServerError, isTransportError } from "./serverErrors"
import { createTranslator, loadLanguage } from "../../i18n"
import { STORAGE_KEYS } from "../../constants"

function transportError() {
  const e = new Error("Transport")
  e.name = "ClientError"
  return e
}

afterEach(() => {
  localStorage.removeItem(STORAGE_KEYS.LANGUAGE)
})

describe("isTransportError", () => {
  it("detecta ClientError Transport del SDK", () => {
    expect(isTransportError(transportError())).toBe(true)
  })

  it("detecta Transport anidado en cause", () => {
    expect(isTransportError(new Error("falló el envío", { cause: transportError() }))).toBe(true)
  })

  it("no confunde otros ClientError ni errores comunes", () => {
    const other = new Error("UnexpectedStatus")
    other.name = "ClientError"
    expect(isTransportError(other)).toBe(false)
    expect(isTransportError(new Error("Failed to fetch"))).toBe(false)
    expect(isTransportError("Transport")).toBe(false)
  })
})

describe("formatServerError transport", () => {
  it("mapea Transport a mensaje accionable (en explícito)", () => {
    const msg = formatServerError(transportError(), createTranslator("en"))
    expect(msg).toContain("Could not reach the server")
    expect(msg).toContain("Tailscale")
    expect(msg).not.toContain("Transport")
  })

  it("sin translator usa el idioma guardado (es)", async () => {
    await loadLanguage("es")
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, "es")
    const msg = formatServerError(transportError())
    expect(msg).toContain("No se pudo contactar al servidor")
  })

  it("errores comunes siguen pasando el mensaje crudo", () => {
    expect(formatServerError(new Error("boom"))).toBe("boom")
  })
})
