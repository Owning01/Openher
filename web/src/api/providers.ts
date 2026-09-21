import type { ServerConfig, ServerProviderConnection, ServerProviderList } from "../types"
import { request, withDirectory, withLocationDirectory } from "../shared/api/client"
import { getApiVersion } from "../shared/api/version"
import { mapProviderModels, toAgentOption } from "../shared/api/mappers"
import type { AgentResponse, ConfigProvidersResponse } from "../shared/api/mappers"
import { pickV2 } from "./versionDispatch"

const listAgents = async (config: ServerConfig, directory?: string) => {
  const agents = await request<AgentResponse>(config, withDirectory("/agent", directory))
  return agents.map(toAgentOption).filter((agent) => agent.id && !agent.hidden)
}

const listModels = (config: ServerConfig, directory?: string) =>
  pickV2(
    config,
    async () => {
      const response = await request<ConfigProvidersResponse>(config, withDirectory("/config/providers", directory))
      return mapProviderModels(response)
    },
    async () => {
      const [raw, def] = await Promise.all([
        request<unknown>(config, withLocationDirectory("/model", directory)),
        request<unknown>(config, withLocationDirectory("/model/default", directory)).catch(() => null),
      ])
      const models = Array.isArray(raw)
        ? (raw as Array<{
            id?: string
            modelID?: string
            providerID?: string
            name?: string
            status?: string
            enabled?: boolean
            capabilities?: { tools?: boolean; input?: string[] }
            limit?: { context?: number; output?: number }
            variants?: Array<{ id?: string }>
          }>)
        : []
      const defaultModel = (def ?? null) as { providerID?: string; modelID?: string; id?: string } | null
      const providers = new Map<string, ConfigProvidersResponse["providers"][number]>()
      for (const m of models) {
        if (m.enabled === false || m.status === "deprecated" || !m.providerID || !m.modelID) continue
        let provider = providers.get(m.providerID)
        if (!provider) {
          provider = { id: m.providerID, name: m.providerID, models: {} }
          providers.set(m.providerID, provider)
        }
        provider.models[m.modelID] = {
          id: m.id ?? m.modelID,
          name: m.name ?? m.modelID,
          status: m.status,
          capabilities: {
            tools: m.capabilities?.tools,
            toolcall: m.capabilities?.tools,
            attachment: m.capabilities?.input?.includes("image"),
          },
          limit: m.limit ? { context: m.limit.context, output: m.limit.output } : undefined,
          variants: Object.fromEntries((m.variants ?? []).map((v) => [v.id ?? "", { id: v.id }])),
        }
      }
      return mapProviderModels({
        providers: [...providers.values()],
        default: defaultModel ? { [defaultModel.providerID ?? ""]: defaultModel.modelID ?? defaultModel.id ?? "" } : {},
      })
    },
  )

const loadProviders = async (config: ServerConfig, directory?: string) => {
  const v2 = (await getApiVersion(config)) === "v2"
  if (v2) {
    const raw = await request<unknown>(config, withLocationDirectory("/integration", directory))
    const list = Array.isArray(raw)
      ? (raw as Array<{
          id?: string
          name?: string
          authMethods?: unknown
          connections?: Array<{ type?: string; id?: string; label?: string; name?: string }>
        }>)
      : []
    // v2 modela CADA cuenta como una conexión: `credential` (con id+label) o
    // `env`. Se conservan todas para poder listar y quitar cuentas sueltas
    // de un mismo proveedor (antes se aplanaba a una lista de ids).
    const all = list.map((p) => {
      const connections: ServerProviderConnection[] = (p.connections ?? [])
        .map((c) =>
          c.type === "env"
            ? ({ type: "env" as const, name: c.name ?? "" } satisfies ServerProviderConnection)
            : ({ type: "credential" as const, id: c.id ?? "", label: c.label ?? "" } satisfies ServerProviderConnection),
        )
        .filter((c) => (c.type === "env" ? !!c.name : !!c.id))
      return {
        id: p.id ?? "",
        name: p.name ?? p.id ?? "",
        source: "config" as const,
        env: [] as string[],
        models: {} as Record<string, unknown>,
        connections,
      }
    })
    return {
      all,
      default: {} as Record<string, string>,
      connected: all.filter((p) => p.connections && p.connections.length > 0).map((p) => p.id),
    }
  }
  return request<ServerProviderList>(config, withDirectory("/provider", directory))
}

const setProviderAuth = (config: ServerConfig, providerID: string, key: string, directory?: string, label?: string) =>
  pickV2(
    config,
    () => request<boolean>(config, withDirectory(`/auth/${providerID}`, directory), {
      method: "PUT",
      body: { type: "api", key },
    }),
    () => {
      const body: Record<string, unknown> = { key }
      const clean = label?.trim()
      if (clean) body.label = clean
      return request<boolean>(config, withLocationDirectory(`/integration/${providerID}/connect/key`, directory), {
        method: "POST",
        body,
      })
    },
  )

const removeProviderAuth = (config: ServerConfig, providerID: string, directory?: string) =>
  pickV2(
    config,
    () => request<boolean>(config, withDirectory(`/auth/${providerID}`, directory), { method: "DELETE" }),
    async () => {
      // No existe un endpoint `integration/disconnect`: se quitan una por una
      // todas las credenciales del proveedor (DELETE /api/credential/:id).
      const raw = await request<unknown>(config, withLocationDirectory(`/integration/${providerID}`, directory))
      const conns = (raw as { connections?: Array<{ type?: string; id?: string }> } | null)?.connections ?? []
      let removed = false
      for (const c of conns) {
        if (c.type !== "credential" || !c.id) continue
        await request(config, withLocationDirectory(`/credential/${encodeURIComponent(c.id)}`, directory), { method: "DELETE" })
        removed = true
      }
      return removed
    },
  )

/** v2: quita una cuenta concreta (credencial) de un proveedor. */
const removeProviderCredential = (config: ServerConfig, credentialID: string, directory?: string) =>
  request<boolean>(config, withLocationDirectory(`/credential/${encodeURIComponent(credentialID)}`, directory), {
    method: "DELETE",
  })

/** v2: marca una cuenta concreta como la activa del proveedor. */
const activateProviderCredential = (config: ServerConfig, credentialID: string, directory?: string) =>
  request<boolean>(config, withLocationDirectory(`/credential/${encodeURIComponent(credentialID)}/activate`, directory), {
    method: "POST",
  })

const addCustomProvider = (config: ServerConfig, providerID: string, name: string, baseURL: string, models: string[]) => {
  const modelsObj: Record<string, { name: string }> = {}
  for (const m of models) {
    const id = m.trim()
    if (id) modelsObj[id] = { name: id }
  }
  return request<unknown>(config, "/config", {
    method: "PATCH",
    body: {
      provider: {
        [providerID]: {
          npm: "@ai-sdk/openai-compatible",
          name,
          options: { baseURL },
          models: modelsObj,
        },
      },
    },
  })
}

export const providersApi = {
  listModels,
  listAgents,
  loadProviders,
  setProviderAuth,
  removeProviderAuth,
  removeProviderCredential,
  activateProviderCredential,
  addCustomProvider,
}
