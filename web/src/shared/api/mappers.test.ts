import { describe, it, expect } from "vitest"
import {
  mapProviderModels,
  toAgentOption,
  toModelBody,
  toCreateSessionModel,
  modelWireName,
  toSessionV1,
  toMessageEnvelopeV1,
} from "./mappers"
import type { ConfigProvidersResponse, AgentResponse, V2Session, V2Message } from "./mappers"

// ---------------------------------------------------------------------------
// mapProviderModels
// ---------------------------------------------------------------------------
describe("mapProviderModels", () => {
  it("mapea un provider con un modelo básico", () => {
    const res: ConfigProvidersResponse = {
      providers: [
        {
          id: "openai",
          name: "OpenAI",
          models: {
            "gpt-4": {
              id: "gpt-4",
              name: "GPT-4",
              status: "active",
              capabilities: { attachment: true, toolcall: true },
              limit: { context: 128000, output: 4096 },
            },
          },
        },
      ],
      default: { openai: "gpt-4" },
    }
    const out = mapProviderModels(res)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      providerID: "openai",
      providerName: "OpenAI",
      modelID: "gpt-4",
      modelName: "GPT-4",
      status: "active",
      contextLimit: 128000,
      outputLimit: 4096,
      tools: true,
      attachments: true,
      isDefault: true,
    })
  })

  it("mapea múltiples providers y múltiples modelos", () => {
    const res: ConfigProvidersResponse = {
      providers: [
        { id: "openai", name: "OpenAI", models: { "gpt-4": {}, "gpt-3.5": {} } },
        { id: "anthropic", name: "Anthropic", models: { "claude-3": {} } },
      ],
    }
    const out = mapProviderModels(res)
    expect(out).toHaveLength(3)
    expect(out.map((m) => m.providerID)).toEqual(["openai", "openai", "anthropic"])
  })

  it("genera entrada base + variantes cuando hay variants", () => {
    const res: ConfigProvidersResponse = {
      providers: [
        {
          id: "google",
          name: "Google",
          models: {
            gemini: {
              name: "Gemini",
              variants: { thinking: {}, fast: {} },
            },
          },
        },
      ],
    }
    const out = mapProviderModels(res)
    // base + 2 variants
    expect(out).toHaveLength(3)
    expect(out[0].modelID).toBe("gemini")
    expect(out[0].variant).toBeUndefined()
    expect(out[1]).toMatchObject({ variant: "thinking" })
    expect(out[2]).toMatchObject({ variant: "fast" })
  })

  it("las variantes tienen isDefault=false aunque el base sea default", () => {
    const res: ConfigProvidersResponse = {
      providers: [
        {
          id: "p",
          name: "P",
          models: {
            m1: { variants: { v1: {} } },
          },
        },
      ],
      default: { p: "m1" },
    }
    const out = mapProviderModels(res)
    expect(out[0].isDefault).toBe(true)
    expect(out[1].isDefault).toBe(false)
  })

  it("marca isDefault solo para el modelID que coincide con default", () => {
    const res: ConfigProvidersResponse = {
      providers: [
        {
          id: "p",
          name: "P",
          models: { a: {}, b: {} },
        },
      ],
      default: { p: "b" },
    }
    const out = mapProviderModels(res)
    expect(out.find((m) => m.modelID === "a")!.isDefault).toBe(false)
    expect(out.find((m) => m.modelID === "b")!.isDefault).toBe(true)
  })

  it("propaga status cuando existe", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: { m: { status: "beta" } } }],
    }
    expect(mapProviderModels(res)[0].status).toBe("beta")
  })

  it("status es undefined cuando no se provee", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: { m: {} } }],
    }
    expect(mapProviderModels(res)[0].status).toBeUndefined()
  })

  it("attachments true cuando capabilities.attachment=true", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: { m: { capabilities: { attachment: true } } } }],
    }
    expect(mapProviderModels(res)[0].attachments).toBe(true)
  })

  it("attachments false cuando capabilities es undefined", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: { m: {} } }],
    }
    expect(mapProviderModels(res)[0].attachments).toBe(false)
  })

  it("tools true via capabilities.toolcall", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: { m: { capabilities: { toolcall: true } } } }],
    }
    expect(mapProviderModels(res)[0].tools).toBe(true)
  })

  it("tools true via capabilities.tools", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: { m: { capabilities: { tools: true } } } }],
    }
    expect(mapProviderModels(res)[0].tools).toBe(true)
  })

  it("tools false cuando capabilities no tiene toolcall ni tools", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: { m: { capabilities: {} } } }],
    }
    expect(mapProviderModels(res)[0].tools).toBe(false)
  })

  it("mapea limit context y output correctamente", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: { m: { limit: { context: 8000, output: 1000 } } } }],
    }
    expect(mapProviderModels(res)[0]).toMatchObject({ contextLimit: 8000, outputLimit: 1000 })
  })

  it("limit undefined cuando no se provee", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: { m: {} } }],
    }
    expect(mapProviderModels(res)[0].contextLimit).toBeUndefined()
    expect(mapProviderModels(res)[0].outputLimit).toBeUndefined()
  })

  it("name fallback: usa model.name, luego model.id, luego key", () => {
    const res: ConfigProvidersResponse = {
      providers: [
        {
          id: "p",
          name: "P",
          models: {
            keyA: { id: "real-id", name: "Pretty" },
            keyB: { id: "real-id-2" },
            keyC: {},
          },
        },
      ],
    }
    const out = mapProviderModels(res)
    expect(out.find((m) => m.modelID === "real-id")!.modelName).toBe("Pretty")
    expect(out.find((m) => m.modelID === "real-id-2")!.modelName).toBe("real-id-2")
    expect(out.find((m) => m.modelID === "keyC")!.modelName).toBe("keyC")
  })

  it("modelID fallback a key cuando id es undefined", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: { myKey: {} } }],
    }
    expect(mapProviderModels(res)[0].modelID).toBe("myKey")
  })

  it("providerName fallback a provider.id cuando name es vacío", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "prov", name: "", models: { m: {} } }],
    }
    expect(mapProviderModels(res)[0].providerName).toBe("prov")
  })

  it("retorna array vacío cuando providers está vacío", () => {
    const res: ConfigProvidersResponse = { providers: [] }
    expect(mapProviderModels(res)).toEqual([])
  })

  it("retorna array vacío cuando provider no tiene modelos", () => {
    const res: ConfigProvidersResponse = {
      providers: [{ id: "p", name: "P", models: {} }],
    }
    expect(mapProviderModels(res)).toEqual([])
  })

  it("hereda context/attachment/tools en variantes (spread de base)", () => {
    const res: ConfigProvidersResponse = {
      providers: [
        {
          id: "p",
          name: "P",
          models: {
            m: {
              capabilities: { attachment: true, tools: true },
              limit: { context: 500 },
              variants: { v: {} },
            },
          },
        },
      ],
    }
    const out = mapProviderModels(res)
    expect(out[1]).toMatchObject({ attachments: true, tools: true, contextLimit: 500 })
  })
})

