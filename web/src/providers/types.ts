export type QuickChatRole = "user" | "assistant" | "system"

export type QuickChatMessage = {
  role: QuickChatRole
  content: string
  cached?: boolean
  searchResults?: { title: string; url: string; snippet: string }[]
}

export type QuickChatProviderId = "cerebras" | "groq" | "opencode-go" | "custom" | (string & {})

export type QuickChatUsage = { input: number; output: number; total: number }

export type QuickChatResult = {
  text: string
  usage?: QuickChatUsage
  cached?: boolean
}

export interface QuickChatProvider {
  id: QuickChatProviderId
  labelKey: string
  chat(messages: QuickChatMessage[], opts: { model: string; signal?: AbortSignal; onChunk?: (chunk: string) => void }): Promise<QuickChatResult>
  listModels(): Promise<{ id: string; label: string }[]>
}
