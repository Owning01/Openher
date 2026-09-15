import { describe, it, expect } from "vitest"
import { messageAuthorFrom } from "./author"
import { toMessageEnvelopeV1 } from "../../shared/api/mappers"

describe("messageAuthorFrom", () => {
  it("null sin metadata", () => {
    expect(messageAuthorFrom({ id: "a", role: "user", sessionID: "s", time: { created: 1 } })).toBeNull()
  })

  it("devuelve el nombre marcado por otro agente", () => {
    expect(
      messageAuthorFrom({
        id: "a", role: "user", sessionID: "s", time: { created: 1 },
        metadata: { from: "agente-flutter", kind: "agent" },
      }),
    ).toBe("agente-flutter")
  })

  it("ignora from vacío o no-string", () => {
    expect(
      messageAuthorFrom({ id: "a", role: "user", sessionID: "s", time: { created: 1 }, metadata: { from: "  " } }),
    ).toBeNull()
    expect(
      messageAuthorFrom({ id: "a", role: "user", sessionID: "s", time: { created: 1 }, metadata: { from: 42 } }),
    ).toBeNull()
  })
})

describe("toMessageEnvelopeV1 metadata", () => {
  it("conserva metadata del server (from de otro agente)", () => {
    const out = toMessageEnvelopeV1({
      id: "m1", type: "user", text: "hola", metadata: { from: "agente-x", kind: "agent" },
    } as never)
    expect(out.info.metadata).toEqual({ from: "agente-x", kind: "agent" })
  })

  it("sin metadata queda undefined", () => {
    const out = toMessageEnvelopeV1({ id: "m2", type: "user", text: "hola" } as never)
    expect(out.info.metadata).toBeUndefined()
  })
})
