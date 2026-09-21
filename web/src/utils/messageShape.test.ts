import { describe, it, expect } from "vitest"
import {
  isSubagentResultMessage,
  stripSubagentWrapper,
  parseSubagentTag,
  getSubagentResultInfo,
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
