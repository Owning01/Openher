import type { AgentOption, ModelOption, ModelSelection, Session, MessageEnvelope } from "../../types"

export type ConfigProvidersResponse = {
  providers: Array<{
    id: string
    name: string
    models: Record<
      string,
      {
        id?: string
        name?: string
        status?: string
        capabilities?: {
          attachment?: boolean
          toolcall?: boolean
          tools?: boolean
        }
        limit?: {
          context?: number
          output?: number
        }
        variants?: Record<string, unknown>
      }
    >
  }>
  default?: Record<string, string>
}

export type AgentResponse = Array<{
  id?: string
  name?: string
  description?: string
  mode: "primary" | "subagent" | "all"
  hidden?: boolean
}>

export function mapProviderModels(response: ConfigProvidersResponse): ModelOption[] {
  return response.providers.flatMap((provider) => {
    const defaultModel = response.default?.[provider.id]
    return Object.entries(provider.models).flatMap(([modelID, model]) => {
      const base: ModelOption = {
        providerID: provider.id,
        providerName: provider.name || provider.id,
        modelID: model.id || modelID,
        modelName: model.name || model.id || modelID,
        status: model.status,
        contextLimit: model.limit?.context,
        outputLimit: model.limit?.output,
        tools: Boolean(model.capabilities?.toolcall || model.capabilities?.tools),
        attachments: Boolean(model.capabilities?.attachment),
        isDefault: defaultModel === modelID,
      }
      const variantIDs = Object.keys(model.variants ?? {})
      return [base, ...variantIDs.map((variant) => ({ ...base, variant, isDefault: false }))]
    })
  })
}

export function toAgentOption(agent: AgentResponse[number]): AgentOption {
  const id = agent.id || agent.name || ""
  const anyAgent = agent as any
  return {
    id,
    name: agent.name || id,
    description: agent.description,
    mode: agent.mode,
    hidden: agent.hidden,
    prompt: anyAgent.prompt || anyAgent.system || anyAgent.instructions,
    model: anyAgent.model,
  }
}

export function toModelBody(model?: ModelSelection) {
  if (!model) return undefined
  return { providerID: model.providerID, modelID: model.modelID }
}

export function toCreateSessionModel(model?: ModelSelection) {
  if (!model) return undefined
  return { providerID: model.providerID, id: model.modelID, variant: model.variant || undefined }
}

export function modelWireName(model?: ModelSelection) {
  if (!model) return undefined
  return `${model.providerID}/${model.modelID}`
}

export type V2Session = {
  id: string
  title?: string
  location?: { directory?: string }
  time?: { created?: number; updated?: number }
  tokens?: import("../../types").TokenUsage
  cost?: number
  agent?: string
  model?: { id?: string; providerID?: string; variant?: string }
  revert?: import("../../types").Session["revert"]
  parentID?: string
}

export function toSessionV1(raw: V2Session): Session {
  return {
    id: raw.id,
    title: raw.title ?? "",
    directory: raw.location?.directory ?? "",
    time: {
      created: raw.time?.created ?? 0,
      updated: raw.time?.updated ?? 0,
    },
    tokens: raw.tokens,
    cost: raw.cost,
    agent: raw.agent,
    model: raw.model?.id ? { id: raw.model.id, providerID: raw.model.providerID ?? "", variant: raw.model.variant } : undefined,
    revert: raw.revert,
    parentID: raw.parentID,
  }
}

export type V2Message = {
  id: string
  sessionID?: string
  time?: { created?: number; completed?: number }
  type?: string
  agent?: string
  parentID?: string
  model?: { id?: string; providerID?: string }
  finish?: string
  tokens?: import("../../types").TokenUsage
  cost?: number
  text?: string
  summary?: string
  recent?: string
  status?: string
  reason?: string
  description?: string
  content?: Array<{
    id?: string
    type?: string
    text?: string
    data?: string
    mimeType?: string
    mime?: string
    url?: string
    filename?: string
    name?: string
    state?: unknown
    time?: { created?: number; completed?: number }
  }>
}

