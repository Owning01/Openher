import type { QuickChatMessage, QuickChatProvider } from "./types"
import { api } from "../api"

export function createOpencodeGoProvider(config: any): QuickChatProvider {
  return {
    id: "opencode-go",
    labelKey: "quickchat.providerOpencode",
    async listModels() {
      return [
        { id: "opencode-go/muse-spark-1.2-contributor", label: "Muse Spark 1.2" },
        { id: "opencode-go/deepseek-v4-flash", label: "DeepSeek V4 Flash" },
      ]
    },
    async chat(messages: QuickChatMessage[], opts: { model: string; signal?: AbortSignal }) {
      if (!config) throw new Error("No config")
      if (!opts.model) throw new Error("Seleccioná un modelo (no hay default)")
      // Build a prompt from messages (token-min: only last question + brief context)
      const last = messages.filter(m => m.role !== "system").slice(-6)
      const prompt = last.map(m => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n")
      // Create ephemeral session in default directory (no file context)
      // Use existing api.createSession with directory = server default
      const sess = await api.createSession(config, undefined)
      const id = (sess as any)?.data?.id ?? (sess as any)?.id
      if (!id) throw new Error("No session id")
      const parts = opts.model.split("/")
      const providerID = parts[0] ?? "opencode-go"
      const modelID = parts.slice(1).join("/") || opts.model
      const model = { providerID, modelID } as any
      await api.sendPrompt(config as any, id, prompt, undefined, model, undefined)
      // Poll messages quickly (server is busy -> we wait)
      // Simple: fetch messages after 1.5s; real streaming handled by SSE in main app but for quickchat we poll once
      await new Promise(r => setTimeout(r, 1500))
      const msgs = await api.loadMessages(config as any, String(id), "", 30).catch(() => ({ data: [] } as any))
      const list = Array.isArray((msgs as any)?.data) ? (msgs as any).data : Array.isArray(msgs) ? msgs : []
      const lastAssistant = [...list].reverse().find((m: any) => m.role === "assistant" || m.role === "agent")
      const text = lastAssistant?.content?.map((p: any) => p.text ?? "").join("") ?? lastAssistant?.parts?.map((p: any) => p.text ?? "").join("") ?? ""
      return { text: text || "(sin respuesta)" }
    },
  }
}