// ---------------------------------------------------------------------------
// toAgentOption
// ---------------------------------------------------------------------------
describe("toAgentOption", () => {
  it("usa id cuando está presente", () => {
    const agent: AgentResponse[number] = { id: "agent-1", name: "Agent One", mode: "primary" }
    const out = toAgentOption(agent)
    expect(out.id).toBe("agent-1")
    expect(out.name).toBe("Agent One")
  })

  it("fallback a name cuando id es faltante", () => {
    const agent: AgentResponse[number] = { name: "my-agent", mode: "subagent" }
    const out = toAgentOption(agent)
    expect(out.id).toBe("my-agent")
    expect(out.name).toBe("my-agent")
  })

  it("fallback a string vacío cuando id y name faltan", () => {
    const agent: AgentResponse[number] = { mode: "all" }
    const out = toAgentOption(agent)
    expect(out.id).toBe("")
    expect(out.name).toBe("")
  })

  it("name fallback a id cuando name es undefined", () => {
    const agent: AgentResponse[number] = { id: "only-id", mode: "primary" }
    expect(toAgentOption(agent).name).toBe("only-id")
  })

  it("preserva description, hidden y mode", () => {
    const agent: AgentResponse[number] = {
      id: "a",
      name: "A",
      description: "desc",
      mode: "primary",
      hidden: true,
    }
    const out = toAgentOption(agent)
    expect(out.description).toBe("desc")
    expect(out.hidden).toBe(true)
    expect(out.mode).toBe("primary")
  })

  it("hidden es undefined cuando no se provee", () => {
    const agent: AgentResponse[number] = { id: "a", mode: "all" }
    expect(toAgentOption(agent).hidden).toBeUndefined()
  })

  it("hidden false se preserva", () => {
    const agent: AgentResponse[number] = { id: "a", mode: "subagent", hidden: false }
    expect(toAgentOption(agent).hidden).toBe(false)
  })

  it("mapea mode subagent correctamente", () => {
    const agent: AgentResponse[number] = { id: "x", mode: "subagent" }
    expect(toAgentOption(agent).mode).toBe("subagent")
  })
})

