import { describe, it, expect } from "vitest"
import { findDeliveredEcho } from "./messageShape"
import type { MessageEnvelope } from "../types"

const NOW = 1_700_000_000_000

function user(text: string, created: number): MessageEnvelope {
  return {
    info: { id: `u-${created}-${text}`, role: "user", sessionID: "s1", time: { created } },
    parts: [{ id: `p-${created}`, type: "text", text }],
  } as unknown as MessageEnvelope
}

function assistant(text: string, created: number): MessageEnvelope {
  return {
    info: { id: `a-${created}`, role: "assistant", sessionID: "s1", time: { created } },
    parts: [{ id: `ap-${created}`, type: "text", text }],
  } as unknown as MessageEnvelope
}

describe("findDeliveredEcho (POST falló en el cliente pero el server lo recibió)", () => {
  it("encuentra el eco user reciente con el mismo texto", () => {
    const echo = findDeliveredEcho([user("hola mundo", NOW - 1_000)], "hola mundo", NOW - 600_000)
    expect(echo?.info.id).toBe(`u-${NOW - 1_000}-hola mundo`)
  })

  it("acepta texto con espacios de más (trim en ambos lados)", () => {
    expect(findDeliveredEcho([user("hola", NOW - 1_000)], "   hola   ", NOW - 600_000)).not.toBeNull()
  })

  it("ignora ecos fuera de la ventana (mismo texto de hace 1 hora)", () => {
    expect(findDeliveredEcho([user("hola", NOW - 3_600_000)], "hola", NOW - 600_000)).toBeNull()
  })

  it("no matchea mensajes del asistente ni textos distintos", () => {
    expect(findDeliveredEcho([assistant("hola", NOW - 1_000)], "hola", NOW - 600_000)).toBeNull()
    expect(findDeliveredEcho([user("chau", NOW - 1_000)], "hola", NOW - 600_000)).toBeNull()
  })

  it("acepta lista vacía o undefined sin lanzar", () => {
    expect(findDeliveredEcho(undefined, "hola", NOW)).toBeNull()
    expect(findDeliveredEcho([], "hola", NOW)).toBeNull()
    expect(findDeliveredEcho([user("hola", NOW - 1_000)], "", NOW - 600_000)).toBeNull()
  })

  it("prefiere el eco más reciente cuando hay varios iguales", () => {
    const list = [user("repetido", NOW - 500_000), user("repetido", NOW - 1_000)]
    expect(findDeliveredEcho(list, "repetido", NOW - 600_000)?.info.id).toBe(`u-${NOW - 1_000}-repetido`)
  })

  it("borde: un eco exactamente en `since` se acepta (>=)", () => {
    expect(findDeliveredEcho([user("borde", NOW - 600_000)], "borde", NOW - 600_000)).not.toBeNull()
    expect(findDeliveredEcho([user("borde", NOW - 600_001)], "borde", NOW - 600_000)).toBeNull()
  })

  it("eco multi-part (messageText une con \\n\\n) matchea el texto original", () => {
    const multi = {
      info: { id: "u-multi", role: "user", sessionID: "s1", time: { created: NOW - 1_000 } },
      parts: [
        { id: "p1", type: "text", text: "parte uno" },
        { id: "p2", type: "text", text: "parte dos" },
      ],
    } as unknown as MessageEnvelope
    expect(findDeliveredEcho([multi], "parte uno\n\nparte dos", NOW - 600_000)).not.toBeNull()
  })

  it("mensaje sin time.created no matchea (falso negativo seguro)", () => {
    const sinTime = {
      info: { id: "u-x", role: "user", sessionID: "s1" },
      parts: [{ id: "px", type: "text", text: "hola" }],
    } as unknown as MessageEnvelope
    expect(findDeliveredEcho([sinTime], "hola", NOW - 600_000)).toBeNull()
  })
})