export function toMessageEnvelopeV1(raw: V2Message): MessageEnvelope {
  const content = raw.content ?? []
  let parts: MessageEnvelope["parts"] = content.map((c, index) => ({
    id: c.id ?? `${raw.id}_part_${index}`,
    sessionID: raw.sessionID,
    type: c.type ?? "text",
    text: c.text,
    data: c.data,
    mimeType: c.mimeType ?? c.mime,
    // Adjuntos (imágenes): sin url/mime/filename el mensaje confirmado
    // pierde la imagen y el chat la deja de mostrar tras el optimistic.
    url: (c as { url?: string }).url,
    mime: c.mime,
    filename: (c as { filename?: string }).filename ?? c.name,
    callID: c.id,
    tool: c.name,
    state: c.state as MessageEnvelope["parts"][number]["state"],
    time: c.time ? { start: c.time.created, end: c.time.completed } : undefined,
  }))
  // v2 compaction/system/shell no usan `content` — exponen `summary`/`text`/`recent`/`output` a nivel raíz.
  // Sin esto el mensaje quedaba con parts vacío y se filtraba en rendered.ts → chat vacío tras compact.
  if (parts.length === 0) {
    const rawAny = raw as unknown as { text?: unknown; summary?: unknown; recent?: unknown; description?: unknown; output?: unknown; contentText?: unknown; command?: unknown }
    if (raw.type === "compaction") {
      const compText = (typeof rawAny.summary === "string" && rawAny.summary) ? rawAny.summary
        : (typeof rawAny.text === "string" && rawAny.text) ? rawAny.text
        : (typeof rawAny.recent === "string" && rawAny.recent) ? rawAny.recent
        : (typeof rawAny.description === "string" && rawAny.description) ? rawAny.description : ""
      if (compText) {
        parts = [{ id: `${raw.id}_part_0`, sessionID: raw.sessionID, type: "compaction", text: compText } as unknown as MessageEnvelope["parts"][number]]
      } else {
        // Compaction sin summary (failed) → placeholder para que el mensaje no desaparezca y el spinner se apague
        parts = [{ id: `${raw.id}_part_0`, sessionID: raw.sessionID, type: "compaction", text: raw.status === "failed" ? `Compaction failed${(raw as any).error ? `: ${(raw as any).error}` : ""}` : "Compacted" } as unknown as MessageEnvelope["parts"][number]]
      }
    } else if (raw.type === "system" || raw.type === "synthetic" || raw.type === "skill") {
      const t = (typeof rawAny.text === "string" && rawAny.text) ? rawAny.text : (typeof rawAny.description === "string" && rawAny.description) ? rawAny.description : ""
      if (t) parts = [{ id: `${raw.id}_part_0`, sessionID: raw.sessionID, type: "text", text: t } as unknown as MessageEnvelope["parts"][number]]
    } else if (raw.type === "shell") {
      const t = (typeof rawAny.output === "string" && rawAny.output) ? rawAny.output : (typeof rawAny.command === "string" && rawAny.command) ? rawAny.command : (typeof rawAny.text === "string" && rawAny.text) ? rawAny.text : ""
      if (t) parts = [{ id: `${raw.id}_part_0`, sessionID: raw.sessionID, type: "text", text: t } as unknown as MessageEnvelope["parts"][number]]
    } else {
      const topText = typeof rawAny.text === "string" ? rawAny.text : typeof rawAny.contentText === "string" ? rawAny.contentText : ""
      if (topText) {
        parts = [{ id: `${raw.id}_part_0`, sessionID: raw.sessionID, type: "text", text: topText } as unknown as MessageEnvelope["parts"][number]]
      }
    }
  }
  return {
    info: {
      id: raw.id,
      role: raw.type ?? "assistant",
      sessionID: raw.sessionID ?? "",
      time: { created: raw.time?.created ?? 0, completed: raw.time?.completed },
      agent: raw.agent,
      parentID: raw.parentID,
      modelID: raw.model?.id,
      providerID: raw.model?.providerID,
      finish: raw.finish,
      tokens: raw.tokens,
      cost: raw.cost,
    },
    parts,
  }
}