// ---------------------------------------------------------------------------
// toModelBody / toCreateSessionModel / modelWireName
// ---------------------------------------------------------------------------
describe("toModelBody", () => {
  it("retorna providerID y modelID", () => {
    expect(toModelBody({ providerID: "openai", modelID: "gpt-4" })).toEqual({
      providerID: "openai",
      modelID: "gpt-4",
    })
  })

  it("retorna undefined cuando no hay modelo", () => {
    expect(toModelBody(undefined)).toBeUndefined()
  })

  it("ignora variant", () => {
    expect(toModelBody({ providerID: "p", modelID: "m", variant: "v" })).toEqual({
      providerID: "p",
      modelID: "m",
    })
  })
})

describe("toCreateSessionModel", () => {
  it("retorna providerID, id y variant", () => {
    expect(
      toCreateSessionModel({ providerID: "anthropic", modelID: "claude", variant: "thinking" }),
    ).toEqual({ providerID: "anthropic", id: "claude", variant: "thinking" })
  })

  it("variant es undefined cuando no se provee", () => {
    expect(toCreateSessionModel({ providerID: "p", modelID: "m" })).toEqual({
      providerID: "p",
      id: "m",
      variant: undefined,
    })
  })

  it("variant string vacío se convierte a undefined", () => {
    expect(toCreateSessionModel({ providerID: "p", modelID: "m", variant: "" })).toEqual({
      providerID: "p",
      id: "m",
      variant: undefined,
    })
  })

  it("retorna undefined cuando no hay modelo", () => {
    expect(toCreateSessionModel(undefined)).toBeUndefined()
  })
})

