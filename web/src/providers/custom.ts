import type { QuickChatMessage, QuickChatProvider, QuickChatResult } from "./types"
import { shell } from "../shell"

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

export function createCustomProvider(apiKey: string, baseUrl?: string): QuickChatProvider {
  const cleanBase = (baseUrl?.trim() || "https://api.openai.com/v1").replace(/\/chat\/completions\/?$/, "").replace(/\/+$/, "")
  const endpoint = `${cleanBase}/chat/completions`

  return {
    id: "custom",
    labelKey: "quickchat.providerCustom",
    async listModels() {
      if (cleanBase) {
        try {
          const headers: Record<string, string> = {}
          if (apiKey?.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`
          const res = await proxyAwareFetch(`${cleanBase}/models`, { headers })
          if (res.ok) {
            const data = await res.json() as any
            const list: Array<{ id: string; name?: string }> = data?.data || data?.models || []
            if (Array.isArray(list) && list.length > 0) {
              return list.map(m => ({ id: m.id || (m as any).name, label: m.name || m.id }))
            }
          }
        } catch {}
      }
      return [
        { id: "gpt-4o", label: "GPT-4o" },
        { id: "gpt-4o-mini", label: "GPT-4o Mini" },
        { id: "deepseek-chat", label: "DeepSeek V3" },
        { id: "deepseek-reasoner", label: "DeepSeek R1" },
        { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
        { id: "llama3", label: "Llama 3 (Local)" },
        { id: "mistral", label: "Mistral (Local)" },
        { id: "custom-model", label: "Modelo Personalizado" },
      ]
    },
    async chat(messages: QuickChatMessage[], opts: { model: string; signal?: AbortSignal; onChunk?: (chunk: string) => void }): Promise<QuickChatResult> {
      const headers: Record<string, string> = { "Content-Type": "application/json" }
      if (apiKey?.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`

      const sys: QuickChatMessage = { role: "system", content: "Sos asistente breve y directo. Respondé conciso, sin rodeos." }
      const trimmed = [sys, ...messages.slice(-8)]
      const model = opts.model || "gpt-4o-mini"
      const useStream = typeof opts.onChunk === "function"

      const body: any = {
        model,
        messages: trimmed.map(m => ({ role: m.role, content: m.content })),
        temperature: 0.4,
        stream: useStream,
      }

      const res = await proxyAwareFetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: opts.signal,
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        throw new Error(txt || `Error HTTP ${res.status}`)
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
      let midstreamError: unknown = null

      const consumeLine = (rawLine: string) => {
        const trimmedLine = rawLine.trim()
        if (!trimmedLine.startsWith("data:")) return
        const dataStr = trimmedLine.slice(5).trim()
        if (dataStr === "[DONE]") return
        try {
          const json = JSON.parse(dataStr)
          const delta = json?.choices?.[0]?.delta?.content ?? ""
          if (delta) {
            acc += delta
            opts.onChunk?.(delta)
          }
          if (json?.usage) usage = json.usage
        } catch {}
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""
          for (const line of lines) consumeLine(line)
        }
        if (buffer) consumeLine(buffer)
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") throw err
        midstreamError = err
      } finally {
        try { reader.releaseLock() } catch {}
      }

      if (!acc && midstreamError) throw midstreamError
      return { text: acc.trim(), usage: usage ? { input: usage.prompt_tokens ?? 0, output: usage.completion_tokens ?? 0, total: usage.total_tokens ?? 0 } : undefined }
    },
  }
}
