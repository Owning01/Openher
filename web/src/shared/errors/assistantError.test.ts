import { describe, it, expect } from "vitest"
import { normalizeAssistantError } from "./assistantError"

// El server serializa los errores del assistant como union discriminado por
// `name` con el detalle en `data`. La UI espera { name, message, ref }.
describe("normalizeAssistantError", () => {
  it("extrae name/message/ref de data", () => {
    expect(
      normalizeAssistantError({ name: "UnknownError", data: { message: "boom", ref: "err_abc123" } }),
    ).toEqual({ name: "UnknownError", message: "boom", ref: "err_abc123" })
  })

  it("ProviderAuthError incluye el proveedor y el mensaje", () => {
    expect(
      normalizeAssistantError({ name: "ProviderAuthError", data: { providerID: "anthropic", message: "bad key" } }),
    ).toEqual({ name: "ProviderAuthError", message: "bad key", ref: undefined })
  })

  it("ProviderAuthError sin message da una pista accionable", () => {
    const out = normalizeAssistantError({ name: "ProviderAuthError", data: { providerID: "google" } })
    expect(out?.message).toContain("google")
    expect(out?.message.toLowerCase()).toContain("connect")
  })

  it("variantes sin message usan fallback por nombre", () => {
    expect(normalizeAssistantError({ name: "MessageOutputLengthError", data: {} })?.message).toMatch(/output length/i)
    expect(normalizeAssistantError({ name: "ContextOverflowError", data: {} })?.message).toMatch(/context/i)
  })

  it("acepta la forma plana (message a nivel raíz)", () => {
    expect(normalizeAssistantError({ name: "SomeError", message: "plano" })).toEqual({
      name: "SomeError",
      message: "plano",
      ref: undefined,
    })
  })

  it("sin nombre cae a UnknownError", () => {
    expect(normalizeAssistantError({ data: { message: "x" } })?.name).toBe("UnknownError")
  })

  it("null/undefined/primitivos devuelven null", () => {
    expect(normalizeAssistantError(null)).toBeNull()
    expect(normalizeAssistantError(undefined)).toBeNull()
    expect(normalizeAssistantError("boom")).toBeNull()
    expect(normalizeAssistantError(42)).toBeNull()
  })
})