describe("modelWireName", () => {
  it("retorna providerID/modelID", () => {
    expect(modelWireName({ providerID: "openai", modelID: "gpt-4" })).toBe("openai/gpt-4")
  })

  it("ignora variant si existe", () => {
    expect(modelWireName({ providerID: "p", modelID: "m", variant: "v" })).toBe("p/m")
  })

  it("retorna undefined cuando no hay modelo", () => {
    expect(modelWireName(undefined)).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// toSessionV1
// ---------------------------------------------------------------------------
describe("toSessionV1", () => {
  const full: V2Session = {
    id: "sess-1",
    title: "Hello",
    location: { directory: "/tmp/proj" },
    time: { created: 1000, updated: 2000 },
    tokens: { input: 10, output: 20, reasoning: 0, cache: { read: 0, write: 0 } },
    cost: 0.5,
    agent: "agent-x",
    model: { id: "gpt-4", providerID: "openai", variant: "fast" },
    revert: { messageID: "msg-1", partID: "p1", diff: "diff" },
    parentID: "parent-1",
  }

  it("mapea un V2Session completo correctamente", () => {
    const out = toSessionV1(full)
    expect(out).toMatchObject({
      id: "sess-1",
      title: "Hello",
      directory: "/tmp/proj",
      time: { created: 1000, updated: 2000 },
      agent: "agent-x",
      cost: 0.5,
      parentID: "parent-1",
      model: { id: "gpt-4", providerID: "openai", variant: "fast" },
      revert: { messageID: "msg-1" },
    })
  })

  it("usa title vacío cuando title es undefined", () => {
    expect(toSessionV1({ id: "a" }).title).toBe("")
  })

  it("usa directory vacío cuando location es missing", () => {
    expect(toSessionV1({ id: "a" }).directory).toBe("")
  })

  it("usa directory vacío cuando location.directory es undefined", () => {
    expect(toSessionV1({ id: "a", location: {} }).directory).toBe("")
  })

  it("retorna model undefined cuando no hay model", () => {
    expect(toSessionV1({ id: "a" }).model).toBeUndefined()
  })

  it("retorna model undefined cuando model.id es faltante", () => {
    expect(toSessionV1({ id: "a", model: { providerID: "p" } }).model).toBeUndefined()
  })

  it("model providerID fallback a string vacío", () => {
    const out = toSessionV1({ id: "a", model: { id: "m" } })
    expect(out.model).toEqual({ id: "m", providerID: "", variant: undefined })
  })

  it("preserva parentID", () => {
    expect(toSessionV1({ id: "a", parentID: "par" }).parentID).toBe("par")
  })

  it("parentID undefined cuando no existe", () => {
    expect(toSessionV1({ id: "a" }).parentID).toBeUndefined()
  })

  it("preserva revert", () => {
    const rev = { messageID: "mid", partID: "pid" }
    expect(toSessionV1({ id: "a", revert: rev }).revert).toEqual(rev)
  })

  it("time usa 0 cuando no hay time", () => {
    expect(toSessionV1({ id: "a" }).time).toEqual({ created: 0, updated: 0 })
  })

  it("time parcial: solo created", () => {
    expect(toSessionV1({ id: "a", time: { created: 999 } }).time).toEqual({
      created: 999,
      updated: 0,
    })
  })

  it("tokens y cost se propagan", () => {
    const tokens = { input: 1, output: 2, reasoning: 3, cache: { read: 4, write: 5 } }
    const out = toSessionV1({ id: "a", tokens, cost: 1.23 })
    expect(out.tokens).toEqual(tokens)
    expect(out.cost).toBe(1.23)
  })
})

// ---------------------------------------------------------------------------
// toMessageEnvelopeV1
// ---------------------------------------------------------------------------
describe("toMessageEnvelopeV1", () => {
  it("mapea content array a parts con todos los campos", () => {
    const raw: V2Message = {
      id: "msg-1",
      sessionID: "sess-1",
      type: "user",
      time: { created: 100, completed: 200 },
      agent: "ag",
      parentID: "par",
      model: { id: "gpt-4", providerID: "openai" },
      finish: "stop",
      tokens: { input: 1, output: 2, reasoning: 0, cache: { read: 0, write: 0 } },
      cost: 0.1,
      content: [
        {
          id: "part-1",
          type: "text",
          text: "hello",
          data: "d",
          mimeType: "text/plain",
          name: "toolA",
          state: { status: "done" },
          time: { created: 10, completed: 20 },
        },
      ],
    }
    const out = toMessageEnvelopeV1(raw)
    expect(out.info).toMatchObject({
      id: "msg-1",
      role: "user",
      sessionID: "sess-1",
      time: { created: 100, completed: 200 },
      agent: "ag",
      parentID: "par",
      modelID: "gpt-4",
      providerID: "openai",
      finish: "stop",
      cost: 0.1,
    })
    expect(out.parts).toHaveLength(1)
    expect(out.parts[0]).toMatchObject({
      id: "part-1",
      sessionID: "sess-1",
      type: "text",
      text: "hello",
      data: "d",
      mimeType: "text/plain",
      callID: "part-1",
      tool: "toolA",
      state: { status: "done" },
      time: { start: 10, end: 20 },
    })
  })

  it("retorna parts vacío cuando no hay content", () => {
    const out = toMessageEnvelopeV1({ id: "m1" })
    expect(out.parts).toEqual([])
  })

  it("preserva url/mime/filename en parts de archivo (imágenes)", () => {
    const raw: V2Message = {
      id: "m2",
      sessionID: "sess-1",
      content: [
        {
          id: "f1",
          type: "file",
          mime: "image/png",
          filename: "clipboard.png",
          url: "data:image/png;base64,AAA",
        },
      ],
    }
    const out = toMessageEnvelopeV1(raw)
    expect(out.parts).toHaveLength(1)
    expect(out.parts[0]).toMatchObject({
      type: "file",
      mimeType: "image/png",
      mime: "image/png",
      filename: "clipboard.png",
      url: "data:image/png;base64,AAA",
    })
  })

  it("retorna parts vacío cuando content es undefined explícito", () => {
    const out = toMessageEnvelopeV1({ id: "m1", content: undefined })
    expect(out.parts).toEqual([])
  })

  it("mapea time created/completed a start/end en parts", () => {
    const raw: V2Message = {
      id: "m1",
      content: [{ time: { created: 5, completed: 15 } }],
    }
    expect(toMessageEnvelopeV1(raw).parts[0].time).toEqual({ start: 5, end: 15 })
  })

  it("part time es undefined cuando content time es faltante", () => {
    const raw: V2Message = {
      id: "m1",
      content: [{ text: "hi" }],
    }
    expect(toMessageEnvelopeV1(raw).parts[0].time).toBeUndefined()
  })

  it("info time usa defaults cuando raw.time es faltante", () => {
    const out = toMessageEnvelopeV1({ id: "m1" })
    expect(out.info.time).toEqual({ created: 0, completed: undefined })
  })

  it("info time mapea created y completed correctamente", () => {
    const out = toMessageEnvelopeV1({ id: "m1", time: { created: 42, completed: 99 } })
    expect(out.info.time).toEqual({ created: 42, completed: 99 })
  })

  it("part id fallback a raw.id_part_index cuando c.id falta", () => {
    const raw: V2Message = {
      id: "msgX",
      content: [{ text: "a" }, { text: "b" }],
    }
    const parts = toMessageEnvelopeV1(raw).parts
    expect(parts[0].id).toBe("msgX_part_0")
    expect(parts[1].id).toBe("msgX_part_1")
  })

  it("part type fallback a text cuando falta", () => {
    const raw: V2Message = { id: "m1", content: [{}] }
    expect(toMessageEnvelopeV1(raw).parts[0].type).toBe("text")
  })

  it("role fallback a assistant cuando type falta", () => {
    expect(toMessageEnvelopeV1({ id: "m1" }).info.role).toBe("assistant")
  })

  it("sessionID fallback a string vacío cuando falta", () => {
    expect(toMessageEnvelopeV1({ id: "m1" }).info.sessionID).toBe("")
  })

  it("múltiples parts preservan orden y cada uno con su time", () => {
    const raw: V2Message = {
      id: "m1",
      content: [
        { id: "p1", time: { created: 1, completed: 2 } },
        { id: "p2" },
      ],
    }
    const parts = toMessageEnvelopeV1(raw).parts
    expect(parts[0].time).toEqual({ start: 1, end: 2 })
    expect(parts[1].time).toBeUndefined()
  })

  it("content vacío array produce parts vacío", () => {
    expect(toMessageEnvelopeV1({ id: "m1", content: [] }).parts).toEqual([])
  })
})
