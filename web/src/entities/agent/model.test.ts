import { describe, it, expect } from "vitest"
import type {
  AgentOption,
  ModelOption,
  ProviderInfo,
  ServerProvider,
  ServerProviderList,
  CommandInfo,
  Question,
  QuestionInfo,
  QuestionOption,
  PermissionRequest,
  StatsPayload,
  StatsMeta,
  StatsTotals,
  StatsRow,
  StatsLimitRow,
  StatsPriceRow,
} from "./model.ts"
import type { ModelSelection } from "../session/model.ts"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeStatsMeta(overrides: Partial<StatsMeta> = {}): StatsMeta {
  return {
    sessions: 42,
    models: 5,
    since: "2026-01-01",
    until: "2026-01-31",
    avg_cost: 0.12,
    db: "opencode.db",
    filtered: false,
    ...overrides,
  }
}

function makeStatsTotals(overrides: Partial<StatsTotals> = {}): StatsTotals {
  return {
    input: 1000,
    output: 500,
    reasoning: 200,
    cache_read: 300,
    cache_write: 100,
    ...overrides,
  }
}

function makeStatsRow(overrides: Partial<StatsRow> = {}): StatsRow {
  return {
    sessions: 10,
    input: 100,
    output: 50,
    reasoning: 10,
    cache_read: 20,
    cache_write: 5,
    cost: 1.5,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// AgentOption
// ---------------------------------------------------------------------------
describe("AgentOption", () => {
  it("acepta un primary válido sin campos opcionales", () => {
    const a: AgentOption = { id: "agent-1", name: "Main", mode: "primary" }
    expect(a.id).toBe("agent-1")
    expect(a.mode).toBe("primary")
    expect(a.description).toBeUndefined()
    expect(a.hidden).toBeUndefined()
  })

  it("acepta todos los modos permitidos", () => {
    const modes: AgentOption["mode"][] = ["primary", "subagent", "all"]
    for (const mode of modes) {
      const a: AgentOption = { id: `id-${mode}`, name: mode, mode }
      expect(a.mode).toBe(mode)
    }
  })

  it("acepta description y hidden opcionales", () => {
    const a: AgentOption = {
      id: "x",
      name: "Hidden Agent",
      description: "desc",
      mode: "subagent",
      hidden: true,
    }
    expect(a.description).toBe("desc")
    expect(a.hidden).toBe(true)
  })

  it("permite hidden=false explícito", () => {
    const a: AgentOption = { id: "x", name: "Y", mode: "all", hidden: false }
    expect(a.hidden).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ModelSelection / ModelOption
// ---------------------------------------------------------------------------
describe("ModelSelection", () => {
  it("requiere providerID y modelID", () => {
    const m: ModelSelection = { providerID: "anthropic", modelID: "claude-3" }
    expect(m.providerID).toBe("anthropic")
    expect(m.modelID).toBe("claude-3")
    expect(m.variant).toBeUndefined()
  })

  it("acepta variant opcional", () => {
    const m: ModelSelection = { providerID: "openai", modelID: "gpt-4", variant: "turbo" }
    expect(m.variant).toBe("turbo")
  })
})

describe("ModelOption", () => {
  it("extiende ModelSelection con providerName y modelName", () => {
    const o: ModelOption = {
      providerID: "anthropic",
      modelID: "claude-3-opus",
      providerName: "Anthropic",
      modelName: "Claude 3 Opus",
    }
    expect(o.providerName).toBe("Anthropic")
    expect(o.modelName).toBe("Claude 3 Opus")
  })

  it("acepta todos los campos opcionales del catálogo", () => {
    const o: ModelOption = {
      providerID: "p1",
      modelID: "m1",
      providerName: "P1",
      modelName: "M1",
      status: "active",
      contextLimit: 200000,
      outputLimit: 4096,
      tools: true,
      attachments: false,
      isDefault: true,
    }
    expect(o.status).toBe("active")
    expect(o.contextLimit).toBe(200000)
    expect(o.outputLimit).toBe(4096)
    expect(o.tools).toBe(true)
    expect(o.attachments).toBe(false)
    expect(o.isDefault).toBe(true)
  })

  it("permite crear sin campos opcionales (solo requeridos + ModelSelection)", () => {
    const o: ModelOption = {
      providerID: "p",
      modelID: "m",
      providerName: "P",
      modelName: "M",
    }
    expect(o.contextLimit).toBeUndefined()
    expect(o.isDefault).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// ProviderInfo
// ---------------------------------------------------------------------------
describe("ProviderInfo", () => {
  it("valida shape completo", () => {
    const p: ProviderInfo = { id: "anthropic", name: "Anthropic", modelsCount: 3, connected: true }
    expect(p.id).toBe("anthropic")
    expect(p.modelsCount).toBe(3)
    expect(p.connected).toBe(true)
  })

  it("permite connected=false y modelsCount=0", () => {
    const p: ProviderInfo = { id: "openai", name: "OpenAI", modelsCount: 0, connected: false }
    expect(p.connected).toBe(false)
    expect(p.modelsCount).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// ServerProvider / ServerProviderList
// ---------------------------------------------------------------------------
describe("ServerProvider", () => {
  it("valida shape con source env y env array", () => {
    const sp: ServerProvider = {
      id: "anthropic",
      name: "Anthropic",
      source: "env",
      env: ["ANTHROPIC_API_KEY"],
      models: { "claude-3": {} },
    }
    expect(sp.source).toBe("env")
    expect(sp.env).toEqual(["ANTHROPIC_API_KEY"])
    expect(sp.key).toBeUndefined()
  })

  it("acepta todos los valores de source", () => {
    const sources: ServerProvider["source"][] = ["env", "config", "custom", "api"]
    for (const source of sources) {
      const sp: ServerProvider = { id: "x", name: "X", source, env: [], models: {} }
      expect(sp.source).toBe(source)
    }
  })

  it("acepta key opcional", () => {
    const sp: ServerProvider = {
      id: "openai",
      name: "OpenAI",
      source: "api",
      env: [],
      key: "sk-xxx",
      models: {},
    }
    expect(sp.key).toBe("sk-xxx")
  })

  it("models es Record<string, unknown> libre", () => {
    const sp: ServerProvider = {
      id: "x",
      name: "X",
      source: "custom",
      env: [],
      models: { a: { foo: 1 }, b: null, c: "str" },
    }
    expect(Object.keys(sp.models)).toEqual(["a", "b", "c"])
  })
})

describe("ServerProviderList", () => {
  it("valida shape con all/default/connected", () => {
    const list: ServerProviderList = {
      all: [],
      default: { anthropic: "claude-3" },
      connected: ["anthropic"],
    }
    expect(list.all).toEqual([])
    expect(list.default["anthropic"]).toBe("claude-3")
    expect(list.connected).toContain("anthropic")
  })

  it("all puede contener múltiples ServerProvider", () => {
    const list: ServerProviderList = {
      all: [
        { id: "a", name: "A", source: "env", env: [], models: {} },
        { id: "b", name: "B", source: "config", env: ["X"], models: { m: {} } },
      ],
      default: {},
      connected: [],
    }
    expect(list.all).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// CommandInfo
// ---------------------------------------------------------------------------
describe("CommandInfo", () => {
  it("requiere solo name", () => {
    const c: CommandInfo = { name: "/help" }
    expect(c.name).toBe("/help")
    expect(c.description).toBeUndefined()
    expect(c.source).toBeUndefined()
  })

  it("acepta description y source", () => {
    const c: CommandInfo = { name: "/plan", description: "Plan mode", source: "skill" }
    expect(c.source).toBe("skill")
  })

  it("acepta todos los source permitidos", () => {
    const sources: NonNullable<CommandInfo["source"]>[] = ["command", "mcp", "skill"]
    for (const source of sources) {
      const c: CommandInfo = { name: "x", source }
      expect(c.source).toBe(source)
    }
  })
})

// ---------------------------------------------------------------------------
// Question
// ---------------------------------------------------------------------------
describe("QuestionOption", () => {
  it("requiere label y permite description", () => {
    const o: QuestionOption = { label: "Yes" }
    expect(o.label).toBe("Yes")
    const o2: QuestionOption = { label: "No", description: "Reject" }
    expect(o2.description).toBe("Reject")
  })
})

describe("QuestionInfo", () => {
  it("valida shape con opciones", () => {
    const qi: QuestionInfo = {
      question: "¿Continuar?",
      options: [{ label: "Sí" }, { label: "No" }],
    }
    expect(qi.question).toBe("¿Continuar?")
    expect(qi.options).toHaveLength(2)
    expect(qi.header).toBeUndefined()
    expect(qi.multiple).toBeUndefined()
    expect(qi.custom).toBeUndefined()
  })

  it("acepta header, multiple y custom", () => {
    const qi: QuestionInfo = {
      question: "Q",
      header: "Header",
      options: [],
      multiple: true,
      custom: true,
    }
    expect(qi.header).toBe("Header")
    expect(qi.multiple).toBe(true)
    expect(qi.custom).toBe(true)
  })
})

describe("Question", () => {
  it("requiere solo id", () => {
    const q: Question = { id: "q1" }
    expect(q.id).toBe("q1")
    expect(q.sessionID).toBeUndefined()
    expect(q.questions).toBeUndefined()
  })

  it("acepta shape completo con nested questions y tool", () => {
    const q: Question = {
      id: "q2",
      sessionID: "sess-1",
      status: "pending",
      question: "Main?",
      questions: [{ question: "Sub?", options: [{ label: "A" }] }],
      tool: { messageID: "m1", callID: "c1" },
    }
    expect(q.tool?.callID).toBe("c1")
    expect(q.questions?.[0].options).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// PermissionRequest
// ---------------------------------------------------------------------------
describe("PermissionRequest", () => {
  it("valida shape mínimo", () => {
    const p: PermissionRequest = { requestID: "r1", permission: "write", status: "pending" }
    expect(p.requestID).toBe("r1")
    expect(p.permission).toBe("write")
    expect(p.status).toBe("pending")
  })

  it("acepta directory y sessionID opcionales", () => {
    const p: PermissionRequest = {
      requestID: "r2",
      permission: "read",
      status: "approved",
      directory: "/tmp",
      sessionID: "sess-1",
    }
    expect(p.directory).toBe("/tmp")
    expect(p.sessionID).toBe("sess-1")
  })
})

// ---------------------------------------------------------------------------
// Stats types
// ---------------------------------------------------------------------------
describe("StatsMeta", () => {
  it("valida shape", () => {
    const m = makeStatsMeta()
    expect(m.sessions).toBe(42)
    expect(m.filtered).toBe(false)
    expect(typeof m.since).toBe("string")
    expect(typeof m.until).toBe("string")
  })
})

describe("StatsTotals", () => {
  it("valida shape con todos los contadores", () => {
    const t = makeStatsTotals()
    expect(t.input).toBe(1000)
    expect(t.output).toBe(500)
    expect(t.reasoning).toBe(200)
    expect(t.cache_read).toBe(300)
    expect(t.cache_write).toBe(100)
  })
})

describe("StatsRow", () => {
  it("requiere sessions/input/output/reasoning/cache_read/cache_write/cost", () => {
    const r = makeStatsRow()
    expect(r.sessions).toBe(10)
    expect(r.cost).toBe(1.5)
  })

  it("acepta campos opcionales key/model/id/title/start/requests/est", () => {
    const r = makeStatsRow({
      key: "k1",
      model: "claude-3",
      id: "id1",
      title: "Project",
      start: "2026-01-01",
      requests: 5,
      est: 0.9,
    })
    expect(r.key).toBe("k1")
    expect(r.requests).toBe(5)
    expect(r.est).toBe(0.9)
  })
})

describe("StatsLimitRow", () => {
  it("valida con limits null", () => {
    const row: StatsLimitRow = { model: "claude", u5h: 10, u7d: 20, u30d: 30, l5h: null, l7d: null, l30d: null }
    expect(row.l5h).toBeNull()
    expect(row.u5h).toBe(10)
  })

  it("valida con limits numéricos", () => {
    const row: StatsLimitRow = { model: "gpt-4", u5h: 1, u7d: 2, u30d: 3, l5h: 100, l7d: 200, l30d: 300 }
    expect(row.l5h).toBe(100)
    expect(row.l30d).toBe(300)
  })
})

describe("StatsPriceRow", () => {
  it("valida shape", () => {
    const row: StatsPriceRow = { model: "claude-3", in: 3, out: 15, cr: 0.3, cw: 3.75 }
    expect(row.model).toBe("claude-3")
    expect(row.in).toBe(3)
    expect(row.cr).toBe(0.3)
  })
})

describe("StatsPayload", () => {
  it("valida payload completo con todas las colecciones", () => {
    const payload: StatsPayload = {
      meta: makeStatsMeta(),
      totals: makeStatsTotals(),
      cost: 99.5,
      est_total: 100.0,
      stats: {
        mas_cara: { cost: 10, title: "Expensive", model: "claude" },
        mas_tokens: { title: "Big", model: "gpt-4" },
        input_medio: 500,
      },
      days: [{ day: "2026-01-01", cost: 5 }],
      models_chart: [{ model: "claude", cost: 10 }],
      by_model: [makeStatsRow({ model: "claude" })],
      by_project: [makeStatsRow({ title: "proj" })],
      by_day: [makeStatsRow({ start: "2026-01-01" })],
      by_month: [makeStatsRow()],
      sessions: [makeStatsRow({ id: "sess-1" })],
      limits: [{ model: "claude", u5h: 1, u7d: 2, u30d: 3, l5h: null, l7d: null, l30d: null }],
      prices: [{ model: "claude", in: 3, out: 15, cr: 0.3, cw: 3.75 }],
    }
    expect(payload.meta.sessions).toBe(42)
    expect(payload.totals.input).toBe(1000)
    expect(payload.cost).toBe(99.5)
    expect(payload.stats.mas_cara.cost).toBe(10)
    expect(payload.days).toHaveLength(1)
    expect(payload.models_chart).toHaveLength(1)
    expect(payload.by_model).toHaveLength(1)
    expect(payload.limits[0].model).toBe("claude")
    expect(payload.prices[0].in).toBe(3)
  })

  it("permite arrays vacíos (payload sin datos)", () => {
    const payload: StatsPayload = {
      meta: makeStatsMeta({ sessions: 0 }),
      totals: makeStatsTotals({ input: 0, output: 0, reasoning: 0, cache_read: 0, cache_write: 0 }),
      cost: 0,
      est_total: 0,
      stats: {
        mas_cara: { cost: 0, title: "", model: "" },
        mas_tokens: { title: "", model: "" },
        input_medio: 0,
      },
      days: [],
      models_chart: [],
      by_model: [],
      by_project: [],
      by_day: [],
      by_month: [],
      sessions: [],
      limits: [],
      prices: [],
    }
    expect(payload.days).toEqual([])
    expect(payload.by_model).toEqual([])
    expect(payload.cost).toBe(0)
  })

  it("tolera filtered=true en meta", () => {
    const payload: StatsPayload = {
      meta: makeStatsMeta({ filtered: true }),
      totals: makeStatsTotals(),
      cost: 1,
      est_total: 1,
      stats: { mas_cara: { cost: 1, title: "a", model: "m" }, mas_tokens: { title: "a", model: "m" }, input_medio: 1 },
      days: [],
      models_chart: [],
      by_model: [],
      by_project: [],
      by_day: [],
      by_month: [],
      sessions: [],
      limits: [],
      prices: [],
    }
    expect(payload.meta.filtered).toBe(true)
  })
})
