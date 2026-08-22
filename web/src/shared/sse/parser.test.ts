import { describe, it, expect } from "vitest"
import { createSSEFrameParser } from "./parser"

// Fixtures del dialecto opencode:
// - v1: el type real va DENTRO del JSON {id,type,properties}; en /event solo
//   fluyen message.part.delta (+ heartbeats).
// - v2: session.next.* con body anidado en properties.data.
const v1Delta = (delta: string, id = "evt_1") =>
  `data: {"id":"${id}","type":"message.part.delta","properties":{"sessionID":"s1","messageID":"m1","partID":"p1","delta":"${delta}"}}\n\n`

const v2TextDelta = (delta: string) =>
  `data: {"type":"session.next.text.delta","properties":{"data":{"sessionID":"s1","assistantMessageID":"m2","textID":"t1","delta":"${delta}"}}}\n\n`

describe("createSSEFrameParser", () => {
  it("v1: message.part.delta completo → un frame con type interno y properties", () => {
    const parse = createSSEFrameParser()
    const frames = parse(v1Delta("Hola"))
    expect(frames).toHaveLength(1)
    expect(frames[0].id).toBe("evt_1")
    expect(frames[0].type).toBe("message.part.delta")
    expect(frames[0].properties).toEqual({
      sessionID: "s1", messageID: "m1", partID: "p1", delta: "Hola",
    })
  })

  it("v2: session.next.text.delta anida el payload en properties.data", () => {
    const parse = createSSEFrameParser()
    const frames = parse(v2TextDelta(" mundo"))
    expect(frames).toHaveLength(1)
    expect(frames[0].type).toBe("session.next.text.delta")
    const data = (frames[0].properties as { data?: Record<string, unknown> }).data
    expect(data?.delta).toBe(" mundo")
    expect(data?.sessionID).toBe("s1")
  })

  it("varios frames en un chunk → orden preservado", () => {
    const parse = createSSEFrameParser()
    const frames = parse(v1Delta("a", "e1") + v1Delta("b", "e2") + v1Delta("c", "e3"))
    expect(frames.map((f) => f.id)).toEqual(["e1", "e2", "e3"])
  })

  it("frame cortado a mitad por TCP: se completa cuando llega el resto", () => {
    const parse = createSSEFrameParser()
    const full = v1Delta("Hola")
    const cut = Math.floor(full.length / 2)
    expect(parse(full.slice(0, cut))).toHaveLength(0)
    const frames = parse(full.slice(cut))
    expect(frames).toHaveLength(1)
    expect((frames[0].properties as { delta?: string }).delta).toBe("Hola")
  })

  it("corte byte a byte (peor caso de fragmentación)", () => {
    const parse = createSSEFrameParser()
    const full = v2TextDelta("xyz")
    const collected: unknown[] = []
    for (const ch of full) collected.push(...parse(ch))
    expect(collected).toHaveLength(1)
    expect((collected[0] as { type?: string }).type).toBe("session.next.text.delta")
  })

  it("múltiples líneas data dentro de un frame: la última pisa properties", () => {
    // SSE permite varias líneas data que se concatenan; el parser original
    // pisaba properties — mantener esa semántica (opencode nunca lo emite).
    const parse = createSSEFrameParser()
    const frames = parse(
      'data: {"type":"a"}\ndata: {"type":"message.part.updated"}\n\n',
    )
    expect(frames).toHaveLength(1)
    expect(frames[0].type).toBe("message.part.updated")
  })

  it("línea event: provee type cuando el JSON no trae type propio", () => {
    const parse = createSSEFrameParser()
    const frames = parse('event: server.heartbeat\ndata: {"ts":123}\n\n')
    expect(frames).toHaveLength(1)
    expect(frames[0].type).toBe("server.heartbeat")
    expect(frames[0].properties).toEqual({ ts: 123 })
  })

  it("el type DENTRO del JSON gana sobre la línea event:", () => {
    const parse = createSSEFrameParser()
    const frames = parse(
      'event: message\ndata: {"type":"session.status","properties":{"status":{"type":"idle"}}}\n\n',
    )
    expect(frames[0].type).toBe("session.status")
  })

  it("JSON inválido → frame con properties.raw (no explota)", () => {
    const parse = createSSEFrameParser()
    const frames = parse("event: x\ndata: {not-json\n\n")
    expect(frames).toHaveLength(1)
    expect(frames[0].type).toBe("x")
    expect(frames[0].properties).toEqual({ raw: "{not-json" })
  })

  it("comentario : ping se ignora; línea vacía sin type no emite nada", () => {
    const parse = createSSEFrameParser()
    expect(parse(": ping\n\n")).toHaveLength(0)
    expect(parse("\n\n\n")).toHaveLength(0)
  })

  it("CRLF: \\r final se elimina antes de matchear prefijos", () => {
    const parse = createSSEFrameParser()
    const frames = parse(v1Delta("ok").replace(/\n/g, "\r\n"))
    expect(frames).toHaveLength(1)
    expect(frames[0].type).toBe("message.part.delta")
  })

  it("sin type en ninguna parte (data JSON sin type, sin event:) → no emite", () => {
    const parse = createSSEFrameParser()
    expect(parse('data: {"foo":1}\n\n')).toHaveLength(0)
  })

  it("frame sin línea en blanco final queda pendiente hasta el próximo chunk", () => {
    const parse = createSSEFrameParser()
    expect(parse('data: {"type":"message.part.delta","properties":{}}\n')).toHaveLength(0)
    const frames = parse("\n")
    expect(frames).toHaveLength(1)
  })

  it("chunk vacío drena solo lo completo (flush de cierre de conexión)", () => {
    const parse = createSSEFrameParser()
    parse(v1Delta("x"))
    expect(parse("")).toHaveLength(0)
  })

  it("propiedades sin key properties: el objeto entero se vuelve properties", () => {
    const parse = createSSEFrameParser()
    const frames = parse('data: {"type":"session.error","sessionID":"s9","message":"boom"}\n\n')
    expect(frames[0].properties).toEqual({
      type: "session.error", sessionID: "s9", message: "boom",
    })
  })

  it("secuencia realista v1: heartbeat + delta + part.updated + status idle", () => {
    const parse = createSSEFrameParser()
    const stream = [
      'data: {"type":"server.heartbeat"}\n\n',
      v1Delta("Ho"),
      v1Delta("la", "evt_2"),
      'data: {"type":"message.part.updated","properties":{"part":{"id":"p1","type":"text","text":"Hola"}}}\n\n',
      'data: {"type":"session.status","properties":{"sessionID":"s1","status":{"type":"idle"}}}\n\n',
    ].join("")
    const frames = parse(stream)
    expect(frames.map((f) => f.type)).toEqual([
      "server.heartbeat",
      "message.part.delta",
      "message.part.delta",
      "message.part.updated",
      "session.status",
    ])
  })

  it("secuencia realista v2: text.delta + reasoning.delta + ended + step.finished", () => {
    const parse = createSSEFrameParser()
    const nested = (type: string, extra: Record<string, unknown>) =>
      `data: {"type":"${type}","properties":{"data":${JSON.stringify({ sessionID: "s2", ...extra })}}}\n\n`
    const frames = parse(
      nested("session.next.text.delta", { assistantMessageID: "ma", textID: "t1", delta: "A" }) +
      nested("session.next.reasoning.delta", { assistantMessageID: "ma", reasoningID: "r1", delta: "R" }) +
      nested("session.next.text.ended", { assistantMessageID: "ma", textID: "t1" }) +
      'data: {"type":"session.next.step.finished","properties":{"data":{"sessionID":"s2"}}}\n\n',
    )
    expect(frames.map((f) => f.type)).toEqual([
      "session.next.text.delta",
      "session.next.reasoning.delta",
      "session.next.text.ended",
      "session.next.step.finished",
    ])
  })

  it("prefijo estricto: 'data:' sin espacio NO matchea (semántica del server actual)", () => {
    const parse = createSSEFrameParser()
    expect(parse('data:{"type":"x"}\n\n')).toHaveLength(0)
  })
})
