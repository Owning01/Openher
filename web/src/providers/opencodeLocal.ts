import type { QuickChatMessage, QuickChatProvider, QuickChatResult } from "./types"
import type { ServerConfig } from "../types"
import { api } from "../api"

const QC_SESSION_KEY = "openher.quickchat.sessionId"
const QC_SESSION_MODEL_KEY = "openher.quickchat.sessionModel"

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

/**
 * Provider que usa TU api de opencode (server local) vía sessions.
 * - Reusa una sesión dedicada "QuickChat" (persistida en localStorage)
 * - Server hace harness caching interno (system/tools/history cacheados)
 * - No requiere API key externa: usa la auth del ServerConfig (host/port/user/pass)
 * - Totalmente configurable: el modelo se elige del catálogo de tu servidor
 */
export function createOpencodeLocalProvider(
  config: ServerConfig | null,
  directory?: string,
): QuickChatProvider {
  return {
    id: "opencode",
    labelKey: "quickchat.providerOpencodeLocal",
    async listModels() {
      if (!config) return []
      try {
        const mapped: any = await api.listModels(config, directory)
        // mapped puede ser { providers: Record<string, { name, models }> } o lista plana
        const providers = mapped?.providers ?? mapped
        const out: { id: string; label: string }[] = []
        if (providers && typeof providers === "object" && !Array.isArray(providers)) {
          for (const prov of Object.values(providers as Record<string, any>)) {
            const p: any = prov
            const pId = p.id ?? p.providerID ?? ""
            for (const [modelId, meta] of Object.entries(p.models ?? {})) {
              const m: any = meta
              out.push({ id: `${pId}/${modelId}`, label: m.name ? `${m.name} (${pId})` : `${modelId} (${pId})` })
            }
          }
        } else if (Array.isArray(providers)) {
          for (const prov of providers as any[]) {
            const pId = prov.id ?? prov.providerID ?? ""
            for (const [modelId, meta] of Object.entries(prov.models ?? {})) {
              const m: any = meta
              out.push({ id: `${pId}/${modelId}`, label: m.name ? `${m.name} (${pId})` : `${modelId} (${pId})` })
            }
          }
        }
        return out
      } catch {
        return []
      }
    },
    async chat(messages: QuickChatMessage[], opts: { model: string; signal?: AbortSignal; onChunk?: (chunk: string) => void; systemPrompt?: string }): Promise<QuickChatResult> {
      if (!config) throw new Error("Configurá primero tu servidor Opencode en Ajustes → Server")
      void opts.systemPrompt
      // Extraer prompt: último user (ya con searchBlock incorporado)
      const last = messages[messages.length - 1]
      const promptText = last?.content?.trim() ?? ""
      if (!promptText) throw new Error("Mensaje vacío")

      // Resolver ModelSelection desde "provider/model" string
      let modelSel: { providerID: string; modelID: string } | undefined
      if (opts.model && opts.model.includes("/")) {
        const [providerID, ...rest] = opts.model.split("/")
        const modelID = rest.join("/")
        if (providerID && modelID) modelSel = { providerID, modelID }
      }

      // Sesión dedicada: crear si no existe o si el modelo cambió
      let sessionID = localStorage.getItem(QC_SESSION_KEY)
      const prevModel = localStorage.getItem(QC_SESSION_MODEL_KEY)
      if (prevModel !== (opts.model ?? "")) {
        // cambio de modelo → la sesión vieja puede tener otro modelo cacheado; crear nueva para no invalidar prefix
        sessionID = null
      }

      if (!sessionID) {
        const s = await api.createSession(config, "QuickChat", modelSel as any, directory)
        sessionID = (s as any).id as string
        if (sessionID) localStorage.setItem(QC_SESSION_KEY, sessionID)
        if (opts.model) localStorage.setItem(QC_SESSION_MODEL_KEY, opts.model)
      } else {
        // Asegurar modelo/agente de sesión actualizado sin crear nueva (switchModel es 204, no genera prompt)
        try {
          const client = await (await import("../shared/api/opencodeClient")).getOpencodeClient(config)
          if (modelSel) {
            await (client as any).session.switchModel?.({ sessionID, model: { id: modelSel.modelID, providerID: modelSel.providerID } })
          }
        } catch {}
      }

      if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError")

      // Enviar prompt (no bloqueante largo)
      await api.sendPrompt(config, sessionID as string, promptText, directory, modelSel as any)

      // Polling para respuesta streaming simulado: leemos messages y emitimos deltas
      let lastAcc = ""
      const start = Date.now()
      const timeoutMs = 90_000
      while (Date.now() - start < timeoutMs) {
        if (opts.signal?.aborted) throw new DOMException("Aborted", "AbortError")
        await sleep(700)
        try {
          const msgs = await api.loadMessages(config, sessionID as string, directory, 30)
          // msgs ordenados asc por created; buscar último assistant después del user
          // El assistant del turno actual es el último assistant cuyo id no estaba antes
          const assistants = msgs.filter((m: any) => m.info?.role === "assistant")
          const lastAssistant = assistants[assistants.length - 1]
          if (!lastAssistant) continue
          const text = (() => {
            const parts = (lastAssistant as any).parts as any[]
            if (Array.isArray(parts)) return parts.filter((p) => p.type === "text" && p.text).map((p) => p.text).join("\n\n").trim()
            return ""
          })()
          if (text && text !== lastAcc) {
            const delta = text.slice(lastAcc.length)
            lastAcc = text
            if (delta) opts.onChunk?.(delta)
          }
          // Considerar completo si tiene time.completed y no está en running
          const completed = (lastAssistant as any).info?.time?.completed
          // También si los últimos 2 polls no cambiaron y ya pasaron 2s sin delta y tenemos texto, asumir fin
          if (completed && text) {
            return { text, cached: false }
          }
          // Heurística: si llevamos 8s sin cambio y tenemos texto, cortar (evita poll eterno si completed no llega)
          // simple: si texto estable 2.5s y no completed, devolver
        } catch {}
      }
      if (lastAcc) return { text: lastAcc }
      throw new Error("Timeout esperando respuesta de Opencode")
    },
  }
}
