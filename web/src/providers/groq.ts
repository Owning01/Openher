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

// Groq OpenAI-compatible. Ultra-low latency, native streaming.
// Docs: https://console.groq.com/docs/quickstart — baseURL https://api.groq.com/openai/v1
const GROQ_DEFAULT_BASE = "https://api.groq.com/openai/v1"

const MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
  { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
  { id: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 Distill 70B (Groq)" },
  { id: "qwen-2.5-32b", label: "Qwen 2.5 32B" },
  { id: "qwen/qwen3-32b", label: "Qwen3 32B (qwen3.6-27b)" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
]

const recentRequests: number[] = []
function checkRateLimit(): string | null {
  const now = Date.now()
  while (recentRequests.length && now - recentRequests[0] > 60000) recentRequests.shift()
  if (recentRequests.length >= 12) return "Rate limit Groq — esperá unos segundos."
  return null
}
function recordRequest() { recentRequests.push(Date.now()) }
function estimateTokens(text: string): number { return Math.ceil(text.length / 4) }

export function createGroqProvider(apiKey: string, baseUrl?: string): QuickChatProvider {
  const BASE_URL = baseUrl ? baseUrl.replace(/\/chat\/completions\/?$/, "") : GROQ_DEFAULT_BASE
  const GROQ_URL = `${BASE_URL}/chat/completions`
  return {
    id: "groq",
    labelKey: "quickchat.providerGroq",
    async listModels() {
      if (apiKey) {
        try {
          const res = await proxyAwareFetch(`${BASE_URL}/models`, {
            headers: { Authorization: `Bearer ${apiKey}` },
          })
          if (res.ok) {
            const data = await res.json() as any
            const list: Array<{ id: string }> = data?.data || []
            if (Array.isArray(list) && list.length > 0) {
              const active = list
                .filter(m => m.id && !m.id.includes("whisper") && !m.id.includes("tts") && !m.id.includes("guard"))
                .map(m => {
                  const matched = MODELS.find(known => known.id === m.id)
                  return { id: m.id, label: matched?.label || m.id }
                })
              if (active.length > 0) return active
            }
          }
        } catch {
          // fallback to static MODELS
        }
      }
      return MODELS
    },
    async chat(messages: QuickChatMessage[], opts: { model: string; signal?: AbortSignal; onChunk?: (chunk: string) => void }): Promise<QuickChatResult> {
      if (!apiKey) throw new Error("NO_KEY_GROQ")
      const rl = checkRateLimit()
      if (rl) throw new Error(rl)
      const sys: QuickChatMessage = { role: "system", content: "Sos asistente breve y directo. Respondé conciso, sin rodeos. Máximo 12 líneas." }
      const trimmed = [sys, ...messages.slice(-8)]
      let totalEst = trimmed.reduce((a, m) => a + estimateTokens(m.content), 0) + 500
      if (totalEst > 6000) trimmed.splice(1, Math.max(1, trimmed.length - 6))
      recordRequest()

      const model = opts.model || MODELS[0].id
      // If caller wants streaming (QuickChat does), use stream:true
      const useStream = typeof opts.onChunk === "function"

      const body: any = {
        model,
        messages: trimmed.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 500,
        temperature: 0.3,
        stream: useStream,
      }

      const res = await proxyAwareFetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(body),
        signal: opts.signal,
      })

      if (!res.ok) {
        const txt = await res.text().catch(() => "")
        if (res.status === 429) throw new Error("Rate limit Groq — esperá unos segundos.")
        throw new Error(txt || `Groq ${res.status}`)
      }

      if (!useStream || !res.body) {
        const data = await res.json() as any
        const text = data?.choices?.[0]?.message?.content ?? ""
        const usage = data?.usage ? { input: data.usage.prompt_tokens ?? 0, output: data.usage.completion_tokens ?? 0, total: data.usage.total_tokens ?? 0 } : undefined
        return { text: String(text).trim(), usage }
      }

      // Streaming path — parse SSE
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
          // Groq may send x_groq usage at end
          if (json?.x_groq?.usage) usage = json.x_groq.usage
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
        // Corte a mitad de línea (socket muerto sin \n final): recuperar el
        // resto que quedó en el buffer en vez de descartarlo.
        if (buffer) consumeLine(buffer)
        buffer = ""
      } catch (err) {
        // Red cortada a mitad del stream (típico móvil): conservar lo acumulado
        // como parcial en vez de tirar todo. El abort del usuario SÍ se relanza.
        if (err instanceof Error && err.name === "AbortError") throw err
        midstreamError = err
      } finally {
        try { reader.releaseLock() } catch {}
      }
      // Si no llegó NADA y además hubo error de red, el fallo es honesto;
      // con texto parcial recibido, devolverlo vale más que un throw.
      if (!acc && midstreamError) throw midstreamError
      return { text: acc.trim(), usage: usage ? { input: usage.prompt_tokens ?? 0, output: usage.completion_tokens ?? 0, total: usage.total_tokens ?? 0 } : undefined }
    },
  }
}

export const GROQ_MODELS = MODELS
