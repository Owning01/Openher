import type { QuickChatProvider, QuickChatProviderId } from "./types"
import { createCerebrasProvider } from "./cerebras"
import { createOpencodeGoProvider } from "./opencodeGo"
import type { ServerConfig } from "../types"

export function getQuickChatProvider(id: QuickChatProviderId, opts: { cerebrasKey: string; config: ServerConfig | null }): QuickChatProvider {
  if (id === "opencode-go") return createOpencodeGoProvider(opts.config)
  return createCerebrasProvider(opts.cerebrasKey)
}

export type { QuickChatMessage, QuickChatProvider, QuickChatProviderId, QuickChatResult } from "./types"
export { CEREBRAS_MODELS } from "./cerebras"
