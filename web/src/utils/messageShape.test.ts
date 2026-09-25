import { describe, it, expect } from "vitest"
import {
  isSubagentResultMessage,
  stripSubagentWrapper,
  parseSubagentTag,
  getSubagentResultInfo,
  sliceLastUserTurns,
} from "./messageShape"

const TAG = `<subagent sessionID="ses_abc123" state="completed" description="W4E BrowserPanel">`

function envelope(role: string, text: string, metadata?: Record<string, unknown>) {
  return {
    info: { id: "m1", role, sessionID: "s1", time: { created: 1 }, metadata },
    parts: [{ id: "p1", type: "text", text }],
  } as Parameters<typeof isSubagentResultMessage>[0]
}

describe("isSubagentResultMessage", () => {
  it("detecta por marca del server aunque el texto ya venga limpio", () => {
    expect(isSubagentResultMessage(envelope("synthetic", "## Informe", { source: "subagent" }))).toBe(true)
  })

  it("detecta por rol synthetic + etiqueta", () => {
    expect(isSubagentResultMessage(envelope("synthetic", `${TAG}\n## Informe\n</subagent>`))).toBe(true)
  })

  it("no matchea un user que mencione la etiqueta", () => {
    expect(isSubagentResultMessage(envelope("user", "qué significa <subagent> en el log?"))).toBe(false)
  })

  it("no matchea assistant normal ni synthetic sin etiqueta", () => {
    expect(isSubagentResultMessage(envelope("assistant", "hola"))).toBe(false)
    expect(isSubagentResultMessage(envelope("synthetic", "aviso neutro"))).toBe(false)
  })

  it("tolera formas rotas: null, sin info, sin parts, texto vacío", () => {
    expect(isSubagentResultMessage(null)).toBe(false)
    expect(isSubagentResultMessage(undefined)).toBe(false)
    expect(isSubagentResultMessage({ info: null, parts: null })).toBe(false)
    expect(isSubagentResultMessage(envelope("synthetic", ""))).toBe(false)
    expect(getSubagentResultInfo(null)).toBeNull()
  })

  it("un user marcado como subagente por el server sigue siendo user", () => {
    expect(isSubagentResultMessage(envelope("user", `${TAG}\n## X\n</subagent>`, { source: "subagent" }))).toBe(false)
  })

  it("matchea etiqueta en mayúsculas y extrae attrs sin importar caso", () => {
    const upper = `<SUBAGENT SESSIONID="ses_x" STATE="completed" DESCRIPTION="W">\n## X\n</SUBAGENT>`
    expect(isSubagentResultMessage(envelope("synthetic", upper))).toBe(true)
    expect(parseSubagentTag(upper)).toEqual({ sessionID: "ses_x", state: "completed", description: "W" })
    expect(stripSubagentWrapper(upper)).toBe("## X")
  })

  it("tag sin attrs también detecta y limpia", () => {
    expect(isSubagentResultMessage(envelope("synthetic", "<subagent>\n## X\n</subagent>"))).toBe(true)
    expect(parseSubagentTag("<subagent>\n## X")).toEqual({
      sessionID: undefined,
      state: undefined,
      description: undefined,
    })
  })
})

describe("stripSubagentWrapper", () => {
  it("quita apertura y cierre dejando el contenido", () => {
    expect(stripSubagentWrapper(`${TAG}\n## Informe\n</subagent>`)).toBe("## Informe")
  })

  it("quita marcas en cualquier posición (restos intra-texto o parts partidos)", () => {
    expect(stripSubagentWrapper("intro <subagent>medio</subagent> outro")).toBe("intro medio outro")
  })

  it("tolera etiqueta sin cierre", () => {
    expect(stripSubagentWrapper(`${TAG}\ntexto`)).toBe("texto")
  })

  it("devuelve intacto el texto sin marcas", () => {
    expect(stripSubagentWrapper("hola mundo")).toBe("hola mundo")
  })
})

