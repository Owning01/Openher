import { computeRenderedMessages } from "./utils/rendered.ts"

let n = 0
function msg(role, text, extra = {}) {
  n++
  return {
    info: { id: `msg_${n}`, role, sessionID: "s1", time: { created: n }, ...extra },
    parts: [{ id: `part_${n}`, type: "text", text }],
  }
}

function assert(cond, label) {
  if (!cond) { console.error("FAIL:", label); process.exit(1) }
}

// 3 mensajes: user + assistant (texto) + assistant streamed
let user = msg("user", "hola")
let a1 = msg("assistant", "primera")
let a2 = msg("assistant", "seg")
const all = [user, a1, a2]

let cache = new Map()
const r1 = computeRenderedMessages(all, "full", cache)
assert(r1.out.length === 3, "3 mensajes visibles")
cache = r1.cache

// Delta sobre a2: nueva referencia solo para a2 (inmutabilidad del caller)
a2 = { ...a2, parts: [{ id: a2.parts[0].id, type: "text", text: "segunda" }] }
const all2 = [user, a1, a2]
const r2 = computeRenderedMessages(all2, "full", cache)
cache = r2.cache

assert(r2.out.length === 3, "sigue 3 mensajes")
assert(r2.out[0] === r1.out[0], "user: misma referencia (no re-renderiza)")
assert(r2.out[1] === r1.out[1], "assistant sin cambios: misma referencia")
assert(r2.out[2] !== r1.out[2], "assistant streamed: referencia NUEVA (solo él re-renderiza)")
assert(r2.out[2].text === "segunda", "texto del delta aplicado")

// Otro delta idéntico: mismo objeto que r2 (no recrear)
const r3 = computeRenderedMessages(all2, "full", cache)
assert(r3.out[2] === r2.out[2], "delta idéntico: reusa el RenderedMessage")

// Cambio de diffs del turno invalida el ÚLTIMO assistant (donde se muestran)
const withDiffs = { ...user, info: { ...user.info, summary: { diffs: [{ path: "a.ts", additions: 1, deletions: 0 }] } } }
const all4 = [withDiffs, a1, a2]
const r4 = computeRenderedMessages(all4, "full", cache)
assert(r4.out[2] !== r2.out[2], "diff nuevo: último assistant se invalida")
assert(r4.out[2].summaryDiffs?.length === 1, "summaryDiffs del turno aplicado")
assert(r4.out[0] !== r2.out[0], "user con diffs nuevos: re-render")
assert(r4.out[1] === r2.out[1], "assistant sin diffs: reusa caché")

// Cambio de dataMode invalida todo
const r5 = computeRenderedMessages(all2, "saver", cache)
assert(r5.out[0] !== r2.out[0], "dataMode distinto: invalida todo")

// Mensaje oculto (part de texto vacío): no entra ni se cachea
const hidden = { info: { id: "msg_hidden", role: "assistant", sessionID: "s1", time: { created: 99 } }, parts: [{ id: "p_hidden", type: "text", text: "" }] }
const all6 = [...all2, hidden]
const r6 = computeRenderedMessages(all6, "full", cache)
assert(r6.out.length === 3, "mensaje sin contenido no se renderiza")
assert(!r6.cache.has("msg_hidden"), "mensaje oculto no se cachea")

console.log("rendered cache tests passed")
