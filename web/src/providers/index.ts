import type { QuickChatProvider, QuickChatProviderId } from "./types"
import { createCerebrasProvider } from "./cerebras"
import { createGroqProvider } from "./groq"
import { createOpencodeGoProvider } from "./opencodeGo"
import { createCustomProvider } from "./custom"
import type { ServerConfig } from "../types"

export function getQuickChatProvider(id: QuickChatProviderId, opts: {
  cerebrasKey: string
  groqKey?: string
  goKey?: string
  customKey?: string
  customUrl?: string
  config: ServerConfig | null
}): QuickChatProvider {
  if (id === "groq") return createGroqProvider(opts.groqKey ?? "")
  if (id === "opencode-go") return createOpencodeGoProvider(opts.goKey ?? "")
  if (id === "custom") return createCustomProvider(opts.customKey ?? "", opts.customUrl)
  return createCerebrasProvider(opts.cerebrasKey)
}

export type { QuickChatMessage, QuickChatProvider, QuickChatProviderId, QuickChatResult } from "./types"
export { CEREBRAS_MODELS } from "./cerebras"
export { GROQ_MODELS } from "./groq"
export { createCustomProvider } from "./custom"

