import type { QuickChatMessage, QuickChatProvider, QuickChatResult } from "./types"

// OpenCode Go — direct API, no opencode session. OpenAI-compatible.
// User configures API key via Settings → Go (loadGoAccounts) or shell config.
// No default model — user must pick.
const GO_CHAT_URL = "https://opencode.ai/zen/go/v1/chat/completions"
const GO_CHAT_URL_FALLBACK = "https://api.opencode.ai/v1/chat/completions"
const GO_MODELS_URL = "https://opencode.ai/zen/go/v1/models"

function estimateTokens(text: string): number { return Math.ceil(text.length / 4) }

const recentRequests: number[] = []
function checkRateLimit(): string | null {
  const now = Date.now()
  while (recentRequests.length && now - recentRequests[0] > 60000) recentRequests.shift()
  if (recentRequests.length >= 12) return "Rate limit Go — esperá unos segundos."
  return null
}
function recordRequest() { recentRequests.push(Date.now()) }

export function createOpencodeGoProvider(apiKey: string): QuickChatProvider {
  return {
    id: "opencode-go",
    labelKey: "quickchat.providerOpencode",
    async listModels() {
      if (!apiKey) return []
      // Try to list via Go models endpoint (OpenAI-compatible)
      try {
        const res = await fetch(GO_MODELS_URL, {
          headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
          cache: "no-store",
        })
        if (res.ok) {
          const data = await res.json() as any
          const list = Array.isArray(data?.data) ? data.data : Array.isArray(data?.models) ? data.models : []
          if (list.length) return list.map((m: any) => ({ id: m.id as string, label: (m.name ?? m.id) as string }))
        }
      } catch {}
      // Fallback: no assumption — return empty so UI forces explicit pick or shows config
      return []
    },
    async chat(messages: QuickChatMessage[], opts: { model: string; signal?: AbortSignal; onChunk?: (chunk: string) => void }): Promise<QuickChatResult> {
      if (!apiKey) throw new Error("NO_KEY_GO")
      if (!opts.model) throw new Error("Seleccioná un modelo")
      const rl = checkRateLimit()
      if (rl) throw new Error(rl)
      const sys: QuickChatMessage = { role: "system", content: "Sos asistente breve y directo. Respondé conciso, sin rodeos. Máximo 12 líneas." }
      const trimmed = [sys, ...messages.slice(-8)]
      let totalEst = trimmed.reduce((a, m) => a + estimateTokens(m.content), 0) + 500
      if (totalEst > 6000) trimmed.splice(1, Math.max(1, trimmed.length - 6))
      recordRequest()

      const rawModel = opts.model
      const model = rawModel.startsWith("opencode-go/") ? rawModel.slice("opencode-go/".length) : rawModel
      const useStream = typeof opts.onChunk === "function"
      const body: any = {
        model,
        messages: trimmed.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 500,
        temperature: 0.3,
        stream: useStream,
      }

      const doFetch = async (url: string) => fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: opts.signal,
      })

      let res = await doFetch(GO_CHAT_URL)
      if (!res.ok && (res.status === 404 || res.status === 405)) {
        // Fallback endpoint
        res = await doFetch(GO_CHAT_URL_FALLBACK)
      }
      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        if (res.status === 401 || res.status === 403) throw new Error("NO_KEY_GO")
        if (res.status === 429) throw new Error("Rate limit Go — esperá unos segundos.")
        throw new Error(txt || `Go ${res.status}`)
      }

      if (!useStream || !res.body) {
        const data = await res.json() as any
        const text = data?.choices?.[0]?.message?.content ?? ""
        const usage = data?.usage ? { input: data.usage.prompt_tokens ?? 0, output: data.usage.completion_tokens ?? 0, total: data.usage.total_tokens ?? 0 } : undefined
        return { text: String(text).trim(), usage }
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ""
      let buffer = ""
      let usage: any = undefined
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) {
            const t = line.trim()
            if (!t.startsWith("data:")) continue
            const dataStr = t.slice(5).trim()
            if (dataStr === "[DONE]") continue
            try {
              const json = JSON.parse(dataStr)
              const delta = json?.choices?.[0]?.delta?.content ?? ""
              if (delta) { acc += delta; opts.onChunk?.(delta) }
              if (json?.usage) usage = json.usage
            } catch {}
          }
        }
      } finally { try { reader.releaseLock() } catch {} }
      return { text: acc.trim(), usage: usage ? { input: usage.prompt_tokens ?? 0, output: usage.completion_tokens ?? 0, total: usage.total_tokens ?? 0 } : undefined }
    },
  }
}
