import type { QuickChatMessage, QuickChatProvider, QuickChatResult } from "./types"
import { shell } from "../shell"
import { buildOpenAIPayload, QC_SYSTEM_PROMPT } from "../utils/promptCache"

async function proxyAwareFetch(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init)
  } catch (e: any) {
    const msg = String(e?.message ?? e)
    if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("CORS") || msg.includes("Load failed")) {
      try {
        return await shell.proxy.fetch(url, init)
      } catch {}
    }
    throw e
  }
}

// Cerebras OpenAI-compatible. Limits: 5 RPM, 90k TPM, 30k uncached TPM
const CEREBRAS_DEFAULT_URL = "https://api.cerebras.ai/v1/chat/completions"
// Models offered by Cerebras per user: gemma 4 + gpt oss 120b. No default silent fallback to deepseek.
const MODELS = [
  { id: "gpt-oss-120b", label: "GPT-OSS 120B" },
  { id: "cerebras/gpt-oss-120b", label: "GPT-OSS 120B (cerebras/)" },
  { id: "gemma-4", label: "Gemma 4" },
  { id: "llama-4-scout-17b-16e-instruct", label: "Llama 4 Scout" },
]

// Simple client-side rate limit: 5 req/min
const recentRequests: number[] = []
function checkRateLimit(): string | null {
  const now = Date.now()
  while (recentRequests.length && now - recentRequests[0] > 60000) recentRequests.shift()
  if (recentRequests.length >= 5) return "Rate limit (5/min) — esperá unos segundos."
  return null
}
function recordRequest() { recentRequests.push(Date.now()) }

function estimateTokens(text: string): number { return Math.ceil(text.length / 4) }

export function createCerebrasProvider(apiKey: string, baseUrl?: string): QuickChatProvider {
  const CEREBRAS_URL = baseUrl ?? CEREBRAS_DEFAULT_URL
  return {
    id: "cerebras",
    labelKey: "quickchat.providerCerebras",
    async listModels() { return MODELS },
    async chat(messages: QuickChatMessage[], opts: { model: string; signal?: AbortSignal; onChunk?: (chunk: string) => void; systemPrompt?: string }): Promise<QuickChatResult> {
      if (!apiKey) throw new Error("NO_KEY")
      const rl = checkRateLimit()
      if (rl) throw new Error(rl)
      if (!opts.model) throw new Error("Seleccioná un modelo")
      const payload = buildOpenAIPayload(messages, {
        model: opts.model,
        systemPrompt: opts.systemPrompt ?? QC_SYSTEM_PROMPT,
        temperature: 0.3,
        maxTokens: 500,
        stream: false,
        cacheKey: `quickchat:cerebras:${opts.model}`,
      })
      let msgs = payload.messages
      let totalEst = msgs.reduce((a, m) => a + estimateTokens(m.content), 0) + 500
      if (totalEst > 28000) {
        msgs = [msgs[0]!, ...msgs.slice(-5)]
      }
      recordRequest()
      void (opts as any).onChunk
      const res = await proxyAwareFetch(CEREBRAS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: opts.model,
          messages: msgs,
          max_completion_tokens: 500,
          temperature: 0.3,
          stream: false,
          prompt_cache_key: payload.prompt_cache_key,
        }),
        signal: opts.signal,
      })
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        if (res.status === 429) throw new Error("Rate limit (5/min) — esperá unos segundos.")
        throw new Error(txt || `Cerebras ${res.status}`)
      }
      const data = await res.json() as any
      const text = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? ""
      const usage = data?.usage ? { input: data.usage.prompt_tokens ?? 0, output: data.usage.completion_tokens ?? 0, total: data.usage.total_tokens ?? 0 } : undefined
      return { text: String(text).trim(), usage }
    },
  }
}

export const CEREBRAS_MODELS = MODELS
