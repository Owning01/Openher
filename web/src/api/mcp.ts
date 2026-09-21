import type { MCPServerInfo, MCPServerStatus, ServerConfig } from "../types"
import { request, withDirectory, withLocationDirectory } from "../shared/api/client"
import { isV2, pickV2 } from "./versionDispatch"

const listMCPResources = (config: ServerConfig, directory?: string) => {
  type MCPItem = { id: string; name: string; description?: string }
  // McpResource real: {server, name, uri, description?, mimeType?} (sin id).
  const mapResource = (r: unknown): MCPItem | null => {
    if (!r || typeof r !== "object") return null
    const o = r as { uri?: unknown; id?: unknown; name?: unknown; server?: unknown; description?: unknown }
    const id = o.uri ?? o.id ?? o.name ?? ""
    const name = o.name ?? o.server ?? o.id ?? ""
    if (!id && !name) return null
    return {
      id: String(id),
      name: String(name),
      description: typeof o.description === "string" ? o.description : typeof o.server === "string" ? o.server : undefined,
    }
  }
  const keep = (xs: unknown[]): MCPItem[] =>
    xs.map(mapResource).filter((x): x is MCPItem => x !== null)
  return pickV2(
    config,
    () =>
      request<unknown>(config, withDirectory("/experimental/resource", directory)).then((raw) => {
        if (Array.isArray(raw)) return keep(raw)
        if (raw && typeof raw === "object") {
          const wrapped = (raw as { resources?: unknown; data?: unknown }).resources ?? (raw as { data?: unknown }).data
          if (Array.isArray(wrapped)) return keep(wrapped)
          if (Array.isArray((raw as { servers?: unknown }).servers)) {
            return (raw as { servers: Array<{ id?: string; name?: string; description?: string }> }).servers
              .filter((s) => s.id || s.name)
              .map((s) => ({ id: s.id ?? s.name ?? "", name: s.name ?? s.id ?? "", description: s.description }))
          }
        }
        return []
      }),
    async () => {
      const raw = await request<unknown>(config, withLocationDirectory("/mcp/resource", directory))
      if (Array.isArray(raw)) return keep(raw)
      if (raw && typeof raw === "object") {
        const wrapped = (raw as { resources?: unknown; data?: unknown }).resources ?? (raw as { data?: unknown }).data
        if (Array.isArray(wrapped)) return keep(wrapped)
      }
      return []
    },
  )
}

/**
 * v2: servidores MCP con estado real (connected / disabled / failed / …).
 * El endpoint es GET /api/mcp; en v1 no existe (devuelve []).
 */
const listMCPServers = async (config: ServerConfig, directory?: string): Promise<MCPServerInfo[]> => {
  if (!(await isV2(config))) return []
  const raw = await request<unknown>(config, withLocationDirectory("/mcp", directory))
  if (!Array.isArray(raw)) return []
  const valid: MCPServerStatus[] = ["connected", "pending", "disabled", "failed", "needs_auth"]
  const out: MCPServerInfo[] = []
  for (const item of raw) {
    if (!item || typeof item !== "object") continue
    const o = item as { name?: unknown; status?: unknown }
    if (typeof o.name !== "string" || !o.name) continue
    const st = (o.status && typeof o.status === "object" ? o.status : {}) as { status?: unknown; error?: unknown }
    const status = valid.includes(st.status as MCPServerStatus) ? (st.status as MCPServerStatus) : "disabled"
    out.push({ name: o.name, status, error: typeof st.error === "string" ? st.error : undefined })
  }
  return out
}

/** v2: activa/conecta un server MCP (POST /api/mcp/:name/connect, 204). */
const connectMCPServer = async (config: ServerConfig, name: string, directory?: string): Promise<void> => {
  await request(config, withLocationDirectory(`/mcp/${encodeURIComponent(name)}/connect`, directory), { method: "POST" })
}

/** v2: desactiva/desconecta un server MCP (POST /api/mcp/:name/disconnect, 204). */
const disconnectMCPServer = async (config: ServerConfig, name: string, directory?: string): Promise<void> => {
  await request(config, withLocationDirectory(`/mcp/${encodeURIComponent(name)}/disconnect`, directory), { method: "POST" })
}

export const mcpApi = {
  listMCPResources,
  listMCPServers,
  connectMCPServer,
  disconnectMCPServer,
}
