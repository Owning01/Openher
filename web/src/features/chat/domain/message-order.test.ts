import { describe, expect, it } from "vitest"
import { keepMessagesBefore, keepMessagesThrough } from "./message-order"

describe("keepMessagesThrough", () => {
  it("usa el orden del historial y no el orden lexicográfico de ids", () => {
    const messages = ["m9", "m10", "m2"].map((id) => ({ info: { id, sessionID: "s1" } }))
    expect(keepMessagesThrough(messages, "s1", "m10").map((m) => m.info.id)).toEqual(["m9", "m10"])
  })

  it("no corta si el objetivo no pertenece al historial", () => {
    const messages = [{ info: { id: "m1", sessionID: "s1" } }]
    expect(keepMessagesThrough(messages, "s1", "missing")).toEqual(messages)
  })
})

describe("keepMessagesBefore", () => {
  it("excluye el mensaje objetivo y todos los posteriores", () => {
    const messages = ["m9", "m10", "m2"].map((id) => ({ info: { id, sessionID: "s1" } }))
    expect(keepMessagesBefore(messages, "s1", "m10").map((m) => m.info.id)).toEqual(["m9"])
  })

  it("no corta si el objetivo no pertenece al historial", () => {
    const messages = [{ info: { id: "m1", sessionID: "s1" } }]
    expect(keepMessagesBefore(messages, "s1", "missing")).toEqual(messages)
  })
})