describe("parseSubagentTag / getSubagentResultInfo", () => {
  it("extrae sessionID, state y description", () => {
    expect(parseSubagentTag(`${TAG}\nbody`)).toEqual({
      sessionID: "ses_abc123",
      state: "completed",
      description: "W4E BrowserPanel",
    })
  })

  it("devuelve null sin etiqueta", () => {
    expect(parseSubagentTag("texto plano")).toBeNull()
  })

  it("junta metadata del server con attrs del tag", () => {
    const info = getSubagentResultInfo(
      envelope("synthetic", `${TAG}\n## X\n</subagent>`, { source: "subagent", agent: "worker", childID: "ses_abc123" })
    )
    expect(info).toEqual({
      agent: "worker",
      childID: "ses_abc123",
      tag: { sessionID: "ses_abc123", state: "completed", description: "W4E BrowserPanel" },
    })
  })

  it("usa el sessionID del tag si la metadata no trae childID", () => {
    const info = getSubagentResultInfo(
      envelope("synthetic", `${TAG}\n## X\n</subagent>`, { source: "subagent" })
    )
    expect(info?.childID).toBe("ses_abc123")
  })

  it("devuelve null si no es reporte", () => {
    expect(getSubagentResultInfo(envelope("user", "hola"))).toBeNull()
  })
})

describe("sliceLastUserTurns", () => {
  it("tolera arrays vacíos o nulos", () => {
    expect(sliceLastUserTurns([])).toEqual([])
    expect(sliceLastUserTurns(null)).toEqual([])
    expect(sliceLastUserTurns(undefined)).toEqual([])
  })

  it("conserva todo si hay 3 o menos mensajes de usuario", () => {
    const list = [
      { info: { id: "sys", role: "system" } },
      { info: { id: "u1", role: "user" } },
      { info: { id: "a1", role: "assistant" } },
      { info: { id: "u2", role: "user" } },
      { info: { id: "a2", role: "assistant" } },
    ]
    expect(sliceLastUserTurns(list, 3)).toEqual(list)
  })

  it("recorta exactamente a los últimos 3 turnos de usuario con todo su contenido intermedio", () => {
    const list = [
      { info: { id: "u1", role: "user" } },
      { info: { id: "a1", role: "assistant" } },
      { info: { id: "u2", role: "user" } },
      { info: { id: "a2", role: "assistant" } },
      { info: { id: "t2", role: "tool" } },
      { info: { id: "u3", role: "user" } }, // <- 3ro desde el final
      { info: { id: "a3", role: "assistant" } },
      { info: { id: "u4", role: "user" } }, // <- 2do desde el final
      { info: { id: "a4", role: "assistant" } },
      { info: { id: "t4", role: "tool" } },
      { info: { id: "u5", role: "user" } }, // <- último
      { info: { id: "a5", role: "assistant" } },
    ]
    const res = sliceLastUserTurns(list, 3)
    expect(res.map((m) => m.info.id)).toEqual(["u3", "a3", "u4", "a4", "t4", "u5", "a5"])
    expect(res.filter((m) => m.info.role === "user")).toHaveLength(3)
  })

  it("recorta correctamente cuando la lista viene en orden descendente (más reciente primero)", () => {
    const desc = [
      { info: { id: "a5", role: "assistant", time: { created: 510 } } },
      { info: { id: "u5", role: "user", time: { created: 500 } } },
      { info: { id: "t4", role: "tool", time: { created: 420 } } },
      { info: { id: "a4", role: "assistant", time: { created: 410 } } },
      { info: { id: "u4", role: "user", time: { created: 400 } } },
      { info: { id: "a3", role: "assistant", time: { created: 310 } } },
      { info: { id: "u3", role: "user", time: { created: 300 } } },
      { info: { id: "t2", role: "tool", time: { created: 220 } } },
      { info: { id: "a2", role: "assistant", time: { created: 210 } } },
      { info: { id: "u2", role: "user", time: { created: 200 } } },
      { info: { id: "a1", role: "assistant", time: { created: 110 } } },
      { info: { id: "u1", role: "user", time: { created: 100 } } },
    ]
    const res = sliceLastUserTurns(desc, 3)
    // Debe devolver los 3 turnos más recientes en orden cronológico (u3, u4, u5)
    expect(res.map((m) => m.info.id)).toEqual(["u3", "a3", "u4", "a4", "t4", "u5", "a5"])
    expect(res.filter((m) => m.info.role === "user")).toHaveLength(3)
  })
})


