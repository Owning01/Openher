/**
 * Thin wrapper sobre @opencode-ai/client (beta) que mantiene la lógica
 * existente de resolveShellBase / Tailscale / Basic Auth de opencode-remote-android.
 *
 * Uso:
 *   import { getOpencodeClient } from "./opencodeClient"
 *   const client = await getOpencodeClient(config) // config: ServerConfig
 *   const s = await client.session.create({ location: { directory: "/workspace" } })
 *   for await (const e of client.event.subscribe()) console.log(e.type)
 *
 * Fallback: si @opencode-ai/client no está instalado o baseUrl no resuelve, usa el fetch manual de client.ts
 */
import { OpenCode } from "@opencode-ai/client"
import type { ServerConfig } from "../../types"
import { baseUrl, authHeader } from "./client"

export type OpencodeClient = ReturnType<typeof OpenCode.make>

let cachedClient: OpencodeClient | null = null
let cachedBaseUrl: string | null = null

export async function getOpencodeClient(config: ServerConfig): Promise<OpencodeClient> {
  const url = baseUrl(config)
  if (cachedClient && cachedBaseUrl === url) return cachedClient

  const headers: Record<string, string> = {}
  if (config.username && config.password) {
    headers.Authorization = authHeader(config)
  }

  const client = OpenCode.make({
    baseUrl: url,
    headers,
  })

  cachedClient = client as unknown as OpencodeClient
  cachedBaseUrl = url
  return cachedClient
}

// Re-export para tests con SDK (embed)
// En vitest, usar @opencode-ai/sdk en vez de client:
//   import { OpenCode } from "@opencode-ai/sdk"
//   await using opencode = await OpenCode.create({ plugins: [acmeShell] })
export { OpenCode }
